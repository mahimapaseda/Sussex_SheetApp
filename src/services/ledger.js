const fs = require('fs');
const path = require('path');
const config = require('../config/env');

const LEDGER_FILE = path.join(config.DATA_DIR, 'sent_log.json');

function loadLedger() {
  try {
    if (!fs.existsSync(LEDGER_FILE)) {
      fs.writeFileSync(LEDGER_FILE, JSON.stringify([], null, 2), 'utf8');
      return [];
    }
    const content = fs.readFileSync(LEDGER_FILE, 'utf8');
    return JSON.parse(content) || [];
  } catch (err) {
    console.warn('[Ledger] Failed to read ledger file, using empty ledger:', err.message);
    return [];
  }
}

function saveLedger(records) {
  try {
    fs.writeFileSync(LEDGER_FILE, JSON.stringify(records, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('[Ledger] Failed to write ledger file:', err.message);
    return false;
  }
}

function recordSent({ phone, name, campaign = 'default', status = 'SENT', error = null }) {
  const records = loadLedger();
  const now = new Date();
  const dateKey = now.toISOString().split('T')[0]; // YYYY-MM-DD

  const entry = {
    id: `${phone}_${dateKey}_${Date.now()}`,
    phone,
    name,
    campaign,
    status,
    error,
    timestamp: now.toISOString(),
    dateKey
  };

  records.push(entry);
  saveLedger(records);
  return entry;
}

function hasBeenSentToday(phone, campaign = 'all') {
  const records = loadLedger();
  const todayKey = new Date().toISOString().split('T')[0];
  return records.some(r => r.phone === phone && r.dateKey === todayKey && r.status === 'SENT' && (campaign === 'all' || r.campaign === campaign));
}

function getDailySentCount() {
  const records = loadLedger();
  const todayKey = new Date().toISOString().split('T')[0];
  return records.filter(r => r.dateKey === todayKey && r.status === 'SENT').length;
}

function getRecentLogs(limit = 100) {
  const records = loadLedger();
  return records.slice(-limit).reverse();
}

function clearAllLogs() {
  saveLedger([]);
}

module.exports = {
  recordSent,
  hasBeenSentToday,
  getDailySentCount,
  getRecentLogs,
  clearAllLogs
};
