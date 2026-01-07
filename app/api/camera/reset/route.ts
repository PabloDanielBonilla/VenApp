import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { createRouteHandlerClient } from '@/lib/supabase'

// Ruta de desarrollo para resetear el contador de fotos
// Solo funciona en desarrollo (NODE_ENV !== 'production')
export async function POST(request: NextRequest) {
  // Solo permitir en desarrollo
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Esta ruta solo está disponible en desarrollo' },
      { status: 403 }
    )
  }

  try {
    const { error, user } = await getUser()

    if (error || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const supabase = await createRouteHandlerClient()

    // Resetear el contador de fotos del usuario actual
    const { error: updateError } = await supabase
      .from('users')
      .update({ photos_taken: 0 })
      .eq('id', user.id)

    if (updateError) {
      // Si la columna no existe, retornar un mensaje informativo
      if (updateError.code === '42703') {
        return NextResponse.json(
          { error: 'La columna photos_taken no existe. Ejecuta el script de migración primero.' },
          { status: 500 }
        )
      }
      
      console.error('Error resetting photo count:', updateError)
      return NextResponse.json(
        { error: 'Error al resetear el contador' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Contador de fotos reiniciado correctamente'
    })
  } catch (error: any) {
    console.error('Error in reset photo count route:', error)
    return NextResponse.json(
      { error: 'Error al resetear el contador' },
      { status: 500 }
    )
  }
}

