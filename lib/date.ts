import { differenceInDays, format, isToday, isFuture, isPast, addDays } from 'date-fns'
import type { ExpiryStatus } from '@/types'

/**
 * Calcula los días restantes hasta la fecha de vencimiento
 */
export function getDaysUntilExpiry(expiryDate: Date): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(expiryDate)
  expiry.setHours(0, 0, 0, 0)
  return differenceInDays(expiry, today)
}

/**
 * Obtiene el estado de vencimiento de un alimento
 */
export function getExpiryStatus(expiryDate: Date): ExpiryStatus {
  const daysUntil = getDaysUntilExpiry(expiryDate)

  if (daysUntil < 0) {
    return {
      status: 'expired',
      daysUntilExpiry: daysUntil,
      message: `Vencido hace ${Math.abs(daysUntil)} ${Math.abs(daysUntil) === 1 ? 'día' : 'días'}`,
      color: 'text-red-500'
    }
  }

  if (daysUntil === 0) {
    return {
      status: 'expiring-soon',
      daysUntilExpiry: 0,
      message: 'Vence hoy',
      color: 'text-red-500'
    }
  }

  if (daysUntil <= 3) {
    return {
      status: 'expiring-soon',
      daysUntilExpiry: daysUntil,
      message: `Vence en ${daysUntil} ${daysUntil === 1 ? 'día' : 'días'}`,
      color: 'text-orange-500'
    }
  }

  return {
    status: 'safe',
    daysUntilExpiry: daysUntil,
    message: `Vence en ${daysUntil} días`,
    color: 'text-green-500'
  }
}

/**
 * Formatea una fecha para mostrarla al usuario
 */
export function formatExpiryDate(date: Date): string {
  return format(date, 'dd/MM/yyyy', { locale: undefined })
}

/**
 * Calcula la fecha para las notificaciones
 */
export function getNotificationDates(expiryDate: Date) {
  return {
    threeDaysBefore: addDays(expiryDate, -3),
    onExpiryDay: expiryDate
  }
}

/**
 * Verifica si una fecha es válida para vencimiento
 */
export function isValidExpiryDate(date: Date): boolean {
  return isFuture(date) || isToday(date)
}

/**
 * Agrupa alimentos por estado de vencimiento
 */
export function groupFoodsByStatus(foods: Array<{ expiryDate: Date }>) {
  const expired: Array<{ expiryDate: Date }> = []
  const expiringSoon: Array<{ expiryDate: Date }> = []
  const safe: Array<{ expiryDate: Date }> = []

  foods.forEach(food => {
    const status = getExpiryStatus(food.expiryDate)
    if (status.status === 'expired') {
      expired.push(food)
    } else if (status.status === 'expiring-soon') {
      expiringSoon.push(food)
    } else {
      safe.push(food)
    }
  })

  return { expired, expiringSoon, safe }
}

