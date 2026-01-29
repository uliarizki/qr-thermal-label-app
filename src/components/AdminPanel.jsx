import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './AdminPanel.css';
import AdminUsers from './AdminUsers';
import AdminLogs from './AdminLogs';

import { saveAs } from 'file-saver';
import { useCustomer } from '../context/CustomerContext';

export default function AdminPanel() {
    const { user } = useAuth();
    const { customers } = useCustomer();
    const [activeTab, setActiveTab] = useState('users');

    if (user?.role !== 'admin') {
        return <div className="page-card">❌ Unauthorized Access</div>;
    }

    const handleExportBackup = () => {
        try {
            const dataStr = JSON.stringify(customers, null, 2);
            const blob = new Blob([dataStr], { type: "application/json;charset=utf-8" });
            const fileName = `backup_customers_${new Date().toISOString().slice(0, 10)}.json`;
            saveAs(blob, fileName);
            alert(`✅ Backup downloaded: ${fileName}\n(${customers.length} records)`);
        } catch (error) {
            console.error("Export failed:", error);
            alert("Export failed: " + error.message);
        }
    };

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
                            📜 Logs
                        </button>
                        <button
                            className={`view-btn ${activeTab === 'data' ? 'active' : ''}`}
                            onClick={() => setActiveTab('data')}
                        >
                            💾 Data
                        </button>
                    </div>
                </div>

                <div className="admin-content">
                    {activeTab === 'users' && <AdminUsers />}
                    {activeTab === 'logs' && <AdminLogs />}
                    {activeTab === 'data' && (
                        <div className="data-management">
                            <div style={{ padding: 20, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                                <h3 style={{ marginTop: 0 }}>💾 Data Backup</h3>
                                <p>Download a complete copy of your customer database as a JSON file.</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 15 }}>
                                    <button
                                        onClick={handleExportBackup}
                                        className="action-btn primary"
                                        style={{ padding: '10px 20px', fontSize: '1rem' }}
                                    >
                                        ⬇️ Download Backup JSON
                                    </button>
                                    <span style={{ color: '#64748b' }}>
                                        ({customers.length} records ready)
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
