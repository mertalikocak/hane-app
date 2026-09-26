const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function processLogo() {
  const publicDir = path.join(__dirname, '..', 'public');
  const srcAppDir = path.join(__dirname, '..', 'src', 'app');

  // Locate the input image
  const files = fs.readdirSync(publicDir);
  const sourceFile = files.find(f => f.startsWith('ChatGPT Image') && f.endsWith('.png'));

  if (!sourceFile) {
    console.error('Source image not found in public directory!');
    process.exit(1);
  }

  const inputPath = path.join(publicDir, sourceFile);
  console.log(`Found source image: ${sourceFile}`);

  // 1. Copy as main public/logo.png
  await sharp(inputPath)
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'logo.png'));
  console.log('✓ Created public/logo.png');

  // 2. Generate 192x192 icon
  await sharp(inputPath)
    .resize(192, 192, { fit: 'cover' })
    .png()
    .toFile(path.join(publicDir, 'icon-192.png'));
  console.log('✓ Created public/icon-192.png');

  // 3. Generate 512x512 icon
  await sharp(inputPath)
    .resize(512, 512, { fit: 'cover' })
    .png()
    .toFile(path.join(publicDir, 'icon-512.png'));
  console.log('✓ Created public/icon-512.png');

  // 4. Generate 180x180 apple-touch-icon
  await sharp(inputPath)
    .resize(180, 180, { fit: 'cover' })
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✓ Created public/apple-touch-icon.png');

  // 5. Generate Next.js dynamic metadata app icons
  await sharp(inputPath)
    .resize(192, 192, { fit: 'cover' })
    .png()
    .toFile(path.join(srcAppDir, 'icon.png'));
  console.log('✓ Created src/app/icon.png');

  await sharp(inputPath)
    .resize(180, 180, { fit: 'cover' })
    .png()
    .toFile(path.join(srcAppDir, 'apple-icon.png'));
  console.log('✓ Created src/app/apple-icon.png');

  console.log('All icons generated successfully!');
}

processLogo().catch(err => {
  console.error('Error processing logo:', err);
  process.exit(1);
});
