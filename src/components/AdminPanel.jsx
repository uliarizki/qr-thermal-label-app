import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './AdminPanel.css';
import AdminUsers from './AdminUsers';
import AdminLogs from './AdminLogs';

export default function AdminPanel() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('users');

    if (user?.role !== 'admin') {
        return <div className="page-card">❌ Unauthorized Access</div>;
    }

    return (
        <div className="admin-panel">
            <div className="page-card" style={{ borderColor: '#D4AF37' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h2 style={{ margin: 0, color: '#D4AF37' }}>👑 Admin Control Center</h2>

                    {/* TAB NAVIGATION */}
                    <div className="view-toggles">
                        <button
                            className={`view-btn ${activeTab === 'users' ? 'active' : ''}`}
                            onClick={() => setActiveTab('users')}
                        >
                            👥 Users
                        </button>
                        <button
                            className={`view-btn ${activeTab === 'logs' ? 'active' : ''}`}
                            onClick={() => setActiveTab('logs')}
                        >
                            📜 Logs & Stats
                        </button>
                    </div>
                </div>

                <div className="admin-content">
                    {activeTab === 'users' ? <AdminUsers /> : <AdminLogs />}
                </div>
            </div>
        </div>
    );
}
