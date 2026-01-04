import { NextResponse } from 'next/server'

export async function GET() {
  // Sin base de datos, retornar datos vacíos (modo demo)
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

