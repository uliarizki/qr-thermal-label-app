import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { addCustomer } from '../utils/googleSheets';
import { addHistory } from '../utils/history';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { Icons } from './Icons';
import CustomerForm from './CustomerForm'; // Import reused component
import './AddCustomer.css';

export default function AddCustomer({ onAdd }) {
  const [loading, setLoading] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const { isOnline } = useNetworkStatus();

  const handleAddSubmit = async (upperCasedData) => {
    // Block submission if offline
    if (!isOnline) {
      toast.error('Tidak bisa menambah customer saat offline. Periksa koneksi internet.');
      return;
    }

    // Validasi mandatory fields
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

        addHistory('ADD', {
          customerId: upperCasedData.id || 'AUTO',
          nama: upperCasedData.nama,
          kota: upperCasedData.kota,
          cabang: upperCasedData.cabang,
        });

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

      {/* Offline Warning Banner */}
      {!isOnline && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#991b1b',
          padding: '10px 15px',
          borderRadius: 8,
          marginBottom: 15,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <span>⚠️</span>
          <span>Anda sedang offline. Fitur ini membutuhkan koneksi internet.</span>
        </div>
      )}

      <CustomerForm
        key={formKey}
        onSubmit={handleAddSubmit}
        isLoading={loading || !isOnline}
        submitLabel={isOnline ? "Tambah Customer" : "Offline - Tidak Tersedia"}
      />
    </div>
  );
}

