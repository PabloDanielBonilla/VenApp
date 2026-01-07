import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json()

    if (!image) {
      return NextResponse.json(
        { error: 'Imagen no proporcionada' },
        { status: 400 }
      )
    }

    // Simular procesamiento OCR con datos mock
    // En producción, aquí iría la integración con un servicio de OCR real
    await new Promise(resolve => setTimeout(resolve, 1500)) // Simular delay de procesamiento

    // Datos mock para demostración
    const mockResults = [
      {
        foodName: 'Leche Entera',
        expiryDate: '15/02/2025',
        confidence: 'alta'
      },
      {
        foodName: 'Yogur Natural',
        expiryDate: '20/02/2025',
        confidence: 'media'
      },
      {
        foodName: 'Pan Integral',
        expiryDate: null,
        confidence: 'baja'
      },
      {
        foodName: 'Huevos',
        expiryDate: '25/02/2025',
        confidence: 'alta'
      }
    ]

    // Seleccionar un resultado aleatorio para la demo
    const result = mockResults[Math.floor(Math.random() * mockResults.length)]

    return NextResponse.json({
      success: true,
      foodName: result.foodName,
      expiryDate: result.expiryDate,
      confidence: result.confidence
    })
  } catch (error: any) {
    console.error('Error in OCR processing:', error)
    return NextResponse.json(
      { 
        error: 'Error al procesar la imagen',
        success: false 
      },
      { status: 500 }
    )
  }
}

