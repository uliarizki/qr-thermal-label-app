import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { addCustomer } from '../utils/googleSheets';
import { addHistory } from '../utils/history';
import { Icons } from './Icons';
import './AddCustomer.css';

const INITIAL_STATE = {
  id: '',
  nama: '',
  kota: '',
  sales: '',
  pabrik: '',
  cabang: 'BT SMG',
  telp: ''
};

export default function AddCustomer({ onAdd }) {
  const [formData, setFormData] = useState(INITIAL_STATE);

  const [loading, setLoading] = useState(false);

  // ... (handleChange same)

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Setup upperCasedData up front
    const upperCasedData = {};
    Object.keys(formData).forEach(key => {
      upperCasedData[key] = typeof formData[key] === 'string' ? formData[key].toUpperCase() : formData[key];
    });

    // Validasi mandatory fields
    if (!upperCasedData.nama.trim()) {
      toast.error('Nama customer wajib diisi!');
      return;
    }

    if (!upperCasedData.kota.trim()) {
      toast.error('Kota wajib diisi!');
      return;
    }

    if (!upperCasedData.cabang.trim()) {
      toast.error('Cabang wajib diisi!');
      return;
    }

    setLoading(true); // Start loading
    const toastId = toast.loading('Menambahkan customer...');

    try {
      const result = await addCustomer(upperCasedData);

      if (result.success) {
        toast.success('Customer berhasil ditambahkan!', { id: toastId });
        // Log history
        addHistory('ADD', {
          customerId: upperCasedData.id || 'AUTO',
          nama: upperCasedData.nama,
          kota: upperCasedData.kota,
          cabang: upperCasedData.cabang,
        });
        setFormData(INITIAL_STATE); // Reset form
        if (onAdd) onAdd(upperCasedData); // Update parent list
      } else {
        toast.error('Gagal menambahkan: ' + result.error, { id: toastId });
      }
    } catch (error) {
      toast.error('Terjadi kesalahan: ' + error.message, { id: toastId });
    } finally {
      setLoading(false); // End loading
    }
  };

  return (
    <div className="add-customer page-card">
      <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Icons.Plus size={24} />
        Tambah Customer Baru
      </h2>

      <form onSubmit={handleSubmit}>
        {/* MANDATORY FIELDS */}
        <div className="form-section">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#f59e0b' }}>⭐</span> Data Wajib
          </h3>

          <div className="form-group">
            <label>Nama Customer <span className="required">*</span></label>
            <input
              type="text"
              name="nama"
              value={formData.nama}
              onChange={handleChange}
              placeholder="Contoh: REJEKI BANJAR NEGARA"
              maxLength="100"
              required
            />
          </div>

          <div className="form-group">
            <label>Kota <span className="required">*</span></label>
            <input
              type="text"
              name="kota"
              value={formData.kota}
              onChange={handleChange}
              placeholder="Contoh: SEMARANG"
              maxLength="50"
              required
            />
          </div>

          <div className="form-group">
            {/* ... */}
            <label>Cabang <span className="required">*</span></label>
            <select
              name="cabang"
              value={formData.cabang}
              onChange={handleChange}
              required
            >
              <option value="">-- Pilih Cabang --</option>
              <option value="BT SMG">BT SMG</option>
              <option value="BT JKT">BT JKT</option>
              <option value="BT SBY">BT SBY</option>
              {/* Tambah cabang lain sesuai kebutuhan */}
            </select>
          </div>
        </div>

        {/* OPTIONAL FIELDS */}
        <div className="form-section">
          <h3>📋 Data Tambahan (Opsional)</h3>

          <div className="form-group">
            <label>ID Customer</label>
            <input
              type="text"
              name="id"
              value={formData.id}
              onChange={handleChange}
              placeholder="Kosongkan jika belum ada ID"
              maxLength="20"
            />
            <small>💡 Abaikan jika ID akan dibuat belakangan</small>
          </div>

          <div className="form-group">
            <label>Sales</label>
            <input
              type="text"
              name="sales"
              value={formData.sales}
              onChange={handleChange}
              placeholder="Nama sales (optional)"
              maxLength="50"
            />
          </div>

          <div className="form-group">
            <label>Pabrik</label>
            <input
              type="text"
              name="pabrik"
              value={formData.pabrik}
              onChange={handleChange}
              placeholder="Nama pabrik"
              maxLength="50"
            />
          </div>

          <div className="form-group">
            <label>Nomor Telepon</label>
            <input
              type="tel"
              name="telp"
              value={formData.telp}
              onChange={handleChange}
              placeholder="Contoh: 08132776777"
              maxLength="20"
            />
          </div>
        </div>

        {/* BUTTON */}
        {/* BUTTON */}
        <button type="submit" disabled={loading} className="submit-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {loading ? (
            <>
              <span className="spin"><Icons.Refresh size={20} /></span>
              <span>Menambahkan...</span>
            </>
          ) : (
            <>
              <Icons.Check size={20} />
              <span>Tambah Customer</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
