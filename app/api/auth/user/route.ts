import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { error, user } = await getUser()

    if (error || !user) {
      // Retornar 200 con un objeto que indica que no hay usuario
      // Esto evita que el navegador muestre 401 como error en la consola
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 200 }
      )
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || user.user_metadata?.name || null,
        plan: user.plan || 'FREE',
        notificationsEnabled: user.notificationsEnabled ?? true,
        image: user.image || user.user_metadata?.avatar_url || null
      }
    })
  } catch (error: any) {
    console.error('Error in user route:', error)
    return NextResponse.json(
      { authenticated: false, error: 'Error al obtener usuario', user: null },
      { status: 200 }
    )
  }
}

