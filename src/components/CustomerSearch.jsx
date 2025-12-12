import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { addHistory } from '../utils/history';
import PrintPreview from './PrintPreview';
import './CustomerSearch.css';

const STORAGE_KEY = 'qr:lastSearchQuery';

export default function CustomerSearch({ customers = [], onSelect, onSync, isSyncing, lastUpdated }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Initial load query
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setSearchQuery(saved);
    }
  }, []);

  // Save query
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (searchQuery) localStorage.setItem(STORAGE_KEY, searchQuery);
      else localStorage.removeItem(STORAGE_KEY);
    }
  }, [searchQuery]);

  // Filter effect with Debounce & Smart Logic
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!searchQuery.trim()) {
        setFilteredCustomers([]);
        return;
      }

      // 1. Pecah query jadi array kata (tokens), buang spasi kosong
      const terms = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);

      const results = customers.filter(c => {
        // 2. Gabungkan semua field relevan jadi satu "haystack"
        const haystack = `${c.id || ''} ${c.nama || ''} ${c.kota || ''} ${c.pabrik || ''} ${c.sales || ''}`.toLowerCase();

        // 3. Cek apakah SEMUA kata di query ada di haystack (AND Logic)
        return terms.every(term => haystack.includes(term));
      });

      setFilteredCustomers(results);
    }, 300); // Debounce 300ms

    return () => clearTimeout(timer);
  }, [searchQuery, customers]);

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    // Add history on select
    addHistory('SEARCH_SELECT', {
      query: searchQuery,
      customerId: customer.id,
      customerName: customer.nama
    });
  };

  return (
    <div className="customer-search page-card">
      <div className="search-header-container">
        <input
          type="text"
          placeholder="🔍 Cari berdasarkan Nama, ID, atau Kota..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        <button
          className="sync-btn"
          onClick={onSync}
          disabled={isSyncing}
          title="Ambil data terbaru dari Google Sheets"
        >
          {isSyncing ? '⏳Sync' : '🔄 Sync'}
        </button>
      </div>

      {lastUpdated && (
        <p className="last-updated">
          Data terakhir: {lastUpdated.toLocaleTimeString()} {lastUpdated.toLocaleDateString()}
        </p>
      )}

      {isSyncing && (
        <div style={{ marginBottom: 20 }}>
          <Skeleton count={3} height={40} style={{ marginBottom: 10 }} />
        </div>
      )}

      {!isSyncing && searchQuery.trim() && filteredCustomers.length === 0 && (
        <p className="no-data">❌ Tidak ada hasil. Coba "Sync" jika data barusan diinput.</p>
      )}

      {!isSyncing && !searchQuery.trim() && filteredCustomers.length === 0 && (
        <p className="no-data">💡 Ketik untuk mencari dari local data</p>
      )}

      <div className="customer-list">
        {filteredCustomers.map((customer, idx) => (
          <div
            key={customer.id || idx}
            className={`customer-card ${selectedCustomer?.id === customer.id ? 'selected' : ''
              }`}
            onClick={() => handleSelectCustomer(customer)}
          >
            <div className="customer-header">
              <span className="customer-id">{customer.id}</span>
              <span className="customer-name">{customer.nama}</span>
            </div>
            <div className="customer-details">
              <p>📍 {customer.kota}</p>
              <p>📱 {customer.telp}</p>
              <p>🏭 {customer.pabrik}</p>
            </div>
            {customer.kode && (
              <div className="customer-qr">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(
                    customer.kode
                  )}`}
                  alt="QR"
                  loading="lazy"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedCustomer && (
        <div className="selected-info">
          <h3>✅ Data Terpilih</h3>
          <div className="customer-detail">
            <p><strong>ID:</strong> {selectedCustomer.id}</p>
            <p><strong>Nama:</strong> {selectedCustomer.nama}</p>
            <p><strong>Kota:</strong> {selectedCustomer.kota}</p>
            <p><strong>Cabang:</strong> {selectedCustomer.cabang}</p>
            <p><strong>Telp:</strong> {selectedCustomer.telp}</p>
            <p><strong>Pabrik:</strong> {selectedCustomer.pabrik}</p>
          </div>

          <PrintPreview
            data={{
              it: selectedCustomer.id,
              nt: selectedCustomer.nama,
              at: selectedCustomer.kota,
              pt: selectedCustomer.sales || selectedCustomer.pabrik,
              ws: selectedCustomer.cabang,
              raw: selectedCustomer.kode, // sumber QR
            }}
          />

        </div>
      )}
    </div>
  );
}
