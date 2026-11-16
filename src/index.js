const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config/env');
const settings = require('./services/settings');
const googleSheets = require('./services/googleSheets');
const whatsappClient = require('./services/whatsappClient');
const batchEngine = require('./services/batchEngine');
const ledger = require('./services/ledger');
const { extractTokens, interpolateTemplate } = require('./services/templateParser');

const app = express();

app.use(cors());
app.use(express.json());

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
    version: '1.0.0',
    whatsapp: wa,
    batch,
    settings: userSettings
  });
});

// 2. Settings & Branch APIs
app.get('/api/settings', (req, res) => {
  res.json(settings.loadSettings());
});

app.post('/api/settings', (req, res) => {
  const updated = settings.saveSettings(req.body);
  res.json({ success: !!updated, settings: updated });
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

app.post('/api/whatsapp/send-single', async (req, res) => {
  try {
    const { phone, message, name } = req.body;
    const currentSettings = settings.loadSettings();
    const phoneResult = require('./services/phoneNormalizer').sanitizePhoneNumber(phone, currentSettings.defaultCountryCode);
    if (!phoneResult.isValid) {
      return res.status(400).json({ success: false, error: 'Invalid phone number format' });
    }
    const sendResult = await whatsappClient.sendMessage(phoneResult.normalized, message);
    if (sendResult.success) {
      ledger.recordSent({
        phone: phoneResult.normalized,
        name: name || 'Manual Recipient',
        campaign: 'manual_dispatch',
        status: 'SENT'
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
if (require.main === module) {
  server = app.listen(config.PORT, () => {
    console.log(`[SheetApp] Server listening on http://localhost:${config.PORT}`);
  });
}

module.exports = { app, server };
