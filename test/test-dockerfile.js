/* ══════════════════════════════════════
   Dockerfile / Production install path tests

   Regression coverage for the production container build. Review 0003
   caught that a `prepare: husky` script combined with `npm ci --production`
   breaks `docker build` because husky is a devDependency and is therefore
   absent in the production install. The Dockerfile must either skip
   lifecycle scripts (`--ignore-scripts`) or install dev deps first and
   prune later. These tests assert the static invariants that protect the
   production install path so the failure cannot silently come back.
   ══════════════════════════════════════ */
const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..');
const dockerfile = fs.readFileSync(path.join(repoRoot, 'Dockerfile'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));

let passed = 0;
let failed = 0;
const failures = [];
function assert(cond, msg) {
  if (cond) passed++;
  else { failed++; failures.push(msg); console.error('  FAIL: ' + msg); }
}
function section(n) { console.log('\n── ' + n + ' ──'); }

/* Extract every `RUN npm ci ...` line from the Dockerfile. We only care
   about npm install commands; any other RUN steps are irrelevant. */
function npmCiLines(text) {
  return text.split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => /^RUN\s+npm\s+(ci|install|i)\b/.test(l));
}

function isProductionInstall(line) {
  return /--production\b/.test(line) || /--omit[= ]dev\b/.test(line) || /--only[= ]prod/.test(line);
}

function ignoresScripts(line) {
  return /--ignore-scripts\b/.test(line);
}

function devDependencyNames(pkgJson) {
  return Object.keys(pkgJson.devDependencies || {});
}

/* The prepare script references a tool name. Determine whether that tool
   is a dev-only dependency (and therefore absent from a production
   install). We look at the first token of the script string and at any
   bare command words; if any of them match a devDependency name, the
   prepare script needs dev deps and must NOT run during a production
   install. */
function prepareNeedsDev(pkgJson) {
  const prepare = pkgJson.scripts && pkgJson.scripts.prepare;
  if (!prepare) return false;
  const devNames = new Set(devDependencyNames(pkgJson));
  const prodNames = new Set(Object.keys(pkgJson.dependencies || {}));
  const tokens = prepare.split(/[\s;&|]+/).filter(Boolean);
  for (const tok of tokens) {
    if (devNames.has(tok) && !prodNames.has(tok)) return true;
  }
  return false;
}

function testDockerfileHasProductionInstall() {
  section('Dockerfile contains at least one production npm install step');
  const lines = npmCiLines(dockerfile);
  assert(lines.length > 0, 'Dockerfile has a RUN npm ci/install step');
  const prodLines = lines.filter(isProductionInstall);
  assert(prodLines.length > 0, 'at least one RUN npm install line omits dev dependencies');
}

function testProductionInstallSkipsDevOnlyPrepareScript() {
  section('production install must skip lifecycle scripts when prepare needs dev deps (regression for Dockerfile:4)');
  const lines = npmCiLines(dockerfile);
  const prodLines = lines.filter(isProductionInstall);
  if (!prepareNeedsDev(pkg)) {
    // If prepare doesn't need dev deps, the constraint is vacuous; pass
    // explicitly so the test still records intent.
    assert(true, 'prepare script does not reference a dev-only tool; no constraint');
    return;
  }
  // prepare references a dev-only tool, so every production install
  // line MUST either disable scripts or otherwise avoid invoking it.
  for (const line of prodLines) {
    assert(
      ignoresScripts(line),
      'production install must include --ignore-scripts so dev-only prepare hook cannot fail the build: ' + line,
    );
  }
}

function testPreparePinnedToDevOnlyTool() {
  section('package.json prepare script remains pinned (review 0002 made it strict, review 0003 made the Docker side compatible)');
  const prepare = pkg.scripts && pkg.scripts.prepare;
  assert(typeof prepare === 'string' && prepare.length > 0, 'scripts.prepare is set');
  assert(!/\|\|\s*true\b/.test(prepare || ''), 'prepare does not silently swallow failures with `|| true`');
}

function testDockerfileCopiesPackageManifestsFirst() {
  section('Dockerfile copies package manifests before running npm ci (layer caching + integrity)');
  const lines = dockerfile.split(/\r?\n/).map(l => l.trim());
  let copyIdx = -1;
  let runIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (copyIdx < 0 && /^COPY\s+package\*?\.json/.test(lines[i])) copyIdx = i;
    if (runIdx < 0 && /^RUN\s+npm\s+(ci|install|i)\b/.test(lines[i])) runIdx = i;
  }
  assert(copyIdx >= 0, 'COPY of package*.json present');
  assert(runIdx >= 0, 'RUN npm install present');
  assert(copyIdx < runIdx, 'package manifests copied before npm install');
}

async function main() {
  testDockerfileHasProductionInstall();
  testProductionInstallSkipsDevOnlyPrepareScript();
  testPreparePinnedToDevOnlyTool();
  testDockerfileCopiesPackageManifestsFirst();

  console.log('\n══════════════════════════════════');
  console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    console.log('\nFailures:');
    failures.forEach(f => console.log('  ✗ ' + f));
  }
  console.log('══════════════════════════════════');
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
