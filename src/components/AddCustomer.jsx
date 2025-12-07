// src/components/AddCustomer.jsx
import { useState } from 'react';
import { addCustomer } from '../utils/googleSheets';
import { addHistory } from '../utils/history';
import './AddCustomer.css';

export default function AddCustomer() {
  const [formData, setFormData] = useState({
    id: '',            // OPTIONAL - bisa kosong
    nama: '',          // MANDATORY
    kota: '',          // MANDATORY
    sales: '',
    pabrik: '', 
    cabang: 'BT SMG',        // MANDATORY
    telp: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' atau 'error'

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasi mandatory fields
    if (!formData.nama.trim()) {
      setMessageType('error');
      setMessage('❌ Nama customer wajib diisi!');
      return;
    }

    if (!formData.kota.trim()) {
      setMessageType('error');
      setMessage('❌ Kota wajib diisi!');
      return;
    }

    if (!formData.cabang.trim()) {
      setMessageType('error');
      setMessage('❌ Cabang wajib diisi!');
      return;
    }

    setLoading(true);
    setMessage('');

    const result = await addCustomer(formData);

    if (result.success) {
      setMessageType('success');
      setMessage(`✅ Customer "${formData.nama}" berhasil ditambahkan ke Sheets!`);

      // Log history
      addHistory('ADD', {
        customerId: formData.id || 'AUTO',
        nama: formData.nama,
        kota: formData.kota,
        cabang: formData.cabang,
      });

      // Reset form
      setFormData({
        id: '',
        nama: '',
        kota: '',
        sales: '',
        pabrik: '',
        cabang: 'BT SMG',
        telp: ''
      });

      // Auto-clear message setelah 3 detik
      setTimeout(() => setMessage(''), 3000);
    } else {
      setMessageType('error');
      setMessage(`❌ Error: ${result.error}`);
    }

    setLoading(false);
  };

  return (
    <div className="add-customer">
      <h2>📝 Tambah Customer Baru</h2>

      <form onSubmit={handleSubmit}>
        {/* MANDATORY FIELDS */}
        <div className="form-section">
          <h3>⭐ Data Wajib</h3>

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

        {/* MESSAGE */}
        {message && (
          <div className={`message message-${messageType}`}>
            {message}
          </div>
        )}

        {/* BUTTON */}
        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? '⏳ Menambahkan...' : '✅ Tambah Customer'}
        </button>
      </form>
    </div>
  );
}
