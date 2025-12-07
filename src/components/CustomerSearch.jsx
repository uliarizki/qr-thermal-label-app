import { useState, useRef, useEffect } from 'react';
import { searchCustomer } from '../utils/googleSheets';
import { addHistory } from '../utils/history';
import PrintPreview from './PrintPreview';
import './CustomerSearch.css';

const STORAGE_KEY = 'qr:lastSearchQuery';

export default function CustomerSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasResult, setHasResult] = useState(false); // hanya true setelah request selesai
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const lastQueryRef = useRef('');
  const debounceRef = useRef(null);

  const handleSearch = async (input) => {
    const query = typeof input === 'string' ? input : input?.target?.value || '';
  setSearchQuery(query);
  lastQueryRef.current = query;
    setHasResult(false); // reset state sebelum request baru

    // bersihkan debounce sebelumnya
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

  if (!query.trim()) {
    setCustomers([]);
    setSelectedCustomer(null);
    setLoading(false);
      setHasResult(false);
    return;
  }

  setLoading(true);
  
  // Debounce: tunggu 300ms sebelum call API
    debounceRef.current = setTimeout(async () => {
      const currentQuery = lastQueryRef.current;
      if (currentQuery !== query) {
      return;
    }

      try {
    const result = await searchCustomer(query);

        // Pastikan masih relevan
    if (lastQueryRef.current !== query) {
      return;
    }

    if (result.success) {
          const customersData = result.data || [];
          setCustomers(customersData);
          
          // Log history
          addHistory('SEARCH', {
            query: query,
            resultCount: customersData.length,
          });
    } else {
      setCustomers([]);
      console.error(result.error);
          
          // Log history meski tidak ada hasil
          addHistory('SEARCH', {
            query: query,
            resultCount: 0,
          });
        }
      } catch (err) {
        console.error('searchCustomer error:', err);
        setCustomers([]);
      } finally {
        if (lastQueryRef.current === query) {
    setLoading(false);
          setHasResult(true);
        }
      }
  }, 300);
  };

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Load last query on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      // set state and trigger search with saved query
      setSearchQuery(saved);
      lastQueryRef.current = saved;
      handleSearch(saved);
    }
  }, []);

  // Persist query locally
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (searchQuery) {
      localStorage.setItem(STORAGE_KEY, searchQuery);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [searchQuery]);

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
  };

  return (
    <div className="customer-search">
      <input
        type="text"
        placeholder="🔍 Cari berdasarkan Nama, ID, atau Kota..."
        value={searchQuery}
        onChange={handleSearch}
        className="search-input"
      />

      {loading && <p className="loading">⏳ Loading...</p>}

      {!loading && hasResult && searchQuery.trim() && customers.length === 0 && (
        <p className="no-data">❌ Tidak ada hasil</p>
      )}

      {!loading && !searchQuery.trim() && customers.length === 0 && (
        <p className="no-data">💡 Masukkan pencarian</p>
      )}

      <div className="customer-list">
        {customers.map((customer, idx) => {
          console.log('customer item', customer);
          return (
            <div
              key={idx}
              className={`customer-card ${
                selectedCustomer?.id === customer.id ? 'selected' : ''
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
                  />
                </div>
              )}
            </div>
          );
        })}
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
