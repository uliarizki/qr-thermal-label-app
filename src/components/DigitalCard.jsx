import React, { forwardRef } from 'react';
import QRCode from 'react-qr-code';
import './DigitalCard.css';

const DigitalCard = forwardRef(({ customer }, ref) => {
    if (!customer) return null;

    return (
        <div className="digital-card-container" ref={ref}>
            <div className="digital-card">
                {/* Background Overlay / Pattern */}
                {/* Background Overlay / Pattern */}
                <div className="card-overlay"></div>

                {/* Security Watermark Layer */}
                <div className="watermark-layer"></div>

                {/* Header: Logo & Branding */}
                <div className="card-header">
                    <div className="brand-logo">
                        <img src="/logo_brand.png" alt="Bintang Mas" style={{ height: 40, opacity: 0.9 }} crossOrigin="anonymous" />
                        <span className="brand-name">Bintang Mas</span>
                    </div>
                    <span className="card-type">PRIORITY MEMBER</span>
                </div>

                {/* Body: Info & QR */}
                <div className="card-body">
                    <div className="info-section">
                        {/* Dynamic Font Size Logic */}
                        <h2
                            className="customer-name-large"
                            style={{
                                fontSize: customer.nama.length > 30 ? '1.1rem' :
                                    customer.nama.length > 20 ? '1.3rem' : '1.6rem'
                            }}
                        >
                            {customer.nama}
                        </h2>
                        <div className="info-grid">
                            <div className="info-item">
                                <label>ID NUMBER</label>
                                <span>{customer.id}</span>
                            </div>
                            <div className="info-item">
                                <label>CITY / REGION</label>
                                <span>{customer.kota}</span>
                            </div>
                            <div className="info-item">
                                <label>BRANCH</label>
                                <span>{customer.cabang || '-'}</span>
                            </div>
                            <div className="info-item">
                                <label>WHOLESALER</label>
                                <span>{customer.sales || '-'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="qr-section-card">
                        <div className="qr-box">
                            <QRCode
                                value={customer.kode || customer.id || 'N/A'}
                                size={120}
                                viewBox={`0 0 256 256`}
                                fgColor="#000000"
                                bgColor="#ffffff"
                                level="M"
                            />
                        </div>
                        <span className="scan-me">SCAN ME</span>
                    </div>
                </div>

                {/* Footer */}
                <div className="card-footer">
                    <span>www.stargold.id</span>
                    <span>Verified Customer</span>
                </div>
            </div>
        </div>
    );
});

export default DigitalCard;
