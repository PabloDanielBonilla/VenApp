import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

/**
 * API route para generar iconos con fondo negro
 * Esta ruta genera un icono con fondo negro usando Canvas (si está disponible)
 * o retorna instrucciones para generar los iconos manualmente
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const size = parseInt(searchParams.get('size') || '192')
    
    // Verificar si el logo existe
    const logoPath = path.join(process.cwd(), 'public', 'logo.png')
    
    if (!fs.existsSync(logoPath)) {
      return NextResponse.json(
        { error: 'logo.png no encontrado en public/' },
        { status: 404 }
      )
    }

    // Por ahora, retornamos instrucciones ya que generar imágenes requiere librerías adicionales
    return NextResponse.json({
      message: 'Para generar iconos con fondo negro, edita logo.png manualmente o usa una herramienta online',
      sizes: [72, 96, 128, 144, 152, 192, 384, 512],
      instructions: [
        '1. Abre logo.png en un editor de imágenes',
        '2. Agrega un fondo negro sólido (#000000 o #0B0B0B)',
        '3. Exporta en los tamaños: 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512',
        '4. Guarda como icon-{size}.png en public/icons/',
        '5. Actualiza manifest.json para usar estos iconos'
      ],
      tools: [
        'https://realfavicongenerator.net/',
        'https://www.pwabuilder.com/imageGenerator',
        'https://favicon.io/favicon-generator/'
      ]
    })
  } catch (error: any) {
    console.error('Error generating icon:', error)
    return NextResponse.json(
      { error: error.message || 'Error al generar icono' },
      { status: 500 }
    )
  }
}

