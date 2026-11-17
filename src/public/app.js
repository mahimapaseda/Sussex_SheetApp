/**
 * SheetApp Frontend Client
 * Styled in the Sussex College Network UI Design with Multi-Branch Support
 */

let appState = {
  sheetData: null,
  batchStatus: null,
  whatsappStatus: null,
  settings: null,
  branches: [],
  selectedBranchFilter: 'ALL',
  rosterRecords: [],
  attachedImage: null,
  templates: [],
  activeTemplateId: null,
  pollingTimer: null
};

// DOM References
const $ = id => document.getElementById(id);

const els = {
  // Theme & Header
  themeToggleBtn: $('themeToggleBtn'),
  themeToggleIcon: $('themeToggleIcon'),
  themeToggleText: $('themeToggleText'),
  mobileThemeToggleBtn: $('mobileThemeToggleBtn'),
  headerDateDisplay: $('headerDateDisplay'),
  sheetsStatusPill: $('sheetsStatusPill'),
  sheetsStatusText: $('sheetsStatusText'),
  whatsappStatusBtn: $('whatsappStatusBtn'),
  waStatusDot: $('waStatusDot'),
  waStatusText: $('waStatusText'),
  mobileWhatsappStatusBtn: $('mobileWhatsappStatusBtn'),
  mobileWaStatusDot: $('mobileWaStatusDot'),
  mobileWaStatusText: $('mobileWaStatusText'),
  mobileMenuBtn: $('mobileMenuBtn'),
  mobileNavDrawer: $('mobileNavDrawer'),

  // Branches Header Button & Badges
  openBranchesModalBtn: $('openBranchesModalBtn'),
  navBranchCountBadge: $('navBranchCountBadge'),
  mobileBranchesModalBtn: $('mobileBranchesModalBtn'),
  mobileBranchCountBadge: $('mobileBranchCountBadge'),

  // Branch Management Modal Elements
  branchesModal: $('branchesModal'),
  closeBranchesModalBtn: $('closeBranchesModalBtn'),
  closeBranchesFooterBtn: $('closeBranchesFooterBtn'),
  addNewBranchBtn: $('addNewBranchBtn'),
  branchFormDrawer: $('branchFormDrawer'),
  branchFormTitle: $('branchFormTitle'),
  cancelBranchFormBtn: $('cancelBranchFormBtn'),
  saveBranchBtn: $('saveBranchBtn'),
  editBranchId: $('editBranchId'),
  branchInputName: $('branchInputName'),
  branchInputTab: $('branchInputTab'),
  branchInputUrl: $('branchInputUrl'),
  branchesListContainer: $('branchesListContainer'),

  // Branch Filter Strip
  branchFilterStrip: $('branchFilterStrip'),
  branchFilterSelect: $('branchFilterSelect'),
  clearBranchFilterBtn: $('clearBranchFilterBtn'),
  branchFilterSummary: $('branchFilterSummary'),

  // Metrics
  statTotalRows: $('statTotalRows'),
  statValidContacts: $('statValidContacts'),
  statSentToday: $('statSentToday'),
  statDailyLimitQuota: $('statDailyLimitQuota'),
  statRiskRating: $('statRiskRating'),

  // Campaign Banner
  campaignBanner: $('campaignBanner'),
  campaignTimerBadge: $('campaignTimerBadge'),
  campaignStatusHeading: $('campaignStatusHeading'),
  campaignRiskBadge: $('campaignRiskBadge'),
  campaignSubStatus: $('campaignSubStatus'),
  campaignCurrentTarget: $('campaignCurrentTarget'),
  campaignBatchFraction: $('campaignBatchFraction'),
  campaignProgressBar: $('campaignProgressBar'),
  btnBannerPause: $('btnBannerPause'),
  btnBannerResume: $('btnBannerResume'),
  btnBannerAbort: $('btnBannerAbort'),

  // Action Bar
  btnSyncSheets: $('btnSyncSheets'),
  btnOpenManualSend: $('btnOpenManualSend'),
  btnLaunchBatch: $('btnLaunchBatch'),

  // Tabs
  tabBtnRoster: $('tabBtnRoster'),
  tabBtnTemplate: $('tabBtnTemplate'),
  tabBtnSavedTemplates: $('tabBtnSavedTemplates'),
  tabBtnLedger: $('tabBtnLedger'),
  tabPanelRoster: $('tabPanelRoster'),
  tabPanelTemplate: $('tabPanelTemplate'),
  tabPanelSavedTemplates: $('tabPanelSavedTemplates'),
  tabPanelLedger: $('tabPanelLedger'),
  badgeRosterCount: $('badgeRosterCount'),
  badgeSavedTemplatesCount: $('badgeSavedTemplatesCount'),
  badgeLedgerCount: $('badgeLedgerCount'),

  // Roster Tab
  selectPhoneCol: $('selectPhoneCol'),
  selectNameCol: $('selectNameCol'),
  rosterSearchInput: $('rosterSearchInput'),
  rosterTableBody: $('rosterTableBody'),

  // Template Tab
  templateTokenChips: $('templateTokenChips'),
  mainTemplateTextarea: $('mainTemplateTextarea'),
  mainTemplateLivePreview: $('mainTemplateLivePreview'),
  sliderBatchSize: $('sliderBatchSize'),
  displayBatchSize: $('displayBatchSize'),
  inputPacingMin: $('inputPacingMin'),
  inputPacingMax: $('inputPacingMax'),
  displayPacingDelay: $('displayPacingDelay'),
  sliderCooldown: $('sliderCooldown'),
  displayCooldown: $('displayCooldown'),
  displayEstimatedTime: $('displayEstimatedTime'),
  btnSaveTemplateControls: $('btnSaveTemplateControls'),
  saveTemplateSuccessIndicator: $('saveTemplateSuccessIndicator'),
  activeTemplateBadgePill: $('activeTemplateBadgePill'),
  activeTemplateNameLabel: $('activeTemplateNameLabel'),
  btnSaveAsNewTemplatePreset: $('btnSaveAsNewTemplatePreset'),

  // Saved Templates Tab
  savedTemplatesListContainer: $('savedTemplatesListContainer'),
  btnCreateNewTemplatePreset: $('btnCreateNewTemplatePreset'),

  // Template Preset Modal
  templatePresetModal: $('templatePresetModal'),
  closeTemplatePresetModalBtn: $('closeTemplatePresetModalBtn'),
  cancelTemplatePresetBtn: $('cancelTemplatePresetBtn'),
  templatePresetForm: $('templatePresetForm'),
  templatePresetFormId: $('templatePresetFormId'),
  templatePresetNameInput: $('templatePresetNameInput'),
  templatePresetMakeActiveCheckbox: $('templatePresetMakeActiveCheckbox'),
  templatePresetModalTitle: $('templatePresetModalTitle'),
  submitTemplatePresetBtn: $('submitTemplatePresetBtn'),

  // Ledger Tab
  ledgerRowsContainer: $('ledgerRowsContainer'),
  btnClearLedgerHistory: $('btnClearLedgerHistory'),

  // Modals
  whatsappModal: $('whatsappModal'),
  closeWhatsappModalBtn: $('closeWhatsappModalBtn'),
  btnCloseQrModalDone: $('btnCloseQrModalDone'),
  qrImageElement: $('qrImageElement'),
  qrPlaceholder: $('qrPlaceholder'),
  btnResetSession: $('btnResetSession'),

  manualSendModal: $('manualSendModal'),
  closeManualSendModalBtn: $('closeManualSendModalBtn'),
  cancelManualSendBtn: $('cancelManualSendBtn'),
  manualSendForm: $('manualSendForm'),
  manualInputPhone: $('manualInputPhone'),
  manualInputName: $('manualInputName'),
  manualInputMessage: $('manualInputMessage'),
  manualPhoneStatusBadge: $('manualPhoneStatusBadge'),
  navManualSendBtn: $('navManualSendBtn'),
  mobileManualSendBtn: $('mobileManualSendBtn'),

  settingsModal: $('settingsModal'),
  openSettingsModalBtn: $('openSettingsModalBtn'),
  mobileSettingsModalBtn: $('mobileSettingsModalBtn'),
  closeSettingsModalBtn: $('closeSettingsModalBtn'),
  googleAuthStatusPill: $('googleAuthStatusPill'),
  googleSignInCard: $('googleSignInCard'),
  googleUserDisplayTitle: $('googleUserDisplayTitle'),
  googleUserDisplaySubtitle: $('googleUserDisplaySubtitle'),
  googleSignInBtn: $('googleSignInBtn'),
  googleSignOutBtn: $('googleSignOutBtn'),
  toggleCustomOauthBtn: $('toggleCustomOauthBtn'),
  toggleCustomOauthIcon: $('toggleCustomOauthIcon'),
  customOauthFields: $('customOauthFields'),
  inputGoogleClientId: $('inputGoogleClientId'),
  inputGoogleClientSecret: $('inputGoogleClientSecret'),
  inputGoogleSheetId: $('inputGoogleSheetId'),
  inputGoogleSheetTab: $('inputGoogleSheetTab'),
  inputCountryCode: $('inputCountryCode'),
  inputDailyLimit: $('inputDailyLimit'),
  btnSaveConfig: $('btnSaveConfig'),

  openTemplateModalBtn: $('openTemplateModalBtn'),
  mobileTemplateModalBtn: $('mobileTemplateModalBtn'),

  // Developer Attribution Modal
  developerModal: $('developerModal'),
  openDeveloperModalBtn: $('openDeveloperModalBtn'),
  closeDeveloperModalBtn: $('closeDeveloperModalBtn'),
  doneDeveloperModalBtn: $('doneDeveloperModalBtn'),

  // Attached Image Sharing
  toggleAttachImageCheckbox: $('toggleAttachImageCheckbox'),
  imageUploadDropzone: $('imageUploadDropzone'),
  attachedImageFileInput: $('attachedImageFileInput'),
  imagePreviewCard: $('imagePreviewCard'),
  attachedImagePreviewThumb: $('attachedImagePreviewThumb'),
  attachedImageFileName: $('attachedImageFileName'),
  attachedImageStatusBadge: $('attachedImageStatusBadge'),
  btnChangeAttachedImage: $('btnChangeAttachedImage'),
  btnRemoveAttachedImage: $('btnRemoveAttachedImage'),
  manualIncludeImageCheckbox: $('manualIncludeImageCheckbox'),
  manualAttachImageThumb: $('manualAttachImageThumb'),
  manualAttachImageRow: $('manualAttachImageRow'),

  // GitHub Auto-Updater Elements
  navUpdatePill: $('navUpdatePill'),
  navUpdatePillText: $('navUpdatePillText'),
  mobileNavUpdatePill: $('mobileNavUpdatePill'),
  mobileNavUpdatePillText: $('mobileNavUpdatePillText'),
  updateModal: $('updateModal'),
  closeUpdateModalBtn: $('closeUpdateModalBtn'),
  laterUpdateBtn: $('laterUpdateBtn'),
  startUpdateBtn: $('startUpdateBtn'),
  installUpdateBtn: $('installUpdateBtn'),
  cancelUpdateBtn: $('cancelUpdateBtn'),
  updateModalTagBadge: $('updateModalTagBadge'),
  updateCurrentVersionText: $('updateCurrentVersionText'),
  updateNewVersionText: $('updateNewVersionText'),
  updatePublishedDateText: $('updatePublishedDateText'),
  updateReleaseNotesBox: $('updateReleaseNotesBox'),
  updateProgressContainer: $('updateProgressContainer'),
  updateProgressBar: $('updateProgressBar'),
  updateProgressPercent: $('updateProgressPercent'),
  updateProgressBytes: $('updateProgressBytes'),
  updateProgressSpeed: $('updateProgressSpeed'),
  updateProgressStatusText: $('updateProgressStatusText'),
  updateErrorBanner: $('updateErrorBanner'),
  updateErrorText: $('updateErrorText'),
  checkUpdateBtn: $('checkUpdateBtn'),
  updaterStatusSummary: $('updaterStatusSummary'),
  toggleGithubTokenBtn: $('toggleGithubTokenBtn'),
  toggleGithubTokenIcon: $('toggleGithubTokenIcon'),
  githubTokenFields: $('githubTokenFields'),
  inputGithubToken: $('inputGithubToken'),

  // Toast Container
  toastContainer: $('toastContainer')
};

let updaterPollingInterval = null;
let currentUpdaterState = null;

// In-App Toast Notification Popup
function showToast(message, type = 'info') {
  if (!els.toastContainer) return;

  const toast = document.createElement('div');
  const styles = type === 'success'
    ? 'bg-emerald-600/95 dark:bg-emerald-700/95 border-emerald-500/50 text-white shadow-glow-emerald'
    : type === 'error'
    ? 'bg-red-600/95 dark:bg-red-700/95 border-red-500/50 text-white'
    : type === 'warning'
    ? 'bg-amber-600/95 dark:bg-amber-700/95 border-amber-500/50 text-white'
    : 'bg-[#1B365D]/95 dark:bg-slate-800/95 border-blue-400/30 text-white shadow-glow-blue';

  const icon = type === 'success'
    ? 'fa-circle-check'
    : type === 'error'
    ? 'fa-circle-exclamation'
    : type === 'warning'
    ? 'fa-triangle-exclamation'
    : 'fa-circle-info';

  toast.className = `pointer-events-auto px-4 py-3 rounded-2xl text-xs font-semibold backdrop-blur-2xl shadow-[0_16px_40px_rgba(0,0,0,0.25)] border flex items-center gap-3 transition-all duration-300 transform opacity-0 translate-y-3 ${styles}`;
  toast.innerHTML = `
    <i class="fa-solid ${icon} text-sm shrink-0"></i>
    <span class="leading-snug">${escapeHtml(message)}</span>
    <button type="button" class="ml-auto pl-2 text-white/80 hover:text-white transition shrink-0" onclick="this.parentElement.remove()">
      <i class="fa-solid fa-xmark text-xs"></i>
    </button>
  `;

  els.toastContainer.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.remove('opacity-0', 'translate-y-3');
  });

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-3');
    setTimeout(() => toast.remove(), 350);
  }, 4000);
}

// Lifecycle Start
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initDateDisplay();
  bindEvents();
  loadAll();
  startStatusPolling();
});

// Theme handling
function initTheme() {
  const isDark = document.documentElement.classList.contains('dark');
  updateThemeIcon(isDark);

  const toggle = () => {
    const darkNow = document.documentElement.classList.toggle('dark');
    localStorage.setItem('sheetapp_theme', darkNow ? 'dark' : 'light');
    updateThemeIcon(darkNow);
  };

  els.themeToggleBtn?.addEventListener('click', toggle);
  els.mobileThemeToggleBtn?.addEventListener('click', toggle);
}

function updateThemeIcon(isDark) {
  if (els.themeToggleIcon) {
    els.themeToggleIcon.className = isDark ? 'fa-solid fa-sun text-[11px] text-amber-400' : 'fa-solid fa-moon text-[11px] text-[var(--text-muted)]';
  }
  if (els.themeToggleText) {
    els.themeToggleText.textContent = isDark ? 'Dark' : 'Light';
  }
}

function initDateDisplay() {
  const now = new Date();
  const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', timeZone: 'Asia/Colombo' };
  if (els.headerDateDisplay) {
    els.headerDateDisplay.textContent = now.toLocaleDateString('en-US', options);
  }
}

// Bind Events
function bindEvents() {
  // Mobile drawer
  els.mobileMenuBtn?.addEventListener('click', () => {
    els.mobileNavDrawer?.classList.toggle('hidden');
  });

  // Tabs
  els.tabBtnRoster?.addEventListener('click', () => switchTab('roster'));
  els.tabBtnSavedTemplates?.addEventListener('click', () => switchTab('saved-templates'));
  els.tabBtnLedger?.addEventListener('click', () => switchTab('ledger'));

  // Template Preset Modal & Action Buttons
  els.btnCreateNewTemplatePreset?.addEventListener('click', () => openTemplatePresetModal('create-blank'));
  els.closeTemplatePresetModalBtn?.addEventListener('click', closeTemplatePresetModal);
  els.cancelTemplatePresetBtn?.addEventListener('click', closeTemplatePresetModal);
  els.templatePresetForm?.addEventListener('submit', handleSaveTemplatePreset);

  // Quick navigation buttons
  els.openTemplateModalBtn?.addEventListener('click', () => switchTab('saved-templates'));
  els.mobileTemplateModalBtn?.addEventListener('click', () => {
    switchTab('saved-templates');
    els.mobileNavDrawer?.classList.add('hidden');
  });

  // Branches Modal
  const openBranches = () => openBranchesModal();
  els.openBranchesModalBtn?.addEventListener('click', openBranches);
  els.mobileBranchesModalBtn?.addEventListener('click', () => {
    openBranches();
    els.mobileNavDrawer?.classList.add('hidden');
  });
  els.closeBranchesModalBtn?.addEventListener('click', closeBranchesModal);
  els.closeBranchesFooterBtn?.addEventListener('click', closeBranchesModal);

  els.addNewBranchBtn?.addEventListener('click', showAddBranchDrawer);
  els.cancelBranchFormBtn?.addEventListener('click', hideBranchDrawer);
  els.saveBranchBtn?.addEventListener('click', saveBranchForm);

  // Branch filter dropdown
  els.branchFilterSelect?.addEventListener('change', (e) => {
    appState.selectedBranchFilter = e.target.value;
    els.clearBranchFilterBtn?.classList.toggle('hidden', e.target.value === 'ALL');
    filterRosterTable();
  });
  els.clearBranchFilterBtn?.addEventListener('click', () => {
    appState.selectedBranchFilter = 'ALL';
    if (els.branchFilterSelect) els.branchFilterSelect.value = 'ALL';
    els.clearBranchFilterBtn?.classList.add('hidden');
    filterRosterTable();
  });

  // Sync Sheets
  els.btnSyncSheets?.addEventListener('click', () => loadSheets(true));

  // Batch Launch
  els.btnLaunchBatch?.addEventListener('click', launchBatchCampaign);

  // Campaign controls
  els.btnBannerPause?.addEventListener('click', pauseCampaign);
  els.btnBannerResume?.addEventListener('click', resumeCampaign);
  els.btnBannerAbort?.addEventListener('click', abortCampaign);

  // WhatsApp QR Modal
  const openQR = () => openWhatsAppModal();
  els.whatsappStatusBtn?.addEventListener('click', openQR);
  els.mobileWhatsappStatusBtn?.addEventListener('click', openQR);
  $('mobileQuickWaBtn')?.addEventListener('click', openQR);
  els.closeWhatsappModalBtn?.addEventListener('click', closeWhatsAppModal);
  els.btnCloseQrModalDone?.addEventListener('click', closeWhatsAppModal);
  els.btnResetSession?.addEventListener('click', resetWhatsAppSession);

  // Manual Send Modal
  const openManual = () => openManualModal();
  els.btnOpenManualSend?.addEventListener('click', openManual);
  els.navManualSendBtn?.addEventListener('click', openManual);
  els.mobileManualSendBtn?.addEventListener('click', () => {
    openManual();
    els.mobileNavDrawer?.classList.add('hidden');
  });
  els.closeManualSendModalBtn?.addEventListener('click', closeManualModal);
  els.cancelManualSendBtn?.addEventListener('click', closeManualModal);
  els.manualSendForm?.addEventListener('submit', handleManualSendSubmit);

  // Settings Modal
  const openSettings = () => openSettingsModal();
  els.openSettingsModalBtn?.addEventListener('click', openSettings);
  els.mobileSettingsModalBtn?.addEventListener('click', () => {
    openSettings();
    els.mobileNavDrawer?.classList.add('hidden');
  });
  els.closeSettingsModalBtn?.addEventListener('click', closeSettingsModal);
  els.btnSaveConfig?.addEventListener('click', saveSettingsConfig);

  // Google OAuth 2.0 Sign In, Sign Out & Custom Credentials
  els.googleSignInBtn?.addEventListener('click', () => {
    let checks = 0;
    const pollInterval = setInterval(async () => {
      checks++;
      try {
        const authRes = await fetch('/api/auth/google/status').then(r => r.json());
        if (authRes.signedIn && authRes.userEmail) {
          clearInterval(pollInterval);
          await fetchGoogleAuthStatus();
          showToast(`Google Account connected: ${authRes.userEmail}`, 'success');
          loadSheets(true);
          fetchStatus();
        }
      } catch (e) {}
      if (checks > 40) clearInterval(pollInterval);
    }, 1500);
  });

  els.googleSignOutBtn?.addEventListener('click', async () => {
    if (!confirm('Sign out from your Google Account?')) return;
    try {
      const res = await fetch('/api/auth/google/signout', { method: 'POST' }).then(r => r.json());
      if (res.success) {
        showToast('Signed out of Google account.', 'info');
        await fetchGoogleAuthStatus();
        loadSheets(true);
        fetchStatus();
      } else {
        showToast(res.error || 'Failed to sign out', 'error');
      }
    } catch (e) {
      showToast('Error signing out', 'error');
    }
  });

  els.toggleCustomOauthBtn?.addEventListener('click', () => {
    const isHidden = els.customOauthFields?.classList.toggle('hidden');
    if (els.toggleCustomOauthIcon) {
      els.toggleCustomOauthIcon.className = isHidden
        ? 'fa-solid fa-chevron-right text-[9px] transition-transform'
        : 'fa-solid fa-chevron-down text-[9px] transition-transform';
    }
  });

  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'GOOGLE_AUTH_SUCCESS') {
      fetchGoogleAuthStatus();
      showToast(`Connected as ${event.data.email}`, 'success');
      loadSheets(true);
      fetchStatus();
    }
  });

  // Developer Attribution & QR Modal
  const openDeveloperModal = () => els.developerModal?.classList.remove('hidden');
  const closeDeveloperModal = () => els.developerModal?.classList.add('hidden');
  els.openDeveloperModalBtn?.addEventListener('click', openDeveloperModal);
  els.closeDeveloperModalBtn?.addEventListener('click', closeDeveloperModal);
  els.doneDeveloperModalBtn?.addEventListener('click', closeDeveloperModal);

  // GitHub Auto-Updater Event Listeners
  els.navUpdatePill?.addEventListener('click', () => openUpdateModal(false));
  els.mobileNavUpdatePill?.addEventListener('click', () => {
    openUpdateModal(false);
    els.mobileNavDrawer?.classList.add('hidden');
  });
  els.closeUpdateModalBtn?.addEventListener('click', closeUpdateModal);
  els.laterUpdateBtn?.addEventListener('click', closeUpdateModal);
  els.checkUpdateBtn?.addEventListener('click', () => checkForUpdatesManual(true));
  els.startUpdateBtn?.addEventListener('click', startDownloadUpdate);
  els.installUpdateBtn?.addEventListener('click', triggerInstallUpdate);
  els.cancelUpdateBtn?.addEventListener('click', cancelDownloadUpdate);

  els.toggleGithubTokenBtn?.addEventListener('click', () => {
    const isHidden = els.githubTokenFields?.classList.toggle('hidden');
    if (els.toggleGithubTokenIcon) {
      els.toggleGithubTokenIcon.className = isHidden
        ? 'fa-solid fa-chevron-right text-[9px] transition-transform'
        : 'fa-solid fa-chevron-down text-[9px] transition-transform';
    }
  });

  // Close modals on backdrop click
  [els.branchesModal, els.settingsModal, els.whatsappModal, els.manualSendModal, els.developerModal, els.updateModal].forEach(modal => {
    if (!modal) return;
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.add('hidden');
    });
  });

  // Close modals on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      [els.branchesModal, els.settingsModal, els.whatsappModal, els.manualSendModal, els.developerModal, els.updateModal].forEach(modal => {
        if (modal && !modal.classList.contains('hidden')) {
          modal.classList.add('hidden');
        }
      });
    }
  });

  // Ledger
  els.btnClearLedgerHistory?.addEventListener('click', clearLedgerHistory);

  // Roster Filter & Mapping
  els.rosterSearchInput?.addEventListener('input', filterRosterTable);
  els.selectPhoneCol?.addEventListener('change', () => loadSheets(false));
  els.selectNameCol?.addEventListener('change', () => loadSheets(false));

  // Attached Image Sharing Events
  els.imageUploadDropzone?.addEventListener('click', () => els.attachedImageFileInput?.click());
  els.btnChangeAttachedImage?.addEventListener('click', () => els.attachedImageFileInput?.click());
  els.attachedImageFileInput?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) uploadAttachedImage(file);
    e.target.value = '';
  });

  els.imageUploadDropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    els.imageUploadDropzone.classList.add('border-[#1B365D]', 'bg-blue-50/20');
  });
  els.imageUploadDropzone?.addEventListener('dragleave', (e) => {
    e.preventDefault();
    els.imageUploadDropzone.classList.remove('border-[#1B365D]', 'bg-blue-50/20');
  });
  els.imageUploadDropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    els.imageUploadDropzone.classList.remove('border-[#1B365D]', 'bg-blue-50/20');
    const file = e.dataTransfer?.files?.[0];
    if (file) uploadAttachedImage(file);
  });

  els.toggleAttachImageCheckbox?.addEventListener('change', (e) => {
    toggleAttachedImage(e.target.checked);
  });
  els.btnRemoveAttachedImage?.addEventListener('click', deleteAttachedImage);

  // Template & Sliders
  els.mainTemplateTextarea?.addEventListener('input', updateTemplateLivePreview);
  els.sliderBatchSize?.addEventListener('input', (e) => {
    els.displayBatchSize.textContent = `${e.target.value} recipients`;
    updateTemplateLivePreview();
  });
  els.sliderCooldown?.addEventListener('input', (e) => {
    els.displayCooldown.textContent = `${e.target.value} minutes`;
    updateTemplateLivePreview();
  });
  els.inputPacingMin?.addEventListener('input', updatePacingDisplay);
  els.inputPacingMax?.addEventListener('input', updatePacingDisplay);
  els.btnSaveTemplateControls?.addEventListener('click', saveTemplateAndLimits);
}

function updatePacingDisplay() {
  const min = els.inputPacingMin.value;
  const max = els.inputPacingMax.value;
  els.displayPacingDelay.textContent = `${min} - ${max}s`;
  updateTemplateLivePreview();
}

function switchTab(tabKey) {
  if (tabKey === 'template') tabKey = 'saved-templates';

  const tabs = [
    { key: 'roster', btn: els.tabBtnRoster, panel: els.tabPanelRoster },
    { key: 'saved-templates', btn: els.tabBtnSavedTemplates, panel: els.tabPanelSavedTemplates },
    { key: 'ledger', btn: els.tabBtnLedger, panel: els.tabPanelLedger }
  ];

  tabs.forEach(t => {
    if (t.key === tabKey) {
      t.btn?.classList.remove('border-transparent', 'text-[var(--text-muted)]');
      t.btn?.classList.add('border-[#1B365D]', 'dark:border-blue-400', 'text-[#1B365D]', 'dark:text-white', 'font-semibold');
      t.panel?.classList.remove('hidden');
    } else {
      t.btn?.classList.remove('border-[#1B365D]', 'dark:border-blue-400', 'text-[#1B365D]', 'dark:text-white', 'font-semibold');
      t.btn?.classList.add('border-transparent', 'text-[var(--text-muted)]');
      t.panel?.classList.add('hidden');
    }
  });

  if (tabKey === 'saved-templates') loadTemplates();
  if (tabKey === 'ledger') loadLedgerLogs();
}

// Initial Data Loader
async function loadAll() {
  await Promise.all([
    fetchStatus(),
    loadBranches(),
    loadSheets(false),
    loadSettingsData(),
    loadAttachedImageData(),
    loadTemplates(),
    fetchGoogleAuthStatus(),
    fetchUpdaterStatus().catch(() => {})
  ]);
}

async function fetchStatus() {
  try {
    const res = await fetch('/api/status');
    const data = await res.json();
    appState.batchStatus = data.batch;
    appState.whatsappStatus = data.whatsapp;
    appState.settings = data.settings;

    updateHeaderStatuses(data);
    updateMetrics(data);
    updateCampaignBanner(data.batch);
  } catch (err) {
    console.warn('Status poll error:', err);
  }
}

function updateHeaderStatuses(data) {
  const wa = data.whatsapp || {};
  const isConnected = wa.status === 'CONNECTED';
  const isReady = wa.status === 'QR_READY';

  // Desktop Pill
  if (els.waStatusDot && els.waStatusText) {
    if (isConnected) {
      els.waStatusDot.className = 'w-2 h-2 rounded-full bg-emerald-500 shrink-0';
      els.waStatusText.textContent = `Connected (${wa.user || 'Online'})`;
      els.waStatusText.className = 'inline-block align-bottom font-medium text-emerald-700 dark:text-emerald-400 truncate max-w-[145px] xl:max-w-[190px]';
    } else if (isReady) {
      els.waStatusDot.className = 'w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-ping';
      els.waStatusText.textContent = 'Scan QR Code';
      els.waStatusText.className = 'inline-block align-bottom font-medium text-amber-700 dark:text-amber-400 truncate max-w-[145px] xl:max-w-[190px]';
    } else {
      els.waStatusDot.className = 'w-2 h-2 rounded-full bg-red-500 shrink-0';
      els.waStatusText.textContent = wa.status === 'INITIALIZING' ? 'Initializing...' : 'WhatsApp Offline';
      els.waStatusText.className = 'inline-block align-bottom font-medium text-red-700 dark:text-red-400 truncate max-w-[145px] xl:max-w-[190px]';
    }
  }

  // Mobile Drawer
  if (els.mobileWaStatusDot && els.mobileWaStatusText) {
    els.mobileWaStatusDot.className = isConnected ? 'w-2 h-2 rounded-full bg-emerald-500' : 'w-2 h-2 rounded-full bg-amber-500';
    els.mobileWaStatusText.textContent = isConnected ? 'Connected' : (isReady ? 'Scan QR' : 'Offline');
  }

  // Update QR modal image if open
  if (els.whatsappModal && !els.whatsappModal.classList.contains('hidden')) {
    if (wa.qrDataUrl) {
      els.qrPlaceholder?.classList.add('hidden');
      if (els.qrImageElement) {
        els.qrImageElement.src = wa.qrDataUrl;
        els.qrImageElement.classList.remove('hidden');
      }
    } else if (isConnected) {
      if (els.qrPlaceholder) {
        els.qrPlaceholder.innerHTML = `<i class="fa-solid fa-circle-check text-3xl text-emerald-600 mb-2"></i><p class="font-bold text-emerald-700">Connected as ${wa.user || 'User'}</p>`;
        els.qrPlaceholder.classList.remove('hidden');
      }
      els.qrImageElement?.classList.add('hidden');
    }
  }
}

function updateMetrics(data) {
  const batch = data.batch || {};
  if (els.statSentToday) {
    els.statSentToday.textContent = batch.dailySent || 0;
  }
  if (els.statDailyLimitQuota) {
    els.statDailyLimitQuota.textContent = `/ ${batch.dailyLimit || 250}`;
  }
  if (els.statRiskRating && batch.risk) {
    els.statRiskRating.textContent = batch.risk.label.split(' ')[0] + ' Risk';
    els.statRiskRating.className = `text-2xl font-bold mt-0.5 ${batch.risk.level === 'LOW' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`;
  }
}

// Active Campaign Banner Updates
function updateCampaignBanner(batch) {
  if (!batch || batch.status === 'IDLE' || batch.status === 'COMPLETED' || batch.status === 'ABORTED') {
    els.campaignBanner?.classList.add('hidden');
    return;
  }

  els.campaignBanner?.classList.remove('hidden');

  const isPacing = batch.status === 'PACING';
  const isCooldown = batch.status === 'COOLDOWN';
  const isPaused = batch.status === 'PAUSED';

  if (els.campaignProgressBar) {
    els.campaignProgressBar.style.width = `${batch.progressPercent || 0}%`;
  }

  if (els.campaignTimerBadge) {
    els.campaignTimerBadge.textContent = batch.nextActionInSeconds > 0 ? `${batch.nextActionInSeconds}s` : '--';
  }

  if (els.campaignBatchFraction) {
    els.campaignBatchFraction.textContent = `${batch.currentBatch || 1} of ${batch.totalBatches || 1}`;
  }

  if (els.campaignStatusHeading) {
    if (isCooldown) {
      els.campaignStatusHeading.textContent = 'Inter-Batch Cooldown (Resting Connection)';
    } else if (isPacing) {
      els.campaignStatusHeading.textContent = 'Anti-Ban Pacing Jitter Delay';
    } else if (isPaused) {
      els.campaignStatusHeading.textContent = 'Campaign Paused';
    } else {
      els.campaignStatusHeading.textContent = 'Active Safe Dispatch';
    }
  }

  if (els.campaignCurrentTarget) {
    els.campaignCurrentTarget.textContent = batch.currentRecipient ? `${batch.currentRecipient.name} (${batch.currentRecipient.formattedPhone || batch.currentRecipient.normalizedPhone})` : 'Queue in progress';
  }

  // Toggle button visibility
  if (els.btnBannerPause && els.btnBannerResume) {
    els.btnBannerPause.classList.toggle('hidden', isPaused);
    els.btnBannerResume.classList.toggle('hidden', !isPaused);
  }
}

// Branches Management
async function loadBranches() {
  try {
    const res = await fetch('/api/branches');
    const branches = await res.json();
    appState.branches = branches || [];

    const enabledCount = appState.branches.filter(b => b.enabled).length;
    if (els.navBranchCountBadge) els.navBranchCountBadge.textContent = enabledCount;
    if (els.mobileBranchCountBadge) els.mobileBranchCountBadge.textContent = enabledCount;

    renderBranchesList(appState.branches);
    populateBranchFilterDropdown(appState.branches);
  } catch (err) {
    console.warn('Failed to load branches:', err);
  }
}

function openBranchesModal() {
  els.branchesModal?.classList.remove('hidden');
  hideBranchDrawer();
}

function closeBranchesModal() {
  els.branchesModal?.classList.add('hidden');
}

function showAddBranchDrawer() {
  if (els.branchFormDrawer) els.branchFormDrawer.classList.remove('hidden');
  if (els.branchFormTitle) els.branchFormTitle.textContent = 'Add New Branch Sheet';
  if (els.editBranchId) els.editBranchId.value = '';
  if (els.branchInputName) els.branchInputName.value = '';
  if (els.branchInputTab) els.branchInputTab.value = 'INQUIRY DETAILS 2026/27';
  if (els.branchInputUrl) els.branchInputUrl.value = '';
}

function hideBranchDrawer() {
  if (els.branchFormDrawer) els.branchFormDrawer.classList.add('hidden');
}

async function saveBranchForm() {
  const id = els.editBranchId?.value;
  const name = els.branchInputName?.value.trim();
  const sheetName = els.branchInputTab?.value.trim();
  const spreadsheetUrl = els.branchInputUrl?.value.trim();

  if (!name || !spreadsheetUrl) {
    showToast('Please enter a branch name and Google Sheet URL.', 'warning');
    return;
  }

  try {
    const url = id ? `/api/branches/${id}` : '/api/branches';
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, sheetName, spreadsheetUrl })
    });
    const data = await res.json();

    if (data.success) {
      showToast(`Branch "${name}" saved successfully.`, 'success');
      hideBranchDrawer();
      await loadBranches();
      await loadSheets(true);
    } else {
      showToast(`Could not save branch: ${data.error}`, 'error');
    }
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
  }
}

function renderBranchesList(branches = []) {
  if (!els.branchesListContainer) return;

  if (branches.length === 0) {
    els.branchesListContainer.innerHTML = `
      <div class="p-8 text-center text-[var(--text-muted)] text-xs space-y-2">
        <i class="fa-solid fa-folder-open text-2xl text-gray-400 mb-1"></i>
        <p class="font-medium text-[var(--text-primary)]">No branch spreadsheets added yet</p>
        <p class="text-[11px]">Click <strong>+ Add Branch Sheet</strong> above to connect your first Google Sheet.</p>
      </div>
    `;
    return;
  }

  els.branchesListContainer.innerHTML = branches.map(b => `
    <div class="p-4 rounded-2xl bg-[var(--bg-toolbar)]/60 border border-[var(--border-hairline)] hover:border-blue-500/30 transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
      <div class="flex items-start gap-3.5 min-w-0">
        <button type="button" class="mt-0.5 text-base transition-transform hover:scale-110 ${b.enabled ? 'text-emerald-500' : 'text-gray-400'}" onclick="toggleBranchStatus('${b.id}')" title="${b.enabled ? 'Click to pause' : 'Click to enable'}">
          <i class="fa-solid ${b.enabled ? 'fa-toggle-on' : 'fa-toggle-off'} text-xl"></i>
        </button>
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <h4 class="font-bold text-[var(--text-primary)] text-sm truncate font-display">${escapeHtml(b.name)}</h4>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${b.enabled ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}">
              ${b.enabled ? 'Active' : 'Paused'}
            </span>
          </div>
          <p class="text-[11px] text-[var(--text-muted)] mt-0.5 truncate font-medium">Tab: <strong class="text-[var(--text-secondary)]">${escapeHtml(b.sheetName || 'Sheet1')}</strong> · ID: <code class="font-mono text-[10px] bg-[var(--bg-panel)] px-1.5 py-0.5 rounded border border-[var(--border-hairline)]">${escapeHtml(b.spreadsheetId || '--')}</code></p>
        </div>
      </div>

      <div class="flex items-center gap-2 self-end sm:self-auto shrink-0">
        <button type="button" class="btn-neutral px-3.5 py-1.5 rounded-full text-[11px] font-bold shadow-sm" onclick="editBranchSheet('${b.id}')">
          <i class="fa-solid fa-pen-to-square mr-1 text-[var(--text-muted)]"></i> Edit
        </button>
        <button type="button" class="btn-neutral px-3.5 py-1.5 rounded-full text-[11px] font-bold text-red-600 hover:text-red-700 dark:text-red-400 shadow-sm" onclick="deleteBranchSheet('${b.id}')">
          <i class="fa-solid fa-trash-can mr-1"></i> Delete
        </button>
      </div>
    </div>
  `).join('');
}

window.toggleBranchStatus = async function(id) {
  try {
    await fetch(`/api/branches/${id}/toggle`, { method: 'PATCH' });
    await loadBranches();
    await loadSheets(true);
  } catch (e) {}
};

window.editBranchSheet = function(id) {
  const branch = appState.branches.find(b => b.id === id);
  if (!branch) return;

  if (els.branchFormDrawer) els.branchFormDrawer.classList.remove('hidden');
  if (els.branchFormTitle) els.branchFormTitle.textContent = `Edit ${branch.name}`;
  if (els.editBranchId) els.editBranchId.value = branch.id;
  if (els.branchInputName) els.branchInputName.value = branch.name;
  if (els.branchInputTab) els.branchInputTab.value = branch.sheetName || '';
  if (els.branchInputUrl) els.branchInputUrl.value = branch.spreadsheetUrl || branch.spreadsheetId || '';
};

window.deleteBranchSheet = async function(id) {
  if (confirm('Are you sure you want to remove this branch sheet from SheetApp?')) {
    try {
      await fetch(`/api/branches/${id}`, { method: 'DELETE' });
      await loadBranches();
      await loadSheets(true);
    } catch (e) {}
  }
};

function populateBranchFilterDropdown(branches = []) {
  if (!els.branchFilterSelect) return;

  const totalCount = appState.rosterRecords.length;
  const options = [`<option value="ALL">All Branches (${totalCount})</option>`];

  branches.forEach(b => {
    const bKey = b.name.toLowerCase().split(' ')[0];
    const bCount = appState.rosterRecords.filter(r => {
      if (r.branchId === b.id) return true;
      return r.branch && r.branch.toLowerCase().includes(bKey);
    }).length;

    const prefix = b.enabled ? '' : '[Paused] ';
    options.push(`<option value="${b.id}">${prefix}${escapeHtml(b.name)} (${bCount})</option>`);
  });

  els.branchFilterSelect.innerHTML = options.join('');
  els.branchFilterSelect.value = appState.selectedBranchFilter || 'ALL';
}

// Sheets Ingestion
async function loadSheets(forceRefresh = false) {
  try {
    const res = await fetch(`/api/sheets/load?refresh=${forceRefresh ? '1' : '0'}`);
    const data = await res.json();
    appState.sheetData = data;
    appState.rosterRecords = data.records || [];

    if (els.sheetsStatusText) {
      if (data.source === 'none' || data.totalRows === 0) {
        els.sheetsStatusText.textContent = 'No Sheets Connected';
        els.sheetsStatusText.className = 'inline-block align-bottom font-medium text-gray-500 dark:text-gray-400 truncate max-w-[140px] xl:max-w-[170px]';
      } else {
        els.sheetsStatusText.textContent = `Connected (${data.totalRows} rows)`;
        els.sheetsStatusText.className = 'inline-block align-bottom font-medium text-emerald-700 dark:text-emerald-400 truncate max-w-[140px] xl:max-w-[170px]';
      }
    }
    if (els.statTotalRows) els.statTotalRows.textContent = data.totalRows || 0;
    if (els.statValidContacts) els.statValidContacts.textContent = data.validContactsCount || 0;
    if (els.badgeRosterCount) els.badgeRosterCount.textContent = data.totalRows || 0;

    populateColumnDropdowns(data.headers, data.columns);
    populateTokenChips(data.headers);
    populateBranchFilterDropdown(appState.branches);
    filterRosterTable();
    updateTemplateLivePreview();
  } catch (err) {
    if (els.sheetsStatusText) els.sheetsStatusText.textContent = 'Error connecting';
  }
}

function populateColumnDropdowns(headers = [], selected = {}) {
  if (!els.selectPhoneCol || !els.selectNameCol) return;
  els.selectPhoneCol.innerHTML = '';
  els.selectNameCol.innerHTML = '';

  headers.forEach(h => {
    const optP = new Option(h, h, false, h === selected.phoneColumn);
    const optN = new Option(h, h, false, h === selected.nameColumn);
    els.selectPhoneCol.add(optP);
    els.selectNameCol.add(optN);
  });
}

function populateTokenChips(headers = []) {
  if (!els.templateTokenChips) return;
  els.templateTokenChips.innerHTML = '';

  headers.forEach(h => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-neutral px-2.5 py-1 text-xs rounded-md font-mono transition';
    btn.textContent = `+ {${h}}`;
    btn.addEventListener('click', () => {
      insertTokenIntoTemplate(`{${h}}`);
    });
    els.templateTokenChips.appendChild(btn);
  });
}

function insertTokenIntoTemplate(token) {
  const ta = els.mainTemplateTextarea;
  if (!ta) return;
  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const val = ta.value;
  ta.value = val.substring(0, start) + token + val.substring(end);
  ta.focus();
  ta.selectionStart = ta.selectionEnd = start + token.length;
  updateTemplateLivePreview();
}

function filterRosterTable() {
  const q = (els.rosterSearchInput?.value || '').trim().toLowerCase();
  const selectedBranch = appState.selectedBranchFilter;

  let filtered = appState.rosterRecords;

  // Branch filter
  if (selectedBranch && selectedBranch !== 'ALL') {
    const branchObj = appState.branches.find(b => b.id === selectedBranch);
    const bKey = branchObj ? branchObj.name.toLowerCase().split(' ')[0] : selectedBranch.toLowerCase();

    filtered = filtered.filter(r => {
      if (r.branchId === selectedBranch) return true;
      return r.branch && r.branch.toLowerCase().includes(bKey);
    });
  }

  // Search filter
  if (q) {
    filtered = filtered.filter(r => {
      return (r.name && r.name.toLowerCase().includes(q)) ||
             (r.rawPhone && String(r.rawPhone).includes(q)) ||
             (r.normalizedPhone && String(r.normalizedPhone).includes(q)) ||
             (r.branch && r.branch.toLowerCase().includes(q));
    });
  }

  renderRosterTable(filtered);

  if (els.branchFilterSummary) {
    els.branchFilterSummary.textContent = `Showing ${filtered.length} of ${appState.rosterRecords.length} records`;
  }
}

function renderRosterTable(records = []) {
  if (!els.rosterTableBody) return;

  if (records.length === 0) {
    els.rosterTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="p-12 text-center text-[var(--text-muted)]">
          <div class="max-w-sm mx-auto space-y-2">
            <i class="fa-solid fa-table text-3xl text-gray-400 mb-2"></i>
            <p class="text-sm font-semibold text-[var(--text-primary)]">No spreadsheet records loaded</p>
            <p class="text-xs text-[var(--text-muted)]">SheetApp is clean and ready. Click <strong>Branches</strong> in the toolbar above to connect your Google Sheet.</p>
            <div class="pt-2">
              <button type="button" class="btn-primary px-3.5 py-1.5 text-xs font-semibold rounded-md" onclick="els.openBranchesModalBtn.click()">
                <i class="fa-solid fa-plus mr-1"></i> Connect First Branch Sheet
              </button>
            </div>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  els.rosterTableBody.innerHTML = records.map(r => `
    <tr class="hover:bg-[var(--bg-toolbar)]/60 transition-colors duration-200">
      <td class="py-3 px-5 text-center font-mono text-[var(--text-muted)] text-[11px]">${r.rowIndex}</td>
      <td class="py-3 px-5 font-bold text-[var(--text-primary)]">${escapeHtml(r.name)}</td>
      <td class="py-3 px-5 font-mono">
        <span class="${r.isValidPhone ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-red-500 font-semibold'}">
          ${r.isValidPhone ? (r.phoneFormatted || r.normalizedPhone) : (r.rawPhone || 'Invalid')}
        </span>
      </td>
      <td class="py-3 px-5 text-[var(--text-secondary)]">
        <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--bg-toolbar)] border border-[var(--border-hairline)]">
          <i class="fa-solid fa-building-columns text-[10px] text-[var(--text-muted)]"></i>
          <span>${escapeHtml(r.branch || 'Sussex Network')}</span>
        </span>
      </td>
      <td class="py-3 px-5">
        <span class="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide rounded-full ${r.status === 'SENT' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-gray-100 dark:bg-gray-800/80 text-[var(--text-secondary)] border border-[var(--border-hairline)]'}">
          ${r.status || 'PENDING'}
        </span>
      </td>
      <td class="py-3 px-5 text-right">
        <button type="button" class="btn-neutral px-3 py-1 rounded-full text-[11px] font-bold shadow-sm" onclick="dispatchDirectToRow(${r.rowIndex})">
          <i class="fa-solid fa-paper-plane mr-1 text-[var(--text-muted)]"></i> Send
        </button>
      </td>
    </tr>
  `).join('');
}

// Direct send to single row
window.dispatchDirectToRow = function(rowIndex) {
  const row = appState.rosterRecords.find(r => r.rowIndex === rowIndex);
  if (!row) return;

  if (els.manualInputPhone) els.manualInputPhone.value = row.rawPhone || row.normalizedPhone;
  if (els.manualInputName) els.manualInputName.value = row.name;

  // Pre-fill message
  const tpl = els.mainTemplateTextarea?.value || '';
  if (els.manualInputMessage) {
    els.manualInputMessage.value = interpolateLocal(tpl, row.rowData);
  }

  openManualModal();
};

function interpolateLocal(tpl, data = {}) {
  if (!tpl) return '';
  return tpl.replace(/\{+([^{}]+)\}+/g, (m, k) => {
    const key = k.trim();
    return data[key] !== undefined ? String(data[key]).trim() : '';
  });
}

// Template Live Preview & Estimation
async function updateTemplateLivePreview() {
  const template = els.mainTemplateTextarea?.value;
  const phoneCol = els.selectPhoneCol?.value;
  const nameCol = els.selectNameCol?.value;

  try {
    const res = await fetch('/api/campaign/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ template, phoneColumn: phoneCol, nameColumn: nameCol })
    });
    const data = await res.json();
    if (data.samplePreviews && data.samplePreviews.length > 0) {
      if (els.mainTemplateLivePreview) {
        els.mainTemplateLivePreview.textContent = data.samplePreviews[0].interpolated || '(Empty message)';
      }
    }
    if (els.displayEstimatedTime) {
      els.displayEstimatedTime.textContent = `~${data.estimatedMinutes || 5} mins (${data.totalBatches || 1} batches)`;
    }
  } catch (e) {}
}

// Launch Batch Campaign
async function launchBatchCampaign() {
  const activeTemplate = appState.templates?.find(t => t.id === appState.activeTemplateId || t.enabled) || appState.settings;
  const templateName = activeTemplate?.name || 'Active Preset';

  if (!confirm(`Start automated batch dispatch using active template "${templateName}" with compliance anti-ban pacing?`)) return;

  try {
    const res = await fetch('/api/campaign/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template: activeTemplate?.messageTemplate || '',
        options: {
          batchSize: activeTemplate?.batchSize,
          minDelaySeconds: activeTemplate?.minDelaySeconds,
          maxDelaySeconds: activeTemplate?.maxDelaySeconds,
          cooldownMinutes: activeTemplate?.cooldownMinutes
        }
      })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Safe Batch Dispatch launched!', 'success');
      fetchStatus();
    } else {
      showToast(`Could not start campaign: ${data.error}`, 'error');
    }
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
  }
}

async function pauseCampaign() {
  await fetch('/api/campaign/pause', { method: 'POST' });
  showToast('Campaign paused.', 'warning');
  fetchStatus();
}

async function resumeCampaign() {
  await fetch('/api/campaign/resume', { method: 'POST' });
  showToast('Campaign resumed.', 'info');
  fetchStatus();
}

async function abortCampaign() {
  if (confirm('Abort active dispatch campaign?')) {
    await fetch('/api/campaign/abort', { method: 'POST' });
    showToast('Campaign aborted.', 'warning');
    fetchStatus();
  }
}

// WhatsApp Modal & Session
async function openWhatsAppModal() {
  els.whatsappModal?.classList.remove('hidden');
  try {
    await fetch('/api/whatsapp/connect', { method: 'POST' });
  } catch (e) {}
}

function closeWhatsAppModal() {
  els.whatsappModal?.classList.add('hidden');
}

async function resetWhatsAppSession() {
  if (confirm('Reset WhatsApp session and clear pairing credentials?')) {
    await fetch('/api/whatsapp/disconnect', { method: 'POST' });
    if (els.qrPlaceholder) {
      els.qrPlaceholder.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-xl mb-2 text-[#1B365D]"></i><p>Re-initializing WhatsApp Web...</p>`;
      els.qrPlaceholder.classList.remove('hidden');
    }
    els.qrImageElement?.classList.add('hidden');
    await fetch('/api/whatsapp/connect', { method: 'POST' });
  }
}

// Manual Send Modal
function openManualModal() {
  const img = appState.attachedImage;
  if (img && img.fileName && img.url) {
    if (els.manualAttachImageRow) {
      els.manualAttachImageRow.classList.remove('hidden');
      if (els.manualAttachImageThumb) {
        els.manualAttachImageThumb.src = img.url;
        els.manualAttachImageThumb.classList.remove('hidden');
      }
      if (els.manualIncludeImageCheckbox) {
        els.manualIncludeImageCheckbox.checked = !!img.enabled;
      }
    }
  } else {
    els.manualAttachImageRow?.classList.add('hidden');
  }
  els.manualSendModal?.classList.remove('hidden');
}
function closeManualModal() {
  els.manualSendModal?.classList.add('hidden');
}

async function handleManualSendSubmit(e) {
  e.preventDefault();
  const phone = els.manualInputPhone?.value.trim();
  const name = els.manualInputName?.value.trim();
  const message = els.manualInputMessage?.value.trim();
  const includeImage = els.manualIncludeImageCheckbox?.checked || false;

  if (!phone || !message) {
    showToast('Phone and message are required.', 'warning');
    return;
  }

  try {
    const res = await fetch('/api/whatsapp/send-single', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, name, message, includeImage })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Message dispatched successfully via WhatsApp!', 'success');
      closeManualModal();
      fetchStatus();
    } else {
      showToast(`Send failed: ${data.error}`, 'error');
    }
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
  }
}

// Attached Flyer / Image Management
async function loadAttachedImageData() {
  try {
    const res = await fetch('/api/template/image');
    const data = await res.json();
    const img = data.image;
    appState.attachedImage = img;
    renderAttachedImageUI(img);
  } catch (e) {
    console.error('Failed to load attached image:', e);
  }
}

function renderAttachedImageUI(img) {
  const hasImage = img && img.fileName && img.url;
  if (els.toggleAttachImageCheckbox) {
    els.toggleAttachImageCheckbox.checked = !!(img && img.enabled);
  }

  if (hasImage) {
    els.imageUploadDropzone?.classList.add('hidden');
    els.imagePreviewCard?.classList.remove('hidden');
    if (els.attachedImagePreviewThumb) els.attachedImagePreviewThumb.src = img.url;
    if (els.attachedImageFileName) els.attachedImageFileName.textContent = img.originalName || img.fileName;
    if (els.attachedImageStatusBadge) {
      if (img.enabled) {
        els.attachedImageStatusBadge.className = 'inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800';
        els.attachedImageStatusBadge.textContent = 'Active · Included with messages';
      } else {
        els.attachedImageStatusBadge.className = 'inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700';
        els.attachedImageStatusBadge.textContent = 'Paused · Text only';
      }
    }
  } else {
    els.imageUploadDropzone?.classList.remove('hidden');
    els.imagePreviewCard?.classList.add('hidden');
    if (els.manualAttachImageRow) els.manualAttachImageRow.classList.add('hidden');
  }
}

async function uploadAttachedImage(file) {
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    showToast('Please select a valid image file (PNG, JPG, or WebP).', 'warning');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    showToast('File size exceeds 10MB limit.', 'warning');
    return;
  }

  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const res = await fetch('/api/template/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataUrl: reader.result,
          originalName: file.name
        })
      });
      const data = await res.json();
      if (data.success) {
        appState.attachedImage = data.image;
        renderAttachedImageUI(data.image);
        showToast('Flyer image uploaded successfully.', 'success');
      } else {
        showToast(`Failed to save image: ${data.error}`, 'error');
      }
    } catch (e) {
      showToast(`Upload error: ${e.message}`, 'error');
    }
  };
  reader.readAsDataURL(file);
}

async function toggleAttachedImage(enabled) {
  try {
    const res = await fetch('/api/template/image/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled })
    });
    const data = await res.json();
    if (data.success) {
      appState.attachedImage = data.image;
      renderAttachedImageUI(data.image);
      showToast(enabled ? 'Flyer image enabled for dispatches.' : 'Flyer image paused (text-only).', 'info');
    }
  } catch (e) {
    console.error('Toggle image error:', e);
  }
}

async function deleteAttachedImage() {
  if (confirm('Remove the attached flyer image from templates?')) {
    try {
      const res = await fetch('/api/template/image', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        appState.attachedImage = data.image;
        renderAttachedImageUI(data.image);
        showToast('Flyer image removed.', 'info');
      }
    } catch (e) {
      showToast('Failed to delete image', 'error');
    }
  }
}

// Settings Modal
function openSettingsModal() {
  els.settingsModal?.classList.remove('hidden');
  fetchGoogleAuthStatus();
}
function closeSettingsModal() {
  els.settingsModal?.classList.add('hidden');
}

async function fetchGoogleAuthStatus() {
  if (!els.googleAuthStatusPill) return;
  try {
    const res = await fetch('/api/auth/google/status');
    const auth = await res.json();

    if (auth.signedIn && auth.userEmail) {
      if (auth.hasSheetsScope === false) {
        els.googleAuthStatusPill.className = 'px-2.5 py-0.5 text-[10.5px] font-semibold rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shadow-sm flex items-center gap-1';
        els.googleAuthStatusPill.innerHTML = '<i class="fa-solid fa-triangle-exclamation text-[9.5px]"></i> <span>Missing Sheets Scope</span>';

        if (els.googleUserDisplayTitle) els.googleUserDisplayTitle.textContent = auth.userEmail;
        if (els.googleUserDisplaySubtitle) els.googleUserDisplaySubtitle.textContent = 'Signed in, but missing "See all your Google Spreadsheets" permission. Sign out and re-authorize.';
        els.googleSignInBtn?.classList.remove('hidden');
        els.googleSignOutBtn?.classList.remove('hidden');
      } else {
        els.googleAuthStatusPill.className = 'px-2.5 py-0.5 text-[10.5px] font-semibold rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-sm flex items-center gap-1';
        els.googleAuthStatusPill.innerHTML = '<i class="fa-solid fa-circle-check text-[9.5px]"></i> <span>Connected</span>';

        if (els.googleUserDisplayTitle) els.googleUserDisplayTitle.textContent = auth.userEmail;
        if (els.googleUserDisplaySubtitle) els.googleUserDisplaySubtitle.textContent = 'Active Sussex Google Workspace session. Private sheets access enabled.';
        els.googleSignInBtn?.classList.add('hidden');
        els.googleSignOutBtn?.classList.remove('hidden');
      }
    } else {
      els.googleAuthStatusPill.className = 'px-2.5 py-0.5 text-[10.5px] font-semibold rounded-full bg-[var(--bg-toolbar)] text-[var(--text-muted)] border border-[var(--border-hairline)] shadow-sm flex items-center gap-1';
      els.googleAuthStatusPill.innerHTML = '<i class="fa-regular fa-circle text-[9.5px]"></i> <span>Not signed in</span>';

      if (els.googleUserDisplayTitle) els.googleUserDisplayTitle.textContent = 'Not signed in';
      if (els.googleUserDisplaySubtitle) els.googleUserDisplaySubtitle.textContent = 'Sign in with your Google account to access private Sussex branch spreadsheets.';
      els.googleSignInBtn?.classList.remove('hidden');
      els.googleSignOutBtn?.classList.add('hidden');
    }
  } catch (err) {
    console.warn('[GoogleAuth] Status check failed:', err);
  }
}

window.fetchGoogleAuthStatus = fetchGoogleAuthStatus;

async function loadSettingsData() {
  try {
    const res = await fetch('/api/settings');
    const s = await res.json();
    if (els.inputGoogleSheetId) els.inputGoogleSheetId.value = s.googleSheetId || '';
    if (els.inputGoogleSheetTab) els.inputGoogleSheetTab.value = s.googleSheetTab || 'Sheet1';
    if (els.inputCountryCode) els.inputCountryCode.value = s.defaultCountryCode || '94';
    if (els.inputDailyLimit) els.inputDailyLimit.value = s.dailyLimit || 250;
    if (els.inputGoogleClientId) els.inputGoogleClientId.value = s.googleClientId || '';
    if (els.inputGoogleClientSecret) els.inputGoogleClientSecret.value = s.googleClientSecret || '';
    if (els.inputGithubToken) els.inputGithubToken.value = s.githubToken || '';
    if (els.mainTemplateTextarea && s.messageTemplate !== undefined) {
      els.mainTemplateTextarea.value = s.messageTemplate;
    }
    if (els.sliderBatchSize && s.batchSize !== undefined) {
      els.sliderBatchSize.value = s.batchSize;
      if (els.displayBatchSize) els.displayBatchSize.textContent = `${s.batchSize} recipients`;
    }
    if (els.inputPacingMin && s.minDelaySeconds !== undefined) els.inputPacingMin.value = s.minDelaySeconds;
    if (els.inputPacingMax && s.maxDelaySeconds !== undefined) els.inputPacingMax.value = s.maxDelaySeconds;
    if (els.displayPacingDelay && s.minDelaySeconds && s.maxDelaySeconds) {
      els.displayPacingDelay.textContent = `${s.minDelaySeconds} - ${s.maxDelaySeconds}s`;
    }
    if (els.sliderCooldown && s.cooldownMinutes !== undefined) {
      els.sliderCooldown.value = s.cooldownMinutes;
      if (els.displayCooldown) els.displayCooldown.textContent = `${s.cooldownMinutes} minutes`;
    }

    if (s.activeTemplateId) {
      appState.activeTemplateId = s.activeTemplateId;
      if (Array.isArray(s.savedTemplates)) {
        const active = s.savedTemplates.find(t => t.id === s.activeTemplateId);
        if (active && els.activeTemplateNameLabel) {
          els.activeTemplateNameLabel.textContent = active.name;
        }
      }
    }

    updateTemplateLivePreview();
    fetchGoogleAuthStatus();
  } catch (e) {}
}

async function saveTemplateAndLimits() {
  const payload = {
    messageTemplate: els.mainTemplateTextarea?.value || '',
    batchSize: parseInt(els.sliderBatchSize?.value || 15, 10),
    minDelaySeconds: parseInt(els.inputPacingMin?.value || 12, 10),
    maxDelaySeconds: parseInt(els.inputPacingMax?.value || 22, 10),
    cooldownMinutes: parseInt(els.sliderCooldown?.value || 3, 10)
  };

  try {
    if (els.btnSaveTemplateControls) {
      els.btnSaveTemplateControls.disabled = true;
      els.btnSaveTemplateControls.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Saving...';
    }

    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      if (els.saveTemplateSuccessIndicator) {
        els.saveTemplateSuccessIndicator.classList.remove('hidden');
        setTimeout(() => {
          els.saveTemplateSuccessIndicator?.classList.add('hidden');
        }, 3000);
      }
      showToast('Template & Anti-Ban changes saved directly to active template!', 'success');
      await Promise.all([fetchStatus(), loadTemplates()]);
      updateTemplateLivePreview();
    } else {
      showToast('Failed to save settings', 'error');
    }
  } catch (err) {
    showToast(`Save error: ${err.message}`, 'error');
  } finally {
    if (els.btnSaveTemplateControls) {
      els.btnSaveTemplateControls.disabled = false;
      els.btnSaveTemplateControls.innerHTML = '<i class="fa-solid fa-floppy-disk mr-1"></i> <span>Save Changes</span>';
    }
  }
}

async function saveSettingsConfig() {
  const payload = {
    googleSheetId: els.inputGoogleSheetId?.value.trim(),
    googleSheetTab: els.inputGoogleSheetTab?.value.trim(),
    defaultCountryCode: els.inputCountryCode?.value.trim(),
    dailyLimit: parseInt(els.inputDailyLimit?.value || 250, 10),
    googleClientId: els.inputGoogleClientId?.value.trim(),
    googleClientSecret: els.inputGoogleClientSecret?.value.trim(),
    githubToken: els.inputGithubToken?.value.trim()
  };

  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      showToast('Settings saved successfully!', 'success');
      closeSettingsModal();
      fetchStatus();
      loadSheets(true);
    }
  } catch (e) {
    showToast('Failed to save settings', 'error');
  }
}

// ==========================================
// Saved Templates Management Module
// Only ONE template may be enabled at a time.
// Changes in Template Controls automatically save to the active template.
// ==========================================

let currentTemplateModalMode = 'create-from-controls'; // 'create-from-controls' | 'create-blank' | 'rename'
let currentTemplateEditId = null;

async function loadTemplates() {
  try {
    const res = await fetch('/api/templates');
    const data = await res.json();
    const templates = data.templates || [];
    const activeId = data.activeTemplateId;
    appState.templates = templates;
    appState.activeTemplateId = activeId;

    if (els.badgeSavedTemplatesCount) {
      els.badgeSavedTemplatesCount.textContent = templates.length;
    }

    const activeTemplate = templates.find(t => t.id === activeId || t.enabled);
    if (activeTemplate && els.activeTemplateNameLabel) {
      els.activeTemplateNameLabel.textContent = activeTemplate.name;
    }

    renderSavedTemplates(templates, activeId);
  } catch (e) {
    console.error('Failed to load templates:', e);
  }
}

function renderSavedTemplates(templates, activeId) {
  if (!els.savedTemplatesListContainer) return;

  if (!templates || templates.length === 0) {
    els.savedTemplatesListContainer.innerHTML = `
      <div class="col-span-full py-12 text-center">
        <div class="h-14 w-14 rounded-3xl bg-[var(--bg-toolbar)] text-[var(--text-muted)] flex items-center justify-center text-2xl mx-auto mb-3 shadow-inner">
          <i class="fa-solid fa-layer-group"></i>
        </div>
        <h3 class="font-display font-bold text-sm text-[var(--text-primary)]">No Saved Templates</h3>
        <p class="text-xs text-[var(--text-muted)] mt-1">Create your first template preset to quickly toggle campaign messages and limits.</p>
        <button type="button" class="mt-4 btn-primary px-4 py-2 rounded-full text-xs font-bold inline-flex items-center gap-1.5 shadow-sm" onclick="openTemplatePresetModal('create-blank')">
          <i class="fa-solid fa-plus text-[10px]"></i>
          <span>Create Template</span>
        </button>
      </div>
    `;
    return;
  }

  els.savedTemplatesListContainer.innerHTML = templates.map(t => {
    const isActive = (t.id === activeId || !!t.enabled);
    const hasImage = !!(t.attachedImage && (t.attachedImage.dataUrl || t.attachedImage.url));
    const flyerName = hasImage ? (t.attachedImage.fileName || 'Flyer Attached') : null;

    return `
      <div class="card-bento p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between relative group ${
        isActive
          ? 'border-emerald-500/50 bg-emerald-500/[0.04] dark:bg-emerald-500/[0.06] shadow-[0_8px_24px_rgba(16,185,129,0.12)] ring-1 ring-emerald-500/20'
          : 'border-[var(--border-hairline)] hover:border-[#1B365D]/40 dark:hover:border-blue-400/30'
      }">
        <!-- Top Row: Name, Status & Menu -->
        <div>
          <div class="flex items-center justify-between gap-2 mb-2">
            <div class="flex items-center gap-2 min-w-0">
              ${
                isActive
                  ? `<span class="shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-700/80 flex items-center gap-1 shadow-sm">
                      <i class="fa-solid fa-circle-check text-[9px] text-emerald-600 dark:text-emerald-400"></i>
                      <span>ACTIVE</span>
                     </span>`
                  : `<button type="button" class="btn-enable-template shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--bg-toolbar)] text-[var(--text-secondary)] hover:bg-[#1B365D] hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition border border-[var(--border-hairline)] flex items-center gap-1 shadow-sm cursor-pointer" data-id="${t.id}" title="Enable this template as the active campaign preset (only one enabled at a time)">
                      <i class="fa-regular fa-circle text-[9px]"></i>
                      <span>Enable</span>
                     </button>`
              }
              <h4 class="font-display font-bold text-sm text-[var(--text-primary)] truncate" title="${escapeHtml(t.name)}">
                ${escapeHtml(t.name)}
              </h4>
            </div>

            <!-- Quick Action Icons -->
            <div class="flex items-center gap-1 shrink-0">
              <button type="button" class="btn-edit-template h-7 w-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[#1B365D] dark:hover:text-white hover:bg-[var(--bg-toolbar)] transition text-xs cursor-pointer" data-id="${t.id}" title="Edit Template">
                <i class="fa-solid fa-pen text-[10px]"></i>
              </button>
              <button type="button" class="btn-duplicate-template h-7 w-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[#1B365D] dark:hover:text-white hover:bg-[var(--bg-toolbar)] transition text-xs cursor-pointer" data-id="${t.id}" title="Duplicate Preset">
                <i class="fa-solid fa-copy text-[10px]"></i>
              </button>
              <button type="button" class="btn-delete-template h-7 w-7 rounded-lg flex items-center justify-center text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition text-xs cursor-pointer" data-id="${t.id}" title="Delete Preset">
                <i class="fa-regular fa-trash-can text-[10px]"></i>
              </button>
            </div>
          </div>

          <!-- Message Preview Box -->
          <div class="bg-[var(--bg-panel)] rounded-xl p-3 text-xs font-mono text-[var(--text-secondary)] line-clamp-3 leading-relaxed border border-[var(--border-hairline)] select-text mb-3">
            ${escapeHtml(t.messageTemplate || '(Empty message template)')}
          </div>

          <!-- Attached Flyer Badge (if any) -->
          ${
            hasImage
              ? `<div class="mb-3 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/60 text-[11px] font-semibold text-blue-800 dark:text-blue-300">
                  <i class="fa-solid fa-image text-[10px]"></i>
                  <span class="truncate flex-1">${escapeHtml(flyerName)}</span>
                  <span class="text-[9.5px] px-1.5 py-0.2 rounded font-bold ${t.attachedImage?.enabled ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}">${t.attachedImage?.enabled ? 'Enabled' : 'Disabled'}</span>
                 </div>`
              : ''
          }
        </div>

        <!-- Bottom Controls & Pacing Stats Strip -->
        <div class="pt-3 border-t border-[var(--border-hairline)] space-y-2.5">
          <!-- Pacing Badges -->
          <div class="flex items-center justify-between text-[10.5px] font-mono text-[var(--text-muted)] gap-1">
            <span class="flex items-center gap-1" title="Batch Chunk Size">
              <i class="fa-solid fa-cubes text-[9.5px] text-[#1B365D] dark:text-blue-400"></i>
              <span>${t.batchSize || 15}/chunk</span>
            </span>
            <span class="flex items-center gap-1" title="Pacing Jitter Delay">
              <i class="fa-solid fa-stopwatch text-[9.5px] text-amber-500"></i>
              <span>${t.minDelaySeconds || 12}-${t.maxDelaySeconds || 22}s</span>
            </span>
            <span class="flex items-center gap-1" title="Cooldown Pause">
              <i class="fa-solid fa-hourglass-half text-[9.5px] text-blue-500"></i>
              <span>${t.cooldownMinutes || 3}m cool</span>
            </span>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center gap-2">
            <button type="button" class="btn-edit-template flex-1 btn-neutral py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer" data-id="${t.id}" title="Edit message template, flyer, and anti-ban limits">
              <i class="fa-solid fa-sliders text-[10px]"></i>
              <span>Edit Template</span>
            </button>
            ${
              !isActive
                ? `<button type="button" class="btn-enable-template btn-primary py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm" data-id="${t.id}" title="Activate this template (only one enabled at a time)">
                    <i class="fa-solid fa-check text-[10px]"></i>
                    <span>Activate</span>
                   </button>`
                : `<span class="py-1.5 px-3 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 shadow-sm">
                    <i class="fa-solid fa-bolt text-[10px]"></i>
                    <span>Active Preset</span>
                   </span>`
            }
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Attach Event Listeners
  els.savedTemplatesListContainer.querySelectorAll('.btn-enable-template').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      if (id) enableTemplatePreset(id);
    });
  });

  els.savedTemplatesListContainer.querySelectorAll('.btn-edit-template').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      const t = templates.find(item => item.id === id);
      if (t) openTemplatePresetModal('edit', t);
    });
  });

  els.savedTemplatesListContainer.querySelectorAll('.btn-duplicate-template').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      if (id) duplicateTemplatePreset(id);
    });
  });

  els.savedTemplatesListContainer.querySelectorAll('.btn-delete-template').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      if (id) deleteTemplatePreset(id);
    });
  });
}

async function enableTemplatePreset(templateId, showFeedback = true) {
  try {
    const res = await fetch(`/api/templates/${templateId}/enable`, {
      method: 'POST'
    });
    const data = await res.json();
    if (data.success) {
      if (showFeedback) {
        showToast(`Template "${data.activeTemplate?.name || 'Preset'}" is now Active!`, 'success');
      }
      await Promise.all([
        loadTemplates(),
        loadSettingsData(),
        loadAttachedImageData(),
        fetchStatus()
      ]);
    } else {
      showToast(data.error || 'Failed to enable template', 'error');
    }
  } catch (err) {
    showToast('Failed to activate template', 'error');
  }
}

async function loadTemplateIntoControls(templateId) {
  const t = appState.templates?.find(item => item.id === templateId);
  if (t) {
    openTemplatePresetModal('edit', t);
  }
}

async function duplicateTemplatePreset(templateId) {
  try {
    const res = await fetch(`/api/templates/${templateId}/duplicate`, {
      method: 'POST'
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Duplicated "${data.template?.name}"`, 'success');
      await loadTemplates();
    } else {
      showToast(data.error || 'Failed to duplicate template', 'error');
    }
  } catch (err) {
    showToast('Failed to duplicate template', 'error');
  }
}

async function deleteTemplatePreset(templateId) {
  const t = appState.templates.find(item => item.id === templateId);
  if (!t) return;

  const isOnlyTemplate = (appState.templates.length <= 1);
  const confirmMsg = isOnlyTemplate
    ? `Delete "${t.name}"? This is your only template preset, so it will be reset to a clean default template.`
    : `Are you sure you want to delete template "${t.name}"?`;

  if (!confirm(confirmMsg)) {
    return;
  }

  try {
    const res = await fetch(`/api/templates/${templateId}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (data.success) {
      if (data.resetToDefault) {
        showToast('Template reset to clean default preset.', 'info');
      } else {
        showToast(`Template "${t.name}" deleted.`, 'info');
      }
      await Promise.all([
        loadTemplates(),
        loadSettingsData(),
        loadAttachedImageData(),
        fetchStatus()
      ]);
    } else {
      showToast(data.error || 'Failed to delete template', 'error');
    }
  } catch (err) {
    showToast('Failed to delete template', 'error');
  }
}

function openTemplatePresetModal(mode = 'create-blank', existingTemplate = null) {
  currentTemplateModalMode = mode;
  currentTemplateEditId = existingTemplate ? existingTemplate.id : null;
  if (!els.templatePresetModal) return;

  if (els.templatePresetFormId) els.templatePresetFormId.value = currentTemplateEditId || '';

  if (mode === 'edit' && existingTemplate) {
    if (els.templatePresetModalTitle) els.templatePresetModalTitle.textContent = `Edit Template: ${existingTemplate.name}`;
    if (els.templatePresetNameInput) els.templatePresetNameInput.value = existingTemplate.name || '';
    if (els.templatePresetMakeActiveCheckbox) {
      els.templatePresetMakeActiveCheckbox.checked = !!(existingTemplate.enabled || existingTemplate.id === appState.activeTemplateId);
    }
    if (els.mainTemplateTextarea) els.mainTemplateTextarea.value = existingTemplate.messageTemplate || '';
    if (els.sliderBatchSize) {
      els.sliderBatchSize.value = existingTemplate.batchSize || 15;
      if (els.displayBatchSize) els.displayBatchSize.textContent = `${els.sliderBatchSize.value} recipients`;
    }
    if (els.inputPacingMin) els.inputPacingMin.value = existingTemplate.minDelaySeconds || 12;
    if (els.inputPacingMax) els.inputPacingMax.value = existingTemplate.maxDelaySeconds || 22;
    updatePacingDisplay();
    if (els.sliderCooldown) {
      els.sliderCooldown.value = existingTemplate.cooldownMinutes || 3;
      if (els.displayCooldown) els.displayCooldown.textContent = `${els.sliderCooldown.value} minutes`;
    }

    appState.attachedImage = (existingTemplate.attachedImage && (existingTemplate.attachedImage.dataUrl || existingTemplate.attachedImage.url))
      ? { ...existingTemplate.attachedImage }
      : null;
    renderAttachedImageUI(appState.attachedImage);
  } else {
    // create-blank
    if (els.templatePresetModalTitle) els.templatePresetModalTitle.textContent = 'Create Template Preset';
    if (els.templatePresetNameInput) els.templatePresetNameInput.value = '';
    if (els.templatePresetMakeActiveCheckbox) {
      els.templatePresetMakeActiveCheckbox.checked = (!appState.templates || appState.templates.length === 0);
    }
    if (els.mainTemplateTextarea) {
      els.mainTemplateTextarea.value = 'Hello {Name}, this is an automated update regarding your record. Please let us know if you need any assistance!\n\nBest regards';
    }
    if (els.sliderBatchSize) {
      els.sliderBatchSize.value = 15;
      if (els.displayBatchSize) els.displayBatchSize.textContent = '15 recipients';
    }
    if (els.inputPacingMin) els.inputPacingMin.value = 12;
    if (els.inputPacingMax) els.inputPacingMax.value = 22;
    updatePacingDisplay();
    if (els.sliderCooldown) {
      els.sliderCooldown.value = 3;
      if (els.displayCooldown) els.displayCooldown.textContent = '3 minutes';
    }

    appState.attachedImage = null;
    renderAttachedImageUI(null);
  }

  // Populate dynamic header tokens
  populateTokenChips(appState.sheetData?.headers || ['Name', 'Branch', 'Phone']);
  updateTemplateLivePreview();

  els.templatePresetModal.classList.remove('hidden');
  els.templatePresetNameInput?.focus();
  els.templatePresetNameInput?.select();
}

// Make accessible for inline onclick
window.openTemplatePresetModal = openTemplatePresetModal;

function closeTemplatePresetModal() {
  els.templatePresetModal?.classList.add('hidden');
  if (els.templatePresetNameInput) els.templatePresetNameInput.value = '';
  currentTemplateModalMode = 'create-blank';
  currentTemplateEditId = null;
}

async function handleSaveTemplatePreset(e) {
  e.preventDefault();
  const name = els.templatePresetNameInput?.value.trim();
  if (!name) {
    showToast('Please enter a template preset name', 'warning');
    return;
  }

  const payload = {
    name,
    messageTemplate: els.mainTemplateTextarea?.value || '',
    batchSize: parseInt(els.sliderBatchSize?.value || 15, 10),
    minDelaySeconds: parseInt(els.inputPacingMin?.value || 12, 10),
    maxDelaySeconds: parseInt(els.inputPacingMax?.value || 22, 10),
    cooldownMinutes: parseInt(els.sliderCooldown?.value || 3, 10),
    attachedImage: appState.attachedImage || null,
    enabled: !!els.templatePresetMakeActiveCheckbox?.checked
  };

  try {
    if (currentTemplateModalMode === 'edit' && currentTemplateEditId) {
      const res = await fetch(`/api/templates/${currentTemplateEditId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Template "${name}" updated successfully!`, 'success');
      } else {
        showToast(data.error || 'Failed to update template', 'error');
        return;
      }
    } else {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Template "${name}" created!`, 'success');
      } else {
        showToast(data.error || 'Failed to create template', 'error');
        return;
      }
    }

    closeTemplatePresetModal();
    await Promise.all([
      loadTemplates(),
      loadSettingsData(),
      loadAttachedImageData(),
      fetchStatus()
    ]);
  } catch (err) {
    showToast('Failed to save template preset', 'error');
  }
}

// Delivery Ledger Logs
async function loadLedgerLogs() {
  try {
    const res = await fetch('/api/ledger');
    const data = await res.json();
    const logs = data.logs || [];

    if (els.badgeLedgerCount) els.badgeLedgerCount.textContent = logs.length;

    if (!els.ledgerRowsContainer) return;
    if (logs.length === 0) {
      els.ledgerRowsContainer.innerHTML = '<div class="p-8 text-center text-[var(--text-muted)] text-xs">No delivery records found today.</div>';
      return;
    }

    els.ledgerRowsContainer.innerHTML = logs.map(l => `
      <div class="px-5 py-3 flex items-center justify-between text-xs hover:bg-[var(--bg-toolbar)] transition">
        <div class="flex items-center gap-3">
          <div class="h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${l.status === 'SENT' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400'}">
            <i class="${l.status === 'SENT' ? 'fa-solid fa-check' : 'fa-solid fa-xmark'}"></i>
          </div>
          <div>
            <div class="font-semibold text-[var(--text-primary)]">${escapeHtml(l.name || 'Recipient')}</div>
            <div class="font-mono text-[11px] text-[var(--text-muted)]">${l.phone}</div>
          </div>
        </div>

        <div class="text-right">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold ${l.status === 'SENT' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}">
            ${l.status}
          </span>
          <div class="text-[10px] text-[var(--text-muted)] mt-0.5">${new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
        </div>
      </div>
    `).join('');
  } catch (e) {}
}

async function clearLedgerHistory() {
  if (confirm('Clear delivery ledger and reset daily log?')) {
    await fetch('/api/ledger', { method: 'DELETE' });
    loadLedgerLogs();
    fetchStatus();
  }
}

// Background Poller
function startStatusPolling() {
  clearInterval(appState.pollingTimer);
  appState.pollingTimer = setInterval(() => {
    fetchStatus();
  }, 2000);
}

// ==========================================
// Software Auto-Updater UI & State Handlers
// ==========================================

async function fetchUpdaterStatus() {
  try {
    const res = await fetch('/api/updater/status').then(r => r.json());
    currentUpdaterState = res;
    renderUpdaterUI(res);
    return res;
  } catch (err) {
    console.warn('[Updater] Could not fetch updater status:', err);
    return null;
  }
}

function renderUpdaterUI(state) {
  if (!state) return;

  // Update Settings Modal Status Summary
  if (els.updaterStatusSummary) {
    if (state.status === 'AVAILABLE') {
      els.updaterStatusSummary.textContent = `Update v${state.updateInfo?.version} available`;
      els.updaterStatusSummary.className = 'text-xs font-semibold text-emerald-600 dark:text-emerald-400 truncate';
    } else if (state.status === 'DOWNLOADING') {
      els.updaterStatusSummary.textContent = `Downloading (${state.progress?.percent || 0}%)`;
      els.updaterStatusSummary.className = 'text-xs font-semibold text-blue-600 dark:text-blue-400 truncate';
    } else if (state.status === 'READY_TO_INSTALL') {
      els.updaterStatusSummary.textContent = 'Ready to install';
      els.updaterStatusSummary.className = 'text-xs font-semibold text-emerald-600 dark:text-emerald-400 truncate';
    } else if (state.status === 'ERROR') {
      els.updaterStatusSummary.textContent = `Error: ${state.error || 'Failed'}`;
      els.updaterStatusSummary.className = 'text-xs font-semibold text-red-500 truncate';
    } else {
      els.updaterStatusSummary.textContent = 'Ready to check for updates';
      els.updaterStatusSummary.className = 'text-xs font-semibold text-[var(--text-primary)] truncate';
    }
  }

  // Header Nav Pill
  const showPill = (state.status === 'AVAILABLE' || state.status === 'DOWNLOADING' || state.status === 'READY_TO_INSTALL');
  if (els.navUpdatePill) {
    if (showPill) {
      els.navUpdatePill.classList.remove('hidden');
      if (els.navUpdatePillText) {
        if (state.status === 'READY_TO_INSTALL') {
          els.navUpdatePillText.textContent = 'Restart to Update';
        } else if (state.status === 'DOWNLOADING') {
          els.navUpdatePillText.textContent = `Downloading ${state.progress?.percent || 0}%`;
        } else {
          els.navUpdatePillText.textContent = `Update v${state.updateInfo?.version || ''}`;
        }
      }
    } else {
      els.navUpdatePill.classList.add('hidden');
    }
  }

  if (els.mobileNavUpdatePill) {
    if (showPill) {
      els.mobileNavUpdatePill.classList.remove('hidden');
      if (els.mobileNavUpdatePillText) {
        els.mobileNavUpdatePillText.textContent = state.status === 'READY_TO_INSTALL'
          ? 'Restart & Install Update'
          : `New Update v${state.updateInfo?.version || ''}`;
      }
    } else {
      els.mobileNavUpdatePill.classList.add('hidden');
    }
  }

  // Update Modal Fields
  if (els.updateCurrentVersionText) {
    els.updateCurrentVersionText.textContent = `v${state.currentVersion}`;
  }
  if (els.updateNewVersionText) {
    els.updateNewVersionText.textContent = state.updateInfo?.version ? `v${state.updateInfo.version}` : 'Latest';
  }
  if (els.updateModalTagBadge) {
    els.updateModalTagBadge.textContent = state.updateInfo?.tag || `v${state.updateInfo?.version || ''}`;
  }
  if (els.updatePublishedDateText) {
    els.updatePublishedDateText.textContent = state.updateInfo?.publishedAt
      ? new Date(state.updateInfo.publishedAt).toLocaleDateString()
      : 'Latest';
  }
  if (els.updateReleaseNotesBox && state.updateInfo?.releaseNotes) {
    els.updateReleaseNotesBox.textContent = state.updateInfo.releaseNotes;
  }

  // Modal Progress & Buttons
  if (state.status === 'DOWNLOADING') {
    els.updateProgressContainer?.classList.remove('hidden');
    els.cancelUpdateBtn?.classList.remove('hidden');
    els.startUpdateBtn?.classList.add('hidden');
    els.installUpdateBtn?.classList.add('hidden');

    const pct = state.progress?.percent || 0;
    if (els.updateProgressBar) els.updateProgressBar.style.width = `${pct}%`;
    if (els.updateProgressPercent) els.updateProgressPercent.textContent = `${pct}%`;
    if (els.updateProgressBytes) {
      const mbTransferred = ((state.progress?.transferred || 0) / (1024 * 1024)).toFixed(1);
      const mbTotal = ((state.progress?.total || 0) / (1024 * 1024)).toFixed(1);
      els.updateProgressBytes.textContent = `${mbTransferred} MB / ${mbTotal} MB`;
    }
    if (els.updateProgressSpeed) {
      const kbps = Math.round((state.progress?.bytesPerSecond || 0) / 1024);
      els.updateProgressSpeed.textContent = `${kbps} KB/s`;
    }
    if (els.updateProgressStatusText) {
      els.updateProgressStatusText.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-emerald-600 mr-1.5"></i><span>Downloading update package...</span>';
    }
  } else if (state.status === 'READY_TO_INSTALL') {
    els.updateProgressContainer?.classList.remove('hidden');
    if (els.updateProgressBar) els.updateProgressBar.style.width = '100%';
    if (els.updateProgressPercent) els.updateProgressPercent.textContent = '100%';
    if (els.updateProgressStatusText) {
      els.updateProgressStatusText.innerHTML = '<i class="fa-solid fa-circle-check text-emerald-600 mr-1.5"></i><span>Update package verified and ready!</span>';
    }
    els.cancelUpdateBtn?.classList.add('hidden');
    els.startUpdateBtn?.classList.add('hidden');
    els.installUpdateBtn?.classList.remove('hidden');
  } else {
    els.updateProgressContainer?.classList.add('hidden');
    els.cancelUpdateBtn?.classList.add('hidden');
    els.installUpdateBtn?.classList.add('hidden');
    els.startUpdateBtn?.classList.remove('hidden');
    if (els.startUpdateBtn) {
      els.startUpdateBtn.disabled = false;
      els.startUpdateBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-down mr-1.5"></i><span>Download &amp; Install</span>';
    }
  }

  // Error Banner
  if (state.status === 'ERROR' && state.error) {
    if (els.updateErrorBanner) els.updateErrorBanner.classList.remove('hidden');
    if (els.updateErrorText) els.updateErrorText.textContent = state.error;
  } else {
    if (els.updateErrorBanner) els.updateErrorBanner.classList.add('hidden');
  }
}

function openUpdateModal(forceReinstall = false) {
  if (els.updateModal) {
    els.updateModal.classList.remove('hidden');
  }
  fetchUpdaterStatus().then(state => {
    if (state && (state.status === 'DOWNLOADING')) {
      startUpdaterPolling();
    }
  });
}

function closeUpdateModal() {
  if (els.updateModal) {
    els.updateModal.classList.add('hidden');
  }
}

function startUpdaterPolling() {
  stopUpdaterPolling();
  updaterPollingInterval = setInterval(async () => {
    const fresh = await fetchUpdaterStatus();
    if (fresh && (fresh.status === 'READY_TO_INSTALL' || fresh.status === 'ERROR')) {
      stopUpdaterPolling();
    }
  }, 600);
}

function stopUpdaterPolling() {
  if (updaterPollingInterval) {
    clearInterval(updaterPollingInterval);
    updaterPollingInterval = null;
  }
}

async function checkForUpdatesManual(openOnAvailable = false) {
  if (els.checkUpdateBtn) {
    els.checkUpdateBtn.disabled = true;
    els.checkUpdateBtn.innerHTML = '<i class="fa-solid fa-arrows-rotate fa-spin text-[10px] mr-1"></i><span>Checking...</span>';
  }

  try {
    const res = await fetch('/api/updater/check', { method: 'POST' }).then(r => r.json());
    if (res.success) {
      await fetchUpdaterStatus();
      if (res.updateAvailable) {
        showToast(`Update v${res.latestVersion} is available!`, 'success');
        if (openOnAvailable) {
          openUpdateModal(false);
        }
      } else {
        showToast(`SheetApp is already on the latest version (v${res.currentVersion}).`, 'info');
      }
    } else {
      showToast(res.error || 'Failed to check for updates.', 'error');
      await fetchUpdaterStatus();
    }
  } catch (err) {
    showToast(`Update check error: ${err.message}`, 'error');
    await fetchUpdaterStatus();
  } finally {
    if (els.checkUpdateBtn) {
      els.checkUpdateBtn.disabled = false;
      els.checkUpdateBtn.innerHTML = '<i class="fa-solid fa-arrows-rotate text-[10px] mr-1"></i><span>Check Now</span>';
    }
  }
}

async function startDownloadUpdate() {
  if (els.startUpdateBtn) {
    els.startUpdateBtn.disabled = true;
    els.startUpdateBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1.5"></i><span>Starting download...</span>';
  }
  try {
    const res = await fetch('/api/updater/download', { method: 'POST' }).then(r => r.json());
    if (res.success) {
      showToast('Downloading update installer in background...', 'info');
      startUpdaterPolling();
    } else {
      showToast(res.error || 'Failed to start download.', 'error');
      if (els.startUpdateBtn) {
        els.startUpdateBtn.disabled = false;
        els.startUpdateBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-down mr-1.5"></i><span>Download &amp; Install</span>';
      }
    }
  } catch (err) {
    showToast(`Download error: ${err.message}`, 'error');
    if (els.startUpdateBtn) {
      els.startUpdateBtn.disabled = false;
      els.startUpdateBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-down mr-1.5"></i><span>Download &amp; Install</span>';
    }
  }
}

async function triggerInstallUpdate() {
  if (!confirm('SheetApp will close and the installer will launch to update to the latest version. Continue?')) {
    return;
  }

  if (els.installUpdateBtn) {
    els.installUpdateBtn.disabled = true;
    els.installUpdateBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1.5"></i><span>Launching installer...</span>';
  }
  try {
    const res = await fetch('/api/updater/install', { method: 'POST' }).then(r => r.json());
    if (res.success) {
      showToast('Installer launched! SheetApp will now close to update.', 'success');
      setTimeout(() => {
        document.body.innerHTML = `
          <div style="font-family: 'Segoe UI', system-ui, sans-serif; height: 100vh; display: flex; align-items: center; justify-content: center; background: #0B0F19; color: #E6EDF3; text-align: center; padding: 20px;">
            <div>
              <div style="font-size: 40px; margin-bottom: 16px;">🔄</div>
              <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 8px;">Installing Update...</h2>
              <p style="color: #94A3B8; font-size: 13px;">Please follow the setup window on your screen to complete the update.</p>
            </div>
          </div>
        `;
      }, 800);
    } else {
      showToast(res.error || 'Failed to launch installer.', 'error');
      if (els.installUpdateBtn) {
        els.installUpdateBtn.disabled = false;
        els.installUpdateBtn.innerHTML = '<i class="fa-solid fa-arrows-rotate mr-1.5"></i><span>Restart &amp; Install Now</span>';
      }
    }
  } catch (err) {
    showToast(`Install error: ${err.message}`, 'error');
  }
}

async function cancelDownloadUpdate() {
  try {
    await fetch('/api/updater/cancel', { method: 'POST' });
    stopUpdaterPolling();
    await fetchUpdaterStatus();
    showToast('Update download cancelled.', 'info');
  } catch (err) {
    showToast('Failed to cancel download', 'error');
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[m]);
}
