import React, { useState, useEffect } from 'react';
import QRScanner from './QRScanner';
import { checkInCustomer, addAndCheckIn, getAttendanceList, getCustomers, getCustomersLite } from '../utils/googleSheets';
import { toast } from 'react-hot-toast';
import { Icons } from './Icons';
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

    // Default Cabang from LocalStorage or 'BT SMG'
    const [manualForm, setManualForm] = useState(() => {
        const savedBranch = typeof window !== 'undefined' ? localStorage.getItem('qr:lastBranch') : 'BT SMG';
        return { nama: '', kota: '', hp: '', cabang: savedBranch || 'BT SMG' };
    });

    // Date Filter State (Default Today)
    const [filterDate, setFilterDate] = useState(() => {
        const now = new Date();
        return now.toISOString().split('T')[0]; // YYYY-MM-DD
    });

    // Load attendance when switching to list
    useEffect(() => {
        if (activeTab === 'list') {
            fetchAttendance();
        }
    }, [activeTab]);

    // Load all customers once for search capability
    useEffect(() => {
        if (showManual && !dataLoaded) {
            fetchCustomers();
        }
    }, [showManual]);

    // Search Logic
    useEffect(() => {
        if (!searchQuery.trim() || !dataLoaded) {
            setSearchResults([]);
            return;
        }

        const query = searchQuery.toUpperCase();
        const results = allCustomers.filter(c =>
            (c.nama && c.nama.includes(query)) ||
            (c.id && c.id.includes(query)) ||
            (c.kota && c.kota.includes(query))
        ).slice(0, 5); // Limit 5 suggestions

        setSearchResults(results);
    }, [searchQuery, allCustomers, dataLoaded]);

    const fetchAttendance = async () => {
        setLoading(true);
        const res = await getAttendanceList();
        setLoading(false);
        if (res.success) {
            setAttendees(res.data);
        } else {
            toast.error('Gagal memuat data: ' + res.error);
        }
    };

    const fetchCustomers = async () => {
        const toastId = toast.loading('Memuat data customer...');
        try {
            const res = await getCustomersLite(); // Use Lite version
            if (res.success) {
                setAllCustomers(res.data); // data: [{id, nama, kota, ...}]
                setDataLoaded(true);
                toast.dismiss(toastId);
            } else {
                toast.error('Gagal load database');
            }
        } catch (e) {
            toast.error('Network Error');
        }
    };

    const handleScan = async (data) => {
        // data format: { it: 'ID', nt: 'Name', at: 'City', ws: 'Cabang' ... }
        const customer = {
            id: data.it,
            nama: data.nt,
            kota: data.at || '',
            cabang: data.ws || '',
        };
        await performCheckIn(customer);
    };

    const performCheckIn = async (customer) => {
        const toastId = toast.loading(`Checking In: ${customer.nama}...`);
        try {
            // OVERWRITE: Always record the EVENT LOCATION (manualForm.cabang)
            // OLD Logic: Only used if customer.cabang was missing.
            // NEW Logic: We want 'Daftar Hadir' to show WHERE the event is, not where the user is from.
            customer.cabang = manualForm.cabang;

            const res = await checkInCustomer(customer);
            if (res.success) {
                toast.success(`Hadir: ${customer.nama} (${customer.kota}) di ${customer.cabang}`, { id: toastId, duration: 4000 });
                if (activeTab === 'list') fetchAttendance(); // Refresh list if visible
            } else {
                toast.error(`Gagal: ${res.error}`, { id: toastId, duration: 5000 });
            }
        } catch (e) {
            toast.error('Error Check-In', { id: toastId });
        }
    };

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        if (!manualForm.nama || !manualForm.kota) {
            toast.error('Nama dan Kota wajib diisi!');
            return;
        }

        const toastId = toast.loading('Mendaftarkan & Check-In...');
        const customer = {
            nama: manualForm.nama,
            kota: manualForm.kota,
            cabang: manualForm.cabang,
            telp: manualForm.hp,
        };

        try {
            const res = await addAndCheckIn(customer);
            if (res.success) {
                toast.success(`Sukses! ${manualForm.nama} terdaftar & hadir.`, { id: toastId });
                // Stick Branch, Reset others
                setManualForm(prev => ({ ...prev, nama: '', kota: '', hp: '' }));
                setSearchQuery(''); // Reset search
                // Keep manual mode open, ready for next input
            } else {
                toast.error(`Gagal: ${res.error}`, { id: toastId });
            }
        } catch (error) {
            toast.error('Network Error', { id: toastId });
        }
    };

    // Select existing customer from search
    const handleSelectCustomer = (customer) => {
        if (window.confirm(`Check-In atas nama ${customer.nama} (${customer.kota}) di cabang ${manualForm.cabang}?`)) {
            performCheckIn({
                id: customer.id,
                nama: customer.nama,
                kota: customer.kota,
                cabang: manualForm.cabang // Use currently selected branch context
            });
            setSearchQuery('');
        }
    };

    const setBranch = (br) => {
        localStorage.setItem('qr:lastBranch', br);
        setManualForm(prev => ({ ...prev, cabang: br }));
    };

    return (
        <div className="page-card" style={{ maxWidth: 800, margin: '0 auto' }}>
            <div className="guestbook-header" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
                borderBottom: '1px solid #eee',
                paddingBottom: 15
            }}>
                <h2 style={{ margin: 0, color: '#D4AF37' }}>📅 Buku Tamu</h2>
                <div className="tabs" style={{ display: 'flex', gap: 10 }}>
                    <button
                        onClick={() => setActiveTab('checkin')}
                        style={{ padding: '8px 16px', borderRadius: 20, border: 'none', background: activeTab === 'checkin' ? '#D4AF37' : '#eee', color: activeTab === 'checkin' ? 'white' : '#666', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        Scan / Input
                    </button>
                    <button
                        onClick={() => setActiveTab('list')}
                        style={{ padding: '8px 16px', borderRadius: 20, border: 'none', background: activeTab === 'list' ? '#D4AF37' : '#eee', color: activeTab === 'list' ? 'white' : '#666', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        List Hadir
                    </button>
                </div>
            </div>

            {activeTab === 'checkin' && (
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

                            {/* SEARCH BAR (Moved Uppermost) */}
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
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <div style={{ fontWeight: 'bold' }}>{cust.nama}</div>
                                                            {cust.cabang && (
                                                                <span style={{
                                                                    fontSize: 10,
                                                                    padding: '2px 6px',
                                                                    borderRadius: 4,
                                                                    border: cust.cabang.includes('SBY') ? '1px solid #fde047' :
                                                                        cust.cabang.includes('SMG') ? '1px solid #86efac' :
                                                                            cust.cabang.includes('JKT') ? '1px solid #93c5fd' : '1px solid #eee',
                                                                    background: cust.cabang.includes('SBY') ? '#fefce8' :
                                                                        cust.cabang.includes('SMG') ? '#f0fdf4' :
                                                                            cust.cabang.includes('JKT') ? '#eff6ff' : '#f3f4f6',
                                                                    color: cust.cabang.includes('SBY') ? '#854d0e' :
                                                                        cust.cabang.includes('SMG') ? '#166534' :
                                                                            cust.cabang.includes('JKT') ? '#1e40af' : '#666',
                                                                    fontWeight: 'bold'
                                                                }}>
                                                                    {cust.cabang}
                                                                </span>
                                                            )}
                                                        </div>
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
                                {/* BRANCH CONTEXT SELECTOR (Moved Here) */}
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
            )}

            {activeTab === 'list' && (
                <div className="attendance-list">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                        <h3 style={{ margin: 0 }}>
                            Daftar Hadir: {new Date(filterDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </h3>
                    </div>

                    <div style={{ display: 'flex', gap: 10, marginBottom: 15, alignItems: 'center' }}>
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            style={{
                                padding: '8px 12px',
                                borderRadius: 6,
                                border: '1px solid #ccc',
                                fontSize: 14,
                                fontFamily: 'inherit'
                            }}
                        />
                        <button onClick={fetchAttendance} style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: 6, border: '1px solid #ddd', background: 'white' }}>
                            🔄 Refresh Data
                        </button>
                    </div>

                    {loading ? (
                        <p>Loading data...</p>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                                <thead>
                                    <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                                        <th style={{ padding: 10, textAlign: 'left' }}>Jam</th>
                                        <th style={{ padding: 10, textAlign: 'left' }}>Nama</th>
                                        <th style={{ padding: 10, textAlign: 'left' }}>Lokasi Acara</th>
                                        <th style={{ padding: 10, textAlign: 'left' }}>Kota</th>
                                        <th style={{ padding: 10, textAlign: 'center' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendees.filter(guest => {
                                        if (!guest.timestamp) return false;
                                        // Convert timestamp to YYYY-MM-DD
                                        const guestDate = new Date(guest.timestamp).toISOString().split('T')[0];
                                        return guestDate === filterDate;
                                    }).length === 0 ? (
                                        <tr>
                                            <td colSpan="5" style={{ padding: 20, textAlign: 'center', color: '#999', fontStyle: 'italic' }}>
                                                Tidak ada data untuk tanggal ini.
                                            </td>
                                        </tr>
                                    ) : (
                                        attendees
                                            .filter(guest => {
                                                if (!guest.timestamp) return false;
                                                const guestDate = new Date(guest.timestamp).toISOString().split('T')[0];
                                                return guestDate === filterDate;
                                            })
                                            .map((guest, idx) => (
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
                                            ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
