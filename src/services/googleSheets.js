const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { google } = require('googleapis');
const xlsx = require('xlsx');
const config = require('../config/env');
const settings = require('./settings');
const googleAuth = require('./googleAuth');
const { sanitizePhoneNumber } = require('./phoneNormalizer');

// In-memory cache for recent sheet data
let cachedData = null;
let lastFetchTime = 0;
let uploadedFileCache = null;
const CACHE_TTL_MS = 15000;

function clearCache() {
  cachedData = null;
  lastFetchTime = 0;
}

function setUploadedFileData(fileData) {
  uploadedFileCache = fileData;
  clearCache();
}

function clearUploadedFileData() {
  uploadedFileCache = null;
  clearCache();
}

function normalizeHeader(str) {
  return String(str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Intelligent Multi-Row Header Scanner
 * Detects the table header row even when sheets contain banner titles, inquiry metadata, or sub-headers
 */
function findHeaderRowIndex(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return 0;
  const maxScan = Math.min(rows.length, 15);
  let bestRowIdx = 0;
  let bestScore = -1;

  const phoneKeywords = ['contactno', 'contact', 'phoneno', 'phone', 'mobile', 'mobileno', 'whatsapp', 'tel', 'tp', 'telephone', 'fathertp', 'mothertp', 'parenttp'];
  const nameKeywords = ['nameofstudent', 'studentname', 'fullname', 'name', 'childname', 'student', 'applicant', 'parentname', 'client', 'customer'];
  const branchKeywords = ['source', 'branch', 'school', 'location', 'campus'];

  for (let r = 0; r < maxScan; r++) {
    const row = rows[r] || [];
    let hasName = false;
    let hasPhone = false;
    let hasBranch = false;
    let recognizedCount = 0;
    let dataLooksCount = 0;

    row.forEach(cell => {
      const s = String(cell || '').trim();
      if (!s) return;
      const norm = normalizeHeader(s);

      // Check if cell looks like pure data (e.g. 9-10 digit number or date like 21/04/2026)
      const digitsOnly = s.replace(/\D/g, '');
      if (digitsOnly.length >= 8 && digitsOnly.length <= 12) {
        dataLooksCount++;
      }
      if (/^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}$/.test(s)) {
        dataLooksCount++;
      }

      if (nameKeywords.some(k => norm === k || norm.includes(k))) {
        hasName = true;
        recognizedCount++;
      }
      if (phoneKeywords.some(k => norm === k || norm.includes(k))) {
        hasPhone = true;
        recognizedCount++;
      }
      if (branchKeywords.some(k => norm === k || norm.includes(k))) {
        hasBranch = true;
        recognizedCount++;
      }
    });

    let score = (hasName ? 15 : 0) + (hasPhone ? 15 : 0) + (hasBranch ? 5 : 0) + recognizedCount * 3;
    score -= dataLooksCount * 6;

    if (hasName && hasPhone) {
      score += 30; // High confidence header row
    }

    if (score > bestScore && score > 0) {
      bestScore = score;
      bestRowIdx = r;
    }
  }

  return bestRowIdx;
}

/**
 * Parses raw grid rows into structured objects with unique headers
 */
function parseSheetGrid(values, branchName = 'Sussex College Network', branchId = null) {
  if (!Array.isArray(values) || values.length === 0) {
    return { headers: [], rows: [] };
  }

  const headerRowIdx = findHeaderRowIndex(values);
  const rawHeaders = values[headerRowIdx] || [];

  const headers = [];
  const headerCountMap = {};

  for (let c = 0; c < rawHeaders.length; c++) {
    let h = String(rawHeaders[c] || '').trim();
    if (!h) {
      h = `Column_${c + 1}`;
    }
    if (headerCountMap[h]) {
      headerCountMap[h]++;
      h = `${h}_${headerCountMap[h]}`;
    } else {
      headerCountMap[h] = 1;
    }
    headers.push(h);
  }

  const rows = [];
  for (let r = headerRowIdx + 1; r < values.length; r++) {
    const row = values[r];
    if (!row || !row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '')) {
      continue; // Skip blank rows
    }

    const obj = { Branch: branchName };
    if (branchId) obj.branchId = branchId;

    headers.forEach((h, i) => {
      let val = row[i];
      if (val === null || val === undefined) {
        val = '';
      } else {
        val = String(val).trim();
      }
      obj[h] = val;
    });

    rows.push(obj);
  }

  return { headers, rows };
}

/**
 * Heuristically detect phone, name, and status column indices from headers
 */
function identifyColumns(headers = []) {
  const normHeaders = headers.map(h => normalizeHeader(h));

  const phoneKeywords = ['contactno', 'contact', 'phoneno', 'phone', 'mobile', 'mobileno', 'whatsapp', 'tel', 'tp', 'fathertp', 'mothertp', 'parenttp', 'telephone'];
  const nameKeywords = ['nameofstudent', 'studentname', 'fullname', 'name', 'childname', 'student', 'applicant', 'parentname', 'client', 'customer'];
  const statusKeywords = ['whatsappstatus', 'status', 'dispatchstatus', 'sentstatus'];
  const branchKeywords = ['source', 'branch', 'school', 'location', 'campus'];

  let phoneCol = null;
  let nameCol = null;
  let statusCol = null;
  let branchCol = null;

  // 1. First pass: exact keyword matches
  for (let i = 0; i < normHeaders.length; i++) {
    const h = normHeaders[i];
    if (!h) continue;
    if (!nameCol && nameKeywords.includes(h)) nameCol = headers[i];
    if (!phoneCol && phoneKeywords.includes(h)) phoneCol = headers[i];
    if (!statusCol && statusKeywords.includes(h)) statusCol = headers[i];
    if (!branchCol && branchKeywords.includes(h)) branchCol = headers[i];
  }

  // 2. Second pass: substring matches
  for (let i = 0; i < normHeaders.length; i++) {
    const h = normHeaders[i];
    if (!h) continue;
    if (!nameCol && nameKeywords.some(k => h.includes(k))) nameCol = headers[i];
    if (!phoneCol && phoneKeywords.some(k => h.includes(k))) phoneCol = headers[i];
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
 * Parses an Excel (.xlsx / .xls) buffer into contact rows
 */
function loadFromExcelBuffer(buffer, fileName = 'Spreadsheet.xlsx', branchName = 'Imported Contacts') {
  const wb = xlsx.read(buffer, { type: 'buffer' });
  const sheetNames = wb.SheetNames || [];
  if (sheetNames.length === 0) {
    throw new Error('Spreadsheet contains no sheets or readable data.');
  }

  // Find best sheet: prefer tab containing 'inquiry' or first sheet
  let selectedSheetName = sheetNames[0];
  const inquirySheet = sheetNames.find(s => normalizeHeader(s).includes('inquiry'));
  if (inquirySheet) {
    selectedSheetName = inquirySheet;
  }

  const sheet = wb.Sheets[selectedSheetName];
  const values = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const parsed = parseSheetGrid(values, branchName, 'local_upload');

  return {
    headers: parsed.headers,
    rows: parsed.rows,
    sheetName: selectedSheetName,
    branchReports: [{
      id: 'local_upload',
      name: branchName,
      sheetName: selectedSheetName,
      enabled: true,
      count: parsed.rows.length
    }]
  };
}

/**
 * Fetch rows from CSV file, uploaded spreadsheet, or multi-branch Google Sheets
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

  // Check if an uploaded local spreadsheet is active
  if (uploadedFileCache) {
    headers = uploadedFileCache.headers;
    rawRows = uploadedFileCache.rows;
    source = 'uploaded_file';
    branchReports = uploadedFileCache.branchReports;
  }
  // Fresh software state: if no branches or sheets are configured, return empty state
  else if (enabledBranches.length === 0 && !currentSettings.googleSheetId && sourceType !== 'sample') {
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
  } else {
    // Check if credentials and Google branches are configured
    const oauthStatus = googleAuth.getAuthStatus();
    const hasServiceAccount = currentSettings.serviceAccountPath && fs.existsSync(currentSettings.serviceAccountPath);
    const hasApiKey = Boolean(currentSettings.googleApiKey);
    const hasGoogleOAuth = Boolean(oauthStatus.signedIn && oauthStatus.hasSheetsScope);

    let effectiveBranches = [...enabledBranches];
    if (effectiveBranches.length === 0 && currentSettings.googleSheetId) {
      effectiveBranches.push({
        id: 'default_sheet',
        name: 'Primary Sheet',
        spreadsheetId: settings.extractSpreadsheetId(currentSettings.googleSheetId),
        sheetName: currentSettings.googleSheetTab || 'Sheet1',
        enabled: true
      });
    }

    const canFetchGoogle = (hasGoogleOAuth || hasServiceAccount || hasApiKey) && effectiveBranches.length > 0;

    if (sourceType === 'google' || (sourceType === 'auto' && canFetchGoogle)) {
      try {
        const gResult = await fetchMultiBranchGoogleSheets(effectiveBranches, currentSettings);
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
  }

  const autoColumns = identifyColumns(headers);
  const activePhoneCol = phoneColOverride || autoColumns.phoneColumn;
  const activeNameCol = nameColOverride || autoColumns.nameColumn;
  const activeStatusCol = autoColumns.statusColumn;

  // Process rows
  const records = [];
  for (let idx = 0; idx < rawRows.length; idx++) {
    const row = rawRows[idx];
    const rawPhone = row[activePhoneCol] !== undefined ? String(row[activePhoneCol]).trim() : '';
    const name = row[activeNameCol] !== undefined && String(row[activeNameCol]).trim() !== ''
      ? String(row[activeNameCol]).trim()
      : `Recipient ${idx + 1}`;
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
 * Fetch from multiple Google Sheets branches with smart tab resolution and multi-row headers
 */
async function fetchMultiBranchGoogleSheets(branches, settingsObj) {
  const sheets = google.sheets('v4');
  let authClient = null;

  const oauthSheets = googleAuth.getAuthenticatedSheetsClient();
  const oauthStatus = googleAuth.getAuthStatus();

  if (oauthSheets && oauthStatus.signedIn) {
    authClient = googleAuth.getOAuth2Client();
  } else if (settingsObj.serviceAccountPath && fs.existsSync(settingsObj.serviceAccountPath)) {
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
      const requestedSheet = branch.sheetName || 'Sheet1';

      // 1. Fetch metadata to resolve the exact sheet tab name dynamically (handles slashes/spaces like INQUIRY DETAILS 2026/27)
      let matchedTabName = requestedSheet;
      try {
        const meta = await sheets.spreadsheets.get({
          spreadsheetId: sheetId,
          key: settingsObj.googleApiKey || undefined,
          auth: authClient || undefined
        });
        const sheetTabs = meta.data.sheets || [];
        const normRequested = normalizeHeader(requestedSheet);
        const found = sheetTabs.find(s => normalizeHeader(s.properties?.title) === normRequested)
          || sheetTabs.find(s => normalizeHeader(s.properties?.title).includes(normRequested))
          || sheetTabs.find(s => normalizeHeader(s.properties?.title).includes('inquiry'))
          || sheetTabs[0];
        if (found && found.properties?.title) {
          matchedTabName = found.properties.title;
        }
      } catch (metaErr) {
        // Fall back to requestedSheet if metadata fetch fails
      }

      // Fetch whole tab without truncation
      const escapedTitle = matchedTabName.replace(/'/g, "''");
      const range = `'${escapedTitle}'`;

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range,
        key: settingsObj.googleApiKey || undefined,
        auth: authClient || undefined
      });

      const values = response.data.values || [];
      if (values.length > 0) {
        const parsed = parseSheetGrid(values, branch.name, branch.id);
        if (aggregatedHeaders.length === 0) {
          aggregatedHeaders = parsed.headers;
        }
        aggregatedRows.push(...parsed.rows);

        branchReports.push({
          id: branch.id,
          name: branch.name,
          sheetName: matchedTabName,
          enabled: true,
          count: parsed.rows.length
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
  findHeaderRowIndex,
  parseSheetGrid,
  loadFromExcelBuffer,
  setUploadedFileData,
  clearUploadedFileData,
  loadFromLocalSample,
  clearCache
};
