/* ══════════════════════════════════════
   Transit Cards
   ══════════════════════════════════════ */
const TRANSIT_DATA = {
  CZ: {
    cities: [
      { city: 'Prague', card: 'Lítačka', buy: 'Metro stations, PID info centers, litacka.cz app', how: 'Contactless card or app. Load 30min/90min/24h/72h passes. Tap at yellow validators.', tip: 'Get the Lítačka app — buy tickets without queuing.' },
    ],
  },
  PL: {
    cities: [
      { city: 'Warsaw', card: 'Karta Miejska / mKarta', buy: 'ZTM points, ticket machines, jakdojade.pl app', how: 'Load time passes. Single tickets from machines in trams/buses.', tip: 'Jakdojade app is the best journey planner for all Polish cities.' },
      { city: 'Kraków', card: 'KKM card / mKA app', buy: 'MPK points, ticket machines', how: 'Contactless or app. Validate on board.', tip: null },
    ],
  },
  HU: {
    cities: [
      { city: 'Budapest', card: 'Budapest Card or BKK single tickets', buy: 'Metro stations, BudapestGO app, newsagents', how: 'Single tickets, 24h/72h travel cards. Validate at metro entrance, on bus/tram.', tip: 'BudapestGO app for mobile tickets. 72h card is great value.' },
    ],
  },
  DE: {
    cities: [
      { city: 'Berlin', card: 'BVG tickets / Deutschland-Ticket', buy: 'Ticket machines, BVG app, DB Navigator', how: 'Zones A/B/C. Day pass or 49€/month Deutschland-Ticket for all German transit.', tip: 'Deutschland-Ticket (D-Ticket) works in ALL German cities — incredible value.' },
      { city: 'Munich', card: 'MVV tickets / Deutschland-Ticket', buy: 'Ticket machines, MVG app', how: 'Zone-based. Same D-Ticket works here.', tip: null },
    ],
  },
  AT: {
    cities: [
      { city: 'Vienna', card: 'Wiener Linien tickets', buy: 'Ticket machines in stations, Wiener Linien app', how: 'Single/24h/48h/72h passes. Validate at blue boxes on entry.', tip: 'Weekly pass (Mon–Mon) is cheapest for longer stays.' },
    ],
  },
  IT: {
    cities: [
      { city: 'Rome', card: 'BIT / Roma 24h/48h/72h', buy: 'Tabaccherie, ticket machines, ATAC app', how: 'Validate on first use. 100min single rides.', tip: 'Roma Pass includes transit + museum discounts.' },
      { city: 'Milan', card: 'ATM tickets', buy: 'Ticket machines, ATM Milano app, tabaccherie', how: 'Single/day pass. Contactless bank card tap works on metro.', tip: 'Contactless bank card = easiest option, just tap in/out.' },
    ],
  },
  FR: {
    cities: [
      { city: 'Paris', card: 'Navigo Easy', buy: 'Metro station ticket offices/machines', how: 'Reloadable card. Load t+ tickets (bundle of 10 cheaper) or day passes.', tip: 'Get Navigo Easy — individual paper tickets phased out. Or use contactless bank card on metro.' },
    ],
  },
  ES: {
    cities: [
      { city: 'Madrid', card: 'Tarjeta Multi', buy: 'Metro stations (machines), estancos', how: 'Load 10-ride bundle (Metrobús). Non-transferable.', tip: 'Tourist pass (Abono Turístico) for unlimited rides 1–7 days.' },
      { city: 'Barcelona', card: 'T-casual (10 rides)', buy: 'Metro stations, TMB app', how: 'Zone-based, 10 rides, non-transferable. Validate on each entry.', tip: 'Hola BCN! card for unlimited tourist travel 2–5 days.' },
    ],
  },
  PT: {
    cities: [
      { city: 'Lisbon', card: 'Viva Viagem / Lisboa Card', buy: 'Metro stations, Carris kiosks', how: 'Load "zapping" credit or 24h passes. Tap on entry.', tip: 'Lisboa Card includes transit + free museum entry.' },
    ],
  },
  GR: {
    cities: [
      { city: 'Athens', card: 'Ath.ena Card', buy: 'Metro stations', how: 'Load single or 5-day tourist ticket. Tap at validators.', tip: '5-day tourist pass is good value and includes airport express.' },
    ],
  },
  HR: {
    cities: [
      { city: 'Zagreb', card: 'ZET tickets', buy: 'Kiosks (tisak/iNovine), ZET app, on-board (more expensive)', how: 'Time-based tickets (30/60/90 min). Validate on board.', tip: 'Buy from kiosks — on-board price has a surcharge.' },
    ],
  },
  NL: {
    cities: [
      { city: 'Amsterdam', card: 'OV-chipkaart / contactless', buy: 'Stations, Albert Heijn, online', how: 'Anonymous OV-chipkaart or just tap contactless bank card.', tip: 'Contactless bank card works everywhere — no card needed anymore.' },
    ],
  },
  BE: {
    cities: [
      { city: 'Brussels', card: 'MOBIB Basic / STIB app', buy: 'BOOTIK offices, ticket machines, STIB app', how: 'Load single rides, day pass, or weekly. Tap on entry.', tip: 'STIB app for mobile tickets. 24h pass = unlimited hops.' },
    ],
  },
  TR: {
    cities: [
      { city: 'Istanbul', card: 'Istanbulkart', buy: 'Machines at metro/ferry stops, kiosks', how: 'Load credit, tap on entry. Works on metro, tram, bus, ferry, funicular.', tip: 'Get one per person — transfers within 2h get discounted.' },
    ],
  },
  GB: {
    cities: [
      { city: 'London', card: 'Oyster / Contactless', buy: 'Tube stations, oyster online', how: 'Tap in, tap out. Daily cap applied automatically.', tip: 'Contactless bank card = same fares as Oyster, no deposit needed.' },
    ],
  },
  CH: {
    cities: [
      { city: 'Zurich/Geneva/Bern', card: 'Swiss Travel Pass or local ZVV/TPG', buy: 'SBB app, stations, swiss-pass.ch', how: 'Swiss Travel Pass covers ALL trains, buses, boats, and city transit.', tip: 'Swiss Travel Pass is expensive but covers almost everything including scenic routes.' },
    ],
  },
  TH: {
    cities: [
      { city: 'Bangkok', card: 'Rabbit Card (BTS) / MRT card', buy: 'BTS/MRT station ticket offices', how: 'Separate cards for BTS (Skytrain) and MRT (Metro). Load credit.', tip: '⚠ BTS and MRT cards are NOT interchangeable — you need both or buy single trips.' },
    ],
  },
  JP: {
    cities: [
      { city: 'Tokyo/Osaka/all cities', card: 'Suica / Pasmo / ICOCA', buy: 'Station machines, Apple Wallet (Suica)', how: 'Load credit, tap in/out. Works on trains, subway, buses, convenience stores.', tip: 'Add Suica to Apple Wallet — no physical card needed. Works nationwide on all transit AND as payment at konbini/vending machines.' },
    ],
  },
  RO: {
    cities: [
      { city: 'Bucharest', card: 'Multiplu card', buy: 'STB kiosks, metro stations', how: 'Load rides or passes. Separate cards for bus (STB) and metro (Metrorex).', tip: '24h passes available for both systems.' },
    ],
  },
  BG: {
    cities: [
      { city: 'Sofia', card: 'Sofia City Card / single tickets', buy: 'Metro stations, kiosks', how: 'Single rides from machines/kiosks. Validate on board.', tip: 'Contactless payment being rolled out on metro.' },
    ],
  },
};

let transitInitialized = false;

function initTransit() {
  transitInitialized = true;
  renderTransit();
}

function renderTransit() {
  const code = getSelectedCountry();
  const data = TRANSIT_DATA[code];
  if (!data) { document.getElementById('transit-content').innerHTML = ''; return; }

  let html = '';
  data.cities.forEach(c => {
    html += `<div class="embassy-card" style="margin-bottom:0.75rem">`;
    html += `<div class="embassy-city">🏙️ ${c.city}</div>`;
    html += `<div class="embassy-row">🎫 <strong>${c.card}</strong></div>`;
    html += `<div class="embassy-row">🛒 Buy: ${c.buy}</div>`;
    html += `<div class="embassy-row">ℹ️ ${c.how}</div>`;
    if (c.tip) html += `<div class="tip-note" style="margin-top:0.5rem">💡 ${c.tip}</div>`;
    html += `</div>`;
  });

  document.getElementById('transit-content').innerHTML = html;
}
