# QR Thermal Label App

React app untuk scan QR code dan print thermal label sticker 58mm dengan OAuth2 Google Sheets integration.

## Features

- 📱 Scan QR code via webcam (mobile & desktop)
- 🔍 Search customer dari Google Sheets
- ➕ Tambah customer baru langsung di app
- 🖨️ Print ke thermal printer (58mm, customizable)
- 📄 Export ke PDF untuk sticker label
- 🔐 OAuth2 login dengan Google Account
- 📊 Real-time sync ke Google Sheets

## Ukuran Kertas Thermal Support

- 58 x 30mm
- 58 x 37mm
- 58 x 40mm (standard)
- 58 x 50mm
- 57 x 25mm
- 57 x 30mm
- 57 x 40mm
- Custom size

## Data Format QR Code

QR code harus berisi JSON dengan format:

```json
{
  "it": "G10000",
  "nt": "CUSTOMER NAME",
  "at": "CITY",
  "pt": "PROPERTY TYPE",
  "kp": "POSTAL CODE",
  "ws": "WAREHOUSE/BRANCH NAME",
  "np": "PHONE NUMBER"
}
```

### Field Description
- `it` (item): ID customer
- `nt` (name): Nama customer (LARGEST FONT)
- `at` (address/city): Kota
- `pt` (property type): Tipe properti
- `kp` (kodepos): Kode pos
- `ws` (warehouse): Nama cabang/warehouse (MEDIUM FONT)
- `np` (nomor penelepon): Nomor telepon

## Tech Stack

- **Frontend**: React 18 + Vite
- **QR Scanning**: jsQR (browser-based)
- **PDF Generation**: html2pdf
- **Authentication**: Google OAuth2
- **API**: Google Sheets API (v4)
- **Deployment**: Vercel

## Setup & Installation

### 1. Clone Repository

```bash
git clone https://github.com/uliarizki/qr-thermal-label-app.git
cd qr-thermal-label-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Google OAuth2

- Sudah di-setup di project "Bintang Mas" di Google Cloud
- Client ID: `978955210480-uhe12gbqjrso5mkof5e1gqbukkt8hsap.apps.googleusercontent.com`
- Authorized origins: `http://localhost:3000`
- Authorized redirect URI: `http://localhost:3000/auth/callback`

### 4. Configure Environment

Buat file `.env.local`:

```
VITE_GOOGLE_CLIENT_ID=978955210480-uhe12gbqjrso5mkof5e1gqbukkt8hsap.apps.googleusercontent.com
VITE_GOOGLE_SHEETS_ID=YOUR_SPREADSHEET_ID
```

### 5. Run Development Server

```bash
npm run dev
```

App akan berjalan di: `http://localhost:3000`

## Deployment ke Vercel

### 1. Push ke GitHub

```bash
git add .
git commit -m "initial commit"
git push origin main
```

### 2. Connect ke Vercel

- Login ke vercel.com
- Click "New Project"
- Select repository `uliarizki/qr-thermal-label-app`
- Deploy

### 3. Update OAuth2 Domain

Setelah deploy, tambahkan authorized origin baru di Google Cloud Console:
- Authorized JavaScript origins: `https://your-vercel-app.vercel.app`
- Authorized redirect URIs: `https://your-vercel-app.vercel.app/auth/callback`

## Project Structure

```
qr-thermal-label-app/
├── package.json
├── vite.config.js
├── index.html
├── .gitignore
├── README.md
└── src/
    ├── main.jsx
    ├── index.css
    ├── App.jsx
    ├── App.css
    ├── components/
    │   ├── QRScanner.jsx
    │   ├── CustomerSearch.jsx
    │   ├── AddCustomer.jsx
    │   ├── PrintPreview.jsx
    │   └── components.css
    └── utils/
        ├── googleSheets.js
        ├── qrParser.js
        └── pdfGenerator.js
```

## Usage

### Scan QR & Print

1. Click "📱 Scan QR"
2. Arahkan camera ke QR code
3. Setelah scan, tampil preview label
4. Click "Print" untuk print label
5. Pilih ukuran kertas (default 58x40mm)
6. Generate PDF dan print

### Search Customer

1. Click "🔍 Cari Customer"
2. Ketik nama/ID/kota untuk search
3. Click customer untuk lihat & print label

### Add Customer Baru

1. Click "➕ Customer Baru"
2. Isi form dengan data customer
3. Submit - data langsung tersimpan ke Google Sheets
4. Generate QR code untuk customer baru

## OAuth2 Login Flow

1. User klik "Login dengan Google"
2. Redirect ke Google OAuth consent screen
3. User approve permissions
4. Redirect back ke app dengan access token
5. App fetch customer data dari Google Sheets
6. User bisa scan, search, dan add customer

## Print Configuration

### Default Thermal Printer Settings

- Paper width: 58mm
- Margin: 2mm (disesuaikan untuk kertas sticker berlekuk)
- DPI: 300 (untuk print quality)
- Color mode: Grayscale recommended

### Print Custom Size

User bisa set custom ukuran paper sebelum print:
- Width: 50-100mm
- Height: 20-200mm

## Troubleshooting

### Camera Permission Denied

- Pastikan browser sudah grant camera permission
- Try refresh page dan allow akses camera
- Di mobile: Check app permissions di settings

### QR Code Tidak Terbaca

- Pastikan format QR = valid JSON
- QR quality harus bagus (tidak blur/rusak)
- Brightness & contrast ruangan cukup

### Google Sheets Tidak Terload

- Check Google OAuth token masih valid
- Spreadsheet ID sudah benar di .env
- Pastikan spreadsheet "KODE" sheet exist
- Check column structure sesuai requirement

## Support

Untuk pertanyaan atau issue, contact via GitHub Issues atau direct message.

## License

MIT License - feel free to use dan modify
