"use client"

import { useEffect } from 'react'
import { processAndSendPendingNotifications } from '@/lib/notifications-client'

/**
 * Componente que verifica y procesa notificaciones pendientes periódicamente
 */
export function NotificationChecker() {
  useEffect(() => {
    // Verificar notificaciones cuando el componente se monta
    const checkNotifications = async () => {
      try {
        await processAndSendPendingNotifications()
      } catch (error) {
        console.error('Error checking notifications:', error)
      }
    }

    // Verificar inmediatamente
    checkNotifications()

    // Verificar cada 5 minutos (300000 ms)
    const interval = setInterval(() => {
      checkNotifications()
    }, 5 * 60 * 1000)

    // También verificar cuando la ventana vuelve a estar visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkNotifications()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Limpiar al desmontar
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return null // Este componente no renderiza nada
}

