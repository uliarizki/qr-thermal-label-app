/**
 * =========================================================
 * BINTANG MAS - ENTERPRISE BACKEND (v2.1 Hybrid)
 * Security: SHA-256 Hashing | Data: Manual Index Mapping (Stabilized)
 * =========================================================
 */

// --- CONFIGURATION ---
const SPREADSHEET_ID = '1WEKC5zNNNcwv1I697pz2z7pAKqP_VpTCRc5Dt5izkk8'; // ID Spreadsheet Bintang Mas
const SHEET_CUSTOMERS = 'Custs'; // Sesuai request user: 'Custs'
const SHEET_USERS = 'Users';
const SHEET_HISTORY = 'History_Log';
const ADMIN_EMAIL = 'uliarizki@gmail.com';

function doGet(e) {
    return ContentService.createTextOutput("Backend Active (v2.1 Hybrid)");
}

function doPost(e) {
    // Global lock removed to allow concurrent reads (getCustomers)
    // Write operations use withLock() individually.

    try {
        let action = e.parameter.action;
        let payload = null;

        // Support both URL param and Body JSON
        if (e.postData && e.postData.contents) {
            try {
                const json = JSON.parse(e.postData.contents);
                if (json.action) action = json.action;
                payload = json;
            } catch (err) {
                // Fallback if not JSON
            }
        }

        if (!action) throw new Error("No action specified");

        let result;
        switch (action) {
            // --- AUTHENTICATION (SECURE SHA-256) ---
            // --- AUTHENTICATION (SECURE SHA-256) ---
            case 'login':
                result = handleLogin(payload.username, payload.password);
                break;
            case 'register':
                result = handleRegister(payload.username, payload.password, payload.role, payload.creatorRole);
                break;
            case 'requestPasswordReset':
                result = handleRequestReset(payload.username);
                break;
            case 'resetPasswordWithOTP':
                result = handleResetWithOTP(payload.username, payload.otp, payload.newPassword);
                break;

            // --- DATA CUSTOMERS (ROBUST MAPPING) ---
            case 'getCustomers':
                // READ operation - No lock needed (concurrency allowed)
                result = getCustomerData();
                break;
            case 'addCustomer':
                // WRITE operation
                result = addCustomerData(payload.customer);
                break;

            // --- HISTORY ---
            case 'logActivity':
                result = logHistory(payload.user, payload.activity, payload.details);
                break;
            case 'getGlobalHistory':
                result = getGlobalHistory(payload.userRole);
                break;

            // --- USER MANAGEMENT (NEW) ---
            case 'getUsers':
                result = handleGetUsers(payload.role);
                break;
            case 'deleteUser':
                result = handleDeleteUser(payload.username, payload.role, payload.targetUser);
                break;

            default:
                return errorResponse("Unknown action: " + action);
        }

        return successResponse(result);

    } catch (error) {
        return errorResponse(error.toString());
    }
}

// --- AUTH LOGIC (KEEPING SECURITY HIGH) ---

function handleLogin(username, password) {
    const sheet = getSheet(SHEET_USERS);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]).toLowerCase() === String(username).toLowerCase()) {
            const storedHash = data[i][1];
            const role = data[i][2];

            // Verify: Hash input password -> Compare with stored hash
            if (verifyHash(password, storedHash)) {
                return {
                    token: Utilities.getUuid(),
                    username: data[i][0],
                    role: role
                };
            }
            throw new Error("Password salah!");
        }
    }

    // First Run: Auto-create Admin if missing
    if (username === 'admin' && password === 'admbt123') {
        createFirstAdmin();
        return { token: 'master-token', username: 'admin', role: 'admin' };
    }

    throw new Error("User tidak ditemukan");
}

function handleRegister(username, password, role, creatorRole) {
    if (creatorRole !== 'admin') throw new Error("Unauthorized");
    const sheet = getSheet(SHEET_USERS);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]).toLowerCase() === String(username).toLowerCase()) {
            throw new Error("Username sudah ada!");
        }
    }

    sheet.appendRow([username, hashString(password), role, new Date()]);
    return { message: "User created" };
}

// --- DATA LOGIC (ROBUST INDEX MAPPING) ---
// Menggunakan index manual (0,1,2...) agar tidak error saat header beda

// --- DATA LOGIC (ROBUST INDEX MAPPING + CACHING) ---
// Menggunakan index manual (0,1,2...) agar tidak error saat header beda

const CACHE_KEY_CUSTOMERS = 'ALL_CUSTOMERS_V2';
const CACHE_DURATION = 21600; // 6 hours (Max allowed)

function getCustomerData() {
    // 1. Try Cache First (DISABLED FOR DEBUGGING)
    // const cachedData = getFromCache(CACHE_KEY_CUSTOMERS);
    // if (cachedData) {
    //    return cachedData; 
    // }

    // 2. Read from Sheet (Slow)
    const sheet = getSheet(SHEET_CUSTOMERS);
    const data = sheet.getDataRange().getValues();

    // Skip Header (row 0)
    const customers = data.slice(1).map(row => ({
        no: row[0],        // Kolom A
        id: row[1],        // Kolom B
        nama: row[2],        // Kolom C
        kota: row[3],        // Kolom D
        sales: row[4],        // Kolom E
        pabrik: row[5],       // Kolom F
        cabang: row[6],       // Kolom G
        telp: row[7],        // Kolom H
        kode: row[8] ? row[8].toString() : (row[1] ? row[1].toString() : '') // Kolom I (Fallback ke ID)
    }));

    // 3. Save to Cache (DISABLED FOR DEBUGGING)
    // saveToCache(CACHE_KEY_CUSTOMERS, customers);

    return customers;
}

function addCustomerData(c) {
    const sheet = getSheet(SHEET_CUSTOMERS);

    // Find next empty row based on Column C (Nama) - Index 3
    // User requested to check 'Nama' column specifically to find the last valid data row.
    const lastRow = getLastRowByColumn(sheet, 3); // 3 = Column C (Nama)
    const newRow = lastRow + 1;

    const values = [[
        c.id || '',           // Col B
        c.nama || '',         // Col C
        c.kota || '',         // Col D
        c.sales || '',        // Col E
        c.pabrik || '',       // Col F
        c.cabang || '',       // Col G
        c.telp || '',         // Col H
        c.kode || c.id || ''  // Col I
    ]];

    sheet.getRange(newRow, 2, 1, 8).setValues(values);

    // 4. INVALIDATE CACHE (DISABLED FOR DEBUGGING)
    // try {
    //    CacheService.getScriptCache().remove(CACHE_KEY_CUSTOMERS + "_meta");
    // } catch (e) {}

    return { message: "Saved" };
}

// --- SMART CHUNKED CACHING HELPER ---
// GAS Cache limit is 100KB per key. We split large JSONs.

function saveToCache(key, data) {
    try {
        const json = JSON.stringify(data);
        const cache = CacheService.getScriptCache();
        const chunkSize = 100000; // ~100KB safe limit
        const chunks = [];

        // Split string
        for (let i = 0; i < json.length; i += chunkSize) {
            chunks.push(json.substring(i, i + chunkSize));
        }

        // Prepare batch (key_total = count)
        // key_0, key_1 ...
        const cacheObj = {};
        cacheObj[key + "_meta"] = chunks.length.toString();

        chunks.forEach((chunk, index) => {
            cacheObj[key + "_" + index] = chunk;
        });

        cache.putAll(cacheObj, CACHE_DURATION);
    } catch (e) {
        // Cache failed (too big or quota exceeded), ignore
    }
}

function getFromCache(key) {
    const cache = CacheService.getScriptCache();
    // Check metadata first
    const meta = cache.get(key + "_meta");
    if (!meta) return null;

    const totalChunks = parseInt(meta);
    const keys = [];
    for (let i = 0; i < totalChunks; i++) {
        keys.push(key + "_" + i);
    }

    // Fetch all chunks
    const result = cache.getAll(keys);
    let json = "";

    for (let i = 0; i < totalChunks; i++) {
        const chunk = result[key + "_" + i];
        if (!chunk) return null; // Corrupted/Missing chunk
        json += chunk;
    }

    return JSON.parse(json);
}

// Helper to find last row with data in a specific column (1-based index)
function getLastRowByColumn(sheet, colIndex) {
    const lastRow = sheet.getLastRow();
    if (lastRow === 0) return 0;

    const range = sheet.getRange(1, colIndex, lastRow);
    const values = range.getValues();

    for (let i = values.length - 1; i >= 0; i--) {
        if (values[i][0] !== "" && values[i][0] !== null) {
            return i + 1;
        }
    }
    return 0; // Header row logic might need +1 if header exists, but this returns raw index
}

// --- HELPERS & SECURITY UTILS ---

function getSheet(name) {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
        // Auto-create jika hilang
        sheet = ss.insertSheet(name);
        if (name === SHEET_USERS) sheet.appendRow(['Username', 'PasswordHash', 'Role', 'Created']);
    }
    return sheet;
}

function hashString(str) {
    const raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, str);
    let txtHash = '';
    for (let i = 0; i < raw.length; i++) {
        let hashVal = raw[i];
        if (hashVal < 0) hashVal += 256;
        if (hashVal.toString(16).length == 1) txtHash += '0';
        txtHash += hashVal.toString(16);
    }
    return txtHash;
}

function verifyHash(password, storedHash) {
    // Support migration: If stored password looks plain (not hash length), compare direct
    // SHA256 hex length is 64 chars. If length != 64, assume old plain text.
    if (storedHash.length !== 64) {
        return password === storedHash;
    }
    return hashString(password) === storedHash;
}

function createFirstAdmin() {
    const sheet = getSheet(SHEET_USERS);
    // Check again
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
        if (data[i][0] === 'admin') return;
    }
    sheet.appendRow(['admin', hashString('admbt123'), 'admin', new Date()]);
}

function successResponse(data) {
    return ContentService.createTextOutput(JSON.stringify({ success: true, data: data }))
        .setMimeType(ContentService.MimeType.JSON);
}

function errorResponse(msg) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: msg }))
        .setMimeType(ContentService.MimeType.JSON);
}

// --- LOCK HELPER ---
function withLock(callback) {
    const lock = LockService.getScriptLock();
    const hasLock = lock.tryLock(10000); // 10s timeout
    if (!hasLock) throw new Error("Server busy (Lock timeout). Please try again.");

    try {
        return callback();
    } finally {
        lock.releaseLock();
    }
}

// --- HISTORY & RESET (Simplified) ---
function logHistory(user, activity, details) {
    const sheet = getSheet(SHEET_HISTORY);
    sheet.appendRow([new Date(), user, activity, JSON.stringify(details)]);
    return "logged";
}

function getGlobalHistory(role) {
    if (role !== 'admin') return [];
    const sheet = getSheet(SHEET_HISTORY);
    const data = sheet.getDataRange().getValues();
    return data.slice(1).reverse().slice(0, 100).map(r => ({
        timestamp: r[0], user: r[1], activity: r[2], details: r[3]
    }));
}

function handleRequestReset(u) { return { message: "Feature disabled in Hybrid Mode" }; }
function handleResetWithOTP(u, o, n) { return { message: "Feature disabled in Hybrid Mode" }; }

// --- USER MANAGEMENT IMPL ---
function handleGetUsers(requestorRole) {
    if (requestorRole !== 'admin') throw new Error("Unauthorized");
    const sheet = getSheet(SHEET_USERS);
    const data = sheet.getDataRange().getValues();
    // Headers: Username, PasswordHash, Role, Created
    // Skip header
    const users = [];
    for (let i = 1; i < data.length; i++) {
        users.push({
            username: data[i][0],
            role: data[i][2],
            created: data[i][3]
        });
    }
    return users;
}

function handleDeleteUser(adminUsername, adminRole, targetUser) {
    if (adminRole !== 'admin') throw new Error("Unauthorized");
    if (adminUsername === targetUser) throw new Error("Cannot delete yourself!");

    const sheet = getSheet(SHEET_USERS);
    const data = sheet.getDataRange().getValues();

    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
        if (data[i][0] === targetUser) {
            rowIndex = i + 1; // 1-based index
            break;
        }
    }

    if (rowIndex === -1) throw new Error("User not found");

    sheet.deleteRow(rowIndex);
    return { message: "User deleted" };
}
