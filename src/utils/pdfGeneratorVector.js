// src/utils/pdfGeneratorVector.js
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

export async function generateLabelPdfVector(data, sizeMm) {
  const { width, height } = sizeMm; // mm, contoh: { width: 55, height: 40 }
  const scale = 8.75;               // perbesar 1.75x dari skala sebelumnya (5x)
  const scaledWidth = width * scale;
  const scaledHeight = height * scale;

  const doc = new jsPDF({
    unit: 'mm',
    format: [scaledWidth, scaledHeight],
    orientation: 'landscape',
  });

  // ---- Layout mengikuti PrintPreview.jsx ----
  const minSide = Math.min(scaledWidth, scaledHeight);
  const padding = minSide * 0.01;        // sama dengan preview padding
  const gap = minSide * 0.03;            // jarak antar elemen
  const qrSize = minSide * 0.6;          // 60% sisi terkecil

  // Konversi px (dipakai di preview) ke pt (dipakai jsPDF)
  const pxToPt = (px) => px * 0.75;      // 1px ≈ 0.75pt
  const ptPerMm = 2.83465;
  const pxToMm = (px) => (px * 0.264583); // 1px ≈ 0.2646mm

  // Font sizes meniru proporsi di preview (Update to match PrintPreview exactly)
  const nameFontPt = pxToPt(scaledHeight * 0.31);
  const cityFontPt = pxToPt(scaledHeight * 0.25);
  const typeFontPt = pxToPt(scaledHeight * 0.25);
  const idFontPt = pxToPt(scaledHeight * 0.32);
  const wsFontPt = pxToPt(scaledHeight * 0.28); // Was same as ID, now explicit 0.28 matching CSS

  const lineHeight = (pt) => (pt / ptPerMm) * 1.1; // line height dalam mm

  // Posisi QR
  const qrX = padding;
  const qrY = padding;

  // Posisi kolom teks (kanan QR)
  const textX = qrX + qrSize + gap;
  let textY = padding + lineHeight(nameFontPt); // mulai sedikit di bawah header

  // ---- Generate QR ----
  const qrDataUrl = await QRCode.toDataURL(data.raw || JSON.stringify(data), {
    errorCorrectionLevel: 'M',
    margin: 0,
    scale: 8,
  });

  doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

  const safeText = (v) => (v || '').toString();

  // ---- NAMA CUSTOMER: multi-line ----
  const customerName = safeText(data.nt);

  // Set font sebelum split supaya perhitungan lebar sesuai
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(nameFontPt);

  // Lebar kolom teks kanan menyesuaikan padding & gap (pepet ke batas 55mm)
  const maxNameWidth = scaledWidth - textX - padding;
  const nameLines = doc.splitTextToSize(customerName, maxNameWidth);

  doc.text(nameLines, textX, textY, { lineHeightFactor: 1.1 });

  // turunkan textY sesuai jumlah baris nama
  textY += nameLines.length * lineHeight(nameFontPt) + gap * 0.4;

  // ---- Baris kota ----
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(cityFontPt);
  doc.text(safeText(data.at), textX, textY);

  // ---- Baris pabrik / sales ----
  textY += lineHeight(cityFontPt);
  doc.setFont('helvetica', 'bold');

  // Logic positioning WS (Cabang) -> Bottom Alignment like marginTop: auto
  const wsText = safeText(data.ws);
  doc.setFontSize(wsFontPt);
  const wsWidth = doc.getTextWidth(wsText);
  const rightPadding = padding + gap * 0.6; // sedikit lebih lega dari kanan
  const wsX = scaledWidth - rightPadding - wsWidth;

  // Align WS to bottom padding
  const wsY = scaledHeight - padding - (wsFontPt / ptPerMm * 0.2); // Adjust baseline slightly

  // Calculate max text Y to avoid collision
  const maxTextY = wsY - gap - lineHeight(wsFontPt);

  doc.setFontSize(typeFontPt);
  if (textY > maxTextY) textY = maxTextY;
  doc.text(safeText(data.pt), textX, textY);

  // ---- BT SMG di pojok kanan bawah ----
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(wsFontPt);
  doc.text(wsText, wsX, wsY);

  // ---- ID di bawah QR, center ----
  // Independent positioning: QR Bottom + Gap + Font Height
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(idFontPt);
  doc.setFont('helvetica', 'bold');

  const idText = safeText(data.it);
  const idWidth = doc.getTextWidth(idText);
  const idX = qrX + qrSize / 2 - idWidth / 2;  // tengah QR

  // Position ID strictly below QR
  const idLineHeight = lineHeight(idFontPt);
  const idY = qrY + qrSize + gap + idLineHeight * 0.8; // Approximate visual center below QR

  doc.text(idText, idX, idY);

  // ---- Nama file aman ----
  const safeName = (customerName || 'CUSTOMER')
    .replace(/[\\/:*?"<>|]/g, '')
    .slice(0, 30)
    .trim();

  const safeCity = (data.at || 'CITY')
    .replace(/[\\/:*?"<>|]/g, '')
    .slice(0, 30)
    .trim();

  const filename = `${safeName}_${safeCity}_${idText}.pdf`;

  if (sizeMm.returnBlob) {
    return {
      blob: doc.output('blob'),
      filename: filename
    };
  }

  doc.save(filename);
}
