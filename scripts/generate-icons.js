const fs = require('fs');
const path = require('path');

/**
 * Script para generar iconos de PWA con fondo negro
 * Este script crea versiones del logo.png con fondo negro en diferentes tamaños
 * 
 * Nota: Este script requiere que tengas sharp instalado o puedes usar un editor de imágenes
 * Por ahora, este script solo documenta los tamaños necesarios
 */

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const logoPath = path.join(__dirname, '../public/logo.png');
const outputDir = path.join(__dirname, '../public/icons');

console.log('📦 Generador de iconos para PWA');
console.log('================================\n');

console.log('Tamaños necesarios para los iconos:');
sizes.forEach(size => {
  console.log(`  - ${size}x${size}px`);
});

console.log('\n📝 Instrucciones:');
console.log('1. Abre logo.png en un editor de imágenes (Photoshop, GIMP, Figma, etc.)');
console.log('2. Agrega un fondo negro sólido detrás del logo');
console.log('3. Exporta el logo con fondo negro en los siguientes tamaños:');
console.log('   - icon-72.png (72x72px)');
console.log('   - icon-96.png (96x96px)');
console.log('   - icon-128.png (128x128px)');
console.log('   - icon-144.png (144x144px)');
console.log('   - icon-152.png (152x152px)');
console.log('   - icon-192.png (192x192px)');
console.log('   - icon-384.png (384x384px)');
console.log('   - icon-512.png (512x512px)');
console.log('4. Guarda todos los archivos en: public/icons/');
console.log('\n💡 Alternativa: Usa una herramienta online como:');
console.log('   - https://realfavicongenerator.net/');
console.log('   - https://www.pwabuilder.com/imageGenerator');
console.log('   - https://favicon.io/favicon-generator/');

// Verificar si existe el logo
if (fs.existsSync(logoPath)) {
  console.log('\n✅ logo.png encontrado en public/');
} else {
  console.log('\n❌ logo.png NO encontrado en public/');
}

