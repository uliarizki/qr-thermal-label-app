import { useState, useRef } from 'react';
import { searchCustomer } from '../utils/googleSheets';
import PrintPreview from './PrintPreview';
import './CustomerSearch.css';

export default function CustomerSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const lastQueryRef = useRef('');

const handleSearch = async (e) => {
  const query = e.target.value;
  setSearchQuery(query);
  lastQueryRef.current = query;

  if (!query.trim()) {
    setCustomers([]);
    setSelectedCustomer(null);
    setLoading(false);
    return;
  }

  setLoading(true);
  
  // Debounce: tunggu 300ms sebelum call API
  const timeoutId = setTimeout(async () => {
    if (lastQueryRef.current !== query) {
      setLoading(false);
      return;
    }

    const result = await searchCustomer(query);

    if (lastQueryRef.current !== query) {
      setLoading(false);
      return;
    }

    if (result.success) {
      setCustomers(result.data || []);
    } else {
      setCustomers([]);
      console.error(result.error);
    }
    setLoading(false);
  }, 300);

  return () => clearTimeout(timeoutId);
};

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

      {!loading && searchQuery.trim() && customers.length === 0 && (
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
