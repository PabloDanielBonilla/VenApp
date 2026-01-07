'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, X, RotateCcw, Sparkles, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MobileWrapper } from '@/components/mobile-wrapper'
import { AuthGuard } from '@/components/auth-guard'
import { toast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

export default function CameraPage() {
  const router = useRouter()
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [ocrResult, setOcrResult] = useState<{ foodName?: string; expiryDate?: string } | null>(null)
  const [photoCount, setPhotoCount] = useState<{ taken: number; limit: number; remaining: number; canTake: boolean } | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    startCamera()
    fetchPhotoCount()
    return () => {
      stopCamera()
    }
  }, [facingMode])

  const fetchPhotoCount = async () => {
    try {
      const response = await fetch('/api/camera/count')
      if (response.ok) {
        const data = await response.json()
        setPhotoCount({
          taken: data.photosTaken || 0,
          limit: data.limit || 3,
          remaining: data.remaining !== undefined ? data.remaining : (data.limit || 3) - (data.photosTaken || 0),
          canTake: data.canTakePhoto !== false
        })
      }
    } catch (error) {
      console.error('Error fetching photo count:', error)
    }
  }

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

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current) return

    // Verificar límite antes de capturar
    if (photoCount && !photoCount.canTake) {
      toast({
        title: 'Límite alcanzado',
        description: 'Has alcanzado el límite de 3 fotos del plan gratuito. Actualiza a Premium para fotos ilimitadas.',
        variant: 'destructive'
      })
      return
    }

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

      // Incrementar el conteo de fotos
      try {
        const response = await fetch('/api/camera/count', {
          method: 'POST'
        })
        if (response.ok) {
          const data = await response.json()
          setPhotoCount({
            taken: data.photosTaken || 0,
            limit: data.limit || 3,
            remaining: data.remaining !== undefined ? data.remaining : (data.limit || 3) - (data.photosTaken || 0),
            canTake: data.canTakePhoto !== false
          })
        }
      } catch (error) {
        console.error('Error updating photo count:', error)
      }

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
    if (!capturedImage) {
      toast({
        title: 'Error',
        description: 'No hay imagen para procesar',
        variant: 'destructive'
      })
      return
    }

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
        if (data.success) {
          setOcrResult({
            foodName: data.foodName,
            expiryDate: data.expiryDate
          })
          toast({
            title: 'Análisis completado',
            description: data.foodName ? `Detectado: ${data.foodName}` : 'Imagen procesada correctamente'
          })
        } else {
          toast({
            title: 'Error',
            description: data.error || 'No se pudo procesar la imagen',
            variant: 'destructive'
          })
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast({
          title: 'Error',
          description: errorData.error || 'Error al procesar la imagen',
          variant: 'destructive'
        })
      }
    } catch (error: any) {
      console.error('Error processing image:', error)
      toast({
        title: 'Error',
        description: error?.message || 'Error de conexión al procesar la imagen',
        variant: 'destructive'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleContinue = () => {
    // Guardar datos en sessionStorage para evitar problemas con URLs largas
    if (capturedImage) {
      sessionStorage.setItem('camera_image', capturedImage)
    }
    if (ocrResult?.foodName) {
      sessionStorage.setItem('camera_foodName', ocrResult.foodName)
    }
    if (ocrResult?.expiryDate) {
      sessionStorage.setItem('camera_expiryDate', ocrResult.expiryDate)
    }

    // Navigate to add food page with OCR results
    const params = new URLSearchParams()
    if (ocrResult?.foodName) params.set('name', ocrResult.foodName)
    if (ocrResult?.expiryDate) params.set('expiryDate', ocrResult.expiryDate)

    router.push(`/foods/add?${params.toString()}`)
  }

  return (
    <AuthGuard action="tomar una foto">
      <div className="fixed inset-0 bg-black flex flex-col overflow-hidden">
      {/* Camera View */}
      <div className="relative flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={() => window.history.back()}
          className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full backdrop-blur-sm"
        >
          <X className="h-6 w-6 text-white" />
        </button>

        {/* Video/Canvas Container */}
        <div className="relative flex-1 bg-black min-h-0">
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

        {/* Controls - Posicionado más arriba para no ser tapado por el navbar */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm pt-2 px-6 z-10" style={{ paddingBottom: 'calc(7rem + env(safe-area-inset-bottom, 0px))' }}>
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
                  disabled={photoCount ? !photoCount.canTake : false}
                  className={`
                    w-20 h-20 rounded-full border-4 transition-transform
                    ${photoCount && !photoCount.canTake
                      ? 'bg-gray-500 border-gray-400 cursor-not-allowed opacity-50'
                      : 'bg-white border-white/30 hover:scale-105'
                    }
                  `}
                >
                  <Camera className={`h-8 w-8 mx-auto ${photoCount && !photoCount.canTake ? 'text-gray-300' : 'text-black'}`} />
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
