const fs = require('fs');
const path = require('path');
const config = require('../config/env');

const SETTINGS_FILE = path.join(config.DATA_DIR, 'settings.json');

function extractSpreadsheetId(input) {
  if (!input) return '';
  const trimmed = String(input).trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return (match && match[1]) ? match[1] : trimmed;
}

const DEFAULT_SETTINGS = {
  // Batch & Pacing Compliance
  batchSize: 15,                // Recipients per batch chunk
  minDelaySeconds: 12,          // Minimum jitter delay between messages
  maxDelaySeconds: 22,          // Maximum jitter delay between messages
  cooldownMinutes: 3,           // Cooldown duration between batches
  dailyLimit: 250,              // Max messages allowed per 24 hours
  defaultCountryCode: '94',     // Default to Sri Lanka (+94)

  // Clean, fresh multi-branch list
  branches: [],

  // Direct Google Sheet ID fallback
  googleSheetId: '',
  googleSheetTab: 'Sheet1',
  googleApiKey: '',
  serviceAccountPath: '',

  // Column Mapping Overrides
  phoneColumn: '',
  nameColumn: '',
  statusColumn: 'WhatsApp Status',

  // Default Template
  messageTemplate: 'Hello {Name}, this is an automated update regarding your record. Please let us know if you need any assistance!\n\nBest regards'
};

function loadSettings() {
  try {
    if (!fs.existsSync(SETTINGS_FILE)) {
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2), 'utf8');
      return { ...DEFAULT_SETTINGS };
    }
    const data = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
    const merged = { ...DEFAULT_SETTINGS, ...data };
    if (!Array.isArray(merged.branches)) {
      merged.branches = [];
    }
    return merged;
  } catch (err) {
    console.warn('[Settings] Error reading settings.json, reverting to defaults:', err.message);
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings(newSettings) {
  try {
    let current = { ...DEFAULT_SETTINGS };
    if (fs.existsSync(SETTINGS_FILE)) {
      try {
        current = { ...DEFAULT_SETTINGS, ...JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')) };
      } catch (e) {}
    }
    const merged = { ...current, ...newSettings };
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(merged, null, 2), 'utf8');
    return merged;
  } catch (err) {
    console.error('[Settings] Error saving settings.json:', err.message);
    return null;
  }
}

function getBranches() {
  const current = loadSettings();
  return current.branches || [];
}

function addBranch(branchData) {
  const current = loadSettings();
  const id = 'branch_' + Date.now();
  const newBranch = {
    id,
    name: (branchData.name || 'New Branch').trim(),
    spreadsheetUrl: (branchData.spreadsheetUrl || '').trim(),
    spreadsheetId: extractSpreadsheetId(branchData.spreadsheetUrl || branchData.spreadsheetId),
    sheetName: (branchData.sheetName || 'Sheet1').trim(),
    enabled: branchData.enabled !== false,
    customTemplate: (branchData.customTemplate || '').trim()
  };

  if (!newBranch.spreadsheetId) {
    throw new Error('Spreadsheet URL or ID is required');
  }

  current.branches.push(newBranch);
  saveSettings({ branches: current.branches });
  return newBranch;
}

function updateBranch(id, branchData) {
  const current = loadSettings();
  const idx = current.branches.findIndex(b => b.id === id);
  if (idx === -1) throw new Error('Branch not found');

  current.branches[idx] = {
    ...current.branches[idx],
    name: branchData.name ? branchData.name.trim() : current.branches[idx].name,
    spreadsheetUrl: branchData.spreadsheetUrl ? branchData.spreadsheetUrl.trim() : current.branches[idx].spreadsheetUrl,
    spreadsheetId: branchData.spreadsheetUrl || branchData.spreadsheetId ? extractSpreadsheetId(branchData.spreadsheetUrl || branchData.spreadsheetId) : current.branches[idx].spreadsheetId,
    sheetName: branchData.sheetName ? branchData.sheetName.trim() : current.branches[idx].sheetName,
    enabled: branchData.enabled !== undefined ? Boolean(branchData.enabled) : current.branches[idx].enabled,
    customTemplate: branchData.customTemplate !== undefined ? branchData.customTemplate.trim() : current.branches[idx].customTemplate
  };

  saveSettings({ branches: current.branches });
  return current.branches[idx];
}

function deleteBranch(id) {
  const current = loadSettings();
  const filtered = current.branches.filter(b => b.id !== id);
  saveSettings({ branches: filtered });
  return true;
}

function toggleBranch(id) {
  const current = loadSettings();
  const branch = current.branches.find(b => b.id === id);
  if (!branch) throw new Error('Branch not found');
  branch.enabled = !branch.enabled;
  saveSettings({ branches: current.branches });
  return branch;
}

module.exports = {
  loadSettings,
  saveSettings,
  getBranches,
  addBranch,
  updateBranch,
  deleteBranch,
  toggleBranch,
  extractSpreadsheetId,
  DEFAULT_SETTINGS
};
