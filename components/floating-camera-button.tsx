"use client"

import { Camera, Crown, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"

interface FloatingCameraButtonProps {
  className?: string
}

interface PhotoCount {
  taken: number
  limit: number
  remaining: number
  canTake: boolean
}

export function FloatingCameraButton({ className }: FloatingCameraButtonProps) {
  const router = useRouter()
  const [photoCount, setPhotoCount] = useState<PhotoCount | null>(null)

  useEffect(() => {
    const fetchPhotoCount = async () => {
      try {
        const response = await fetch('/api/camera/count')
        // La API ahora retorna 200 incluso sin autenticación, así que siempre intentamos parsear
        const data = await response.json()
        setPhotoCount({
          taken: data.photosTaken || 0,
          limit: data.limit || 3,
          remaining: data.remaining !== undefined ? data.remaining : (data.limit || 3) - (data.photosTaken || 0),
          canTake: data.canTakePhoto !== false
        })
      } catch (error) {
        console.error('Error fetching photo count:', error)
        // En caso de error, usar valores por defecto
        setPhotoCount({
          taken: 0,
          limit: 3,
          remaining: 3,
          canTake: true
        })
      }
    }

    fetchPhotoCount()
  }, [])

  const handleClick = () => {
    router.push('/camera')
  }

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-3"
      style={{
        bottom: 'calc(7rem + env(safe-area-inset-bottom, 0px))'
      }}
    >
      {/* Photo Counter */}
      {photoCount && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-2 bg-black/90 backdrop-blur-sm rounded-full flex items-center gap-2 shadow-xl"
        >
          {photoCount.limit === Infinity ? (
            <>
              <Crown className="h-4 w-4 text-yellow-400" />
              <span className="text-white text-sm font-medium">Ilimitado</span>
            </>
          ) : (
            <>
              <Camera className="h-4 w-4 text-white" />
              <span className="text-white text-sm font-medium">
                {photoCount.taken}/{photoCount.limit}
              </span>
              {photoCount.remaining === 0 && (
                <AlertCircle className="h-4 w-4 text-red-400" />
              )}
            </>
          )}
        </motion.div>
      )}

      {/* Camera Button - Más grande y prominente */}
      <motion.button
        onClick={handleClick}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "h-20 w-20 rounded-full",
          "bg-primary text-primary-foreground",
          "shadow-2xl shadow-primary/50",
          "flex items-center justify-center",
          "transition-all duration-200",
          "border-4 border-primary/30",
          "relative",
          className
        )}
        aria-label="Escanear alimento"
      >
        <Camera className="h-8 w-8" />
        {/* Micro-animación de pulso */}
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/20"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.button>
      {/* Texto debajo del botón */}
      <p className="text-xs text-muted-foreground font-medium">Escanear alimento</p>
    </div>
  )
}

