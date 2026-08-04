import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';

// Helper to draw filled rectangle
function drawRect(png, x, y, w, h, r, g, b, a = 255) {
  for (let py = Math.max(0, y); py < Math.min(png.height, y + h); py++) {
    for (let px = Math.max(0, x); px < Math.min(png.width, x + w); px++) {
      const idx = (png.width * py + px) << 2;
      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = a;
    }
  }
}

// Helper to draw a circle
function drawCircle(png, cx, cy, radius, r, g, b, a = 255) {
  const r2 = radius * radius;
  for (let py = Math.max(0, cy - radius); py <= Math.min(png.height - 1, cy + radius); py++) {
    for (let px = Math.max(0, cx - radius); px <= Math.min(png.width - 1, cx + radius); px++) {
      const dx = px - cx;
      const dy = py - cy;
      if (dx * dx + dy * dy <= r2) {
        const idx = (png.width * py + px) << 2;
        png.data[idx] = r;
        png.data[idx + 1] = g;
        png.data[idx + 2] = b;
        png.data[idx + 3] = a;
      }
    }
  }
}

// Draw YMA Energy Sun logo
function drawLogo(png, size, padding = 0) {
  // Background gradient-like fill (Amber / Dark Slate)
  const bgR = 15, bgG = 23, bgB = 42; // Dark slate #0f172a
  drawRect(png, 0, 0, size, size, bgR, bgG, bgB, 255);

  const center = size / 2;
  const radius = (size / 2) - padding - Math.floor(size * 0.1);

  // Outer glowing sun ring (Amber #f59e0b)
  drawCircle(png, center, center, radius, 245, 158, 11, 255);

  // Inner dark circle
  drawCircle(png, center, center, Math.floor(radius * 0.75), bgR, bgG, bgB, 255);

  // Center core sun (Orange #f97316)
  drawCircle(png, center, center, Math.floor(radius * 0.45), 249, 115, 22, 255);

  // Solar ray accents (horizontal & vertical bars)
  const barW = Math.max(4, Math.floor(size * 0.08));
  const barH = Math.floor(radius * 1.6);
  drawRect(png, center - barW / 2, center - barH / 2, barW, barH, 245, 158, 11, 255);
  drawRect(png, center - barH / 2, center - barW / 2, barH, barW, 245, 158, 11, 255);

  // Center bright core
  drawCircle(png, center, center, Math.floor(radius * 0.3), 255, 255, 255, 255);
}

function createIcon(size, filename, padding = 0) {
  const png = new PNG({ width: size, height: size });
  drawLogo(png, size, padding);
  const buffer = PNG.sync.write(png);
  fs.writeFileSync(path.join('public', filename), buffer);
  console.log(`Generated public/${filename}`);
}

function createScreenshot(width, height, filename, title) {
  const png = new PNG({ width, height });
  // Background #0f172a
  drawRect(png, 0, 0, width, height, 15, 23, 42, 255);
  // Header bar #1e293b
  drawRect(png, 0, 0, width, 60, 30, 41, 59, 255);
  // Accent bar #f59e0b
  drawRect(png, 0, 56, width, 4, 245, 158, 11, 255);
  // Card 1
  drawRect(png, 20, 80, width - 40, 140, 30, 41, 59, 255);
  drawRect(png, 40, 100, 80, 80, 245, 158, 11, 255);
  // Card 2
  drawRect(png, 20, 240, width - 40, 140, 30, 41, 59, 255);
  drawRect(png, 40, 260, 80, 80, 249, 115, 22, 255);

  const buffer = PNG.sync.write(png);
  fs.writeFileSync(path.join('public', filename), buffer);
  console.log(`Generated public/${filename}`);
}

createIcon(192, 'icon-192.png');
createIcon(512, 'icon-512.png');
createIcon(512, 'icon-maskable.png', 40);
createScreenshot(640, 1136, 'screenshot-mobile.png', 'YMA Energy Mobile');
createScreenshot(1280, 800, 'screenshot-desktop.png', 'YMA Energy Desktop');
