/* ══════════════════════════════════════
   Meal Times & Customs
   ══════════════════════════════════════ */
const MEALS_DATA = {
  CZ: {
    lunch: { from: '11:30', to: '14:00' },
    dinner: { from: '17:00', to: '21:00' },
    kitchenCloses: 'Most restaurants stay open continuously.',
    reservation: 'Usually not needed except upscale',
    water: 'Tap water rarely served - order bottled or beer (often cheaper!)',
    bread: 'Usually free',
    bill: 'Ask "Účet, prosím"',
    tips: ['Beer is often cheaper than water', 'Lunch menus (denní menu / polední menu) are great value €3-5', 'Tip 10-15%, tell server the total amount'],
  },
  IT: {
    lunch: { from: '12:30', to: '14:30' },
    dinner: { from: '19:30', to: '22:00' },
    kitchenCloses: 'Kitchen closes between meals (14:30-19:00) — plan accordingly!',
    reservation: 'Recommended for dinner, essential on weekends',
    water: 'Ask for "acqua del rubinetto" for free tap water — otherwise they bring bottled (€2-3)',
    bread: 'Charged (coperto €1-3)',
    bill: 'Ask "Il conto, per favore"',
    tips: ['Lunch is the main meal in Italy', 'Sitting at a table costs more than standing at the bar in cafés', 'Most restaurants close one day per week (riposo settimanale)'],
  },
  CH: {
    lunch: { from: '12:00', to: '14:00' },
    dinner: { from: '18:00', to: '21:00' },
    kitchenCloses: 'Swiss are punctual - arrive on time.',
    reservation: 'Recommended',
    water: 'Tap water available but often costs CHF 2-3 for a carafe',
    bread: 'Often charged',
    bill: "Ask 'Zahlen bitte' / 'L'addition, s'il vous plaît'",
    tips: ['Restaurants are expensive - budget CHF 25-40 for a main course', 'Rösti, fondue, raclette are must-tries'],
  },
  PL: {
    lunch: { from: '12:00', to: '15:00' },
    dinner: { from: '18:00', to: '21:00' },
    kitchenCloses: 'Most restaurants run all day, but hotel kitchens may stop around 21:00.',
    reservation: 'Not usually needed',
    water: 'Tap water usually free on request in cities',
    bread: 'Usually free',
    bill: 'Ask "Rachunek, proszę"',
    tips: ['Milk bars are fantastic for cheap lunches', 'Soup + main lunch sets are common on weekdays'],
  },
  HU: {
    lunch: { from: '12:00', to: '15:00' },
    dinner: { from: '18:00', to: '21:30' },
    kitchenCloses: 'Tourist restaurants often serve continuously; traditional spots may slow down mid-afternoon.',
    reservation: 'Recommended for dinner',
    water: 'Tap water safe and usually free if requested clearly',
    bread: 'Usually free or included',
    bill: 'Ask "A számlát, kérem"',
    tips: ['Lunch menus (napi menü) are good value', 'Service charge may already be added in Budapest'],
  },
  DE: {
    lunch: { from: '12:00', to: '14:00' },
    dinner: { from: '18:00', to: '21:00' },
    kitchenCloses: 'Kitchen often stops 30-60 minutes before closing time.',
    reservation: 'Recommended for dinner',
    water: 'Must order bottled in many restaurants unless you explicitly ask for tap water',
    bread: 'Usually included with meals only at some places',
    bill: 'Ask "Zahlen, bitte"',
    tips: ['Many kitchens close earlier than bars', 'Cash is still common at traditional restaurants'],
  },
  AT: {
    lunch: { from: '12:00', to: '14:00' },
    dinner: { from: '18:00', to: '21:00' },
    kitchenCloses: 'Coffee houses stay open, but restaurant kitchens often close by 21:00.',
    reservation: 'Recommended for dinner',
    water: 'Tap water often available, sometimes with a small charge',
    bread: 'Usually charged if brought automatically',
    bill: 'Ask "Zahlen, bitte"',
    tips: ['Many cafés are for lingering - don\'t feel rushed', 'Wiener Schnitzel and Tafelspitz are classics'],
  },
  FR: {
    lunch: { from: '12:00', to: '14:00' },
    dinner: { from: '19:00', to: '21:30' },
    kitchenCloses: 'Arrive too late and the kitchen may simply say service is finished.',
    reservation: 'Recommended for dinner',
    water: 'Ask for "une carafe d\'eau" for free tap water',
    bread: 'Usually included',
    bill: 'Ask "L\'addition, s\'il vous plaît"',
    tips: ['Lunch formulas are often the best deal', 'Service compris means service is included'],
  },
  ES: {
    lunch: { from: '13:30', to: '15:30' },
    dinner: { from: '20:30', to: '23:00' },
    kitchenCloses: 'Many places close kitchens between lunch and dinner.',
    reservation: 'Recommended for dinner, especially weekends',
    water: 'Usually bottled unless you specifically ask for tap water',
    bread: 'Bread often charged if served',
    bill: 'Ask "La cuenta, por favor"',
    tips: ['Locals eat late - early diners may find empty restaurants', 'Menú del día is the best lunch bargain'],
  },
  PT: {
    lunch: { from: '12:30', to: '15:00' },
    dinner: { from: '19:30', to: '22:00' },
    kitchenCloses: 'Smaller towns may shut kitchens after lunch until evening.',
    reservation: 'Recommended for dinner',
    water: 'Tap water available on request, but bottled is more common',
    bread: 'Bread / olives / cheese starters are charged if touched',
    bill: 'Ask "A conta, por favor"',
    tips: ['Couvert items on the table are not free unless you leave them untouched', 'Seafood restaurants fill up early on weekends'],
  },
  GR: {
    lunch: { from: '13:00', to: '15:30' },
    dinner: { from: '20:00', to: '23:00' },
    kitchenCloses: 'Tourist tavernas may serve all day, but locals eat late.',
    reservation: 'Not usually needed',
    water: 'Tap water often free on the mainland; islands may prefer bottled',
    bread: 'Usually charged small amount',
    bill: 'Ask "Ton logariasmo, parakalo"',
    tips: ['Tavernas often bring dessert or fruit for free', 'Seafood is priced by weight - check before ordering'],
  },
  HR: {
    lunch: { from: '12:00', to: '14:30' },
    dinner: { from: '18:30', to: '21:30' },
    kitchenCloses: 'Coastal restaurants may keep serving longer in summer.',
    reservation: 'Recommended on the coast',
    water: 'Tap water is usually safe and often free on request',
    bread: 'Usually charged small basket fee',
    bill: 'Ask "Račun, molim"',
    tips: ['Konobas are great for traditional food', 'Seafront places can be tourist-priced - check menu first'],
  },
  NL: {
    lunch: { from: '12:00', to: '14:00' },
    dinner: { from: '18:00', to: '20:30' },
    kitchenCloses: 'Kitchens often close surprisingly early by southern European standards.',
    reservation: 'Recommended for dinner',
    water: 'Tap water not always offered free in restaurants',
    bread: 'Usually charged if ordered',
    bill: 'Ask "Mag ik afrekenen?"',
    tips: ['Book ahead for popular places', 'Many people eat lighter lunches and earlier dinners'],
  },
  BE: {
    lunch: { from: '12:00', to: '14:00' },
    dinner: { from: '18:30', to: '21:30' },
    kitchenCloses: 'Busy brasseries can stop seating before the posted closing time.',
    reservation: 'Recommended for dinner',
    water: 'Usually bottled unless tap water is requested very directly',
    bread: 'Usually included or modestly charged',
    bill: 'Ask "L\'addition, s\'il vous plaît" / "De rekening, alstublieft"',
    tips: ['Beer menus can be longer than food menus', 'Mussels and fries are often seasonal specials'],
  },
  TR: {
    lunch: { from: '12:00', to: '15:00' },
    dinner: { from: '19:00', to: '22:30' },
    kitchenCloses: 'Restaurants in tourist areas often stay open late.',
    reservation: 'Recommended at popular meyhane and rooftop places',
    water: 'Usually bottled water only',
    bread: 'Usually included',
    bill: 'Ask "Hesap, lütfen"',
    tips: ['Meze are meant for sharing', 'Tea is often offered after the meal'],
  },
  GB: {
    lunch: { from: '12:00', to: '14:30' },
    dinner: { from: '18:00', to: '21:00' },
    kitchenCloses: 'Pub kitchens may stop by 20:30 or 21:00 even if the pub stays open later.',
    reservation: 'Recommended for dinner, essential for Sunday roast',
    water: 'Tap water free on request',
    bread: 'Usually not automatic',
    bill: 'Ask "Could we have the bill, please?"',
    tips: ['Sunday roast books out fast', 'Paying at the bar is still normal in pubs'],
  },
  TH: {
    lunch: { from: '11:30', to: '14:00' },
    dinner: { from: '18:00', to: '21:30' },
    kitchenCloses: 'Street food and food courts often serve all day into late evening.',
    reservation: 'Not usually needed',
    water: 'Usually bottled water only',
    bread: 'Not typical',
    bill: 'Ask "Check bin/geb ngern" or gesture for the bill',
    tips: ['Street food is often freshest at busy stalls', 'Ice and bottled water are normal with meals'],
  },
  JP: {
    lunch: { from: '11:30', to: '14:00' },
    dinner: { from: '18:00', to: '21:30' },
    kitchenCloses: 'Many restaurants take a break between lunch and dinner service.',
    reservation: 'Recommended for dinner, essential at popular sushi or yakiniku places',
    water: 'Tea or water is usually free automatically',
    bread: 'Not typical',
    bill: 'Say "Okanjō onegaishimasu" or use the table button',
    tips: ['No tipping anywhere', 'Many places have ticket machines or QR ordering'],
  },
  RO: {
    lunch: { from: '12:00', to: '15:00' },
    dinner: { from: '18:00', to: '21:30' },
    kitchenCloses: 'Most city restaurants serve continuously; smaller towns may close earlier.',
    reservation: 'Recommended for dinner at popular places',
    water: 'Tap water is drinkable in cities but bottled is more common in restaurants',
    bread: 'Usually charged small amount',
    bill: 'Ask "Nota, vă rog"',
    tips: ['Lunch menus are common on weekdays', 'Service charge is not always included'],
  },
  BG: {
    lunch: { from: '12:00', to: '15:00' },
    dinner: { from: '18:30', to: '21:30' },
    kitchenCloses: 'Restaurants often keep serving until close in tourist areas.',
    reservation: 'Not usually needed',
    water: 'Usually bottled unless tap water requested',
    bread: 'Usually charged',
    bill: 'Ask "Сметката, моля" / "Smetkata, molya"',
    tips: ['Shopska salad is everywhere for a reason', 'Live music restaurants can add a cover charge late at night'],
  },
};

let mealsInitialized = false;

function initMeals() {
  mealsInitialized = true;
  renderMeals();
}

function renderMeals() {
  const code = getSelectedCountry();
  const data = MEALS_DATA[code];
  if (!data) {
    document.getElementById('meals-content').innerHTML = '';
    return;
  }

  const details = [
    ['⏰ Kitchen', data.kitchenCloses],
    ['📅 Reservation', data.reservation],
    ['💧 Water', data.water],
    ['🍞 Bread / cover', data.bread],
    ['🧾 Bill', data.bill],
  ];

  let html = '';
  html += '<div class="road-section">';
  html += '<div class="road-section-title">🕒 Usual meal times</div>';
  html += '<div class="meal-time-card"><span class="meal-time-label">Lunch</span><span class="meal-time-hours">' + data.lunch.from + ' - ' + data.lunch.to + '</span></div>';
  html += '<div class="meal-time-card"><span class="meal-time-label">Dinner</span><span class="meal-time-hours">' + data.dinner.from + ' - ' + data.dinner.to + '</span></div>';
  html += '</div>';

  html += '<div class="road-section">';
  details.forEach(([label, value]) => {
    html += '<div class="road-sign">';
    html += '<div class="road-sign-text">';
    html += '<div class="road-sign-name">' + label + '</div>';
    html += '<div class="road-sign-desc">' + value + '</div>';
    html += '</div></div>';
  });
  html += '</div>';

  html += '<div class="road-section">';
  html += '<div class="road-section-title">💡 Dining tips</div>';
  html += '<ul class="road-rules">';
  data.tips.forEach(tip => {
    html += '<li>' + tip + '</li>';
  });
  html += '</ul></div>';

  document.getElementById('meals-content').innerHTML = html;
}
