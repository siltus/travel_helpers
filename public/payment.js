/* ══════════════════════════════════════
   Payment Norms
   ══════════════════════════════════════ */
const PAYMENT_DATA = {
  CZ: {
    currency: 'CZK (Czech Koruna)',
    cashVsCard: 'Card widely accepted, but keep cash for small shops, markets, and trams.',
    contactless: 'Very common — almost everywhere that takes card.',
    eurAccepted: 'Sometimes in tourist areas at poor rates. Not standard.',
    atm: 'Use bank ATMs (Česká spořitelna, ČSOB, KB). Avoid Euronet — high fees.',
    tips: [
      'Card tipping rare — leave cash tip separately',
      'Avoid dynamic currency conversion (DCC) — always pay in CZK',
      'Euronet ATMs are tourist traps — walk to a bank ATM',
    ],
  },
  PL: {
    currency: 'PLN (Polish Złoty)',
    cashVsCard: 'Card very widely accepted, even for small amounts.',
    contactless: 'Extremely widespread — Poland is a leader in contactless adoption.',
    eurAccepted: 'Rarely. Use PLN.',
    atm: 'Use bank ATMs (PKO, mBank, Pekao). Avoid Euronet.',
    tips: [
      'BLIK payment system popular locally',
      'Decline DCC at ATMs and terminals — pay in PLN',
    ],
  },
  HU: {
    currency: 'HUF (Hungarian Forint)',
    cashVsCard: 'Card common in cities. Cash needed for markets, rural areas, parking.',
    contactless: 'Widespread in Budapest, less so in rural areas.',
    eurAccepted: 'Some tourist places. Always at unfavorable rate.',
    atm: 'Use bank ATMs (OTP, K&H). Avoid standalone ATMs.',
    tips: [
      'Amounts are large (lunch ~3000-5000 HUF) — don\'t panic',
      'Some ruin bars are cash-only',
    ],
  },
  DE: {
    currency: 'EUR (Euro)',
    cashVsCard: '⚠ Germany is cash-heavy! Many restaurants, cafés, and shops don\'t take card.',
    contactless: 'Growing but not universal. Always carry cash.',
    eurAccepted: 'Yes — it\'s the currency.',
    atm: 'Bank ATMs (Sparkasse, Deutsche Bank, Commerzbank). Some charge fees for foreign cards.',
    tips: [
      'Saying "Kartenzahlung?" to check if card is accepted',
      'EC-Karte (Girocard) is preferred over credit cards at many shops',
      'Some places have minimum amounts for card (€10-20)',
    ],
  },
  AT: {
    currency: 'EUR (Euro)',
    cashVsCard: 'More card-friendly than Germany, but cash still common for small amounts.',
    contactless: 'Common in cities.',
    eurAccepted: 'Yes — it\'s the currency.',
    atm: 'Bankomat ATMs (look for the blue sign).',
    tips: ['Huts in the Alps are often cash-only'],
  },
  IT: {
    currency: 'EUR (Euro)',
    cashVsCard: 'By law, all businesses must accept card. Enforcement improving.',
    contactless: 'Increasingly common.',
    eurAccepted: 'Yes — it\'s the currency.',
    atm: 'Use bank ATMs (UniCredit, Intesa). Avoid standalone ones.',
    tips: [
      'Small businesses may still grumble about card for small amounts',
      'Gelaterias and market stalls may prefer cash',
    ],
  },
  FR: {
    currency: 'EUR (Euro)',
    cashVsCard: 'Card widely accepted. Carte Bancaire system dominant.',
    contactless: 'Very common — up to €50 without PIN.',
    eurAccepted: 'Yes — it\'s the currency.',
    atm: 'Bank ATMs everywhere (BNP, Société Générale, Crédit Agricole).',
    tips: ['Markets and boulangeries sometimes cash-only for small amounts'],
  },
  ES: {
    currency: 'EUR (Euro)',
    cashVsCard: 'Card widely accepted.',
    contactless: 'Very common.',
    eurAccepted: 'Yes — it\'s the currency.',
    atm: 'Bank ATMs (Santander, BBVA, CaixaBank). Avoid "Euronet" type.',
    tips: ['Chiringuitos (beach bars) may be cash-only'],
  },
  PT: {
    currency: 'EUR (Euro)',
    cashVsCard: 'Card widely accepted. MB Way (local mobile payment) very popular.',
    contactless: 'Common.',
    eurAccepted: 'Yes — it\'s the currency.',
    atm: 'Multibanco ATMs — reliable, no fees for EU cards.',
    tips: ['Multibanco ATMs also let you pay bills, buy tickets, etc.'],
  },
  GR: {
    currency: 'EUR (Euro)',
    cashVsCard: 'Card increasingly accepted but cash still important, especially on islands.',
    contactless: 'Available in cities, spotty on islands.',
    eurAccepted: 'Yes — it\'s the currency.',
    atm: 'Bank ATMs. Island ATMs may run out of cash in peak season.',
    tips: [
      'Tavernas on small islands are often cash-only',
      'Withdraw cash before heading to remote islands',
    ],
  },
  HR: {
    currency: 'EUR (Euro, since Jan 2023)',
    cashVsCard: 'Card well accepted in tourist areas. Cash for markets and rural.',
    contactless: 'Common in cities and coast.',
    eurAccepted: 'Yes — it\'s the currency (recently adopted).',
    atm: 'Bank ATMs (PBZ, Erste, Raiffeisenbank).',
    tips: ['Some older vendors may still quote Kuna prices out of habit'],
  },
  NL: {
    currency: 'EUR (Euro)',
    cashVsCard: 'Very card-oriented. Some places are card-ONLY.',
    contactless: 'Extremely common.',
    eurAccepted: 'Yes — it\'s the currency.',
    atm: 'Geldmaat ATMs (shared network).',
    tips: [
      'Maestro/debit preferred over credit cards in many shops',
      'Some places literally refuse cash',
    ],
  },
  BE: {
    currency: 'EUR (Euro)',
    cashVsCard: 'Card widely accepted.',
    contactless: 'Common.',
    eurAccepted: 'Yes — it\'s the currency.',
    atm: 'Bank ATMs (BNP Paribas Fortis, KBC, Belfius).',
    tips: [],
  },
  TR: {
    currency: 'TRY (Turkish Lira)',
    cashVsCard: 'Card accepted in cities and tourist areas. Cash essential in rural areas and bazaars.',
    contactless: 'Available in modern establishments.',
    eurAccepted: 'In tourist areas, sometimes USD too. Always at bad rates.',
    atm: 'Bank ATMs (Garanti, İşbank, Ziraat). Check your bank\'s Turkey fees.',
    tips: [
      'Lira devalues frequently — don\'t exchange too much at once',
      'Grand Bazaar and markets are cash-and-haggle territory',
      'Some ATMs push DCC hard — always refuse it',
    ],
  },
  GB: {
    currency: 'GBP (British Pound)',
    cashVsCard: 'Very card-friendly. Contactless is the norm.',
    contactless: 'Ubiquitous — up to £100.',
    eurAccepted: 'No.',
    atm: 'Free ATMs marked "Free cash withdrawals". Avoid fee-charging ones in shops.',
    tips: [
      'TfL transit accepts contactless directly — no Oyster needed',
      'Scottish banknotes are legal but some English shops may not accept them',
    ],
  },
  CH: {
    currency: 'CHF (Swiss Franc)',
    cashVsCard: 'Card widely accepted. Switzerland is expensive — card is convenient.',
    contactless: 'Common.',
    eurAccepted: 'Often accepted near borders and in tourist areas at ~1:1 rate (unfavorable).',
    atm: 'Bank ATMs. Fees vary — check your bank\'s CHF conversion.',
    tips: [
      'TWINT is the local mobile payment (like Apple Pay but Swiss)',
      'Prices are high — budget accordingly',
    ],
  },
  TH: {
    currency: 'THB (Thai Baht)',
    cashVsCard: 'Cash dominant. Card accepted in malls, hotels, upscale restaurants.',
    contactless: 'Limited to malls and chains.',
    eurAccepted: 'No. Exchange to THB.',
    atm: 'ATMs charge 220 THB per withdrawal for foreign cards. Use Aeon or Citibank to avoid.',
    tips: [
      'Exchange at SuperRich or Vasu — much better than airport',
      '7-Eleven is usually cash-only for foreigners',
      'Street food, tuk-tuks, markets = cash only',
    ],
  },
  JP: {
    currency: 'JPY (Japanese Yen)',
    cashVsCard: '⚠ Japan is very cash-heavy, especially outside Tokyo. Always carry yen.',
    contactless: 'IC cards (Suica/Pasmo) work at convenience stores and many shops.',
    eurAccepted: 'No.',
    atm: 'Use 7-Eleven or Japan Post ATMs — they accept foreign cards. Most bank ATMs don\'t.',
    tips: [
      '7-Eleven ATMs are your best friend — they\'re everywhere and work 24/7',
      'Many restaurants, especially ramen shops, use vending machine tickets (cash)',
      'Coin usage is high — get a coin purse',
      'No tipping anywhere',
    ],
  },
  RO: {
    currency: 'RON (Romanian Leu)',
    cashVsCard: 'Card accepted in cities. Cash needed in rural areas.',
    contactless: 'Common in cities.',
    eurAccepted: 'Sometimes in tourist areas.',
    atm: 'Bank ATMs (BRD, BCR, Raiffeisen). Avoid standalone ones.',
    tips: ['Decline DCC — pay in RON'],
  },
  BG: {
    currency: 'BGN (Bulgarian Lev)',
    cashVsCard: 'Card accepted in cities. Cash important elsewhere.',
    contactless: 'Available in Sofia and coastal resorts.',
    eurAccepted: 'Rarely.',
    atm: 'Bank ATMs (DSK, Unicredit Bulbank). Avoid Euronet.',
    tips: [
      'BGN is pegged to EUR at ~1.96:1 — easy mental math',
      'Decline DCC at ATMs',
    ],
  },
};

let paymentInitialized = false;

function initPayment() {
  paymentInitialized = true;
  renderPayment();
}

function renderPayment() {
  const code = getSelectedCountry();
  const data = PAYMENT_DATA[code];
  if (!data) { document.getElementById('payment-content').innerHTML = ''; return; }

  let html = '';

  html += `<div class="embassy-card" style="margin-bottom:1rem">`;
  html += `<div class="embassy-city">💰 ${data.currency}</div>`;
  html += `</div>`;

  const rows = [
    ['💳 Card vs Cash', data.cashVsCard],
    ['📶 Contactless', data.contactless],
    ['🇪🇺 EUR accepted?', data.eurAccepted],
    ['🏧 ATMs', data.atm],
  ];

  html += `<div class="road-section">`;
  rows.forEach(([label, value]) => {
    html += `<div class="road-sign">`;
    html += `<div class="road-sign-text">`;
    html += `<div class="road-sign-name">${label}</div>`;
    html += `<div class="road-sign-desc">${value}</div>`;
    html += `</div></div>`;
  });
  html += `</div>`;

  if (data.tips && data.tips.length) {
    html += `<div class="road-section">`;
    html += `<div class="road-section-title">💡 Tips</div>`;
    html += `<ul class="road-rules">`;
    data.tips.forEach(t => html += `<li>${t}</li>`);
    html += `</ul></div>`;
  }

  document.getElementById('payment-content').innerHTML = html;
}
