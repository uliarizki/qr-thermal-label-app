import React from 'react';

export default function GuestBookList({
    attendees,
    loading,
    filterDate,
    setFilterDate,
    onRefresh
}) {
    return (
        <div className="attendance-list">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                <h3 style={{ margin: 0 }}>
                    Daftar Hadir: {new Date(filterDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </h3>
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 15, alignItems: 'center' }}>
                <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    style={{
                        padding: '8px 12px',
                        borderRadius: 6,
                        border: '1px solid #ccc',
                        fontSize: 14,
                        fontFamily: 'inherit'
                    }}
                />
                <button onClick={onRefresh} style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: 6, border: '1px solid #ddd', background: 'white' }}>
                    🔄 Refresh Data
                </button>
            </div>

            {loading ? (
                <p>Loading data...</p>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                        <thead>
                            <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                                <th style={{ padding: 10, textAlign: 'left' }}>Jam</th>
                                <th style={{ padding: 10, textAlign: 'left' }}>Nama</th>
                                <th style={{ padding: 10, textAlign: 'left' }}>Lokasi Acara</th>
                                <th style={{ padding: 10, textAlign: 'left' }}>Kota</th>
                                <th style={{ padding: 10, textAlign: 'center' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attendees.filter(guest => {
                                if (!guest.timestamp) return false;
                                // Convert timestamp to YYYY-MM-DD
                                const guestDate = new Date(guest.timestamp).toISOString().split('T')[0];
                                return guestDate === filterDate;
                            }).length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ padding: 20, textAlign: 'center', color: '#999', fontStyle: 'italic' }}>
                                        Tidak ada data untuk tanggal ini.
                                    </td>
                                </tr>
                            ) : (
                                attendees
                                    .filter(guest => {
                                        if (!guest.timestamp) return false;
                                        const guestDate = new Date(guest.timestamp).toISOString().split('T')[0];
                                        return guestDate === filterDate;
                                    })
                                    .map((guest, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: 10 }}>{new Date(guest.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                            <td style={{ padding: 10, fontWeight: 500 }}>{guest.nama}</td>
                                            <td style={{ padding: 10 }}>
                                                <span style={{
                                                    background: '#f3f4f6', padding: '2px 6px', borderRadius: 4,
                                                    fontSize: 11, border: '1px solid #ddd', color: '#444', fontWeight: 'bold'
                                                }}>
                                                    {guest.cabang || '-'}
                                                </span>
                                            </td>
                                            <td style={{ padding: 10, color: '#666' }}>{guest.kota}</td>
                                            <td style={{ padding: 10, textAlign: 'center' }}>
                                                <span style={{ background: '#e6fffa', color: '#047857', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 'bold' }}>Hadir</span>
                                            </td>
                                        </tr>
                                    ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
