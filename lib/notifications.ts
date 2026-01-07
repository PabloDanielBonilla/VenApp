import { createRouteHandlerClient } from './supabase'

export type NotificationType = 'EXPIRY_SOON' | 'EXPIRY_TODAY' | 'RECIPE_SUGGESTION' | 'SUBSCRIPTION_RENEWAL'

/**
 * Programar notificaciones para un alimento
 * Programa 4 notificaciones: 3, 2, 1 días antes y el día de vencimiento
 */
export async function scheduleFoodNotifications(
  foodId: string,
  foodName: string,
  expiryDate: Date,
  userId: string
): Promise<void> {
  try {
    const supabase = await createRouteHandlerClient()

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const expiry = new Date(expiryDate)
    expiry.setHours(0, 0, 0, 0)
    
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    const notificationsToInsert: any[] = []

    // Notificación 3 días antes
    if (diffDays >= 3) {
      const threeDaysBefore = new Date(expiry)
      threeDaysBefore.setDate(threeDaysBefore.getDate() - 3)
      threeDaysBefore.setHours(9, 0, 0, 0) // 9 AM

      notificationsToInsert.push({
        user_id: userId,
        title: 'Alimento próximo a vencer',
        message: `${foodName} vence en 3 días`,
        type: 'EXPIRY_SOON',
        scheduled: threeDaysBefore.toISOString(),
        sent: false
      })
    }

    // Notificación 2 días antes
    if (diffDays >= 2) {
      const twoDaysBefore = new Date(expiry)
      twoDaysBefore.setDate(twoDaysBefore.getDate() - 2)
      twoDaysBefore.setHours(9, 0, 0, 0) // 9 AM

      notificationsToInsert.push({
        user_id: userId,
        title: 'Alimento próximo a vencer',
        message: `${foodName} vence en 2 días`,
        type: 'EXPIRY_SOON',
        scheduled: twoDaysBefore.toISOString(),
        sent: false
      })
    }

    // Notificación 1 día antes
    if (diffDays >= 1) {
      const oneDayBefore = new Date(expiry)
      oneDayBefore.setDate(oneDayBefore.getDate() - 1)
      oneDayBefore.setHours(9, 0, 0, 0) // 9 AM

      notificationsToInsert.push({
        user_id: userId,
        title: 'Alimento próximo a vencer',
        message: `${foodName} vence mañana`,
        type: 'EXPIRY_SOON',
        scheduled: oneDayBefore.toISOString(),
        sent: false
      })
    }

    // Notificación el día que vence
    if (diffDays >= 0) {
      const expiryDay = new Date(expiry)
      expiryDay.setHours(9, 0, 0, 0) // 9 AM

      notificationsToInsert.push({
        user_id: userId,
        title: 'Alimento vence hoy',
        message: `${foodName} vence hoy`,
        type: 'EXPIRY_TODAY',
        scheduled: expiryDay.toISOString(),
        sent: false
      })
    }

    // Insertar todas las notificaciones de una vez
    if (notificationsToInsert.length > 0) {
      const { error } = await supabase.from('notifications').insert(notificationsToInsert)
      if (error) {
        console.error('Error inserting notifications:', error)
      }
    }
  } catch (error) {
    console.error('Error scheduling notifications:', error)
  }
}

/**
 * Enviar notificación push del navegador (para pruebas)
 */
export async function sendTestNotification(
  title: string,
  message: string
): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false
  }

  // Solicitar permiso si no está concedido
  if (Notification.permission === 'default') {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      return false
    }
  }

  if (Notification.permission === 'granted') {
    try {
      const notification = new Notification(title, {
        body: message,
        icon: '/icon-192.png',
        badge: '/icon-96.png',
        tag: 'venai',
        requireInteraction: false
      })

      // Cerrar automáticamente después de 5 segundos
      setTimeout(() => {
        notification.close()
      }, 5000)

      return true
    } catch (error) {
      console.error('Error sending notification:', error)
      return false
    }
  }

  return false
}

/**
 * Obtener notificaciones pendientes del usuario
 */
export async function getPendingNotifications(userId: string) {
  try {
    const supabase = await createRouteHandlerClient()

    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('sent', false)
      .lte('scheduled', now)
      .order('scheduled', { ascending: true })

    if (error) {
      console.error('Error fetching notifications:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error getting notifications:', error)
    return []
  }
}

/**
 * Marcar notificación como enviada
 */
export async function markNotificationAsSent(notificationId: string) {
  try {
    const supabase = await createRouteHandlerClient()

    await supabase
      .from('notifications')
      .update({ sent: true })
      .eq('id', notificationId)
  } catch (error) {
    console.error('Error marking notification as sent:', error)
  }
}

/**
 * Obtener alimentos próximos a vencer para un usuario
 * @param userId ID del usuario
 * @param days Número de días hasta el vencimiento (ej: 3 para alimentos que vencen en 3 días)
 * @returns Lista de nombres de alimentos
 */
export async function getExpiringFoodsForUser(
  userId: string,
  days: number
): Promise<string[]> {
  try {
    const supabase = await createRouteHandlerClient()

    // Obtener alimentos que vencen en los próximos días (hasta el día especificado)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const maxDate = new Date(today)
    maxDate.setDate(maxDate.getDate() + days)
    maxDate.setHours(23, 59, 59, 999)

    const { data, error } = await supabase
      .from('foods')
      .select('name, expiry_date')
      .eq('user_id', userId)
      .gte('expiry_date', today.toISOString().split('T')[0])
      .lte('expiry_date', maxDate.toISOString().split('T')[0])
      .in('expiry_status', ['expiring-soon', 'expired'])

    if (error) {
      console.error('Error fetching expiring foods:', error)
      return []
    }

    return (data || []).map((food: any) => food.name)
  } catch (error) {
    console.error('Error getting expiring foods:', error)
    return []
  }
}

/**
 * Generar receta para notificación usando alimentos próximos a vencer
 * @param ingredients Lista de nombres de ingredientes
 * @returns Objeto con título y descripción de la receta, o null si falla
 */
export async function generateRecipeForNotification(
  ingredients: string[]
): Promise<{ title: string; description: string } | null> {
  try {
    if (!ingredients || ingredients.length === 0) {
      return null
    }

    // Determinar la URL base según el entorno
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL
    if (!baseUrl) {
      // Si estamos en el servidor, usar localhost
      if (typeof window === 'undefined') {
        baseUrl = process.env.VERCEL_URL 
          ? `https://${process.env.VERCEL_URL}` 
          : 'http://localhost:3000'
      } else {
        // Si estamos en el cliente, usar la URL actual
        baseUrl = window.location.origin
      }
    }

    const response = await fetch(`${baseUrl}/api/recipes/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ingredients: ingredients
      })
    })

    if (!response.ok) {
      console.error('Error generating recipe:', response.statusText)
      return null
    }

    const data = await response.json()
    if (data.recipe && data.recipe.title) {
      return {
        title: data.recipe.title,
        description: data.recipe.description || ''
      }
    }

    return null
  } catch (error) {
    console.error('Error generating recipe for notification:', error)
    return null
  }
}

// Las funciones cliente (sendScheduledNotification y processAndSendPendingNotifications)
// se han movido a lib/notifications-client.ts para evitar importar next/headers en el cliente

