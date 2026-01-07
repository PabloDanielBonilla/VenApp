'use client'

import { useEffect, useState } from 'react'
import { AuthModal } from './auth-modal'
import { Button } from './ui/button'
import { LogIn } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
  action?: string
}

export function AuthGuard({ children, action = 'realizar esta acción' }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/user', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        // Verificar si el usuario está autenticado basado en la respuesta
        setIsAuthenticated(data.authenticated === true)
      } else {
        setIsAuthenticated(false)
      }
    } catch (error) {
      // Solo loggear errores reales de red (sin conexión, etc.)
      setIsAuthenticated(false)
    }
  }

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-[400px] px-4 text-center">
          <div className="p-4 bg-primary/10 rounded-full mb-4">
            <LogIn className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Inicia sesión para continuar</h2>
          <p className="text-muted-foreground mb-6">
            Necesitas iniciar sesión para {action}
          </p>
          <Button onClick={() => setShowModal(true)} size="lg">
            <LogIn className="h-5 w-5 mr-2" />
            Iniciar Sesión
          </Button>
        </div>
        <AuthModal
          open={showModal}
          onOpenChange={setShowModal}
          onSuccess={checkAuth}
        />
      </>
    )
  }

  return <>{children}</>
}

