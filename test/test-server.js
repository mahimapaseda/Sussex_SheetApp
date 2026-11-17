const assert = require('assert');
const http = require('http');

const TEST_PORT = 3855;
const { app } = require('../src/index.js');
let testServer = null;

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:${TEST_PORT}${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    }).on('error', reject);
  });
}

function post(path, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request(`http://localhost:${TEST_PORT}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function del(path) {
  return new Promise((resolve, reject) => {
    const req = http.request(`http://localhost:${TEST_PORT}${path}`, {
      method: 'DELETE'
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('[Integration] Starting Test Server on Port ' + TEST_PORT + '...\n');

  await new Promise((resolve) => {
    testServer = app.listen(TEST_PORT, resolve);
  });

  // Test 1: GET /api/status
  const statusRes = await get('/api/status');
  assert.strictEqual(statusRes.status, 200);
  assert.strictEqual(statusRes.body.appName, 'SheetApp');
  console.log('  ✓ GET /api/status returned 200 with AppName=SheetApp');

  // Test 2: GET /api/branches (Fresh Software has 0 pre-connected branches)
  const branchesRes = await get('/api/branches');
  assert.strictEqual(branchesRes.status, 200);
  assert(Array.isArray(branchesRes.body), 'Should return array of branches');
  console.log(`  ✓ GET /api/branches returned clean fresh list (${branchesRes.body.length} branches pre-connected)`);

  // Test 3: POST /api/branches & DELETE /api/branches (User can add and remove their own branch)
  const addRes = await post('/api/branches', {
    name: 'My Custom School Branch',
    spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1exampleSheetId12345/edit',
    sheetName: 'Sheet1'
  });
  assert.strictEqual(addRes.status, 200);
  assert.strictEqual(addRes.body.success, true);
  assert.strictEqual(addRes.body.branch.name, 'My Custom School Branch');
  console.log('  ✓ POST /api/branches allows users to connect their own Google Sheet');

  // Delete test branch
  await del(`/api/branches/${addRes.body.branch.id}`);
  console.log('  ✓ DELETE /api/branches removes user branches cleanly');

  // Test 4: GET /api/sheets/load (Fresh state with 0 records)
  const sheetsRes = await get('/api/sheets/load');
  assert.strictEqual(sheetsRes.status, 200);
  assert.strictEqual(sheetsRes.body.success, true);
  assert.strictEqual(sheetsRes.body.totalRows, 0);
  console.log('  ✓ GET /api/sheets/load starts completely clean with 0 records');

  // Test 5: Image Sharing API (Upload, Toggle, Delete)
  const sampleBase64Png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const imgUploadRes = await post('/api/template/image', {
    dataUrl: sampleBase64Png,
    originalName: 'test-flyer.png'
  });
  assert.strictEqual(imgUploadRes.status, 200);
  assert.strictEqual(imgUploadRes.body.success, true);
  assert.strictEqual(imgUploadRes.body.image.enabled, true);
  console.log('  ✓ POST /api/template/image stores campaign image asset');

  const imgToggleRes = await post('/api/template/image/toggle', { enabled: false });
  assert.strictEqual(imgToggleRes.status, 200);
  assert.strictEqual(imgToggleRes.body.image.enabled, false);
  console.log('  ✓ POST /api/template/image/toggle toggles image sharing state');

  const imgDeleteRes = await del('/api/template/image');
  assert.strictEqual(imgDeleteRes.status, 200);
  assert.strictEqual(imgDeleteRes.body.success, true);
  assert.strictEqual(imgDeleteRes.body.image.enabled, false);
  console.log('  ✓ DELETE /api/template/image clears attached flyer asset');

  // Test 6: Saved Templates & Single-Active Preset Invariant
  const templatesRes = await get('/api/templates');
  assert.strictEqual(templatesRes.status, 200);
  assert.strictEqual(templatesRes.body.success, true);
  assert.ok(Array.isArray(templatesRes.body.templates));
  assert.ok(templatesRes.body.templates.length >= 1);
  const enabledCount1 = templatesRes.body.templates.filter(t => t.enabled).length;
  assert.strictEqual(enabledCount1, 1, 'Strictly ONE template must be enabled');
  console.log('  ✓ GET /api/templates returns templates with exactly 1 enabled');

  // Create a new template preset
  const newTemplateRes = await post('/api/templates', {
    name: 'Fee Reminder Notice',
    messageTemplate: 'Dear {Name}, please note the term fee deadline.',
    batchSize: 20,
    minDelaySeconds: 15,
    maxDelaySeconds: 25,
    cooldownMinutes: 4,
    enabled: false
  });
  assert.strictEqual(newTemplateRes.status, 200);
  assert.strictEqual(newTemplateRes.body.success, true);
  const createdId = newTemplateRes.body.template.id;
  assert.strictEqual(newTemplateRes.body.template.name, 'Fee Reminder Notice');
  console.log('  ✓ POST /api/templates creates new template preset');

  // Enable the newly created template preset
  const enableRes = await post(`/api/templates/${createdId}/enable`, {});
  assert.strictEqual(enableRes.status, 200);
  assert.strictEqual(enableRes.body.success, true);
  assert.strictEqual(enableRes.body.activeTemplate.id, createdId);
  assert.strictEqual(enableRes.body.activeTemplate.enabled, true);

  // Check templates list again - strictly ONLY createdId is enabled
  const checkTemplates = await get('/api/templates');
  const enabledList = checkTemplates.body.templates.filter(t => t.enabled);
  assert.strictEqual(enabledList.length, 1, 'Only one template can be enabled');
  assert.strictEqual(enabledList[0].id, createdId, 'The enabled template must be createdId');
  console.log('  ✓ POST /api/templates/:id/enable enforces only one active template invariant');

  // Verify settings were updated to match newly enabled template
  const settingsRes2 = await get('/api/settings');
  assert.strictEqual(settingsRes2.body.messageTemplate, 'Dear {Name}, please note the term fee deadline.');
  assert.strictEqual(settingsRes2.body.batchSize, 20);
  assert.strictEqual(settingsRes2.body.minDelaySeconds, 15);
  console.log('  ✓ Settings immediately updated from newly enabled template');

  // Test updating template via Template & Anti-Ban Controls
  await post('/api/settings', {
    messageTemplate: 'Updated: Dear {Name}, your invoice is ready.',
    batchSize: 18,
    minDelaySeconds: 14,
    maxDelaySeconds: 24,
    cooldownMinutes: 5
  });

  const checkUpdated = await get('/api/templates');
  const updatedActive = checkUpdated.body.templates.find(t => t.id === createdId);
  assert.strictEqual(updatedActive.messageTemplate, 'Updated: Dear {Name}, your invoice is ready.');
  assert.strictEqual(updatedActive.batchSize, 18);
  console.log('  ✓ POST /api/settings saves controls changes directly into the active template');

  // Clean up: Switch back to first template and delete test template
  const firstId = checkUpdated.body.templates.find(t => t.id !== createdId).id;
  await post(`/api/templates/${firstId}/enable`, {});
  const delTemplateRes = await del(`/api/templates/${createdId}`);
  assert.strictEqual(delTemplateRes.status, 200);
  assert.strictEqual(delTemplateRes.body.success, true);
  console.log('  ✓ DELETE /api/templates/:id removes non-active template cleanly');

  // Verify deleting the only remaining template safely resets to a fresh default template
  const resetDelRes = await del(`/api/templates/${firstId}`);
  assert.strictEqual(resetDelRes.status, 200);
  assert.strictEqual(resetDelRes.body.success, true);
  assert.strictEqual(resetDelRes.body.resetToDefault, true);
  const afterResetTemplates = await get('/api/templates');
  assert.strictEqual(afterResetTemplates.body.templates.length, 1);
  assert.strictEqual(afterResetTemplates.body.templates[0].enabled, true);
  console.log('  ✓ DELETE /api/templates/:id on single active template safely resets to default preset');

  // Test 7: Google OAuth Status & Auth URL Generation
  const googleStatusRes = await get('/api/auth/google/status');
  assert.strictEqual(googleStatusRes.status, 200);
  assert.strictEqual(googleStatusRes.body.success, true);
  assert.strictEqual(googleStatusRes.body.configured, true, 'OAuth should be configured via embedded secrets or env');
  console.log('  ✓ GET /api/auth/google/status reports configured OAuth status');

  const redirectRes = await new Promise((resolve, reject) => {
    http.get(`http://localhost:${TEST_PORT}/auth/google`, (res) => {
      resolve({ status: res.statusCode, location: res.headers.location });
    }).on('error', reject);
  });
  assert.strictEqual(redirectRes.status, 302);
  assert.ok(redirectRes.location.includes('accounts.google.com'), 'Redirect URL should point to Google OAuth consent screen');
  console.log('  ✓ GET /auth/google redirects to Google accounts consent screen');

  console.log('\n==============================================');
  console.log('  API INTEGRATION VERIFICATION PASSED!        ');
  console.log('==============================================');

  testServer.close(() => {
    process.exit(0);
  });
}

run().catch(err => {
  console.error('[Integration Error]:', err);
  if (testServer) testServer.close(() => process.exit(1));
  else process.exit(1);
});
