import React from 'react';

export default function GuestBookForm({
    showScanner,
    setShowScanner,
    searchQuery,
    setSearchQuery,
    searchResults,
    handleSelectCustomer,
    manualForm,
    setManualForm,
    handleManualSubmit,
    setBranch
}) {
    return (
        <div className="manual-form" style={{ padding: 20, background: '#f9f9f9', borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                <h3 style={{ margin: 0 }}>Input Tamu / Member</h3>
                {/* Button to switch to Scanner */}
                <button
                    onClick={() => setShowScanner(true)}
                    style={{
                        padding: '8px 16px',
                        background: '#333',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: 13,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        cursor: 'pointer'
                    }}
                >
                    📷 Buka Scanner
                </button>
            </div>

            {/* SEARCH BAR (Moved Uppermost) */}
            <div className="form-group" style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 5, fontSize: 13, fontWeight: 600 }}>Cari Member (ID / Nama)</label>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ketik nama atau ID..."
                    style={{ width: '100%', padding: 12, borderRadius: 6, border: '1px solid #ddd', fontSize: 16 }}
                />
                {/* Search Results */}
                {searchQuery && (
                    <div style={{ marginTop: 5, border: '1px solid #eee', borderRadius: 6, background: 'white', maxHeight: 200, overflowY: 'auto' }}>
                        {searchResults.length > 0 ? (
                            searchResults.map(cust => (
                                <div
                                    key={cust.id}
                                    onClick={() => handleSelectCustomer(cust)}
                                    style={{ padding: '10px', borderBottom: '1px solid #eee', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                >
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <div style={{ fontWeight: 'bold' }}>{cust.nama}</div>
                                            {cust.cabang && (
                                                <span style={{
                                                    fontSize: 10,
                                                    padding: '2px 6px',
                                                    borderRadius: 4,
                                                    border: cust.cabang.includes('SBY') ? '1px solid #fde047' :
                                                        cust.cabang.includes('SMG') ? '1px solid #86efac' :
                                                            cust.cabang.includes('JKT') ? '1px solid #93c5fd' : '1px solid #eee',
                                                    background: cust.cabang.includes('SBY') ? '#fefce8' :
                                                        cust.cabang.includes('SMG') ? '#f0fdf4' :
                                                            cust.cabang.includes('JKT') ? '#eff6ff' : '#f3f4f6',
                                                    color: cust.cabang.includes('SBY') ? '#854d0e' :
                                                        cust.cabang.includes('SMG') ? '#166534' :
                                                            cust.cabang.includes('JKT') ? '#1e40af' : '#666',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {cust.cabang}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: 12, color: '#666' }}>{cust.kota} | {cust.id}</div>
                                    </div>
                                    <button style={{ background: '#e6fffa', color: '#047857', border: 'none', padding: '4px 8px', borderRadius: 4, cursor: 'pointer' }}>Pilih</button>
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: 10, fontStyle: 'italic', color: '#999' }}>Data tidak ditemukan. Silakan isi form di bawah untuk tamu baru.</div>
                        )}
                    </div>
                )}
            </div>

            <hr style={{ border: 'none', borderTop: '1px dashed #ddd', margin: '20px 0' }} />

            {/* NEW USER FORM */}
            <h4 style={{ marginTop: 0, marginBottom: 15, color: '#d97706' }}>📝 Formulir Tamu Baru</h4>
            <form onSubmit={handleManualSubmit}>
                {/* BRANCH CONTEXT SELECTOR (Moved Here) */}
                <div className="form-group" style={{ marginBottom: 15 }}>
                    <label style={{ display: 'block', marginBottom: 5, fontSize: 13, fontWeight: 600 }}>Lokasi Acara (Cabang)</label>
                    <div style={{ display: 'flex', gap: 10 }}>
                        {['BT SMG', 'BT JKT', 'BT SBY'].map(br => (
                            <button
                                key={br}
                                type="button"
                                onClick={() => setBranch(br)}
                                style={{
                                    flex: 1, padding: '10px',
                                    border: manualForm.cabang === br ? '2px solid #D4AF37' : '1px solid #ddd',
                                    background: manualForm.cabang === br ? '#fffdf5' : 'white',
                                    color: manualForm.cabang === br ? '#D4AF37' : '#666',
                                    borderRadius: 6, cursor: 'pointer', fontWeight: manualForm.cabang === br ? 'bold' : 'normal'
                                }}
                            >
                                {br}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="form-group" style={{ marginBottom: 15 }}>
                    <label style={{ display: 'block', marginBottom: 5, fontSize: 13, fontWeight: 600 }}>Nama Lengkap</label>
                    <input
                        type="text"
                        className="input-field"
                        value={manualForm.nama}
                        onChange={(e) => setManualForm({ ...manualForm, nama: e.target.value })}
                        placeholder="Contoh: Budi Santoso"
                        style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd' }}
                        required={!searchQuery} // Required only if manually adding
                    />
                </div>

                <div className="form-group" style={{ marginBottom: 15 }}>
                    <label style={{ display: 'block', marginBottom: 5, fontSize: 13, fontWeight: 600 }}>Kota Asal</label>
                    <input
                        type="text"
                        className="input-field"
                        value={manualForm.kota}
                        onChange={(e) => setManualForm({ ...manualForm, kota: e.target.value })}
                        placeholder="Contoh: Surabaya"
                        style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd' }}
                        required={!searchQuery}
                    />
                </div>
                <div className="form-group" style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', marginBottom: 5, fontSize: 13, fontWeight: 600 }}>No. HP (Opsional)</label>
                    <input
                        type="text"
                        className="input-field"
                        value={manualForm.hp}
                        onChange={(e) => setManualForm({ ...manualForm, hp: e.target.value })}
                        placeholder="081..."
                        style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd' }}
                    />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button type="submit" style={{ flex: 1, padding: 12, background: '#D4AF37', color: 'white', border: 'none', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer' }}>
                        ➕ Simpan & Hadir
                    </button>
                </div>
            </form>
        </div>
    );
}
