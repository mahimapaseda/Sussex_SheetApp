/**
 * SheetApp Core Unit Tests
 * Verifies Phone Sanitizer, Template Parser, Column Identification, Ledger, and Rate Limit Risk Engine
 */

const assert = require('assert');
const { sanitizePhoneNumber } = require('../src/services/phoneNormalizer');
const { extractTokens, interpolateTemplate } = require('../src/services/templateParser');
const { identifyColumns } = require('../src/services/googleSheets');
const { calculateRiskLevel } = require('../src/services/batchEngine');
const ledger = require('../src/services/ledger');

console.log('==============================================');
console.log('   SheetApp Unit & Compliance Test Suite      ');
console.log('==============================================\n');

let passedTests = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    Error: ${err.message}`);
    process.exit(1);
  }
}

// 1. Phone Normalizer Tests
console.log('[Test Group 1] Sri Lankan & International Phone Normalization');

runTest('Sanitize 0771234567 -> 94771234567', () => {
  const res = sanitizePhoneNumber('0771234567', '94');
  assert.strictEqual(res.isValid, true);
  assert.strictEqual(res.normalized, '94771234567');
  assert.strictEqual(res.formatted, '+94771234567');
});

runTest('Sanitize +94 71 234 5678 with spaces -> 94712345678', () => {
  const res = sanitizePhoneNumber('+94 71 234 5678', '94');
  assert.strictEqual(res.isValid, true);
  assert.strictEqual(res.normalized, '94712345678');
});

runTest('Sanitize 076-987-6543 with hyphens -> 94769876543', () => {
  const res = sanitizePhoneNumber('076-987-6543', '94');
  assert.strictEqual(res.isValid, true);
  assert.strictEqual(res.normalized, '94769876543');
});

runTest('Sanitize 785551234 without leading zero -> 94785551234', () => {
  const res = sanitizePhoneNumber('785551234', '94');
  assert.strictEqual(res.isValid, true);
  assert.strictEqual(res.normalized, '94785551234');
});

runTest('Reject invalid or short phone string', () => {
  const res = sanitizePhoneNumber('1234', '94');
  assert.strictEqual(res.isValid, false);
});

// 2. Template Parser Tests
console.log('\n[Test Group 2] Dynamic Template Token Interpolation');

runTest('Extract unique tokens from template string', () => {
  const tpl = 'Hello {Name}, your branch is {Branch}. Total: {Amount} for {Name}.';
  const tokens = extractTokens(tpl);
  assert.deepStrictEqual(tokens, ['Name', 'Branch', 'Amount']);
});

runTest('Interpolate {Tokens} case-insensitively with row data', () => {
  const tpl = 'Dear {name}, your balance at {Branch} is {Balance}.';
  const row = { Name: 'Kavindu Perera', Branch: 'Ambalangoda', Balance: 'LKR 4,500' };
  const output = interpolateTemplate(tpl, row);
  assert.strictEqual(output, 'Dear Kavindu Perera, your balance at Ambalangoda is LKR 4,500.');
});

runTest('Interpolate {{DoubleBracket}} tokens properly', () => {
  const tpl = 'Hello {{Student Name}}, notice for {{Topic}}.';
  const row = { 'Student Name': 'Dinithi Silva', 'Topic': 'Annual Concert' };
  const output = interpolateTemplate(tpl, row);
  assert.strictEqual(output, 'Hello Dinithi Silva, notice for Annual Concert.');
});

// 3. Dynamic Column Header Identification
console.log('\n[Test Group 3] Dynamic Column Header Mapping');

runTest('Auto-detect Phone and Name columns from noisy headers', () => {
  const headers = ['Registration No', 'Student Name', 'Father T.P.', 'Grade', 'WhatsApp Status'];
  const cols = identifyColumns(headers);
  assert.strictEqual(cols.nameColumn, 'Student Name');
  assert.strictEqual(cols.phoneColumn, 'Father T.P.');
  assert.strictEqual(cols.statusColumn, 'WhatsApp Status');
});

// 4. Rate-Limit Risk Level Evaluation
console.log('\n[Test Group 4] Anti-Ban Rate Limit & Risk Engine');

runTest('Verify Safe Settings classify as LOW Risk', () => {
  const safeConfig = { minDelaySeconds: 15, batchSize: 15, dailyLimit: 200 };
  const risk = calculateRiskLevel(safeConfig);
  assert.strictEqual(risk.level, 'LOW');
});

runTest('Verify Aggressive Settings classify as HIGH Risk', () => {
  const aggConfig = { minDelaySeconds: 4, batchSize: 45, dailyLimit: 600 };
  const risk = calculateRiskLevel(aggConfig);
  assert.strictEqual(risk.level, 'HIGH');
});

// 5. Ledger Deduplication Tests
console.log('\n[Test Group 5] Deduplication Ledger');

runTest('Record sent item and verify duplicate prevention', () => {
  const testPhone = '9477' + Math.floor(1000000 + Math.random() * 9000000);
  assert.strictEqual(ledger.hasBeenSentToday(testPhone), false);

  ledger.recordSent({
    phone: testPhone,
    name: 'Test Student',
    campaign: 'unit_test',
    status: 'SENT'
  });

  assert.strictEqual(ledger.hasBeenSentToday(testPhone), true);
});

console.log('\n==============================================');
console.log(`  ALL ${passedTests} TESTS PASSED CLEANLY! `);
console.log('==============================================\n');
