import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function generateAssets() {
  const svgBuffer = fs.readFileSync(path.join('public', 'logo.svg'));

  // 1. Icon 192x192
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join('public', 'icon-192.png'));
  console.log('Created icon-192.png');

  // 2. Icon 512x512
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join('public', 'icon-512.png'));
  console.log('Created icon-512.png');

  // 3. Maskable Icon 512x512 (with padding & dark slate background)
  const logoResized = await sharp(svgBuffer)
    .resize(384, 384)
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 15, g: 23, b: 42, alpha: 1 } // #0f172a
    }
  })
    .composite([{ input: logoResized, top: 64, left: 64 }])
    .png()
    .toFile(path.join('public', 'icon-maskable.png'));
  console.log('Created icon-maskable.png');

  // 4. Mobile Screenshot (640x1136)
  const mobileLogo = await sharp(svgBuffer).resize(200, 200).toBuffer();
  const mobileSvgOverlay = Buffer.from(`
    <svg width="640" height="1136">
      <rect width="640" height="1136" fill="#0f172a" />
      <rect x="0" y="0" width="640" height="90" fill="#1e293b" />
      <text x="320" y="55" font-family="sans-serif" font-weight="bold" font-size="26" fill="#ffffff" text-anchor="middle">YMA ENERGY GROUP</text>
      <rect x="0" y="90" width="640" height="4" fill="#f59e0b" />
      
      <!-- Card 1 -->
      <rect x="30" y="340" width="580" height="180" rx="20" fill="#1e293b" stroke="#334155" stroke-width="2" />
      <text x="60" y="390" font-family="sans-serif" font-weight="bold" font-size="24" fill="#f59e0b">Duka la Solar &amp; Inverters</text>
      <text x="60" y="430" font-family="sans-serif" font-size="18" fill="#94a3b8">Victron, Must, Felicity &amp; Lithium Batteries</text>

      <!-- Card 2 -->
      <rect x="30" y="550" width="580" height="180" rx="20" fill="#1e293b" stroke="#334155" stroke-width="2" />
      <text x="60" y="600" font-family="sans-serif" font-weight="bold" font-size="24" fill="#38bdf8">Huduma za Mafundi &amp; Survey</text>
      <text x="60" y="640" font-family="sans-serif" font-size="18" fill="#94a3b8">Ufungaji wa Mifumo ya Solar Tanzania Nzima</text>

      <!-- Floating Action -->
      <rect x="170" y="980" width="300" height="60" rx="30" fill="#f59e0b" />
      <text x="320" y="1018" font-family="sans-serif" font-weight="bold" font-size="20" fill="#ffffff" text-anchor="middle">Wasiliana Nasi WhatsApp</text>
    </svg>
  `);

  await sharp(mobileSvgOverlay)
    .composite([{ input: mobileLogo, top: 110, left: 220 }])
    .png()
    .toFile(path.join('public', 'screenshot-mobile.png'));
  console.log('Created screenshot-mobile.png');

  // 5. Desktop Screenshot (1280x800)
  const desktopLogo = await sharp(svgBuffer).resize(160, 160).toBuffer();
  const desktopSvgOverlay = Buffer.from(`
    <svg width="1280" height="800">
      <rect width="1280" height="800" fill="#0f172a" />
      <!-- Sidebar -->
      <rect x="0" y="0" width="260" height="800" fill="#1e293b" />
      <text x="130" y="220" font-family="sans-serif" font-weight="bold" font-size="20" fill="#ffffff" text-anchor="middle">YMA ENERGY</text>
      
      <!-- Top header -->
      <rect x="260" y="0" width="1020" height="70" fill="#1e293b" />
      <text x="290" y="45" font-family="sans-serif" font-weight="bold" font-size="22" fill="#ffffff">YMA Energy Control Console</text>

      <!-- Stat Cards -->
      <rect x="290" y="100" width="220" height="110" rx="16" fill="#1e293b" />
      <text x="310" y="135" font-family="sans-serif" font-size="14" fill="#94a3b8">MAPATO</text>
      <text x="310" y="175" font-family="sans-serif" font-weight="bold" font-size="22" fill="#f59e0b">TZS 48,500,000</text>

      <rect x="530" y="100" width="220" height="110" rx="16" fill="#1e293b" />
      <text x="550" y="135" font-family="sans-serif" font-size="14" fill="#94a3b8">ODAS</text>
      <text x="550" y="175" font-family="sans-serif" font-weight="bold" font-size="22" fill="#ffffff">142 Odas</text>

      <rect x="770" y="100" width="220" height="110" rx="16" fill="#1e293b" />
      <text x="790" y="135" font-family="sans-serif" font-size="14" fill="#94a3b8">MAFUNDI</text>
      <text x="790" y="175" font-family="sans-serif" font-weight="bold" font-size="22" fill="#38bdf8">18 Surveyors</text>

      <!-- Main Content Area -->
      <rect x="290" y="240" width="940" height="520" rx="20" fill="#1e293b" />
      <text x="320" y="285" font-family="sans-serif" font-weight="bold" font-size="20" fill="#ffffff">Catalog &amp; Store Management</text>
    </svg>
  `);

  await sharp(desktopSvgOverlay)
    .composite([{ input: desktopLogo, top: 40, left: 50 }])
    .png()
    .toFile(path.join('public', 'screenshot-desktop.png'));
  console.log('Created screenshot-desktop.png');
}

generateAssets().catch(console.error);
