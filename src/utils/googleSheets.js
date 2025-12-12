// src/utils/googleSheets.js

const WEB_APP_URL = import.meta.env.VITE_GAS_WEBAPP_URL;
const CACHE_KEY = 'qr:customersData';
const CACHE_TIME_KEY = 'qr:cacheTime';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 jam (kita gunakan manual sync untuk update)

let customerCache = null;

// Load initial cache from storage
if (typeof window !== 'undefined') {
  try {
    const savedData = localStorage.getItem(CACHE_KEY);
    if (savedData) {
      customerCache = JSON.parse(savedData);
    }
  } catch (e) {
    console.error('Error loading cache', e);
  }
}

async function callApi(action, payload = null) {
  if (!WEB_APP_URL || WEB_APP_URL === 'undefined') {
    return { success: false, error: 'Configuration Error: VITE_GAS_WEBAPP_URL is missing or invalid' };
  }

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
      body,
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

// === EXPORTS ===

export function getLastUpdate() {
  if (typeof window === 'undefined') return null;
  const time = localStorage.getItem(CACHE_TIME_KEY);
  return time ? new Date(parseInt(time)) : null;
}

// Ambil semua customer (Cache First Strategy)
export async function getCustomers(forceReload = false) {
  // 1. Return cache jika ada dan tidak force reload
  if (!forceReload && customerCache) {
    console.log('Using cached data');
    return { success: true, data: customerCache, source: 'cache' };
  }

  // 2. Fetch from API
  console.log('Fetching fresh data...');
  const result = await callApi('getCustomers');

  if (result.success) {
    const formattedData = result.data.map(formatCustomer);

    // 3. Update Memory & LocalStorage
    customerCache = formattedData;
    if (typeof window !== 'undefined') {
      localStorage.setItem(CACHE_KEY, JSON.stringify(formattedData));
      localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
    }

    return { success: true, data: formattedData, source: 'api' };
  }

  // Jika error fetching tapi ada cache lama, kembalikan cache lama saja (fail-safe)
  if (customerCache) {
    console.warn('Fetch failed, falling back to cache');
    return { success: true, data: customerCache, error: result.error, source: 'cache-fallback' };
  }

  return { success: false, error: result.error };
}

// Search customer (Client Side Filtering)
// Ini helper jika kita mau filter manual dari luar, tapi sebaiknya logic search pindah ke UI component
// agar lebih reaktif dengan data yang sudah di-load di App.
export async function searchCustomer(query) {
  // Fallback jika belum load data
  if (!customerCache) {
    await getCustomers();
  }

  if (!customerCache) return { success: false, data: [] };

  const lowerQ = query.toLowerCase();
  const filtered = customerCache.filter(c =>
    (c.nama && c.nama.toLowerCase().includes(lowerQ)) ||
    (c.id && c.id.toLowerCase().includes(lowerQ)) ||
    (c.kota && c.kota.toLowerCase().includes(lowerQ))
  );

  return { success: true, data: filtered };
}

// Tambah customer baru
export async function addCustomer(customerData) {
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

  // Opsi: Langsung tambahkan ke cache tanpa reload semua
  // Agar UX lebih cepat
  if (customerCache) {
    // Kita perlu format sesuai balikan API atau construct sendiri
    // Asumsi row baru ada di result.data (tergantung implementasi GAS)
    // Kalau GAS tidak return full row, kita append manual 'optimistic update'
    // Tapi amannya kita mark cache dirty atau force reload next time.
    // Untuk sekarang: kita force fetch next time atau append manual jika yakin.

    // Kita clear cache agar user dipaksa fetch ulang saat kembali ke list (atau panggil getCustomers(true))
    // Atau lebih baik kita append jika kita tahu formatnya.
  }

  return { success: true, data: result.data };
}

export function clearCache() {
  customerCache = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TIME_KEY);
  }
}
