import React, { useState } from 'react';
import { Icons } from './Icons';
import './PrinterGuide.css';

/**
 * PrinterGuide Component
 * A tutorial page for printer driver installation
 * Accessible from the app to help users set up their thermal printers
 */
const PrinterGuide = ({ onClose }) => {
    const [activeSection, setActiveSection] = useState('overview');

    const sections = [
        { id: 'overview', title: '📋 Overview', icon: '📋' },
        { id: 'android', title: '📱 Android', icon: '📱' },
        { id: 'windows', title: '💻 Windows', icon: '💻' },
        { id: 'troubleshoot', title: '🔧 Troubleshoot', icon: '🔧' },
    ];

    return (
        <div className="printer-guide-overlay">
            <div className="printer-guide-modal">
                {/* Header */}
                <div className="guide-header">
                    <h2>🖨️ Panduan Printer</h2>
                    <button className="close-btn" onClick={onClose}>
                        <Icons.X size={20} />
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="guide-tabs">
                    {sections.map(section => (
                        <button
                            key={section.id}
                            className={`guide-tab ${activeSection === section.id ? 'active' : ''}`}
                            onClick={() => setActiveSection(section.id)}
                        >
                            {section.title}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="guide-content">
                    {activeSection === 'overview' && (
                        <div className="section">
                            <h3>Tentang Printer Thermal</h3>
                            <p>Aplikasi ini mendukung printer thermal 58mm via <strong>Bluetooth</strong> atau <strong>USB</strong>.</p>

                            <div className="info-box">
                                <h4>✅ Printer yang Didukung</h4>
                                <ul>
                                    <li>EPPOS EP-RPP02 (Bluetooth)</li>
                                    <li>Printer thermal ESC/POS compatible</li>
                                    <li>Ukuran kertas: 58mm</li>
                                </ul>
                            </div>

                            <div className="info-box warning">
                                <h4>⚠️ Sebelum Mulai</h4>
                                <ul>
                                    <li>Pastikan printer sudah dinyalakan</li>
                                    <li>Kertas thermal sudah terpasang</li>
                                    <li>Bluetooth aktif (untuk koneksi Bluetooth)</li>
                                </ul>
                            </div>

                            <h3>Dua Metode Cetak</h3>
                            <div className="method-cards">
                                <div className="method-card">
                                    <h4>📱 Via Aplikasi Printer</h4>
                                    <p>Gunakan aplikasi seperti <strong>RawBT</strong> untuk menerima file PDF dan mencetaknya.</p>
                                    <span className="badge recommended">Direkomendasikan</span>
                                </div>
                                <div className="method-card">
                                    <h4>🔌 Direct Connect (WebUSB)</h4>
                                    <p>Hubungkan langsung via USB untuk Batch Printing (Chrome Desktop).</p>
                                    <span className="badge advanced">Advanced</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'android' && (
                        <div className="section">
                            <h3>📱 Setup Printer di Android</h3>

                            <div className="step-list">
                                <div className="step">
                                    <div className="step-number">1</div>
                                    <div className="step-content">
                                        <h4>Download RawBT Print Service</h4>
                                        <p>Aplikasi gratis untuk mencetak ke printer thermal via Bluetooth.</p>
                                        <a
                                            href="https://play.google.com/store/apps/details?id=ru.a402d.rawbtprinter"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="download-btn"
                                        >
                                            📥 Download di Play Store
                                        </a>
                                    </div>
                                </div>

                                <div className="step">
                                    <div className="step-number">2</div>
                                    <div className="step-content">
                                        <h4>Pairing Bluetooth Printer</h4>
                                        <p>Buka <strong>Settings → Bluetooth</strong> di HP Anda.</p>
                                        <ul>
                                            <li>Nyalakan printer thermal</li>
                                            <li>Scan & pair perangkat baru</li>
                                            <li>Nama biasanya: <code>RPP02</code> atau <code>Printer_XXX</code></li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="step">
                                    <div className="step-number">3</div>
                                    <div className="step-content">
                                        <h4>Konfigurasi RawBT</h4>
                                        <p>Buka aplikasi RawBT dan atur:</p>
                                        <ul>
                                            <li><strong>Connection:</strong> Bluetooth</li>
                                            <li><strong>Printer:</strong> Pilih printer yang sudah di-pair</li>
                                            <li><strong>Print Mode:</strong> Image Mode</li>
                                            <li><strong>Paper Width:</strong> 58mm</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="step">
                                    <div className="step-number">4</div>
                                    <div className="step-content">
                                        <h4>Cetak dari Aplikasi</h4>
                                        <p>Di aplikasi Bintang Mas:</p>
                                        <ul>
                                            <li>Buka detail customer</li>
                                            <li>Tap <strong>"Share PDF"</strong></li>
                                            <li>Pilih <strong>RawBT</strong> dari daftar share</li>
                                            <li>PDF akan otomatis tercetak!</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'windows' && (
                        <div className="section">
                            <h3>💻 Setup Printer di Windows</h3>

                            <div className="step-list">
                                <div className="step">
                                    <div className="step-number">1</div>
                                    <div className="step-content">
                                        <h4>Download Driver Printer</h4>
                                        <p>Download driver sesuai brand printer Anda:</p>
                                        <div className="driver-links">
                                            <a
                                                href="https://drive.google.com/drive/folders/1Q9PxYz"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="driver-link"
                                            >
                                                📥 Driver EPPOS RPP02
                                            </a>
                                            <a
                                                href="https://www.xprinter.com/support/list-8-1.html"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="driver-link"
                                            >
                                                📥 Driver XPrinter
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                <div className="step">
                                    <div className="step-number">2</div>
                                    <div className="step-content">
                                        <h4>Install Driver</h4>
                                        <ul>
                                            <li>Extract file ZIP yang sudah didownload</li>
                                            <li>Run <code>setup.exe</code> atau <code>install.bat</code></li>
                                            <li>Ikuti petunjuk instalasi</li>
                                            <li>Restart komputer jika diminta</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="step">
                                    <div className="step-number">3</div>
                                    <div className="step-content">
                                        <h4>Hubungkan Printer</h4>
                                        <p>Sambungkan printer ke komputer:</p>
                                        <ul>
                                            <li><strong>USB:</strong> Colokkan kabel USB, Windows akan deteksi otomatis</li>
                                            <li><strong>Bluetooth:</strong> Settings → Bluetooth → Add Device</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="step">
                                    <div className="step-number">4</div>
                                    <div className="step-content">
                                        <h4>Cetak via Browser</h4>
                                        <p>Di aplikasi Bintang Mas (Chrome):</p>
                                        <ul>
                                            <li>Klik <strong>Connect</strong> pada Batch Tools</li>
                                            <li>Pilih printer USB dari dialog</li>
                                            <li>Atau: Download PDF → Print via Windows</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div className="info-box">
                                <h4>💡 Tips WebUSB (Direct Print)</h4>
                                <p>Untuk menggunakan fitur "Connect" (Direct Print):</p>
                                <ul>
                                    <li>Gunakan browser <strong>Chrome</strong> atau <strong>Edge</strong></li>
                                    <li>Printer harus terhubung via <strong>USB</strong></li>
                                    <li>Tidak bisa via Bluetooth (gunakan RawBT)</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {activeSection === 'troubleshoot' && (
                        <div className="section">
                            <h3>🔧 Troubleshooting</h3>

                            <div className="faq-list">
                                <div className="faq-item">
                                    <h4>❌ Printer tidak terdeteksi</h4>
                                    <ul>
                                        <li>Pastikan printer <strong>menyala</strong></li>
                                        <li>Cek kabel USB terpasang dengan benar</li>
                                        <li>Coba port USB yang berbeda</li>
                                        <li>Restart printer dan coba lagi</li>
                                    </ul>
                                </div>

                                <div className="faq-item">
                                    <h4>❌ Bluetooth tidak bisa pair</h4>
                                    <ul>
                                        <li>Matikan dan nyalakan ulang Bluetooth</li>
                                        <li>Hapus pairing lama, pair ulang</li>
                                        <li>Jarak jangan terlalu jauh (maks 10m)</li>
                                        <li>Cek baterai printer</li>
                                    </ul>
                                </div>

                                <div className="faq-item">
                                    <h4>❌ Hasil cetak kosong / tidak jelas</h4>
                                    <ul>
                                        <li>Kertas thermal terpasang <strong>sisi yang benar</strong></li>
                                        <li>Bersihkan head printer dengan alkohol</li>
                                        <li>Cek density/darkness setting di RawBT</li>
                                    </ul>
                                </div>

                                <div className="faq-item">
                                    <h4>❌ RawBT tidak muncul di Share</h4>
                                    <ul>
                                        <li>Pastikan RawBT sudah terinstall</li>
                                        <li>Buka RawBT sekali, lalu coba share lagi</li>
                                        <li>Clear cache HP dan coba lagi</li>
                                    </ul>
                                </div>

                                <div className="faq-item">
                                    <h4>❌ WebUSB Connect tidak berfungsi</h4>
                                    <ul>
                                        <li>Gunakan <strong>Chrome</strong> atau <strong>Edge</strong></li>
                                        <li>WebUSB hanya untuk <strong>USB</strong>, bukan Bluetooth</li>
                                        <li>Cek apakah driver terinstall dengan benar</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="info-box">
                                <h4>📞 Masih Bermasalah?</h4>
                                <p>Hubungi admin untuk bantuan lebih lanjut.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PrinterGuide;
