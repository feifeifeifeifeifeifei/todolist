/* eslint-disable no-console */
// Render to-do-list/public/favicon.svg into build/icon.png at 1024x1024 using
// an offscreen Chromium window. electron-builder will automatically convert
// this PNG into the platform-native .icns / .ico formats it needs.

const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

const SVG_PATH = path.resolve(
  __dirname,
  '..',
  '..',
  'to-do-list',
  'public',
  'favicon.svg',
);
const OUT_DIR = path.resolve(__dirname, '..', 'build');
const OUT_PATH = path.join(OUT_DIR, 'icon.png');
const SIZE = 1024;
const PADDING = 96; // breathing room around the artwork

async function main() {
  if (!fs.existsSync(SVG_PATH)) {
    throw new Error(`Source icon not found: ${SVG_PATH}`);
  }

  const svg = fs.readFileSync(SVG_PATH, 'utf8');
  const innerSize = SIZE - PADDING * 2;

  const html = `<!doctype html>
<html>
<head><meta charset="utf-8"><style>
  html, body { margin: 0; padding: 0; background: transparent; }
  body { width: ${SIZE}px; height: ${SIZE}px; display: grid; place-items: center; }
  .wrap { width: ${innerSize}px; height: ${innerSize}px; display: grid; place-items: center; }
  .wrap > svg { width: 100%; height: 100%; }
</style></head>
<body><div class="wrap">${svg}</div></body>
</html>`;

  fs.mkdirSync(OUT_DIR, { recursive: true });

  await app.whenReady();

  const win = new BrowserWindow({
    width: SIZE,
    height: SIZE,
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    webPreferences: {
      offscreen: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.webContents.setBackgroundThrottling(false);

  await win.loadURL(
    'data:text/html;charset=utf-8,' + encodeURIComponent(html),
  );
  // give the SVG (with filters) a moment to fully paint
  await new Promise((r) => setTimeout(r, 400));

  const image = await win.webContents.capturePage({
    x: 0,
    y: 0,
    width: SIZE,
    height: SIZE,
  });

  if (image.isEmpty()) {
    throw new Error('capturePage returned an empty image');
  }

  fs.writeFileSync(OUT_PATH, image.toPNG());
  console.log(`✓ Wrote ${OUT_PATH} (${image.getSize().width}x${image.getSize().height})`);

  app.quit();
}

main().catch((err) => {
  console.error('Failed to build icon:', err);
  app.exit(1);
});
