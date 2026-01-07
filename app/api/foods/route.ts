import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { createRouteHandlerClient } from '@/lib/supabase'
import { foodSchema } from '@/lib/validation'
import { scheduleFoodNotifications } from '@/lib/notifications'

/**
 * Calcular el estado de vencimiento y días hasta el vencimiento
 */
function calculateExpiryStatus(expiryDate: string): { status: 'expired' | 'expiring-soon' | 'safe', days: number } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const expiry = new Date(expiryDate)
  expiry.setHours(0, 0, 0, 0)
  
  const diffTime = expiry.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) {
    return { status: 'expired', days: Math.abs(diffDays) }
  } else if (diffDays <= 3) {
    return { status: 'expiring-soon', days: diffDays }
  } else {
    return { status: 'safe', days: diffDays }
  }
}

/**
 * POST /api/foods - Crear un nuevo alimento
 */
export async function POST(request: NextRequest) {
  try {
    // Validar autenticación
    const { error: authError, user } = await getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado. Por favor inicia sesión' },
        { status: 401 }
      )
    }

    // Validar datos del request
    const body = await request.json()
    const validatedData = foodSchema.parse({
      name: body.name,
      expiryDate: body.expiryDate,
      category: body.category || null,
      notes: body.notes || null
    })

    // Calcular estado de vencimiento
    const { status: expiryStatus, days: daysUntilExpiry } = calculateExpiryStatus(validatedData.expiryDate)

    // Convertir fecha de YYYY-MM-DD a formato DATE de PostgreSQL
    const expiryDate = new Date(validatedData.expiryDate).toISOString().split('T')[0]

    const supabase = await createRouteHandlerClient()

    // Insertar alimento en la base de datos
    const { data: foodData, error: insertError } = await supabase
      .from('foods')
      .insert({
        user_id: user.id,
        name: validatedData.name,
        image_url: body.imageUrl || null,
        expiry_date: expiryDate,
        category: validatedData.category || null,
        notes: validatedData.notes || null,
        expiry_status: expiryStatus,
        days_until_expiry: daysUntilExpiry
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting food:', insertError)
      
      // Mensajes de error más específicos
      let errorMessage = 'Error al guardar el alimento'
      
      if (insertError.code === '42P01') {
        errorMessage = 'La tabla de alimentos no existe. Por favor ejecuta el script de migración de Supabase.'
      } else if (insertError.code === '23503') {
        errorMessage = 'Error de referencia. Verifica que el usuario existe en la base de datos.'
      } else if (insertError.code === '23505') {
        errorMessage = 'Este alimento ya existe.'
      } else if (insertError.message) {
        errorMessage = insertError.message
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      )
    }

    // Actualizar food_count del usuario
    const { error: updateError } = await supabase.rpc('increment_food_count', {
      user_id_param: user.id
    })

    // Si la función RPC no existe, actualizar manualmente
    if (updateError) {
      console.warn('RPC increment_food_count not found, updating manually:', updateError)
      
      // Obtener el conteo actual
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('food_count')
        .eq('id', user.id)
        .single()

      if (!userError && userData) {
        const newCount = (userData.food_count || 0) + 1
        
        const { error: countUpdateError } = await supabase
          .from('users')
          .update({ food_count: newCount })
          .eq('id', user.id)

        if (countUpdateError) {
          console.error('Error updating food_count:', countUpdateError)
          // No fallar la operación si solo falla el conteo
        }
      }
    }

    // Programar notificaciones para el alimento
    try {
      await scheduleFoodNotifications(
        foodData.id,
        validatedData.name,
        new Date(expiryDate),
        user.id
      )
    } catch (notifError) {
      console.error('Error scheduling notifications:', notifError)
      // No fallar la operación si solo falla la programación de notificaciones
    }

    return NextResponse.json(
      {
        success: true,
        food: foodData
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error in POST /api/foods:', error)
    
    // Manejar errores de validación de Zod
    if (error.name === 'ZodError' || error.issues) {
      const zodError = error.issues || error.errors || []
      const firstError = zodError[0]
      return NextResponse.json(
        { error: firstError?.message || 'Datos inválidos' },
        { status: 400 }
      )
    }

    // Manejar errores de parsing JSON
    if (error instanceof SyntaxError || error.message?.includes('JSON')) {
      return NextResponse.json(
        { error: 'Datos inválidos en el request' },
        { status: 400 }
      )
    }

    // Manejar errores de Supabase no configurado
    if (error.message?.includes('Supabase no está configurado')) {
      return NextResponse.json(
        { error: 'Supabase no está configurado. Por favor configura las variables de entorno.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Error desconocido al guardar el alimento' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/foods - Obtener alimentos del usuario
 */
export async function GET(request: NextRequest) {
  try {
    // Validar autenticación
    const { error: authError, user } = await getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado. Por favor inicia sesión' },
        { status: 401 }
      )
    }

    const supabase = await createRouteHandlerClient()

    // Obtener parámetros de query
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') // 'expiring', 'expired', 'safe', null = todos

    // Construir query base
    let query = supabase
      .from('foods')
      .select('*')
      .eq('user_id', user.id)
      .order('expiry_date', { ascending: true })

    // Aplicar filtro si existe
    if (filter === 'expiring') {
      query = query.in('expiry_status', ['expiring-soon', 'expired'])
    } else if (filter === 'expired') {
      query = query.eq('expiry_status', 'expired')
    } else if (filter === 'safe') {
      query = query.eq('expiry_status', 'safe')
    }

    const { data: foods, error: fetchError } = await query

    if (fetchError) {
      console.error('Error fetching foods:', fetchError)
      return NextResponse.json(
        { error: fetchError.message || 'Error al obtener los alimentos' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      foods: foods || []
    })
  } catch (error: any) {
    console.error('Error in GET /api/foods:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener los alimentos' },
      { status: 500 }
    )
  }
}

