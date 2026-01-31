import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { toast } from 'react-hot-toast';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
// import QRCode from 'react-qr-code'; // Removed to prevent lag on huge lists

import { Icons } from './Icons';
import { addHistory } from '../utils/history';
import CustomerCard from './CustomerCard'; // MEMOIZED
import { CustomerCardSkeleton } from './CustomerCardSkeleton'; // SKELETON
const BatchGeneratorModal = lazy(() => import('./BatchGeneratorModal')); // LAZY LOADED
import './CustomerSearch.css';

const STORAGE_KEY = 'qr:lastSearchQuery';

import { useCustomer } from '../context/CustomerContext';

export default function CustomerSearch({
  initialQuery,
  onScanTrigger
}) {
  const {
    customers,
    setSelectedCustomer,
    syncCustomers,
    isSyncing,
    lastUpdated
  } = useCustomer();
  const [activeBranch, setActiveBranch] = useState('ALL'); // NEW: Branch Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState('list');
  const [isSearching, setIsSearching] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [visibleLimit, setVisibleLimit] = useState(50); // Increased from 20 to 50
  const [showBatchModal, setShowBatchModal] = useState(false);
  const loaderRef = useRef(null); // Sentinel Ref

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

      const savedBranch = localStorage.getItem('qr:activeBranch');
      if (savedBranch) setActiveBranch(savedBranch);
    }
  }, [initialQuery]);

  // 3. Persist View, Query, and Branch
  const toggleView = (mode) => {
    setActiveView(mode);
    localStorage.setItem('qr:viewMode', mode);
  };

  const handleBranchChange = (branch) => {
    setActiveBranch(branch);
    localStorage.setItem('qr:activeBranch', branch);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (searchQuery) localStorage.setItem(STORAGE_KEY, searchQuery);
      else localStorage.removeItem(STORAGE_KEY);
    }
  }, [searchQuery]);

  // 4. Log Search History (existing logic...)
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

  // 5. Smart Search Logic (Weighted Scoring)
  useEffect(() => {
    // Start searching immediately when query changes or branch changes
    if (searchQuery.trim() || activeBranch !== 'ALL') {
      setIsSearching(true);
    } else {
      setIsSearching(false);
      setFilteredCustomers([]);
    }

    const timer = setTimeout(() => {
      const query = searchQuery.toLowerCase().trim();

      // IF no query, show ALL (filtered by branch if active)
      if (!query && activeBranch === 'ALL') {
        setFilteredCustomers(customers);
        setIsSearching(false);
        return;
      }

      // If we have a query OR branch filter:
      const terms = query.split(/\s+/).filter(Boolean);

      // Map customers to { customer, score }
      const scoredResults = customers.map(c => {
        let score = 0;

        // 1. Branch Filter Scope (Hard Filter - If fails, score is 0/Exclude)
        if (activeBranch !== 'ALL') {
          const cBranch = (c.cabang || '').toUpperCase();
          if (!cBranch.includes(activeBranch)) return { c, score: -1 }; // Exclude
        }

        // 2. If no text query, but passed branch filter -> keep it (score 1 to include)
        if (!query) return { c, score: 1 };

        // 3. Relevance Scoring
        const cId = String(c.id || '').toLowerCase();
        const cName = String(c.nama || '').toLowerCase();
        const cCity = String(c.kota || '').toLowerCase();
        const cBranch = String(c.cabang || '').toLowerCase();
        const cMeta = `${c.pabrik || ''} ${c.sales || ''}`.toLowerCase();

        // A. ID Match (Highest Priority)
        if (cId === query) score += 100;
        else if (cId.includes(query)) score += 80;

        // B. Name Match
        if (cName === query) score += 60; // Exact Name
        else if (cName.startsWith(query)) score += 50; // Starts With
        else if (cName.includes(query)) score += 20; // Contains

        // C. Term Matching (for "Name City" support)
        // Check if ALL terms match something in the record
        // Increased score for each term matched in specific fields
        const allTermsMatch = terms.every(term => {
          let termMatched = false;

          if (cName.includes(term)) { score += 5; termMatched = true; }
          if (cCity.includes(term)) { score += 10; termMatched = true; } // Boost city relevance
          if (cBranch.includes(term)) { score += 5; termMatched = true; }
          if (cId.includes(term)) { termMatched = true; }
          if (cMeta.includes(term)) { score += 2; termMatched = true; }

          return termMatched;
        });

        if (!allTermsMatch) return { c, score: -1 }; // If any term misses, exclude

        return { c, score };
      });

      // Filter & Sort
      const results = scoredResults
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score) // Descending
        .map(item => item.c);

      setFilteredCustomers(results);
      setIsSearching(false); // Search done
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, activeBranch, customers]);


  // 6. Handle Selection
  const handleCardClick = (customer) => {
    setSelectedCustomer(customer);
  };

  // 7. Reset Pagination on Search/Branch Change
  useEffect(() => {
    setVisibleLimit(50);
  }, [searchQuery, activeBranch]);

  // 8. Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting) {
          setVisibleLimit((prev) => prev + 50);
        }
      },
      { threshold: 1.0 }
    );

    const currentLoader = loaderRef.current;
    if (currentLoader) {
      observer.observe(currentLoader);
    }

    return () => {
      if (currentLoader) observer.unobserve(currentLoader);
    };
  }, [filteredCustomers, visibleLimit]); // Re-attach when list changes

  return (
    <div className="customer-search page-card">
      {/* SEARCH HEADER */}
      <div className="search-header-container" style={{ flexWrap: 'wrap', gap: 10 }}>

        {/* BRANCH FILTER DROPDOWN */}
        <select
          value={activeBranch}
          onChange={(e) => handleBranchChange(e.target.value)}
          style={{
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid #ddd',
            outline: 'none',
            fontSize: '14px',
            background: '#fff',
            cursor: 'pointer',
            minWidth: '110px'
            // Mobile optimization needed?
          }}
        >
          <option value="ALL">Semua Cabang</option>
          <option value="BT SMG">BT SMG</option>
          <option value="BT JKT">BT JKT</option>
          <option value="BT SBY">BT SBY</option>
        </select>

        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#999' }}>
            <Icons.Search size={20} />
          </div>
          <input
            type="text"
            placeholder="Cari Nama, ID, Kota..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            style={{ paddingLeft: 40, paddingRight: 40, width: '100%' }}
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
          onClick={() => syncCustomers(false)}
          disabled={isSyncing}
          title="Ambil data terbaru"
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          {isSyncing ? (
            <>
              <span className="spin"><Icons.Refresh size={18} /></span>
              {/* Hide text on small screens if needed */}
            </>
          ) : (
            <>
              <Icons.Refresh size={18} />
            </>
          )}
        </button>
      </div>

      {/* View Controls & Tools */}
      <div className="view-controls" style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between' }}>
        <div className="view-toggles">
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
          style={{ background: 'transparent', color: '#6366f1', border: '1px solid #6366f1' }}
          onClick={() => setShowBatchModal(true)}
          title="Batch Generator Tools"
        >
          <span>⚡ Batch</span>
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
        <div className={`customer-list ${activeView}-view`}>
          {Array.from({ length: 8 }).map((_, idx) => (
            <CustomerCardSkeleton key={idx} viewMode={activeView} />
          ))}
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
      {filteredCustomers.length > 0 && (
        <div className={`customer-list ${activeView}-view`}>
          {filteredCustomers.slice(0, visibleLimit).map((customer, idx) => (
            <CustomerCard
              key={`${customer.id || 'new'}_${idx}`}
              customer={customer}
              onClick={handleCardClick}
            />
          ))}

          {/* Sentinel / Loader */}
          {filteredCustomers.length > visibleLimit && (
            <div
              ref={loaderRef}
              style={{
                textAlign: 'center',
                padding: '20px',
                color: '#888',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 8,
                gridColumn: activeView === 'grid' ? '1 / -1' : 'auto',
                width: '100%'
              }}
            >
              <span className="spin"><Icons.Refresh size={20} /></span>
              <span>Loading more...</span>
            </div>
          )}
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
        <Suspense fallback={<div className="modal-overlay">Loading Tools...</div>}>
          <BatchGeneratorModal
            customers={customers}
            onClose={() => setShowBatchModal(false)}
            onSync={() => syncCustomers(false)}
          />
        </Suspense>
      )}
    </div>
  );
}
