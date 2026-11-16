const path = require('path');
const fs = require('fs');
const qrcode = require('qrcode');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const config = require('../config/env');

let clientInstance = null;
let clientStatus = 'DISCONNECTED'; // DISCONNECTED | INITIALIZING | QR_READY | CONNECTED | AUTH_FAILURE
let currentQRDataUrl = null;
let currentQRRaw = null;
let authenticatedUser = null;
let clientInitPromise = null;

const AUTH_DIR = path.join(config.DATA_DIR, '.wwebjs_auth');

function getStatus() {
  return {
    status: clientStatus,
    qrDataUrl: currentQRDataUrl,
    user: authenticatedUser,
    isReady: clientStatus === 'CONNECTED'
  };
}

async function initializeWhatsApp() {
  if (clientInstance && (clientStatus === 'CONNECTED' || clientStatus === 'QR_READY' || clientStatus === 'INITIALIZING')) {
    return getStatus();
  }

  if (clientInitPromise) {
    return clientInitPromise;
  }

  clientInitPromise = new Promise((resolve) => {
    clientStatus = 'INITIALIZING';
    currentQRDataUrl = null;
    currentQRRaw = null;

    console.log('[WhatsApp] Launching WhatsApp Web client with LocalAuth...');

    try {
      clientInstance = new Client({
        authStrategy: new LocalAuth({
          dataPath: AUTH_DIR
        }),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-extensions',
            '--mute-audio',
            '--js-flags=--max-old-space-size=384'
          ]
        }
      });

      clientInstance.on('qr', async (qr) => {
        console.log('[WhatsApp] QR Code received. Generating QR data URL...');
        currentQRRaw = qr;
        try {
          currentQRDataUrl = await qrcode.toDataURL(qr, { width: 280, margin: 2 });
        } catch (e) {
          console.error('[WhatsApp] Failed to create QR data URL:', e);
        }
        clientStatus = 'QR_READY';
        resolve(getStatus());
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
        resolve(getStatus());
      });

      clientInstance.on('auth_failure', (msg) => {
        console.error('[WhatsApp] Authentication failure:', msg);
        clientStatus = 'AUTH_FAILURE';
        currentQRDataUrl = null;
        resolve(getStatus());
      });

      clientInstance.on('disconnected', (reason) => {
        console.warn('[WhatsApp] Client disconnected:', reason);
        clientStatus = 'DISCONNECTED';
        currentQRDataUrl = null;
        authenticatedUser = null;
      });

      clientInstance.initialize().catch((err) => {
        console.error('[WhatsApp] Client initialize error:', err.message);
        clientStatus = 'DISCONNECTED';
        resolve(getStatus());
      });
    } catch (err) {
      console.error('[WhatsApp] Failed to construct Client:', err.message);
      clientStatus = 'DISCONNECTED';
      resolve(getStatus());
    }
  }).finally(() => {
    clientInitPromise = null;
  });

  return clientInitPromise;
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

async function disconnectClient() {
  if (clientInstance) {
    try {
      await clientInstance.destroy();
    } catch (e) {
      console.warn('[WhatsApp] Destroy warning:', e.message);
    }
    clientInstance = null;
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
