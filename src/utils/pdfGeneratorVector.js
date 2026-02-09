// src/utils/pdfGeneratorVector.js
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { calculateLabelLayout } from './labelLayout';

export async function generateLabelPdfVector(data, sizeMm) {
  const { width, height } = sizeMm;
  // Standard thermal label usually 50x30, 55x40 etc.

  // Use 'pt' (points) for PDF standard units if possible, but mm is easier for physical labels.
  // jsPDF 'mm' unit is reliable.

  const quantity = sizeMm.quantity || 1; // Default to 1

  const doc = new jsPDF({
    unit: 'mm',
    format: [width, height],
    orientation: 'landscape',
    compress: true
  });

  // Metadata
  doc.setProperties({
    title: `${data.nt} - ${data.it}`,
    subject: 'Thermal Label',
    creator: 'Bintang Mas App'
  });

  // ---- Unified Layout Engine ----
  const measureText = (text, fontSize, isBold) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    return doc.getTextWidth(text);
  };

  const layout = calculateLabelLayout(data, measureText);
  const { qr, id, name, city, sales, branch } = layout;

  // Pre-generate QR Data URL once
  const qrDataUrl = await QRCode.toDataURL(data.raw || JSON.stringify(data), {
    errorCorrectionLevel: 'M',
    margin: 0,
    width: 256,
  });

  // Helper to render a single page
  const renderPage = () => {
    // 1. Render QR
    doc.addImage(qrDataUrl, 'PNG', qr.x, qr.y, qr.size, qr.size);

    // 2. Render ID
    doc.setFontSize(id.fontSize);
    doc.setFont('helvetica', id.isBold ? 'bold' : 'normal');
    doc.text(id.text, id.x, id.y);

    // 3. Render Name
    doc.setFontSize(name.fontSize);
    doc.setFont('helvetica', name.isBold ? 'bold' : 'normal');
    name.lines.forEach((line, index) => {
      doc.text(line, name.x, name.y + (index * name.lineHeightMm));
    });

    // 4. Render City
    doc.setFontSize(city.fontSize);
    doc.setFont('helvetica', city.isBold ? 'bold' : 'normal');
    city.lines.forEach((line, index) => {
      doc.text(line, city.x, city.y + (index * city.lineHeightMm));
    });

    // 5. Render Sales
    doc.setFontSize(sales.fontSize);
    doc.setFont('helvetica', sales.isBold ? 'bold' : 'normal');
    doc.text(sales.text, sales.x, sales.y);

    // 6. Render Branch
    if (branch.text) {
      doc.setFontSize(branch.fontSize);
      doc.setFont('helvetica', branch.isBold ? 'bold' : 'normal');
      doc.text(branch.text, branch.x, branch.y);
    }
  };

  // Loop for quantity
  for (let i = 0; i < quantity; i++) {
    if (i > 0) doc.addPage([width, height], 'landscape');
    renderPage();
  }

  // Filename Construction
  const cleanName = (data.nt || 'CUSTOMER').toString().replace(/[\\/:*?"<>|]/g, ' ').trim();
  const cleanCity = (data.at || 'CITY').toString().replace(/[\\/:*?"<>|]/g, ' ').trim();
  const filename = `${cleanName}_${cleanCity}_${data.it}.pdf`;

  if (sizeMm.returnBlob) {
    return {
      blob: doc.output('blob'),
      filename: filename
    };
  }

  doc.save(filename);
}
