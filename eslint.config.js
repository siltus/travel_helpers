/* ESLint flat config for the travel-helpers project.
   - Browser globals for everything under public/
   - Node globals for server.js and test/**
   - Skip coverage output, node_modules, and the cache directory.
   This config keeps the rule surface intentionally small: the team's
   immediate concern is catching unused/undefined references, not
   bikeshedding style. */
const globals = {
  browser: {
    window: 'readonly', document: 'readonly', navigator: 'readonly',
    localStorage: 'readonly', console: 'readonly', fetch: 'readonly',
    setTimeout: 'readonly', clearTimeout: 'readonly',
    setInterval: 'readonly', clearInterval: 'readonly',
    FileReader: 'readonly', Image: 'readonly', URL: 'readonly',
    Event: 'readonly', MouseEvent: 'readonly',
    requestAnimationFrame: 'readonly', cancelAnimationFrame: 'readonly',
    module: 'writable', exports: 'writable',
    // jsQR loaded from /vendor/jsQR.min.js — global at runtime.
    jsQR: 'readonly',
  },
  node: {
    require: 'readonly', module: 'writable', exports: 'writable',
    __dirname: 'readonly', __filename: 'readonly',
    process: 'readonly', console: 'readonly', Buffer: 'readonly',
    setTimeout: 'readonly', clearTimeout: 'readonly',
    setInterval: 'readonly', clearInterval: 'readonly',
    setImmediate: 'readonly', clearImmediate: 'readonly',
    URL: 'readonly', global: 'writable',
  },
};

// Globals defined across the public/ scripts and used by sibling files.
const publicSharedGlobals = {
  // qr-parsers.js
  parseSpayd: 'readonly', parseEpcQr: 'readonly', parseSwissQr: 'readonly',
  detectAndParse: 'readonly', validateIban: 'readonly', escHtml: 'readonly',
  QR_COUNTRY_FORMAT: 'readonly', QR_FORMAT_LABELS: 'readonly',
  // url-safety.js
  safeTelHref: 'readonly', safeMailtoHref: 'readonly', safeHttpHref: 'readonly',
  // countries.js
  COUNTRIES: 'readonly', COUNTRY_LS_KEY: 'readonly',
  populateCountrySelect: 'readonly', setSelectedCountry: 'readonly',
  getSelectedCountry: 'readonly', populateGlobalCountrySelect: 'readonly',
  onGlobalCountryChange: 'readonly', loadCachedRates: 'readonly',
  // exchange.js
  exchangeInitialized: 'writable', initExchange: 'readonly',
  refreshRates: 'readonly', onCurrencyChange: 'readonly',
  renderExchangeTables: 'readonly', eurRates: 'writable',
  rateDate: 'writable', SELECTED_CURRENCY_KEY: 'readonly',
  CURRENCIES: 'readonly', convert: 'readonly', fmtRate: 'readonly',
  // tip.js
  tipInitialized: 'writable', initTip: 'readonly', renderTip: 'readonly',
  calculateTips: 'readonly',
  // emergency.js
  sosInitialized: 'writable', initSos: 'readonly', renderSos: 'readonly',
  EMERGENCY_DATA: 'readonly', fetchEmbassy: 'readonly',
  // road.js
  roadInitialized: 'writable', initRoad: 'readonly', renderRoad: 'readonly',
  // pharmacy.js
  pharmacyInitialized: 'writable', initPharmacy: 'readonly', renderPharmacy: 'readonly',
  // transit.js
  transitInitialized: 'writable', initTransit: 'readonly', renderTransit: 'readonly',
  // payment.js
  paymentInitialized: 'writable', initPayment: 'readonly', renderPayment: 'readonly',
  // spayd.js
  switchSpaydTab: 'readonly', stopCamera: 'readonly', startCamera: 'readonly',
  parseAndShow: 'readonly', parseText: 'readonly', loadExample: 'readonly',
  clearAll: 'readonly', copyAll: 'readonly', handleImageFile: 'readonly',
  // app.js
  switchPage: 'readonly', toggleMenu: 'readonly', updateQrTabVisibility: 'readonly',
  copyVal: 'readonly', showToast: 'readonly',
};

module.exports = [
  {
    ignores: ['node_modules/**', 'coverage/**', 'cache/**', '.aidor/**', '.github/**', 'public/jsqr*', 'public/jsQR*'],
  },
  {
    files: ['public/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: { ...globals.browser, ...publicSharedGlobals },
    },
    rules: {
      'no-unused-vars': ['warn', {
        args: 'none',
        // Script-mode files: function and `let` declarations at the
        // top level are intentional cross-script exports consumed by
        // sibling <script> tags and inline onclick handlers. Restrict
        // the rule to truly-local (nested) declarations.
        vars: 'local',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
      'no-undef': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
    },
  },
  {
    files: ['server.js', 'test/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: globals.node,
    },
    rules: {
      'no-unused-vars': ['warn', {
        args: 'none',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
      'no-undef': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
    },
  },
  {
    files: ['eslint.config.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: globals.node,
    },
  },
];
