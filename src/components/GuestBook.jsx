import React, { useState, useEffect } from 'react';
import QRScanner from './QRScanner';
import { checkInCustomer, addAndCheckIn, getAttendanceList, getCustomersLite } from '../utils/googleSheets';
import { toast } from 'react-hot-toast';
import '../App.css';
import GuestBookList from './GuestBookList';
import GuestBookForm from './GuestBookForm';

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
                        <GuestBookForm
                            showScanner={!showManual}
                            setShowScanner={(val) => setShowManual(!val)} // Invert logic for clarity
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            searchResults={searchResults}
                            handleSelectCustomer={handleSelectCustomer}
                            manualForm={manualForm}
                            setManualForm={setManualForm}
                            handleManualSubmit={handleManualSubmit}
                            setBranch={setBranch}
                        />
                    )}
                </div>
            )}

            {activeTab === 'list' && (
                <GuestBookList
                    attendees={attendees}
                    loading={loading}
                    filterDate={filterDate}
                    setFilterDate={setFilterDate}
                    onRefresh={fetchAttendance}
                />
            )}
        </div>
    );
}
