# Generar Iconos de PWA con Fondo Negro

## Problema
El logo.png puede tener fondo transparente o blanco, lo que hace que el icono de la PWA se vea blanco.

## Solución: Generar Iconos con Fondo Negro

### Opción 1: Herramientas Online (Recomendado)

1. **RealFaviconGenerator** (https://realfavicongenerator.net/)
   - Sube tu logo.png
   - Configura fondo negro (#0B0B0B o #000000)
   - Descarga los iconos generados
   - Reemplaza los archivos en `public/icons/`

2. **PWA Builder Image Generator** (https://www.pwabuilder.com/imageGenerator)
   - Sube tu logo
   - Selecciona fondo negro
   - Genera todos los tamaños necesarios

3. **Favicon.io** (https://favicon.io/favicon-generator/)
   - Sube tu logo
   - Configura fondo negro
   - Descarga los iconos

### Opción 2: Editor de Imágenes Manual

1. Abre `logo.png` en Photoshop, GIMP, Figma, o cualquier editor
2. Agrega una capa de fondo negro (#0B0B0B) detrás del logo
3. Exporta en los siguientes tamaños:
   - `icon-72.png` (72x72px)
   - `icon-96.png` (96x96px)
   - `icon-128.png` (128x128px)
   - `icon-144.png` (144x144px)
   - `icon-152.png` (152x152px)
   - `icon-192.png` (192x192px)
   - `icon-384.png` (384x384px)
   - `icon-512.png` (512x512px)
4. Guarda todos en `public/icons/`

### Opción 3: Script con Node.js (Requiere sharp)

Si tienes `sharp` instalado, puedes usar este script:

```bash
npm install sharp
node scripts/generate-icons-with-sharp.js
```

## Actualizar Manifest

Una vez que tengas los iconos con fondo negro, actualiza `manifest.json`:

```json
{
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## Verificar

1. Desinstala la PWA actual
2. Limpia el caché del navegador
3. Recarga la página
4. Reinstala la PWA
5. Verifica que el icono tenga fondo negro

