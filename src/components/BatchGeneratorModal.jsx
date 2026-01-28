import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { generateLabelPdfVector } from '../utils/pdfGeneratorVector';
import { renderLabelToCanvas, canvasToRaster } from '../utils/printHelpers';
import { addCustomer } from '../utils/googleSheets';
import { Icons } from './Icons';
import { usePrinter } from '../context/PrinterContext';
import DigitalCard from './DigitalCard';
import { generateCardBlob } from '../utils/cardGenerator';
import './BatchGeneratorModal.css';


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

    // Print Configuration State
    const [printConfig, setPrintConfig] = useState({
        width: 50,      // mm
        height: 30,     // mm
        gapFeed: true,  // Send Form Feed (0x0C) after each label
        density: 'high' // Future use
    });

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

            // Build the kode field - must be JSON format for QR standard
            let kodeValue = null;
            let displayId = null;

            if (existing) {
                // Existing customer: use their kode (which should be JSON) or generate from their data
                if (existing.kode && typeof existing.kode === 'string' && existing.kode.trim().startsWith('{')) {
                    // Already has JSON kode - use as is
                    kodeValue = existing.kode;
                    try {
                        const parsed = JSON.parse(existing.kode);
                        displayId = parsed.it || existing.id;
                    } catch (e) {
                        displayId = existing.id;
                    }
                } else {
                    // Generate JSON from existing customer data
                    displayId = existing.kode || existing.id;
                    kodeValue = JSON.stringify({
                        it: displayId,
                        nt: existing.nama,
                        at: existing.kota || '',
                        pt: existing.sales || '',
                        kp: existing.pabrik || '',
                        ws: existing.cabang || '',
                        np: existing.telp || ''
                    });
                }
            }

            return {
                id: idx,
                name,
                city: (city === '-' && existing?.kota) ? existing.kota : city,
                branch: (branch === '-' && (existing?.cabang || existing?.pabrik)) ? (existing.cabang || existing.pabrik) : branch,
                existingId: existing ? existing.id : null,
                existingCustomer: existing, // Store full reference for more data
                status: existing ? 'ready' : 'new',
                kode: kodeValue, // Full JSON for QR code
                displayId, // Clean ID for display
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
                        const blob = await generateCardBlob(cardRef.current);
                        const safeName = item.name.replace(/[^a-z0-9]/gi, '_');
                        const safeCity = item.city.replace(/[^a-z0-9]/gi, '_');
                        const rawId = item.displayId || '';
                        const safeId = (rawId.startsWith('{') || rawId.length > 20) ? 'ID' : rawId;

                        const filename = `${safeName}_${safeCity}_${safeId || 'ID'}.png`;
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
                const blob = await generateCardBlob(cardRef.current);
                const file = new File([blob], `ID_${item.name}.png`, { type: 'image/png' });

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

                const rawId = item.displayId || '';
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
                const canvas = await renderLabelToCanvas(labelData, {
                    width: printConfig.width,
                    height: printConfig.height
                });

                // 2. Convert to Raster (Bytes)
                const rasterData = canvasToRaster(canvas);

                // 3. Prepare Final Data (Append Form Feed if enabled)
                let finalData = rasterData;
                if (printConfig.gapFeed) {
                    // 0x0C is standard "Next Label" / Form Feed command
                    // Some printers prefer GS V m (Cut) but 0x0C is safer for continuous label roll gaps
                    const feedCmd = new Uint8Array([0x0C]);
                    const combined = new Uint8Array(rasterData.length + feedCmd.length);
                    combined.set(rasterData);
                    combined.set(feedCmd, rasterData.length);
                    finalData = combined;
                }

                // 4. Send to Printer
                await print(finalData);

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
            <div className="modal-content batch-modal" onClick={e => e.stopPropagation()}>
                {/* HEADER */}
                <div className="modal-header">
                    <h2>Batch ID Generator</h2>
                    <div className="header-actions">
                        <div
                            onClick={connect}
                            className={`printer-badge ${isConnected ? 'connected' : 'disconnected'}`}
                        >
                            {isConnected ? <Icons.Print size={14} /> : <Icons.AlertTriangle size={14} />}
                            <span>{isConnected ? 'Printer Ready' : 'Connect'}</span>
                        </div>
                        <button className="close-btn" onClick={onClose}><Icons.X size={20} /></button>
                    </div>
                </div>

                {/* BODY */}
                <div className="modal-body">
                    {/* INPUT STEP */}
                    {step === 'input' && (
                        <div className="input-step">
                            <div className="mode-selector">
                                <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Mode:</span>
                                <label>
                                    <input type="radio" checked={inputMode === 'auto'} onChange={() => setInputMode('auto')} />
                                    🤖 Auto
                                </label>
                                <label>
                                    <input type="radio" checked={inputMode === 'excel'} onChange={() => setInputMode('excel')} />
                                    📊 Excel
                                </label>
                                <label>
                                    <input type="radio" checked={inputMode === 'csv'} onChange={() => setInputMode('csv')} />
                                    📝 CSV
                                </label>
                            </div>

                            <p style={{ marginBottom: 10, fontSize: '0.85rem' }}>
                                Paste data: <b>Name</b> (min) or <b>Name, City, Branch</b>
                            </p>

                            <textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder={"Budi Santoso, Tegal, Pasar Pagi\nSiti Aminah, Brebes, Ketanggungan"}
                            />

                            {inputText.trim() && (
                                <div className="format-detect">
                                    <span>Detected:</span>
                                    {(() => {
                                        let detected = 'list';
                                        if (inputMode === 'excel') detected = 'excel';
                                        else if (inputMode === 'csv') detected = 'csv';
                                        else if (inputText.includes('\t')) detected = 'excel';
                                        else if (inputText.includes(',') || inputText.includes(';')) detected = 'csv';

                                        if (detected === 'excel') return (
                                            <span className="format-badge" style={{ background: '#dcfce7', color: '#166534' }}>
                                                📊 Excel (Tab)
                                            </span>
                                        );
                                        if (detected === 'csv') return (
                                            <span className="format-badge" style={{ background: '#fef9c3', color: '#854d0e' }}>
                                                📝 CSV
                                            </span>
                                        );
                                        return (
                                            <span className="format-badge" style={{ background: '#f1f5f9', color: '#475569' }}>
                                                📄 Single List
                                            </span>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>
                    )}

                    {/* REVIEW STEP */}
                    {step === 'review' && (
                        <div className="review-step">
                            <div className="review-header">
                                <h3>Review ({items.length})</h3>
                                <div className="view-toggle">
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={viewMode === 'list' ? 'active' : ''}
                                    >📋 List</button>
                                    <button
                                        onClick={() => setViewMode('gallery')}
                                        className={viewMode === 'gallery' ? 'active' : ''}
                                    >🖼️ Catalog</button>
                                </div>
                            </div>

                            <div className="list-container">
                                {items.length === 0 ? (
                                    <div style={{ padding: 20, textAlign: 'center', color: '#888' }}>No items</div>
                                ) : viewMode === 'list' ? (
                                    /* LIST VIEW */
                                    <div>
                                        <div className="list-header">
                                            <div>Name</div>
                                            <div>City</div>
                                            <div className="branch-col">Branch</div>
                                            <div>Status</div>
                                        </div>
                                        {items.map((item, index) => (
                                            <div key={index} className="list-row">
                                                <div className="cell">{item.name}</div>
                                                <div className="cell">{item.city}</div>
                                                <div className="cell branch-col">{item.branch}</div>
                                                <div>
                                                    <span className={`status-badge ${item.status === 'ready' ? 'ready' : 'new'}`}>
                                                        {item.status.toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    /* GALLERY VIEW */
                                    <div className="gallery-container">
                                        {items.map((item, index) => (
                                            <div key={index} className="gallery-card">
                                                <div className="card-preview">
                                                    <div className="scaled-card">
                                                        <DigitalCard
                                                            customer={{
                                                                nama: item.name,
                                                                kota: item.city,
                                                                cabang: item.branch === '-' ? '' : item.branch,
                                                                kode: item.kode || item.displayId || 'N/A'
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="card-actions">
                                                    <div className="card-name">{item.name}</div>
                                                    <button
                                                        className={`share-btn ${shareTarget === (item.id || item.name) ? 'sharing' : ''}`}
                                                        onClick={() => shareSingleCard(item)}
                                                        disabled={isProcessing}
                                                    >
                                                        {shareTarget === (item.id || item.name) ? '...' : 'Share'}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {progress && <div className="progress-bar">{progress}</div>}
                </div>

                {/* FOOTER */}
                <div className="modal-footer">
                    {step === 'input' ? (
                        <div className="footer-actions">
                            <button className="action-btn primary" onClick={parseInput}>
                                <span className="icon">📋</span>
                                <span>Review Data</span>
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* PRINT CONFIGURATION PANEL */}
                            <div className="print-config-panel" style={{
                                padding: '10px',
                                background: '#f8fafc',
                                borderTop: '1px solid #e2e8f0',
                                marginBottom: '10px',
                                borderRadius: '6px',
                                display: 'flex',
                                gap: '15px',
                                alignItems: 'center',
                                fontSize: '0.85rem'
                            }}>
                                <div style={{ fontWeight: '600', color: '#475569' }}>⚙️ Print Config:</div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    W (mm):
                                    <input
                                        type="number"
                                        value={printConfig.width}
                                        onChange={e => setPrintConfig({ ...printConfig, width: Number(e.target.value) })}
                                        style={{ width: '50px', padding: '2px 4px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                    />
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    H (mm):
                                    <input
                                        type="number"
                                        value={printConfig.height}
                                        onChange={e => setPrintConfig({ ...printConfig, height: Number(e.target.value) })}
                                        style={{ width: '50px', padding: '2px 4px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                    />
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={printConfig.gapFeed}
                                        onChange={e => setPrintConfig({ ...printConfig, gapFeed: e.target.checked })}
                                    />
                                    Gap Feed (Auto-Align)
                                </label>
                            </div>

                            <div className="footer-actions">
                                <button className="action-btn secondary back-btn" onClick={() => setStep('input')} disabled={isProcessing}>
                                    <Icons.ArrowLeft size={16} />
                                    <span>Back</span>
                                </button>

                                <button className="action-btn secondary" onClick={generateZip} disabled={isProcessing}>
                                    <Icons.Download size={18} />
                                    <span>PDF Labels</span>
                                </button>

                                <button className="action-btn primary" onClick={generateIdZip} disabled={isProcessing}>
                                    <Icons.Download size={18} />
                                    <span>ID Cards (ZIP)</span>
                                </button>

                                <button className="action-btn print" onClick={printBatch} disabled={isProcessing}>
                                    <Icons.Print size={18} />
                                    <span>{isConnected ? 'Print Batch' : 'Connect Printer'}</span>
                                </button>
                            </div>

                            {/* Hidden Render Area for html2canvas */}
                            <div className="hidden-render">
                                {processingItem && (
                                    <div style={{ width: 500, height: 300 }}>
                                        <DigitalCard
                                            ref={cardRef}
                                            customer={{
                                                nama: processingItem.name,
                                                kota: processingItem.city,
                                                cabang: processingItem.branch === '-' ? '' : processingItem.branch,
                                                kode: processingItem.kode || processingItem.displayId || 'N/A'
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* LOADING OVERLAY */}
                {isProcessing && (
                    <div className="loading-overlay">
                        <div className="spinner"></div>
                        <div className="loading-text">{progress || 'Processing...'}</div>
                    </div>
                )}
            </div>
        </div>
    );
}
