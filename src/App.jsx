import { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import QRScanner from './components/QRScanner';
import CustomerSearch from './components/CustomerSearch';
import AddCustomer from './components/AddCustomer';
import PrintPreview from './components/PrintPreview.jsx';
import History from './components/History';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel'; // NEW
import CustomerDetailModal from './components/CustomerDetailModal';
import { getCustomers, getLastUpdate } from './utils/googleSheets';
import { Icons } from './components/Icons';
import './App.css';

// Main Inner Component that uses Auth Context
function AppContent() {
  const { user, logout, loading } = useAuth();

  const getStoredTab = () => {
    if (typeof window === 'undefined') return 'scan';
    return localStorage.getItem('qr:lastTab') || 'scan';
  };

  const [activeTab, setActiveTab] = useState(getStoredTab);
  const [scannedData, setScannedData] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [globalSelectedCustomer, setGlobalSelectedCustomer] = useState(null);
  const [restoredSearchQuery, setRestoredSearchQuery] = useState('');

  // ...

  const handleHistorySelect = (historyItem) => {
    const { action, details } = historyItem;

    if (action === 'SCAN' || action === 'ADD' || action === 'SEARCH_SELECT') {
      // Re-construct customer object
      const customer = {
        id: details.customerId || 'N/A',
        nama: details.nama || details.customerName,
        kota: details.kota || '',
        telp: details.telp || '',
        cabang: details.pabrik || details.cabang || '',
        kode: details.kode || details.customerId, // Ensure QR code value is passed (often ID)
        skipHistoryLog: true // Flag to prevent duplicate history entry when viewing from history
      };

      setGlobalSelectedCustomer(customer);
      // No navigation needed, modal pops up on top
    } else if (action === 'SEARCH') {
      // Restore search query
      if (details.query) {
        setRestoredSearchQuery(details.query);
      }
      navigateTo('search');
    }
  };

  const handleGlobalSelect = (customer) => {
    setGlobalSelectedCustomer(customer);
  };

  // ...

  const navigateTo = (tabName, replace = false) => {
    setActiveTab(tabName);
    if (tabName !== 'preview') { // Don't save preview as a distinct history point usually, or maybe yes? Let's say yes for now.
      const url = new URL(window.location);
      url.hash = tabName;
      if (replace) {
        window.history.replaceState({ tab: tabName }, '', url);
      } else {
        window.history.pushState({ tab: tabName }, '', url);
      }
    }
  };

  useEffect(() => {
    // Initial Hash Check
    const hash = window.location.hash.replace('#', '');
    if (hash && ['scan', 'search', 'add', 'history', 'admin'].includes(hash)) {
      setActiveTab(hash);
    }

    // Handle Back Button
    const handlePopState = (event) => {
      const state = event.state;
      // Only navigate if it's a valid MAIN tab. Ignore 'modal' or internal states.
      if (state?.tab && ['scan', 'search', 'add', 'history', 'admin'].includes(state.tab)) {
        setActiveTab(state.tab);
      } else {
        // Fallback or ignore
        const currentHash = window.location.hash.replace('#', '');
        if (currentHash && ['scan', 'search', 'add', 'history', 'admin'].includes(currentHash)) {
          setActiveTab(currentHash);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Persist last tab (Legacy)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('qr:lastTab', activeTab);
  }, [activeTab]);

  // ... (Load Customers effect remains same)

  const handleSync = async () => {
    setIsSyncing(true);
    const toastId = toast.loading('Syncing data...');
    const result = await getCustomers(true); // Force fetch
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
    // Construct customer object from scan
    // Note: data might just be the string content, we need to handle it. 
    // If scanning a customer ID, likely need to find it in the 'customers' list or just display raw.
    // For now, let's try to query it from existing customers list first
    const found = customers.find(c => c.id === data || c.kode === data);

    if (found) {
      setGlobalSelectedCustomer(found);
    } else {
      // Create temp object for unknown/raw scan
      setGlobalSelectedCustomer({
        id: data, // Assuming data is ID if not found
        nama: 'Unknown / Raw Scan',
        kota: '-',
        telp: '-',
        cabang: '-',
        kode: data
      });
    }
  };

  const handleAddCustomer = (newCustomer) => {
    handleSync();

    // Direct Print Preview Mapping
    const printData = {
      it: newCustomer.id || 'N/A', // ID might be empty if auto-generated
      nt: newCustomer.nama,
      at: newCustomer.kota,
      // Add other fields if PrintPreview uses them
    };

    setGlobalSelectedCustomer(printData);
  };

  const handleSelectCustomer = (customerData) => {
    setGlobalSelectedCustomer(customerData);
  };


  // 1. Loading State
  if (loading) return <div className="loading-screen">Starting System...</div>;

  // 2. Login Screen (if not authenticated)
  if (!user) {
    return <Login />;
  }

  // 3. Main App Layout (Authenticated)
  return (
    <div className="app-container">
      <Toaster position="top-center" reverseOrder={false} />

      {/* BRANDED HEADER */}
      <header className="app-header">
        <div className="header-brand" onClick={() => navigateTo('scan')}>
          <img src="/logo_new.png" alt="Bintang Mas Logo" className="header-logo" />
          <div className="header-text">
            <h1>Bintang Mas</h1>
            <p>Qr Thermal Label App</p>
          </div>
        </div>

        <div className="user-info-section" style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <div className="user-name" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {user?.role === 'admin' ? <span title="Admin">👑</span> : <Icons.User size={16} />}
            <span>{user?.username}</span>
          </div>
          <button
            onClick={logout}
            style={{
              background: 'transparent',
              border: '1px solid #666',
              color: '#ccc',
              padding: '5px 10px',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 11,
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <Icons.LogOut size={12} /> LOGOUT
          </button>
        </div>
      </header>

      {/* NAVIGATION TABS */}
      <nav className="tab-navigation">
        <button
          className={`tab-btn scan ${activeTab === 'scan' ? 'active' : ''}`}
          onClick={() => navigateTo('scan')}
        >
          <Icons.Scan size={20} />
          <span>Scan</span>
        </button>
        <button
          className={`tab-btn search ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => navigateTo('search')}
        >
          <Icons.Search size={20} />
          <span>Customer</span>
        </button>
        <button
          className={`tab-btn add ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => navigateTo('add')}
        >
          <Icons.Plus size={20} />
          <span>Baru</span>
        </button>
        <button
          className={`tab-btn history ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => navigateTo('history')}
        >
          <Icons.History size={20} />
          <span>History</span>
        </button>

        {/* ADMIN TAB (Only for Admin) */}
        {user?.role === 'admin' && (
          <button
            className={`tab-btn admin ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => navigateTo('admin')}
          >
            <Icons.Crown size={20} />
            <span>Admin</span>
          </button>
        )}
      </nav>

      {/* CONTENT AREA */}
      <main className="app-content">
        {/* ... content render ... */}
        {activeTab === 'scan' && <QRScanner onScan={handleScan} />}

        {activeTab === 'search' && (
          <CustomerSearch
            customers={customers}
            onSelect={handleGlobalSelect}
            onSync={handleSync}
            isSyncing={isSyncing}
            lastUpdated={lastUpdated}
            initialQuery={
              // If the history item was a SEARCH action, we might have stored the query in globalSelectedCustomer?
              // No, globalSelectedCustomer is for the modal.
              // We need a specific state for search query restoration.
              // Let's check handleHistorySelect again. It calls navigateTo('search').
              // We need to pass the query too.
              // For now, let's rely on localStorage or add a state in AppContent. 
              // Wait, handleHistorySelect calls navigateTo('search') but doesn't set a query state.
              // I should update handleHistorySelect to set a 'restoredSearchQuery' state.
              restoredSearchQuery
            }
          />
        )}

        {activeTab === 'add' && (
          <AddCustomer onAdd={handleAddCustomer} />
        )}

        {activeTab === 'history' && <History onSelect={handleHistorySelect} />}

        {activeTab === 'admin' && user?.role === 'admin' && <AdminPanel />}

        <CustomerDetailModal
          customer={globalSelectedCustomer}
          onClose={() => setGlobalSelectedCustomer(null)}
        />
      </main>
    </div>
  );
}

// Root Component
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
