const path = require('path');
const fs = require('fs');
require('dotenv').config();

const PORT = parseInt(process.env.PORT || '3850', 10);
const TIMEZONE = process.env.TIMEZONE || 'Asia/Colombo';
const DEFAULT_COUNTRY_CODE = process.env.DEFAULT_COUNTRY_CODE || '94';

// Use APPDATA on Windows if running in packaged Electron, else local data/
const isPackaged = process.defaultApp === false || /[\\/]dist[\\/]/.test(__dirname);
const APPDATA_DIR = process.env.APPDATA 
  ? path.join(process.env.APPDATA, 'SheetApp') 
  : path.join(__dirname, '../../data');

const DATA_DIR = isPackaged ? APPDATA_DIR : path.join(__dirname, '../../data');
const ASSETS_DIR = path.join(DATA_DIR, 'assets');

if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    console.warn('[Env] Could not create DATA_DIR:', e.message);
  }
}

if (!fs.existsSync(ASSETS_DIR)) {
  try {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  } catch (e) {
    console.warn('[Env] Could not create ASSETS_DIR:', e.message);
  }
}

module.exports = {
  PORT,
  TIMEZONE,
  DEFAULT_COUNTRY_CODE,
  DATA_DIR,
  ASSETS_DIR,
  isPackaged
};
