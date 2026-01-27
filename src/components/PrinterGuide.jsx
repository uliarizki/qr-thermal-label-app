import React, { useState } from 'react';
import { Icons } from './Icons';
import './PrinterGuide.css';

/**
 * PrinterGuide Component
 * Tutorial for printer driver installation using WinUSB (via Zadig) for WebUSB
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
                            <p>Aplikasi ini menggunakan <strong>WebUSB</strong> untuk cetak langsung ke printer thermal 58mm tanpa aplikasi tambahan.</p>

                            <div className="info-box">
                                <h4>✅ Printer yang Didukung</h4>
                                <ul>
                                    <li>EPPOS EP-RPP02</li>
                                    <li>Printer thermal ESC/POS compatible</li>
                                    <li>Koneksi: <strong>USB</strong> (kabel)</li>
                                    <li>Ukuran kertas: 58mm</li>
                                </ul>
                            </div>

                            <div className="info-box warning">
                                <h4>⚠️ Penting</h4>
                                <ul>
                                    <li>Windows perlu install <strong>WinUSB driver</strong> (gratis)</li>
                                    <li>Android sudah support langsung (OTG)</li>
                                    <li>Gunakan browser <strong>Chrome</strong> atau <strong>Edge</strong></li>
                                </ul>
                            </div>

                            <h3>Cara Kerja</h3>
                            <div className="method-cards">
                                <div className="method-card">
                                    <h4>🔌 Direct Print (WebUSB)</h4>
                                    <p>Klik tombol <strong>Connect</strong> di aplikasi, pilih printer, langsung cetak tanpa app tambahan.</p>
                                    <span className="badge recommended">Direkomendasikan</span>
                                </div>
                                <div className="method-card">
                                    <h4>📄 Share PDF</h4>
                                    <p>Download PDF lalu cetak manual via app printer (RawBT di Android).</p>
                                    <span className="badge">Alternatif</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'android' && (
                        <div className="section">
                            <h3>📱 Setup di Android</h3>

                            <div className="info-box">
                                <h4>✅ Kabar Baik!</h4>
                                <p>Android sudah mendukung WebUSB secara native. Tidak perlu install driver tambahan!</p>
                            </div>

                            <div className="step-list">
                                <div className="step">
                                    <div className="step-number">1</div>
                                    <div className="step-content">
                                        <h4>Siapkan Kabel OTG</h4>
                                        <p>Hubungkan printer ke HP menggunakan kabel <strong>USB OTG</strong>.</p>
                                        <ul>
                                            <li>Kabel OTG: USB-C atau Micro USB → USB-A</li>
                                            <li>Colok ke port HP</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="step">
                                    <div className="step-number">2</div>
                                    <div className="step-content">
                                        <h4>Nyalakan Printer</h4>
                                        <p>Pastikan printer thermal dalam keadaan <strong>ON</strong> dan kertas terpasang.</p>
                                    </div>
                                </div>

                                <div className="step">
                                    <div className="step-number">3</div>
                                    <div className="step-content">
                                        <h4>Buka Aplikasi di Chrome</h4>
                                        <p>Buka <code>qr-thermal-label-appn.vercel.app</code> di browser <strong>Chrome</strong>.</p>
                                    </div>
                                </div>

                                <div className="step">
                                    <div className="step-number">4</div>
                                    <div className="step-content">
                                        <h4>Klik Connect</h4>
                                        <p>Di Batch Tools atau halaman cetak:</p>
                                        <ul>
                                            <li>Klik tombol <strong>Connect</strong></li>
                                            <li>Pilih printer dari dialog</li>
                                            <li>Izinkan akses USB jika diminta</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="step">
                                    <div className="step-number">5</div>
                                    <div className="step-content">
                                        <h4>Cetak!</h4>
                                        <p>Setelah connected, langsung cetak label dengan klik tombol Print.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="info-box">
                                <h4>💡 Alternatif: RawBT</h4>
                                <p>Jika WebUSB tidak bekerja, pakai app <strong>RawBT</strong> untuk cetak via Bluetooth:</p>
                                <a
                                    href="https://play.google.com/store/apps/details?id=ru.a402d.rawbtprinter"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="download-btn"
                                >
                                    📥 Download RawBT
                                </a>
                            </div>
                        </div>
                    )}

                    {activeSection === 'windows' && (
                        <div className="section">
                            <h3>💻 Setup di Windows</h3>

                            <div className="info-box warning">
                                <h4>⚠️ Wajib Install WinUSB Driver</h4>
                                <p>Windows butuh driver <strong>WinUSB</strong> agar browser bisa akses printer via WebUSB. Install sekali saja menggunakan <strong>Zadig</strong>.</p>
                            </div>

                            <div className="step-list">
                                <div className="step">
                                    <div className="step-number">1</div>
                                    <div className="step-content">
                                        <h4>Download Zadig</h4>
                                        <p>Zadig adalah tool gratis untuk install WinUSB driver.</p>
                                        <a
                                            href="https://zadig.akeo.ie/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="download-btn"
                                        >
                                            📥 Download Zadig
                                        </a>
                                    </div>
                                </div>

                                <div className="step">
                                    <div className="step-number">2</div>
                                    <div className="step-content">
                                        <h4>Hubungkan Printer</h4>
                                        <p>Colok printer thermal ke port USB komputer dan <strong>nyalakan</strong>.</p>
                                    </div>
                                </div>

                                <div className="step">
                                    <div className="step-number">3</div>
                                    <div className="step-content">
                                        <h4>Jalankan Zadig</h4>
                                        <ul>
                                            <li>Buka file <code>zadig-2.x.exe</code></li>
                                            <li>Di menu, pilih <strong>Options → List All Devices</strong></li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="step">
                                    <div className="step-number">4</div>
                                    <div className="step-content">
                                        <h4>Pilih Printer</h4>
                                        <p>Di dropdown, cari dan pilih printer Anda:</p>
                                        <ul>
                                            <li>Biasanya bernama <code>USB Printing Support</code></li>
                                            <li>Atau <code>POS58</code>, <code>RPP02</code>, dll</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="step">
                                    <div className="step-number">5</div>
                                    <div className="step-content">
                                        <h4>Install WinUSB</h4>
                                        <ul>
                                            <li>Pastikan <strong>WinUSB</strong> terlihat di kolom driver</li>
                                            <li>Klik tombol <strong>Replace Driver</strong> atau <strong>Install Driver</strong></li>
                                            <li>Tunggu sampai selesai (1-2 menit)</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="step">
                                    <div className="step-number">6</div>
                                    <div className="step-content">
                                        <h4>Buka Chrome & Connect</h4>
                                        <p>Setelah driver terinstall:</p>
                                        <ul>
                                            <li>Buka <code>qr-thermal-label-appn.vercel.app</code> di <strong>Chrome</strong></li>
                                            <li>Klik <strong>Connect</strong></li>
                                            <li>Pilih printer dari dialog</li>
                                            <li>Selesai! Siap cetak</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div className="info-box">
                                <h4>💡 Tips</h4>
                                <ul>
                                    <li>Install driver cukup <strong>sekali saja</strong></li>
                                    <li>Jika ganti port USB, mungkin perlu install ulang</li>
                                    <li>Gunakan browser <strong>Chrome</strong> atau <strong>Edge</strong></li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {activeSection === 'troubleshoot' && (
                        <div className="section">
                            <h3>🔧 Troubleshooting</h3>

                            <div className="faq-list">
                                <div className="faq-item">
                                    <h4>❌ Printer tidak muncul di dialog Connect</h4>
                                    <ul>
                                        <li>Pastikan printer <strong>nyala</strong> dan terhubung USB</li>
                                        <li><strong>Windows:</strong> Sudah install WinUSB via Zadig?</li>
                                        <li>Coba cabut-colok kabel USB</li>
                                        <li>Restart browser Chrome</li>
                                    </ul>
                                </div>

                                <div className="faq-item">
                                    <h4>❌ Zadig tidak mendeteksi printer</h4>
                                    <ul>
                                        <li>Pastikan sudah klik <strong>Options → List All Devices</strong></li>
                                        <li>Coba port USB yang berbeda</li>
                                        <li>Pastikan printer dalam keadaan ON</li>
                                    </ul>
                                </div>

                                <div className="faq-item">
                                    <h4>❌ Connected tapi tidak bisa cetak</h4>
                                    <ul>
                                        <li>Cek kertas thermal terpasang dengan benar</li>
                                        <li>Pastikan <strong>sisi kertas yang benar</strong> menghadap head</li>
                                        <li>Coba disconnect lalu connect ulang</li>
                                    </ul>
                                </div>

                                <div className="faq-item">
                                    <h4>❌ Hasil cetak kosong / tidak jelas</h4>
                                    <ul>
                                        <li>Kertas thermal terpasang <strong>terbalik</strong> - balik sisi kertas</li>
                                        <li>Head printer kotor - bersihkan dengan alkohol</li>
                                        <li>Kertas thermal berkualitas rendah</li>
                                    </ul>
                                </div>

                                <div className="faq-item">
                                    <h4>❌ Android: USB tidak terdeteksi</h4>
                                    <ul>
                                        <li>Pastikan kabel OTG berfungsi (coba perangkat USB lain)</li>
                                        <li>Beberapa HP tidak support USB OTG</li>
                                        <li>Coba nyalakan ulang printer</li>
                                        <li>Alternatif: Gunakan RawBT + Bluetooth</li>
                                    </ul>
                                </div>

                                <div className="faq-item">
                                    <h4>❌ Browser tidak support WebUSB</h4>
                                    <ul>
                                        <li>Gunakan <strong>Chrome</strong> atau <strong>Edge</strong></li>
                                        <li>Firefox dan Safari <strong>tidak support</strong> WebUSB</li>
                                        <li>Pastikan browser versi terbaru</li>
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
