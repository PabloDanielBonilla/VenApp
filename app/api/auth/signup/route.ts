import { NextRequest, NextResponse } from 'next/server'
import { signUp } from '@/lib/auth'
import { registerSchema } from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Signup request body:', { email: body.email, hasPassword: !!body.password, hasName: !!body.name })
    
    // Validar datos de entrada
    let validatedData
    try {
      validatedData = registerSchema.parse(body)
      console.log('Validation passed for signup')
    } catch (validationError: any) {
      console.error('Validation error in signup:', {
        name: validationError.name,
        errors: validationError.errors,
        body: body
      })
      if (validationError.name === 'ZodError') {
        const errorMessage = validationError.errors[0]?.message || 'Error de validación'
        console.error('Returning validation error:', errorMessage)
        return NextResponse.json(
          { error: errorMessage },
          { status: 400 }
        )
      }
      throw validationError
    }

    console.log('Attempting signup for:', validatedData.email)
    const { error, user, session } = await signUp(
      validatedData.email,
      validatedData.password,
      validatedData.name
    )

    if (error) {
      console.error('SignUp error:', {
        message: error,
        type: typeof error,
        fullError: JSON.stringify(error, null, 2)
      })

      // Mensaje de error más específico
      let errorMessage = typeof error === 'string' ? error : error.message || 'Error al registrar usuario'
      
      const errorLower = errorMessage.toLowerCase()
      if (errorLower.includes('user already registered') || 
          errorLower.includes('already exists') ||
          errorLower.includes('duplicate') ||
          errorLower.includes('23505') ||
          errorLower.includes('email address is already registered')) {
        errorMessage = 'Este correo electrónico ya está registrado'
      } else if (errorLower.includes('password') && 
                 (errorLower.includes('too short') || 
                  errorLower.includes('at least') ||
                  errorLower.includes('minimum'))) {
        errorMessage = 'La contraseña debe tener al menos 6 caracteres'
      } else if (errorLower.includes('email') && 
                 (errorLower.includes('invalid') || 
                  errorLower.includes('format') ||
                  errorLower.includes('malformed'))) {
        errorMessage = 'Correo electrónico inválido'
      } else if (errorLower.includes('database error saving new user') ||
                 errorLower.includes('database error')) {
        errorMessage = 'Error al crear usuario. Verifica que la base de datos esté configurada correctamente.'
      }
      
      console.error('Returning error to client:', errorMessage)
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      )
    }

    if (!user) {
      console.error('SignUp succeeded but no user returned')
      return NextResponse.json(
        { error: 'Error al registrar usuario' },
        { status: 500 }
      )
    }

    console.log('SignUp successful for user:', user.id)

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
    console.error('Unexpected error in signup route:', error)
    return NextResponse.json(
      { error: 'Error inesperado al registrar usuario' },
      { status: 500 }
    )
  }
}

