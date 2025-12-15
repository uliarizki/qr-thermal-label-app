import React, { useState, useEffect } from 'react';
import QRScanner from './QRScanner';
import { checkInCustomer, addAndCheckIn, getAttendanceList, getCustomers } from '../utils/googleSheets';
import { toast } from 'react-hot-toast';
import { Icons } from './Icons'; // Ensure Icons are imported
import '../App.css';

export default function GuestBook() {
    const [activeTab, setActiveTab] = useState('checkin'); // 'checkin' | 'list'

    // Data States
    const [attendees, setAttendees] = useState([]);
    const [allCustomers, setAllCustomers] = useState([]); // Cache for search
    const [loading, setLoading] = useState(false);
    const [dataLoaded, setDataLoaded] = useState(false); // Flag if customers loaded

    // Manual / Search State - Default TRUE (Search First Flow)
    const [showManual, setShowManual] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // ... (lines 23-147 unchanged)

    // ... (inside handleManualSubmit)
    // Stick Branch, Reset others
    setManualForm(prev => ({ ...prev, nama: '', kota: '', hp: '' }));
    // Don't close manual form, keep it open for next input
    // setShowManual(false); 
    setSearchQuery(''); // Reset search
} else {
    toast.error(`Gagal: ${res.error}`, { id: toastId });
}
        } catch (error) {
    toast.error('Network Error', { id: toastId });
}
    };

// ... (lines 149-200 unchanged)

{
    activeTab === 'checkin' && (
        <div className="checkin-view">
            {!showManual ? (
                /* SCANNER VIEW */
                <>
                    <div style={{ marginBottom: 20 }}>
                        <QRScanner onScan={handleScan} />
                    </div>

                    <div style={{ textAlign: 'center', marginTop: 20 }}>
                        <p style={{ color: '#666', marginBottom: 10 }}>Scanner gagal atau manual?</p>
                        <button
                            onClick={() => setShowManual(true)}
                            style={{ padding: '12px 24px', background: '#333', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}
                        >
                            🔍 Kembali ke Input Manual
                        </button>
                    </div>
                </>
            ) : (
                /* MANUAL + SEARCH VIEW (DEFAULT) */
                <div className="manual-form" style={{ padding: 20, background: '#f9f9f9', borderRadius: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                        <h3 style={{ margin: 0 }}>Input Tamu / Member</h3>
                        {/* Button to switch to Scanner */}
                        <button
                            onClick={() => setShowManual(false)}
                            style={{
                                padding: '8px 16px',
                                background: '#333',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 6,
                                fontSize: 13,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 5,
                                cursor: 'pointer'
                            }}
                        >
                            📷 Buka Scanner
                        </button>
                    </div>

                    {/* BRANCH CONTEXT SELECTOR (Always Visible) */}
                    <div className="form-group" style={{ marginBottom: 15 }}>
                        <label style={{ display: 'block', marginBottom: 5, fontSize: 13, fontWeight: 600 }}>Lokasi Acara (Cabang)</label>
                        <div style={{ display: 'flex', gap: 10 }}>
                            {['BT SMG', 'BT JKT', 'BT SBY'].map(br => (
                                <button
                                    key={br}
                                    type="button"
                                    onClick={() => setBranch(br)}
                                    style={{
                                        flex: 1, padding: '10px',
                                        border: manualForm.cabang === br ? '2px solid #D4AF37' : '1px solid #ddd',
                                        background: manualForm.cabang === br ? '#fffdf5' : 'white',
                                        color: manualForm.cabang === br ? '#D4AF37' : '#666',
                                        borderRadius: 6, cursor: 'pointer', fontWeight: manualForm.cabang === br ? 'bold' : 'normal'
                                    }}
                                >
                                    {br}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* SEARCH BAR */}
                    <div className="form-group" style={{ marginBottom: 20 }}>
                        <label style={{ display: 'block', marginBottom: 5, fontSize: 13, fontWeight: 600 }}>Cari Member (ID / Nama)</label>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Ketik nama atau ID..."
                            style={{ width: '100%', padding: 12, borderRadius: 6, border: '1px solid #ddd', fontSize: 16 }}
                        />
                        {/* Search Results */}
                        {searchQuery && (
                            <div style={{ marginTop: 5, border: '1px solid #eee', borderRadius: 6, background: 'white', maxHeight: 200, overflowY: 'auto' }}>
                                {searchResults.length > 0 ? (
                                    searchResults.map(cust => (
                                        <div
                                            key={cust.id}
                                            onClick={() => handleSelectCustomer(cust)}
                                            style={{ padding: '10px', borderBottom: '1px solid #eee', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                        >
                                            <div>
                                                <div style={{ fontWeight: 'bold' }}>{cust.nama}</div>
                                                <div style={{ fontSize: 12, color: '#666' }}>{cust.kota} | {cust.id}</div>
                                            </div>
                                            <button style={{ background: '#e6fffa', color: '#047857', border: 'none', padding: '4px 8px', borderRadius: 4, cursor: 'pointer' }}>Pilih</button>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ padding: 10, fontStyle: 'italic', color: '#999' }}>Data tidak ditemukan. Silakan isi form di bawah untuk tamu baru.</div>
                                )}
                            </div>
                        )}
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px dashed #ddd', margin: '20px 0' }} />

                    {/* NEW USER FORM */}
                    <h4 style={{ marginTop: 0, marginBottom: 15, color: '#d97706' }}>📝 Formulir Tamu Baru</h4>
                    <form onSubmit={handleManualSubmit}>
                        <div className="form-group" style={{ marginBottom: 15 }}>
                            <label style={{ display: 'block', marginBottom: 5, fontSize: 13, fontWeight: 600 }}>Nama Lengkap</label>
                            <input
                                type="text"
                                className="input-field"
                                value={manualForm.nama}
                                onChange={(e) => setManualForm({ ...manualForm, nama: e.target.value })}
                                placeholder="Contoh: Budi Santoso"
                                style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd' }}
                                required={!searchQuery} // Required only if manually adding
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: 15 }}>
                            <label style={{ display: 'block', marginBottom: 5, fontSize: 13, fontWeight: 600 }}>Kota Asal</label>
                            <input
                                type="text"
                                className="input-field"
                                value={manualForm.kota}
                                onChange={(e) => setManualForm({ ...manualForm, kota: e.target.value })}
                                placeholder="Contoh: Surabaya"
                                style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd' }}
                                required={!searchQuery}
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: 20 }}>
                            <label style={{ display: 'block', marginBottom: 5, fontSize: 13, fontWeight: 600 }}>No. HP (Opsional)</label>
                            <input
                                type="text"
                                className="input-field"
                                value={manualForm.hp}
                                onChange={(e) => setManualForm({ ...manualForm, hp: e.target.value })}
                                placeholder="081..."
                                style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button type="submit" style={{ flex: 1, padding: 12, background: '#D4AF37', color: 'white', border: 'none', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer' }}>
                                ➕ Simpan & Hadir
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    )
}

{
    activeTab === 'list' && (
        <div className="attendance-list">
            <h3 style={{ marginTop: 0 }}>Daftar Hadir Hari Ini</h3>
            <button onClick={fetchAttendance} style={{ marginBottom: 10, padding: '5px 10px', cursor: 'pointer' }}>🔄 Refresh</button>
            {loading ? (
                <p>Loading data...</p>
            ) : attendees.length === 0 ? (
                <p style={{ color: '#999', fontStyle: 'italic' }}>Belum ada tamu yang check-in hari ini.</p>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                        <thead>
                            <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                                <th style={{ padding: 10, textAlign: 'left' }}>Jam</th>
                                <th style={{ padding: 10, textAlign: 'left' }}>Nama</th>
                                <th style={{ padding: 10, textAlign: 'left' }}>Cabang</th>
                                <th style={{ padding: 10, textAlign: 'left' }}>Kota</th>
                                <th style={{ padding: 10, textAlign: 'center' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attendees.map((guest, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: 10 }}>{new Date(guest.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                    <td style={{ padding: 10, fontWeight: 500 }}>{guest.nama}</td>
                                    <td style={{ padding: 10 }}>
                                        <span style={{
                                            background: '#f3f4f6', padding: '2px 6px', borderRadius: 4,
                                            fontSize: 11, border: '1px solid #ddd', color: '#444', fontWeight: 'bold'
                                        }}>
                                            {guest.cabang || '-'}
                                        </span>
                                    </td>
                                    <td style={{ padding: 10, color: '#666' }}>{guest.kota}</td>
                                    <td style={{ padding: 10, textAlign: 'center' }}>
                                        <span style={{ background: '#e6fffa', color: '#047857', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 'bold' }}>Hadir</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
        </div >
    );
}
