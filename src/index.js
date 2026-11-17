const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const config = require('./config/env');
const settings = require('./services/settings');
const googleSheets = require('./services/googleSheets');
const googleAuth = require('./services/googleAuth');
const whatsappClient = require('./services/whatsappClient');
const batchEngine = require('./services/batchEngine');
const ledger = require('./services/ledger');
const { extractTokens, interpolateTemplate } = require('./services/templateParser');

process.on('unhandledRejection', (reason) => {
  console.warn('[Process] Handled unhandled rejection:', reason?.message || reason);
});
process.on('uncaughtException', (err) => {
  console.warn('[Process] Handled uncaught exception:', err?.message || err);
});

const app = express();

app.use(cors());
app.use(express.json({ limit: '25mb' }));

// Serve static frontend UI and design system
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(config.DATA_DIR, 'assets')));
app.use('/design-system', express.static(path.join(__dirname, '../design-system')));

// 1. Status API
app.get('/api/status', (req, res) => {
  const wa = whatsappClient.getStatus();
  const batch = batchEngine.getStatus();
  const userSettings = settings.loadSettings();

  res.json({
    appName: 'SheetApp',
    version: '1.3.6',
    whatsapp: wa,
    batch,
    settings: userSettings
  });
});

// 2. Settings, Saved Templates & Branch APIs
app.get('/api/settings', (req, res) => {
  res.json(settings.loadSettings());
});

app.post('/api/settings', (req, res) => {
  const result = settings.saveActiveTemplateFromControls(req.body);
  res.json({ success: !!result, settings: result.settings, activeTemplate: result.activeTemplate });
});

// Saved Templates APIs (Exactly ONE enabled at a time)
app.get('/api/templates', (req, res) => {
  const result = settings.getTemplates();
  res.json({ success: true, ...result });
});

app.post('/api/templates', (req, res) => {
  try {
    const tpl = settings.addTemplate(req.body);
    res.json({ success: true, template: tpl });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.put('/api/templates/:id', (req, res) => {
  try {
    const tpl = settings.updateTemplate(req.params.id, req.body);
    res.json({ success: true, template: tpl });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/templates/:id/enable', (req, res) => {
  try {
    const tpl = settings.enableTemplate(req.params.id);
    res.json({ success: true, template: tpl, activeTemplate: tpl });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/templates/:id/duplicate', (req, res) => {
  try {
    const tpl = settings.duplicateTemplate(req.params.id);
    res.json({ success: true, template: tpl });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.delete('/api/templates/:id', (req, res) => {
  try {
    const result = settings.deleteTemplate(req.params.id);
    res.json({ success: true, ...(typeof result === 'object' ? result : {}) });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get('/api/branches', (req, res) => {
  res.json(settings.getBranches());
});

app.post('/api/branches', (req, res) => {
  try {
    const branch = settings.addBranch(req.body);
    res.json({ success: true, branch });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.put('/api/branches/:id', (req, res) => {
  try {
    const branch = settings.updateBranch(req.params.id, req.body);
    res.json({ success: true, branch });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.delete('/api/branches/:id', (req, res) => {
  try {
    const success = settings.deleteBranch(req.params.id);
    res.json({ success });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.patch('/api/branches/:id/toggle', (req, res) => {
  try {
    const branch = settings.toggleBranch(req.params.id);
    res.json({ success: true, branch });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Google OAuth 2.0 (Sign in with Google) Endpoints
app.get('/auth/google', (req, res) => {
  try {
    const authUrl = googleAuth.getAuthUrl();
    res.redirect(authUrl);
  } catch (err) {
    res.status(400).send(`
      <html>
        <body style="font-family: sans-serif; background: #0f172a; color: #fff; padding: 40px; text-align: center;">
          <h2 style="color: #f87171;">Google Sign-In Configuration Required</h2>
          <p>${err.message}</p>
          <p style="margin-top: 20px;"><a href="/#settings" style="color: #38bdf8; text-decoration: none; border: 1px solid #38bdf8; padding: 8px 16px; border-radius: 6px; font-weight: 600;">Back to SheetApp Settings</a></p>
        </body>
      </html>
    `);
  }
});

app.get('/auth/google/callback', async (req, res) => {
  const { code, error } = req.query;
  if (error) {
    return res.status(400).send(`Google Login Failed: ${error}`);
  }
  if (!code) {
    return res.status(400).send('Authorization code missing.');
  }

  try {
    const result = await googleAuth.handleCallback(code);
    googleSheets.clearCache();

    if (result.missingSheetsScope) {
      return res.status(403).send(`
        <!DOCTYPE html>
        <html>
          <head><title>Google Sheets Permission Required - SheetApp</title></head>
          <body style="font-family: 'Segoe UI', system-ui, sans-serif; background: #F4F5F7; color: #111827; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
            <div style="background: #FFFFFF; border: 1px solid #FECACA; border-radius: 12px; padding: 32px; max-width: 460px; text-align: center; box-shadow: 0 4px 16px rgba(0,0,0,0.08);">
              <h2 style="margin: 0 0 10px 0; color: #B91C1C; font-size: 18px; font-weight: 700;">Google Sheets Permission Not Checked</h2>
              <p style="font-size: 13px; color: #374151; line-height: 1.5;">You signed in as <strong>${result.email}</strong>, but did not tick the <strong>"See all your Google Spreadsheets"</strong> permission checkbox on the Google consent screen.</p>
              <p style="font-size: 13px; color: #374151; line-height: 1.5; margin-top: 8px;">Please click the button below and ensure <strong>all permission checkboxes are ticked</strong> before continuing.</p>
              <a href="/auth/google" style="display: inline-block; margin-top: 18px; background: #1B365D; color: #FFFFFF; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 600;">Sign in Again &amp; Grant Permission</a>
            </div>
          </body>
        </html>
      `);
    }

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Google Sign-In Successful - SheetApp</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background: #F4F5F7; color: #111827; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 12px; padding: 32px; max-width: 440px; text-align: center; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); }
            .icon { width: 50px; height: 50px; background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; color: #15803D; font-size: 24px; font-weight: 700; margin-bottom: 16px; }
            h2 { margin: 0 0 8px 0; font-size: 18px; color: #111827; font-weight: 700; }
            p { margin: 6px 0; font-size: 13px; color: #4B5563; line-height: 1.5; }
            .email-badge { display: inline-block; background: #F3F4F6; border: 1px solid #D1D5DB; color: #1B365D; font-weight: 600; padding: 4px 12px; border-radius: 6px; margin: 10px 0; font-size: 13px; }
            .btn { display: inline-block; margin-top: 20px; background: #1B365D; color: #FFFFFF; padding: 10px 22px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; transition: background 0.15s; }
            .btn:hover { background: #25477A; }
            .countdown { font-size: 12px; color: #6B7280; margin-top: 14px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">✓</div>
            <h2>Google Account Connected</h2>
            <div><span class="email-badge">${result.email}</span></div>
            <p>Your Google account is now authorized for SheetApp. Returning you to the application.</p>
            <a href="sheetapp://auth-success" class="btn" id="openAppBtn" onclick="returnToApp()">Open SheetApp</a>
            <div class="countdown" id="cd">Switching back to SheetApp automatically...</div>
          </div>
          <script>
            function returnToApp() {
              window.location.href = 'sheetapp://auth-success';
              if (window.opener) {
                try {
                  window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', email: '${result.email}' }, '*');
                  window.opener.location.reload();
                } catch (e) {}
                setTimeout(() => window.close(), 600);
              }
            }
            setTimeout(returnToApp, 1000);
          </script>
        </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send(`Error completing Google Sign-In: ${err.message}`);
  }
});

app.get('/api/auth/google/status', (req, res) => {
  const status = googleAuth.getAuthStatus();
  res.json({ success: true, ...status });
});

app.post('/api/auth/google/signout', (req, res) => {
  try {
    const result = googleAuth.signOut();
    googleSheets.clearCache();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. WhatsApp Management APIs
app.get('/api/whatsapp/status', (req, res) => {
  res.json(whatsappClient.getStatus());
});

app.post('/api/whatsapp/connect', async (req, res) => {
  try {
    const status = await whatsappClient.initializeWhatsApp();
    res.json({ success: true, status });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/whatsapp/disconnect', async (req, res) => {
  try {
    const clean = req.query.clean !== 'false' && req.body?.clean !== false;
    const status = await whatsappClient.disconnectClient(clean);
    res.json({ success: true, status });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Google Sheets & Contacts Ingestion API
app.get('/api/sheets/load', async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === '1';
    const sheetData = await googleSheets.loadSheetData({ forceRefresh });
    res.json({ success: true, ...sheetData });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Campaign Preview & Estimation API
app.post('/api/campaign/preview', async (req, res) => {
  try {
    const { template, phoneColumn, nameColumn } = req.body;
    const currentSettings = settings.loadSettings();
    const sheetData = await googleSheets.loadSheetData({
      phoneColOverride: phoneColumn,
      nameColOverride: nameColumn
    });

    const activeTemplate = template || currentSettings.messageTemplate;
    const tokens = extractTokens(activeTemplate);

    const previews = sheetData.records.slice(0, 5).map(r => ({
      name: r.name,
      phone: r.phoneFormatted || r.rawPhone,
      isValid: r.isValidPhone,
      interpolated: interpolateTemplate(activeTemplate, r.rowData)
    }));

    // Estimate total completion time based on batch size & delays
    const validCount = sheetData.validContactsCount;
    const batchSize = currentSettings.batchSize || 15;
    const avgDelay = ((currentSettings.minDelaySeconds || 12) + (currentSettings.maxDelaySeconds || 22)) / 2;
    const totalBatches = Math.ceil(validCount / batchSize);
    const cooldownTotalSec = (totalBatches - 1) * (currentSettings.cooldownMinutes || 3) * 60;
    const totalPacingSec = validCount * avgDelay;
    const totalDurationMinutes = Math.round((cooldownTotalSec + totalPacingSec) / 60);

    const risk = batchEngine.calculateRiskLevel(currentSettings);

    res.json({
      success: true,
      totalContacts: sheetData.totalRows,
      validContacts: validCount,
      tokensDetected: tokens,
      estimatedMinutes: totalDurationMinutes,
      totalBatches,
      risk,
      samplePreviews: previews
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Campaign Execution APIs
app.post('/api/campaign/start', async (req, res) => {
  try {
    const { template, options } = req.body;
    const sheetData = await googleSheets.loadSheetData();

    const result = await batchEngine.startCampaign({
      records: sheetData.records,
      template,
      options
    });

    res.json({ success: true, campaign: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/campaign/pause', (req, res) => {
  const result = batchEngine.pauseCampaign('Manually paused by user');
  res.json({ success: true, campaign: result });
});

app.post('/api/campaign/resume', (req, res) => {
  const result = batchEngine.resumeCampaign();
  res.json({ success: true, campaign: result });
});

app.post('/api/campaign/abort', (req, res) => {
  const result = batchEngine.abortCampaign();
  res.json({ success: true, campaign: result });
});

app.get('/api/campaign/status', (req, res) => {
  res.json(batchEngine.getStatus());
});

// 7. Ledger & Audit APIs
app.get('/api/ledger', (req, res) => {
  res.json({
    totalToday: ledger.getDailySentCount(),
    logs: ledger.getRecentLogs(100)
  });
});

app.get('/api/ledger/export', (req, res) => {
  const logs = ledger.getRecentLogs(1000);
  const csvHeaders = 'Timestamp,Recipient Name,Phone,Campaign,Status,Error\n';
  const rows = logs.map(l => `"${l.timestamp}","${l.name || ''}","${l.phone || ''}","${l.campaign || ''}","${l.status || ''}","${(l.error || '').replace(/"/g, '""')}"`).join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="sheetapp-delivery-log.csv"');
  res.send(csvHeaders + rows);
});

// 6. Template Attached Image APIs
app.get('/api/template/image', (req, res) => {
  const current = settings.loadSettings();
  res.json({ success: true, image: current.attachedImage || null });
});

app.post('/api/template/image', (req, res) => {
  try {
    const { dataUrl, originalName } = req.body;
    if (!dataUrl) {
      return res.status(400).json({ success: false, error: 'No image data provided' });
    }

    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ success: false, error: 'Invalid dataUrl format' });
    }

    const mime = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    const ext = mime.includes('jpeg') || mime.includes('jpg') ? 'jpg' : (mime.includes('webp') ? 'webp' : 'png');
    const fileName = `flyer_${Date.now()}.${ext}`;
    const fullPath = path.join(config.ASSETS_DIR, fileName);

    fs.writeFileSync(fullPath, buffer);
    console.log(`[Image] Saved new attached image to ${fullPath} (${buffer.length} bytes)`);

    const updated = settings.updateAttachedImage({
      enabled: true,
      fileName,
      originalName: originalName || fileName,
      path: fullPath,
      url: `/assets/${fileName}`
    });

    res.json({ success: true, image: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/template/image/toggle', (req, res) => {
  try {
    const { enabled } = req.body;
    const updated = settings.updateAttachedImage({ enabled: !!enabled });
    res.json({ success: true, image: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/template/image', (req, res) => {
  try {
    const current = settings.loadSettings();
    if (current.attachedImage?.path && fs.existsSync(current.attachedImage.path)) {
      try {
        fs.unlinkSync(current.attachedImage.path);
      } catch (e) {}
    }
    const reset = settings.deleteAttachedImage();
    res.json({ success: true, image: reset });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/whatsapp/send-single', async (req, res) => {
  try {
    const { phone, message, name, includeImage } = req.body;
    const currentSettings = settings.loadSettings();
    const phoneResult = require('./services/phoneNormalizer').sanitizePhoneNumber(phone, currentSettings.defaultCountryCode);
    if (!phoneResult.isValid) {
      return res.status(400).json({ success: false, error: 'Invalid phone number format' });
    }

    let mediaPath = null;
    if (includeImage && currentSettings.attachedImage?.enabled && currentSettings.attachedImage?.path) {
      if (fs.existsSync(currentSettings.attachedImage.path)) {
        mediaPath = currentSettings.attachedImage.path;
      }
    }

    const sendResult = await whatsappClient.sendMessage(phoneResult.normalized, message, mediaPath);
    if (sendResult.success) {
      ledger.recordSent({
        phone: phoneResult.normalized,
        name: name || 'Manual Recipient',
        campaign: 'manual_dispatch',
        status: 'SENT',
        method: mediaPath ? 'whatsapp-web.js (with image)' : 'whatsapp-web.js'
      });
      res.json({ success: true, messageId: sendResult.messageId });
    } else {
      ledger.recordSent({
        phone: phoneResult.normalized,
        name: name || 'Manual Recipient',
        campaign: 'manual_dispatch',
        status: 'FAILED',
        error: sendResult.error
      });
      res.status(500).json({ success: false, error: sendResult.error });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/ledger', (req, res) => {
  ledger.clearAllLogs();
  res.json({ success: true, message: 'Ledger cleared' });
});

// Start Server
let server = null;
function startServer(port = config.PORT) {
  if (server && server.listening) return server;
  server = app.listen(port, () => {
    console.log(`[SheetApp] Server listening on http://localhost:${port}`);
  });
  return server;
}

let backendShutdownPromise = null;
function shutdownBackend() {
  if (backendShutdownPromise) return backendShutdownPromise;
  backendShutdownPromise = (async () => {
    console.log('[SheetApp] Initiating clean backend shutdown...');
    try {
      await whatsappClient.disconnectClient(false);
    } catch (e) {}

    await new Promise((resolve) => {
      if (!server || !server.listening) return resolve();
      const closeTimer = setTimeout(resolve, 1500);
      try {
        if (typeof server.closeAllConnections === 'function') {
          server.closeAllConnections();
        }
        server.close(() => {
          clearTimeout(closeTimer);
          resolve();
        });
      } catch (e) {
        clearTimeout(closeTimer);
        resolve();
      }
    });
  })();
  return backendShutdownPromise;
}

// Start Server automatically when required or executed directly
startServer();

// Graceful termination handling
process.on('SIGINT', () => {
  console.log('\n[SheetApp] Shutting down gracefully...');
  shutdownBackend().finally(() => process.exit(0));
});

module.exports = { app, server, startServer, shutdownBackend };
