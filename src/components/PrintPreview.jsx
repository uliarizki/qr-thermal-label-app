import { useRef, useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import html2canvas from 'html2canvas'; // Import html2canvas
import QRCode from 'react-qr-code'; // Local QR Generation
import './Components.css';
import { generateLabelPdfVector } from '../utils/pdfGeneratorVector';
import { shareOrDownload, downloadBlob } from '../utils/shareUtils';
import { Icons } from './Icons';
import { calculateLabelLayout } from '../utils/labelLayout';

const DEFAULT_SIZE = { width: 55, height: 40 }; // sebelumnya 55x40 atau 80x60

export default function PrintPreview({ data }) {
  const previewRef = useRef(null);
  const [customWidth, setCustomWidth] = useState(DEFAULT_SIZE.width);
  const [customHeight, setCustomHeight] = useState(DEFAULT_SIZE.height);
  const [useCustom, setUseCustom] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false); // Status: false -> 'loading' -> 'success'

  const currentSize = useCustom
    ? { width: customWidth, height: customHeight }
    : DEFAULT_SIZE;



  const handlePrint = async () => {
    if (isPrinting) return;

    setIsPrinting('loading');
    try {
      // Generate blob, function inside now handles return based on arg
      const { blob, filename } = await generateLabelPdfVector(data, { ...currentSize, returnBlob: true });

      downloadBlob(blob, filename);

      setIsPrinting('success');
      toast.success('PDF Saved Successfully!', { duration: 3000, icon: '📥' });
      setTimeout(() => setIsPrinting(false), 2000);
    } catch (err) {
      console.error('PDF error:', err);
      setIsPrinting(false);
      toast.error('Gagal generate PDF');
    }
  };

  const handleShare = async () => {
    const toastId = toast.loading('Generating PDF...');
    try {
      const { blob, filename } = await generateLabelPdfVector(data, { ...currentSize, returnBlob: true });

      await shareOrDownload(blob, filename, 'Label PDF', 'Print using Rongta/Thermal Printer App', 'application/pdf');
      toast.dismiss(toastId); // Dismiss loading toast on success
    } catch (err) {
      console.error('Share error:', err);
      toast.error('Gagal Share PDF', { id: toastId }); // Replace loading with error
    }
  };

  // Keyboard Shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check for Ctrl+P or Command+P
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        handlePrint(); // Now handlePrint is defined in scope
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPrinting, customWidth, customHeight, useCustom, data]);

  const maxPreviewWidthPx = 260; // kira2 lebar card, bisa kamu geser
  const mmToPx = 4;              // asumsi 1mm ≈ 4px di layar

  const previewScale = Math.min(
    maxPreviewWidthPx / (currentSize.width * mmToPx),
    1
  );

  return (
    <div className="customer-detail">
      <div className="print-controls">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h3>🖨️ Print Settings</h3>
          {/* Fallback info for desktop */}
          {!navigator.share && <span style={{ fontSize: '0.8em', color: '#666' }}>Web Share not supported</span>}
        </div>

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

        <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
          {/* TOMBOL KIRI: DOWNLOAD PDF */}
          <button
            onClick={handlePrint}
            className={`print-btn ${isPrinting === 'success' ? 'success' : ''}`}
            disabled={isPrinting === 'loading'}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px'
            }}
          >
            {isPrinting === 'loading' ? (
              <>
                <span className="animate-spin"><Icons.Refresh size={20} /></span>
                <span>Generating...</span>
              </>
            ) : isPrinting === 'success' ? (
              <>
                <Icons.Check size={20} />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Icons.Download size={20} />
                <span>Save PDF</span>
              </>
            )}
          </button>

          {/* TOMBOL KANAN: DIRECT SHARE */}
          <button
            onClick={handleShare}
            className="print-btn"
            style={{
              flex: 1,
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              cursor: 'pointer'
            }}
            title="Share or Open PDF"
          >
            <Icons.Share size={20} />
            <span>Direct Share</span>
          </button>
        </div>
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



// ... (existing imports, keep them)

// Helper to measure text in browser approx mm
const measureTextBrowser = (text, fontSizePt, isBold) => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  // conversion: 1pt approx 1.333px, 1mm approx 3.78px
  const fontSizePx = fontSizePt * 1.333;
  context.font = `${isBold ? 'bold ' : ''}${fontSizePx}px Helvetica, Arial, sans-serif`;
  const widthPx = context.measureText(text).width;
  return (widthPx / 3.78) * 1.1; // +10% buffer to be safe vs PDF rendering
};

function LabelContent({ data, labelSize }) {
  // Calculate layout using the shared engine
  const layout = calculateLabelLayout(data, measureTextBrowser);
  const { qr, id, name, city, sales, branch } = layout;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        fontFamily: 'Helvetica, Arial, sans-serif',
        // Visual debug: border? No.
      }}
    >
      {/* 1. QR Code */}
      <div
        style={{
          position: 'absolute',
          left: `${qr.x}mm`,
          top: `${qr.y}mm`,
          width: `${qr.size}mm`,
          height: `${qr.size}mm`,
        }}
      >
        <QRCode
          value={data.raw || JSON.stringify(data)}
          size={256}
          style={{ height: "100%", width: "100%" }}
          viewBox={`0 0 256 256`}
        />
      </div>

      {/* 2. ID */}
      <div
        style={{
          position: 'absolute',
          left: `${id.x}mm`,
          top: `${id.y}mm`,
          fontSize: `${id.fontSize}pt`,
          fontWeight: id.isBold ? 'bold' : 'normal',
          lineHeight: 1,
          whiteSpace: 'nowrap',
        }}
      >
        {id.text}
      </div>

      {/* 3. Name (Lines) */}
      {name.lines.map((line, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            left: `${name.x}mm`,
            // Fix: Combine baseline adjustment AND line spacing offset
            top: `${(name.y + (index * name.lineHeightMm)) - (name.fontSize * 0.28)}mm`,
            fontSize: `${name.fontSize}pt`,
            fontWeight: name.isBold ? 'bold' : 'normal',
            whiteSpace: 'nowrap',
            lineHeight: 1,
          }}
        >
          {line}
        </div>
      ))}

      {/* 4. City (Lines) */}
      {city.lines.map((line, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            left: `${city.x}mm`,
            top: `${(city.y + (index * city.lineHeightMm)) - (city.fontSize * 0.28)}mm`,
            fontSize: `${city.fontSize}pt`,
            fontWeight: city.isBold ? 'bold' : 'normal',
            lineHeight: 1,
            whiteSpace: 'nowrap',
          }}
        >
          {line}
        </div>
      ))}

      {/* 5. Sales */}
      <div
        style={{
          position: 'absolute',
          left: `${sales.x}mm`,
          top: `${sales.y - (sales.fontSize * 0.28)}mm`,
          fontSize: `${sales.fontSize}pt`,
          fontWeight: sales.isBold ? 'bold' : 'normal',
          lineHeight: 1,
          whiteSpace: 'nowrap',
        }}
      >
        {sales.text}
      </div>

      {/* 6. Branch */}
      {branch.text && (
        <div
          style={{
            position: 'absolute',
            left: `${branch.x}mm`,
            top: `${branch.y - (branch.fontSize * 0.28)}mm`,
            fontSize: `${branch.fontSize}pt`,
            fontWeight: branch.isBold ? 'bold' : 'normal',
            lineHeight: 1,
            whiteSpace: 'nowrap',
          }}
        >
          {branch.text}
        </div>
      )}
    </div>
  );
}
