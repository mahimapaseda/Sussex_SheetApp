const fs = require('fs');
const path = require('path');
const config = require('../config/env');

let embeddedSecrets = {};
try {
  embeddedSecrets = require('../config/oauth.secrets');
} catch (e) {}

const SETTINGS_FILE = path.join(config.DATA_DIR, 'settings.json');

function extractSpreadsheetId(input) {
  if (!input) return '';
  const trimmed = String(input).trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return (match && match[1]) ? match[1] : trimmed;
}

const DEFAULT_TEMPLATE_ID = 'tpl_default';

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

  // Google OAuth 2.0 (Sign In with Google)
  googleClientId: process.env.GOOGLE_CLIENT_ID || embeddedSecrets.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || embeddedSecrets.GOOGLE_CLIENT_SECRET || '',
  googleUserEmail: null,
  googleAuthConnected: false,

  // Column Mapping Overrides
  phoneColumn: '',
  nameColumn: '',
  statusColumn: 'WhatsApp Status',

  // Default Template
  messageTemplate: 'Hello {Name}, this is an automated update regarding your record. Please let us know if you need any assistance!\n\nBest regards',

  // Attached Image / Flyer Sharing
  attachedImage: {
    enabled: false,
    fileName: '',
    originalName: '',
    path: '',
    url: ''
  },

  // Saved Templates (Exactly one enabled at a time)
  savedTemplates: [
    {
      id: DEFAULT_TEMPLATE_ID,
      name: 'Default Broadcast',
      messageTemplate: 'Hello {Name}, this is an automated update regarding your record. Please let us know if you need any assistance!\n\nBest regards',
      attachedImage: {
        enabled: false,
        fileName: '',
        originalName: '',
        path: '',
        url: ''
      },
      batchSize: 15,
      minDelaySeconds: 12,
      maxDelaySeconds: 22,
      cooldownMinutes: 3,
      enabled: true,
      updatedAt: new Date().toISOString()
    }
  ],
  activeTemplateId: DEFAULT_TEMPLATE_ID
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

    // Ensure savedTemplates array exists and has at least one template
    if (!Array.isArray(merged.savedTemplates) || merged.savedTemplates.length === 0) {
      merged.savedTemplates = [
        {
          id: DEFAULT_TEMPLATE_ID,
          name: 'Default Broadcast',
          messageTemplate: merged.messageTemplate || DEFAULT_SETTINGS.messageTemplate,
          attachedImage: merged.attachedImage || { ...DEFAULT_SETTINGS.attachedImage },
          batchSize: merged.batchSize || DEFAULT_SETTINGS.batchSize,
          minDelaySeconds: merged.minDelaySeconds || DEFAULT_SETTINGS.minDelaySeconds,
          maxDelaySeconds: merged.maxDelaySeconds || DEFAULT_SETTINGS.maxDelaySeconds,
          cooldownMinutes: merged.cooldownMinutes || DEFAULT_SETTINGS.cooldownMinutes,
          enabled: true,
          updatedAt: new Date().toISOString()
        }
      ];
      merged.activeTemplateId = DEFAULT_TEMPLATE_ID;
    }

    // Ensure exactly ONE template is enabled
    let enabledIndex = merged.savedTemplates.findIndex(t => t.enabled);
    if (enabledIndex === -1) {
      merged.savedTemplates[0].enabled = true;
      enabledIndex = 0;
    }
    merged.savedTemplates.forEach((t, i) => {
      t.enabled = (i === enabledIndex);
    });
    merged.activeTemplateId = merged.savedTemplates[enabledIndex].id;

    if (!merged.googleClientId && (embeddedSecrets.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID)) {
      merged.googleClientId = process.env.GOOGLE_CLIENT_ID || embeddedSecrets.GOOGLE_CLIENT_ID || '';
    }
    if (!merged.googleClientSecret && (embeddedSecrets.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET)) {
      merged.googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || embeddedSecrets.GOOGLE_CLIENT_SECRET || '';
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

function updateAttachedImage(imageData) {
  const current = loadSettings();
  const updated = {
    ...DEFAULT_SETTINGS.attachedImage,
    ...(current.attachedImage || {}),
    ...imageData
  };
  saveSettings({ attachedImage: updated });

  // Sync to currently enabled template as well
  const active = current.savedTemplates.find(t => t.enabled);
  if (active) {
    active.attachedImage = { ...updated };
    saveSettings({ savedTemplates: current.savedTemplates });
  }

  return updated;
}

function deleteAttachedImage() {
  const resetImage = { ...DEFAULT_SETTINGS.attachedImage };
  saveSettings({ attachedImage: resetImage });

  // Sync to currently enabled template as well
  const current = loadSettings();
  const active = current.savedTemplates.find(t => t.enabled);
  if (active) {
    active.attachedImage = { ...resetImage };
    saveSettings({ savedTemplates: current.savedTemplates });
  }

  return resetImage;
}

// ─── Saved Templates Management (Only ONE can be enabled at a time) ────────

function getTemplates() {
  const current = loadSettings();
  return {
    templates: current.savedTemplates || [],
    activeTemplateId: current.activeTemplateId || (current.savedTemplates?.[0]?.id || '')
  };
}

function enableTemplate(id) {
  const current = loadSettings();
  const target = current.savedTemplates.find(t => t.id === id);
  if (!target) throw new Error('Template not found');

  current.savedTemplates.forEach(t => {
    t.enabled = (t.id === id);
  });
  current.activeTemplateId = id;

  // Sync active template values directly to current runtime settings
  current.messageTemplate = target.messageTemplate;
  current.batchSize = target.batchSize;
  current.minDelaySeconds = target.minDelaySeconds;
  current.maxDelaySeconds = target.maxDelaySeconds;
  current.cooldownMinutes = target.cooldownMinutes;
  if (target.attachedImage) {
    current.attachedImage = { ...target.attachedImage };
  }

  saveSettings(current);
  return target;
}

function saveActiveTemplateFromControls(controlsData) {
  const current = loadSettings();
  let active = current.savedTemplates.find(t => t.enabled);
  if (!active) {
    active = current.savedTemplates[0];
    if (active) active.enabled = true;
  }

  if (active) {
    if (controlsData.messageTemplate !== undefined) active.messageTemplate = controlsData.messageTemplate;
    if (controlsData.batchSize !== undefined) active.batchSize = parseInt(controlsData.batchSize, 10);
    if (controlsData.minDelaySeconds !== undefined) active.minDelaySeconds = parseInt(controlsData.minDelaySeconds, 10);
    if (controlsData.maxDelaySeconds !== undefined) active.maxDelaySeconds = parseInt(controlsData.maxDelaySeconds, 10);
    if (controlsData.cooldownMinutes !== undefined) active.cooldownMinutes = parseInt(controlsData.cooldownMinutes, 10);
    if (controlsData.attachedImage !== undefined) active.attachedImage = controlsData.attachedImage;
    active.updatedAt = new Date().toISOString();
  }

  // Also update root settings
  const merged = saveSettings({
    ...controlsData,
    savedTemplates: current.savedTemplates,
    activeTemplateId: active ? active.id : current.activeTemplateId
  });
  return { settings: merged, activeTemplate: active };
}

function addTemplate(templateData) {
  const current = loadSettings();
  const id = 'tpl_' + Date.now();
  const newTemplate = {
    id,
    name: (templateData.name || 'New Template').trim(),
    messageTemplate: templateData.messageTemplate !== undefined ? templateData.messageTemplate : current.messageTemplate,
    attachedImage: templateData.attachedImage ? { ...templateData.attachedImage } : (current.attachedImage ? { ...current.attachedImage } : { ...DEFAULT_SETTINGS.attachedImage }),
    batchSize: templateData.batchSize || current.batchSize || 15,
    minDelaySeconds: templateData.minDelaySeconds || current.minDelaySeconds || 12,
    maxDelaySeconds: templateData.maxDelaySeconds || current.maxDelaySeconds || 22,
    cooldownMinutes: templateData.cooldownMinutes || current.cooldownMinutes || 3,
    enabled: Boolean(templateData.enabled),
    updatedAt: new Date().toISOString()
  };

  if (newTemplate.enabled) {
    current.savedTemplates.forEach(t => { t.enabled = false; });
    current.activeTemplateId = id;
    current.messageTemplate = newTemplate.messageTemplate;
    current.batchSize = newTemplate.batchSize;
    current.minDelaySeconds = newTemplate.minDelaySeconds;
    current.maxDelaySeconds = newTemplate.maxDelaySeconds;
    current.cooldownMinutes = newTemplate.cooldownMinutes;
    current.attachedImage = { ...newTemplate.attachedImage };
  }

  current.savedTemplates.push(newTemplate);
  saveSettings(current);
  return newTemplate;
}

function updateTemplate(id, templateData) {
  const current = loadSettings();
  const idx = current.savedTemplates.findIndex(t => t.id === id);
  if (idx === -1) throw new Error('Template not found');

  const existing = current.savedTemplates[idx];
  current.savedTemplates[idx] = {
    ...existing,
    name: templateData.name !== undefined ? templateData.name.trim() : existing.name,
    messageTemplate: templateData.messageTemplate !== undefined ? templateData.messageTemplate : existing.messageTemplate,
    attachedImage: templateData.attachedImage !== undefined ? { ...templateData.attachedImage } : existing.attachedImage,
    batchSize: templateData.batchSize !== undefined ? parseInt(templateData.batchSize, 10) : existing.batchSize,
    minDelaySeconds: templateData.minDelaySeconds !== undefined ? parseInt(templateData.minDelaySeconds, 10) : existing.minDelaySeconds,
    maxDelaySeconds: templateData.maxDelaySeconds !== undefined ? parseInt(templateData.maxDelaySeconds, 10) : existing.maxDelaySeconds,
    cooldownMinutes: templateData.cooldownMinutes !== undefined ? parseInt(templateData.cooldownMinutes, 10) : existing.cooldownMinutes,
    updatedAt: new Date().toISOString()
  };

  // If this template is active, also sync root settings
  if (existing.enabled) {
    current.messageTemplate = current.savedTemplates[idx].messageTemplate;
    current.batchSize = current.savedTemplates[idx].batchSize;
    current.minDelaySeconds = current.savedTemplates[idx].minDelaySeconds;
    current.maxDelaySeconds = current.savedTemplates[idx].maxDelaySeconds;
    current.cooldownMinutes = current.savedTemplates[idx].cooldownMinutes;
    current.attachedImage = { ...current.savedTemplates[idx].attachedImage };
  }

  saveSettings(current);
  return current.savedTemplates[idx];
}

function duplicateTemplate(id) {
  const current = loadSettings();
  const src = current.savedTemplates.find(t => t.id === id);
  if (!src) throw new Error('Template not found');

  const newId = 'tpl_' + Date.now();
  const copy = {
    ...src,
    id: newId,
    name: `${src.name} (Copy)`,
    enabled: false, // only one enabled at a time
    updatedAt: new Date().toISOString()
  };

  current.savedTemplates.push(copy);
  saveSettings(current);
  return copy;
}

function deleteTemplate(id) {
  const current = loadSettings();
  if (current.savedTemplates.length <= 1) {
    throw new Error('Cannot delete the only template.');
  }

  const target = current.savedTemplates.find(t => t.id === id);
  if (!target) throw new Error('Template not found');

  const wasEnabled = target.enabled;
  current.savedTemplates = current.savedTemplates.filter(t => t.id !== id);

  if (wasEnabled) {
    // Enable the first remaining template
    current.savedTemplates[0].enabled = true;
    current.activeTemplateId = current.savedTemplates[0].id;
    current.messageTemplate = current.savedTemplates[0].messageTemplate;
    current.batchSize = current.savedTemplates[0].batchSize;
    current.minDelaySeconds = current.savedTemplates[0].minDelaySeconds;
    current.maxDelaySeconds = current.savedTemplates[0].maxDelaySeconds;
    current.cooldownMinutes = current.savedTemplates[0].cooldownMinutes;
    current.attachedImage = { ...current.savedTemplates[0].attachedImage };
  }

  saveSettings(current);
  return true;
}

module.exports = {
  loadSettings,
  saveSettings,
  updateSettings: saveSettings,
  getBranches,
  addBranch,
  updateBranch,
  deleteBranch,
  toggleBranch,
  updateAttachedImage,
  deleteAttachedImage,
  extractSpreadsheetId,
  getTemplates,
  enableTemplate,
  saveActiveTemplateFromControls,
  addTemplate,
  updateTemplate,
  duplicateTemplate,
  deleteTemplate,
  DEFAULT_SETTINGS
};
