import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
// import QRCode from 'react-qr-code'; // Removed to prevent lag on huge lists

import { Icons } from './Icons';
import { addHistory } from '../utils/history';
import BatchGeneratorModal from './BatchGeneratorModal'; // NEW
import './CustomerSearch.css';

const STORAGE_KEY = 'qr:lastSearchQuery';

export default function CustomerSearch({
  customers = [],
  onSelect,
  onSync,
  isSyncing,
  lastUpdated,
  initialQuery,
  onScanTrigger
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState('grid');
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false); // NEW

  // 1. Handle Initial Query (e.g. from History)
  useEffect(() => {
    if (initialQuery) {
      setSearchQuery(initialQuery);
    }
  }, [initialQuery]);

  // 2. Initial Load from LocalStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && !initialQuery) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setSearchQuery(saved);

      const savedView = localStorage.getItem('qr:viewMode');
      if (savedView) setActiveView(savedView);
    }
  }, [initialQuery]);

  // 3. Persist View and Query
  const toggleView = (mode) => {
    setActiveView(mode);
    localStorage.setItem('qr:viewMode', mode);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (searchQuery) localStorage.setItem(STORAGE_KEY, searchQuery);
      else localStorage.removeItem(STORAGE_KEY);
    }
  }, [searchQuery]);

  // 4. Log Search History
  const queryRef = useRef(searchQuery);
  useEffect(() => {
    queryRef.current = searchQuery;
  }, [searchQuery]);

  useEffect(() => {
    return () => {
      const finalQuery = queryRef.current;
      if (finalQuery && finalQuery.trim().length > 2) {
        addHistory('SEARCH', {
          query: finalQuery,
          timestamp: new Date()
        });
      }
    };
  }, []);

  // 5. Filter Logic (Debounced)
  useEffect(() => {
    // Start searching immediately when query changes
    if (searchQuery.trim()) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
      setFilteredCustomers([]);
    }

    const timer = setTimeout(() => {
      const query = searchQuery.toLowerCase().trim();

      if (!query) {
        setFilteredCustomers([]);
        setIsSearching(false);
        return;
      }

      const terms = query.split(/\s+/).filter(Boolean);
      const results = customers.filter(c => {
        if (c.nama && c.nama.toLowerCase().includes(query)) return true;
        const haystack = `${c.id || ''} ${c.nama || ''} ${c.kota || ''} ${c.pabrik || ''} ${c.sales || ''}`.toLowerCase();
        return terms.every(term => haystack.includes(term));
      });

      setFilteredCustomers(results);
      setIsSearching(false); // Search done
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
            style={{ paddingLeft: 40, paddingRight: 40 }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: '#999',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 4
              }}
              title="Bersihkan Pencarian"
            >
              <Icons.Close size={18} />
            </button>
          )}
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

      {/* View Controls & Tools */}
      <div className="view-controls" style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between' }}>
        <div>
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

        <button
          className="view-btn"
          style={{ background: '#4f46e5', color: 'white', border: 'none' }}
          onClick={() => setShowBatchModal(true)}
          title="Batch Generator Tools"
        >
          <span>⚡ Batch Tools</span>
        </button>
      </div>

      {/* INFO META */}
      {lastUpdated && (
        <p className="last-updated">
          Data terakhir: {lastUpdated.toLocaleTimeString()} {lastUpdated.toLocaleDateString()}
        </p>
      )}

      {/* SKELETON LOADING */}
      {(isSyncing || isSearching) && (
        <div style={{ marginBottom: 20 }}>
          <Skeleton count={3} height={40} style={{ marginBottom: 10 }} />
        </div>
      )}

      {/* EMPTY STATES */}
      {!isSyncing && !isSearching && searchQuery.trim() && filteredCustomers.length === 0 && (
        <p className="no-data">❌ Tidak ada hasil. Coba "Sync" jika data barusan diinput.</p>
      )}

      {!isSyncing && !searchQuery.trim() && (
        <p className="no-data">💡 Ketik untuk mencari dari local data</p>
      )}

      {/* CUSTOMER LIST: Only render if we have a query and results */}
      {searchQuery.trim().length > 0 && filteredCustomers.length > 0 && (
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
            </div>
          ))}
        </div>
      )}
      {/* Floating Scan Button */}
      <button
        onClick={onScanTrigger}
        style={{
          position: 'fixed',
          bottom: 80, // Above bottom nav if present, or just bottom right
          right: 20,
          background: '#D4AF37',
          color: 'white',
          border: 'none',
          borderRadius: 50,
          width: 56,
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
          zIndex: 100,
          cursor: 'pointer'
        }}
        title="Scan QR Code"
      >
        <Icons.Scan size={28} />
      </button>

      {showBatchModal && (
        <BatchGeneratorModal
          customers={customers}
          onClose={() => setShowBatchModal(false)}
          onSync={onSync}
        />
      )}
    </div>
  );
}
