/* ══════════════════════════════════════
   jsdom test helper
   Shared boilerplate for the per-module browser-script test files.
   NOT discovered by run-tests.js (leading underscore → does not match
   the `test-*.js` glob).

   Usage:
     const { loadScripts, makeWindow } = require('./_jsdom-helper.js');
     const win = makeWindow('<div id="x"></div>');
     loadScripts(win, ['url-safety.js', 'countries.js', 'tip.js']);

   Why vm.runInContext: c8 / NODE_V8_COVERAGE attributes coverage by
   the V8 script filename. Loading via <script>el.textContent = src</script>
   produces an anonymous script and c8 cannot instrument it. Loading
   via vm.runInContext(src, ctx, { filename: '/abs/public/foo.js' })
   gives V8 the real on-disk path so coverage attribution works. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { JSDOM } = require('jsdom');

function makeWindow(bodyHtml, opts) {
  opts = opts || {};
  const dom = new JSDOM(
    '<!DOCTYPE html><html><body>' + (bodyHtml || '') + '</body></html>',
    { url: opts.url || 'http://localhost/', runScripts: 'outside-only' },
  );
  const win = dom.window;
  // jsdom shims that several browser modules rely on but jsdom 25 lacks
  // or behaves differently than browsers.
  win.Element.prototype.scrollIntoView = function() {};
  win.navigator.clipboard = win.navigator.clipboard || {
    writeText: function() { return Promise.resolve(); },
  };
  // Stash the VM context on the underlying JSDOM instance (NOT the
  // proxied Window — the Window proxy unwraps/re-wraps stored values
  // and the VM context loses its "contextified object" identity).
  _windowToContext.set(win, dom.getInternalVMContext());
  return win;
}

const _windowToContext = new WeakMap();

function loadScripts(win, files) {
  const ctx = _windowToContext.get(win);
  if (!ctx) throw new Error('window not created via makeWindow()');
  files.forEach(rel => {
    const abs = path.resolve(__dirname, '..', 'public', rel);
    const src = fs.readFileSync(abs, 'utf8');
    vm.runInContext(src, ctx, { filename: abs });
  });
}

// Evaluate an expression in the same VM context the scripts were loaded into.
// Needed because `const`/`let` declarations at the top level of a script-mode
// source attach to the global lexical environment but NOT to globalThis, so
// Node code outside the VM cannot read them via `win.COUNTRIES` etc.
function evalIn(win, expr) {
  const ctx = _windowToContext.get(win);
  if (!ctx) throw new Error('window not created via makeWindow()');
  return vm.runInContext(expr, ctx);
}

function counter() {
  const state = { passed: 0, failed: 0, failures: [] };
  function assert(cond, msg) {
    if (cond) state.passed++;
    else { state.failed++; state.failures.push(msg); console.error('  FAIL: ' + msg); }
  }
  function section(name) { console.log('\n── ' + name + ' ──'); }
  function done() {
    console.log('\n══════════════════════════════════');
    console.log('Results: ' + state.passed + ' passed, ' + state.failed + ' failed');
    if (state.failures.length) {
      console.log('\nFailures:');
      state.failures.forEach(f => console.log('  ✗ ' + f));
    }
    console.log('══════════════════════════════════');
    process.exit(state.failed > 0 ? 1 : 0);
  }
  return { assert, section, done, state };
}

module.exports = { makeWindow, loadScripts, evalIn, counter };
