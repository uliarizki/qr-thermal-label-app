// src/utils/googleSheets.js

const WEB_APP_URL = import.meta.env.VITE_GAS_WEBAPP_URL;
console.log('WEB_APP_URL =', WEB_APP_URL);
const CACHE_DURATION = 5 * 60 * 1000; // 5 menit

let customerCache = null;
let cacheTime = null;

function isCacheValid() {
  return customerCache && cacheTime && (Date.now() - cacheTime < CACHE_DURATION);
}

// Helper umum untuk call Apps Script
async function callApi(action, payload = null) {
  try {
    const params = new URLSearchParams({ action });

    let body = null;
    if (payload) {
      body = new URLSearchParams({
        data: JSON.stringify(payload),
      });
    }

    const res = await fetch(`${WEB_APP_URL}?${params.toString()}`, {
      method: 'POST',
      body,        // ← hanya body, TANPA headers
    });

    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }

    const json = await res.json();

    if (!json.success) {
      throw new Error(json.data || 'Unknown error from Apps Script');
    }

    return { success: true, data: json.data };
  } catch (error) {
    console.error('Error callApi:', error);
    return { success: false, error: error.message };
  }
}

// FORMATTER opsional, menyesuaikan field
function formatCustomer(row) {
  return {
    no: row.no,
    id: row.id,
    nama: row.nama,
    kota: row.kota,
    sales: row.sales,
    pabrik: row.pabrik,
    cabang: row.cabang,
    telp: row.telp,
    kode: row.kode,
  };
}

// === EXPORTS yang dipanggil App.jsx ===

// Ambil semua customer
export async function getCustomers() {
  if (isCacheValid()) {
    return { success: true, data: customerCache };
  }

  const result = await callApi('getCustomers');

  if (result.success) {
    customerCache = result.data.map(formatCustomer);
    cacheTime = Date.now();
  }

  return { success: result.success, data: customerCache, error: result.error };
}

// Search customer
export async function searchCustomer(query) {
  if (!query || !query.trim()) {
    return { success: true, data: [] };
  }

  try {
    // Kirim query via URL param (e.parameter.query di Apps Script)
    const params = new URLSearchParams({ action: 'searchCustomer', query });

    const res = await fetch(`${WEB_APP_URL}?${params.toString()}`, {
      method: 'POST',
    });

    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }

    const json = await res.json();

    if (!json.success) {
      throw new Error(json.data || 'Unknown error from Apps Script');
    }

    return { success: true, data: json.data.map(formatCustomer) };
  } catch (error) {
    console.error('Error searchCustomer:', error);
    return { success: false, error: error.message, data: [] };
  }
}

// Tambah customer baru
export async function addCustomer(customerData) {
  // Validasi basic di sisi JS
  if (!customerData.nama || !customerData.kota || !customerData.cabang) {
    return {
      success: false,
      error: 'Nama, Kota, dan Cabang wajib diisi',
    };
  }

  const result = await callApi('addCustomer', customerData);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  // invalidate cache
  customerCache = null;
  cacheTime = null;

  return { success: true, data: result.data };
}

// Opsional: untuk force refresh dari luar
export function clearCache() {
  customerCache = null;
  cacheTime = null;
}
