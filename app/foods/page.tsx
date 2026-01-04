'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, Trash2, Edit2, Plus, Utensils } from 'lucide-react'
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

  useEffect(() => {
    fetchFoods()
  }, [])

  useEffect(() => {
    filterFoods()
  }, [foods, searchQuery, activeFilter])

  const fetchFoods = async () => {
    try {
      const response = await fetch('/api/foods')
      if (response.ok) {
        const data = await response.json()
        setFoods(data)
      }
    } catch (error) {
      console.error('Error fetching foods:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterFoods = () => {
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

      if (response.ok) {
        setFoods(foods.filter(food => food.id !== id))
      }
    } catch (error) {
      console.error('Error deleting food:', error)
    }
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
                          <div className="mt-2 flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                              {formatExpiryDate(new Date(food.expiryDate))}
                            </p>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => {/* TODO: Edit functionality */}}
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

        {/* Add Food FAB (only if we want it here too) */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="fixed bottom-24 right-4 z-40"
        >
          <Button
            size="icon"
            className="h-14 w-14 rounded-full shadow-lg shadow-primary/25"
            onClick={() => {/* TODO: Open add food modal */}}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </motion.div>
      </div>
    </MobileWrapper>
  )
}
