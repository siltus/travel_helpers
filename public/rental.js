/* ══════════════════════════════════════
   Rental Car Checklist
   ══════════════════════════════════════ */
const STANDARD_PICKUP = [
  'Check all scratches and photograph',
  'Confirm fuel policy (full-full vs prepaid)',
  'Verify spare wheel or repair kit, triangle, and safety vest',
  'Test lights, wipers, and phone charger before leaving the lot',
];

function rentalPickup(extra) {
  return STANDARD_PICKUP.concat(extra || []);
}

const RENTAL_DATA = {
  CZ: {
    idp: false,
    side: 'right',
    fuelLabels: { diesel: 'Nafta / Diesel', petrol: 'Natural / Benzín' },
    pickup: rentalPickup(['Check eVignette is activated']),
    insurance: 'Basic CDW is usually enough, but wheel and glass cover is helpful on rural roads.',
    parking: 'Blue zones are residents-only in many city centers; use visitor zones or garages.',
    tips: ['eVignette mandatory for motorways', 'Speed cameras are common', 'Trams ALWAYS have priority'],
  },
  IT: {
    idp: 'recommended',
    side: 'right',
    fuelLabels: { diesel: 'Gasolio', petrol: 'Benzina / Senza piombo' },
    pickup: rentalPickup(['Ask if ZTL registration is included', 'Check for Telepass toll device']),
    insurance: 'CDW usually has €500-1000 excess.',
    parking: 'Blue lines = paid, white = free, yellow = reserved.',
    tips: ['Avoid driving in city centers - ZTL cameras everywhere', 'Most Italian highways are toll roads', 'Keep headlights on outside urban areas'],
  },
  CH: {
    idp: false,
    side: 'right',
    fuelLabels: { diesel: 'Diesel', petrol: 'Bleifrei / Sans plomb' },
    pickup: rentalPickup(['Confirm vignette is included (CHF 40 mandatory)']),
    insurance: 'Swiss roads are well-maintained, so basic CDW is usually enough.',
    parking: 'Blue zone = free with parking disc (max 1-2h).',
    tips: ['Vignette required on ALL motorways', 'Mountain passes may require chains in winter', 'Very strict speed enforcement - fines are income-based'],
  },
  PL: {
    idp: false,
    side: 'right',
    fuelLabels: { diesel: 'ON / Diesel', petrol: 'PB95 / Benzyna' },
    pickup: rentalPickup(['Confirm whether motorway toll transponder is included']),
    insurance: 'Consider tyre and glass cover if driving long motorway stretches.',
    parking: 'Paid parking zones are common in city centers; apps are widely used.',
    tips: ['Expressways are excellent but some sections are tolled', 'Watch for unmarked speed checks', 'Winter tyres are sensible in colder months'],
  },
  HU: {
    idp: false,
    side: 'right',
    fuelLabels: { diesel: 'Gázolaj / Diesel', petrol: '95 Benzin' },
    pickup: rentalPickup(['Check e-matrica motorway vignette status']),
    insurance: 'Budapest traffic is hectic; lower excess cover is worth considering.',
    parking: 'Budapest uses paid zones with mobile payment; some central areas are resident-only.',
    tips: ['E-matrica needed on most motorways', 'Zero alcohol tolerance is enforced', 'Keep cash or card ready for parking apps and machines'],
  },
  DE: {
    idp: false,
    side: 'right',
    fuelLabels: { diesel: 'Diesel', petrol: 'Super / E10' },
    pickup: rentalPickup(),
    insurance: 'Standard CDW is fine, but add windscreen cover if doing lots of Autobahn driving.',
    parking: 'Parkscheibe (parking disc) required in many areas.',
    tips: ['No general speed limit on Autobahn', 'Umweltzone requires green sticker', 'Rettungsgasse (emergency corridor) mandatory in traffic jams'],
  },
  AT: {
    idp: false,
    side: 'right',
    fuelLabels: { diesel: 'Diesel', petrol: 'Super / Super 95' },
    pickup: rentalPickup(['Confirm motorway vignette is already attached']),
    insurance: 'Basic CDW is usually fine; alpine routes can justify extra glass coverage.',
    parking: 'Short-stay zones need a parking ticket or app; blue zones are strictly checked.',
    tips: ['Motorway vignette required', 'Winter equipment rules can be enforced in snow', 'Headlights recommended in mountain weather'],
  },
  FR: {
    idp: false,
    side: 'right',
    fuelLabels: { diesel: 'Gazole / Diesel', petrol: 'Sans plomb 95 / 98' },
    pickup: rentalPickup(['Check Crit\'Air sticker if entering major cities']),
    insurance: 'France is easy for road trips; standard CDW is usually enough.',
    parking: 'Blue zones may require a disc; paid street parking is common in cities.',
    tips: ['Many motorways are toll roads', 'Carry a warning triangle and hi-vis vest', 'Watch low-emission rules in Paris and Lyon'],
  },
  ES: {
    idp: false,
    side: 'right',
    fuelLabels: { diesel: 'Gasóleo', petrol: 'Gasolina 95 / 98' },
    pickup: rentalPickup(['Ask about low-emission city rules if visiting Madrid or Barcelona']),
    insurance: 'Scratch cover is useful for tight old-town parking garages.',
    parking: 'Blue lines are paid, green lines often residents or limited stay.',
    tips: ['Autovías are free, some autopistas are tolled', 'Watch for camera speed traps', 'Siesta can affect smaller rental offices'],
  },
  PT: {
    idp: false,
    side: 'right',
    fuelLabels: { diesel: 'Gasóleo', petrol: 'Gasolina 95 / 98' },
    pickup: rentalPickup(['Confirm Via Verde toll transponder if using motorways']),
    insurance: 'Basic CDW is usually fine, but pothole and tyre cover helps on rural roads.',
    parking: 'Pay-and-display zones are common in Lisbon and Porto; yellow curbs mean no parking.',
    tips: ['Electronic toll roads are common', 'Steep hills make clutch wear easy in Lisbon', 'Use guarded lots in dense historic centers'],
  },
  GR: {
    idp: false,
    side: 'right',
    fuelLabels: { diesel: 'Diesel', petrol: 'Αμόλυβδη / Unleaded' },
    pickup: rentalPickup(['Check ferry permission if island hopping']),
    insurance: 'Island roads can be narrow; tyre and underbody cover is worth considering.',
    parking: 'Athens uses controlled parking zones; island towns can be chaotic in summer.',
    tips: ['Expect narrow village roads', 'Some island stations close on Sundays', 'Watch scooters and mopeds filtering everywhere'],
  },
  HR: {
    idp: false,
    side: 'right',
    fuelLabels: { diesel: 'Dizel', petrol: 'Benzin / Eurosuper 95' },
    pickup: rentalPickup(['Ask whether cross-border travel to Slovenia/Bosnia is permitted']),
    insurance: 'Coastal roads are scenic but tight; extra excess reduction is often worth it.',
    parking: 'Historic centers have limited parking; use signed public lots.',
    tips: ['Motorways are tolled', 'Coastal roads are beautiful but slow in summer', 'Cross-border paperwork matters'],
  },
  NL: {
    idp: false,
    side: 'right',
    fuelLabels: { diesel: 'Diesel', petrol: 'Benzine / Euro 95' },
    pickup: rentalPickup(['Check if city hotel parking is pre-booked']),
    insurance: 'Parking damage cover is useful in very tight city garages.',
    parking: 'Street parking is expensive; park-and-ride is often the smartest option.',
    tips: ['Cyclists always have priority in practice', 'Use park-and-ride for Amsterdam', 'Speed cameras and average-speed checks are common'],
  },
  BE: {
    idp: false,
    side: 'right',
    fuelLabels: { diesel: 'Diesel', petrol: 'Essence / Benzine 95' },
    pickup: rentalPickup(['Check LEZ registration if the car is foreign-plated']),
    insurance: 'Standard CDW is enough for most trips.',
    parking: 'Color-coded zones vary by city; always read the meter carefully.',
    tips: ['Brussels traffic is dense at peak times', 'LEZ rules differ between cities', 'Cobblestones make tyre checks worthwhile'],
  },
  TR: {
    idp: 'recommended',
    side: 'right',
    fuelLabels: { diesel: 'Motorin', petrol: 'Benzin / Kurşunsuz 95' },
    pickup: rentalPickup(['Confirm HGS toll sticker or transponder is active']),
    insurance: 'Road conditions vary, so low excess cover is reassuring outside big cities.',
    parking: 'Valet parking is common in cities; use guarded car parks when possible.',
    tips: ['Bridges and motorways use HGS tolling', 'Driving style can be assertive in Istanbul', 'Avoid cash-only roadside fuel stations late at night'],
  },
  GB: {
    idp: 'recommended',
    side: 'left',
    fuelLabels: { diesel: 'Diesel', petrol: 'Unleaded' },
    pickup: rentalPickup(['Ask about congestion charge and ULEZ handling']),
    insurance: 'Standard CDW is fine, but wheel cover helps with narrow kerbs.',
    parking: 'Read permit signs carefully; London and historic towns are aggressively enforced.',
    tips: ['⚠ LEFT SIDE DRIVING', 'Roundabouts go clockwise', 'Congestion charge in London', 'ULEZ zone in London'],
  },
  TH: {
    idp: true,
    side: 'left',
    fuelLabels: { diesel: 'Diesel', petrol: 'Gasohol 95 / 91' },
    pickup: rentalPickup(['Inspect tyres carefully before leaving', 'Check whether first-class insurance is included']),
    insurance: 'Road conditions and scooter traffic make strong insurance coverage worthwhile.',
    parking: 'Use guarded parking where possible; red-white curbs and market areas are frequently enforced.',
    tips: ['⚠ LEFT SIDE DRIVING', 'Road conditions vary greatly', 'Motorbike rental common but very dangerous for tourists'],
  },
  JP: {
    idp: true,
    side: 'left',
    fuelLabels: { diesel: '軽油', petrol: 'レギュラー / ハイオク' },
    pickup: rentalPickup(['Make sure your Geneva Convention IDP matches your passport name', 'Ask for ETC card if using expressways']),
    insurance: 'Japanese rentals are usually in great condition, but full waiver is worth it for stress-free parking.',
    parking: 'Very strict parking enforcement; only park in marked paid lots.',
    tips: ['⚠ LEFT SIDE DRIVING', 'ETC card for expressway tolls', 'Very strict parking enforcement', 'Speed limit usually 60-100 km/h'],
  },
  RO: {
    idp: false,
    side: 'right',
    fuelLabels: { diesel: 'Motorină', petrol: 'Benzină 95' },
    pickup: rentalPickup(['Check rovinieta vignette is active']),
    insurance: 'Road quality varies; tyre cover is useful outside main roads.',
    parking: 'Central Bucharest parking is paid and inconsistently marked; garages are easier.',
    tips: ['Rovinieta required on national roads', 'Watch horse carts and slow traffic in villages', 'Avoid night driving on rural roads'],
  },
  BG: {
    idp: false,
    side: 'right',
    fuelLabels: { diesel: 'Дизел', petrol: 'Бензин 95' },
    pickup: rentalPickup(['Check vignette is active for highways']),
    insurance: 'Basic CDW is fine, but pothole damage cover can pay off.',
    parking: 'Blue and green paid zones are common in Sofia; wheel clamps are used.',
    tips: ['Vignette needed on motorways', 'Road quality varies outside cities', 'Keep cash or card ready for parking SMS/apps'],
  },
};

let rentalInitialized = false;

function initRental() {
  rentalInitialized = true;
  renderRental();
}

function formatIdpRequirement(value) {
  if (value === true) return 'Required';
  if (value === 'recommended') return 'Recommended';
  return 'Not usually needed';
}

function renderRental() {
  const code = getSelectedCountry();
  const data = RENTAL_DATA[code];
  if (!data) {
    document.getElementById('rental-content').innerHTML = '';
    return;
  }

  let html = '';

  if (data.side === 'left') {
    html += '<div class="drive-warning">⚠ LEFT SIDE DRIVING — take a breath before every turn, roundabout, and lane change.</div>';
  }

  html += '<div class="embassy-card" style="margin-bottom:1rem">';
  html += '<div class="embassy-city">🚗 Driving basics</div>';
  html += '<div class="embassy-row">🪪 IDP: <strong>' + formatIdpRequirement(data.idp) + '</strong></div>';
  html += '<div class="embassy-row">🛣️ Drive on the <strong>' + data.side + '</strong></div>';
  html += '</div>';

  html += '<div class="road-section">';
  html += '<div class="road-section-title">⛽ Fuel labels</div>';
  html += '<div class="rate-table-wrap"><table class="rate-table">';
  html += '<tr><th>Fuel</th><th>Pump label</th></tr>';
  html += '<tr><td>Diesel</td><td>' + data.fuelLabels.diesel + '</td></tr>';
  html += '<tr><td>Petrol</td><td>' + data.fuelLabels.petrol + '</td></tr>';
  html += '</table></div></div>';

  html += '<div class="road-section">';
  html += '<div class="road-section-title">📋 Pickup checklist</div>';
  html += '<div class="embassy-card">';
  data.pickup.forEach(item => {
    html += '<div class="checklist-item">' + item + '</div>';
  });
  html += '</div></div>';

  html += '<div class="road-section">';
  html += '<div class="road-sign">';
  html += '<div class="road-sign-text">';
  html += '<div class="road-sign-name">🛡️ Insurance</div>';
  html += '<div class="road-sign-desc">' + data.insurance + '</div>';
  html += '</div></div>';
  html += '<div class="road-sign">';
  html += '<div class="road-sign-text">';
  html += '<div class="road-sign-name">🅿️ Parking</div>';
  html += '<div class="road-sign-desc">' + data.parking + '</div>';
  html += '</div></div>';
  html += '</div>';

  html += '<div class="road-section">';
  html += '<div class="road-section-title">💡 Tips</div>';
  html += '<ul class="road-rules">';
  data.tips.forEach(tip => {
    html += '<li>' + tip + '</li>';
  });
  html += '</ul></div>';

  document.getElementById('rental-content').innerHTML = html;
}
