/**
 * Script para generar iconos de PWA con fondo negro usando sharp
 * 
 * Requisitos:
 * npm install sharp
 * 
 * Uso:
 * node scripts/generate-icons-with-sharp.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const logoPath = path.join(__dirname, '../public/logo.png');
const outputDir = path.join(__dirname, '../public/icons');

// Crear directorio de salida si no existe
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function generateIcons() {
  try {
    console.log('🎨 Generando iconos con fondo negro...\n');

    // Verificar que el logo existe
    if (!fs.existsSync(logoPath)) {
      console.error('❌ Error: logo.png no encontrado en public/');
      process.exit(1);
    }

    // Color de fondo negro
    const backgroundColor = { r: 11, g: 11, b: 11 }; // #0B0B0B

    for (const size of sizes) {
      try {
        const outputPath = path.join(outputDir, `icon-${size}.png`);
        
        await sharp(logoPath)
          .resize(size, size, {
            fit: 'contain',
            background: backgroundColor
          })
          .extend({
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            background: backgroundColor
          })
          .png()
          .toFile(outputPath);

        console.log(`✅ Generado: icon-${size}.png (${size}x${size}px)`);
      } catch (error) {
        console.error(`❌ Error generando icon-${size}.png:`, error.message);
      }
    }

    console.log('\n✨ ¡Iconos generados exitosamente!');
    console.log(`📁 Ubicación: ${outputDir}`);
    console.log('\n📝 Próximos pasos:');
    console.log('1. Actualiza manifest.json para usar los iconos en /icons/');
    console.log('2. Desinstala y reinstala la PWA para ver los cambios');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Asegúrate de tener sharp instalado:');
    console.log('   npm install sharp');
    process.exit(1);
  }
}

// Verificar si sharp está instalado
try {
  require.resolve('sharp');
  generateIcons();
} catch (error) {
  console.error('❌ Error: sharp no está instalado');
  console.log('\n📦 Para instalar sharp, ejecuta:');
  console.log('   npm install sharp');
  console.log('\n💡 O usa una herramienta online como:');
  console.log('   - https://realfavicongenerator.net/');
  console.log('   - https://www.pwabuilder.com/imageGenerator');
  process.exit(1);
}

