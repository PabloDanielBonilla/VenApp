'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Bell, Shield, Crown, Check, ChevronRight, LogOut } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { MobileWrapper } from '@/components/mobile-wrapper'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { PLANS, type Plan } from '@/types'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

export default function ProfilePage() {
  const [user, setUser] = useState<{
    name: string | null
    email: string
    plan: 'FREE' | 'PREMIUM_MONTHLY' | 'PREMIUM_YEARLY'
  } | null>(null)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState('')
  const [showPlans, setShowPlans] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/user')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setNotificationsEnabled(data.user.notificationsEnabled ?? true)
        setNewName(data.user.name || '')
      } else {
        // Si no hay backend, usar datos mock para demo
        setUser({
          name: 'Usuario Demo',
          email: 'demo@frescoguard.com',
          plan: 'FREE'
        })
        setNotificationsEnabled(true)
        setNewName('Usuario Demo')
      }
    } catch (error) {
      console.error('Error fetching user:', error)
      // En caso de error, usar datos mock para demo
      setUser({
        name: 'Usuario Demo',
        email: 'demo@frescoguard.com',
        plan: 'FREE'
      })
      setNotificationsEnabled(true)
      setNewName('Usuario Demo')
    } finally {
      setLoading(false)
    }
  }

  const currentPlan = user ? PLANS.find(p => {
    if (user.plan === 'FREE') return p.id === 'free'
    if (user.plan === 'PREMIUM_MONTHLY') return p.id === 'premium-monthly'
    if (user.plan === 'PREMIUM_YEARLY') return p.id === 'premium-yearly'
    return false
  }) : null

  const handleSaveName = async () => {
    if (newName.trim() && user) {
      try {
        const response = await fetch('/api/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: newName.trim()
          })
        })

        if (response.ok) {
          setUser(prev => prev ? { ...prev, name: newName.trim() } : null)
          setEditingName(false)
          toast({
            title: 'Nombre actualizado',
            description: 'Tu nombre se ha actualizado correctamente'
          })
        } else {
          // Si no hay backend, actualizar solo en el estado local
          setUser(prev => prev ? { ...prev, name: newName.trim() } : null)
          setEditingName(false)
          toast({
            title: 'Nombre actualizado',
            description: 'Tu nombre se ha actualizado correctamente (modo demo)'
          })
        }
      } catch (error) {
        console.error('Error updating name:', error)
        // En modo demo, actualizar solo en el estado local
        setUser(prev => prev ? { ...prev, name: newName.trim() } : null)
        setEditingName(false)
        toast({
          title: 'Nombre actualizado',
          description: 'Tu nombre se ha actualizado correctamente (modo demo)'
        })
      }
    }
  }

  const handleToggleNotifications = async (enabled: boolean) => {
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notificationsEnabled: enabled
        })
      })

      if (response.ok) {
        setNotificationsEnabled(enabled)
        toast({
          title: enabled ? 'Notificaciones activadas' : 'Notificaciones desactivadas',
          description: enabled
            ? 'Recibirás alertas de vencimiento'
            : 'No recibirás alertas de vencimiento'
        })
      } else {
        // Si no hay backend, actualizar solo en el estado local
        setNotificationsEnabled(enabled)
        toast({
          title: enabled ? 'Notificaciones activadas' : 'Notificaciones desactivadas',
          description: enabled
            ? 'Recibirás alertas de vencimiento (modo demo)'
            : 'No recibirás alertas de vencimiento (modo demo)'
        })
      }
    } catch (error) {
      console.error('Error updating notifications:', error)
      // En modo demo, actualizar solo en el estado local
      setNotificationsEnabled(enabled)
      toast({
        title: enabled ? 'Notificaciones activadas' : 'Notificaciones desactivadas',
        description: enabled
          ? 'Recibirás alertas de vencimiento (modo demo)'
          : 'No recibirás alertas de vencimiento (modo demo)'
      })
    }
  }

  const handleSubscribe = async (plan: Plan) => {
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          planId: plan.id
        })
      })

      if (response.ok) {
        const { url } = await response.json()
        if (url) {
          window.location.href = url
        }
      } else {
        const data = await response.json()
        toast({
          title: 'Error',
          description: data.error || 'Error al procesar la suscripción',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error subscribing:', error)
      toast({
        title: 'Error',
        description: 'Ocurrió un error al procesar la suscripción',
        variant: 'destructive'
      })
    }
  }

  const handleCancelSubscription = async () => {
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST'
      })

      if (response.ok) {
        const { url } = await response.json()
        if (url) {
          window.location.href = url
        }
      } else {
        toast({
          title: 'Error',
          description: 'Error al abrir el portal de facturación',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error opening billing portal:', error)
      toast({
        title: 'Error',
        description: 'Ocurrió un error',
        variant: 'destructive'
      })
    }
  }

  const handleSignOut = async () => {
    try {
      const response = await fetch('/api/auth/signout', {
        method: 'POST'
      })

      if (response.ok) {
        toast({
          title: 'Sesión cerrada',
          description: 'Has cerrado sesión correctamente'
        })
        
        // Redirigir al home después de cerrar sesión
        setTimeout(() => {
          window.location.href = '/'
        }, 500)
      } else {
        const data = await response.json()
        toast({
          title: 'Error',
          description: data.error || 'Error al cerrar sesión',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error signing out:', error)
      toast({
        title: 'Error',
        description: 'Ocurrió un error al cerrar sesión',
        variant: 'destructive'
      })
    }
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

  if (!user && !loading) {
    // Si no hay usuario después de cargar, mostrar datos demo
    return (
      <MobileWrapper>
        <div className="px-4 pt-6 pb-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold mb-1">Mi Perfil</h1>
            <p className="text-muted-foreground text-sm mb-4">
              Modo demo - Inicia sesión para ver tu perfil real
            </p>
            <Card className="bg-card/50">
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">
                  Para ver tu perfil, necesitas iniciar sesión
                </p>
              </CardContent>
            </Card>
          </motion.div>
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
          <h1 className="text-3xl font-bold mb-1">Mi Perfil</h1>
          <p className="text-muted-foreground text-sm">
            Gestiona tu cuenta y suscripción
          </p>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6"
        >
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                  <User className="h-8 w-8 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  {editingName ? (
                    <div className="flex gap-2">
                      <Input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Tu nombre"
                        className="bg-background"
                      />
                      <Button
                        size="icon"
                        onClick={handleSaveName}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-xl font-bold">{user?.name || 'Usuario'}</h2>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (user) {
                              setNewName(user.name || '')
                              setEditingName(true)
                            }
                          }}
                          className="h-6 w-6"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{user?.email || ''}</p>
                      {currentPlan && (
                        <span className={cn(
                          'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium',
                          currentPlan.id === 'free'
                            ? 'bg-gray-500/10 text-gray-400 ring-1 ring-inset ring-gray-500/20'
                            : 'bg-amber-400/10 text-amber-400 ring-1 ring-inset ring-amber-500/20'
                        )}>
                          {currentPlan.id !== 'free' && <Crown className="h-3 w-3 mr-1" />}
                          {currentPlan.name}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Subscription Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6"
        >
          <Card className={cn(
            'border-2',
            currentPlan?.id === 'free'
              ? 'border-muted'
              : 'border-amber-500/50 bg-amber-500/5'
          )}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {currentPlan?.id !== 'free' ? (
                  <Crown className="h-5 w-5 text-amber-500" />
                ) : (
                  <Shield className="h-5 w-5" />
                )}
                Plan {currentPlan?.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  {currentPlan?.description}
                </p>
                {currentPlan?.price === 0 ? (
                  <p className="text-2xl font-bold">Gratis</p>
                ) : (
                  <p className="text-2xl font-bold">
                    {currentPlan?.price.toFixed(2)}€
                    <span className="text-sm font-normal text-muted-foreground">
                      /{currentPlan?.interval === 'monthly' ? 'mes' : 'año'}
                    </span>
                  </p>
                )}
              </div>

              <Dialog open={showPlans} onOpenChange={setShowPlans}>
                <DialogTrigger asChild>
                  <Button
                    className="w-full"
                    variant={currentPlan?.id === 'free' ? 'default' : 'outline'}
                  >
                    {currentPlan?.id === 'free' ? 'Ver planes Premium' : 'Cambiar plan'}
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Crown className="h-5 w-5 text-amber-500" />
                      Planes Premium
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {PLANS.filter(p => p.id !== 'free').map((plan) => (
                      <Card
                        key={plan.id}
                        className={cn(
                          'cursor-pointer transition-all hover:scale-[1.02]',
                          user?.plan === 'PREMIUM_MONTHLY' && plan.id === 'premium-monthly'
                            ? 'ring-2 ring-primary bg-primary/10'
                            : user?.plan === 'PREMIUM_YEARLY' && plan.id === 'premium-yearly'
                            ? 'ring-2 ring-primary bg-primary/10'
                            : 'hover:border-primary'
                        )}
                        onClick={() => handleSubscribe(plan)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-bold">{plan.name}</h3>
                            <p className="text-2xl font-bold">
                              {plan.price.toFixed(2)}€
                              <span className="text-sm font-normal text-muted-foreground">
                                /{plan.interval === 'monthly' ? 'mes' : 'año'}
                              </span>
                            </p>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {plan.description}
                          </p>
                          <ul className="space-y-2">
                            {plan.features.map((feature, index) => (
                              <li key={index} className="flex items-center gap-2 text-sm">
                                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>

              {currentPlan?.id !== 'free' && (
                <Button
                  variant="outline"
                  className="w-full text-red-500 hover:text-red-600 border-red-500/20"
                  onClick={handleCancelSubscription}
                >
                  Gestionar suscripción
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Configuración
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">
                    Notificaciones
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Alertas de vencimiento
                  </p>
                </div>
                <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={handleToggleNotifications}
                />
              </div>

              <div className="pt-4 border-t border-border">
                <Button
                  variant="outline"
                  className="w-full justify-start text-left text-red-500 hover:text-red-600 border-red-500/20 hover:border-red-500/40"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Cerrar sesión
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* App Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 text-center text-xs text-muted-foreground"
        >
          <p>FrescoGuard v1.0.0</p>
          <p className="mt-1">© 2025 FrescoGuard. Todos los derechos reservados.</p>
        </motion.div>
      </div>
    </MobileWrapper>
  )
}
