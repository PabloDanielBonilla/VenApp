"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, CheckCircle, Loader2 } from 'lucide-react'
import { MobileWrapper } from '@/components/mobile-wrapper'

export default function GenerateIconsPage() {
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

  const generateIcon = async (size: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        reject(new Error('No se pudo obtener el contexto del canvas'))
        return
      }

      // Fondo negro
      ctx.fillStyle = '#0B0B0B'
      ctx.fillRect(0, 0, size, size)

      // Cargar y dibujar el logo
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        // Calcular dimensiones manteniendo la proporción
        const imgAspect = img.width / img.height
        const canvasAspect = size / size
        
        let drawWidth = size
        let drawHeight = size
        let offsetX = 0
        let offsetY = 0

        if (imgAspect > canvasAspect) {
          // La imagen es más ancha
          drawHeight = size / imgAspect
          offsetY = (size - drawHeight) / 2
        } else {
          // La imagen es más alta
          drawWidth = size * imgAspect
          offsetX = (size - drawWidth) / 2
        }

        // Dibujar el logo centrado
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight)

        // Convertir a blob y descargar
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob)
            resolve(url)
          } else {
            reject(new Error('Error al generar el blob'))
          }
        }, 'image/png')
      }

      img.onerror = () => {
        reject(new Error('Error al cargar el logo'))
      }

      img.src = '/logo.png'
    })
  }

  const downloadIcon = (url: string, filename: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const generateAllIcons = async () => {
    setGenerating(true)
    setGenerated([])
    setError(null)

    try {
      for (const size of sizes) {
        try {
          const url = await generateIcon(size)
          const filename = `icon-${size}.png`
          downloadIcon(url, filename)
          setGenerated(prev => [...prev, filename])
          
          // Pequeña pausa entre descargas
          await new Promise(resolve => setTimeout(resolve, 200))
        } catch (err: any) {
          console.error(`Error generando icon-${size}.png:`, err)
          setError(`Error al generar icon-${size}.png: ${err.message}`)
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error al generar iconos')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <MobileWrapper>
      <div className="px-4 pt-6 pb-4">
        <Card>
          <CardHeader>
            <CardTitle>Generar Iconos con Fondo Negro</CardTitle>
            <CardDescription>
              Genera versiones del logo.png con fondo negro en todos los tamaños necesarios para la PWA
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Este generador creará iconos con fondo negro (#0B0B0B) en los siguientes tamaños:
              </p>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {sizes.map(size => (
                  <div key={size} className="text-center p-2 bg-muted rounded text-sm">
                    {size}x{size}
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-400">
                {error}
              </div>
            )}

            {generated.length > 0 && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded">
                <p className="text-sm text-green-400 mb-2 font-semibold">
                  ✅ {generated.length} iconos generados:
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {generated.map(file => (
                    <li key={file} className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-400" />
                      {file}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground mt-3">
                  💡 Los archivos se descargaron automáticamente. Muévelos a la carpeta <code className="bg-muted px-1 rounded">public/icons/</code> y actualiza el manifest.json
                </p>
              </div>
            )}

            <Button
              onClick={generateAllIcons}
              disabled={generating}
              className="w-full"
              size="lg"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando iconos...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Generar Todos los Iconos
                </>
              )}
            </Button>

            <div className="text-xs text-muted-foreground space-y-2 pt-4 border-t">
              <p><strong>Instrucciones:</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Haz clic en "Generar Todos los Iconos"</li>
                <li>Los archivos se descargarán automáticamente</li>
                <li>Crea la carpeta <code className="bg-muted px-1 rounded">public/icons/</code> si no existe</li>
                <li>Mueve todos los archivos descargados a esa carpeta</li>
                <li>Actualiza el manifest.json para usar <code className="bg-muted px-1 rounded">/icons/icon-{'{size}'}.png</code></li>
                <li>Desinstala y reinstala la PWA para ver los cambios</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </MobileWrapper>
  )
}

