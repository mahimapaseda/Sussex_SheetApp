const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const ROOT_DIR = path.resolve(__dirname, '../../');

const PORT = parseInt(process.env.PORT || '3847', 10);
const TIMEZONE = process.env.TIMEZONE || 'Asia/Colombo';
const DEFAULT_COUNTRY_CODE = process.env.DEFAULT_COUNTRY_CODE || '94';

// In packaged electron mode, user data must be written to %APPDATA%/SheetApp
function resolveDataDir() {
  if (process.env.APPDATA) {
    const appDataSheetApp = path.join(process.env.APPDATA, 'SheetApp');
    if (!fs.existsSync(appDataSheetApp)) {
      try {
        fs.mkdirSync(appDataSheetApp, { recursive: true });
      } catch (e) {
        // Fallback to local data folder
      }
    }
    return appDataSheetApp;
  }
  return path.join(ROOT_DIR, 'data');
}

const DATA_DIR = resolveDataDir();
const LOCAL_DATA_DIR = path.join(ROOT_DIR, 'data');

// Migrate existing local data files (settings.json, sent_log.json, assets) on first run
function migrateLocalData() {
  if (DATA_DIR === LOCAL_DATA_DIR) return;
  try {
    const filesToMigrate = ['settings.json', 'sent_log.json'];
    for (const f of filesToMigrate) {
      const src = path.join(LOCAL_DATA_DIR, f);
      const dst = path.join(DATA_DIR, f);
      if (fs.existsSync(src) && !fs.existsSync(dst)) {
        fs.copyFileSync(src, dst);
      }
    }

    const srcAssets = path.join(LOCAL_DATA_DIR, 'assets');
    const dstAssets = path.join(DATA_DIR, 'assets');
    if (fs.existsSync(srcAssets) && !fs.existsSync(dstAssets)) {
      fs.cpSync(srcAssets, dstAssets, { recursive: true });
    }
  } catch (err) {
    console.warn('[Storage] Migration note:', err.message);
  }
}

migrateLocalData();

// Ensure asset folder exists
const ASSETS_DIR = path.join(DATA_DIR, 'assets');
if (!fs.existsSync(ASSETS_DIR)) {
  try {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  } catch (e) {}
}

module.exports = {
  ROOT_DIR,
  PORT,
  TIMEZONE,
  DEFAULT_COUNTRY_CODE,
  DATA_DIR,
  ASSETS_DIR,
  isPackaged: DATA_DIR !== LOCAL_DATA_DIR
};
