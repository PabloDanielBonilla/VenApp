import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { createRouteHandlerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Validar autenticación
    const { error: authError, user } = await getUser()
    
    // Si no hay usuario autenticado, retornar datos vacíos
    if (authError || !user) {
      return NextResponse.json({
        stats: {
          totalFoods: 0,
          expiredCount: 0,
          expiringSoonCount: 0,
          safeCount: 0
        },
        expiringFoods: [],
        userPlan: 'FREE' as const
      })
    }

    const supabase = await createRouteHandlerClient()

    // Obtener todos los alimentos del usuario
    const { data: foods, error: foodsError } = await supabase
      .from('foods')
      .select('*')
      .eq('user_id', user.id)
      .order('expiry_date', { ascending: true })

    if (foodsError) {
      console.error('Error fetching foods for dashboard:', foodsError)
      // Retornar datos vacíos en caso de error
      return NextResponse.json({
        stats: {
          totalFoods: 0,
          expiredCount: 0,
          expiringSoonCount: 0,
          safeCount: 0
        },
        expiringFoods: [],
        userPlan: 'FREE' as const
      })
    }

    const foodsArray = foods || []

    // Calcular estadísticas
    const stats = {
      totalFoods: foodsArray.length,
      expiredCount: foodsArray.filter(f => f.expiry_status === 'expired').length,
      expiringSoonCount: foodsArray.filter(f => f.expiry_status === 'expiring-soon').length,
      safeCount: foodsArray.filter(f => f.expiry_status === 'safe').length
    }

    // Obtener alimentos próximos a vencer (expiring-soon o expired, limitado a 5)
    const expiringFoods = foodsArray
      .filter(f => f.expiry_status === 'expiring-soon' || f.expiry_status === 'expired')
      .slice(0, 5)
      .map(food => ({
        id: food.id,
        name: food.name,
        expiryDate: food.expiry_date,
        daysUntilExpiry: food.days_until_expiry || 0,
        status: food.expiry_status as 'expired' | 'expiring-soon' | 'safe',
        category: food.category,
        imageUrl: food.image_url
      }))

    // Obtener el plan del usuario
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('plan')
      .eq('id', user.id)
      .single()

    const userPlan = (userData?.plan || 'FREE') as 'FREE' | 'PREMIUM_MONTHLY' | 'PREMIUM_YEARLY'

    return NextResponse.json({
      stats,
      expiringFoods,
      userPlan
    })
  } catch (error: any) {
    console.error('Error in GET /api/dashboard:', error)
    // Retornar datos vacíos en caso de error
    return NextResponse.json({
      stats: {
        totalFoods: 0,
        expiredCount: 0,
        expiringSoonCount: 0,
        safeCount: 0
      },
      expiringFoods: [],
      userPlan: 'FREE' as const
    })
  }
}

