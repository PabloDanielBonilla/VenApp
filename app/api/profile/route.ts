import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { createRouteHandlerClient } from '@/lib/supabase'
import { updateProfileSchema } from '@/lib/validation'

export async function GET(request: NextRequest) {
  try {
    const { error, user } = await getUser()

    if (error || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name || null,
        plan: user.plan || 'FREE',
        notificationsEnabled: user.notificationsEnabled ?? true,
        image: user.image || null
      }
    })
  } catch (error: any) {
    console.error('Error in profile GET route:', error)
    return NextResponse.json(
      { error: 'Error al obtener perfil' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { error: authError, user: authUser } = await getUser()

    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validar datos de entrada
    let validatedData
    try {
      validatedData = updateProfileSchema.parse(body)
    } catch (validationError: any) {
      if (validationError.name === 'ZodError') {
        return NextResponse.json(
          { error: validationError.errors[0].message },
          { status: 400 }
        )
      }
      throw validationError
    }

    const supabase = await createRouteHandlerClient()
    
    // Actualizar perfil en la base de datos
    const updateData: any = {}
    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name
    }
    if (validatedData.notificationsEnabled !== undefined) {
      updateData.notifications_enabled = validatedData.notificationsEnabled
    }

    const { data, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', authUser.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return NextResponse.json(
        { error: 'Error al actualizar perfil' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.id,
        email: data.email,
        name: data.name,
        plan: data.plan,
        notificationsEnabled: data.notifications_enabled
      }
    })
  } catch (error: any) {
    console.error('Error in profile PUT route:', error)
    return NextResponse.json(
      { error: 'Error al actualizar perfil' },
      { status: 500 }
    )
  }
}

