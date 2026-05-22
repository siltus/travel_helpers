/* ══════════════════════════════════════
   Emergency Info
   ══════════════════════════════════════ */
const EMERGENCY_DATA = {
  CZ: {
    general: '112', police: '158', ambulance: '155', fire: '150',
    notes: [
      'EU-wide 112 works from any phone',
      'English usually spoken at 112 operators',
      'Pharmacies (lékárna) marked with green cross',
    ],
  },
  PL: {
    general: '112', police: '997', ambulance: '999', fire: '998',
    notes: [
      'EU-wide 112 works from any phone',
      'English may be limited outside major cities',
    ],
  },
  HU: {
    general: '112', police: '107', ambulance: '104', fire: '105',
    notes: [
      'EU-wide 112 works from any phone',
      'English spoken at 112 in Budapest area',
    ],
  },
  DE: {
    general: '112', police: '110', ambulance: '112', fire: '112',
    notes: [
      '112 for fire and ambulance, 110 for police',
      'English usually available at 112',
    ],
  },
  AT: {
    general: '112', police: '133', ambulance: '144', fire: '122',
    notes: [
      'EU-wide 112 works from any phone',
      'Mountain rescue: 140',
    ],
  },
  IT: {
    general: '112', police: '113', ambulance: '118', fire: '115',
    notes: [
      '112 is the unified number (Carabinieri)',
      'Tourist police may be available in major cities',
    ],
  },
  FR: {
    general: '112', police: '17', ambulance: '15', fire: '18',
    notes: [
      'SAMU (15) for medical emergencies',
      'EU-wide 112 works from any phone',
    ],
  },
  ES: {
    general: '112', police: '091', ambulance: '112', fire: '112',
    notes: [
      '112 is the main number for all emergencies',
      'Local police: 092, Guardia Civil: 062',
    ],
  },
  PT: {
    general: '112', police: '112', ambulance: '112', fire: '112',
    notes: [
      '112 is unified for all emergencies',
      'English usually available at 112',
    ],
  },
  GR: {
    general: '112', police: '100', ambulance: '166', fire: '199',
    notes: [
      'Tourist police: 171 (English-speaking)',
      'EU-wide 112 works from any phone',
    ],
  },
  HR: {
    general: '112', police: '192', ambulance: '194', fire: '193',
    notes: [
      'EU-wide 112 works from any phone',
      'English available at 112 operators',
    ],
  },
  NL: {
    general: '112', police: '112', ambulance: '112', fire: '112',
    notes: [
      '112 for all emergencies',
      'Non-emergency police: 0900-8844',
      'English widely spoken',
    ],
  },
  BE: {
    general: '112', police: '101', ambulance: '112', fire: '112',
    notes: [
      '112 for fire/ambulance, 101 for police',
      'Multilingual operators (Dutch/French/English)',
    ],
  },
  TR: {
    general: '112', police: '155', ambulance: '112', fire: '110',
    notes: [
      '112 is the main emergency number',
      'Tourist police available in resort areas',
      'Gendarmerie (rural areas): 156',
    ],
  },
  GB: {
    general: '999', police: '999', ambulance: '999', fire: '999',
    notes: [
      '999 for all emergencies (also 112 works)',
      'Non-emergency police: 101',
      'NHS health advice: 111',
    ],
  },
  CH: {
    general: '112', police: '117', ambulance: '144', fire: '118',
    notes: [
      '112 also works (EU standard)',
      'REGA air rescue: 1414',
      'Poison center: 145',
    ],
  },
  TH: {
    general: '191', police: '191', ambulance: '1669', fire: '199',
    notes: [
      'Tourist police: 1155 (English-speaking, 24/7)',
      'Tourist police is recommended for foreigners',
    ],
  },
  JP: {
    general: '110', police: '110', ambulance: '119', fire: '119',
    notes: [
      '110 for police, 119 for fire/ambulance',
      'English may be limited — ask for interpreter',
      'Japan Helpline: 0570-064-004 (multilingual)',
    ],
  },
  RO: {
    general: '112', police: '112', ambulance: '112', fire: '112',
    notes: [
      '112 is unified for all emergencies',
      'English available at 112 operators',
    ],
  },
  BG: {
    general: '112', police: '166', ambulance: '150', fire: '160',
    notes: [
      'EU-wide 112 works from any phone',
      'English may be limited outside Sofia',
    ],
  },
};

let sosInitialized = false;
let embassyCache = {};
let sosRenderToken = 0;

async function initSos() {
  sosInitialized = true;
  renderSos();
}

async function fetchEmbassy(code) {
  if (embassyCache[code]) return embassyCache[code];
  try {
    const resp = await fetch(`/api/embassy/${code}`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    embassyCache[code] = data;
    return data;
  } catch(_e) {
    return null;
  }
}

async function renderSos() {
  const myToken = ++sosRenderToken;
  const code = getSelectedCountry();
  const data = EMERGENCY_DATA[code];
  const c = COUNTRIES[code];
  if (!data) return;

  const root = document.getElementById('sos-content');
  if (!root) return;
  while (root.firstChild) root.removeChild(root.firstChild);
  const doc = root.ownerDocument || document;

  // Emergency numbers grid
  const grid = doc.createElement('div');
  grid.className = 'sos-grid';
  grid.appendChild(sosCardNode(doc, '🆘', 'General', data.general));
  grid.appendChild(sosCardNode(doc, '🚔', 'Police', data.police));
  grid.appendChild(sosCardNode(doc, '🚑', 'Ambulance', data.ambulance));
  grid.appendChild(sosCardNode(doc, '🚒', 'Fire', data.fire));
  root.appendChild(grid);

  // Notes
  if (data.notes && data.notes.length) {
    const section = doc.createElement('div');
    section.className = 'sos-section';
    const title = doc.createElement('div');
    title.className = 'sos-section-title';
    title.textContent = '📋 Important Notes';
    section.appendChild(title);
    const ul = doc.createElement('ul');
    ul.className = 'sos-notes';
    data.notes.forEach(n => {
      const li = doc.createElement('li');
      li.textContent = n;
      ul.appendChild(li);
    });
    section.appendChild(ul);
    root.appendChild(section);
  }

  // Embassy — loading placeholder
  const embSection = doc.createElement('div');
  embSection.className = 'sos-section';
  const embTitle = doc.createElement('div');
  embTitle.className = 'sos-section-title';
  embTitle.textContent = '🇮🇱 Israeli Embassy';
  embSection.appendChild(embTitle);
  const embContainer = doc.createElement('div');
  embContainer.id = 'embassy-data';
  const loading = doc.createElement('div');
  loading.className = 'exchange-loading';
  loading.style.display = 'block';
  loading.style.padding = '1rem';
  loading.textContent = '⏳ Loading embassy data…';
  embContainer.appendChild(loading);
  embSection.appendChild(embContainer);
  root.appendChild(embSection);

  // MFA emergency line (static, trusted content)
  const mfaSection = doc.createElement('div');
  mfaSection.className = 'sos-section';
  const mfaTitle = doc.createElement('div');
  mfaTitle.className = 'sos-section-title';
  mfaTitle.textContent = '📱 MFA Situation Room';
  mfaSection.appendChild(mfaTitle);
  const mfaCard = doc.createElement('div');
  mfaCard.className = 'embassy-card';
  mfaCard.appendChild(buildEmbassyRow(doc, '📞 ', '+972-2-530-3155', ' (24/7)', { kind: 'tel', value: '+972-2-530-3155' }));
  const appRow = doc.createElement('div');
  appRow.className = 'embassy-row';
  appRow.textContent = '📲 TravIL app — iOS & Android';
  mfaCard.appendChild(appRow);
  mfaSection.appendChild(mfaCard);
  root.appendChild(mfaSection);

  // Disclaimer
  const disc = doc.createElement('div');
  disc.className = 'sos-disclaimer';
  disc.textContent = '⚠ Verify numbers locally. Data is for reference only.';
  root.appendChild(disc);

  // Fetch embassy data async
  const emb = await fetchEmbassy(code);

  // Race safety: bail out if the user has switched country (or re-rendered)
  // in the meantime — otherwise a slow response for a previous country can
  // overwrite the now-current screen with the wrong contact information.
  if (myToken !== sosRenderToken) return;
  if (code !== getSelectedCountry()) return;

  const container = document.getElementById('embassy-data');
  if (!container) return;
  while (container.firstChild) container.removeChild(container.firstChild);

  if (emb && !emb.error) {
    container.appendChild(buildEmbassyCard(doc, emb, c));
  } else {
    const p = doc.createElement('p');
    p.className = 'sos-embassy';
    p.appendChild(doc.createTextNode('Could not load embassy data.'));
    p.appendChild(doc.createElement('br'));
    const a = doc.createElement('a');
    a.href = 'https://embassies.gov.il';
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = 'Search embassies.gov.il';
    p.appendChild(a);
    container.appendChild(p);
  }
}

/* Build the embassy card from untrusted (scraped) data. Every value is set
   via textContent or attributes via DOM APIs — never concatenated into
   innerHTML. tel:, mailto: and http(s):// hrefs are validated and dropped
   when they fail validation, so a scraped page cannot inject javascript: or
   data: URLs. */
function buildEmbassyCard(doc, emb, country) {
  const card = doc.createElement('div');
  card.className = 'embassy-card';

  const city = doc.createElement('div');
  city.className = 'embassy-city';
  if (emb.name) city.textContent = emb.name;
  else city.textContent = 'Embassy of Israel in ' + (emb.city || (country && country.name) || '');
  card.appendChild(city);

  if (emb.address) {
    const row = doc.createElement('div');
    row.className = 'embassy-row';
    row.textContent = '📍 ' + emb.address;
    card.appendChild(row);
  }

  if (Array.isArray(emb.phones)) {
    emb.phones.forEach(p => {
      if (!p || typeof p !== 'object') return;
      const href = safeTelHref(p.number);
      const label = String(p.label || '');
      const num = String(p.number || '');
      if (!href || !num) return;
      card.appendChild(buildEmbassyRow(doc, '📞 ', null, null, { prefix: label + ': ', kind: 'tel', value: num, href, copy: num }));
    });
  }

  if (Array.isArray(emb.emails)) {
    emb.emails.forEach(e => {
      if (!e || typeof e !== 'object') return;
      const href = safeMailtoHref(e.address);
      const label = String(e.label || '');
      const addr = String(e.address || '');
      if (!href || !addr) return;
      card.appendChild(buildEmbassyRow(doc, '✉️ ', null, null, { prefix: label + ': ', kind: 'mailto', value: addr, href, copy: addr }));
    });
  }

  if (emb.hours) {
    const row = doc.createElement('div');
    row.className = 'embassy-row';
    row.textContent = '🕐 ' + emb.hours;
    card.appendChild(row);
  }

  const links = doc.createElement('div');
  links.className = 'embassy-links';
  let appended = false;
  const websiteHref = safeHttpHref(emb.url);
  if (websiteHref) {
    const a = doc.createElement('a');
    a.href = websiteHref;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = '🌐 Website';
    links.appendChild(a);
    appended = true;
  }
  const contactsHref = safeHttpHref(emb.contacts);
  if (contactsHref) {
    if (appended) links.appendChild(doc.createTextNode(' · '));
    const a = doc.createElement('a');
    a.href = contactsHref;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = '📇 Contacts';
    links.appendChild(a);
    appended = true;
  }
  const mapsHref = safeHttpHref(emb.mapsUrl);
  if (mapsHref) {
    if (appended) links.appendChild(doc.createTextNode(' · '));
    const a = doc.createElement('a');
    a.href = mapsHref;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = '🗺️ Directions';
    links.appendChild(a);
    appended = true;
  }
  if (appended) card.appendChild(links);

  return card;
}

/* Build an embassy-row that contains a tel:/mailto: link and an
   optional copy-to-clipboard handler. All strings flow through
   textContent or validated href setters. */
function buildEmbassyRow(doc, leadingText, linkText, trailingText, opts) {
  const row = doc.createElement('div');
  row.className = 'embassy-row';
  if (opts && opts.copy && typeof copyVal === 'function') {
    row.addEventListener('click', function() { copyVal(String(opts.copy)); });
  }
  if (leadingText) row.appendChild(doc.createTextNode(leadingText));
  if (opts && opts.prefix) row.appendChild(doc.createTextNode(opts.prefix));
  if (opts && opts.href) {
    const a = doc.createElement('a');
    a.href = opts.href;
    a.textContent = opts.value;
    row.appendChild(a);
  } else if (linkText) {
    const href = opts && opts.kind === 'tel' ? safeTelHref(linkText)
      : opts && opts.kind === 'mailto' ? safeMailtoHref(linkText)
      : null;
    if (href) {
      const a = doc.createElement('a');
      a.href = href;
      a.textContent = linkText;
      row.appendChild(a);
    } else {
      row.appendChild(doc.createTextNode(linkText));
    }
  }
  if (trailingText) row.appendChild(doc.createTextNode(trailingText));
  return row;
}

function sosCardNode(doc, icon, label, number) {
  const card = doc.createElement('div');
  card.className = 'sos-card';
  const num = String(number == null ? '' : number);
  card.addEventListener('click', function() { if (typeof copyVal === 'function') copyVal(num); });
  const iconEl = doc.createElement('div');
  iconEl.className = 'sos-icon';
  iconEl.textContent = icon;
  card.appendChild(iconEl);
  const lblEl = doc.createElement('div');
  lblEl.className = 'sos-label';
  lblEl.textContent = label;
  card.appendChild(lblEl);
  const numEl = doc.createElement('div');
  numEl.className = 'sos-number';
  numEl.textContent = num;
  card.appendChild(numEl);
  return card;
}

function sosCard(icon, label, number) {
  // legacy string API retained for backwards compatibility; not used
  // by the renderer anymore.
  return sosCardNode(document, icon, label, number).outerHTML;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    buildEmbassyCard,
    buildEmbassyRow,
    sosCardNode,
    // Exposed so tests can reset / inspect render-token + cache state.
    _resetForTesting: function() { embassyCache = {}; sosRenderToken = 0; },
    _getRenderToken: function() { return sosRenderToken; },
  };
}
