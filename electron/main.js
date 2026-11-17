const { app, BrowserWindow, net } = require('electron');
const path = require('path');

// ─── Single Instance Lock ───────────────────────────────────────────────────
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

// ─── Low-Memory / Low-Spec Chromium Flags ──────────────────────────────────
// Tuned for office PCs with 2–4 GB RAM (no discrete GPU)
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('disable-background-networking');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-backing-store-limit');
app.commandLine.appendSwitch('renderer-process-limit', '1');
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=192 --optimize-for-size');
app.commandLine.appendSwitch('disable-dev-shm-usage');  // critical for low RAM
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('single-process'); // reduces memory overhead

// ─── Config ─────────────────────────────────────────────────────────────────
let mainWindow = null;
const PORT = process.env.PORT || 3850;
const MAX_RETRIES = 30;   // 30 × 500ms = 15 seconds max wait
const RETRY_DELAY = 500;  // ms between readiness checks

// ─── Loading Screen HTML ─────────────────────────────────────────────────────
const LOADING_HTML = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    background: #0d1117;
    font-family: 'Segoe UI', system-ui, sans-serif;
    color: #e6edf3;
    user-select: none;
  }
  .logo {
    width: 64px; height: 64px;
    background: linear-gradient(135deg, #1B365D 0%, #2563eb 100%);
    border-radius: 16px;
    display: flex; align-items: center; justify-content: center;
    font-size: 32px;
    margin-bottom: 24px;
    box-shadow: 0 8px 32px rgba(37,99,235,0.3);
  }
  h1 { font-size: 22px; font-weight: 700; margin-bottom: 8px; letter-spacing: -0.5px; }
  p { font-size: 13px; color: #8b949e; margin-bottom: 32px; }
  .spinner {
    width: 36px; height: 36px;
    border: 3px solid #21262d;
    border-top-color: #2563eb;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .status {
    margin-top: 16px;
    font-size: 11px;
    color: #6e7681;
    letter-spacing: 0.5px;
  }
</style>
</head>
<body>
  <div class="logo">📊</div>
  <h1>SheetApp</h1>
  <p>WhatsApp &amp; Sheets Automation</p>
  <div class="spinner"></div>
  <div class="status" id="st">Starting backend services...</div>
  <script>
    let dot = 0;
    setInterval(() => {
      dot = (dot + 1) % 4;
      document.getElementById('st').textContent =
        'Starting backend services' + '.'.repeat(dot);
    }, 400);
  </script>
</body>
</html>`;

// ─── Backend Readiness Check ──────────────────────────────────────────────────
function waitForBackend(retries) {
  return new Promise((resolve, reject) => {
    function attempt(remaining) {
      const req = net.request(`http://localhost:${PORT}/api/status`);
      req.on('response', (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else if (remaining > 0) {
          setTimeout(() => attempt(remaining - 1), RETRY_DELAY);
        } else {
          reject(new Error('Backend did not respond after max retries'));
        }
      });
      req.on('error', () => {
        if (remaining > 0) {
          setTimeout(() => attempt(remaining - 1), RETRY_DELAY);
        } else {
          reject(new Error('Backend connection failed after max retries'));
        }
      });
      req.end();
    }
    attempt(retries);
  });
}

// ─── Start Backend Server ────────────────────────────────────────────────────
function startBackend() {
  try {
    require('../src/index.js');
    console.log('[Electron] SheetApp backend started on port ' + PORT);
  } catch (err) {
    console.error('[Electron] Backend startup error:', err);
  }
}

// ─── Create Main Window with Loading Screen ───────────────────────────────────
function createWindow() {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    title: 'SheetApp — WhatsApp & Sheets Automation',
    backgroundColor: '#0d1117',
    show: false,  // don't show until ready
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      backgroundThrottling: false,
      spellcheck: false,
    }
  });

  mainWindow.setMenuBarVisibility(false);

  // Show window immediately with loading screen
  mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(LOADING_HTML));
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Once backend is ready, navigate to the app
  waitForBackend(MAX_RETRIES)
    .then(() => {
      console.log('[Electron] Backend ready — loading app UI');
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.loadURL(`http://localhost:${PORT}`);
      }
    })
    .catch((err) => {
      console.error('[Electron] Backend failed to start:', err.message);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`
          <!DOCTYPE html>
          <html>
          <head><style>
            body { background:#0d1117; color:#f87171; display:flex; flex-direction:column;
                   align-items:center; justify-content:center; height:100vh;
                   font-family:'Segoe UI',sans-serif; }
            h2 { margin-bottom:12px; font-size:18px; }
            p  { color:#8b949e; font-size:13px; max-width:400px; text-align:center; }
          </style></head>
          <body>
            <h2>⚠️ SheetApp Failed to Start</h2>
            <p>The backend server could not start. Please close this window and try again.<br>
               If the problem persists, restart your computer.</p>
          </body>
          </html>
        `));
      }
    });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ─── App Entry Point ─────────────────────────────────────────────────────────
app.whenReady().then(() => {
  startBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Bring existing window to front on second launch attempt
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
