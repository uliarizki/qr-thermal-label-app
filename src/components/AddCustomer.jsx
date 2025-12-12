import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { addCustomer } from '../utils/googleSheets';
import { addHistory } from '../utils/history';
import './AddCustomer.css';

export default function AddCustomer({ onAdd }) {
  const [formData, setFormData] = useState({
    id: '',
    nama: '',
    kota: '',
    sales: '',
    pabrik: '',
    cabang: 'BT SMG',
    telp: ''
  });

  const [loading, setLoading] = useState(false);

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
      toast.error('Nama customer wajib diisi!');
      return;
    }

    if (!formData.kota.trim()) {
      toast.error('Kota wajib diisi!');
      return;
    }

    if (!formData.cabang.trim()) {
      toast.error('Cabang wajib diisi!');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Menambahkan customer...');

    const result = await addCustomer(formData);

    if (result.success) {
      toast.success(`Customer "${formData.nama}" berhasil ditambahkan!`, { id: toastId });

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

      if (onAdd) onAdd(formData); // Notify parent to refresh

    } else {
      toast.error(`Error: ${result.error}`, { id: toastId });
    }

    setLoading(false);
  };

  return (
    <div className="add-customer page-card">
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

        {/* BUTTON */}
        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? '⏳ Menambahkan...' : '✅ Tambah Customer'}
        </button>
      </form>
    </div>
  );
}
