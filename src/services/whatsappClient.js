const path = require('path');
const fs = require('fs');
const qrcode = require('qrcode');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const config = require('../config/env');

let clientInstance = null;
let clientStatus = 'DISCONNECTED'; // DISCONNECTED | INITIALIZING | QR_READY | AUTHENTICATED | CONNECTED | AUTH_FAILURE
let currentQRDataUrl = null;
let currentQRRaw = null;
let authenticatedUser = null;
let loadingPercent = null;

const AUTH_DIR = path.join(config.DATA_DIR, '.wwebjs_auth');
const SESSION_NAME = 'sheetapp-session';

if (!fs.existsSync(AUTH_DIR)) {
  try {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  } catch (e) {
    console.warn('[WhatsApp] Could not create auth directory:', e.message);
  }
}

/**
 * Auto-detects local Chrome or Edge executable on Windows/Host environment.
 */
function getSystemChromePath() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  const standardPaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium'
  ];

  for (const p of standardPaths) {
    if (p && fs.existsSync(p)) {
      return p;
    }
  }

  return undefined;
}

/**
 * Clean session files if corrupted or on user reset.
 */
function cleanSessionFolder() {
  const sessionDir = path.join(AUTH_DIR, `session-${SESSION_NAME}`);
  if (fs.existsSync(sessionDir)) {
    try {
      fs.rmSync(sessionDir, { recursive: true, force: true });
      console.log('[WhatsApp] Cleaned session directory from disk.');
    } catch (e) {
      console.warn('[WhatsApp] Could not remove session directory:', e.message);
    }
  }
}

function getStatus() {
  return {
    status: clientStatus,
    qrDataUrl: currentQRDataUrl,
    user: authenticatedUser,
    loadingPercent,
    isReady: clientStatus === 'CONNECTED'
  };
}

async function initializeWhatsApp() {
  if (clientInstance && (clientStatus === 'CONNECTED' || clientStatus === 'QR_READY' || clientStatus === 'INITIALIZING')) {
    return getStatus();
  }

  clientStatus = 'INITIALIZING';
  currentQRDataUrl = null;
  currentQRRaw = null;
  loadingPercent = null;

  const chromePath = getSystemChromePath();
  console.log(`[WhatsApp] Launching WhatsApp Web client with LocalAuth... Browser: ${chromePath || 'Default Puppeteer'}`);

  try {
    clientInstance = new Client({
      authStrategy: new LocalAuth({
        clientId: SESSION_NAME,
        dataPath: AUTH_DIR
      }),
      webVersionCache: {
        type: 'none'
      },
      authTimeoutMs: 60000,
      puppeteer: {
        headless: true,
        executablePath: chromePath,
        handleSIGINT: false,
        handleSIGTERM: false,
        handleSIGHUP: false,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-default-browser-check',
          '--disable-gpu',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-default-apps',
          '--disable-sync',
          '--disable-translate',
          '--disable-software-rasterizer',
          '--mute-audio',
          '--no-pings',
          '--renderer-process-limit=1',
          '--disable-features=TranslateUI,AudioServiceOutOfProcess,MediaRouter,OptimizationHints,CalculateNativeWinOcclusion',
          '--js-flags=--max-old-space-size=384'
        ]
      }
    });

    clientInstance.on('qr', async (qr) => {
      console.log('[WhatsApp] QR Code received from WhatsApp Web. Generating QR image...');
      currentQRRaw = qr;
      try {
        currentQRDataUrl = await qrcode.toDataURL(qr, { width: 280, margin: 2 });
      } catch (e) {
        console.error('[WhatsApp] Failed to create QR data URL:', e);
      }
      clientStatus = 'QR_READY';
    });

    clientInstance.on('loading_screen', (percent, message) => {
      loadingPercent = Number.isFinite(Number(percent)) ? Number(percent) : null;
      console.log(`[WhatsApp] Loading WhatsApp Web: ${percent}%${message ? ` (${message})` : ''}`);
    });

    clientInstance.on('authenticated', () => {
      console.log('[WhatsApp] WhatsApp authenticated successfully.');
      clientStatus = 'AUTHENTICATED';
      currentQRDataUrl = null;
    });

    clientInstance.on('ready', () => {
      console.log('[WhatsApp] WhatsApp Web client is ready for messaging!');
      clientStatus = 'CONNECTED';
      try {
        authenticatedUser = clientInstance.info?.wid?.user || 'Connected User';
      } catch (e) {
        authenticatedUser = 'Connected User';
      }
    });

    clientInstance.on('auth_failure', (msg) => {
      console.error('[WhatsApp] Authentication failure:', msg);
      clientStatus = 'AUTH_FAILURE';
      currentQRDataUrl = null;
    });

    clientInstance.on('disconnected', (reason) => {
      console.warn('[WhatsApp] Client disconnected:', reason);
      clientStatus = 'DISCONNECTED';
      currentQRDataUrl = null;
      authenticatedUser = null;
      clientInstance = null;
    });

    clientInstance.initialize().catch((err) => {
      console.error('[WhatsApp] Client initialize error:', err.message);
      clientStatus = 'DISCONNECTED';
      clientInstance = null;
    });
  } catch (err) {
    console.error('[WhatsApp] Failed to construct Client:', err.message);
    clientStatus = 'DISCONNECTED';
    clientInstance = null;
  }

  return getStatus();
}

async function sendMessage(normalizedPhone, messageText, mediaFilePath = null) {
  if (clientStatus !== 'CONNECTED' || !clientInstance) {
    return {
      success: false,
      error: 'WhatsApp client is not connected'
    };
  }

  const chatId = `${normalizedPhone}@c.us`;

  try {
    let sentMsg = null;

    if (mediaFilePath && fs.existsSync(mediaFilePath)) {
      const media = MessageMedia.fromFilePath(mediaFilePath);
      sentMsg = await clientInstance.sendMessage(chatId, media, { caption: messageText });
    } else {
      sentMsg = await clientInstance.sendMessage(chatId, messageText);
    }

    return {
      success: true,
      messageId: sentMsg?.id?._serialized || sentMsg?.id?.id || 'delivered'
    };
  } catch (err) {
    console.error(`[WhatsApp] Error dispatching to ${normalizedPhone}:`, err.message);
    return {
      success: false,
      error: err.message
    };
  }
}

async function disconnectClient(cleanSession = false) {
  if (clientInstance) {
    try {
      await clientInstance.destroy();
    } catch (e) {
      console.warn('[WhatsApp] Destroy warning:', e.message);
    }
    clientInstance = null;
  }
  if (cleanSession) {
    cleanSessionFolder();
  }
  clientStatus = 'DISCONNECTED';
  currentQRDataUrl = null;
  authenticatedUser = null;
  return getStatus();
}

module.exports = {
  initializeWhatsApp,
  disconnectClient,
  getStatus,
  sendMessage
};
