import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { createRouteHandlerClient } from '@/lib/supabase'

/**
 * Obtener notificaciones pendientes del usuario autenticado
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const supabase = await createRouteHandlerClient()
    const now = new Date().toISOString()

    // Obtener notificaciones pendientes que ya fueron procesadas (sent = true)
    // pero que aún no han sido leídas, para enviarlas al cliente
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('sent', true)
      .eq('read', false)
      .lte('scheduled', now)
      .order('scheduled', { ascending: false })
      .limit(10) // Limitar a las últimas 10

    if (error) {
      console.error('Error fetching pending notifications:', error)
      return NextResponse.json(
        { error: 'Error al obtener notificaciones' },
        { status: 500 }
      )
    }

    return NextResponse.json(notifications || [])
  } catch (error: any) {
    console.error('Error in GET /api/notifications/pending:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener notificaciones' },
      { status: 500 }
    )
  }
}

