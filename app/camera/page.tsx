'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, X, RotateCcw, Sparkles, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MobileWrapper } from '@/components/mobile-wrapper'
import { AuthGuard } from '@/components/auth-guard'

export default function CameraPage() {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [ocrResult, setOcrResult] = useState<{ foodName?: string; expiryDate?: string } | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [facingMode])

  const startCamera = async () => {
    setIsLoading(true)
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      })

      setStream(mediaStream)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.onloadedmetadata = () => {
          setIsLoading(false)
        }
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      setIsLoading(false)
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(video, 0, 0)

      // Convert to base64
      const imageData = canvas.toDataURL('image/jpeg', 0.9)
      setCapturedImage(imageData)

      // Stop camera to save battery
      stopCamera()
    }
  }

  const retakePhoto = () => {
    setCapturedImage(null)
    setOcrResult(null)
    startCamera()
  }

  const flipCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
  }

  const processImage = async () => {
    if (!capturedImage) return

    setIsProcessing(true)
    try {
      const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ image: capturedImage })
      })

      if (response.ok) {
        const data = await response.json()
        setOcrResult({
          foodName: data.foodName,
          expiryDate: data.expiryDate
        })
      }
    } catch (error) {
      console.error('Error processing image:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleContinue = () => {
    // Navigate to add food page with OCR results
    const params = new URLSearchParams()
    if (ocrResult?.foodName) params.set('name', ocrResult.foodName)
    if (ocrResult?.expiryDate) params.set('expiryDate', ocrResult.expiryDate)
    if (capturedImage) params.set('image', capturedImage)

    window.location.href = `/foods/add?${params.toString()}`
  }

  return (
    <AuthGuard action="tomar una foto">
      <div className="min-h-screen bg-black flex flex-col">
      {/* Camera View */}
      <div className="relative flex-1 flex flex-col">
        {/* Close Button */}
        <button
          onClick={() => window.history.back()}
          className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full backdrop-blur-sm"
        >
          <X className="h-6 w-6 text-white" />
        </button>

        {/* Video/Canvas Container */}
        <div className="relative flex-1 bg-black">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
            </div>
          )}

          {!capturedImage ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <AnimatePresence>
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full h-full"
              >
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="w-full h-full object-cover"
                />
              </motion.div>
            </AnimatePresence>
          )}

          <canvas ref={canvasRef} className="hidden" />

          {/* OCR Result Overlay */}
          <AnimatePresence>
            {ocrResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-6"
              >
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-green-400" />
                    <span className="text-sm font-medium text-green-400">IA detectada</span>
                  </div>
                  <p className="text-white font-semibold">{ocrResult.foodName || 'Alimento detectado'}</p>
                  {ocrResult.expiryDate && (
                    <p className="text-sm text-gray-300 mt-1">Vence: {ocrResult.expiryDate}</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="bg-black p-6">
          <AnimatePresence>
            {!capturedImage ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex items-center justify-between max-w-md mx-auto"
              >
                {/* Flip Camera Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={flipCamera}
                  className="h-12 w-12 bg-white/10 hover:bg-white/20"
                >
                  <RotateCcw className="h-5 w-5" />
                </Button>

                {/* Capture Button */}
                <button
                  onClick={captureImage}
                  className="w-20 h-20 rounded-full bg-white border-4 border-white/30 hover:scale-105 transition-transform"
                >
                  <Camera className="h-8 w-8 text-black mx-auto" />
                </button>

                {/* Spacer */}
                <div className="w-12 h-12" />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex gap-3 max-w-md mx-auto"
              >
                {/* Retake Button */}
                <Button
                  variant="outline"
                  onClick={retakePhoto}
                  disabled={isProcessing}
                  className="flex-1 h-12 bg-white/10 hover:bg-white/20 text-white border-white/20"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retomar
                </Button>

                {/* Process/Continue Button */}
                {ocrResult ? (
                  <Button
                    onClick={handleContinue}
                    className="flex-1 h-12 bg-green-500 hover:bg-green-600"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Continuar
                  </Button>
                ) : (
                  <Button
                    onClick={processImage}
                    disabled={isProcessing}
                    className="flex-1 h-12 bg-primary hover:bg-primary/90"
                  >
                    {isProcessing ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Detectar con IA
                      </>
                    )}
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      </div>
    </AuthGuard>
  )
}
