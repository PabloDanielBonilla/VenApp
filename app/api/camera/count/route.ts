import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { createRouteHandlerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { error, user } = await getUser()

    // Si no hay usuario autenticado, retornar límites del plan FREE sin error
    if (error || !user) {
      return NextResponse.json({
        photosTaken: 0,
        limit: 3,
        remaining: 3,
        canTakePhoto: true,
        plan: 'FREE'
      })
    }

    const supabase = await createRouteHandlerClient()
    
    // Obtener el perfil del usuario con el conteo de fotos
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('plan')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return NextResponse.json(
        { error: 'Error al obtener el conteo de fotos' },
        { status: 500 }
      )
    }

    // Intentar obtener photos_taken, si no existe usar 0
    let photosTaken = 0
    try {
      const { data: profileWithPhotos, error: photosError } = await supabase
        .from('users')
        .select('photos_taken')
        .eq('id', user.id)
        .single()
      
      if (!photosError && profileWithPhotos) {
        photosTaken = profileWithPhotos.photos_taken || 0
      }
    } catch (error) {
      // Si la columna no existe, usar 0 como valor por defecto
      console.warn('Column photos_taken may not exist, using default 0')
      photosTaken = 0
    }
    const plan = profile?.plan || 'FREE'
    
    // Determinar el límite según el plan
    const isPremium = plan === 'PREMIUM_MONTHLY' || plan === 'PREMIUM_YEARLY'
    const limit = isPremium ? Infinity : 3
    const remaining = isPremium ? Infinity : Math.max(0, limit - photosTaken)
    const canTakePhoto = isPremium || photosTaken < limit

    return NextResponse.json({
      photosTaken,
      limit,
      remaining,
      canTakePhoto,
      plan
    })
  } catch (error: any) {
    console.error('Error in camera count route:', error)
    return NextResponse.json(
      { error: 'Error al obtener el conteo de fotos' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error, user } = await getUser()

    if (error || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const supabase = await createRouteHandlerClient()
    
    // Obtener el plan del usuario
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('plan')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return NextResponse.json(
        { error: 'Error al obtener el perfil' },
        { status: 500 }
      )
    }

    const plan = profile?.plan || 'FREE'
    const isPremium = plan === 'PREMIUM_MONTHLY' || plan === 'PREMIUM_YEARLY'
    
    // Obtener el conteo actual de fotos
    let currentPhotosTaken = 0
    try {
      const { data: profileWithPhotos, error: photosError } = await supabase
        .from('users')
        .select('photos_taken')
        .eq('id', user.id)
        .single()
      
      if (!photosError && profileWithPhotos?.photos_taken !== undefined) {
        currentPhotosTaken = profileWithPhotos.photos_taken || 0
      }
    } catch (error) {
      // Si la columna no existe, usar 0
      console.warn('Column photos_taken may not exist, using default 0')
      currentPhotosTaken = 0
    }
    
    // Solo incrementar si no es premium o si no ha alcanzado el límite
    if (!isPremium && currentPhotosTaken >= 3) {
      return NextResponse.json(
        { error: 'Has alcanzado el límite de fotos para el plan gratuito' },
        { status: 403 }
      )
    }

    // Intentar incrementar el conteo
    let newCount = currentPhotosTaken + 1
    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({ photos_taken: newCount })
        .eq('id', user.id)

      if (updateError) {
        // Si la columna no existe, solo retornar el conteo sin guardar
        if (updateError.code === '42703') {
          console.warn('Column photos_taken does not exist, skipping update')
        } else {
          console.error('Error updating photos count:', updateError)
          return NextResponse.json(
            { error: 'Error al actualizar el conteo de fotos' },
            { status: 500 }
          )
        }
      }
    } catch (error: any) {
      // Si hay un error pero no es crítico, continuar
      console.warn('Error updating photos count, but continuing:', error)
    }
    const limit = isPremium ? Infinity : 3
    const remaining = isPremium ? Infinity : Math.max(0, limit - newCount)

    return NextResponse.json({
      success: true,
      photosTaken: newCount,
      limit,
      remaining,
      canTakePhoto: isPremium || newCount < limit
    })
  } catch (error: any) {
    console.error('Error in camera count POST route:', error)
    return NextResponse.json(
      { error: 'Error al actualizar el conteo de fotos' },
      { status: 500 }
    )
  }
}

