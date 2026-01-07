import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { createRouteHandlerClient } from '@/lib/supabase'
import { foodSchema } from '@/lib/validation'

/**
 * GET /api/foods/[id] - Obtener un alimento específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Validar autenticación
    const { error: authError, user } = await getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado. Por favor inicia sesión' },
        { status: 401 }
      )
    }

    const supabase = await createRouteHandlerClient()

    // Obtener el alimento
    const { data: food, error: fetchError } = await supabase
      .from('foods')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id) // Asegurar que pertenece al usuario
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Alimento no encontrado' },
          { status: 404 }
        )
      }
      console.error('Error fetching food:', fetchError)
      return NextResponse.json(
        { error: fetchError.message || 'Error al obtener el alimento' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      food
    })
  } catch (error: any) {
    console.error('Error in GET /api/foods/[id]:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener el alimento' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/foods/[id] - Actualizar un alimento
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
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
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const expiry = new Date(validatedData.expiryDate)
    expiry.setHours(0, 0, 0, 0)
    
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    let expiryStatus: 'expired' | 'expiring-soon' | 'safe'
    if (diffDays < 0) {
      expiryStatus = 'expired'
    } else if (diffDays <= 3) {
      expiryStatus = 'expiring-soon'
    } else {
      expiryStatus = 'safe'
    }

    // Convertir fecha de YYYY-MM-DD a formato DATE de PostgreSQL
    const expiryDate = new Date(validatedData.expiryDate).toISOString().split('T')[0]

    const supabase = await createRouteHandlerClient()

    // Actualizar el alimento
    const { data: foodData, error: updateError } = await supabase
      .from('foods')
      .update({
        name: validatedData.name,
        image_url: body.imageUrl || null,
        expiry_date: expiryDate,
        category: validatedData.category || null,
        notes: validatedData.notes || null,
        expiry_status: expiryStatus,
        days_until_expiry: Math.abs(diffDays),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id) // Asegurar que pertenece al usuario
      .select()
      .single()

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Alimento no encontrado' },
          { status: 404 }
        )
      }
      console.error('Error updating food:', updateError)
      return NextResponse.json(
        { error: updateError.message || 'Error al actualizar el alimento' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      food: foodData
    })
  } catch (error: any) {
    console.error('Error in PUT /api/foods/[id]:', error)
    
    // Manejar errores de validación de Zod
    if (error.name === 'ZodError' || error.issues) {
      const zodError = error.issues || error.errors || []
      const firstError = zodError[0]
      return NextResponse.json(
        { error: firstError?.message || 'Datos inválidos' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Error al actualizar el alimento' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/foods/[id] - Eliminar un alimento
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Validar autenticación
    const { error: authError, user } = await getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado. Por favor inicia sesión' },
        { status: 401 }
      )
    }

    const supabase = await createRouteHandlerClient()

    // Verificar que el alimento existe y pertenece al usuario
    const { data: existingFood, error: checkError } = await supabase
      .from('foods')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (checkError || !existingFood) {
      return NextResponse.json(
        { error: 'Alimento no encontrado' },
        { status: 404 }
      )
    }

    // Eliminar el alimento
    const { error: deleteError } = await supabase
      .from('foods')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting food:', deleteError)
      return NextResponse.json(
        { error: deleteError.message || 'Error al eliminar el alimento' },
        { status: 500 }
      )
    }

    // Actualizar food_count del usuario
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('food_count')
      .eq('id', user.id)
      .single()

    if (!userError && userData) {
      const newCount = Math.max(0, (userData.food_count || 0) - 1)
      
      const { error: countUpdateError } = await supabase
        .from('users')
        .update({ food_count: newCount })
        .eq('id', user.id)

      if (countUpdateError) {
        console.error('Error updating food_count:', countUpdateError)
        // No fallar la operación si solo falla el conteo
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Alimento eliminado correctamente'
    })
  } catch (error: any) {
    console.error('Error in DELETE /api/foods/[id]:', error)
    return NextResponse.json(
      { error: error.message || 'Error al eliminar el alimento' },
      { status: 500 }
    )
  }
}

