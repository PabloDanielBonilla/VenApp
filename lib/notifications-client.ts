/**
 * Funciones de notificaciones para uso en el cliente (navegador)
 * Estas funciones NO importan next/headers ni funciones del servidor
 */

/**
 * Enviar notificación programada al Service Worker (función cliente)
 * @param title Título de la notificación
 * @param message Mensaje de la notificación
 * @param options Opciones adicionales para la notificación
 */
export async function sendScheduledNotification(
  title: string,
  message: string,
  options?: {
    icon?: string
    badge?: string
    tag?: string
    data?: string
    vibrate?: number[]
  }
): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false
  }

  try {
    // Obtener el Service Worker activo
    const registration = await navigator.serviceWorker.ready

    if (!registration.active) {
      console.error('Service Worker no está activo')
      return false
    }

    // Enviar mensaje al Service Worker para mostrar la notificación
    registration.active.postMessage({
      type: 'SHOW_NOTIFICATION',
      title,
      options: {
        body: message,
        icon: options?.icon || '/icon-192.png',
        badge: options?.badge || '/icon-96.png',
        tag: options?.tag || 'venai',
        data: options?.data || '/',
        vibrate: options?.vibrate || [200, 100, 200],
        requireInteraction: false
      }
    })

    return true
  } catch (error) {
    console.error('Error sending scheduled notification:', error)
    return false
  }
}

/**
 * Procesar y enviar notificaciones pendientes (función cliente)
 * Llama al endpoint de procesamiento y luego envía las notificaciones al Service Worker
 * Esta función solo puede usarse en el cliente (navegador)
 */
export async function processAndSendPendingNotifications(): Promise<{
  success: boolean
  processed: number
  errors: number
}> {
  if (typeof window === 'undefined') {
    return { success: false, processed: 0, errors: 0 }
  }

  try {
    // Verificar permisos de notificación
    if (!('Notification' in window)) {
      console.log('Notificaciones no soportadas en este navegador')
      return { success: false, processed: 0, errors: 0 }
    }

    if (Notification.permission !== 'granted') {
      // No solicitar permiso automáticamente, solo procesar si ya está concedido
      return { success: false, processed: 0, errors: 0 }
    }

    // Primero, procesar las notificaciones en el servidor (generar recetas, actualizar mensajes)
    const processResponse = await fetch('/api/notifications/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!processResponse.ok) {
      throw new Error('Error al procesar notificaciones')
    }

    const processData = await processResponse.json()

    // Si se procesaron notificaciones, obtenerlas y enviarlas al Service Worker
    if (processData.processed > 0) {
      // Obtener las notificaciones recién procesadas para enviarlas
      const notificationsResponse = await fetch('/api/notifications/pending')
      if (notificationsResponse.ok) {
        const notifications = await notificationsResponse.json()
        
        // Enviar cada notificación al Service Worker
        for (const notification of notifications) {
          await sendScheduledNotification(
            notification.title,
            notification.message,
            {
              tag: `notification-${notification.id}`,
              data: '/recipes'
            }
          )
        }
      }
    }

    return {
      success: true,
      processed: processData.processed || 0,
      errors: processData.errors || 0
    }
  } catch (error: any) {
    console.error('Error processing pending notifications:', error)
    return {
      success: false,
      processed: 0,
      errors: 1
    }
  }
}

