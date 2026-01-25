import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { generateLabelPdfVector } from '../utils/pdfGeneratorVector';
import { addCustomer } from '../utils/googleSheets';
import { Icons } from './Icons';
import { List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';


// Row Component for Virtualized List
const Row = ({ data, index, style }) => {
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
    const [inputText, setInputText] = useState('');
    const [inputMode, setInputMode] = useState('auto'); // 'auto', 'excel', 'csv'
    const [items, setItems] = useState([]);
    const [step, setStep] = useState('input'); // input, review, processing
    const [isProcessing, setIsProcessing] = useState(false);
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

            return {
                id: idx,
                name,
                city,
                branch,
                existingId: existing ? existing.id : null,
                status: existing ? 'ready' : 'new', // ready, new, done, error
                finalId: existing ? (existing.kode || existing.id) : null,
                message: existing ? 'Found existing ID' : 'Will create new ID'
            };
        }).filter(Boolean);

        setItems(parsed);
        setStep('review');
    };

    // 2. Register New Customers
    const registerNewCustomers = async () => {
        setIsProcessing(true);
        let newItems = [...items];
        let createdCount = 0;

        for (let i = 0; i < newItems.length; i++) {
            const item = newItems[i];
            if (item.status === 'new') {
                setProgress(`Registering ${item.name}...`);

                // Call API
                const result = await addCustomer({
                    nama: item.name,
                    kota: item.city,
                    cabang: item.branch,
                    sales: 'Batch', // Default sales
                    pabrik: 'Batch',
                    telp: '-'
                });

                if (result.success) {
                    // Determine ID from result
                    // Result data usually contains the full row including generated ID
                    // Check googleSheets.js addCustomer return
                    // It returns { success: true, data: { ...row, id: ... } }

                    const newId = result.data.id;
                    newItems[i] = {
                        ...item,
                        status: 'ready',
                        finalId: newId,
                        message: 'Successfully Registered'
                    };
                    createdCount++;
                } else {
                    newItems[i] = {
                        ...item,
                        status: 'error',
                        message: `Failed: ${result.error}`
                    };
                }
                // Update UI incrementally
                setItems([...newItems]);
            }
        }

        setProgress(`Done. Created ${createdCount} new IDs.`);
        setIsProcessing(false);

        // Sync app data to refresh cache
        if (createdCount > 0 && onSync) {
            onSync(true);
        }
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
                    // Allow both 'ready' (existing) and 'new' (no ID)
                    // User requested to rely on Name+Branch uniqueness and bypass ID generation for now.

                    const labelData = {
                        nt: item.name,
                        at: item.city,
                        ws: item.branch,
                        it: item.finalId || '', // Use empty string if no ID
                        pt: '',
                        raw: item.finalId || JSON.stringify({
                            nt: item.name, at: item.city, ws: item.branch
                        }) // Fallback QR content
                    };

                    const doc = await generateLabelPdfVector(labelData, { width: 50, height: 30 });
                    const pdfBlob = doc.output('blob');

                    const safeName = item.name.replace(/[^a-z0-9]/gi, '_');
                    const safeCity = item.city.replace(/[^a-z0-9]/gi, '_');

                    // Filename: Name_City_ID(or 'New').pdf
                    const idPart = item.finalId ? item.finalId : 'New';
                    const filename = `${safeName}_${safeCity}_${idPart}.pdf`;

                    zip.file(filename, pdfBlob);
                    count++;
                } catch (error) {
                    console.error(`Failed to generate PDF for ${item.name}:`, error);
                    // Continue with next item
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

    return (
        <div className="modal-overlay" onClick={!isProcessing ? onClose : undefined}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: '800px', maxWidth: '95vw', height: '80vh', display: 'flex', flexDirection: 'column' }}>
                <div className="modal-header">
                    <h2>Batch ID Generator</h2>
                    <button className="close-btn" onClick={onClose}><Icons.X size={20} /></button>
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
                                        // Logic for UI Feedback
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

                                    <span style={{ marginLeft: 'auto', fontSize: 11, fontStyle: 'italic' }}>
                                        {/* Dynamic Hint */}
                                        {inputMode === 'auto' && !inputText.includes('\t') && !inputText.includes(',') && !inputText.includes(';') && "Processing line by line (1 column)"}
                                        {inputText.includes('\t') && "Safe for commas inside names"}
                                    </span>
                                </div>
                            )}
                        </>
                    )}

                    {step === 'review' && (
                        <div style={{ flex: 1, border: '1px solid #ddd', display: 'flex', flexDirection: 'column' }}>
                            {/* Header */}
                            <div style={{ display: 'flex', background: '#f5f5f5', borderBottom: '1px solid #ddd', paddingRight: 10 }}>
                                <div style={{ flex: 1.5, padding: 8, fontWeight: 'bold' }}>Name</div>
                                <div style={{ flex: 1, padding: 8, fontWeight: 'bold' }}>City</div>
                                <div style={{ flex: 1, padding: 8, fontWeight: 'bold' }}>Branch</div>
                                <div style={{ width: 80, padding: 8, fontWeight: 'bold' }}>Status</div>
                                <div style={{ width: 80, padding: 8, fontWeight: 'bold' }}>ID</div>
                            </div>

                            {/* Virtualized List */}
                            <div style={{ flex: 1 }}>
                                <AutoSizer>
                                    {({ height, width }) => (
                                        <List
                                            height={height || 300}
                                            width={width || 500}
                                            itemCount={items?.length || 0}
                                            itemSize={45}
                                            itemData={items || []}
                                        >
                                            {Row}
                                        </List>
                                    )}
                                </AutoSizer>
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

                            {/* Hiding Auto-Register Button per user request */}
                            {/* {items.some(i => i.status === 'new') && (
                                <button
                                    className="primary-btn"
                                    style={{ background: '#f97316' }}
                                    onClick={registerNewCustomers}
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? 'Processing ' : 'Auto-Register New IDs'}
                                </button>
                            )} */}

                            <button
                                className="primary-btn"
                                onClick={generateZip}
                                disabled={isProcessing}
                            >
                                Download ZIP
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
