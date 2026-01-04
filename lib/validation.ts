import { z } from 'zod'

// Esquema de autenticación
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(7, 'La contraseña debe tener al menos 7 caracteres')
})

export type LoginInput = z.infer<typeof loginSchema>

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(7, 'La contraseña debe tener al menos 7 caracteres'),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional()
})

export type RegisterInput = z.infer<typeof registerSchema>

// Esquema de alimentos
export const foodSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  expiryDate: z.string().min(1, 'La fecha de vencimiento es requerida'),
  category: z.string().optional(),
  notes: z.string().max(500, 'Las notas no pueden exceder 500 caracteres').optional()
})

export type FoodInput = z.infer<typeof foodSchema>

export const updateFoodSchema = foodSchema.partial()

export type UpdateFoodInput = z.infer<typeof updateFoodSchema>

// Esquema de OCR
export const ocrSchema = z.object({
  image: z.string().min(1, 'La imagen es requerida')
})

export type OCRInput = z.infer<typeof ocrSchema>

// Esquema de recetas
export const generateRecipeSchema = z.object({
  foodIds: z.array(z.string()).min(1, 'Selecciona al menos un alimento'),
  preferences: z.string().optional()
})

export type GenerateRecipeInput = z.infer<typeof generateRecipeSchema>

// Esquema de perfil
export const updateProfileSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  notificationsEnabled: z.boolean().optional()
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

// Esquema de suscripción
export const subscriptionSchema = z.object({
  planId: z.enum(['premium-monthly', 'premium-yearly'])
})

export type SubscriptionInput = z.infer<typeof subscriptionSchema>

// Esquema de notificación
export const notificationSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  message: z.string().min(1, 'El mensaje es requerido'),
  type: z.enum(['EXPIRY_SOON', 'EXPIRY_TODAY', 'RECIPE_SUGGESTION', 'SUBSCRIPTION_RENEWAL']),
  scheduled: z.string().min(1, 'La fecha de programación es requerida')
})

export type NotificationInput = z.infer<typeof notificationSchema>

