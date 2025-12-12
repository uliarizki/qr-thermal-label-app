import { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import QRScanner from './components/QRScanner';
import CustomerSearch from './components/CustomerSearch';
import AddCustomer from './components/AddCustomer';
import PrintPreview from './components/PrintPreview.jsx';
import History from './components/History';
import { getCustomers, getLastUpdate } from './utils/googleSheets';
import './App.css';

export default function App() {
  const getStoredTab = () => {
    if (typeof window === 'undefined') return 'scan';
    return localStorage.getItem('qr:lastTab') || 'scan';
  };

  const [activeTab, setActiveTab] = useState(getStoredTab);
  const [scannedData, setScannedData] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Persist last tab
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('qr:lastTab', activeTab);
  }, [activeTab]);

  // Load semua customer (Initial Load)
  useEffect(() => {
    const loadCustomers = async () => {
      // Load cache first (fast)
      const cachedTime = getLastUpdate();
      if (cachedTime) setLastUpdated(cachedTime);

      const result = await getCustomers(); // false = try cache first
      if (result.success) {
        setCustomers(result.data || []);
      } else {
        console.error('Error loading customers:', result.error);
        toast.error('Gagal memuat data customer');
      }
    };
    loadCustomers();
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    const toastId = toast.loading('Syncing data...');
    const result = await getCustomers(true); // true = force fetch
    setIsSyncing(false);

    if (result.success) {
      setCustomers(result.data || []);
      setLastUpdated(new Date());
      toast.success('Data berhasil disinkronisasi!', { id: toastId });
    } else {
      toast.error('Gagal sync data: ' + result.error, { id: toastId });
    }
  };

  const handleScan = (data) => {
    setScannedData(data);
    setActiveTab('preview');
  };

  const handleAddCustomer = (newCustomer) => {
    // Optional: sync dengan state lokal kalau perlu
    // Tapi karena addCustomer di utils mungkin belum update cache list, 
    // kita bisa force sync atau append manual.
    // Simpelnya: kita force sync setelah add.
    handleSync();
    setActiveTab('scan');
  };

  const handleSelectCustomer = (customerData) => {
    setScannedData(customerData);
    setActiveTab('preview');
  };

  return (
    <div className="app-container">
      <Toaster position="top-center" reverseOrder={false} />
      <header className="app-header">
        <h1>QR Thermal Label Printer</h1>
        <p>Scan, Print, Manage Customer Labels</p>
      </header>

      <nav className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === 'scan' ? 'active' : ''}`}
          onClick={() => setActiveTab('scan')}
        >
          📱 Scan QR
        </button>
        <button
          className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          🔍 Cari Customer
        </button>
        <button
          className={`tab-btn ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => setActiveTab('add')}
        >
          ➕ Customer Baru
        </button>
        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📊 History
        </button>
      </nav>

      <main className="app-content">
        {activeTab === 'scan' && <QRScanner onScan={handleScan} />}

        {activeTab === 'search' && (
          <CustomerSearch
            customers={customers}
            onSelect={handleSelectCustomer}
            onSync={handleSync}
            isSyncing={isSyncing}
            lastUpdated={lastUpdated}
          />
        )}

        {activeTab === 'add' && (
          <AddCustomer onAdd={handleAddCustomer} />
        )}

        {activeTab === 'history' && <History />}

        {activeTab === 'preview' && scannedData && (
          <PrintPreview data={scannedData} />
        )}
      </main>
    </div>
  );
}
