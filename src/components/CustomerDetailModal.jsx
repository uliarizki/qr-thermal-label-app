import { useState, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import html2canvas from 'html2canvas';

import PrintPreview from './PrintPreview';
import DigitalCard from './DigitalCard';
import { Icons } from './Icons';
import { addHistory } from '../utils/history';

export default function CustomerDetailModal({ customer, onClose }) {
    const [activeTab, setActiveTab] = useState('thermal'); // 'thermal' | 'digital'
    const [isDownloading, setIsDownloading] = useState(false);
    const digitalCardRef = useRef(null);

    // Add history on mount
    useEffect(() => {
        if (customer) {
            // Only add history if not opened from history list
            if (!customer.skipHistoryLog) {
                addHistory('SEARCH_SELECT', {
                    query: customer.id, // Use ID as query ref
                    customerId: customer.id,
                    customerName: customer.nama,
                    kota: customer.kota,
                    telp: customer.telp,
                    cabang: customer.cabang || customer.pabrik,
                    kode: customer.kode
                });
            }

            // Update URL hash for back button support
            const url = new URL(window.location);
            url.hash = 'customer-detail';
            window.history.pushState({ tab: 'modal', modal: true }, '', url);
        }

        // Cleanup history state when unmounting/closing
        return () => {
            // Optional: Could revert URL here if needed, but App.jsx handles popstate usually
        };
    }, [customer]);

    // Handle Back Button closure
    useEffect(() => {
        const handlePopState = (event) => {
            // If back button pressed and we lose the modal state, close it
            if (!event.state?.modal) {
                onClose();
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [onClose]);

    const handleManualClose = () => {
        window.history.back(); // This triggers popstate -> onClose
    };

    const handleDownloadImage = async () => {
        if (!digitalCardRef.current) return;

        try {
            setIsDownloading(true);
            await new Promise(r => setTimeout(r, 500)); // Wait for render

            const canvas = await html2canvas(digitalCardRef.current, {
                backgroundColor: null,
                scale: 2,
                useCORS: true,
                allowTaint: true,
                logging: false
            });

            const navUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `ID-${customer.id}.png`;
            link.href = navUrl;
            link.click();

            toast.success('Gambar berhasil disimpan!');
        } catch (err) {
            console.error(err);
            toast.error('Gagal menyimpan gambar');
        } finally {
            setIsDownloading(false);
        }
    };

    const handleShareImage = async () => {
        if (!digitalCardRef.current) return;

        try {
            setIsDownloading(true);
            await new Promise(r => setTimeout(r, 500));

            const canvas = await html2canvas(digitalCardRef.current, {
                backgroundColor: null,
                scale: 2,
                useCORS: true,
                allowTaint: true,
                logging: false
            });

            canvas.toBlob(async (blob) => {
                if (!blob) {
                    toast.error('Gagal membuat gambar');
                    return;
                }

                const file = new File([blob], `ID-${customer.id}.png`, { type: 'image/png' });

                if (navigator.share) {
                    try {
                        await navigator.share({
                            files: [file],
                            title: 'Digital ID Card',
                            text: `Digital ID for ${customer.nama}`,
                        });
                        toast.success('Shared successfully!');
                    } catch (error) {
                        console.error('Share failed:', error);
                    }
                } else {
                    toast.error('Browser tidak support Share Image');
                }
                setIsDownloading(false);
            }, 'image/png');

        } catch (err) {
            console.error(err);
            toast.error('Gagal generate share image');
            setIsDownloading(false);
        }
    };

    if (!customer) return null;

    return (
        <div className="modal-overlay" onClick={handleManualClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">Detail Customer</h3>
                    <button className="close-btn" onClick={handleManualClose} style={{ display: 'flex', alignItems: 'center' }}>
                        <Icons.Close size={24} />
                    </button>
                </div>

                <div className="modal-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'thermal' ? 'active' : ''}`}
                        onClick={() => setActiveTab('thermal')}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}
                    >
                        <Icons.Scan size={16} />
                        <span>Thermal Print</span>
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'digital' ? 'active' : ''}`}
                        onClick={() => setActiveTab('digital')}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}
                    >
                        <Icons.User size={16} />
                        <span>Digital ID</span>
                    </button>
                </div>

                <div className="modal-body">
                    {activeTab === 'thermal' ? (
                        <>
                            <div className="customer-detail" style={{ width: '100%' }}>
                                <p><strong>ID:</strong> {customer.id}</p>
                                <p><strong>Nama:</strong> {customer.nama}</p>
                                <p><strong>Kota:</strong> {customer.kota}</p>
                                <p><strong>Cabang:</strong> {customer.cabang || customer.sales || customer.pabrik}</p>
                                <p><strong>Telp:</strong> {customer.telp}</p>
                            </div>
                            <PrintPreview
                                data={{
                                    it: customer.id,
                                    nt: customer.nama,
                                    at: customer.kota,
                                    pt: customer.sales || customer.pabrik || customer.cabang,
                                    ws: customer.cabang,
                                    raw: customer.kode,
                                }}
                            />
                        </>
                    ) : (
                        <>
                            <DigitalCard
                                ref={digitalCardRef}
                                customer={customer}
                            />

                            <div style={{ display: 'flex', gap: 10, marginTop: 15 }}>
                                <button
                                    className="download-btn"
                                    onClick={handleDownloadImage}
                                    disabled={isDownloading}
                                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                                    title="Simpan ke Galeri"
                                >
                                    <Icons.Download size={18} />
                                    <span>Save Image</span>
                                </button>

                                {navigator.share && (
                                    <button
                                        className="download-btn"
                                        onClick={handleShareImage}
                                        disabled={isDownloading}
                                        style={{
                                            flex: 1,
                                            background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                                        }}
                                        title="Share ke WhatsApp dll"
                                    >
                                        <Icons.Share size={18} />
                                        <span>Share</span>
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
