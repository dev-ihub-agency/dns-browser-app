const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'assets');

// Ensure assets directory exists
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Create a simple icon with ISN text and yellow background
async function createIcon(size, filename) {
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#FFC837"/>
      <text x="50%" y="55%" font-family="Arial, sans-serif" font-size="${size * 0.3}" font-weight="bold" fill="#000" text-anchor="middle" dominant-baseline="middle">ISN</text>
    </svg>
  `;
  
  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(assetsDir, filename));
  
  console.log(`Created ${filename}`);
}

// Create splash screen
async function createSplash() {
  const width = 1284;
  const height = 2778;
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#FFC837"/>
      <text x="50%" y="45%" font-family="Arial, sans-serif" font-size="120" font-weight="bold" fill="#000" text-anchor="middle">ISN</text>
      <text x="50%" y="52%" font-family="Arial, sans-serif" font-size="48" fill="#333" text-anchor="middle">Browser</text>
    </svg>
  `;
  
  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(assetsDir, 'splash.png'));
  
  console.log('Created splash.png');
}

async function main() {
  try {
    await createIcon(1024, 'icon.png');
    await createIcon(1024, 'adaptive-icon.png');
    await createIcon(48, 'favicon.png');
    await createSplash();
    console.log('All icons created successfully!');
  } catch (error) {
    console.error('Error creating icons:', error);
  }
}

main();
