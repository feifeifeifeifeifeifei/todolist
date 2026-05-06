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
const url = require('node:url');

app.setName('TodoList');

const isDev = process.env.ELECTRON_DEV === '1' && !app.isPackaged;
const DEV_URL = process.env.VITE_DEV_URL || 'http://localhost:5173';

const WIN_WIDTH = 480;
const MIN_CONTENT_WIDTH = 320;
const MIN_CONTENT_HEIGHT = 240;
const INITIAL_CONTENT_HEIGHT = 360;
const MAX_AUTOGROW_HEIGHT = 720;

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
`;

function resolveDistDir() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'web');
  }
  return path.resolve(__dirname, '..', 'to-do-list', 'dist');
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

function buildAppMenu() {
  const isMac = process.platform === 'darwin';
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
  return menu;
}

function syncAlwaysOnTopMenu(win) {
  if (!alwaysOnTopMenuItem || !win || win.isDestroyed()) return;
  alwaysOnTopMenuItem.checked = win.isAlwaysOnTop();
}

function clampAutoGrow(rawHeight) {
  if (!Number.isFinite(rawHeight)) return null;
  return Math.min(MAX_AUTOGROW_HEIGHT, Math.ceil(rawHeight));
}

function createWindow() {
  const win = new BrowserWindow({
    width: WIN_WIDTH,
    height: INITIAL_CONTENT_HEIGHT,
    useContentSize: true,
    resizable: true,
    minWidth: MIN_CONTENT_WIDTH,
    minHeight: MIN_CONTENT_HEIGHT,
    maximizable: true,
    fullscreenable: true,
    title: 'TodoList',
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#fbfaf6',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (isDev) {
    win.loadURL(DEV_URL);
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadURL('app://bundle/index.html');
  }

  win.webContents.on('did-finish-load', () => {
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

ipcMain.on('content-height', (event, rawHeight) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win || win.isDestroyed()) return;
  const desired = clampAutoGrow(rawHeight);
  if (desired === null || desired <= 0) return;
  const [w, currentH] = win.getContentSize();
  // only auto-grow when the content actually overflows the current window;
  // never auto-shrink, so the user keeps any height they manually picked
  if (desired <= currentH) return;
  win.setContentSize(w, desired, false);
});

app.whenReady().then(() => {
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
