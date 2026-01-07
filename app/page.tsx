'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, TrendingUp, Utensils, ArrowRight, Crown, ChefHat } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MobileWrapper } from '@/components/mobile-wrapper'
import { cn } from '@/lib/utils'

interface FoodItem {
  id: string
  name: string
  expiryDate: string
  daysUntilExpiry: number
  status: 'expired' | 'expiring-soon' | 'safe'
  category?: string
  imageUrl?: string
}

interface DashboardStats {
  totalFoods: number
  expiredCount: number
  expiringSoonCount: number
  safeCount: number
}

export default function HomePage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalFoods: 0,
    expiredCount: 0,
    expiringSoonCount: 0,
    safeCount: 0
  })
  const [expiringFoods, setExpiringFoods] = useState<FoodItem[]>([])
  const [loading, setLoading] = useState(true)
  const [userPlan, setUserPlan] = useState<'FREE' | 'PREMIUM_MONTHLY' | 'PREMIUM_YEARLY'>('FREE')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats || {
          totalFoods: 0,
          expiredCount: 0,
          expiringSoonCount: 0,
          safeCount: 0
        })
        setExpiringFoods(data.expiringFoods || [])
        setUserPlan(data.userPlan || 'FREE')
      } else {
        // Cualquier error, usar datos por defecto
        setStats({
          totalFoods: 0,
          expiredCount: 0,
          expiringSoonCount: 0,
          safeCount: 0
        })
        setExpiringFoods([])
        setUserPlan('FREE')
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      // En caso de error, usar datos por defecto
      setStats({
        totalFoods: 0,
        expiredCount: 0,
        expiringSoonCount: 0,
        safeCount: 0
      })
      setExpiringFoods([])
      setUserPlan('FREE')
    } finally {
      // Siempre detener el loading
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'expired':
        return 'bg-red-500/10 text-red-500 border-red-500/20'
      case 'expiring-soon':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20'
      default:
        return 'bg-green-500/10 text-green-500 border-green-500/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'expired':
        return <AlertCircle className="h-4 w-4" />
      case 'expiring-soon':
        return <TrendingUp className="h-4 w-4" />
      default:
        return <Utensils className="h-4 w-4" />
    }
  }

  const getDaysMessage = (days: number) => {
    if (days < 0) return `Vencido hace ${Math.abs(days)} días`
    if (days === 0) return 'Vence hoy'
    if (days === 1) return 'Vence mañana'
    return `Vence en ${days} días`
  }

  if (loading) {
    return (
      <MobileWrapper>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </MobileWrapper>
    )
  }

  return (
    <MobileWrapper>
      <div className="px-4 pt-6 pb-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
              <img 
                src="/logo.png" 
                alt="VenAi Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold">VenAi</h1>
              {/* Mensaje dinámico de valor */}
              <p className="text-sm text-muted-foreground mt-0.5">
                {stats.expiringSoonCount > 0 
                  ? `${stats.expiringSoonCount} alimento${stats.expiringSoonCount > 1 ? 's' : ''} vence${stats.expiringSoonCount > 1 ? 'n' : ''} pronto`
                  : stats.totalFoods > 0
                  ? 'Todo bajo control'
                  : 'Evita botar comida hoy'
                }
              </p>
              {/* Frase gancho tipo mantra - solo visible si hay alimentos */}
              {stats.totalFoods > 0 && (
                <p className="text-xs text-amber-500/70 mt-1 italic">
                  "VenAi se paga solo con la comida que no botas"
                </p>
              )}
            </div>
          </div>

        </motion.div>

        {/* Premium Banner */}
        {(userPlan === 'FREE' || !userPlan) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-6 mb-6"
          >
            <Card className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/20 rounded-lg">
                    <Crown className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-amber-500 text-sm">Pásate a Premium</p>
                    <p className="text-xs text-amber-500/70">
                      {stats.expiringSoonCount > 0 
                        ? `Ahorra dinero evitando botar ${stats.expiringSoonCount} alimento${stats.expiringSoonCount > 1 ? 's' : ''}`
                        : 'VenAi se paga solo con la comida que no botas'
                      }
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-amber-500/70" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 gap-3 mb-6"
        >
          {/* Métrica emocional: Ahorro estimado */}
          <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/20 col-span-2">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-green-500/20 rounded-md">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                </div>
                <span className="text-xs text-muted-foreground">Ahorro estimado</span>
              </div>
              <p className="text-2xl font-bold text-green-400">
                ₡{((stats.totalFoods - stats.expiredCount) * 2000).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">este mes evitando desperdicios</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-primary/10 rounded-md">
                  <Utensils className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground">Total</span>
              </div>
              <p className="text-2xl font-bold">{stats.totalFoods}</p>
              <p className="text-xs text-muted-foreground mt-1">alimentos</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-orange-500/10 rounded-md">
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                </div>
                <span className="text-xs text-muted-foreground">Por vencer</span>
              </div>
              <p className="text-2xl font-bold text-orange-500">
                {stats.expiringSoonCount}
              </p>
              <p className="text-xs text-muted-foreground mt-1">próximos 3 días</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-red-500/10 rounded-md">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                </div>
                <span className="text-xs text-muted-foreground">Vencidos</span>
              </div>
              <p className="text-2xl font-bold text-red-500">{stats.expiredCount}</p>
              <p className="text-xs text-muted-foreground mt-1">necesitan atención</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-green-500/10 rounded-md">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
                <span className="text-xs text-muted-foreground">Seguros</span>
              </div>
              <p className="text-2xl font-bold text-green-500">{stats.safeCount}</p>
              <p className="text-xs text-muted-foreground mt-1">en buen estado</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Expiring Soon Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Próximos a vencer</h2>
            <Button variant="ghost" size="sm" asChild>
              <a href="/foods" className="text-primary hover:text-primary/80">
                Ver todos
                <ArrowRight className="ml-1 h-4 w-4" />
              </a>
            </Button>
          </div>

          {expiringFoods.length === 0 ? (
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <div className="inline-flex p-3 bg-muted rounded-full mb-4">
                  <Utensils className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  No tienes alimentos próximos a vencer
                </p>
                <p className="text-xs text-muted-foreground">
                  Toca el botón de cámara para añadir tu primer alimento
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {expiringFoods.slice(0, 5).map((food) => (
                <Card
                  key={food.id}
                  className={cn(
                    "bg-card/50 backdrop-blur-sm transition-all hover:scale-[1.02]",
                    getStatusColor(food.status)
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {food.imageUrl ? (
                        <img
                          src={food.imageUrl}
                          alt={food.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                          <Utensils className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{food.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusIcon(food.status)}
                          <p className="text-xs text-muted-foreground">
                            {getDaysMessage(food.daysUntilExpiry)}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="default"
                        className="shrink-0"
                        onClick={() => window.location.href = `/recipes?food=${food.id}`}
                      >
                        <ChefHat className="h-3 w-3 mr-1" />
                        Receta
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </motion.div>

        {/* Quick Actions - Reordenadas: Cocinar primero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <h2 className="text-lg font-semibold mb-4">Acciones rápidas</h2>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="default"
              className="h-auto py-4 flex flex-col items-center gap-2 bg-primary"
              asChild
            >
              <a href="/recipes">
                <ChefHat className="h-5 w-5" />
                <span className="text-sm font-semibold">Cocinar ahora</span>
                {stats.expiringSoonCount > 0 && (
                  <span className="text-xs opacity-80">Con lo que vence</span>
                )}
              </a>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 bg-card/50"
              asChild
            >
              <a href="/foods">
                <Utensils className="h-5 w-5" />
                <span className="text-sm">Ver Alimentos</span>
              </a>
            </Button>
          </div>
        </motion.div>
      </div>
    </MobileWrapper>
  )
}
