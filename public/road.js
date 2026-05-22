/* ══════════════════════════════════════
   Road Rules & Traffic Info
   ══════════════════════════════════════ */
const ROAD_DATA = {
  CZ: {
    speed: { urban: 50, rural: 90, motorway: 130 },
    alcohol: '0.0‰ — zero tolerance',
    rules: [
      'Winter tires mandatory Nov 1 – Mar 31 when conditions require',
      'Reflective vest must be kept in cabin, not trunk',
      'Headlights required at all times',
      'Trams always have priority',
      'Electronic motorway vignette required (edalnice.cz)',
      'On-the-spot fines for traffic violations',
      'Right-hand traffic',
    ],
    signs: [
      { type: 'zone', value: '30', name: 'Zone 30', desc: 'Residential 30 km/h zone — common in city centers' },
      { type: 'info', value: 'P', name: 'Blue zone parking', desc: 'Blue-line zones are residents only; visitors need parking disc or pay' },
      { type: 'warning', value: '◆', name: 'Tram diamond ◆', desc: 'Diamond markings on road warn of tram tracks/priority' },
    ],
  },
  PL: {
    speed: { urban: 50, rural: 90, motorway: 140 },
    alcohol: '0.2‰',
    rules: [
      'Headlights required at all times',
      'Pedestrians have absolute right of way at crosswalks (strictly enforced)',
      'Motorway speed 140 km/h, expressways 120 km/h',
      'Toll motorways — use e-TOLL app or buy tickets at stations',
      'Right-hand traffic',
    ],
    signs: [
      { type: 'info', value: '→', name: 'Green arrow signal', desc: 'Green arrow on traffic light allows right turn on red — must stop first' },
    ],
  },
  HU: {
    speed: { urban: 50, rural: 90, motorway: 130 },
    alcohol: '0.0‰ — zero tolerance',
    rules: [
      'Headlights required outside built-up areas at all times',
      'Electronic motorway vignette required (ematrica.hu)',
      'Reflective vest required in vehicle',
      'Right-hand traffic',
      'Zero tolerance strictly enforced — any alcohol is an offense',
    ],
    signs: [
      { type: 'info', value: 'H', name: 'Blue "H" signs', desc: 'Marks motorway entrance — vignette required beyond this point' },
    ],
  },
  DE: {
    speed: { urban: 50, rural: 100, motorway: '∞ (advisory 130)' },
    alcohol: '0.5‰ (0.0‰ for novices)',
    rules: [
      'No general motorway speed limit — advisory 130 km/h',
      'Umweltzone (low-emission zones) require green sticker in many cities',
      'Rechtsfahrgebot — keep right except when overtaking',
      'Emergency corridor (Rettungsgasse) required in traffic jams',
      'Winter tires mandatory when conditions require',
      'Right-hand traffic',
    ],
    signs: [
      { type: 'zone', value: 'Umwelt', name: 'Umweltzone 🟢', desc: 'Green environmental badge required to enter — buy at TÜV or online' },
      { type: 'end_speed', name: 'End of speed limit ⊘', desc: 'White circle with diagonal lines = no more speed restriction' },
    ],
  },
  AT: {
    speed: { urban: 50, rural: 100, motorway: 130 },
    alcohol: '0.5‰',
    rules: [
      'Motorway vignette required (asfinag.at)',
      'Headlights required during day on some roads',
      'Reflective vest required in vehicle',
      'Winter tires mandatory Nov 1 – Apr 15',
      'Right-hand traffic',
    ],
    signs: [
      { type: 'speed_limit', value: 'IG-L', name: 'IG-L speed limits', desc: 'Variable electronic speed limits on motorways for air quality — strictly enforced' },
    ],
  },
  IT: {
    speed: { urban: 50, rural: 90, motorway: 130 },
    alcohol: '0.5‰ (0.0‰ for novices)',
    rules: [
      'Tolls on most motorways — pay at booths or use Telepass',
      'ZTL (Zona Traffico Limitato) — restricted zones in city centers, cameras enforce',
      'Headlights required outside urban areas',
      'Reflective vest required when exiting vehicle on roadside',
      'Right-hand traffic',
    ],
    signs: [
      { type: 'prohibition', name: 'ZTL ⛔', desc: 'Camera-enforced restricted traffic zone — heavy fines for unauthorized entry' },
      { type: 'info', value: 'P', name: 'Zona disco', desc: 'Time-limited parking with disc required' },
    ],
  },
  FR: {
    speed: { urban: 50, rural: 80, motorway: 130 },
    alcohol: '0.5‰',
    rules: [
      'Rural roads reduced to 80 km/h since 2018',
      'Tolls on most motorways (péage)',
      'Must carry breathalyzer in vehicle (advisory, no fine currently)',
      'Headlights during day recommended, required in poor weather',
      'Crit\'Air sticker required in low-emission zones (Paris, Lyon, etc.)',
      'Right-hand traffic',
    ],
    signs: [
      { type: 'zone', value: "Crit'Air", name: "Crit'Air zones", desc: 'Colored sticker for low-emission zones — order online before trip' },
      { type: 'info', value: 'R', name: 'Rappel', desc: 'Means "reminder" — confirms a previous speed limit still applies' },
    ],
  },
  ES: {
    speed: { urban: 50, rural: 90, motorway: 120 },
    alcohol: '0.5‰ (0.3‰ for novices)',
    rules: [
      'Tolls on some motorways (autopistas), free alternatives (autovías) exist',
      'Reflective vest required when exiting vehicle on roadside',
      'Two warning triangles required in vehicle',
      'Speed cameras very common',
      'Right-hand traffic',
    ],
    signs: [
      { type: 'warning', value: '▲▲', name: 'Two-triangle rule', desc: 'Place warning triangles 50m in front and behind vehicle in breakdown' },
    ],
  },
  PT: {
    speed: { urban: 50, rural: 90, motorway: 120 },
    alcohol: '0.5‰',
    rules: [
      'Electronic tolls (Via Verde) — some toll roads have no booths, register online',
      'Reflective vest required in vehicle',
      'Right-hand traffic',
    ],
    signs: [
      { type: 'info', value: 'SCUT', name: 'SCUT toll roads', desc: 'Former free roads now tolled — electronic payment only, register at border' },
    ],
  },
  GR: {
    speed: { urban: 50, rural: 90, motorway: 130 },
    alcohol: '0.5‰',
    rules: [
      'Tolls on major motorways',
      'Headlights required in tunnels (many on motorways)',
      'Aggressive driving common — stay defensive',
      'Right-hand traffic',
    ],
    signs: [
      { type: 'warning', value: '!', name: 'Island road signs', desc: 'On islands, road markings may be informal — watch for donkeys, narrow roads' },
    ],
  },
  HR: {
    speed: { urban: 50, rural: 90, motorway: 130 },
    alcohol: '0.5‰ (0.0‰ for under 25)',
    rules: [
      'Headlights required during winter months',
      'Motorway tolls — cash, card, or ENC device',
      'Reflective vest required in vehicle',
      'Right-hand traffic',
    ],
    signs: [],
  },
  NL: {
    speed: { urban: 50, rural: 80, motorway: 100 },
    alcohol: '0.5‰',
    rules: [
      'Motorway limit reduced to 100 km/h (6:00–19:00), 130 at night on some sections',
      'Cyclists have extensive right of way — check mirrors before opening doors',
      'No toll roads (except some tunnels)',
      'Right-hand traffic',
    ],
    signs: [
      { type: 'info', value: '🚲', name: 'Fietspad', desc: 'Bike path — never park on or obstruct' },
      { type: 'speed_limit', value: '100', name: '100/130 signs', desc: 'Time-dependent speed limits — check display boards' },
    ],
  },
  BE: {
    speed: { urban: 50, rural: 70, motorway: 120 },
    alcohol: '0.5‰',
    rules: [
      'Low-emission zones (LEZ) in Brussels, Antwerp, Ghent — register online',
      'Priority from right (priorité de droite) applies on many roads',
      'No toll motorways',
      'Right-hand traffic',
    ],
    signs: [
      { type: 'warning', value: '◁', name: 'Priority from right', desc: 'On roads without markings, vehicles from the right have priority — very common' },
    ],
  },
  TR: {
    speed: { urban: 50, rural: 90, motorway: 120 },
    alcohol: '0.5‰ (0.0‰ for commercial)',
    rules: [
      'HGS or OGS transponder required for motorway tolls',
      'Headlights required outside built-up areas',
      'International driving permit recommended',
      'Right-hand traffic',
    ],
    signs: [
      { type: 'warning', value: '!', name: 'Jandarma checkpoints', desc: 'Military police checkpoints on rural roads — stop when signaled' },
    ],
  },
  GB: {
    speed: { urban: '30 mph (48)', rural: '60 mph (97)', motorway: '70 mph (113)' },
    alcohol: '0.8‰ (0.5‰ in Scotland)',
    rules: [
      '⚠ LEFT-HAND TRAFFIC — drive on the left!',
      'Speeds in mph, distances in miles',
      'Roundabouts — give way to traffic from the right',
      'Congestion charge in London (£15/day)',
      'ULEZ in London — check vehicle compliance',
      'No motorway tolls (except M6 Toll)',
    ],
    signs: [
      { type: 'info', value: '⟲', name: 'Mini roundabout ⟲', desc: 'Small painted circle on road — treat as roundabout, give way right' },
      { type: 'end_speed', name: 'National speed limit ⊘', desc: 'White circle with diagonal = national limit applies (varies by road type)' },
    ],
  },
  CH: {
    speed: { urban: 50, rural: 80, motorway: 120 },
    alcohol: '0.5‰',
    rules: [
      'Annual motorway vignette required (CHF 40, valid calendar year)',
      'Headlights required at all times',
      'Tunnels — dipped headlights mandatory',
      'Mountain roads — ascending traffic has priority',
      'Winter tires recommended but not legally mandatory',
      'Right-hand traffic',
    ],
    signs: [
      { type: 'info', value: '⚡', name: 'PostBus priority ⚡', desc: 'Yellow PostBuses have right of way on mountain roads — pull over when horn sounds' },
    ],
  },
  TH: {
    speed: { urban: 80, rural: 90, motorway: 120 },
    alcohol: '0.5‰',
    rules: [
      '⚠ LEFT-HAND TRAFFIC — drive on the left!',
      'International driving permit required',
      'Motorbike helmets mandatory (rarely enforced outside cities)',
      'Road conditions vary greatly outside cities',
      'U-turns are common at divided highways',
    ],
    signs: [
      { type: 'info', value: 'U', name: 'U-turn bays', desc: 'Designated U-turn areas on divided highways — often the only way to reach destinations on opposite side' },
    ],
  },
  JP: {
    speed: { urban: '30–60', rural: 60, motorway: 100 },
    alcohol: '0.0‰ — zero tolerance',
    rules: [
      '⚠ LEFT-HAND TRAFFIC — drive on the left!',
      'International driving permit required (Geneva Convention type only)',
      'Strict zero alcohol — passengers who allow drunk driving also liable',
      'Expressway tolls are expensive — ETC card recommended',
      'Speed cameras (N-system/orbis) common',
    ],
    signs: [
      { type: 'stop_jp', value: '止まれ', name: 'Stop sign 止まれ', desc: 'Inverted red triangle with 止まれ — mandatory stop, strictly enforced' },
      { type: 'prohibition', name: 'No parking 駐車禁止', desc: 'Crossed-out P with Japanese text — illegally parked cars towed quickly' },
    ],
  },
  RO: {
    speed: { urban: 50, rural: 90, motorway: 130 },
    alcohol: '0.0‰ — zero tolerance',
    rules: [
      'Electronic motorway vignette required (rovinieta.ro)',
      'Headlights required at all times',
      'Reflective vest required in vehicle',
      'Road conditions can be poor on secondary roads',
      'Right-hand traffic',
    ],
    signs: [],
  },
  BG: {
    speed: { urban: 50, rural: 90, motorway: 140 },
    alcohol: '0.5‰',
    rules: [
      'Electronic motorway vignette required (bgtoll.bg)',
      'Headlights required at all times',
      'Road conditions variable — watch for potholes',
      'Right-hand traffic',
    ],
    signs: [],
  },
};

let roadInitialized = false;

function initRoad() {
  roadInitialized = true;
  renderRoad();
}

function renderRoad() {
  const code = getSelectedCountry();
  const data = ROAD_DATA[code];
  if (!data) return;

  let html = '';

  // Speed limits — rendered as road sign SVGs
  html += `<div class="road-section">`;
  html += `<div class="road-section-title">🚗 Speed Limits</div>`;
  html += `<div class="speed-grid">`;
  html += speedBadge('Urban', data.speed.urban);
  html += speedBadge('Rural', data.speed.rural);
  html += speedBadge('Motorway', data.speed.motorway);
  html += `</div></div>`;

  // Alcohol
  html += `<div class="road-section">`;
  html += `<div class="road-section-title">🍺 Alcohol Limit</div>`;
  html += `<div class="road-alcohol">${data.alcohol}</div>`;
  html += `</div>`;

  // Rules
  if (data.rules && data.rules.length) {
    html += `<div class="road-section">`;
    html += `<div class="road-section-title">📋 Key Rules</div>`;
    html += `<ul class="road-rules">`;
    data.rules.forEach(r => html += `<li>${r}</li>`);
    html += `</ul></div>`;
  }

  // Special signs with SVG illustrations
  if (data.signs && data.signs.length) {
    html += `<div class="road-section">`;
    html += `<div class="road-section-title">⚠️ Notable Signs & Rules</div>`;
    data.signs.forEach(s => {
      html += `<div class="road-sign">`;
      html += `<div class="road-sign-icon">${signSvg(s.type, s.value)}</div>`;
      html += `<div class="road-sign-text">`;
      html += `<div class="road-sign-name">${s.name}</div>`;
      html += `<div class="road-sign-desc">${s.desc}</div>`;
      html += `</div></div>`;
    });
    html += `</div>`;
  }

  // Disclaimer
  html += `<div class="sos-disclaimer">⚠ Rules may change. Always verify locally before driving.</div>`;

  document.getElementById('road-content').innerHTML = html;
}

function speedBadge(label, value) {
  const isNum = typeof value === 'number';
  const svg = isNum
    ? `<svg viewBox="0 0 100 100" width="56" height="56">
        <circle cx="50" cy="50" r="46" fill="white" stroke="#cc0000" stroke-width="7"/>
        <text x="50" y="${value >= 100 ? 62 : 60}" text-anchor="middle" font-size="${value >= 100 ? 30 : 38}" font-weight="bold" font-family="Arial,sans-serif" fill="#222">${value}</text>
      </svg>`
    : '';
  const display = isNum ? '' : `<div class="speed-value">${value}</div>`;
  return `<div class="speed-badge">
    ${svg}${display}
    <div class="speed-label">${label}</div>
  </div>`;
}

/* ── SVG sign generators ── */
function signSvg(type, value) {
  const sz = 'width="44" height="44"';
  switch (type) {
    case 'speed_limit':
      return `<svg viewBox="0 0 100 100" ${sz}>
        <circle cx="50" cy="50" r="46" fill="white" stroke="#cc0000" stroke-width="7"/>
        <text x="50" y="62" text-anchor="middle" font-size="28" font-weight="bold" font-family="Arial,sans-serif" fill="#222">${value || '?'}</text>
      </svg>`;
    case 'end_speed':
      return `<svg viewBox="0 0 100 100" ${sz}>
        <circle cx="50" cy="50" r="46" fill="white" stroke="#888" stroke-width="5"/>
        <line x1="20" y1="80" x2="80" y2="20" stroke="#888" stroke-width="5"/>
        <line x1="25" y1="85" x2="85" y2="25" stroke="#888" stroke-width="5"/>
        <line x1="15" y1="75" x2="75" y2="15" stroke="#888" stroke-width="5"/>
      </svg>`;
    case 'prohibition':
      return `<svg viewBox="0 0 100 100" ${sz}>
        <circle cx="50" cy="50" r="46" fill="white" stroke="#cc0000" stroke-width="7"/>
        <rect x="15" y="42" width="70" height="16" fill="#cc0000" rx="2"/>
      </svg>`;
    case 'warning':
      return `<svg viewBox="0 0 100 100" ${sz}>
        <polygon points="50,8 95,88 5,88" fill="white" stroke="#cc0000" stroke-width="6" stroke-linejoin="round"/>
        <text x="50" y="74" text-anchor="middle" font-size="36" font-weight="bold" font-family="Arial,sans-serif" fill="#222">${value || '!'}</text>
      </svg>`;
    case 'info':
      return `<svg viewBox="0 0 100 100" ${sz}>
        <rect x="4" y="4" width="92" height="92" rx="12" fill="#2563eb" stroke="#1e40af" stroke-width="4"/>
        <text x="50" y="66" text-anchor="middle" font-size="${(value || '').length > 2 ? 22 : 36}" font-weight="bold" font-family="Arial,sans-serif" fill="white">${value || 'i'}</text>
      </svg>`;
    case 'zone':
      return `<svg viewBox="0 0 120 100" ${sz}>
        <rect x="4" y="4" width="112" height="92" rx="8" fill="white" stroke="#cc0000" stroke-width="6"/>
        <text x="60" y="40" text-anchor="middle" font-size="16" font-weight="bold" font-family="Arial,sans-serif" fill="#cc0000">ZONE</text>
        <text x="60" y="72" text-anchor="middle" font-size="${(value || '').length > 3 ? 18 : 30}" font-weight="bold" font-family="Arial,sans-serif" fill="#222">${value || ''}</text>
      </svg>`;
    case 'stop_jp':
      return `<svg viewBox="0 0 100 100" ${sz}>
        <polygon points="50,5 95,35 95,75 50,95 5,75 5,35" fill="#cc0000" stroke="#800" stroke-width="3"/>
        <text x="50" y="58" text-anchor="middle" font-size="20" font-weight="bold" font-family="Arial,sans-serif" fill="white">${value || 'STOP'}</text>
      </svg>`;
    default:
      return '';
  }
}
