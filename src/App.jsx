// src/App.jsx
import { useState, useEffect } from 'react';
import QRScanner from './components/QRScanner';
import CustomerSearch from './components/CustomerSearch';
import AddCustomer from './components/AddCustomer';
import PrintPreview from './components/PrintPreview.jsx';
import { getCustomers } from './utils/googleSheets';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('scan');
  const [scannedData, setScannedData] = useState(null);
  const [customers, setCustomers] = useState([]);

  // Load semua customer (opsional, kalau mau pre-load list)
  useEffect(() => {
    const loadCustomers = async () => {
      const result = await getCustomers();
      if (result.success) {
        setCustomers(result.data || []);
      } else {
        console.error('Error loading customers:', result.error);
      }
    };
    loadCustomers();
  }, []);

  const handleScan = (data) => {
    setScannedData(data);
    setActiveTab('preview');
  };

  const handleAddCustomer = (newCustomer) => {
    // Optional: sync dengan state lokal kalau perlu
    setCustomers((prev) => [...prev, newCustomer]);
    setActiveTab('scan');
  };

  const handleSelectCustomer = (customerData) => {
    setScannedData(customerData);
    setActiveTab('preview');
  };

  return (
    <div className="app-container">
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
      </nav>

      <main className="app-content">
        {activeTab === 'scan' && <QRScanner onScan={handleScan} />}

        {activeTab === 'search' && (
          <CustomerSearch
            customers={customers}
            onSelect={handleSelectCustomer}
          />
        )}

        {activeTab === 'add' && (
          <AddCustomer onAdd={handleAddCustomer} />
        )}

        {activeTab === 'preview' && scannedData && (
          <PrintPreview data={scannedData} />
        )}
      </main>
    </div>
  );
}
