import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { registerUser, getGlobalHistory, getUsers, deleteUser } from '../utils/googleSheets';
import { toast } from 'react-hot-toast';
import './AdminPanel.css';
import AnalyticsCharts from './AnalyticsCharts';

export default function AdminPanel() {
    const { user } = useAuth();

    // States for Create User
    const [newUser, setNewUser] = useState('');
    const [newPass, setNewPass] = useState('');
    const [newRole, setNewRole] = useState('user'); // user | admin
    const [isCreating, setIsCreating] = useState(false);

    // States for Global History
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // States for User List
    const [userList, setUserList] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    const handleCreateUser = async (e) => {
        e.preventDefault();
        if (!newUser || !newPass) {
            toast.error('Username & Password wajib diisi');
            return;
        }

        setIsCreating(true);
        const res = await registerUser(newUser, newPass, newRole, user.role);
        setIsCreating(false);

        if (res.success) {
            toast.success(`User '${newUser}' berhasil dibuat!`);
            setNewUser('');
            setNewPass('');
            loadUsers(); // Refresh list
        } else {
            toast.error('Gagal: ' + res.error);
        }
    };

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

    const loadUsers = async () => {
        setLoadingUsers(true);
        const res = await getUsers(user.role);
        setLoadingUsers(false);
        if (res.success) {
            setUserList(res.data);
        } else {
            toast.error('Gagal load users: ' + res.error);
        }
    };

    const handleDeleteUser = async (targetUser) => {
        if (!window.confirm(`Yakin hapus user '${targetUser}'?`)) return;

        const toastId = toast.loading('Deleting...');
        const res = await deleteUser(user.username, user.role, targetUser);

        if (res.success) {
            toast.success('User deleted!', { id: toastId });
            loadUsers();
        } else {
            toast.error('Gagal hapus: ' + res.error, { id: toastId });
        }
    };

    // Load history on mount
    useEffect(() => {
        loadHistory();
        loadUsers();
    }, []);

    if (user?.role !== 'admin') {
        return <div className="page-card">❌ Unauthorized Access</div>;
    }

    return (
        <div className="admin-panel">
            <div className="page-card" style={{ borderColor: '#D4AF37' }}>
                <h2 style={{ marginTop: 0, color: '#D4AF37' }}>👑 Admin Control Center</h2>

                <div className="admin-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>

                    {/* SECTION 1: CREATE USER */}
                    <div className="admin-section" style={{ background: '#fffdf5', padding: 20, borderRadius: 12, border: '1px solid #eee' }}>
                        <h3>👤 Create New User</h3>
                        <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <input
                                placeholder="Username (e.g. gudang)"
                                value={newUser}
                                onChange={e => setNewUser(e.target.value)}
                                className="search-input"
                            />
                            <input
                                placeholder="Password"
                                type="password"
                                value={newPass}
                                onChange={e => setNewPass(e.target.value)}
                                className="search-input"
                            />
                            <select
                                value={newRole}
                                onChange={e => setNewRole(e.target.value)}
                                className="search-input"
                            >
                                <option value="user">User Biasa (Gudang/Sales)</option>
                                <option value="admin">Admin (Full Access)</option>
                            </select>
                            <button
                                type="submit"
                                className="sync-btn"
                                disabled={isCreating}
                                style={{ justifyContent: 'center', background: '#D4AF37', color: 'white', borderColor: '#D4AF37' }}
                            >
                                {isCreating ? 'Creating...' : '➕ Create User'}
                            </button>
                        </form>
                    </div>

                    {/* SECTION 1.5: USER LIST */}
                    <div className="admin-section" style={{ background: '#fff', padding: 20, borderRadius: 12, border: '1px solid #eee' }}>
                        <h3>👥 User List</h3>
                        {loadingUsers ? <p>Loading users...</p> : (
                            <ul className="user-list" style={{ listStyle: 'none', padding: 0 }}>
                                {userList.map((u, idx) => (
                                    <li key={idx} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '8px 0', borderBottom: '1px solid #eee'
                                    }}>
                                        <div>
                                            <strong>{u.username}</strong>
                                            <span style={{
                                                marginLeft: 8, fontSize: 11, padding: '2px 6px',
                                                background: u.role === 'admin' ? '#fde68a' : '#e5e7eb',
                                                borderRadius: 4
                                            }}>{u.role}</span>
                                        </div>
                                        {u.username !== user.username && (
                                            <button
                                                onClick={() => handleDeleteUser(u.username)}
                                                style={{
                                                    background: '#fee2e2', color: '#dc2626', border: 'none',
                                                    padding: '4px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 12
                                                }}
                                            >
                                                🗑️
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                        <button className="text-btn" onClick={loadUsers} style={{ fontSize: 12, marginTop: 10 }}>🔄 Refresh List</button>
                    </div>

                    {/* SECTION 2: GLOBAL STATS (Placeholder) */}
                    <div className="admin-section" style={{ background: '#f8f9fa', padding: 20, borderRadius: 12, border: '1px solid #eee' }}>
                        <h3>📊 System Status</h3>
                        <p>Total History Logged: <strong>{history.length}</strong> activities</p>
                        <p>Admin Active: <strong>{user.username}</strong></p>
                        <button className="sync-btn" onClick={loadHistory} disabled={loadingHistory}>
                            🔄 Refresh Log
                        </button>
                    </div>

                </div>

                {/* SECTION 3: ANALYTICS DASHBOARD (DISABLED FOR DEBUG) */}
                {/* {history.length > 0 && <AnalyticsCharts history={history} />} */}

                {/* SECTION 4: GLOBAL ACTIVITY LOG */}
                <div style={{ marginTop: 30 }}>
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
                                {history.map((row, idx) => {
                                    // Parse Details Safely
                                    let details = row.details;
                                    try {
                                        const parsed = JSON.parse(row.details);

                                        // FORMAT: SEARCH_SELECT (Refined)
                                        if (row.activity === 'SEARCH_SELECT') {
                                            const query = parsed.query || '-';
                                            const custInfo = parsed.customerId ? `[${parsed.customerId}] ${parsed.customerName}` : parsed.customerName || 'Unknown';
                                            details = (
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
                                            details = (
                                                <span>
                                                    📱 Scan: <span className="tag-id">{parsed.customerId}</span> <b>{parsed.nama}</b> ({parsed.kota})
                                                </span>
                                            );
                                        }
                                        // FORMAT: LOGIN/LOGOUT
                                        else if (row.activity === 'LOGIN' || row.activity === 'LOGOUT') {
                                            details = <span style={{ color: '#888', fontStyle: 'italic' }}>Session Access</span>;
                                        }
                                        // FORMAT: REGISTER
                                        else if (row.activity === 'REGISTER_USER') {
                                            details = <span>👤 New User: <b>{parsed.newUser}</b> (Role: {parsed.role})</span>;
                                        }
                                    } catch (e) {
                                        // Keep original string if parse fails
                                    }

                                    return (
                                        <tr key={idx}>
                                            <td className="col-time">{new Date(row.timestamp).toLocaleString()}</td>
                                            <td className="col-user">
                                                <span className={`role-badge ${row.user === 'admin' ? 'admin' : 'user'}`}>
                                                    {row.user}
                                                </span>
                                            </td>
                                            <td className="col-activity"><strong>{row.activity}</strong></td>
                                            <td className="col-details">{details}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
