import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { sendTestNotification } from '@/lib/notifications'

/**
 * POST /api/notifications/test - Enviar una notificación de prueba
 */
export async function POST(request: NextRequest) {
  try {
    const { error, user } = await getUser()

    if (error || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const title = body.title || 'Notificación de prueba'
    const message = body.message || 'Esta es una notificación de prueba de VenAi'

    // Esta función debe ejecutarse en el cliente, pero podemos retornar un mensaje
    return NextResponse.json({
      success: true,
      message: 'Para probar notificaciones, usa la función en el cliente. Revisa la consola del navegador.'
    })
  } catch (error: any) {
    console.error('Error in test notification route:', error)
    return NextResponse.json(
      { error: error.message || 'Error al probar notificación' },
      { status: 500 }
    )
  }
}

