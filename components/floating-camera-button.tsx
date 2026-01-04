"use client"

import { Camera } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface FloatingCameraButtonProps {
  className?: string
}

export function FloatingCameraButton({ className }: FloatingCameraButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    router.push('/camera')
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "fixed bottom-24 left-1/2 -translate-x-1/2 z-50",
        "h-16 w-16 rounded-full",
        "bg-white text-black",
        "shadow-lg shadow-white/25",
        "flex items-center justify-center",
        "hover:scale-110 active:scale-95",
        "transition-all duration-200",
        "border-4 border-white/20",
        className
      )}
      aria-label="Abrir cámara"
    >
      <Camera className="h-7 w-7" />
    </button>
  )
}

