'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Clock, ChefHat, CheckCircle2, AlertCircle, Crown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { MobileWrapper } from '@/components/mobile-wrapper'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

interface FoodItem {
  id: string
  name: string
  expiryDate: string
  daysUntilExpiry: number
  status: 'expired' | 'expiring-soon' | 'safe'
}

interface GeneratedRecipe {
  title: string
  description: string
  ingredients: string[]
  steps: string[]
  cookingTime?: number
  difficulty?: string
}

export default function RecipesPage() {
  const [foods, setFoods] = useState<FoodItem[]>([])
  const [selectedFoods, setSelectedFoods] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [recipe, setRecipe] = useState<GeneratedRecipe | null>(null)
  const [userPlan, setUserPlan] = useState<'FREE' | 'PREMIUM_MONTHLY' | 'PREMIUM_YEARLY'>('FREE')
  const [showPremiumPrompt, setShowPremiumPrompt] = useState(false)

  useEffect(() => {
    fetchExpiringFoods()
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

  const fetchExpiringFoods = async () => {
    try {
      const response = await fetch('/api/foods?filter=expiring')
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
          imageUrl: food.image_url || food.imageUrl
        }))
        
        // Ya están filtrados por la API, pero por si acaso filtramos nuevamente
        const expiring = mappedFoods.filter((food: FoodItem) =>
          food.status === 'expiring-soon' || food.status === 'expired'
        )
        setFoods(expiring)
      } else {
        setFoods([])
      }
    } catch (error) {
      console.error('Error fetching foods:', error)
      setFoods([])
    } finally {
      setLoading(false)
    }
  }

  const toggleFoodSelection = (foodId: string) => {
    setSelectedFoods(prev =>
      prev.includes(foodId)
        ? prev.filter(id => id !== foodId)
        : [...prev, foodId]
    )
  }

  const generateRecipe = async () => {
    if (selectedFoods.length === 0) {
      toast({
        title: 'Selecciona ingredientes',
        description: 'Por favor selecciona al menos un ingrediente',
        variant: 'destructive'
      })
      return
    }

    // Fricción inteligente: Si es FREE y tiene 3+ alimentos venciendo
    if (userPlan === 'FREE' && foods.length >= 3) {
      toast({
        title: '💡 Con Premium esto es automático',
        description: 'Las recetas se generan automáticamente cuando tus alimentos están por vencer',
        duration: 5000
      })
      // No bloquear, solo crear conciencia
    }

    setGenerating(true)
    setRecipe(null)

    try {
      const selectedFoodNames = foods
        .filter(f => selectedFoods.includes(f.id))
        .map(f => f.name)

      const response = await fetch('/api/recipes/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ingredients: selectedFoodNames
        })
      })

      if (response.ok) {
        const data = await response.json()
        setRecipe(data.recipe)
        toast({
          title: '¡Receta generada!',
          description: 'La IA ha creado una receta especial para ti'
        })
      } else {
        throw new Error('Error al generar receta')
      }
    } catch (error) {
      console.error('Error generating recipe:', error)
      toast({
        title: 'Error',
        description: 'No se pudo generar la receta. Intenta de nuevo.',
        variant: 'destructive'
      })
    } finally {
      setGenerating(false)
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

  return (
    <MobileWrapper>
      <div className="px-4 pt-6 pb-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold mb-1">Generador de Recetas</h1>
          <p className="text-muted-foreground text-sm">
            Crea recetas deliciosas con ingredientes por vencer
          </p>
        </motion.div>

        {/* Premium Prompt - Fricción inteligente */}
        {userPlan === 'FREE' && foods.length >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 mb-4"
          >
            <Card className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/20 rounded-lg">
                    <Crown className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-amber-500 text-sm">Con Premium esto es automático</p>
                    <p className="text-xs text-amber-500/70">
                      Las recetas se generan automáticamente cuando tus alimentos están por vencer
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-amber-500/30 text-amber-500"
                    onClick={() => window.location.href = '/profile'}
                  >
                    Ver planes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Ingredients Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6"
        >
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="h-5 w-5 text-primary" />
                Selecciona ingredientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : foods.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">
                    No tienes ingredientes próximos a vencer
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Añade alimentos para generar recetas
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                  {foods.map((food, index) => (
                    <motion.div
                      key={food.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + index * 0.05 }}
                    >
                      <Card
                        className={cn(
                          'bg-background transition-all hover:scale-[1.01] cursor-pointer',
                          getStatusColor(food.status),
                          selectedFoods.includes(food.id) && 'ring-2 ring-primary'
                        )}
                        onClick={() => toggleFoodSelection(food.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={selectedFoods.includes(food.id)}
                              onChange={() => toggleFoodSelection(food.id)}
                              className="flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate">{food.name}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {food.daysUntilExpiry === 0
                                  ? 'Vence hoy'
                                  : food.daysUntilExpiry < 0
                                  ? `Vencido hace ${Math.abs(food.daysUntilExpiry)} días`
                                  : `Vence en ${food.daysUntilExpiry} días`}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Generate Button */}
              {foods.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-4"
                >
                  <Button
                    onClick={generateRecipe}
                    disabled={generating || selectedFoods.length === 0}
                    className="w-full h-12"
                  >
                    {generating ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-2" />
                        Generar Receta con IA
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Generated Recipe */}
        {recipe && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6"
          >
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                  {recipe.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  {recipe.description}
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Meta Info */}
                <div className="flex gap-4">
                  {recipe.cookingTime && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="text-sm">{recipe.cookingTime} min</span>
                    </div>
                  )}
                  {recipe.difficulty && (
                    <div className="flex items-center gap-2">
                      <ChefHat className="h-4 w-4 text-primary" />
                      <span className="text-sm">{recipe.difficulty}</span>
                    </div>
                  )}
                </div>

                {/* Ingredients */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <ChefHat className="h-4 w-4" />
                    Ingredientes
                  </h3>
                  <ul className="space-y-2">
                    {recipe.ingredients.map((ingredient, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>{ingredient}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Steps */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <ChefHat className="h-4 w-4" />
                    Preparación
                  </h3>
                  <ol className="space-y-4">
                    {recipe.steps.map((step, index) => (
                      <li key={index} className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
                          {index + 1}
                        </span>
                        <p className="text-sm flex-1">{step}</p>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Save Button */}
                <Button className="w-full" onClick={async () => {
                  try {
                    const response = await fetch('/api/recipes', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                        title: recipe.title,
                        description: recipe.description,
                        ingredients: recipe.ingredients,
                        steps: recipe.steps,
                        cookingTime: recipe.cookingTime,
                        difficulty: recipe.difficulty,
                        foodIds: selectedFoods
                      })
                    })

                    if (response.ok) {
                      toast({
                        title: 'Receta guardada',
                        description: 'La receta se ha guardado correctamente'
                      })
                    } else {
                      throw new Error('Error al guardar')
                    }
                  } catch (error) {
                    console.error('Error saving recipe:', error)
                    toast({
                      title: 'Error',
                      description: 'No se pudo guardar la receta',
                      variant: 'destructive'
                    })
                  }
                }}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Guardar Receta
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </MobileWrapper>
  )
}
