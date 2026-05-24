/* ── Page Navigation ── */
function switchPage(name) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  const btn = document.querySelector('.nav-btn[data-page="' + name + '"]');
  if (btn) btn.classList.add('active');
  localStorage.setItem('travelHelpers_activePage', name);
  if (name === 'exchange' && !exchangeInitialized) initExchange();
  if (name === 'tip' && !tipInitialized) initTip();
  if (name === 'emergency' && !sosInitialized) initSos();
  if (name === 'road' && !roadInitialized) initRoad();
  if (name === 'pharmacy' && !pharmacyInitialized) initPharmacy();
  if (name === 'transit' && !transitInitialized) initTransit();
  if (name === 'payment' && !paymentInitialized) initPayment();
  if (name === 'rental' && !rentalInitialized) initRental();
  if (name === 'ztl' && !ztlInitialized) initZtl();
  if (name === 'meals' && !mealsInitialized) initMeals();
  if (name !== 'qr') stopCamera();
  // Close hamburger menu on mobile
  var nav = document.querySelector('.main-nav');
  if (nav) nav.classList.remove('open');
  var ham = document.getElementById('hamburger');
  if (ham) ham.classList.remove('open');
}

/* ── QR tab visibility ── */
function updateQrTabVisibility() {
  var country = getSelectedCountry();
  var format = QR_COUNTRY_FORMAT[country];
  var btn = document.getElementById('nav-qr');
  if (!btn) return;
  if (format) {
    btn.style.display = '';
    btn.textContent = QR_FORMAT_LABELS[format] || '💳 QR';
  } else {
    btn.style.display = 'none';
    // If currently on QR page and country changed to non-QR, switch away
    if (localStorage.getItem('travelHelpers_activePage') === 'qr') {
      switchPage('exchange');
    }
  }
}

/* ── Mobile menu ── */
function toggleMenu() {
  document.querySelector('.main-nav').classList.toggle('open');
  document.getElementById('hamburger').classList.toggle('open');
}

/* ── Shared helpers ── */
function copyVal(text) {
  navigator.clipboard.writeText(text).then(() => showToast('Copied: ' + text));
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 1500);
}

// Restore last active page on load (must run after all scripts)
document.addEventListener('DOMContentLoaded', function() {
  populateGlobalCountrySelect();
  updateQrTabVisibility();
  var saved = localStorage.getItem('travelHelpers_activePage') || 'exchange';
  // Don't restore to QR page if current country doesn't support it
  if (saved === 'qr' && !QR_COUNTRY_FORMAT[getSelectedCountry()]) saved = 'exchange';
  switchPage(saved);
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
});
