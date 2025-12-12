import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import QRCode from 'react-qr-code';

import { Icons } from './Icons';
import { addHistory } from '../utils/history';
import './CustomerSearch.css';

const STORAGE_KEY = 'qr:lastSearchQuery';

export default function CustomerSearch({
  customers = [],
  onSelect,
  onSync,
  isSyncing,
  lastUpdated,
  initialQuery
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [activeView, setActiveView] = useState('grid'); // 'grid' | 'list'

  // 1. Handle Initial Query (e.g. from History)
  useEffect(() => {
    if (initialQuery) {
      setSearchQuery(initialQuery);
    }
  }, [initialQuery]);

  // 2. Initial Load from LocalStorage (only if no initialQuery provided)
  useEffect(() => {
    if (typeof window !== 'undefined' && !initialQuery) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setSearchQuery(saved);

      const savedView = localStorage.getItem('qr:viewMode');
      if (savedView) setActiveView(savedView);
    }
  }, [initialQuery]);

  // 3. Persist View Preference
  const toggleView = (mode) => {
    setActiveView(mode);
    localStorage.setItem('qr:viewMode', mode);
  };

  // 4. Persist Search Query
  // 4. Persist Search Query
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (searchQuery) localStorage.setItem(STORAGE_KEY, searchQuery);
      else localStorage.removeItem(STORAGE_KEY);
    }
  }, [searchQuery]);

  // 4b. Log Search History on Unmount
  const queryRef = useRef(searchQuery);
  useEffect(() => {
    queryRef.current = searchQuery;
  }, [searchQuery]);

  useEffect(() => {
    return () => {
      const finalQuery = queryRef.current;
      if (finalQuery && finalQuery.trim().length > 2) {
        // Debounce history? Or just log.
        // History util usually handles some deduplication or we can trust the user won't spam page switching.
        addHistory('SEARCH', {
          query: finalQuery,
          timestamp: new Date()
        });
      }
    };
  }, []);


  // 5. Filter Logic (Debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!searchQuery.trim()) {
        setFilteredCustomers([]);
        return;
      }

      const terms = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);

      const results = customers.filter(c => {
        const haystack = `${c.id || ''} ${c.nama || ''} ${c.kota || ''} ${c.pabrik || ''} ${c.sales || ''}`.toLowerCase();
        return terms.every(term => haystack.includes(term));
      });

      setFilteredCustomers(results);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, customers]);

  // 6. Handle Selection
  const handleCardClick = (customer) => {
    if (onSelect) {
      onSelect(customer);
    }
  };

  return (
    <div className="customer-search page-card">
      {/* SEARCH HEADER */}
      <div className="search-header-container">
        <div style={{ position: 'relative', flex: 1 }}>
          <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#999' }}>
            <Icons.Search size={20} />
          </div>
          <input
            type="text"
            placeholder="Cari berdasarkan Nama, ID, atau Kota..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            style={{ paddingLeft: 40 }}
          />
        </div>
        <button
          className="sync-btn"
          onClick={onSync}
          disabled={isSyncing}
          title="Ambil data terbaru dari Google Sheets"
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          {isSyncing ? (
            <>
              <span className="spin"><Icons.Refresh size={18} /></span>
              <span>Sync</span>
            </>
          ) : (
            <>
              <Icons.Refresh size={18} />
              <span>Sync</span>
            </>
          )}
        </button>
      </div>

      {/* VIEW TOGGLE CONTROLS */}
      <div className="view-controls">
        <button
          className={`view-btn ${activeView === 'grid' ? 'active' : ''}`}
          onClick={() => toggleView('grid')}
          title="Tampilan Grid (Kartu)"
        >
          <span style={{ fontSize: 16 }}>🔲</span> Grid
        </button>
        <button
          className={`view-btn ${activeView === 'list' ? 'active' : ''}`}
          onClick={() => toggleView('list')}
          title="Tampilan List (Daftar)"
        >
          <span style={{ fontSize: 16 }}>≣</span> List
        </button>
      </div>

      {/* INFO META */}
      {lastUpdated && (
        <p className="last-updated">
          Data terakhir: {lastUpdated.toLocaleTimeString()} {lastUpdated.toLocaleDateString()}
        </p>
      )}

      {/* SKELETON LOADING */}
      {isSyncing && (
        <div style={{ marginBottom: 20 }}>
          <Skeleton count={3} height={40} style={{ marginBottom: 10 }} />
        </div>
      )}

      {/* EMPTY STATES */}
      {!isSyncing && searchQuery.trim() && filteredCustomers.length === 0 && (
        <p className="no-data">❌ Tidak ada hasil. Coba "Sync" jika data barusan diinput.</p>
      )}

      {!isSyncing && !searchQuery.trim() && filteredCustomers.length === 0 && (
        <p className="no-data">💡 Ketik untuk mencari dari local data</p>
      )}

      {/* CUSTOMER LIST */}
      <div className={`customer-list ${activeView}-view`}>
        {filteredCustomers.map((customer, idx) => (
          <div
            key={customer.id || idx}
            className="customer-card"
            onClick={() => handleCardClick(customer)}
          >
            <div className="customer-header">
              <span className="customer-id">{customer.id}</span>
              <span className="customer-name">{customer.nama}</span>
            </div>
            <div className="customer-details">
              <div className="detail-item city" title="Kota">
                {customer.kota ? `📍 ${customer.kota}` : <span className="empty">-</span>}
              </div>
              <div className="detail-item phone" title="Telepon">
                {customer.telp ? `📱 ${customer.telp}` : <span className="empty">-</span>}
              </div>
              <div className="detail-item factory" title="Pabrik/Cabang">
                {customer.cabang || customer.pabrik ? `🏭 ${customer.cabang || customer.pabrik}` : <span className="empty">-</span>}
              </div>
            </div>
            {/* Show QR in list view or grid, helpful visual */}
            <div className="customer-qr" style={{ background: 'white', padding: 5, display: 'inline-block', borderRadius: 4 }}>
              <QRCode
                value={customer.kode || customer.id || 'N/A'}
                size={64}
                viewBox={`0 0 256 256`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
