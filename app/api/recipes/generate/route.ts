import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { ingredients, preferences } = await request.json()

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json(
        { error: 'Se requieren ingredientes válidos' },
        { status: 400 }
      )
    }

    // Por ahora, generar receta mock basada en los ingredientes
    // TODO: Integrar con API de IA (OpenAI, ZAI, etc.) cuando esté disponible
    
    const recipeTitles = [
      `Ensalada creativa con ${ingredients.slice(0, 2).join(' y ')}`,
      `Sofrito especial de ${ingredients[0]}`,
      `Plato combinado con ${ingredients.join(', ')}`,
      `Receta rápida con ${ingredients[0]}`
    ]

    const recipeDescriptions = [
      `Una deliciosa combinación de ingredientes frescos que aprovecha al máximo ${ingredients[0]}`,
      `Receta fácil y rápida para usar tus ingredientes antes de que se venzan`,
      `Una forma creativa de combinar ${ingredients.length} ingredientes en un plato delicioso`
    ]

    const recipe = {
      title: recipeTitles[Math.floor(Math.random() * recipeTitles.length)],
      description: recipeDescriptions[Math.floor(Math.random() * recipeDescriptions.length)],
      ingredients: ingredients.map(ing => `${ing} (cantidad según disponibilidad)`),
      steps: [
        `Preparar ${ingredients[0]} cortándolo en trozos`,
        `Cocinar los ingredientes principales a fuego medio`,
        `Agregar condimentos al gusto`,
        `Servir caliente y disfrutar`
      ],
      cookingTime: 30,
      difficulty: 'Fácil'
    }

    return NextResponse.json({
      success: true,
      recipe
    })
  } catch (error) {
    console.error('Error generating recipe:', error)
    return NextResponse.json(
      { error: 'Error al generar la receta' },
      { status: 500 }
    )
  }
}

