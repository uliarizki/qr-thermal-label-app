import { useState, useEffect, Suspense, lazy } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PrinterProvider } from './context/PrinterContext';
import { CustomerProvider, useCustomer } from './context/CustomerContext'; // New Context
import { useNetworkStatus } from './hooks/useNetworkStatus';
import QRScanner from './components/QRScanner';
import CustomerSearch from './components/CustomerSearch';
import AddCustomer from './components/AddCustomer';
import PrintPreview from './components/PrintPreview.jsx';
import History from './components/History';
import Login from './components/Login';

// LAZY LOAD HEAVY COMPONENTS
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const GuestBook = lazy(() => import('./components/GuestBook'));
const PrinterGuide = lazy(() => import('./components/PrinterGuide'));

import CustomerDetailModal from './components/CustomerDetailModal';
import { getLastUpdate, getCachedCustomers } from './utils/googleSheets';
import { getCustomers } from './services/customerService';
import { Icons } from './components/Icons';
import Skeleton from 'react-loading-skeleton'; // Import Skeleton for fallback
import UpdatePrompt from './components/UpdatePrompt';
import './App.css';

// Main Inner Component that uses Auth Context
function MainApp() {
  const { user, logout, loading } = useAuth();
  const { isOnline } = useNetworkStatus();

  const getStoredTab = () => {
    if (typeof window === 'undefined') return 'search';
    // Priority: URL Hash -> Default (Customer Search)
    const hash = window.location.hash.replace('#', '');
    if (hash) return hash;
    return 'search';
  };

  const {
    customers,
    isSyncing,
    lastUpdated,
    syncCustomers,
    selectedCustomer,
    setSelectedCustomer,
    addCustomerLocal
  } = useCustomer();

  const [activeTab, setActiveTab] = useState(getStoredTab);
  const [restoredSearchQuery, setRestoredSearchQuery] = useState('');
  const [showPrinterGuide, setShowPrinterGuide] = useState(false);

  // Handle Browser Back/Forward
  useEffect(() => {
    const handlePopState = (event) => {
      // If state exists, use it
      if (event.state && event.state.tab) {
        setActiveTab(event.state.tab);
        return;
      }

      // Fallback: Check hash
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        setActiveTab(hash);
      } else {
        setActiveTab('search');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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

      setSelectedCustomer(customer);
      // No navigation needed, modal pops up on top
    } else if (action === 'SEARCH') {
      // Restore search query
      if (details.query) {
        setRestoredSearchQuery(details.query);
      }
      navigateTo('search');
    }
  };

  const navigateTo = (tabName, replace = false) => {
    setActiveTab(tabName);
    if (tabName !== 'preview') {
      const url = new URL(window.location);
      url.hash = tabName;
      if (replace) {
        window.history.replaceState({ tab: tabName }, '', url);
      } else {
        window.history.pushState({ tab: tabName }, '', url);
      }
    }
  };

  const handleScan = (data) => {
    // Construct customer object from scan
    // Handle if data is already an object (from QRScanner JSON parse)
    if (typeof data === 'object' && data !== null) {
      // Check if it's the expected format {it, nt, ...}
      if (data.it || data.nt) {
        setSelectedCustomer({
          id: data.it || 'N/A',
          nama: data.nt || 'Unknown',
          kota: data.at || '',
          sales: data.pt || '', // Map pt to sales
          pabrik: data.kp || '', // Map kp to pabrik
          cabang: data.ws || '', // Map ws to cabang
          telp: data.np || '',
          kode: JSON.stringify(data) // Keep raw data for QR regeneration
        });
        return;
      }
    }

    // Fallback for string IDs or unknown formats
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);

    // Try to find in existing customers
    const found = customers.find(c => c.id === dataString || c.kode === dataString);

    if (found) {
      setSelectedCustomer(found);
    } else {
      // Create temp object for unknown/raw scan
      setSelectedCustomer({
        id: dataString,
        nama: 'Unknown / Raw Scan',
        kota: '-',
        telp: '-',
        cabang: '-',
        kode: dataString
      });
    }
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
      <div className="global-watermark-overlay"></div>
      {/* <Toaster position="top-center" reverseOrder={false} /> */} {/* Moved to root App component */}

      {/* BRANDED HEADER */}
      <header className="app-header">
        <div className="header-brand" onClick={() => navigateTo('search')}>
          <img
            src="/logo_brand.png"
            alt="Bintang Mas"
            className="nav-logo"
            style={{ filter: 'drop-shadow(0 0 5px rgba(212,175,55,0.5))' }}
          />
          <div className="header-text">
            <h1>Bintang Mas</h1>
            <p>Qr Thermal Label App</p>
          </div>
        </div>

        <div className="user-info-section" style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          {/* Network Status Indicator */}
          {!isOnline && (
            <span
              style={{
                background: '#ef4444',
                color: 'white',
                padding: '4px 8px',
                borderRadius: 4,
                fontSize: 10,
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
              title="Tidak ada koneksi internet"
            >
              ⚠️ OFFLINE
            </span>
          )}
          <div className="user-name" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {user?.role === 'admin' ? <span title="Admin">👑</span> : <Icons.User size={16} />}
            <span>{user?.username}</span>
          </div>
          <button
            onClick={() => setShowPrinterGuide(true)}
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
            title="Panduan Printer"
          >
            🖨️
          </button>
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
          className={`tab-btn event ${activeTab === 'event' ? 'active' : ''}`}
          onClick={() => navigateTo('event')}
        >
          <Icons.Calendar size={20} />
          <span>Event</span>
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
        <Suspense fallback={<div style={{ padding: 20 }}><Skeleton count={5} height={50} /></div>}>
          {activeTab === 'scan' && (
            <QRScanner
              onScan={handleScan}
              onClose={() => navigateTo('search')}
            />
          )}

          {activeTab === 'search' && (
            <CustomerSearch
              initialQuery={restoredSearchQuery}
              onScanTrigger={() => navigateTo('scan')}
            />
          )}

          {activeTab === 'add' && (
            <AddCustomer onAdd={addCustomerLocal} />
          )}

          {activeTab === 'event' && <GuestBook />}

          {activeTab === 'history' && <History onSelect={handleHistorySelect} />}

          {activeTab === 'admin' && user?.role === 'admin' && <AdminPanel />}
        </Suspense>

        <CustomerDetailModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />

        {/* Printer Guide Modal */}
        {showPrinterGuide && (
          <Suspense fallback={<div className="loading-screen">Loading Guide...</div>}>
            <PrinterGuide onClose={() => setShowPrinterGuide(false)} />
          </Suspense>
        )}
      </main>
    </div>
  );
}

// Root Component
export default function App() {
  return (
    <PrinterProvider>
      <AuthProvider>
        <CustomerProvider>
          <MainApp />
          <Toaster position="top-right" />
          <UpdatePrompt />
        </CustomerProvider>
      </AuthProvider>
    </PrinterProvider>
  );
}
