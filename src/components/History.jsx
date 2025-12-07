// src/components/History.jsx
import { useState, useEffect } from 'react';
import { getHistory, filterHistoryByAction, clearHistory, formatTimestamp } from '../utils/history';
import './History.css';

export default function History() {
  const [history, setHistory] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    loadHistory();
    // Refresh setiap 5 detik untuk update "X menit lalu"
    const interval = setInterval(loadHistory, 5000);
    return () => clearInterval(interval);
  }, [filter]);

  const loadHistory = () => {
    const filtered = filterHistoryByAction(filter);
    setHistory(filtered);
  };

  const handleClear = () => {
    clearHistory();
    setHistory([]);
    setShowClearConfirm(false);
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'ADD':
        return '➕';
      case 'SEARCH':
        return '🔍';
      case 'SCAN':
        return '📱';
      default:
        return '📋';
    }
  };

  const getActionLabel = (action) => {
    switch (action) {
      case 'ADD':
        return 'Tambah Customer';
      case 'SEARCH':
        return 'Cari Customer';
      case 'SCAN':
        return 'Scan QR Code';
      default:
        return action;
    }
  };

  const renderHistoryItem = (item, index) => {
    const { timestamp, action, details } = item;

    return (
      <div key={index} className="history-item">
        <div className="history-icon">{getActionIcon(action)}</div>
        <div className="history-content">
          <div className="history-header">
            <span className="history-action">{getActionLabel(action)}</span>
            <span className="history-time">{formatTimestamp(timestamp)}</span>
          </div>
          <div className="history-details">
            {action === 'ADD' && (
              <div>
                <strong>{details.nama || 'Customer'}</strong>
                {details.customerId && <span className="history-id"> ({details.customerId})</span>}
                {details.kota && <span> - {details.kota}</span>}
              </div>
            )}
            {action === 'SEARCH' && (
              <div>
                Query: <strong>"{details.query}"</strong>
                {details.resultCount !== undefined && (
                  <span className="history-result">
                    {' '}
                    ({details.resultCount} hasil)
                  </span>
                )}
              </div>
            )}
            {action === 'SCAN' && (
              <div>
                <strong>{details.nama || 'Customer'}</strong>
                {details.customerId && <span className="history-id"> ({details.customerId})</span>}
                {details.kota && <span> - {details.kota}</span>}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="history-container">
      <div className="history-header-section">
        <h2>📊 History</h2>
        <div className="history-controls">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="history-filter"
          >
            <option value="ALL">Semua</option>
            <option value="ADD">Tambah Customer</option>
            <option value="SEARCH">Pencarian</option>
            <option value="SCAN">Scan QR</option>
          </select>
          {history.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="clear-history-btn"
            >
              🗑️ Hapus History
            </button>
          )}
        </div>
      </div>

      {showClearConfirm && (
        <div className="clear-confirm">
          <p>Yakin hapus semua history?</p>
          <div className="clear-confirm-buttons">
            <button onClick={handleClear} className="confirm-btn">
              Ya, Hapus
            </button>
            <button
              onClick={() => setShowClearConfirm(false)}
              className="cancel-btn"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {history.length === 0 ? (
        <div className="history-empty">
          <p>📭 Belum ada history</p>
          <p className="history-empty-hint">
            History akan muncul setelah Anda melakukan pencarian, scan QR, atau
            menambah customer.
          </p>
        </div>
      ) : (
        <div className="history-list">
          {history.map((item, index) => renderHistoryItem(item, index))}
        </div>
      )}
    </div>
  );
}


