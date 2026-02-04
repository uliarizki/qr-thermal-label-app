/**
 * ID Generator Utility
 * Generates Customer IDs based on City and Random/Sequence logic.
 */

const CITY_CODES = {
    'SURABAYA': 'SBY',
    'SEMARANG': 'SMG',
    'JAKARTA': 'JKT',
    'JOGJA': 'JOG',
    'YOGYAKARTA': 'JOG',
    'SOLO': 'SOC',
    'SURAKARTA': 'SOC',
    'BANDUNG': 'BDO',
    'MALANG': 'MLG',
    'DENPASAR': 'DPS',
    'BALI': 'DPS',
    'KUDUS': 'KDS',
    'PATI': 'PTI',
    'JEPARA': 'JPR',
    'REMBANG': 'RBG',
    'TEGAL': 'TGL',
    'PEKALONGAN': 'PKL',
    'PURWOKERTO': 'PWT',
    'MAGELANG': 'MGL',
    'MADIUN': 'MN',
    'KEDIRI': 'KDR',
    'BLITAR': 'BLT',
    'PROBOLINGGO': 'PRO',
    'PASURUAN': 'PAS',
    'BANYUWANGI': 'BWI',
    'JEMBER': 'JMR',
    'LAMONGAN': 'LMG',
    'GRESIK': 'GSK',
    'SIDOARJO': 'SDA',
    'MOJOKERTO': 'MJK',
    'BEKASI': 'BKS',
    'TANGERANG': 'TNG',
    'DEPOK': 'DPK',
    'BOGOR': 'BOO',
    'SERANG': 'SRG',
    'CILEGON': 'CLG',
    'CIREBON': 'CBN',
    'TASIKMALAYA': 'TSM',
    'MEDAN': 'KNO', // Standardize to Airport code style or common usage
    'PALEMBANG': 'PLM',
    'LAMPUNG': 'TKG',
    'PADANG': 'PDG',
    'MAKASSAR': 'UPG',
    'MANADO': 'MDC',
    'PONTIANAK': 'PNK',
    'BANJARMASIN': 'BDJ',
    'BALIKPAPAN': 'BPN',
    'SAMARINDA': 'SRI',
};

/**
 * Generate a unique ID based on City
 * Format: [MMM][RRRR] (3 Letter Code + 4 Random Digits)
 * Example: SBY1024
 * @param {string} city - Input city name
 * @param {Array} existingCustomers - List of existing customers to check for collision
 * @returns {string} Generated ID
 */
export function generateCustomerId(city, existingCustomers = []) {
    if (!city || typeof city !== 'string') return '';

    const upperCity = city.trim().toUpperCase();

    // 1. Get Prefix
    let prefix = CITY_CODES[upperCity];

    // Fallback: First 3 consonants or letters if not in map
    if (!prefix) {
        // Remove vowels to limit collision? Or just take first 3 chars.
        // Let's take first 3 chars for simplicity, maybe remove spaces.
        const clean = upperCity.replace(/[^A-Z]/g, '');
        prefix = clean.substring(0, 3);
    }

    if (prefix.length < 3) {
        prefix = prefix.padEnd(3, 'X');
    }

    // 2. Generate Number (Loop to ensure uniqueness)
    let newId = '';
    let attempts = 0;
    const maxAttempts = 50;

    const existingIds = new Set(existingCustomers.map(c => c.id));

    do {
        // Random 4 digit number: 1000 - 9999
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        newId = `${prefix}${randomNum}`;
        attempts++;
    } while (existingIds.has(newId) && attempts < maxAttempts);

    if (attempts >= maxAttempts) {
        // Fallback if super unlucky (add timestamp suffix)
        newId = `${prefix}${Date.now().toString().slice(-4)}`;
    }

    return newId;
}
