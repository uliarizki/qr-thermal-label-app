import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import './components.css'

export default function QRScanner({ onScan }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [hasCamera, setHasCamera] = useState(true)
  const [isScanning, setIsScanning] = useState(true)
  const [lastScanned, setLastScanned] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch (error) {
        console.error('Error accessing camera:', error)
        setHasCamera(false)
        setError('Kamera tidak tersedia. Pastikan Anda memberikan izin akses kamera.')
      }
    }

    if (isScanning) {
      startCamera()
    }

    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop())
      }
    }
  }, [isScanning])

  useEffect(() => {
    if (!isScanning) return

    const scanQR = () => {
      const video = videoRef.current
      const canvas = canvasRef.current

      if (video?.readyState === video?.HAVE_ENOUGH_DATA && canvas) {
        const ctx = canvas.getContext('2d')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        ctx.drawImage(video, 0, 0)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height)

        if (code) {
          try {
            const data = JSON.parse(code.data)
            if (data.it && data.nt) {
              setLastScanned(data)
              setIsScanning(false)
              setError(null)
              onScan(data)
            }
          } catch (e) {
            console.log('Invalid JSON in QR code')
          }
        }
      }

      requestAnimationFrame(scanQR)
    }

    const frameId = requestAnimationFrame(scanQR)
    return () => cancelAnimationFrame(frameId)
  }, [isScanning, onScan])

  if (!hasCamera) {
    return (
      <div className="scanner-container">
        <div className="error-box">
          ❌ {error}
        </div>
      </div>
    )
  }

  return (
    <div className="scanner-container">
      <div className="scanner-box">
        <video
          ref={videoRef}
          className="scanner-video"
          autoPlay
          playsInline
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <div className="scanner-overlay">
          <div className="scanner-frame"></div>
        </div>
        {isScanning && <p className="scanner-hint">Arahkan kamera ke QR Code</p>}
      </div>

      {lastScanned && (
        <div className="last-scanned">
          <h3>📍 Terakhir di-scan:</h3>
          <p><strong>{lastScanned.nt}</strong></p>
          <p>ID: {lastScanned.it}</p>
          <button onClick={() => setIsScanning(true)} className="rescan-btn">
            🔄 Scan Ulang
          </button>
        </div>
      )}

      <button
        className={`toggle-btn ${isScanning ? 'scanning' : 'paused'}`}
        onClick={() => setIsScanning(!isScanning)}
      >
        {isScanning ? '⏸️ Pause Scanner' : '▶️ Resume Scanner'}
      </button>
    </div>
  )
}
