/* ══════════════════════════════════════
   Tip Calculator
   ══════════════════════════════════════ */
const TIP_DATA = {
  CZ: {
    restaurant: [10, 15],
    cafe: [0, 10],
    taxi: [0, 10],
    hotel: 'Porter: 20–50 CZK/bag',
    note: 'Round up or leave 10–15%. Hand tip directly to server — don\'t leave on table.',
  },
  PL: {
    restaurant: [10, 10],
    cafe: [0, 10],
    taxi: [0, 10],
    hotel: 'Porter: 5–10 PLN/bag',
    note: 'Leave 10% at restaurants. Check if service charge is included.',
  },
  HU: {
    restaurant: [10, 15],
    cafe: [10, 10],
    taxi: [10, 10],
    hotel: 'Porter: 500–1000 HUF/bag',
    note: '10–15% expected. State amount when paying — don\'t leave cash on table.',
  },
  DE: {
    restaurant: [5, 10],
    cafe: [0, 5],
    taxi: [5, 10],
    hotel: 'Porter: 1–2 EUR/bag',
    note: 'Round up or add 5–10%. Tell server the total when paying ("Stimmt so").',
  },
  AT: {
    restaurant: [5, 10],
    cafe: [0, 5],
    taxi: [5, 10],
    hotel: 'Porter: 1–2 EUR/bag',
    note: 'Similar to Germany. Round up to nearest euro or add 5–10%.',
  },
  IT: {
    restaurant: [0, 10],
    cafe: [0, 0],
    taxi: [0, 5],
    hotel: 'Porter: 1–2 EUR/bag',
    note: 'Cover charge (coperto) is common. Extra tip not expected but appreciated for great service.',
  },
  FR: {
    restaurant: [0, 5],
    cafe: [0, 5],
    taxi: [5, 10],
    hotel: 'Porter: 1–2 EUR/bag',
    note: 'Service is included by law (service compris). Small extra for exceptional service.',
  },
  ES: {
    restaurant: [0, 10],
    cafe: [0, 0],
    taxi: [0, 5],
    hotel: 'Porter: 1 EUR/bag',
    note: 'Not expected. Leave small change at restaurants if satisfied.',
  },
  PT: {
    restaurant: [5, 10],
    cafe: [0, 5],
    taxi: [5, 10],
    hotel: 'Porter: 1 EUR/bag',
    note: '5–10% at restaurants. Round up at cafés.',
  },
  GR: {
    restaurant: [5, 10],
    cafe: [0, 5],
    taxi: [0, 5],
    hotel: 'Porter: 1 EUR/bag',
    note: '5–10% at restaurants, or leave change. Not mandatory.',
  },
  HR: {
    restaurant: [10, 15],
    cafe: [0, 10],
    taxi: [0, 10],
    hotel: 'Porter: 1–2 EUR/bag',
    note: '10–15% at restaurants. Round up at cafés and taxis.',
  },
  NL: {
    restaurant: [5, 10],
    cafe: [0, 5],
    taxi: [5, 10],
    hotel: 'Porter: 1–2 EUR/bag',
    note: 'Service usually included. Round up or add 5–10% for good service.',
  },
  BE: {
    restaurant: [5, 10],
    cafe: [0, 5],
    taxi: [5, 10],
    hotel: 'Porter: 1–2 EUR/bag',
    note: 'Service included in bill. Small extra is appreciated.',
  },
  TR: {
    restaurant: [10, 15],
    cafe: [5, 10],
    taxi: [0, 5],
    hotel: 'Porter: 10–20 TRY/bag',
    note: '10–15% at restaurants. Round up taxis. Tip in local currency.',
  },
  GB: {
    restaurant: [10, 15],
    cafe: [0, 0],
    taxi: [10, 10],
    hotel: 'Porter: £1–2/bag',
    note: '10–12.5% at restaurants. Check if service charge already added.',
  },
  CH: {
    restaurant: [0, 5],
    cafe: [0, 0],
    taxi: [0, 5],
    hotel: 'Porter: 1–2 CHF/bag',
    note: 'Service is included by law. Round up as gesture of appreciation.',
  },
  TH: {
    restaurant: [0, 10],
    cafe: [0, 0],
    taxi: [0, 0],
    hotel: 'Porter: 20–50 THB/bag',
    note: 'Not expected at local places. 10% at upscale restaurants. Round up taxis.',
  },
  JP: {
    restaurant: [0, 0],
    cafe: [0, 0],
    taxi: [0, 0],
    hotel: null,
    note: '⚠ Tipping is NOT customary and may be refused or considered rude.',
  },
  RO: {
    restaurant: [10, 10],
    cafe: [0, 5],
    taxi: [0, 10],
    hotel: 'Porter: 5–10 RON/bag',
    note: '10% at restaurants. Round up at cafés and taxis.',
  },
  BG: {
    restaurant: [10, 10],
    cafe: [0, 5],
    taxi: [0, 10],
    hotel: 'Porter: 2–5 BGN/bag',
    note: '10% at restaurants. Round up elsewhere.',
  },
};

let tipInitialized = false;

function initTip() {
  tipInitialized = true;
  renderTip();
}

function renderTip() {
  const code = getSelectedCountry();
  const data = TIP_DATA[code];
  const c = COUNTRIES[code];
  if (!data) return;

  document.getElementById('tip-currency').textContent = c.currency;
  calculateTips();
}

function calculateTips() {
  const code = getSelectedCountry();
  const data = TIP_DATA[code];
  const c = COUNTRIES[code];
  if (!data) return;

  const bill = parseFloat(document.getElementById('tip-bill').value) || 0;
  const cur = c.currency;
  // Try rounding for zero-decimal currencies
  const noDecimals = ['JPY', 'HUF', 'KRW'].includes(cur);

  function fmt(val) {
    if (noDecimals) return Math.round(val).toLocaleString();
    return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function fmtHomeEquiv(val) {
    if (!val || !loadCachedRates()) return '';
    const refs = ['ILS', 'EUR', 'USD'].filter(r => r !== cur);
    const parts = refs.map(r => {
      const converted = convert(val, cur, r);
      if (isNaN(converted)) return null;
      return `${fmtRate(converted)} ${r}`;
    }).filter(Boolean);
    return parts.length ? `<span class="tip-equiv">(≈ ${parts.join(' · ')})</span>` : '';
  }

  const categories = [
    { key: 'restaurant', label: '🍽️ Restaurant', pct: data.restaurant },
    { key: 'cafe',       label: '☕ Café',       pct: data.cafe },
    { key: 'taxi',       label: '🚕 Taxi',       pct: data.taxi },
  ];

  let html = '';

  categories.forEach(cat => {
    const [lo, hi] = cat.pct;
    html += `<div class="tip-category">`;
    html += `<div class="tip-cat-header">${cat.label}<span class="tip-pct">${lo === hi ? lo + '%' : lo + '–' + hi + '%'}</span></div>`;

    if (bill > 0 && (lo > 0 || hi > 0)) {
      const tipLo = bill * lo / 100;
      const tipHi = bill * hi / 100;
      if (lo === hi) {
        html += `<div class="tip-amount">Tip: ${fmt(tipLo)} ${cur} → Total: ${fmt(bill + tipLo)} ${cur} ${fmtHomeEquiv(bill + tipLo)}</div>`;
      } else {
        html += `<div class="tip-amount">Tip: ${fmt(tipLo)}–${fmt(tipHi)} ${cur} → Total: ${fmt(bill + tipLo)}–${fmt(bill + tipHi)} ${cur} ${fmtHomeEquiv(bill + tipLo)}</div>`;
      }
    } else if (bill > 0 && lo === 0 && hi === 0) {
      html += `<div class="tip-amount">No tip expected</div>`;
    }
    html += `</div>`;
  });

  // Hotel
  if (data.hotel) {
    html += `<div class="tip-category">`;
    html += `<div class="tip-cat-header">🏨 Hotel</div>`;
    html += `<div class="tip-amount">${data.hotel}</div>`;
    html += `</div>`;
  }

  // Note
  html += `<div class="tip-note">💡 ${data.note}</div>`;

  document.getElementById('tip-results').innerHTML = html;
}
