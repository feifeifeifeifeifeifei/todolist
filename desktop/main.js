const {
  app,
  BrowserWindow,
  Menu,
  ipcMain,
  protocol,
  net,
  shell,
} = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const url = require('node:url');

app.setName('TodoList');

const isDev = process.env.ELECTRON_DEV === '1' && !app.isPackaged;
const DEV_URL = process.env.VITE_DEV_URL || 'http://localhost:5173';

// All sizes are expressed at scale = 1.0 ("Large"). Other sizes scale them
// proportionally — both the rendered content (via webContents zoom factor)
// and the window's physical dimensions (via setContentSize). The CSS layout
// viewport stays the same at every size, so the design just renders smaller.
const SCALE_PRESETS = {
  large: 1.0,
  medium: 0.85,
  small: 0.7,
};
const SIZE_LABELS = { large: 'Large', medium: 'Medium', small: 'Small' };
const SIZE_ORDER = ['large', 'medium', 'small'];

const BASE = {
  WIDTH: 480,
  MIN_WIDTH: 320,
  MIN_HEIGHT: 240,
  INITIAL_HEIGHT: 360,
  MAX_AUTOGROW: 720,
};

const INJECTED_CSS = `
  :root {
    --__todo-card-color: color-mix(in srgb, var(--bg) 92%, var(--code-bg));
  }
  html, body {
    margin: 0 !important;
    background: var(--__todo-card-color) !important;
    background-image: none !important;
  }
  body {
    overflow-x: hidden;
    overflow-y: auto;
  }
  #root {
    min-height: 0 !important;
    padding: 0 !important;
    display: block !important;
    align-items: initial !important;
    justify-content: initial !important;
    max-width: none !important;
  }
  .app {
    max-width: none !important;
    width: auto !important;
    margin: 0 !important;
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    padding-top: 2.4rem !important;
    box-sizing: border-box !important;
  }
  /* draggable strip across the top of the window so the user can grab
     anywhere along the title-bar area, not only the traffic-light spot.
     The gear button has a higher z-index + no-drag, so it stays clickable. */
  .app::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 32px;
    -webkit-app-region: drag;
    z-index: 1;
  }
  .app-settings-btn {
    top: 1.1rem !important;
    right: 0.85rem !important;
    -webkit-app-region: no-drag !important;
    z-index: 3 !important;
  }
  /* Pin the "Undo clear" button to the bottom of the card. We only do this
     when Undo is actually rendered (clearedTodos.length > 0); when it's
     absent, the layout is unchanged. */
  .app:has(.clear-completed-and-undo .btn-ghost) {
    padding-bottom: 3.5rem !important;
  }
  .clear-completed-and-undo .btn-ghost {
    position: absolute !important;
    bottom: 1rem !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    margin: 0 !important;
    z-index: 2 !important;
  }
`;

function resolveDistDir() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'web');
  }
  return path.resolve(__dirname, '..', 'to-do-list', 'dist');
}

function settingsPath() {
  return path.join(app.getPath('userData'), 'desktop-settings.json');
}

function loadSettings() {
  try {
    const raw = fs.readFileSync(settingsPath(), 'utf8');
    const data = JSON.parse(raw);
    return data && typeof data === 'object' ? data : {};
  } catch {
    return {};
  }
}

function saveSettings(patch) {
  try {
    const file = settingsPath();
    const merged = { ...loadSettings(), ...patch };
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(merged, null, 2));
  } catch (err) {
    console.warn('Failed to save desktop settings:', err);
  }
}

function getInitialSize() {
  const stored = loadSettings().size;
  return stored && stored in SCALE_PRESETS ? stored : 'large';
}

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
    },
  },
]);

let alwaysOnTopMenuItem = null;
const sizeMenuItems = {};
let currentSize = 'large';

function syncSizeMenu() {
  for (const name of SIZE_ORDER) {
    const item = sizeMenuItems[name];
    if (item) item.checked = name === currentSize;
  }
}

function syncAlwaysOnTopMenu(win) {
  if (!alwaysOnTopMenuItem || !win || win.isDestroyed()) return;
  alwaysOnTopMenuItem.checked = win.isAlwaysOnTop();
}

function applySize(win, sizeName) {
  if (!win || win.isDestroyed()) return;
  const next = sizeName in SCALE_PRESETS ? sizeName : 'large';
  const newScale = SCALE_PRESETS[next];
  const oldScale = SCALE_PRESETS[currentSize] || 1.0;

  win.webContents.setZoomFactor(newScale);
  win.setMinimumSize(
    Math.round(BASE.MIN_WIDTH * newScale),
    Math.round(BASE.MIN_HEIGHT * newScale),
  );

  if (newScale !== oldScale) {
    const [w, h] = win.getContentSize();
    const ratio = newScale / oldScale;
    const minW = Math.round(BASE.MIN_WIDTH * newScale);
    const minH = Math.round(BASE.MIN_HEIGHT * newScale);
    win.setContentSize(
      Math.max(Math.round(w * ratio), minW),
      Math.max(Math.round(h * ratio), minH),
      false,
    );
  }

  currentSize = next;
  saveSettings({ size: next });
  syncSizeMenu();
}

function buildAppMenu() {
  const isMac = process.platform === 'darwin';

  const sizeSubmenu = SIZE_ORDER.map((name, idx) => ({
    id: `size-${name}`,
    label: SIZE_LABELS[name],
    type: 'radio',
    checked: currentSize === name,
    accelerator: `CmdOrCtrl+${idx + 1}`,
    click: () => {
      const win = BrowserWindow.getFocusedWindow()
        || BrowserWindow.getAllWindows()[0];
      if (win) applySize(win, name);
    },
  }));

  const template = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' },
            ],
          },
        ]
      : []),
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { label: 'Window Size', submenu: sizeSubmenu },
        { type: 'separator' },
        {
          id: 'always-on-top',
          label: 'Always on Top',
          type: 'checkbox',
          accelerator: 'CmdOrCtrl+Shift+P',
          checked: false,
          click: (menuItem) => {
            const win = BrowserWindow.getFocusedWindow()
              || BrowserWindow.getAllWindows()[0];
            if (!win || win.isDestroyed()) return;
            win.setAlwaysOnTop(menuItem.checked, 'floating');
          },
        },
        { type: 'separator' },
        { role: 'close' },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  alwaysOnTopMenuItem = menu.getMenuItemById('always-on-top');
  for (const name of SIZE_ORDER) {
    sizeMenuItems[name] = menu.getMenuItemById(`size-${name}`);
  }
  return menu;
}

function createWindow() {
  const initialScale = SCALE_PRESETS[currentSize];

  const win = new BrowserWindow({
    width: Math.round(BASE.WIDTH * initialScale),
    height: Math.round(BASE.INITIAL_HEIGHT * initialScale),
    useContentSize: true,
    resizable: true,
    minWidth: Math.round(BASE.MIN_WIDTH * initialScale),
    minHeight: Math.round(BASE.MIN_HEIGHT * initialScale),
    maximizable: true,
    fullscreenable: true,
    title: 'TodoList',
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#fbfaf6',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
      zoomFactor: initialScale,
    },
  });

  if (isDev) {
    win.loadURL(DEV_URL);
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadURL('app://bundle/index.html');
  }

  win.webContents.on('did-finish-load', () => {
    // re-assert zoom factor in case the navigation reset it (Chromium does
    // remember it per origin, but we want a hard guarantee on every load)
    win.webContents.setZoomFactor(SCALE_PRESETS[currentSize]);
    win.webContents.insertCSS(INJECTED_CSS);
  });

  win.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
    if (/^https?:\/\//i.test(targetUrl)) {
      shell.openExternal(targetUrl);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  win.on('always-on-top-changed', () => syncAlwaysOnTopMenu(win));
  win.on('focus', () => syncAlwaysOnTopMenu(win));
}

ipcMain.on('content-height', (event, rawCssHeight) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win || win.isDestroyed()) return;
  const cssHeight = Math.ceil(rawCssHeight);
  if (!Number.isFinite(cssHeight) || cssHeight <= 0) return;

  // The renderer measures in CSS pixels. With the zoom factor applied,
  // 1 CSS px = scale DIPs on screen. Convert + cap.
  const scale = SCALE_PRESETS[currentSize] || 1.0;
  const cappedCss = Math.min(BASE.MAX_AUTOGROW, cssHeight);
  const desiredDip = Math.ceil(cappedCss * scale);

  const [w, currentH] = win.getContentSize();
  // only auto-grow; never shrink the window the user has manually sized
  if (desiredDip <= currentH) return;
  win.setContentSize(w, desiredDip, false);
});

app.whenReady().then(() => {
  currentSize = getInitialSize();

  const distDir = resolveDistDir();

  protocol.handle('app', (request) => {
    const requestUrl = new URL(request.url);
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (!pathname || pathname === '/') {
      pathname = '/index.html';
    }
    const safePath = path.normalize(pathname).replace(/^([\\/])+/, '');
    const filePath = path.join(distDir, safePath);
    if (!filePath.startsWith(distDir)) {
      return new Response('Forbidden', { status: 403 });
    }
    return net.fetch(url.pathToFileURL(filePath).toString());
  });

  Menu.setApplicationMenu(buildAppMenu());
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
