// Utility untuk generate PDF dari label
export const generateLabelPDF = async (data, paperSize) => {
  try {
    // Create canvas element untuk label
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    // Convert mm to pixels (1mm = 3.779 pixels @ 96 DPI)
    const mmToPx = 3.779
    const width = paperSize.width * mmToPx
    const height = paperSize.height * mmToPx

    canvas.width = width
    canvas.height = height

    // White background
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, width, height)

    // Border
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 1
    ctx.strokeRect(0, 0, width, height)

    // Draw QR Code placeholder (dalam praktik, pakai library QR code)
    const qrSize = Math.min(width, height) * 0.4
    ctx.fillStyle = '#F0F0F0'
    ctx.fillRect(width * 0.05, height * 0.05, qrSize, qrSize)
    ctx.fillStyle = '#999999'
    ctx.font = '10px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('QR', width * 0.05 + qrSize / 2, height * 0.05 + qrSize / 2 + 5)

    // ID under QR
    ctx.fillStyle = '#000000'
    ctx.font = 'bold 8px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(data.it, width * 0.05 + qrSize / 2, height * 0.05 + qrSize + 12)

    // Customer Name (largest)
    ctx.font = 'bold 12px Arial'
    ctx.textAlign = 'left'
    ctx.fillText(data.nt, width * 0.5, height * 0.2)

    // City
    ctx.font = 'normal 9px Arial'
    ctx.fillText(data.at, width * 0.5, height * 0.35)

    // Property Type
    ctx.font = 'normal 8px Arial'
    ctx.fillText(data.pt || '-', width * 0.5, height * 0.5)

    // Warehouse/Branch (medium)
    ctx.font = 'bold 11px Arial'
    ctx.fillText(data.ws, width * 0.5, height * 0.75)

    // Convert canvas to image
    return canvas.toDataURL('image/png')
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw error
  }
}

// Get recommended DPI untuk thermal printer
export const getThermalPrinterDPI = () => {
  return 300 // 300 DPI recommended untuk thermal label printer
}

// Calculate label dimensions
export const calculateLabelDimensions = (paperWidth, paperHeight, unit = 'mm') => {
  if (unit === 'mm') {
    return {
      width: paperWidth,
      height: paperHeight,
      widthInches: paperWidth / 25.4,
      heightInches: paperHeight / 25.4
    }
  }
  return {
    width: paperWidth * 25.4,
    height: paperHeight * 25.4,
    widthInches: paperWidth,
    heightInches: paperHeight
  }
}
