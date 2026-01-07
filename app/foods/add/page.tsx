'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Camera, Save, Calendar, Utensils, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MobileWrapper } from '@/components/mobile-wrapper'
import { AuthGuard } from '@/components/auth-guard'
import { toast } from '@/hooks/use-toast'

export default function AddFoodPage() {
  const [formData, setFormData] = useState({
    name: '',
    expiryDate: '',
    category: '',
    notes: ''
  })
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      // Get data from URL params
      const params = new URLSearchParams(window.location.search)
      const id = params.get('id')
      const name = params.get('name')
      const expiryDate = params.get('expiryDate')
      const category = params.get('category')
      const notes = params.get('notes')

      // Si hay un ID, es modo edición - cargar datos desde la API
      if (id) {
        setEditingId(id)
        try {
          const response = await fetch(`/api/foods/${id}`)
          if (response.ok) {
            const data = await response.json()
            const food = data.food
            
            // Mapear datos de la API
            setFormData({
              name: food.name || '',
              expiryDate: food.expiry_date ? new Date(food.expiry_date).toISOString().split('T')[0] : '',
              category: food.category || '',
              notes: food.notes || ''
            })
            if (food.image_url) {
              setImageUrl(food.image_url)
            }
          }
        } catch (error) {
          console.error('Error loading food data:', error)
        }
      } else {
        // Modo creación - usar datos de URL params o sessionStorage
        // Get image from sessionStorage (to avoid URL length issues)
        const imageFromStorage = sessionStorage.getItem('camera_image')
        const editImageFromStorage = sessionStorage.getItem('edit_food_image')
        const nameFromStorage = sessionStorage.getItem('camera_foodName')
        const expiryFromStorage = sessionStorage.getItem('camera_expiryDate')

        // Prefer URL params, fallback to sessionStorage
        const finalName = name || nameFromStorage || ''
        const finalExpiryDate = expiryDate || expiryFromStorage || ''
        const finalImage = imageFromStorage || editImageFromStorage

        if (finalName) setFormData(prev => ({ ...prev, name: finalName }))
        if (finalExpiryDate) {
          // Convert DD/MM/YYYY to YYYY-MM-DD for HTML date input
          const [day, month, year] = finalExpiryDate.split('/')
          if (day && month && year) {
            const formattedDate = `${year}-${month}-${day}`
            setFormData(prev => ({ ...prev, expiryDate: formattedDate }))
          }
        }
        if (category) setFormData(prev => ({ ...prev, category }))
        if (notes) setFormData(prev => ({ ...prev, notes }))
        if (finalImage) setImageUrl(finalImage)

        // Clean up sessionStorage after reading
        if (imageFromStorage) sessionStorage.removeItem('camera_image')
        if (editImageFromStorage) sessionStorage.removeItem('edit_food_image')
        if (nameFromStorage) sessionStorage.removeItem('camera_foodName')
        if (expiryFromStorage) sessionStorage.removeItem('camera_expiryDate')
      }
      
      setLoadingData(false)
    }

    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.expiryDate) {
      toast({
        title: 'Campos requeridos',
        description: 'Por favor completa el nombre y la fecha de vencimiento',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    try {
      let finalImageUrl = imageUrl

      // Determinar si es edición o creación
      const url = editingId ? `/api/foods/${editingId}` : '/api/foods'
      const method = editingId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          imageUrl: finalImageUrl
        })
      })

      let data: any = { error: 'Error desconocido' }
      try {
        const text = await response.text()
        if (text) {
          data = JSON.parse(text)
        }
      } catch (parseError) {
        console.error('Error parsing response:', parseError)
        data = { error: `Error ${response.status}: ${response.statusText || 'Error desconocido'}` }
      }

      if (response.ok) {
        toast({
          title: editingId ? '¡Alimento actualizado!' : '¡Alimento guardado!',
          description: `${formData.name} se ha ${editingId ? 'actualizado' : 'agregado'} correctamente`
        })
        window.location.href = '/foods'
      } else {
        // Manejar diferentes tipos de errores
        let errorMessage = 'No se pudo guardar el alimento. Intenta de nuevo.'
        
        if (response.status === 401) {
          errorMessage = 'No autenticado. Por favor inicia sesión para guardar alimentos.'
        } else if (response.status === 400) {
          errorMessage = data.error || 'Datos inválidos. Verifica la información ingresada.'
        } else if (response.status === 500) {
          errorMessage = data.error || 'Error del servidor. Intenta de nuevo más tarde.'
        } else if (data.error) {
          errorMessage = data.error
        }

        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive'
        })
      }
    } catch (error: any) {
      console.error('Error saving food:', error)
      toast({
        title: 'Error',
        description: error.message || 'Error de conexión. Verifica tu conexión a internet e intenta de nuevo.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleNewPhoto = () => {
    window.location.href = '/camera'
  }

  if (loadingData) {
    return (
      <AuthGuard action="guardar alimentos">
        <MobileWrapper>
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </MobileWrapper>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard action="guardar alimentos">
      <MobileWrapper>
      <div className="px-4 pt-6 pb-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-1">
                {editingId ? 'Editar Alimento' : 'Agregar Alimento'}
              </h1>
              <p className="text-muted-foreground text-sm">
                {editingId ? 'Modifica la información del alimento' : 'Completa la información del alimento'}
              </p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNewPhoto}
              className="bg-white/5"
            >
              <Camera className="h-5 w-5" />
            </Button>
          </div>
        </motion.div>

        {/* Image Preview */}
        {imageUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <Card className="bg-card/50">
              <CardContent className="p-3">
                <img
                  src={imageUrl}
                  alt="Food preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Utensils className="h-5 w-5 text-primary" />
                Información básica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium">
                  Nombre del alimento *
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Leche, Yogur, etc."
                  className="mt-1.5 bg-background"
                  required
                />
              </div>

              <div>
                <Label htmlFor="category" className="text-sm font-medium">
                  Categoría
                </Label>
                <Input
                  id="category"
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Ej: Lácteos, Frutas, etc."
                  className="mt-1.5 bg-background"
                />
              </div>

              <div>
                <Label htmlFor="expiryDate" className="text-sm font-medium">
                  Fecha de vencimiento *
                </Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="mt-1.5 bg-background"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div>
                <Label htmlFor="notes" className="text-sm font-medium">
                  Notas
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Añade notas adicionales..."
                  className="mt-1.5 bg-background resize-none"
                  rows={3}
                  maxLength={500}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              type="submit"
              className="w-full h-12 text-base"
              disabled={loading}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2" />
              ) : (
                <Save className="h-5 w-5 mr-2" />
              )}
              {loading ? (editingId ? 'Actualizando...' : 'Guardando...') : (editingId ? 'Actualizar Alimento' : 'Guardar Alimento')}
            </Button>
          </motion.div>
        </motion.form>
      </div>
    </MobileWrapper>
    </AuthGuard>
  )
}
