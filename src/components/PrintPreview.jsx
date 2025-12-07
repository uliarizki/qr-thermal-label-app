import { useRef, useState } from 'react';
//import html2pdf from 'html2pdf.js';
import './components.css';
import { generateLabelPdfVector } from '../utils/pdfGeneratorVector';

const DEFAULT_SIZE = { width: 55, height: 40 }; // sebelumnya 55x40 atau 80x60

export default function PrintPreview({ data }) {
  const previewRef = useRef(null);
  const [customWidth, setCustomWidth] = useState(DEFAULT_SIZE.width);
  const [customHeight, setCustomHeight] = useState(DEFAULT_SIZE.height);
  const [useCustom, setUseCustom] = useState(false);

  const currentSize = useCustom
    ? { width: customWidth, height: customHeight }
    : DEFAULT_SIZE;

  const handlePrint = async () => {
    try {
      await generateLabelPdfVector(data, currentSize); // { width, height } dalam mm
      alert('✅ PDF berhasil di-generate!');
    } catch (err) {
      console.error('PDF error:', err);
      alert('❌ Gagal generate PDF');
    }
  };

  const maxPreviewWidthPx = 260; // kira2 lebar card, bisa kamu geser
  const mmToPx = 4;              // asumsi 1mm ≈ 4px di layar

  const previewScale = Math.min(
    maxPreviewWidthPx / (currentSize.width * mmToPx),
    1
  );

  return (
    <div className="customer-detail">
      <div className="print-controls">
        <h3>🖨️ Print Settings</h3>

        <div className="size-selector">
          <p>Default: 55 × 40 mm (thermal label)</p>

          <label>
            <input
              type="checkbox"
              checked={useCustom}
              onChange={(e) => setUseCustom(e.target.checked)}
            />
            Custom size (mm)
          </label>

          {useCustom && (
            <div className="custom-inputs">
              <div>
                <label>Lebar:</label>
                <input
                  type="number"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(Number(e.target.value))}
                  min="40"
                  max="100"
                />
              </div>
              <div>
                <label>Tinggi:</label>
                <input
                  type="number"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(Number(e.target.value))}
                  min="20"
                  max="80"
                />
              </div>
            </div>
          )}
        </div>

        <button onClick={handlePrint} className="print-btn">
          📥 Generate PDF & Print
        </button>
      </div>

      <div className="preview-container">
        <h3>Preview Label</h3>
        <div className="preview-wrapper">

          {/* SATU-SATUNYA ELEMEN YANG DIPakai PDF + PREVIEW */}
          <div
            ref={previewRef}
            className="label-root"
            style={{
              width: `${currentSize.width}mm`,
              height: `${currentSize.height}mm`,
              padding: '0mm',
              background: 'white',
              boxSizing: 'border-box',
              transform: `scale(${previewScale})`,
              transformOrigin: 'top left',
            }}
          >
            <LabelContent data={data} labelSize={currentSize} />
          </div>
        </div>
      </div>
    </div>
  );
}

function LabelContent({ data, labelSize }) {
  const size = labelSize || { width: 55, height: 40 }; // fallback

  const minSide = Math.min(size.width, size.height);
  const qrSize = minSide * 0.6;    // dari 0.45 -> 0.6 (QR membesar)
  const padding = minSide * 0.01;  // dari 0.02 -> 0.01 (tepi lebih mepet)
  const gap = minSide * 0.03;      // sedikit kurangi gap antar elemen

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        fontFamily: 'Arial, sans-serif',
        fontSize: `${size.height * 0.2}px`,
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        padding: `${padding}mm`,
      }}
    >
      {/* KIRI: QR + ID */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: `${gap}mm`,
          flexShrink: 0,
          marginRight: `${gap}mm`,
        }}
      >
        <div
          style={{
            width: `${qrSize}mm`,
            height: `${qrSize}mm`,
          }}
        >
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
              data.raw || JSON.stringify(data)
            )}`}
            alt="QR"
            style={{
              width: '100%',
              height: '100%',
              imageRendering: 'pixelated',
            }}
          />
        </div>
        <div
          style={{
            fontSize: `${size.height * 0.32}px`,
            fontWeight: 'bold',
            textAlign: 'center',
            lineHeight: 1.1,
          }}
        >
          {data.it}
        </div>
      </div>

      {/* KANAN: TEKS */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: `${size.height * 0.03}mm`,
          minWidth: 0,
        }}
      >
        <div
          style={{
            fontSize: `${size.height * 0.31}px`,
            fontWeight: 'bold',
            lineHeight: 1.1,
            whiteSpace: 'normal',
            wordWrap: 'break-word',
            maxHeight: '2.2em',
            overflow: 'hidden',
          }}
        >
          {data.nt}
        </div>
        <div
            style={{ 
            fontSize: `${size.height * 0.25}px`,
            fontWeight: 700, 
            }}>
            {data.at}
        </div>
        <div 
            style={{ 
            fontSize: `${size.height * 0.25}px`,
            fontWeight: 700, 
            }}>
            {data.pt}
        </div>
        <div
          style={{
            marginTop: 'auto',
            fontSize: `${size.height * 0.28}px`,
            fontWeight: 700,
          }}
        >
          {data.ws}
        </div>
      </div>
    </div>
  );
}
