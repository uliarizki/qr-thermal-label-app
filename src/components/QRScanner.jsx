import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { addHistory } from '../utils/history'
import './components.css'

export default function QRScanner({ onScan }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [hasCamera, setHasCamera] = useState(true)
  const [isScanning, setIsScanning] = useState(true)
  const [lastScanned, setLastScanned] = useState(null)
  const [error, setError] = useState(null)
  const [permissionDenied, setPermissionDenied] = useState(false)

  useEffect(() => {
    const stopTracks = () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop())
        videoRef.current.srcObject = null
      }
    }

    const startCamera = async () => {
      try {
        if (!window.isSecureContext) {
          setHasCamera(false)
          setError('Akses kamera membutuhkan HTTPS atau localhost.')
          setPermissionDenied(true)
          return
        }

        if (!navigator.mediaDevices?.getUserMedia) {
          setHasCamera(false)
          setError('Browser tidak mendukung akses kamera. Coba gunakan Chrome/Firefox versi terbaru dengan HTTPS.')
          setPermissionDenied(true)
          return
        }

        // hentikan stream lama sebelum meminta yang baru
        stopTracks()

        const requestStream = async () => {
          // coba environment, fallback ke default "user"
          try {
            return await navigator.mediaDevices.getUserMedia({
              video: {
                facingMode: { ideal: 'environment' },
                width: { ideal: 1280 },
                height: { ideal: 720 }
              },
              audio: false
            })
          } catch (err) {
            // fallback jika environment tidak tersedia
            return await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false
            })
          }
        }

        const stream = await requestStream()
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.setAttribute('playsinline', 'true')
          videoRef.current.muted = true
          // Chrome kadang butuh play() agar memicu permintaan izin
          const playPromise = videoRef.current.play()
          if (playPromise?.catch) {
            playPromise.catch(() => {})
          }
        }
        setHasCamera(true)
        setError(null)
        setPermissionDenied(false)
      } catch (error) {
        console.error('Error accessing camera:', error)
        setHasCamera(false)
        const msg =
          error?.name === 'NotAllowedError'
            ? 'Akses kamera ditolak. Beri izin kamera di browser.'
            : error?.name === 'NotFoundError'
              ? 'Kamera tidak ditemukan. Pastikan perangkat memiliki kamera.'
              : 'Kamera tidak tersedia. Pastikan Anda memberikan izin akses kamera.'
        setError(msg)
        setPermissionDenied(error?.name === 'NotAllowedError')
      }
    }

    if (isScanning) {
      startCamera()
    }

    return () => {
      stopTracks()
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
              
              // Log history
              addHistory('SCAN', {
                customerId: data.it,
                nama: data.nt,
                kota: data.at || '',
              })
              
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
        {permissionDenied && (
          <button
            className="rescan-btn"
            onClick={() => {
              setIsScanning(true)
              setPermissionDenied(false)
              setError(null)
            }}
          >
            🔄 Aktifkan kamera kembali
          </button>
        )}
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
