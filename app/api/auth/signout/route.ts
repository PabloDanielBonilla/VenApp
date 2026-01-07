import { NextRequest, NextResponse } from 'next/server'
import { signOut } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { error } = await signOut()

    if (error) {
      return NextResponse.json(
        { error: error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Sesión cerrada correctamente'
    })
  } catch (error: any) {
    console.error('Error in signout route:', error)
    return NextResponse.json(
      { error: 'Error al cerrar sesión' },
      { status: 500 }
    )
  }
}

