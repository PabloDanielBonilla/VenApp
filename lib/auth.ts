import { createRouteHandlerClient, isSupabaseConfigured } from './supabase'
import { createClientComponentClient } from './supabase'

/**
 * Registrar nuevo usuario
 */
export async function signUp(email: string, password: string, name?: string) {
  if (!isSupabaseConfigured()) {
    return { error: 'Supabase no está configurado. Por favor, configura las variables de entorno.', user: null, session: null }
  }
  
  try {
    const supabase = await createRouteHandlerClient()
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || '',
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`
      }
    })

    if (error) {
      // Mejorar mensajes de error específicos
      const errorMessage = error.message.toLowerCase()
      
      if (errorMessage.includes('user already registered') || 
          errorMessage.includes('already exists') ||
          errorMessage.includes('duplicate') ||
          errorMessage.includes('email address is already registered')) {
        return { error: 'Este correo electrónico ya está registrado', user: null, session: null }
      }
      
      return { error: error.message, user: null, session: null }
    }

    return { error: null, user: data.user, session: data.session }
  } catch (error: any) {
    console.error('Error in signUp:', error)
    return { error: error.message || 'Error al registrar usuario', user: null, session: null }
  }
}

/**
 * Iniciar sesión
 */
export async function signIn(email: string, password: string) {
  if (!isSupabaseConfigured()) {
    return { error: 'Supabase no está configurado. Por favor, configura las variables de entorno.', user: null, session: null }
  }
  
  try {
    const supabase = await createRouteHandlerClient()
    
    // Intentar iniciar sesión
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password
    })

    if (error) {
      // Determinar el tipo de error específico
      const errorMessage = error.message.toLowerCase()
      
      if (errorMessage.includes('invalid login credentials') || 
          errorMessage.includes('invalid email or password')) {
        // Verificar si el correo existe consultando la tabla de usuarios
        const { data: emailCheck, error: emailError } = await supabase
          .from('users')
          .select('email')
          .eq('email', email.trim().toLowerCase())
          .maybeSingle()
        
        // Si no hay error pero tampoco hay datos, el correo no existe
        if (!emailError && !emailCheck) {
          return { error: 'No existe una cuenta con ese correo electrónico', user: null, session: null }
        }
        
        // Si el correo existe pero las credenciales son incorrectas
        return { error: 'Correo electrónico o contraseña incorrectos', user: null, session: null }
      }
      
      return { error: error.message, user: null, session: null }
    }

    return { error: null, user: data.user, session: data.session }
  } catch (error: any) {
    console.error('Error in signIn:', error)
    return { error: error.message || 'Error al iniciar sesión', user: null, session: null }
  }
}

/**
 * Cerrar sesión
 */
export async function signOut() {
  if (!isSupabaseConfigured()) {
    return { error: 'Supabase no está configurado. Por favor, configura las variables de entorno.' }
  }
  
  try {
    const supabase = await createRouteHandlerClient()
    
    const { error } = await supabase.auth.signOut()

    if (error) {
      return { error: error.message }
    }

    return { error: null }
  } catch (error: any) {
    console.error('Error in signOut:', error)
    return { error: error.message || 'Error al cerrar sesión' }
  }
}

/**
 * Iniciar sesión con Google (OAuth)
 * Nota: Esta función está diseñada para uso en el cliente.
 * Para uso en el servidor, usa directamente createRouteHandlerClient en la ruta API.
 */
export async function signInWithGoogle() {
  try {
    const supabase = createClientComponentClient()
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/callback`
      }
    })

    if (error) {
      return { error: error.message, url: null }
    }

    return { error: null, url: data.url }
  } catch (error: any) {
    console.error('Error in signInWithGoogle:', error)
    return { error: error.message || 'Error al iniciar sesión con Google', url: null }
  }
}

/**
 * Obtener usuario actual
 */
export async function getUser() {
  if (!isSupabaseConfigured()) {
    return { error: 'Supabase no está configurado. Por favor, configura las variables de entorno.', user: null }
  }
  
  try {
    const supabase = await createRouteHandlerClient()
    
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      return { error: error.message, user: null }
    }

    if (!user) {
      return { error: null, user: null }
    }

    // Obtener datos adicionales del perfil
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
    }

    return {
      error: null,
      user: {
        ...user,
        ...profile,
        plan: profile?.plan || 'FREE',
        notificationsEnabled: profile?.notifications_enabled ?? true
      }
    }
  } catch (error: any) {
    console.error('Error in getUser:', error)
    return { error: error.message || 'Error al obtener usuario', user: null }
  }
}

