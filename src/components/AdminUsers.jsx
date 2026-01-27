import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { registerUser, getUsers, deleteUser } from '../utils/googleSheets';
import { useAuth } from '../context/AuthContext';

export default function AdminUsers() {
    const { user } = useAuth();

    // States for Create User
    const [newUser, setNewUser] = useState('');
    const [newPass, setNewPass] = useState('');
    const [newRole, setNewRole] = useState('user'); // user | admin
    const [isCreating, setIsCreating] = useState(false);

    // States for User List
    const [userList, setUserList] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

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

    // Load users on mount
    useEffect(() => {
        loadUsers();
    }, []);

    return (
        <div className="admin-grid">
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
                                        title="Hapus User"
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
        </div>
    );
}
