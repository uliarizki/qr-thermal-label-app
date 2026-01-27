import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { generateLabelPdfVector } from '../utils/pdfGeneratorVector';
import { renderLabelToCanvas, canvasToRaster } from '../utils/printHelpers'; // New Import
import { addCustomer } from '../utils/googleSheets';
import { Icons } from './Icons';

import { usePrinter } from '../context/PrinterContext'; // New Import
import html2canvas from 'html2canvas';
import DigitalCard from './DigitalCard';


// Row Component for Virtualized List
const Row = ({ data, index, style }) => {
    // console.log('Row Render:', index, data?.length, style); // Debug
    const item = data[index];
    if (!item) return null;
    return (
        <div style={{
            ...style,
            display: 'flex',
            borderBottom: '1px solid #eee',
            alignItems: 'center',
            background: index % 2 ? '#fafafa' : 'white'
        }}>
            <div style={{ flex: 1.5, padding: '0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
            <div style={{ flex: 1, padding: '0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.city}</div>
            <div style={{ flex: 1, padding: '0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.branch}</div>
            <div style={{ width: 80, padding: '0 8px' }}>
                <span style={{
                    padding: '2px 6px', borderRadius: 4,
                    fontSize: 11,
                    background: item.status === 'ready' ? '#d1fae5' : '#ffedd5',
                    color: item.status === 'ready' ? '#065f46' : '#9a3412'
                }}>
                    {item.status.toUpperCase()}
                </span>
            </div>
            <div style={{ width: 80, padding: '0 8px', fontSize: 12 }}>{item.finalId || <i>-</i>}</div>
        </div>
    );
};

export default function BatchGeneratorModal({ customers, onClose, onSync }) {
    const { isConnected, connect, print, isPrinting } = usePrinter(); // Printer Context
    const [inputText, setInputText] = useState('');
    const [inputMode, setInputMode] = useState('auto'); // 'auto', 'excel', 'csv'
    const [items, setItems] = useState([]);
    const [step, setStep] = useState('input'); // input, review, processing
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'gallery' (Catalog)
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingItem, setProcessingItem] = useState(null); // For ID Card Generation
    const [shareTarget, setShareTarget] = useState(null); // For single share
    const cardRef = React.useRef(null);
    const [progress, setProgress] = useState('');

    // Handle Esc Key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && !isProcessing) onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose, isProcessing]);

    // 1. Parse Input
    const parseInput = () => {
        if (!inputText.trim()) return;

        // Auto-detect format based on first few lines
        const lines = inputText.split(/\r?\n/);
        const parsed = lines.map((line, idx) => {
            let parts;

            // Logic Selection
            if (inputMode === 'excel') {
                // Force Excel (Tab only)
                parts = line.split('\t').map(s => s.trim());
            } else if (inputMode === 'csv') {
                // Force CSV (Comma/Semi)
                parts = line.split(/[,;]/).map(s => s.trim());
            } else {
                // Auto Detect (Default)
                const hasTab = line.includes('\t');
                parts = hasTab
                    ? line.split('\t').map(s => s.trim())
                    : line.split(/[,;|]/).map(s => s.trim());
            }

            // Support Flexible Formats:
            // 1. Name only
            // 2. Name, City
            // 3. Name, City, Branch

            if (parts.length === 0 || !parts[0]) return null;

            const name = parts[0];
            const city = parts[1] || '-';
            const branch = parts[2] || '-';

            // Check existence
            // Match by Name only if City/Branch are default
            const existing = customers?.find(c => {
                if (!c?.nama) return false;
                const nameMatch = c.nama.toLowerCase() === name.toLowerCase();
                const cityMatch = (c.kota || '').toLowerCase() === city.toLowerCase();

                // Strict match if city provided, loose if not
                if (city !== '-' && branch !== '-') {
                    return nameMatch && cityMatch && (c.cabang || '').toLowerCase() === branch.toLowerCase();
                }
                return nameMatch;
            });

            let finalId = null;
            if (existing) {
                let raw = existing.kode || existing.id;
                // Fix: Extract ID if it is a JSON string (common data corruption issue)
                if (raw && typeof raw === 'string' && raw.trim().startsWith('{')) {
                    try {
                        const parsedJson = JSON.parse(raw);
                        raw = parsedJson.it || parsedJson.id || raw;
                    } catch (e) {
                        // Keep raw if parse fails
                    }
                }
                finalId = raw;
            }

            return {
                id: idx,
                name,
                city: (city === '-' && existing?.kota) ? existing.kota : city,
                branch: (branch === '-' && (existing?.cabang || existing?.pabrik)) ? (existing.cabang || existing.pabrik) : branch,
                existingId: existing ? existing.id : null,
                status: existing ? 'ready' : 'new', // ready, new, done, error
                finalId,
                message: existing ? 'Found existing ID' : 'Will create new ID'
            };
        }).filter(Boolean);

        const validItems = parsed.filter(Boolean);
        console.log('Parsed Items:', validItems);

        if (validItems.length === 0) {
            alert("No valid data found! Please check your input format.");
            return;
        }

        setItems(validItems);
        setStep('review');
    };

    // 2. Register New Customers
    const registerNewCustomers = async () => {
        /* ... (Keep existing logic if needed, or hide) ... */
    };

    // 3. Generate ZIP (Updated: Allow missing IDs)
    const generateZip = async () => {
        setIsProcessing(true);
        setProgress('Generating PDFs...');

        try {
            const zip = new JSZip();
            let count = 0;

            for (const item of items) {
                try {
                    const rawId = item.finalId || '';
                    const safeId = (rawId.startsWith('{') || rawId.length > 20) ? '' : rawId;

                    const labelData = {
                        nt: item.name,
                        at: item.city,
                        ws: item.branch,
                        it: safeId,
                        pt: '',
                        raw: item.finalId || JSON.stringify({
                            nt: item.name, at: item.city, ws: item.branch
                        })
                    };

                    const result = await generateLabelPdfVector(labelData, { width: 50, height: 30, returnBlob: true });
                    const pdfBlob = result.blob;

                    const safeName = item.name.replace(/[^a-z0-9]/gi, '_');
                    const safeCity = item.city.replace(/[^a-z0-9]/gi, '_');
                    const idPart = safeId || 'New'; // Use safeId
                    const filename = `${safeName}_${safeCity}_${idPart}.pdf`;

                    zip.file(filename, pdfBlob);
                    count++;
                } catch (error) {
                    console.error(`Failed to generate PDF for ${item.name}:`, error);
                }
            }

            setProgress('Compressing...');
            const content = await zip.generateAsync({ type: 'blob' });
            saveAs(content, `Batch_Labels_${new Date().getTime()}.zip`);

            setProgress(`Downloaded ${count} files.`);
        } catch (e) {
            console.error(e);
            setProgress('Error generating ZIP: ' + e.message);
        } finally {
            setIsProcessing(false);
        }
    };

    // 4. Generate ID Card Images ZIP
    const generateIdZip = async () => {
        setIsProcessing(true);
        // setProgress('Preparing ID Cards...');

        try {
            const zip = new JSZip();
            let count = 0;

            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                setProgress(`Rendering ${i + 1}/${items.length}: ${item.name}`);

                // Render the card
                setProcessingItem(item);

                // Wait for React to render and images to load
                await new Promise(resolve => setTimeout(resolve, 500));

                if (cardRef.current) {
                    try {
                        const canvas = await html2canvas(cardRef.current, {
                            scale: 2, // High resolution
                            useCORS: true,
                            backgroundColor: null
                        });

                        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));

                        const safeName = item.name.replace(/[^a-z0-9]/gi, '_');
                        const safeCity = item.city.replace(/[^a-z0-9]/gi, '_');
                        // Use item.finalId but sanitize
                        const rawId = item.finalId || '';
                        const safeId = (rawId.startsWith('{') || rawId.length > 20) ? 'ID' : rawId;

                        const filename = `${safeName}_${safeCity}_${safeId || 'ID'}.jpg`;
                        zip.file(filename, blob);
                        count++;
                    } catch (err) {
                        console.error(`Failed to capture card for ${item.name}`, err);
                    }
                }
            }

            setProcessingItem(null); // Cleanup

            setProgress('Compressing Images...');
            const content = await zip.generateAsync({ type: 'blob' });
            saveAs(content, `Batch_DigitalIDs_${new Date().getTime()}.zip`);

            setProgress(`Downloaded ${count} ID Cards.`);

        } catch (e) {
            console.error(e);
            setProgress('Error generating ID ZIP: ' + e.message);
        } finally {
            setIsProcessing(false);
            setProcessingItem(null);
        }
    };

    // 5. SHARE SINGLE CARD (Mobile/Desktop Web Share)
    const shareSingleCard = async (item) => {
        setIsProcessing(true);
        setShareTarget(item.id || item.name); // Track who we are sharing
        setProgress(`Preparing share for ${item.name}...`);

        try {
            // 1. Setup Render
            setProcessingItem(item);
            // 2. Wait for Render
            await new Promise(resolve => setTimeout(resolve, 500));

            if (cardRef.current) {
                const canvas = await html2canvas(cardRef.current, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: null
                });

                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
                const file = new File([blob], `ID_${item.name}.jpg`, { type: 'image/jpeg' });

                // 3. Trigger Share
                if (navigator.share) {
                    await navigator.share({
                        title: `ID Card - ${item.name}`,
                        text: `Digital ID Card for ${item.name}`,
                        files: [file]
                    });
                    setProgress(`Shared ${item.name} successfully!`);
                } else {
                    // Fallback for Desktop (Download)
                    saveAs(blob, `ID_${item.name}.jpg`);
                    setProgress(`Web Share not supported. Downloaded ${item.name} instead.`);
                }
            }
        } catch (e) {
            console.error("Share failed:", e);
            alert("Failed to share: " + e.message);
        } finally {
            setIsProcessing(false);
            setProcessingItem(null);
            setShareTarget(null);
        }
    };

    // 6. PRINT BATCH DIRECTLY
    const printBatch = async () => {
        if (!isConnected) {
            alert("Please connect a printer first!");
            connect();
            return;
        }

        setIsProcessing(true);
        setProgress('Preparing to print...');

        // Print parameters
        // Add minimal delay between prints to prevent buffer overflow (especially Bluetooth)
        const DELAY_MS = 500;

        try {
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                setProgress(`Printing ${i + 1}/${items.length}: ${item.name}...`);

                const rawId = item.finalId || '';
                // Sanitize ID: If it looks like JSON or is too long, ignore it for the text label
                const safeId = (rawId.startsWith('{') || rawId.length > 20) ? '' : rawId;

                const labelData = {
                    nt: item.name,
                    at: item.city,
                    ws: item.branch,
                    it: safeId,
                    pt: '',
                    raw: item.finalId || JSON.stringify({
                        nt: item.name, at: item.city, ws: item.branch
                    })
                };

                // 1. Render to Canvas
                const canvas = await renderLabelToCanvas(labelData, { width: 50, height: 30 });

                // 2. Convert to Raster (Bytes)
                const rasterData = canvasToRaster(canvas);

                // 3. Send to Printer
                await print(rasterData);

                // 4. Buffer Delay
                if (i < items.length - 1) {
                    await new Promise(r => setTimeout(r, DELAY_MS));
                }
            }

            setProgress('Printing Complete!');
            setTimeout(() => setProgress(''), 2000);

        } catch (e) {
            console.error(e);
            setProgress('Print Error: ' + e.message);
        } finally {
            setIsProcessing(false);
        }
    };





    return (
        <div className="modal-overlay" onClick={!isProcessing ? onClose : undefined}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: '800px', maxWidth: '95vw', height: '80vh', display: 'flex', flexDirection: 'column' }}>
                <div className="modal-header">
                    <h2>Batch ID Generator</h2>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
                        {/* Printer Status Badge */}
                        <div onClick={connect} style={{
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: 4,
                            fontSize: 12,
                            background: isConnected ? '#dcfce7' : '#fee2e2',
                            color: isConnected ? '#166534' : '#991b1b',
                            display: 'flex', alignItems: 'center', gap: 5,
                            border: '1px solid',
                            borderColor: isConnected ? '#bbf7d0' : '#fecaca'
                        }}>
                            {isConnected ? <Icons.Print size={14} /> : <Icons.AlertTriangle size={14} />}
                            {isConnected ? 'Printer Ready' : 'Connect Printer'}
                        </div>
                        <button className="close-btn" onClick={onClose}><Icons.X size={20} /></button>
                    </div>
                </div>

                <div className="modal-body" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 20 }}>
                    {step === 'input' && (
                        <>
                            <div style={{ marginBottom: 15, display: 'flex', gap: 15, alignItems: 'center' }}>
                                <span style={{ fontWeight: 'bold' }}>Mode:</span>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
                                    <input type="radio" checked={inputMode === 'auto'} onChange={() => setInputMode('auto')} />
                                    🤖 Auto
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
                                    <input type="radio" checked={inputMode === 'excel'} onChange={() => setInputMode('excel')} />
                                    📊 Excel (Tab)
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
                                    <input type="radio" checked={inputMode === 'csv'} onChange={() => setInputMode('csv')} />
                                    📝 Manual (Comma)
                                </label>
                            </div>

                            <p style={{ marginBottom: 10 }}>Paste data. Format: <b>Name</b> (Min) or <b>Name, City, Branch</b></p>
                            <textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder={"Budi Santoso, Tegal, Pasar Pagi\nSiti Aminah, Brebes, Ketanggungan"}
                                style={{ flex: 1, width: '100%', padding: 10, fontFamily: 'monospace' }}
                            />
                            {inputText.trim() && (
                                <div style={{ fontSize: 12, marginTop: 5, color: '#666', display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <span>Format Detected:</span>
                                    {(() => {
                                        let detected = 'list';
                                        if (inputMode === 'excel') detected = 'excel';
                                        else if (inputMode === 'csv') detected = 'csv';
                                        else if (inputText.includes('\t')) detected = 'excel';
                                        else if (inputText.includes(',') || inputText.includes(';')) detected = 'csv';

                                        if (detected === 'excel') return (
                                            <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: 4, fontWeight: 'bold' }}>
                                                📊 Excel / Spreadsheet (Tab)
                                            </span>
                                        );
                                        if (detected === 'csv') return (
                                            <span style={{ background: '#fef9c3', color: '#854d0e', padding: '2px 6px', borderRadius: 4, fontWeight: 'bold' }}>
                                                📝 CSV (Comma/Semi)
                                            </span>
                                        );
                                        return (
                                            <span style={{ background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: 4, fontWeight: 'bold' }}>
                                                📄 Single List (Names Only)
                                            </span>
                                        );
                                    })()}
                                </div>
                            )}
                        </>
                    )}

                    {step === 'review' && (
                        <div className="review-step" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                                <h3>Review List ({items.length})</h3>
                                <div className="toggle-view" style={{ display: 'flex', background: '#f1f5f9', padding: 4, borderRadius: 8 }}>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        style={{
                                            padding: '6px 12px', border: 'none', borderRadius: 6, cursor: 'pointer',
                                            background: viewMode === 'list' ? 'white' : 'transparent',
                                            boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                            fontWeight: viewMode === 'list' ? 600 : 400
                                        }}
                                    >List</button>
                                    <button
                                        onClick={() => setViewMode('gallery')}
                                        style={{
                                            padding: '6px 12px', border: 'none', borderRadius: 6, cursor: 'pointer',
                                            background: viewMode === 'gallery' ? 'white' : 'transparent',
                                            boxShadow: viewMode === 'gallery' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                            fontWeight: viewMode === 'gallery' ? 600 : 400
                                        }}
                                    >Catalog</button>
                                </div>
                            </div>

                            <div className="list-container" style={{ flex: 1, overflowY: 'auto', border: '1px solid #eee', borderRadius: 8 }}>
                                {items.length === 0 ? (
                                    <div style={{ padding: 20, textAlign: 'center', color: '#888' }}>No items to display</div>
                                ) : viewMode === 'list' ? (
                                    /* LIST VIEW */
                                    <div style={{ width: '100%' }}>
                                        {/* Header */}
                                        <div style={{ display: 'flex', fontWeight: 'bold', padding: '10px 8px', borderBottom: '2px solid #ddd', background: '#f8f9fa', position: 'sticky', top: 0, zIndex: 10 }}>
                                            <div style={{ flex: 1.5 }}>Name</div>
                                            <div style={{ flex: 1 }}>City</div>
                                            <div style={{ flex: 1 }}>Branch</div>
                                            <div style={{ width: 80 }}>Status</div>
                                            <div style={{ width: 80 }}>ID</div>
                                        </div>

                                        {items.map((item, index) => (
                                            <div key={index} style={{
                                                display: 'flex',
                                                borderBottom: '1px solid #eee',
                                                alignItems: 'center',
                                                padding: '8px 0',
                                                background: index % 2 ? '#fafafa' : 'white'
                                            }}>
                                                <div style={{ flex: 1.5, padding: '0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                                                <div style={{ flex: 1, padding: '0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.city}</div>
                                                <div style={{ flex: 1, padding: '0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.branch}</div>
                                                <div style={{ width: 80, padding: '0 8px' }}>
                                                    <span style={{
                                                        padding: '2px 6px', borderRadius: 4,
                                                        fontSize: 11,
                                                        background: item.status === 'ready' ? '#d1fae5' : '#ffedd5',
                                                        color: item.status === 'ready' ? '#065f46' : '#9a3412'
                                                    }}>
                                                        {item.status.toUpperCase()}
                                                    </span>
                                                </div>
                                                <div style={{ width: 80, padding: '0 8px', fontSize: 12 }}>{item.finalId || <i>-</i>}</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    /* GALLERY / CATALOG VIEW */
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, padding: 20, justifyContent: 'center', background: '#f8f9fa', minHeight: '100%' }}>
                                        {items.map((item, index) => (
                                            <div key={index} style={{
                                                width: 240,
                                                background: 'white',
                                                borderRadius: 12,
                                                overflow: 'hidden',
                                                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                                                display: 'flex', flexDirection: 'column'
                                            }}>
                                                {/* Card Preview (Visual Fake) - Scaled Down */}
                                                <div style={{
                                                    height: 140,
                                                    background: '#1e293b',
                                                    position: 'relative',
                                                    overflow: 'hidden'
                                                }}>
                                                    <div style={{ transform: 'scale(0.48) translate(-52%, -52%)', transformOrigin: 'top left', position: 'absolute', top: '50%', left: '50%', width: 500, height: 300, pointerEvents: 'none' }}>
                                                        <DigitalCard
                                                            customer={{
                                                                nama: item.name,
                                                                kota: item.city,
                                                                cabang: item.branch === '-' ? '' : item.branch,
                                                                id: (item.finalId && !item.finalId.startsWith('{')) ? item.finalId : 'N/A'
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div style={{ padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eee' }}>
                                                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#333', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '60%' }}>
                                                        {item.name}
                                                    </div>
                                                    <button
                                                        className="primary-btn"
                                                        onClick={() => shareSingleCard(item)}
                                                        disabled={isProcessing}
                                                        style={{
                                                            fontSize: '0.8rem', padding: '6px 12px',
                                                            background: shareTarget === (item.id || item.name) ? '#9333ea' : '#D4AF37',
                                                            color: '#000', border: 'none'
                                                        }}
                                                    >
                                                        {shareTarget === (item.id || item.name) ? 'Sharing...' : 'Share'}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {progress && <div style={{ marginTop: 10, padding: 10, background: '#f0f9ff', color: '#0369a1' }}>{progress}</div>}
                </div>

                <div className="modal-footer" style={{ borderTop: '1px solid #eee', padding: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    {step === 'input' ? (
                        <button className="primary-btn" onClick={parseInput}>Review Data</button>
                    ) : (
                        <>
                            <button className="secondary-btn" onClick={() => setStep('input')} disabled={isProcessing}>Back</button>

                            {/* Print Button */}
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button className="secondary-btn" onClick={generateZip} disabled={isProcessing} title="Internal Label PDF">
                                    <Icons.Download size={16} /> PDF Labels
                                </button>

                                <button className="primary-btn" onClick={generateIdZip} disabled={isProcessing} style={{ background: '#D4AF37', color: '#000', borderColor: '#B5952F' }} title="WhatsApp ID Cards">
                                    <Icons.Download size={16} /> Download ID Cards (ZIP)
                                </button>

                                <button
                                    className="primary-btn"
                                    style={{ background: '#6366f1', display: 'flex', alignItems: 'center', gap: 5 }}
                                    onClick={printBatch}
                                    disabled={isProcessing}
                                >
                                    <Icons.Print size={16} />
                                    {isConnected ? 'Print Direct' : 'Connect & Print'}
                                </button>
                            </div>

                            {/* Hidden Render Area */}
                            <div style={{ position: 'absolute', top: 0, left: -9999, opacity: 0, pointerEvents: 'none' }}>
                                {processingItem && (
                                    <div style={{ width: 500, height: 300 }}>
                                        <DigitalCard
                                            ref={cardRef}
                                            customer={{
                                                nama: processingItem.name,
                                                kota: processingItem.city,
                                                cabang: processingItem.branch === '-' ? '' : processingItem.branch,
                                                id: (processingItem.finalId && !processingItem.finalId.startsWith('{')) ? processingItem.finalId : 'N/A'
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* LOADING OVERLAY */}
            {isProcessing && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(255,255,255,0.9)', zIndex: 9999,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="spinner" style={{ width: 40, height: 40, border: '4px solid #eee', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    <div style={{ marginTop: 20, fontSize: '1.1rem', fontWeight: 600, color: '#333' }}>{progress || 'Processing...'}</div>
                    <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
                </div>
            )}
        </div>
    );
}
