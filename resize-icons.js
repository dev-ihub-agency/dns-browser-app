const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const sourceIcon = path.join(__dirname, 'assets', 'rmgroup-app-icon.png');
const resDir = path.join(__dirname, 'android', 'app', 'src', 'main', 'res');

// Launcher icon sizes (for legacy icons)
const launcherSizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

// Adaptive icon sizes (108dp base)
const adaptiveSizes = {
  'mipmap-mdpi': 108,
  'mipmap-hdpi': 162,
  'mipmap-xhdpi': 216,
  'mipmap-xxhdpi': 324,
  'mipmap-xxxhdpi': 432,
};

// Splash screen image sizes
const splashSizes = {
  'drawable-mdpi': 80,
  'drawable-hdpi': 120,
  'drawable-xhdpi': 160,
  'drawable-xxhdpi': 240,
  'drawable-xxxhdpi': 320,
};

async function resizeIcons() {
  console.log('Resizing launcher icons (legacy)...');
  
  for (const [folder, size] of Object.entries(launcherSizes)) {
    const targetDir = path.join(resDir, folder);
    
    // ic_launcher.png - use the full icon with rounded corners
    await sharp(sourceIcon)
      .resize(size, size)
      .toFile(path.join(targetDir, 'ic_launcher.png'));
    
    // ic_launcher_round.png - same as launcher
    await sharp(sourceIcon)
      .resize(size, size)
      .toFile(path.join(targetDir, 'ic_launcher_round.png'));
    
    console.log(`  ${folder}: ${size}x${size}`);
  }
  
  console.log('\nResizing adaptive icon layers...');
  
  for (const [folder, totalSize] of Object.entries(adaptiveSizes)) {
    const targetDir = path.join(resDir, folder);
    
    // Foreground: the icon with more padding for safe zone
    // Use 50% of total size to leave enough margin for different icon shapes
    const iconSize = Math.round(totalSize * 0.5);
    const padding = Math.round((totalSize - iconSize) / 2);
    
    await sharp(sourceIcon)
      .resize(iconSize, iconSize)
      .extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toFile(path.join(targetDir, 'ic_launcher_foreground.png'));
    
    // Background: solid green color matching the icon
    await sharp({
      create: {
        width: totalSize,
        height: totalSize,
        channels: 4,
        background: { r: 13, g: 94, b: 47, alpha: 255 } // #0D5E2F
      }
    })
      .png()
      .toFile(path.join(targetDir, 'ic_launcher_background.png'));
    
    console.log(`  ${folder}: ${totalSize}x${totalSize}`);
  }
  
  console.log('\nResizing splash screen images...');
  
  for (const [folder, size] of Object.entries(splashSizes)) {
    const targetDir = path.join(resDir, folder);
    
    await sharp(sourceIcon)
      .resize(size, size)
      .toFile(path.join(targetDir, 'splashscreen_image.png'));
    
    console.log(`  ${folder}: ${size}x${size}`);
  }
  
  console.log('\nDone! All icons resized correctly.');
}

resizeIcons().catch(console.error);
