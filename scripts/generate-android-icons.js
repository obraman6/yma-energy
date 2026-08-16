import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const projectRoot = process.cwd();
const svgPath = path.join(projectRoot, 'public', 'logo.svg');
if (!fs.existsSync(svgPath)) {
  console.error('public/logo.svg not found');
  process.exit(1);
}

const outBase = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res');

const densities = {
  mdpi: 48,
  hdpi: 72,
  xhdpi: 96,
  xxhdpi: 144,
  xxxhdpi: 192,
};

// Brand/background color for adaptive icon
const bgColor = '#f59e0b'; // amber accent used in project assets

async function generate() {
  const svgBuffer = fs.readFileSync(svgPath);

  for (const [density, size] of Object.entries(densities)) {
    const dir = path.join(outBase, `mipmap-${density}`);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // Foreground: transparent background, logo scaled to 72% and centered with subtle drop shadow
    const fgSize = size;
    const logoSize = Math.round(fgSize * 0.72);
    const logoBuf = await sharp(svgBuffer).resize(logoSize, logoSize).png().toBuffer();

    // create shadow by tinting logo to black, blurring and offsetting
    const shadow = await sharp(logoBuf)
      .png()
      .flatten({ background: { r: 0, g: 0, b: 0 } })
      .png()
      .toBuffer();

    const shadowBuf = await sharp(shadow)
      .resize(logoSize, logoSize)
      .composite([])
      .blur(6)
      .toColourspace('b-w')
      .modulate({ brightness: 0.6 })
      .png()
      .toBuffer();

    const fgCanvas = sharp({ create: { width: fgSize, height: fgSize, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } });
    const fgComposites = [];
    const left = Math.round((fgSize - logoSize) / 2);
    const top = Math.round((fgSize - logoSize) / 2);

    // place shadow slightly lower-right
    fgComposites.push({ input: shadowBuf, left: left + Math.round(logoSize * 0.04), top: top + Math.round(logoSize * 0.04), blend: 'over' });
    fgComposites.push({ input: logoBuf, left, top, blend: 'over' });

    const fg = await fgCanvas.composite(fgComposites).png().toBuffer();

    const fgPath = path.join(dir, 'ic_launcher_foreground.png');
    fs.writeFileSync(fgPath, fg);

    // Legacy launcher: circular background with brand color and centered logo
    const legacy = await sharp({
      create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
    })
      .composite([
        // background circle
        {
          input: Buffer.from(`<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="${bgColor}"/></svg>`),
          left: 0,
          top: 0
        },
        { input: logoBuf, left, top }
      ])
      .png()
      .toBuffer();

    const legacyPath = path.join(dir, 'ic_launcher.png');
    fs.writeFileSync(legacyPath, legacy);

    // Round icon: same as legacy
    const roundPath = path.join(dir, 'ic_launcher_round.png');
    fs.writeFileSync(roundPath, legacy);

    console.log(`Wrote icons for ${density} (${size}x${size})`);
  }

  // Also update any mipmap-anydpi-v26 assets (keep xmls as-is)
  // Also update any mipmap-anydpi-v26 assets (keep xmls as-is)
  const splashDir = path.join(outBase, 'drawable');
  if (!fs.existsSync(splashDir)) fs.mkdirSync(splashDir, { recursive: true });

  // Create a high-resolution splash image (portrait) for `@drawable/splash`
  try {
    const splashW = 1080;
    const splashH = 1920;
    const logoSize = Math.round(splashW * 0.42);
    const logoBuf = await sharp(svgBuffer).resize(logoSize, logoSize).png().toBuffer();

    const splashBuf = await sharp({ create: { width: splashW, height: splashH, channels: 4, background: bgColor } })
      .composite([{ input: logoBuf, left: Math.round((splashW - logoSize) / 2), top: Math.round((splashH - logoSize) / 2) }])
      .png()
      .toBuffer();

    const splashPath = path.join(splashDir, 'splash.png');
    fs.writeFileSync(splashPath, splashBuf);
    console.log('Wrote drawable/splash.png');
  } catch (err) {
    console.error('Failed to write splash image', err);
  }

  // Create a transparent square splash logo for the Android 12+ splash icon
  try {
    const logoCanvas = 512;
    const logoRenderSize = Math.round(logoCanvas * 0.78);
    const logoBuf2 = await sharp(svgBuffer).resize(logoRenderSize, logoRenderSize).png().toBuffer();

    const splashLogo = await sharp({ create: { width: logoCanvas, height: logoCanvas, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: logoBuf2, left: Math.round((logoCanvas - logoRenderSize) / 2), top: Math.round((logoCanvas - logoRenderSize) / 2) }])
      .png()
      .toBuffer();

    const splashLogoPath = path.join(splashDir, 'splash_logo.png');
    fs.writeFileSync(splashLogoPath, splashLogo);
    console.log('Wrote drawable/splash_logo.png');
  } catch (err) {
    console.error('Failed to write splash_logo image', err);
  }
}

generate().catch(err => { console.error(err); process.exit(1); });
