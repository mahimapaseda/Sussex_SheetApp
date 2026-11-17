const { app, BrowserWindow, Tray, Menu, session, shell, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

// Enforce single instance lock so the app never duplicates in memory
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

// Low-memory Chromium flags tuned for 4GB RAM Windows PCs
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('disable-background-networking');
app.commandLine.appendSwitch('disable-extensions');
app.commandLine.appendSwitch('disable-sync');
app.commandLine.appendSwitch('disable-translate');
app.commandLine.appendSwitch('mute-audio');
app.commandLine.appendSwitch('aggressive-cache-discard');
app.commandLine.appendSwitch('disk-cache-size', '10485760');
app.commandLine.appendSwitch('media-cache-size', '5242880');
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion,AudioServiceOutOfProcess,MediaRouter,OptimizationHints');
app.commandLine.appendSwitch('renderer-process-limit', '1');
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=128 --optimize-for-size');

let mainWindow = null;
let tray = null;
let shutdownCompleted = false;
let quitPromise = null;
let backendModule = null;

const PORT = process.env.PORT || 3847;

global.sheetAppTrayNotify = (title, content) => {
  if (tray) {
    try {
      tray.displayBalloon?.({ title, content });
    } catch (e) {}
  }
};

global.sheetAppQuitApp = async () => {
  return quitApplication();
};

function startBackendServer() {
  try {
    process.env.OPEN_BROWSER_ON_BOOT = 'false';
    backendModule = require('../src/index.js');
    console.log('[Electron] Embedded SheetApp Express server active on port ' + PORT);
  } catch (err) {
    console.error('[Electron] Failed to start embedded backend:', err);
  }
}

function getIconImage() {
  const candidates = [
    process.resourcesPath ? path.join(process.resourcesPath, 'icon.png') : null,
    process.resourcesPath ? path.join(process.resourcesPath, 'icon.ico') : null,
    path.join(__dirname, '../build/icon.png'),
    path.join(__dirname, '../build/icon.ico'),
    path.join(__dirname, '../src/public/favicon.png')
  ];

  for (const c of candidates) {
    if (!c || !fs.existsSync(c)) continue;
    try {
      let img = nativeImage.createFromPath(c);
      if (img && !img.isEmpty()) return { image: img, path: c };
      const buf = fs.readFileSync(c);
      img = nativeImage.createFromBuffer(buf);
      if (img && !img.isEmpty()) return { image: img, path: c };
    } catch (e) {}
  }
  return { image: null, path: null };
}

function createWindow() {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
    return;
  }

  const iconData = getIconImage();
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    title: 'SheetApp — WhatsApp & Sheets Automation',
    icon: iconData.image || iconData.path,
    backgroundColor: '#0b0f19',
    show: false, // Don't show until ready-to-show
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  if (iconData.image && !iconData.image.isEmpty()) {
    try {
      mainWindow.setIcon(iconData.image);
    } catch (e) {}
  }

  mainWindow.setMenuBarVisibility(false);

  // If page load attempt happens while server is binding, automatically retry
  let retryCount = 0;
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    if (retryCount < 30) {
      retryCount++;
      console.log(`[Electron] Page load attempt waiting for server (${errorCode}), retry ${retryCount}/30...`);
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.loadURL(`http://localhost:${PORT}`);
        }
      }, 400);
    }
  });

  mainWindow.loadURL(`http://localhost:${PORT}`);

  mainWindow.once('ready-to-show', () => {
    console.log('[Electron] Main window ready-to-show');
    mainWindow.show();
  });

  // Closing the window cleanly terminates the background process
  mainWindow.on('close', (event) => {
    if (!shutdownCompleted) {
      event.preventDefault();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.hide();
      }
      quitApplication();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    session.defaultSession.clearCache().catch(() => {});
  });

  // Open external links in default OS browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });
}

function createTray() {
  const iconData = getIconImage();
  if (!iconData.image && !iconData.path) return;

  try {
    tray = new Tray(iconData.image || iconData.path);
    tray.setToolTip('SheetApp — Sussex College Network');

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Open SheetApp',
        click: () => createWindow()
      },
      {
        label: 'Sync Google Sheets Now',
        click: () => {
          if (mainWindow) {
            mainWindow.webContents.executeJavaScript("document.getElementById('btnSyncSheets')?.click();");
          } else {
            createWindow();
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Quit SheetApp',
        click: () => quitApplication()
      }
    ]);

    tray.setContextMenu(contextMenu);
    tray.on('double-click', () => createWindow());
  } catch (err) {
    console.warn('[Electron] Tray init warning:', err.message);
  }
}

async function quitApplication() {
  if (quitPromise) return quitPromise;

  quitPromise = (async () => {
    console.log('[Electron] Closing SheetApp and ending all background tasks...');
    if (tray) {
      try {
        tray.destroy();
      } catch (e) {}
      tray = null;
    }

    try {
      if (backendModule && typeof backendModule.shutdownBackend === 'function') {
        await Promise.race([
          backendModule.shutdownBackend(),
          new Promise((resolve) => setTimeout(resolve, 3000))
        ]);
      }
    } catch (e) {}

    shutdownCompleted = true;
    app.exit(0);
  })();

  return quitPromise;
}

app.whenReady().then(() => {
  startBackendServer();
  createTray();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Register custom protocol so browser can bring SheetApp to foreground after OAuth
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('sheetapp', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('sheetapp');
}

function bringWindowToForeground() {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
    mainWindow.webContents.executeJavaScript("if (typeof fetchGoogleAuthStatus === 'function') fetchGoogleAuthStatus(); if (typeof loadSheets === 'function') loadSheets(true);");
  } else {
    createWindow();
  }
}

app.on('second-instance', () => {
  bringWindowToForeground();
});

app.on('open-url', (event, url) => {
  event.preventDefault();
  bringWindowToForeground();
});

app.on('before-quit', (event) => {
  if (!shutdownCompleted) {
    event.preventDefault();
    quitApplication();
  }
});

app.on('window-all-closed', () => {
  quitApplication();
});
