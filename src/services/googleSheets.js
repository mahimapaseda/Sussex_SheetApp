const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { google } = require('googleapis');
const config = require('../config/env');
const settings = require('./settings');
const { sanitizePhoneNumber } = require('./phoneNormalizer');

// In-memory cache for recent sheet data
let cachedData = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 15000;

function normalizeHeader(str) {
  return String(str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Heuristically detect phone, name, and status column indices from headers
 */
function identifyColumns(headers = []) {
  const normHeaders = headers.map(h => normalizeHeader(h));

  const phoneKeywords = ['phone', 'mobile', 'whatsapp', 'contact', 'tel', 'tp', 'fathertp', 'mothertp', 'parenttp', 'phoneno', 'contactno'];
  const nameKeywords = ['fullname', 'studentname', 'name', 'client', 'customer', 'childname', 'student', 'nameofstudent', 'nameofchild'];
  const statusKeywords = ['whatsappstatus', 'status', 'dispatchstatus', 'sentstatus'];
  const branchKeywords = ['branch', 'school', 'location', 'campus'];

  let phoneCol = null;
  let nameCol = null;
  let statusCol = null;
  let branchCol = null;

  for (let i = 0; i < normHeaders.length; i++) {
    const h = normHeaders[i];
    if (!phoneCol && phoneKeywords.some(k => h.includes(k))) phoneCol = headers[i];
    if (!nameCol && nameKeywords.some(k => h.includes(k))) nameCol = headers[i];
    if (!statusCol && statusKeywords.some(k => h.includes(k))) statusCol = headers[i];
    if (!branchCol && branchKeywords.some(k => h.includes(k))) branchCol = headers[i];
  }

  // Fallbacks if no match
  if (!phoneCol && headers.length > 1) phoneCol = headers[1];
  if (!nameCol && headers.length > 0) nameCol = headers[0];

  return {
    phoneColumn: phoneCol || '',
    nameColumn: nameCol || '',
    statusColumn: statusCol || 'WhatsApp Status',
    branchColumn: branchCol || 'Branch'
  };
}

/**
 * Fetch rows from CSV file or multi-branch Google Sheets
 */
async function loadSheetData(options = {}) {
  const currentSettings = settings.loadSettings();
  const branches = settings.getBranches();
  const enabledBranches = branches.filter(b => b.enabled);

  const {
    sourceType = 'auto',
    forceRefresh = false,
    phoneColOverride = currentSettings.phoneColumn,
    nameColOverride = currentSettings.nameColumn
  } = options;

  if (!forceRefresh && cachedData && (Date.now() - lastFetchTime < CACHE_TTL_MS)) {
    return cachedData;
  }

  let rawRows = [];
  let headers = [];
  let source = 'none';
  let branchReports = [];

  // Fresh software state: if no branches or sheets are configured, return empty state
  if (enabledBranches.length === 0 && !currentSettings.googleSheetId && sourceType !== 'sample') {
    cachedData = {
      source: 'none',
      headers: [],
      totalRows: 0,
      validContactsCount: 0,
      totalBranches: 0,
      connectedBranches: 0,
      branchesReport: [],
      columns: {
        phoneColumn: '',
        nameColumn: '',
        statusColumn: 'WhatsApp Status'
      },
      detectedColumns: {
        phoneColumn: '',
        nameColumn: '',
        statusColumn: 'WhatsApp Status',
        branchColumn: 'Branch'
      },
      records: [],
      preview: [],
      timestamp: new Date().toISOString()
    };
    lastFetchTime = Date.now();
    return cachedData;
  }

  // Check if credentials and Google branches are configured
  const hasServiceAccount = currentSettings.serviceAccountPath && fs.existsSync(currentSettings.serviceAccountPath);
  const hasApiKey = Boolean(currentSettings.googleApiKey);
  const canFetchGoogle = (hasServiceAccount || hasApiKey) && enabledBranches.length > 0;

  if (sourceType === 'google' || (sourceType === 'auto' && canFetchGoogle)) {
    try {
      const gResult = await fetchMultiBranchGoogleSheets(enabledBranches, currentSettings);
      headers = gResult.headers;
      rawRows = gResult.rows;
      source = 'google_sheets';
      branchReports = gResult.branchReports;
    } catch (err) {
      console.warn('[Sheets] Google fetch failed:', err.message);
      return {
        source: 'error',
        error: err.message,
        headers: [],
        totalRows: 0,
        validContactsCount: 0,
        totalBranches: branches.length,
        connectedBranches: enabledBranches.length,
        branchesReport: [],
        columns: { phoneColumn: '', nameColumn: '', statusColumn: '' },
        detectedColumns: {},
        records: [],
        preview: []
      };
    }
  } else if (sourceType === 'sample') {
    const csvResult = loadFromLocalSample(branches);
    headers = csvResult.headers;
    rawRows = csvResult.rows;
    source = 'sample_csv';
    branchReports = csvResult.branchReports;
  }

  const autoColumns = identifyColumns(headers);
  const activePhoneCol = phoneColOverride || autoColumns.phoneColumn;
  const activeNameCol = nameColOverride || autoColumns.nameColumn;
  const activeStatusCol = autoColumns.statusColumn;

  // Process rows
  const records = [];
  for (let idx = 0; idx < rawRows.length; idx++) {
    const row = rawRows[idx];
    const rawPhone = row[activePhoneCol] || '';
    const name = row[activeNameCol] || `Recipient ${idx + 1}`;
    const statusVal = row[activeStatusCol] || '';
    const branchVal = row['Branch'] || row['branch'] || 'Sussex College Network';
    const branchIdVal = row['branchId'] || null;

    const phoneSanitized = sanitizePhoneNumber(rawPhone, currentSettings.defaultCountryCode);

    records.push({
      rowIndex: idx + 1,
      name,
      rawPhone,
      normalizedPhone: phoneSanitized.normalized,
      isValidPhone: phoneSanitized.isValid,
      phoneFormatted: phoneSanitized.formatted,
      branch: branchVal,
      branchId: branchIdVal,
      status: statusVal,
      rowData: row
    });
  }

  // Update counts in branchReports
  branchReports.forEach(br => {
    br.count = records.filter(r => {
      if (r.branchId === br.id) return true;
      if (!r.branch) return false;
      const bKey = br.name.toLowerCase().split(' ')[0];
      return r.branch.toLowerCase().includes(bKey);
    }).length;
  });

  cachedData = {
    source,
    headers,
    totalRows: records.length,
    validContactsCount: records.filter(r => r.isValidPhone).length,
    totalBranches: branches.length,
    connectedBranches: enabledBranches.length,
    branchesReport: branchReports,
    columns: {
      phoneColumn: activePhoneCol,
      nameColumn: activeNameCol,
      statusColumn: activeStatusCol
    },
    detectedColumns: autoColumns,
    records,
    preview: records.slice(0, 10),
    timestamp: new Date().toISOString()
  };

  lastFetchTime = Date.now();
  return cachedData;
}

/**
 * Load default sample CSV from data/sample_contacts.csv with branch metadata
 */
function loadFromLocalSample(branches = []) {
  const samplePath = path.join(config.DATA_DIR, 'sample_contacts.csv');
  if (!fs.existsSync(samplePath)) {
    createDefaultSampleCSV(samplePath);
  }
  const content = fs.readFileSync(samplePath, 'utf8');
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });
  const headers = records.length > 0 ? Object.keys(records[0]) : [];

  // Map each record to branch ID if matching
  records.forEach(r => {
    const branchName = r.Branch || '';
    const matchedBranch = branches.find(b => b.name.toLowerCase().includes(branchName.toLowerCase()));
    if (matchedBranch) {
      r.branchId = matchedBranch.id;
    }
  });

  const branchReports = branches.map(b => ({
    id: b.id,
    name: b.name,
    sheetName: b.sheetName,
    enabled: b.enabled,
    count: 0
  }));

  return { headers, rows: records, branchReports };
}

function createDefaultSampleCSV(filePath) {
  const defaultCSV = `Name,Mobile,Branch,Topic,Balance
Kavindu Perera,0771234567,Ambalangoda,Term Fee Update,LKR 4500
Dinithi Silva,+94 71 234 5678,Galle,Parent Teacher Meeting,LKR 0
Nuwan Fernando,076-987-6543,Ampara,Exam Schedule,LKR 1200
Chamari Jayasinghe,785551234,Ambalangoda,Extracurricular Sports,LKR 2000
Sandun Wickrama,0723344556,Galle,Library Book Reminder,LKR 350
Achala Madushanka,0778899001,Ampara,Science Exhibition,LKR 0
Thisara Samarasinghe,0714455667,Ambalangoda,Term Fee Update,LKR 8000
Pradeep Kumara,0751122334,Galle,Annual Sports Meet,LKR 1500
`;
  fs.writeFileSync(filePath, defaultCSV, 'utf8');
}

/**
 * Fetch from multiple Google Sheets branches
 */
async function fetchMultiBranchGoogleSheets(branches, settingsObj) {
  const sheets = google.sheets('v4');
  let authClient = null;

  if (settingsObj.serviceAccountPath && fs.existsSync(settingsObj.serviceAccountPath)) {
    const auth = new google.auth.GoogleAuth({
      keyFile: settingsObj.serviceAccountPath,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });
    authClient = await auth.getClient();
  }

  let aggregatedHeaders = [];
  const aggregatedRows = [];
  const branchReports = [];

  for (const branch of branches) {
    try {
      const sheetId = branch.spreadsheetId;
      const sheetTab = branch.sheetName || 'Sheet1';
      const range = `${sheetTab}!A1:Z500`;

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range,
        key: settingsObj.googleApiKey || undefined,
        auth: authClient || undefined
      });

      const values = response.data.values || [];
      if (values.length > 0) {
        const branchHeaders = values[0].map(h => String(h || '').trim());
        if (aggregatedHeaders.length === 0) {
          aggregatedHeaders = branchHeaders;
        }

        const rows = values.slice(1).map(row => {
          const obj = { Branch: branch.name, branchId: branch.id };
          branchHeaders.forEach((h, i) => {
            obj[h] = row[i] !== undefined ? String(row[i]).trim() : '';
          });
          return obj;
        });

        aggregatedRows.push(...rows);

        branchReports.push({
          id: branch.id,
          name: branch.name,
          sheetName: branch.sheetName,
          enabled: true,
          count: rows.length
        });
      }
    } catch (branchErr) {
      console.warn(`[Sheets] Failed to fetch branch "${branch.name}":`, branchErr.message);
      branchReports.push({
        id: branch.id,
        name: branch.name,
        sheetName: branch.sheetName,
        enabled: true,
        error: branchErr.message,
        count: 0
      });
    }
  }

  return { headers: aggregatedHeaders, rows: aggregatedRows, branchReports };
}

module.exports = {
  loadSheetData,
  identifyColumns,
  loadFromLocalSample
};
