import { NextRequest, NextResponse } from 'next/server'
import { signIn } from '@/lib/auth'
import { loginSchema } from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar datos de entrada
    let validatedData
    try {
      validatedData = loginSchema.parse(body)
    } catch (validationError: any) {
      console.error('Validation error in signin:', validationError)
      if (validationError.name === 'ZodError') {
        return NextResponse.json(
          { error: validationError.errors[0].message },
          { status: 400 }
        )
      }
      throw validationError
    }

    console.log('Attempting signin for:', validatedData.email)
    const { error, user, session } = await signIn(
      validatedData.email,
      validatedData.password
    )

    if (error) {
      console.error('SignIn error:', error)
      // El mensaje de error ya viene formateado desde lib/auth.ts
      return NextResponse.json(
        { error: error },
        { status: 401 }
      )
    }

    if (!user) {
      console.error('SignIn succeeded but no user returned')
      return NextResponse.json(
        { error: 'Error al iniciar sesión' },
        { status: 500 }
      )
    }

    console.log('SignIn successful for user:', user.id)

    // Crear respuesta con headers para establecer cookies si hay sesión
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || null
      }
    })

    return response
  } catch (error: any) {
    console.error('Unexpected error in signin route:', error)
    return NextResponse.json(
      { error: 'Error inesperado al iniciar sesión' },
      { status: 500 }
    )
  }
}

