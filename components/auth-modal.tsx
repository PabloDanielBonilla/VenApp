'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Lock, User, LogIn, UserPlus, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AuthModal({ open, onOpenChange, onSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const endpoint = isLogin ? '/api/auth/signin' : '/api/auth/signup'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        console.error('Error parsing response JSON:', jsonError)
        toast({
          title: 'Error',
          description: 'Error de comunicación con el servidor',
          variant: 'destructive'
        })
        return
      }

      if (response.ok) {
        toast({
          title: isLogin ? '¡Bienvenido!' : '¡Cuenta creada!',
          description: isLogin 
            ? 'Has iniciado sesión correctamente'
            : 'Tu cuenta ha sido creada exitosamente'
        })
        
        
        onSuccess?.()
        onOpenChange(false)
        
        // Redirigir al home después de un breve delay para que se vea el toast
        setTimeout(() => {
          window.location.href = '/'
        }, 500)
      } else {
        // Mensaje de error más específico
        let errorMessage = data?.error || 'Ocurrió un error'
        
        console.error('Auth error response:', {
          status: response.status,
          statusText: response.statusText,
          error: errorMessage,
          fullData: data
        })
        
        // Mejorar mensajes de error comunes
        const errorLower = errorMessage.toLowerCase()
        if (errorLower.includes('invalid login credentials') || 
            errorLower.includes('invalid email or password') ||
            errorLower.includes('email not confirmed')) {
          errorMessage = 'Correo electrónico o contraseña incorrectos'
        } else if (errorLower.includes('user already registered') ||
                   errorLower.includes('already exists') ||
                   errorLower.includes('ya está registrado')) {
          errorMessage = 'Este correo electrónico ya está registrado'
        } else if (errorLower.includes('database error saving new user') ||
                   errorLower.includes('database error')) {
          errorMessage = 'Error al crear usuario. Verifica que la base de datos esté configurada correctamente.'
        } else if (errorLower.includes('password') || errorLower.includes('contraseña')) {
          errorMessage = 'La contraseña debe tener al menos 7 caracteres'
        } else if (errorLower.includes('email') || errorLower.includes('correo')) {
          errorMessage = 'Correo electrónico inválido'
        }
        
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Auth error:', error)
      toast({
        title: 'Error',
        description: 'Ocurrió un error inesperado',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Tu nombre"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="pl-10 bg-background"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="pl-10 bg-background"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="pl-10 pr-10 bg-background"
                required
                minLength={7}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Mínimo 7 caracteres
            </p>
          </div>

          <Button
            type="submit"
            className="w-full h-12"
            disabled={loading}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current" />
            ) : (
              <>
                {isLogin ? (
                  <>
                    <LogIn className="h-5 w-5 mr-2" />
                    Iniciar Sesión
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5 mr-2" />
                    Crear Cuenta
                  </>
                )}
              </>
            )}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin)
              setFormData({ email: '', password: '', name: '' })
            }}
            className="text-sm text-primary hover:underline"
          >
            {isLogin 
              ? '¿No tienes cuenta? Regístrate'
              : '¿Ya tienes cuenta? Inicia sesión'
            }
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

