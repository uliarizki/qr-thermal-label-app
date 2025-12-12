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
    // 1. Setup Parameters
    // Untuk POST, payload dikirim di body sebagai string JSON
    // Action tetap bisa di query param atau body, kita taruh di body saja biar clean

    // Construct Body
    const bodyData = {
      action: action,
      ...payload
    };

    // Note: GAS `doPost` menerima event `e.postData.contents`
    // Kita kirim raw string JSON via 'no-cors' mode tidak bisa dapat response,
    // jadi kita pakai standard POST. Pastikan CORS enabled di GAS Script code (ContentService return)

    const res = await fetch(WEB_APP_URL, {
      method: 'POST',
      body: JSON.stringify(bodyData),
    });

    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }

    const json = await res.json();

    if (!json.success) {
      throw new Error(json.error || 'Unknown error from Apps Script'); // API returns { success: false, error: 'msg' }
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

/* --- AUTHENTICATION API --- */

export async function loginUser(username, password) {
  return await callApi('login', { username, password });
}

export async function registerUser(username, password, role, creatorRole) {
  return await callApi('register', { username, password, role, creatorRole });
}

export async function requestPasswordReset(username) {
  return await callApi('requestPasswordReset', { username });
}

export async function verifyOTPAndReset(username, otp, newPassword) {
  return await callApi('resetPasswordWithOTP', { username, otp, newPassword });
}

/* --- HISTORY & LOGGING --- */

export async function logActivity(user, activity, details) {
  // Fire and forget, don't await blocking UI
  callApi('logActivity', { user, activity, details });
}

export async function getGlobalHistory(userRole) {
  return await callApi('getGlobalHistory', { userRole });
}

/* --- CUSTOMER DATA --- */

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

// Tambah customer baru
export async function addCustomer(customerData) {
  if (!customerData.nama || !customerData.kota || !customerData.cabang) {
    return {
      success: false,
      error: 'Nama, Kota, dan Cabang wajib diisi',
    };
  }

  const result = await callApi('addCustomer', { customer: customerData });

  if (!result.success) {
    return { success: false, error: result.error };
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
