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
    ocrUnlimited: boolean
    exportData: boolean
    customCategories: boolean
  }
  popular?: boolean
  savings?: string
  originalPrice?: number
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Gratis',
    description: 'Perfecto para probar y empezar a organizar tu despensa',
    price: 0,
    interval: 'monthly',
    features: [
      'Hasta 10 alimentos simultáneos',
      'Detección de fechas con IA (OCR)',
      'Notificaciones básicas de vencimiento',
      'Recetas simples con ingredientes disponibles',
      'Categorización automática',
      'Interfaz completa sin anuncios'
    ],
    limits: {
      maxFoods: 10,
      advancedRecipes: false,
      smartNotifications: false,
      history: false,
      ocrUnlimited: false,
      exportData: false,
      customCategories: false
    }
  },
  {
    id: 'premium-monthly',
    name: 'Premium',
    description: 'Control total y funciones avanzadas para tu despensa',
    price: 4.99,
    interval: 'monthly',
    popular: true,
    features: [
      'Alimentos ilimitados',
      'OCR ilimitado con IA avanzada',
      'Notificaciones inteligentes personalizables',
      'Recetas avanzadas con IA',
      'Historial completo y estadísticas',
      'Exportar datos (CSV, PDF)',
      'Categorías personalizadas',
      'Soporte prioritario',
      'Acceso a nuevas funciones primero'
    ],
    limits: {
      maxFoods: Infinity,
      advancedRecipes: true,
      smartNotifications: true,
      history: true,
      ocrUnlimited: true,
      exportData: true,
      customCategories: true
    }
  },
  {
    id: 'premium-yearly',
    name: 'Premium Anual',
    description: 'Ahorra 33% con la suscripción anual. El mejor valor',
    price: 39.99,
    originalPrice: 59.88,
    interval: 'yearly',
    savings: 'Ahorra 20€ al año',
    features: [
      'Todo lo de Premium Mensual',
      'Ahorra 33% vs mensual',
      'Acceso anticipado a funciones beta',
      'Soporte premium prioritario',
      'Estadísticas avanzadas y reportes',
      'Backup automático en la nube',
      'Sin compromiso, cancela cuando quieras'
    ],
    limits: {
      maxFoods: Infinity,
      advancedRecipes: true,
      smartNotifications: true,
      history: true,
      ocrUnlimited: true,
      exportData: true,
      customCategories: true
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

