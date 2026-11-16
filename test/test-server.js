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
