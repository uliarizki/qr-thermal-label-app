import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { addCustomer } from '../utils/googleSheets';
import { addHistory } from '../utils/history';
import { Icons } from './Icons';
import CustomerForm from './CustomerForm'; // Import reused component
import './AddCustomer.css';

export default function AddCustomer({ onAdd }) {
  const [loading, setLoading] = useState(false);
  // Key to force re-render form on reset
  const [formKey, setFormKey] = useState(0);

  const handleAddSubmit = async (upperCasedData) => {
    // Validasi mandatory fields (Extra safety, mostly handled by CustomerForm required attr)
    if (!upperCasedData.nama.trim() || !upperCasedData.kota.trim() || !upperCasedData.cabang.trim()) {
      toast.error('Data wajib belum lengkap!');
      return;
    }

    setLoading(true);
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

        // Reset form by incrementing key
        setFormKey(prev => prev + 1);

        if (onAdd) onAdd(upperCasedData);
      } else {
        toast.error('Gagal menambahkan: ' + result.error, { id: toastId });
      }
    } catch (error) {
      toast.error('Terjadi kesalahan: ' + error.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-customer page-card">
      <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Icons.Plus size={24} />
        Tambah Customer Baru
      </h2>

      {/* REUSABLE FORM */}
      <CustomerForm
        key={formKey} // Force reset on success
        onSubmit={handleAddSubmit}
        isLoading={loading}
        submitLabel="Tambah Customer"
      />
    </div>
  );
}
