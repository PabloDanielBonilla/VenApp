import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createRouteHandlerClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Redirigir al home después de la autenticación
  return NextResponse.redirect(new URL('/', requestUrl.origin))
}

