import React, { useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { generateLabelPdfVector } from '../utils/pdfGeneratorVector';
import { addCustomer } from '../utils/googleSheets';
import { Icons } from './Icons';

export default function BatchGeneratorModal({ customers, onClose, onSync }) {
    const [inputText, setInputText] = useState('');
    const [items, setItems] = useState([]);
    const [step, setStep] = useState('input'); // input, review, processing
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState('');

    // 1. Parse Input
    const parseInput = () => {
        if (!inputText.trim()) return;

        const lines = inputText.split(/\n/);
        const parsed = lines.map((line, idx) => {
            const parts = line.split(/[\t,;|]/).map(s => s.trim());
            // Expect: Name, City, Branch
            if (parts.length < 3) return null;

            const name = parts[0];
            const city = parts[1];
            const branch = parts[2];

            // Basic validation
            if (!name || !city || !branch) return null;

            // Check existence
            // Match by Name + Branch (case insensitive)
            const existing = customers.find(c =>
                c.nama.toLowerCase() === name.toLowerCase() &&
                c.cabang.toLowerCase() === branch.toLowerCase()
            );

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

                const doc = await generateLabelPdfVector(labelData);
                const pdfBlob = doc.output('blob');

                const safeName = item.name.replace(/[^a-z0-9]/gi, '_');
                const safeCity = item.city.replace(/[^a-z0-9]/gi, '_');

                // Filename: Name_City_ID(or 'New').pdf
                const idPart = item.finalId ? item.finalId : 'New';
                const filename = `${safeName}_${safeCity}_${idPart}.pdf`;

                zip.file(filename, pdfBlob);
                count++;
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
        <div className="modal-overlay">
            <div className="modal-content" style={{ width: '800px', maxWidth: '95vw', height: '80vh', display: 'flex', flexDirection: 'column' }}>
                <div className="modal-header">
                    <h2>Batch ID Generator</h2>
                    <button className="close-btn" onClick={onClose}><Icons.X size={20} /></button>
                </div>

                <div className="modal-body" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 20 }}>
                    {step === 'input' && (
                        <>
                            <p style={{ marginBottom: 10 }}>Paste your data below. Format per line: <b>Name, City, Branch</b></p>
                            <textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder={"Budi Santoso, Tegal, Pasar Pagi\nSiti Aminah, Brebes, Ketanggungan"}
                                style={{ flex: 1, width: '100%', padding: 10, fontFamily: 'monospace' }}
                            />
                        </>
                    )}

                    {step === 'review' && (
                        <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #ddd' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                <thead>
                                    <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
                                        <th style={{ padding: 8 }}>Name</th>
                                        <th style={{ padding: 8 }}>City</th>
                                        <th style={{ padding: 8 }}>Branch</th>
                                        <th style={{ padding: 8 }}>Status</th>
                                        <th style={{ padding: 8 }}>ID</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: 8 }}>{item.name}</td>
                                            <td style={{ padding: 8 }}>{item.city}</td>
                                            <td style={{ padding: 8 }}>{item.branch}</td>
                                            <td style={{ padding: 8 }}>
                                                <span style={{
                                                    padding: '2px 6px', borderRadius: 4,
                                                    background: item.status === 'ready' ? '#d1fae5' : '#ffedd5',
                                                    color: item.status === 'ready' ? '#065f46' : '#9a3412'
                                                }}>
                                                    {item.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td style={{ padding: 8 }}>{item.finalId || <i>(No ID)</i>}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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
