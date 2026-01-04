// Tipos de planes
export type PlanType = 'FREE' | 'PREMIUM_MONTHLY' | 'PREMIUM_YEARLY'
export type NotificationType = 'EXPIRY_SOON' | 'EXPIRY_TODAY' | 'RECIPE_SUGGESTION' | 'SUBSCRIPTION_RENEWAL'

// Tipos de la aplicación
export interface Food {
  id: string
  name: string
  imageUrl: string | null
  expiryDate: Date
  category: string | null
  notes: string | null
  userId: string
  createdAt: Date
  updatedAt: Date
  expiryStatus: 'expired' | 'expiring-soon' | 'safe'
  daysUntilExpiry: number
}

export interface Recipe {
  id: string
  title: string
  description: string
  ingredients: string[]
  steps: string[]
  cookingTime: number | null
  difficulty: string | null
  imageUrl: string | null
  foodIds: string[]
  userId: string
  createdAt: Date
}

export interface Notification {
  id: string
  title: string
  message: string
  type: 'EXPIRY_SOON' | 'EXPIRY_TODAY' | 'RECIPE_SUGGESTION' | 'SUBSCRIPTION_RENEWAL'
  read: boolean
  scheduled: Date
  sent: boolean
  createdAt: Date
}

export interface User {
  id: string
  email: string
  name: string | null
  emailVerified: Date | null
  image: string | null
  password: string
  plan: PlanType
  notificationsEnabled: boolean
  createdAt: Date
  updatedAt: Date
  foodCount?: number
  canAddMoreFoods?: boolean
}

export interface Subscription {
  id: string
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  stripePriceId: string | null
  status: string | null
  currentPeriodEnd: Date | null
  cancelAtPeriodEnd: boolean
}

// Tipos de planes
export interface Plan {
  id: string
  name: string
  description: string
  price: number
  interval: 'monthly' | 'yearly'
  features: string[]
  limits: {
    maxFoods: number
    advancedRecipes: boolean
    smartNotifications: boolean
    history: boolean
  }
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Gratis',
    description: 'Para empezar a organizar tu despensa',
    price: 0,
    interval: 'monthly',
    features: [
      'Máximo 5 alimentos',
      'Notificaciones básicas',
      'Acceso a recetas simples'
    ],
    limits: {
      maxFoods: 5,
      advancedRecipes: false,
      smartNotifications: false,
      history: false
    }
  },
  {
    id: 'premium-monthly',
    name: 'Premium Mensual',
    description: 'Control total de tu despensa',
    price: 9.99,
    interval: 'monthly',
    features: [
      'Alimentos ilimitados',
      'Notificaciones inteligentes',
      'Recetas avanzadas',
      'Historial completo',
      'Soporte prioritario'
    ],
    limits: {
      maxFoods: Infinity,
      advancedRecipes: true,
      smartNotifications: true,
      history: true
    }
  },
  {
    id: 'premium-yearly',
    name: 'Premium Anual',
    description: 'Ahorra 2 meses suscribiéndote anualmente',
    price: 99.99,
    interval: 'yearly',
    features: [
      'Todo lo de Premium Mensual',
      '2 meses gratis',
      'Acceso anticipado a nuevas funciones'
    ],
    limits: {
      maxFoods: Infinity,
      advancedRecipes: true,
      smartNotifications: true,
      history: true
    }
  }
]

// Estado de vencimiento
export interface ExpiryStatus {
  status: 'expired' | 'expiring-soon' | 'safe'
  daysUntilExpiry: number
  message: string
  color: string
}

// Resultados de OCR
export interface OCRResult {
  success: boolean
  foodName?: string
  expiryDate?: string
  confidence?: number
  error?: string
}

// Resultados de receta generada
export interface RecipeGenerationResult {
  success: boolean
  recipe?: Recipe
  error?: string
}

