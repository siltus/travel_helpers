/* ══════════════════════════════════════
   ZTL / LEZ Restricted Zones
   ══════════════════════════════════════ */
const ZTL_DATA = {
  IT: {
    name: 'ZTL (Zona Traffico Limitato)',
    severity: 'high',
    description: 'Camera-enforced restricted traffic zones in most Italian city centers. Fines €80-300+ per violation, often arriving months later.',
    cities: [
      { city: 'Florence', zone: 'Historic center', hours: 'Thu-Sat 7:30-20:00, other days 7:30-16:00 / 19:30', tip: 'Ask hotel to register your plate BEFORE entering' },
      { city: 'Rome', zone: 'Centro Storico', hours: 'Mon-Fri 6:30-18:00, Sat 14:00-18:00', tip: 'Tridente zone has different hours' },
      { city: 'Milan', zone: 'Area C', hours: 'Mon-Fri 7:30-19:30', tip: '€5/day congestion charge + separate Area B LEZ' },
      { city: 'Bologna', zone: 'City center', hours: '7:00-20:00 daily', tip: 'Very strictly enforced' },
      { city: 'Pisa', zone: 'Historic center', hours: 'Mon-Fri 7:00-20:00, Sat 10:00-20:00', tip: 'Park outside and walk to the tower' },
    ],
    howToAvoid: [
      'Park outside the ZTL and walk or take public transport',
      'Ask your hotel if they can register your license plate',
      'Look for ZTL signs with camera symbols',
      'Use GPS apps like Waze that warn about ZTL zones',
      'Rental car companies will forward fines + admin fee',
    ],
  },
  DE: {
    name: 'Umweltzone (Low Emission Zone)',
    severity: 'medium',
    description: 'Environmental zones requiring green emission sticker in many city centers.',
    cities: [
      { city: 'Berlin', zone: 'Inside S-Bahn ring', hours: 'Always', tip: 'Green sticker required' },
      { city: 'Munich', zone: 'Inside Mittlerer Ring', hours: 'Always', tip: 'Green sticker required' },
      { city: 'Cologne', zone: 'City center', hours: 'Always', tip: 'Green sticker required' },
    ],
    howToAvoid: [
      'Buy green Umweltplakette online or at TÜV or DEKRA before entering',
      'Most rental cars already have one - check the windshield',
      'Fine is €80 without valid sticker',
    ],
  },
  FR: {
    name: "Crit'Air (Low Emission Zone)",
    severity: 'medium',
    description: "Crit'Air vignette required in major cities during pollution peaks and permanently in some zones.",
    cities: [
      { city: 'Paris', zone: 'Inside A86 ring', hours: 'Mon-Fri 8:00-20:00', tip: "Crit'Air sticker mandatory" },
      { city: 'Lyon', zone: 'City center', hours: 'Permanent ZFE zone', tip: 'Expanding zone' },
      { city: 'Strasbourg', zone: 'Eurometropole', hours: 'Permanent', tip: 'Required since 2023' },
    ],
    howToAvoid: [
      "Order Crit'Air sticker online at certificat-air.gouv.fr (€3.72 + shipping)",
      'Takes 1-3 weeks to arrive - order before your trip!',
      'Most rental cars already have one',
      'Fine is €68 without valid sticker',
    ],
  },
  GB: {
    name: 'ULEZ / Congestion Charge',
    severity: 'medium',
    description: 'London has both a Congestion Charge (£15/day) and ULEZ (£12.50/day for non-compliant vehicles).',
    cities: [
      { city: 'London', zone: 'ULEZ: all Greater London', hours: 'Always', tip: 'Check vehicle compliance at tfl.gov.uk/ulez' },
      { city: 'London', zone: 'Congestion Charge: Zone 1', hours: 'Mon-Fri 7:00-18:00, Sat-Sun 12:00-18:00', tip: 'Pay by midnight or £160 fine' },
      { city: 'Birmingham', zone: 'Clean Air Zone', hours: 'Always', tip: '£8/day for non-compliant' },
    ],
    howToAvoid: [
      'Most modern rental cars are ULEZ compliant',
      'Pay congestion charge online at tfl.gov.uk by midnight',
      'Consider not driving in London at all - the Tube is better',
    ],
  },
  BE: {
    name: 'LEZ (Low Emission Zone)',
    severity: 'low',
    description: 'Low emission zones in Brussels, Antwerp, and Ghent requiring registration.',
    cities: [
      { city: 'Brussels', zone: 'Region', hours: 'Always', tip: 'Register at lez.brussels' },
      { city: 'Antwerp', zone: 'City center', hours: 'Always', tip: 'Register at slimnaarantwerpen.be' },
      { city: 'Ghent', zone: 'City center', hours: 'Always', tip: 'Register at stad.gent/lez' },
    ],
    howToAvoid: [
      'Register your vehicle online BEFORE entering (free for compliant cars)',
      'Belgian-registered rental cars are auto-registered',
      'Foreign rental cars need manual registration',
    ],
  },
  NL: {
    name: 'Milieuzone (Environmental Zone)',
    severity: 'low',
    description: 'Environmental zones in some cities restricting older diesel vehicles.',
    cities: [
      { city: 'Amsterdam', zone: 'City center', hours: 'Always', tip: 'Diesel Euro 4 or older banned' },
      { city: 'Rotterdam', zone: 'City center', hours: 'Always', tip: 'Check milieuzones.nl' },
    ],
    howToAvoid: [
      'Most rental cars are new enough to comply',
      'No registration needed - enforcement is by camera',
    ],
  },
};

let ztlInitialized = false;

function initZtl() {
  ztlInitialized = true;
  renderZtl();
}

function renderZtl() {
  const code = getSelectedCountry();
  const data = ZTL_DATA[code];
  const content = document.getElementById('ztl-content');
  if (!content) return;

  if (!data) {
    const countryName = typeof COUNTRIES !== 'undefined' && COUNTRIES[code] ? COUNTRIES[code].name : 'this country';
    content.innerHTML = '<div class="embassy-card"><div class="embassy-city">✅ No restricted traffic zones in ' + countryName + '</div><div class="embassy-note">You usually will not hit major tourist camera-zones here, but always obey local signage and temporary city-center rules.</div></div>';
    return;
  }

  const severityMeta = {
    high: { icon: '🔴', label: 'High risk', className: 'severity-high' },
    medium: { icon: '🟡', label: 'Medium risk', className: 'severity-medium' },
    low: { icon: '🟢', label: 'Low risk', className: 'severity-low' },
  };
  const severity = severityMeta[data.severity] || severityMeta.low;

  let html = '';
  html += '<div class="embassy-card" style="margin-bottom:1rem">';
  html += '<div class="embassy-city">⚠️ ' + data.name + '</div>';
  html += '<div class="embassy-row ' + severity.className + '">' + severity.icon + ' <strong>' + severity.label + '</strong></div>';
  html += '<div class="embassy-note" style="color:var(--text);font-style:normal">' + data.description + '</div>';
  html += '</div>';

  html += '<div class="road-section">';
  html += '<div class="road-section-title">🏙️ Common zones</div>';
  data.cities.forEach(item => {
    html += '<div class="ztl-city">';
    html += '<div class="ztl-city-name">' + item.city + '</div>';
    html += '<div class="ztl-city-zone">Zone: ' + item.zone + '</div>';
    html += '<div class="ztl-city-hours">Hours: ' + item.hours + '</div>';
    html += '<div class="ztl-city-tip">Tip: ' + item.tip + '</div>';
    html += '</div>';
  });
  html += '</div>';

  html += '<div class="road-section">';
  html += '<div class="road-section-title">🛡️ How to avoid fines</div>';
  html += '<ul class="road-rules">';
  data.howToAvoid.forEach(item => {
    html += '<li>' + item + '</li>';
  });
  html += '</ul></div>';

  content.innerHTML = html;
}
