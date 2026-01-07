import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const requestUrl = new URL(request.url)
    const origin = requestUrl.origin
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/api/auth/callback`
      }
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    if (!data.url) {
      return NextResponse.json(
        { error: 'No se pudo generar la URL de autenticación' },
        { status: 500 }
      )
    }

    // Redirigir a la URL de OAuth de Google
    return NextResponse.redirect(data.url)
  } catch (error: any) {
    console.error('Error in google auth route:', error)
    return NextResponse.json(
      { error: 'Error al iniciar sesión con Google' },
      { status: 500 }
    )
  }
}

