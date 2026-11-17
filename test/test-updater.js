const assert = require('assert');
const updater = require('../src/services/updater');

console.log('--- SheetApp Auto-Updater Unit Tests ---');

// 1. Semver Parsing
console.log('1. Testing parseSemver...');
assert.deepStrictEqual(updater.parseSemver('1.3.6'), [1, 3, 6]);
assert.deepStrictEqual(updater.parseSemver('v1.3.6'), [1, 3, 6]);
assert.deepStrictEqual(updater.parseSemver('V2.0.1-beta'), [2, 0, 1]);
assert.deepStrictEqual(updater.parseSemver('1.5'), [1, 5, 0]);
assert.deepStrictEqual(updater.parseSemver(''), [0, 0, 0]);
assert.deepStrictEqual(updater.parseSemver(null), [0, 0, 0]);
console.log('   OK: parseSemver passes all cases.');

// 2. Semver Comparison
console.log('2. Testing compareSemver...');
assert.strictEqual(updater.compareSemver('1.3.7', '1.3.6'), 1);
assert.strictEqual(updater.compareSemver('1.3.6', '1.3.7'), -1);
assert.strictEqual(updater.compareSemver('1.3.6', '1.3.6'), 0);
assert.strictEqual(updater.compareSemver('v2.0.0', '1.9.9'), 1);
assert.strictEqual(updater.compareSemver('1.3.6', 'v1.3.6'), 0);
assert.strictEqual(updater.compareSemver('1.3.6', '1.3.6-rc1'), 0);
console.log('   OK: compareSemver passes all cases.');

// 3. isNewerVersion
console.log('3. Testing isNewerVersion...');
assert.strictEqual(updater.isNewerVersion('1.3.7', '1.3.6'), true);
assert.strictEqual(updater.isNewerVersion('v1.4.0', '1.3.6'), true);
assert.strictEqual(updater.isNewerVersion('1.3.6', '1.3.6'), false);
assert.strictEqual(updater.isNewerVersion('1.3.5', '1.3.6'), false);
assert.strictEqual(updater.isNewerVersion('1.1.0', '1.3.6'), false);
console.log('   OK: isNewerVersion passes all cases.');

// 4. Installer Asset Finder
console.log('4. Testing findInstallerAsset...');
const mockAssets = [
  { id: 1, name: 'source.zip', url: 'https://api.github.com/assets/1' },
  { id: 2, name: 'SheetApp-1.3.6-Portable-x64.exe', url: 'https://api.github.com/assets/2' },
  { id: 3, name: 'SheetApp-1.3.6-Windows-x64.exe', url: 'https://api.github.com/assets/3' },
  { id: 4, name: 'SheetApp.exe', url: 'https://api.github.com/assets/4' }
];

const selected = updater.findInstallerAsset(mockAssets);
assert.strictEqual(selected.id, 3, 'Should select NSIS Windows setup executable');

const fallbackAssets = [
  { id: 10, name: 'SheetApp.zip' },
  { id: 11, name: 'SheetApp.exe' }
];
const fallbackSelected = updater.findInstallerAsset(fallbackAssets);
assert.strictEqual(fallbackSelected.id, 11, 'Should fallback to any .exe asset');

assert.strictEqual(updater.findInstallerAsset([]), null);
assert.strictEqual(updater.findInstallerAsset(null), null);
console.log('   OK: findInstallerAsset prioritizes Windows setup executables.');

// 5. GitHub Config Defaults
console.log('5. Testing getGitHubConfig...');
const ghConfig = updater.getGitHubConfig();
assert.ok(ghConfig.owner, 'Should have repository owner');
assert.ok(ghConfig.repo, 'Should have repository name');
assert.strictEqual(typeof ghConfig.token, 'string');
console.log(`   OK: Default target configured for ${ghConfig.owner}/${ghConfig.repo}`);

console.log('==============================================');
console.log('  ALL UPDATER UNIT TESTS PASSED CLEANLY!       ');
console.log('==============================================');
