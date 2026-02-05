const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function createSplash() {
  const sourceIcon = path.join(__dirname, 'assets', 'rmgroup-app-icon.png');
  const outputSplash = path.join(__dirname, 'assets', 'splash.png');
  
  // Splash screen dimensions (standard is 1284x2778 for modern phones)
  const splashWidth = 1284;
  const splashHeight = 2778;
  
  // Logo size - make it smaller (about 30% of screen width)
  const logoSize = Math.round(splashWidth * 0.35);
  
  // Background color
  const backgroundColor = '#FFC837'; // Yellow background like in screenshot
  
  console.log(`Creating splash screen: ${splashWidth}x${splashHeight}`);
  console.log(`Logo size: ${logoSize}x${logoSize}`);
  
  // Resize the icon
  const resizedLogo = await sharp(sourceIcon)
    .resize(logoSize, logoSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .toBuffer();
  
  // Create the splash screen with centered logo
  await sharp({
    create: {
      width: splashWidth,
      height: splashHeight,
      channels: 4,
      background: backgroundColor
    }
  })
  .composite([{
    input: resizedLogo,
    gravity: 'center'
  }])
  .png()
  .toFile(outputSplash);
  
  console.log('Splash screen created successfully!');
  
  // Also update the Android splash screen images
  const androidDrawables = [
    { folder: 'drawable-mdpi', size: 300 },
    { folder: 'drawable-hdpi', size: 450 },
    { folder: 'drawable-xhdpi', size: 600 },
    { folder: 'drawable-xxhdpi', size: 900 },
    { folder: 'drawable-xxxhdpi', size: 1200 },
  ];
  
  for (const { folder, size } of androidDrawables) {
    const drawableFolder = path.join(__dirname, 'android', 'app', 'src', 'main', 'res', folder);
    const splashImagePath = path.join(drawableFolder, 'splashscreen_image.png');
    
    if (fs.existsSync(drawableFolder)) {
      // Create smaller logo for Android splash
      const logoForSplash = Math.round(size * 0.5);
      
      const resizedLogoForAndroid = await sharp(sourceIcon)
        .resize(logoForSplash, logoForSplash, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .toBuffer();
      
      await sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: backgroundColor
        }
      })
      .composite([{
        input: resizedLogoForAndroid,
        gravity: 'center'
      }])
      .png()
      .toFile(splashImagePath);
      
      console.log(`Created ${folder}/splashscreen_image.png (${size}x${size}, logo: ${logoForSplash}px)`);
    }
  }
}

createSplash().catch(console.error);
