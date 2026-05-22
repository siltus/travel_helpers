#!/usr/bin/env node
/* Discovers and runs every test-*.js file in this directory in sequence.
   Each test file is its own process so c8 (which sets NODE_V8_COVERAGE
   in our environment) can aggregate coverage across them. */
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

const testDir = __dirname;
const files = fs.readdirSync(testDir)
  .filter(f => f.startsWith('test-') && f.endsWith('.js'))
  .sort();

let totalFailed = 0;
for (const f of files) {
  console.log('\n==== ' + f + ' ====');
  const r = spawnSync(process.execPath, [path.join(testDir, f)], { stdio: 'inherit' });
  if (r.status !== 0) {
    totalFailed++;
    console.error('FAILED: ' + f);
  }
}

console.log('\n--------------------------------');
console.log(files.length + ' test files run, ' + totalFailed + ' failed');
process.exit(totalFailed > 0 ? 1 : 0);
