# 🌟 Bintang Mas - QR Thermal Label App

Aplikasi web modern untuk manajemen data customer, scan QR code, dan pencetakan label thermal otomatis. Dibangun untuk efisiensi tinggi dengan desain premium "Gold & Black".

![Bintang Mas App](public/logo_new.png)

## ✨ Fitur Utama (Ultimate Edition)

### 1. 📱 Dual Mode Operation
- **Scan Mode**: Gunakan kamera laptop/HP untuk memindai QR code produk/customer.
- **Search Mode**: Pencarian pintar (Smart Search) berdasarkan Nama, ID, atau Kota.
- **Dual Output**: Pilih antara **Thermal Print** (untuk label fisik) atau **Digital ID Card** (untuk share via WA).

### 2. 🖨️ Smart Printing
- **Auto-Format**: Label otomatis disesuaikan dengan ukuran 55x40mm (atau custom).
- **One-Click PDF**: Sekali klik tombol "Print", file PDF langsung ter-download tanpa popup mengganggu.
- **Sharp Vector Quality**: Hasil cetak tajam menggunakan teknologi Vector PDF.

### 3. 🔐 Enterprise Security
- **Role-Based Access**: Login khusus untuk **Admin** (Control Penuh) dan **User** (Operasional).
- **Secure Auth**: Password di-hash (SHA-256) untuk keamanan maksimal.
- **Cloud Audit Log**: Semua aktivitas (Login, Scan, Add, Search) tercatat otomatis di Google Sheets Admin.

### 4. 🚀 Hybrid Technology
- **Offline-Ready**: Aplikasi bisa berjalan parsial saat sinyal hilang (PWA).
- **Hybrid Storage**: 
  - *Lokal*: History tersimpan di browser untuk akses kilat.
  - *Cloud*: Data customer tersinkronisasi realtime dengan Google Sheets.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, PWA
- **Styling**: Modern CSS (Premium Gold Theme), React Hot Toast
- **Database (Cloud)**: Google Sheets + Google Apps Script (GAS)
- **Database (Local)**: LocalStorage (Snapshot Data)
- **Cetak**: jsPDF (Vector), html2canvas (Digital ID)

---

## 🚀 Panduan Penggunaan

### A. Login
Masukkan username & password yang telah didaftarkan oleh Admin.
- **Admin**: Bisa akses menu "Admin Panel" untuk kelola user.
- **User**: Hanya bisa akses fitur operasional scan & print.

### B. Menambah Customer Baru
1. Masuk menu **"Baru"** (`+`).
2. Isi data wajib: Nama, Kota, Cabang.
3. Klik "Simpan".
4. **Otomatis**: Anda akan diarahkan ke halaman "Preview" untuk langsung cetak label customer baru tersebut.

### C. Mencetak Label
1. Dari hasil Scan atau Pencarian, klik customer.
2. Muncul popup detail.
3. Pilih tab **"Thermal Print"**.
4. Klik tombol **"Generate PDF & Print"**.
5. File PDF akan terdownload. Buka dan Print ke printer thermal (Setting: 55x40mm).

### D. Membuat Digital ID
1. Dari popup detail, pilih tab **"Digital ID"**.
2. Klik **"Save as Image"**.
3. Gambar kartu nama premium akan tersimpan (PNG) dan siap dikirim ke WhatsApp customer.

---

## 📦 Deployment (cPanel)

Aplikasi ini dirancang untuk berjalan di hosting standar (cPanel/Apache).

1. **Build Project**:
   ```bash
   npm run build
   ```
2. **Upload**:
   - Upload isi folder `dist/` ke folder `public_html` (atau subdomain) di cPanel.
   - Pastikan file `.htaccess` juga terupload agar routing aman.
3. **Environment**:
   - Pastikan URL backend GAS (`VITE_GAS_WEBAPP_URL`) sudah di-set di file `.env` sebelum build.

---

## 🔄 Sinkronisasi Data

- Data customer diambil dari Google Sheets.
- Klik tombol **"Sync"** di menu Customer untuk mengambil data terbaru dari pusat.
- History aktivitas Anda tersimpan lokal di browser, namun juga dikirim "diam-diam" ke Admin Sheet untuk keperluan audit.

---

© 2024 Bintang Mas Software Team. All Rights Reserved.
