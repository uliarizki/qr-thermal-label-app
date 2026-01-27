import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { getGlobalHistory } from '../utils/googleSheets';
import { useAuth } from '../context/AuthContext';

export default function AdminLogs() {
    const { user } = useAuth();
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const loadHistory = async () => {
        setLoadingHistory(true);
        const res = await getGlobalHistory(user.role);
        setLoadingHistory(false);
        if (res.success) {
            setHistory(res.data);
        } else {
            toast.error('Gagal load history: ' + res.error);
        }
    };

    useEffect(() => {
        loadHistory();
    }, []);

    // Helper to render details column
    const renderDetails = (row) => {
        let details = row.details;
        try {
            const parsed = JSON.parse(row.details);

            // FORMAT: SEARCH_SELECT (Refined)
            if (row.activity === 'SEARCH_SELECT') {
                const query = parsed.query || '-';
                const custInfo = parsed.customerId ? `[${parsed.customerId}] ${parsed.customerName}` : parsed.customerName || 'Unknown';
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ fontSize: 13 }}>
                            <span style={{ color: '#666' }}>Dicari:</span> <strong>{query}</strong>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#10b981' }}>
                            <span>➝ Dipilih:</span>
                            <span style={{
                                background: '#ecfdf5',
                                color: '#047857',
                                padding: '2px 8px',
                                borderRadius: 4,
                                fontWeight: 600,
                                border: '1px solid #a7f3d0'
                            }}>
                                {custInfo}
                            </span>
                        </div>
                    </div>
                );
            }
            // FORMAT: SCAN
            else if (row.activity === 'SCAN') {
                return (
                    <span>
                        📱 Scan: <span className="tag-id">{parsed.customerId}</span> <b>{parsed.nama}</b> ({parsed.kota})
                    </span>
                );
            }
            // FORMAT: LOGIN/LOGOUT
            else if (row.activity === 'LOGIN' || row.activity === 'LOGOUT') {
                return <span style={{ color: '#888', fontStyle: 'italic' }}>Session Access</span>;
            }
            // FORMAT: REGISTER
            else if (row.activity === 'REGISTER_USER') {
                return <span>👤 New User: <b>{parsed.newUser}</b> (Role: {parsed.role})</span>;
            }
        } catch (e) {
            // Keep original string if parse fails
        }

        return (typeof details === 'object' ? JSON.stringify(details) : String(details));
    };

    return (
        <div className="admin-logs">
            {/* SECTION 2: GLOBAL STATS */}
            <div className="admin-section" style={{ background: '#f8f9fa', padding: 20, borderRadius: 12, border: '1px solid #eee', marginBottom: 20 }}>
                <h3>📊 System Status</h3>
                <p>Total History Logged: <strong>{history.length}</strong> activities</p>
                <p>Admin Active: <strong>{user.username}</strong></p>
                <button className="sync-btn" onClick={loadHistory} disabled={loadingHistory}>
                    🔄 Refresh Log
                </button>
            </div>

            {/* SECTION 4: GLOBAL ACTIVITY LOG */}
            <div style={{ marginTop: 10 }}>
                <h3>📜 Global Activity Log (Last 100)</h3>
                {loadingHistory && <p>Loading...</p>}
                <div className="history-table-container">
                    <table className="history-table">
                        <thead>
                            <tr>
                                <th width="180">Time</th>
                                <th width="100">User</th>
                                <th width="120">Activity</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((row, idx) => (
                                <tr key={idx}>
                                    <td className="col-time">{new Date(row.timestamp).toLocaleString()}</td>
                                    <td className="col-user">
                                        <span className={`role-badge ${row.user === 'admin' ? 'admin' : 'user'}`}>
                                            {row.user}
                                        </span>
                                    </td>
                                    <td className="col-activity"><strong>{row.activity}</strong></td>
                                    <td className="col-details">
                                        {renderDetails(row)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
