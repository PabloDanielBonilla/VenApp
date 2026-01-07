'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, Trash2, Edit2, Plus, Utensils, ChefHat, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MobileWrapper } from '@/components/mobile-wrapper'
import { cn } from '@/lib/utils'
import { formatExpiryDate, getExpiryStatus } from '@/lib/date'

interface FoodItem {
  id: string
  name: string
  expiryDate: string
  daysUntilExpiry: number
  status: 'expired' | 'expiring-soon' | 'safe'
  category: string | null
  imageUrl: string | null
  notes: string | null
}

type FilterType = 'all' | 'expired' | 'expiring-soon' | 'safe'

const filters: { id: FilterType; label: string; color: string }[] = [
  { id: 'all', label: 'Todos', color: 'bg-muted' },
  { id: 'expired', label: 'Vencidos', color: 'bg-red-500/10' },
  { id: 'expiring-soon', label: 'Por vencer', color: 'bg-orange-500/10' },
  { id: 'safe', label: 'Seguros', color: 'bg-green-500/10' }
]

export default function FoodsPage() {
  const [foods, setFoods] = useState<FoodItem[]>([])
  const [filteredFoods, setFilteredFoods] = useState<FoodItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [userPlan, setUserPlan] = useState<'FREE' | 'PREMIUM_MONTHLY' | 'PREMIUM_YEARLY'>('FREE')

  useEffect(() => {
    fetchFoods()
    fetchUserPlan()
  }, [])

  const fetchUserPlan = async () => {
    try {
      const response = await fetch('/api/auth/user')
      if (response.ok) {
        const data = await response.json()
        if (data.authenticated && data.user?.plan) {
          setUserPlan(data.user.plan)
        }
      }
    } catch (error) {
      console.error('Error fetching user plan:', error)
    }
  }

  useEffect(() => {
    filterFoods()
  }, [foods, searchQuery, activeFilter])

  const fetchFoods = async () => {
    try {
      const response = await fetch('/api/foods')
      if (response.ok) {
        const data = await response.json()
        // La API retorna { success: true, foods: [...] }
        const foodsArray = data.foods || data || []
        
        // Mapear los datos de la API a la estructura esperada
        const mappedFoods: FoodItem[] = foodsArray.map((food: any) => ({
          id: food.id,
          name: food.name,
          expiryDate: food.expiry_date || food.expiryDate,
          daysUntilExpiry: food.days_until_expiry || food.daysUntilExpiry || 0,
          status: food.expiry_status || food.status || 'safe',
          category: food.category,
          imageUrl: food.image_url || food.imageUrl,
          notes: food.notes
        }))
        
        setFoods(mappedFoods)
      } else {
        // Si hay error, asegurar que foods sea un array vacío
        setFoods([])
      }
    } catch (error) {
      console.error('Error fetching foods:', error)
      setFoods([]) // Asegurar que foods sea un array vacío en caso de error
    } finally {
      setLoading(false)
    }
  }

  const filterFoods = () => {
    // Asegurar que foods sea un array antes de hacer el spread
    if (!Array.isArray(foods)) {
      setFilteredFoods([])
      return
    }
    
    let filtered = [...foods]

    // Apply status filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(food => food.status === activeFilter)
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(food =>
        food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        food.category?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredFoods(filtered)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este alimento?')) return

    try {
      const response = await fetch(`/api/foods/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json().catch(() => ({ error: 'Error desconocido' }))

      if (response.ok) {
        // Actualizar la lista de alimentos
        setFoods(foods.filter(food => food.id !== id))
        // También actualizar filteredFoods
        setFilteredFoods(filteredFoods.filter(food => food.id !== id))
      } else {
        console.error('Error deleting food:', data.error)
        alert(data.error || 'No se pudo eliminar el alimento')
      }
    } catch (error) {
      console.error('Error deleting food:', error)
      alert('Error de conexión al eliminar el alimento')
    }
  }

  const handleEdit = (food: FoodItem) => {
    // Navegar a la página de edición con los datos del alimento
    const params = new URLSearchParams()
    params.set('id', food.id)
    params.set('name', food.name)
    params.set('expiryDate', food.expiryDate)
    if (food.category) params.set('category', food.category)
    if (food.notes) params.set('notes', food.notes)
    if (food.imageUrl) {
      // Guardar la imagen en sessionStorage para evitar URLs largas
      sessionStorage.setItem('edit_food_image', food.imageUrl)
    }
    
    window.location.href = `/foods/add?${params.toString()}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'expired':
        return 'border-red-500/30 bg-red-500/5'
      case 'expiring-soon':
        return 'border-orange-500/30 bg-orange-500/5'
      default:
        return 'border-green-500/30 bg-green-500/5'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'expired':
        return 'bg-red-500/20 text-red-500'
      case 'expiring-soon':
        return 'bg-orange-500/20 text-orange-500'
      default:
        return 'bg-green-500/20 text-green-500'
    }
  }

  const getStatusText = (status: string, days: number) => {
    if (status === 'expired') return `Vencido hace ${Math.abs(days)} días`
    if (days === 0) return 'Vence hoy'
    if (days === 1) return 'Vence mañana'
    return `Vence en ${days} días`
  }

  const handleViewRecipe = (food: FoodItem) => {
    // Fricción inteligente: Si es FREE y tiene varios alimentos por vencer
    if (userPlan === 'FREE' && foods.filter(f => f.status !== 'safe').length >= 3) {
      // No bloquear, solo crear conciencia con toast
      // El toast se mostrará en la página de recetas
    }
    window.location.href = `/recipes?food=${food.id}`
  }

  // Calcular alimentos por vencer para mensaje contextual
  const expiringCount = foods.filter(f => f.status === 'expiring-soon' || f.status === 'expired').length
  const filteredExpiringCount = filteredFoods.filter(f => f.status === 'expiring-soon' || f.status === 'expired').length

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
          <h1 className="text-3xl font-bold mb-1">Mis Alimentos</h1>
          <p className="text-muted-foreground text-sm">
            {foods.length} {foods.length === 1 ? 'alimento' : 'alimentos'} en tu despensa
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 mb-4"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar alimentos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card/50 border-muted"
            />
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar"
        >
          {filters.map((filter) => (
            <Button
              key={filter.id}
              variant={activeFilter === filter.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter(filter.id)}
              className={cn(
                'flex-shrink-0',
                activeFilter === filter.id ? 'bg-primary text-primary-foreground' : 'bg-muted'
              )}
            >
              <Filter className="h-3.5 w-3.5 mr-1.5" />
              {filter.label}
            </Button>
          ))}
        </motion.div>

        {/* Mensaje contextual cuando hay alimentos por vencer */}
        {activeFilter === 'expiring-soon' && filteredExpiringCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mt-4 mb-4"
          >
            <Card className="bg-gradient-to-br from-orange-500/20 to-amber-500/20 border-orange-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/20 rounded-lg">
                    <ChefHat className="h-5 w-5 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-orange-500 text-sm">
                      {filteredExpiringCount} alimento{filteredExpiringCount > 1 ? 's' : ''} vence{filteredExpiringCount > 1 ? 'n' : ''} pronto
                    </p>
                    <p className="text-xs text-orange-500/70 mt-0.5">
                      ¿Los cocinamos? Te armamos recetas con estos alimentos
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="default"
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                    onClick={() => window.location.href = '/recipes'}
                  >
                    <ChefHat className="h-3.5 w-3.5 mr-1.5" />
                    Generar recetas
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Foods List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          {filteredFoods.length === 0 ? (
            <Card className="bg-card/50">
              <CardContent className="p-8 text-center">
                <div className="inline-flex p-3 bg-muted rounded-full mb-4">
                  <Utensils className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {searchQuery || activeFilter !== 'all'
                    ? 'No se encontraron alimentos'
                    : 'No tienes alimentos aún'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Toca el botón de cámara para añadir tu primer alimento
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredFoods.map((food, index) => (
                <motion.div
                  key={food.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                >
                  <Card
                    className={cn(
                      'bg-card/50 backdrop-blur-sm border transition-all hover:scale-[1.02]',
                      getStatusColor(food.status)
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {food.imageUrl ? (
                          <img
                            src={food.imageUrl}
                            alt={food.name}
                            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                            <Utensils className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-base truncate">{food.name}</p>
                              {food.category && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {food.category}
                                </p>
                              )}
                            </div>
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0',
                                getStatusBadge(food.status)
                              )}
                            >
                              {getStatusText(food.status, food.daysUntilExpiry)}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <p className="text-xs text-muted-foreground">
                              {formatExpiryDate(new Date(food.expiryDate))}
                            </p>
                            <div className="flex gap-2 items-center">
                              {/* Botón Receta - Solo para alimentos expired o expiring-soon */}
                              {food.status !== 'safe' && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="h-7 px-3 bg-primary text-primary-foreground"
                                  onClick={() => handleViewRecipe(food)}
                                >
                                  <ChefHat className="h-3 w-3 mr-1.5" />
                                  Receta
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleEdit(food)}
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                onClick={() => handleDelete(food.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* FAB removido - El FloatingCameraButton ya está disponible desde AppLayout */}
      </div>
    </MobileWrapper>
  )
}
