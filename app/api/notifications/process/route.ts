import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { createRouteHandlerClient } from '@/lib/supabase'
import { getExpiringFoodsForUser, generateRecipeForNotification } from '@/lib/notifications'

/**
 * Procesar y enviar notificaciones pendientes
 * Este endpoint obtiene todas las notificaciones pendientes, genera recetas
 * y actualiza los mensajes con las recomendaciones
 */
export async function POST(request: NextRequest) {
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

    // Obtener todas las notificaciones pendientes del usuario
    const { data: pendingNotifications, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('sent', false)
      .lte('scheduled', now)
      .order('scheduled', { ascending: true })

    if (fetchError) {
      console.error('Error fetching pending notifications:', fetchError)
      return NextResponse.json(
        { error: 'Error al obtener notificaciones pendientes' },
        { status: 500 }
      )
    }

    if (!pendingNotifications || pendingNotifications.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        message: 'No hay notificaciones pendientes'
      })
    }

    let processed = 0
    let errors = 0

    // Procesar cada notificación
    for (const notification of pendingNotifications) {
      try {
        // Determinar cuántos días hasta el vencimiento basado en el mensaje
        let daysUntilExpiry = 0
        if (notification.message.includes('vence en 3 días')) {
          daysUntilExpiry = 3
        } else if (notification.message.includes('vence en 2 días')) {
          daysUntilExpiry = 2
        } else if (notification.message.includes('vence mañana')) {
          daysUntilExpiry = 1
        } else if (notification.message.includes('vence hoy')) {
          daysUntilExpiry = 0
        }

        // Obtener TODOS los alimentos próximos a vencer (hasta el día especificado)
        // Esto incluye alimentos que vencen en 0, 1, 2, 3 días, etc.
        const allExpiringFoods: string[] = []
        for (let i = 0; i <= daysUntilExpiry; i++) {
          const foods = await getExpiringFoodsForUser(user.id, i)
          allExpiringFoods.push(...foods)
        }
        
        // Eliminar duplicados
        const expiringFoods = Array.from(new Set(allExpiringFoods))

        let updatedMessage = notification.message
        let updatedTitle = notification.title

        // Si hay alimentos próximos a vencer, generar receta
        if (expiringFoods.length > 0) {
          const recipe = await generateRecipeForNotification(expiringFoods)

          if (recipe && recipe.title) {
            updatedMessage = `${notification.message}. Te recomendamos: ${recipe.title}`
            if (recipe.description) {
              updatedMessage += ` - ${recipe.description}`
            }
          }
        }

        // Actualizar la notificación con el mensaje que incluye la receta
        const { error: updateError } = await supabase
          .from('notifications')
          .update({
            message: updatedMessage,
            title: updatedTitle,
            sent: true
          })
          .eq('id', notification.id)

        if (updateError) {
          console.error(`Error updating notification ${notification.id}:`, updateError)
          errors++
        } else {
          processed++
        }
      } catch (error: any) {
        console.error(`Error processing notification ${notification.id}:`, error)
        errors++
      }
    }

    return NextResponse.json({
      success: true,
      processed,
      errors,
      total: pendingNotifications.length
    })
  } catch (error: any) {
    console.error('Error in POST /api/notifications/process:', error)
    return NextResponse.json(
      { error: error.message || 'Error al procesar notificaciones' },
      { status: 500 }
    )
  }
}

