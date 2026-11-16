const fs = require('fs');
const { interpolateTemplate } = require('./templateParser');
const { sanitizePhoneNumber } = require('./phoneNormalizer');
const ledger = require('./ledger');
const settings = require('./settings');
const whatsappClient = require('./whatsappClient');

// Engine States
const STATE = {
  IDLE: 'IDLE',
  RUNNING: 'RUNNING',
  PACING: 'PACING',
  COOLDOWN: 'COOLDOWN',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
  ABORTED: 'ABORTED'
};

let engineState = STATE.IDLE;
let activeQueue = [];
let queueIndex = 0;
let campaignStats = {
  campaignId: null,
  total: 0,
  sent: 0,
  failed: 0,
  skipped: 0,
  currentBatch: 1,
  totalBatches: 1,
  batchItemCount: 0,
  currentRecipient: null,
  nextActionInSeconds: 0,
  status: STATE.IDLE,
  startedAt: null,
  completedAt: null,
  consecutiveFailures: 0,
  lastError: null
};

let activeTimer = null;
let countdownInterval = null;

function calculateRiskLevel(config) {
  const minDelay = config.minDelaySeconds || 12;
  const batchSize = config.batchSize || 15;
  const dailyLimit = config.dailyLimit || 250;

  let score = 0;
  if (minDelay < 6) score += 3;
  else if (minDelay < 12) score += 1;

  if (batchSize > 35) score += 3;
  else if (batchSize > 20) score += 1;

  if (dailyLimit > 400) score += 3;
  else if (dailyLimit > 250) score += 1;

  if (score >= 4) return { level: 'HIGH', label: 'High Risk (Ban Probable)', class: 'risk' };
  if (score >= 2) return { level: 'MODERATE', label: 'Moderate Risk (Use Warmed Account)', class: 'cooldown' };
  return { level: 'LOW', label: 'Low Risk (Platform Compliant)', class: 'safe' };
}

function getStatus() {
  const currentSettings = settings.loadSettings();
  const dailySent = ledger.getDailySentCount();
  const dailyLimit = currentSettings.dailyLimit || 250;
  const remainingDailyQuota = Math.max(0, dailyLimit - dailySent);
  const risk = calculateRiskLevel(currentSettings);

  const total = campaignStats.total || 0;
  const processed = (campaignStats.sent + campaignStats.failed + campaignStats.skipped);
  const progressPercent = total > 0 ? Math.round((processed / total) * 100) : 0;

  return {
    ...campaignStats,
    status: engineState,
    dailySent,
    dailyLimit,
    remainingDailyQuota,
    progressPercent,
    risk
  };
}

function getRandomDelay(minSeconds, maxSeconds) {
  const min = Math.max(1, minSeconds);
  const max = Math.max(min, maxSeconds);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function startCountdown(seconds) {
  clearInterval(countdownInterval);
  campaignStats.nextActionInSeconds = seconds;
  countdownInterval = setInterval(() => {
    if (campaignStats.nextActionInSeconds > 0) {
      campaignStats.nextActionInSeconds -= 1;
    } else {
      clearInterval(countdownInterval);
    }
  }, 1000);
}

/**
 * Start a new dispatch campaign with rate-limited batches
 */
async function startCampaign({ records = [], template = '', options = {} }) {
  if (engineState === STATE.RUNNING || engineState === STATE.PACING || engineState === STATE.COOLDOWN) {
    throw new Error('A campaign is already running');
  }

  const currentSettings = settings.loadSettings();
  const batchSize = options.batchSize || currentSettings.batchSize || 15;
  const minDelay = options.minDelaySeconds || currentSettings.minDelaySeconds || 12;
  const maxDelay = options.maxDelaySeconds || currentSettings.maxDelaySeconds || 22;
  const cooldownMinutes = options.cooldownMinutes || currentSettings.cooldownMinutes || 3;
  const dailyLimit = currentSettings.dailyLimit || 250;

  // Filter valid contacts
  const queue = [];
  for (const rec of records) {
    const phoneResult = sanitizePhoneNumber(rec.rawPhone || rec.phone, currentSettings.defaultCountryCode);
    if (!phoneResult.isValid) continue;

    // Check ledger deduplication
    const alreadySent = ledger.hasBeenSentToday(phoneResult.normalized);
    if (alreadySent && !options.allowDuplicateToday) {
      continue;
    }

    const message = interpolateTemplate(template || currentSettings.messageTemplate, rec.rowData || rec);

    queue.push({
      name: rec.name,
      normalizedPhone: phoneResult.normalized,
      formattedPhone: phoneResult.formatted,
      message,
      rowIndex: rec.rowIndex
    });
  }

  if (queue.length === 0) {
    throw new Error('No valid pending recipients to process (all sent today or invalid phone numbers)');
  }

  activeQueue = queue;
  queueIndex = 0;
  const campaignId = `cmp_${Date.now()}`;
  const totalBatches = Math.ceil(queue.length / batchSize);

  campaignStats = {
    campaignId,
    total: queue.length,
    sent: 0,
    failed: 0,
    skipped: 0,
    currentBatch: 1,
    totalBatches,
    batchItemCount: 0,
    currentRecipient: null,
    nextActionInSeconds: 0,
    status: STATE.RUNNING,
    startedAt: new Date().toISOString(),
    completedAt: null,
    consecutiveFailures: 0,
    lastError: null
  };

  engineState = STATE.RUNNING;
  console.log(`[BatchEngine] Campaign started: ${queue.length} recipients across ${totalBatches} batches.`);

  // Begin execution loop
  processNextItem();

  return getStatus();
}

async function processNextItem() {
  if (engineState !== STATE.RUNNING && engineState !== STATE.PACING && engineState !== STATE.COOLDOWN) {
    return;
  }

  // 1. Check if complete
  if (queueIndex >= activeQueue.length) {
    finishCampaign(STATE.COMPLETED);
    return;
  }

  const currentSettings = settings.loadSettings();
  const dailyLimit = currentSettings.dailyLimit || 250;
  const dailySent = ledger.getDailySentCount();

  // 2. Check Daily Limit
  if (dailySent >= dailyLimit) {
    console.warn(`[BatchEngine] Daily platform quota reached (${dailySent}/${dailyLimit}). Halting safely.`);
    campaignStats.lastError = `Daily message limit of ${dailyLimit} reached. Campaign stopped to preserve account safety.`;
    finishCampaign(STATE.PAUSED);
    return;
  }

  // 3. Check Batch Chunk Boundary for Cooldown
  const batchSize = currentSettings.batchSize || 15;
  if (campaignStats.batchItemCount >= batchSize && queueIndex < activeQueue.length) {
    engineState = STATE.COOLDOWN;
    campaignStats.currentBatch += 1;
    campaignStats.batchItemCount = 0;

    const cooldownSeconds = (currentSettings.cooldownMinutes || 3) * 60;
    console.log(`[BatchEngine] Batch boundary reached. Entering cooldown pause for ${cooldownSeconds} seconds...`);

    startCountdown(cooldownSeconds);
    activeTimer = setTimeout(() => {
      if (engineState === STATE.COOLDOWN) {
        engineState = STATE.RUNNING;
        processNextItem();
      }
    }, cooldownSeconds * 1000);
    return;
  }

  // 4. Dispatch Current Item
  const item = activeQueue[queueIndex];
  campaignStats.currentRecipient = item;
  engineState = STATE.RUNNING;

  console.log(`[BatchEngine] [${queueIndex + 1}/${activeQueue.length}] Sending to ${item.name} (${item.normalizedPhone})...`);

  let sendResult = { success: false, error: 'WhatsApp not connected' };
  let mediaPath = null;
  if (currentSettings.attachedImage?.enabled && currentSettings.attachedImage?.path) {
    if (fs.existsSync(currentSettings.attachedImage.path)) {
      mediaPath = currentSettings.attachedImage.path;
    }
  }

  // If WhatsApp is connected, send message, else simulate if in mock/dev
  const waStatus = whatsappClient.getStatus();
  if (waStatus.isReady) {
    sendResult = await whatsappClient.sendMessage(item.normalizedPhone, item.message, mediaPath);
  } else {
    // If client is not ready and no real connection, record reason
    sendResult = { success: false, error: 'WhatsApp Web is not authenticated or connected' };
  }

  if (sendResult.success) {
    campaignStats.sent += 1;
    campaignStats.batchItemCount += 1;
    campaignStats.consecutiveFailures = 0;
    ledger.recordSent({
      phone: item.normalizedPhone,
      name: item.name,
      campaign: campaignStats.campaignId,
      status: 'SENT',
      method: mediaPath ? 'whatsapp-web.js (with image)' : 'whatsapp-web.js'
    });
  } else {
    campaignStats.failed += 1;
    campaignStats.consecutiveFailures += 1;
    campaignStats.lastError = sendResult.error;
    ledger.recordSent({
      phone: item.normalizedPhone,
      name: item.name,
      campaign: campaignStats.campaignId,
      status: 'FAILED',
      error: sendResult.error
    });

    // Circuit Breaker: pause on 3 consecutive failures
    if (campaignStats.consecutiveFailures >= 3) {
      console.warn('[BatchEngine] Circuit breaker triggered: 3 consecutive dispatch failures. Pausing campaign.');
      pauseCampaign('Circuit breaker: 3 consecutive dispatch errors.');
      return;
    }
  }

  queueIndex += 1;

  // 5. Pacing Jitter Delay before Next Item
  if (queueIndex < activeQueue.length) {
    engineState = STATE.PACING;
    const delaySec = getRandomDelay(currentSettings.minDelaySeconds || 12, currentSettings.maxDelaySeconds || 22);
    console.log(`[BatchEngine] Pacing jitter delay: waiting ${delaySec} seconds before next recipient...`);

    startCountdown(delaySec);
    activeTimer = setTimeout(() => {
      if (engineState === STATE.PACING) {
        engineState = STATE.RUNNING;
        processNextItem();
      }
    }, delaySec * 1000);
  } else {
    finishCampaign(STATE.COMPLETED);
  }
}

function pauseCampaign(reason = null) {
  clearTimeout(activeTimer);
  clearInterval(countdownInterval);
  engineState = STATE.PAUSED;
  if (reason) campaignStats.lastError = reason;
  console.log('[BatchEngine] Campaign paused.');
  return getStatus();
}

function resumeCampaign() {
  if (engineState !== STATE.PAUSED) {
    return getStatus();
  }
  console.log('[BatchEngine] Resuming campaign...');
  engineState = STATE.RUNNING;
  processNextItem();
  return getStatus();
}

function abortCampaign() {
  clearTimeout(activeTimer);
  clearInterval(countdownInterval);
  engineState = STATE.ABORTED;
  campaignStats.completedAt = new Date().toISOString();
  console.log('[BatchEngine] Campaign aborted by user.');
  return getStatus();
}

function finishCampaign(finalState) {
  clearTimeout(activeTimer);
  clearInterval(countdownInterval);
  engineState = finalState;
  campaignStats.completedAt = new Date().toISOString();
  campaignStats.currentRecipient = null;
  campaignStats.nextActionInSeconds = 0;
  console.log(`[BatchEngine] Campaign reached end with state: ${finalState}`);
}

module.exports = {
  STATE,
  startCampaign,
  pauseCampaign,
  resumeCampaign,
  abortCampaign,
  getStatus,
  calculateRiskLevel
};
