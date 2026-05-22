/* ══════════════════════════════════════
   Pharmacy Guide
   ══════════════════════════════════════ */
const PHARMACY_DATA = {
  CZ: {
    sign: 'Green cross',
    name: 'Lékárna',
    hours: 'Usually Mon–Fri 8:00–18:00, some 24h in Prague',
    drugs: [
      { generic: 'Ibuprofen', local: 'Ibalgin, Nurofen', otc: true },
      { generic: 'Paracetamol', local: 'Paralen, Panadol', otc: true },
      { generic: 'Aspirin', local: 'Acylpyrin, Aspirin', otc: true },
      { generic: 'Antihistamine', local: 'Zyrtec, Claritine', otc: true },
      { generic: 'Loperamide (diarrhea)', local: 'Imodium', otc: true },
      { generic: 'Omeprazole (heartburn)', local: 'Helicid', otc: true },
    ],
    notes: [
      'Antibiotics require prescription',
      'Pharmacists often speak English in tourist areas',
      '24h pharmacies: look for "Pohotovostní lékárna"',
    ],
  },
  PL: {
    sign: 'Green cross',
    name: 'Apteka',
    hours: 'Usually Mon–Fri 8:00–20:00, Sat 8:00–14:00',
    drugs: [
      { generic: 'Ibuprofen', local: 'Ibuprom, Nurofen', otc: true },
      { generic: 'Paracetamol', local: 'Apap, Panadol', otc: true },
      { generic: 'Aspirin', local: 'Polopiryna, Aspirin', otc: true },
      { generic: 'Antihistamine', local: 'Zyrtec, Claritine', otc: true },
      { generic: 'Loperamide (diarrhea)', local: 'Imodium, Laremid', otc: true },
    ],
    notes: [
      'Codeine-based drugs require prescription',
      '"Apteka dyżurna" = duty pharmacy (nights/weekends)',
    ],
  },
  HU: {
    sign: 'Green cross',
    name: 'Gyógyszertár / Patika',
    hours: 'Usually Mon–Fri 8:00–18:00',
    drugs: [
      { generic: 'Ibuprofen', local: 'Algoflex, Nurofen', otc: true },
      { generic: 'Paracetamol', local: 'Panadol, Rubophen', otc: true },
      { generic: 'Antihistamine', local: 'Claritine, Zyrtec', otc: true },
      { generic: 'Loperamide (diarrhea)', local: 'Imodium', otc: true },
    ],
    notes: [
      'Duty pharmacies rotate — check signs on closed pharmacy doors',
      'Some drugs freely available elsewhere in EU require prescription here',
    ],
  },
  DE: {
    sign: 'Red "A" (Apotheke)',
    name: 'Apotheke',
    hours: 'Usually Mon–Fri 8:30–18:30, Sat 9:00–13:00',
    drugs: [
      { generic: 'Ibuprofen', local: 'Ibu, Nurofen', otc: true },
      { generic: 'Paracetamol', local: 'ben-u-ron, Paracetamol', otc: true },
      { generic: 'Aspirin', local: 'Aspirin (Bayer)', otc: true },
      { generic: 'Antihistamine', local: 'Cetirizin, Loratadin', otc: true },
      { generic: 'Throat lozenges', local: 'neo-angin, GeloRevoice', otc: true },
    ],
    notes: [
      'OTC drugs only sold in Apotheken, NOT in supermarkets',
      '"Notdienst-Apotheke" = emergency pharmacy (nights/weekends)',
      'apotheken.de to find nearest open pharmacy',
    ],
  },
  AT: {
    sign: 'Red "A" (Apotheke)',
    name: 'Apotheke',
    hours: 'Usually Mon–Fri 8:00–18:00, Sat 8:00–12:00',
    drugs: [
      { generic: 'Ibuprofen', local: 'Ibuprofen, Nurofen', otc: true },
      { generic: 'Paracetamol', local: 'Mexalen, Paracetamol', otc: true },
      { generic: 'Antihistamine', local: 'Cetirizin, Zyrtec', otc: true },
    ],
    notes: [
      'Same as Germany — OTC drugs only in Apotheke',
      'Emergency pharmacies rotate nightly',
    ],
  },
  IT: {
    sign: 'Green cross (illuminated)',
    name: 'Farmacia',
    hours: 'Usually Mon–Fri 8:30–12:30, 15:30–19:30',
    drugs: [
      { generic: 'Ibuprofen', local: 'Moment, Nurofen, Brufen', otc: true },
      { generic: 'Paracetamol', local: 'Tachipirina, Efferalgan', otc: true },
      { generic: 'Antihistamine', local: 'Zirtec, Clarityn', otc: true },
      { generic: 'Loperamide (diarrhea)', local: 'Imodium, Dissenten', otc: true },
    ],
    notes: [
      'Lunch closure common (pausa pranzo)',
      '"Farmacia di turno" = duty pharmacy',
      'Parafarmacia sells non-prescription items cheaper',
    ],
  },
  FR: {
    sign: 'Green cross (flashing)',
    name: 'Pharmacie',
    hours: 'Usually Mon–Sat 9:00–19:00',
    drugs: [
      { generic: 'Ibuprofen', local: 'Advil, Nurofen', otc: true },
      { generic: 'Paracetamol', local: 'Doliprane, Efferalgan, Dafalgan', otc: true },
      { generic: 'Antihistamine', local: 'Zyrtecset, Clarityne', otc: true },
      { generic: 'Loperamide (diarrhea)', local: 'Imodium, Diastrolib', otc: true },
    ],
    notes: [
      'Pharmacists can advise and provide first aid',
      '"Pharmacie de garde" for nights/weekends — find at pharmaciedegarde.com',
      'OTC drugs only from pharmacies (not supermarkets)',
    ],
  },
  ES: {
    sign: 'Green cross (illuminated)',
    name: 'Farmacia',
    hours: 'Usually Mon–Fri 9:30–14:00, 17:00–20:30',
    drugs: [
      { generic: 'Ibuprofen', local: 'Ibuprofeno, Nurofen, Espidifen', otc: true },
      { generic: 'Paracetamol', local: 'Paracetamol, Gelocatil, Efferalgan', otc: true },
      { generic: 'Antihistamine', local: 'Cetirizina, Ebastel', otc: true },
    ],
    notes: [
      'Siesta closure common in smaller towns',
      '"Farmacia de guardia" open 24h on rotation',
    ],
  },
  PT: {
    sign: 'Green cross',
    name: 'Farmácia',
    hours: 'Usually Mon–Fri 9:00–19:00, Sat 9:00–13:00',
    drugs: [
      { generic: 'Ibuprofen', local: 'Brufen, Ibuprofeno', otc: true },
      { generic: 'Paracetamol', local: 'Ben-u-ron, Paracetamol', otc: true },
      { generic: 'Antihistamine', local: 'Cetirizina, Zyrtec', otc: true },
    ],
    notes: [
      'Duty pharmacies listed on pharmacy doors and local newspapers',
    ],
  },
  GR: {
    sign: 'Green cross',
    name: 'Φαρμακείο (Farmakeío)',
    hours: 'Usually Mon–Fri 8:00–14:30 (some reopen 17:30–20:30)',
    drugs: [
      { generic: 'Ibuprofen', local: 'Ibuprofen, Nurofen, Algofren', otc: true },
      { generic: 'Paracetamol', local: 'Depon, Panadol', otc: true },
      { generic: 'Antihistamine', local: 'Zyrtec, Aerius', otc: true },
    ],
    notes: [
      'Split hours common — closed in afternoon',
      'Pharmacists are highly trained and can advise on treatments',
    ],
  },
  HR: {
    sign: 'Green cross',
    name: 'Ljekarna',
    hours: 'Usually Mon–Fri 8:00–20:00, Sat 8:00–14:00',
    drugs: [
      { generic: 'Ibuprofen', local: 'Ibuprofen, Nurofen', otc: true },
      { generic: 'Paracetamol', local: 'Lupocet, Panadol', otc: true },
    ],
    notes: ['24h pharmacies available in Zagreb and Split'],
  },
  NL: {
    sign: 'Green cross or "Apotheek" sign',
    name: 'Apotheek',
    hours: 'Usually Mon–Fri 8:30–17:30',
    drugs: [
      { generic: 'Ibuprofen', local: 'Ibuprofen, Nurofen', otc: true },
      { generic: 'Paracetamol', local: 'Paracetamol (also in supermarkets)', otc: true },
      { generic: 'Antihistamine', local: 'Cetirizine, Loratadine', otc: true },
    ],
    notes: [
      'Paracetamol available in supermarkets (Kruidvat, Etos)',
      '"Dienstapotheek" for after-hours',
    ],
  },
  BE: {
    sign: 'Green cross',
    name: 'Pharmacie / Apotheek',
    hours: 'Usually Mon–Fri 9:00–18:00, Sat 9:00–12:30',
    drugs: [
      { generic: 'Ibuprofen', local: 'Ibuprofen, Nurofen, Brufen', otc: true },
      { generic: 'Paracetamol', local: 'Dafalgan, Panadol', otc: true },
    ],
    notes: [
      '"Pharmacie de garde" / "Wachtapotheek" for nights/weekends',
      'pharmacie.be to find nearest open pharmacy',
    ],
  },
  TR: {
    sign: 'Red "E" or red cross/crescent',
    name: 'Eczane',
    hours: 'Usually Mon–Sat 9:00–19:00',
    drugs: [
      { generic: 'Ibuprofen', local: 'Ibuprofen, Nurofen, Advil', otc: true },
      { generic: 'Paracetamol', local: 'Parol, Minoset', otc: true },
      { generic: 'Antihistamine', local: 'Zyrtec, Allerset', otc: true },
    ],
    notes: [
      '"Nöbetçi eczane" = duty pharmacy (24h on rotation)',
      'Many drugs available OTC that would need prescription in EU',
      'Prices significantly cheaper than Western Europe',
    ],
  },
  GB: {
    sign: 'Green cross',
    name: 'Pharmacy / Chemist',
    hours: 'Usually Mon–Sat 9:00–18:00',
    drugs: [
      { generic: 'Ibuprofen', local: 'Nurofen, own-brand Ibuprofen', otc: true },
      { generic: 'Paracetamol', local: 'Paracetamol (very cheap, in all shops)', otc: true },
      { generic: 'Antihistamine', local: 'Piriton, Piriteze, Benadryl', otc: true },
      { generic: 'Codeine + paracetamol', local: 'Co-codamol (pharmacy only)', otc: true },
    ],
    notes: [
      'Paracetamol and ibuprofen available in supermarkets',
      'Boots and Superdrug are the main pharmacy chains',
      'NHS 111 for non-emergency health advice',
    ],
  },
  CH: {
    sign: 'Green cross',
    name: 'Apotheke / Pharmacie / Farmacia',
    hours: 'Usually Mon–Fri 8:00–18:30, Sat 8:00–16:00',
    drugs: [
      { generic: 'Ibuprofen', local: 'Ibuprofen, Algifor', otc: true },
      { generic: 'Paracetamol', local: 'Dafalgan, Panadol', otc: true },
      { generic: 'Antihistamine', local: 'Zyrtec, Cetallerg', otc: true },
    ],
    notes: [
      'Prices are very high — bring basics from home',
      'Drogerien (drugstores) sell herbal/natural remedies',
    ],
  },
  TH: {
    sign: 'Various — look for "ร้านยา" or mortar & pestle',
    name: 'ร้านยา (Raan Yaa)',
    hours: 'Usually 9:00–21:00 or later, many open late',
    drugs: [
      { generic: 'Ibuprofen', local: 'Brufen, Ibuprofen', otc: true },
      { generic: 'Paracetamol', local: 'Sara, Tylenol', otc: true },
      { generic: 'Loperamide (diarrhea)', local: 'Imodium', otc: true },
      { generic: 'Oral rehydration salts', local: 'ORS (very common)', otc: true },
    ],
    notes: [
      'Many drugs available OTC without prescription',
      'Antibiotics sold freely (not recommended without diagnosis)',
      'Prices very cheap — basic meds cost pennies',
      'Boots and Watsons chains in malls have English labels',
    ],
  },
  JP: {
    sign: 'Various — "薬" (kusuri) or "ドラッグストア"',
    name: '薬局 (Yakkyoku) / ドラッグストア (Drug Store)',
    hours: 'Usually 10:00–21:00, drug stores open late',
    drugs: [
      { generic: 'Ibuprofen', local: 'Eve (イブ), Naron', otc: true },
      { generic: 'Paracetamol', local: 'Tylenol A, Bufferin', otc: true },
      { generic: 'Loperamide (diarrhea)', local: 'Stoppa, Seirogan (正露丸)', otc: true },
      { generic: 'Cold medicine', local: 'Pabron (パブロン), Lulu', otc: true },
    ],
    notes: [
      'Drug stores (Matsumoto Kiyoshi, Sundrug) are everywhere',
      'Some Western drugs restricted — bring your own if needed',
      'Stimulant-based cold meds (pseudoephedrine) are controlled',
      '⚠ Certain ADHD/allergy meds are illegal in Japan — check before travel',
    ],
  },
  RO: {
    sign: 'Green cross',
    name: 'Farmacie',
    hours: 'Usually Mon–Fri 8:00–20:00, Sat 8:00–14:00',
    drugs: [
      { generic: 'Ibuprofen', local: 'Nurofen, Ibuprofen', otc: true },
      { generic: 'Paracetamol', local: 'Paracetamol, Parasinus', otc: true },
    ],
    notes: ['Duty pharmacies rotate — "Farmacie de gardă"'],
  },
  BG: {
    sign: 'Green cross',
    name: 'Аптека (Apteka)',
    hours: 'Usually Mon–Fri 8:30–19:00',
    drugs: [
      { generic: 'Ibuprofen', local: 'Ibuprofen, Nurofen', otc: true },
      { generic: 'Paracetamol', local: 'Analgin, Paracetamol', otc: true },
    ],
    notes: [
      'Analgin (metamizole) is common but banned in some Western countries',
      'Prices very affordable',
    ],
  },
};

let pharmacyInitialized = false;

function initPharmacy() {
  pharmacyInitialized = true;
  renderPharmacy();
}

function renderPharmacy() {
  const code = getSelectedCountry();
  const data = PHARMACY_DATA[code];
  if (!data) { document.getElementById('pharmacy-content').innerHTML = ''; return; }

  let html = '';

  // Pharmacy info card
  html += `<div class="embassy-card" style="margin-bottom:1rem">`;
  html += `<div class="embassy-city">💊 ${data.name}</div>`;
  html += `<div class="embassy-row">🔍 Look for: ${data.sign}</div>`;
  html += `<div class="embassy-row">🕐 ${data.hours}</div>`;
  html += `</div>`;

  // Drug table
  html += `<div class="road-section">`;
  html += `<div class="road-section-title">💊 Common Drugs</div>`;
  html += `<div class="rate-table-wrap"><table class="rate-table">`;
  html += `<thead><tr><th>What you need</th><th>Ask for</th></tr></thead><tbody>`;
  data.drugs.forEach(d => {
    html += `<tr><td>${d.generic}</td><td>${d.local}</td></tr>`;
  });
  html += `</tbody></table></div></div>`;

  // Notes
  if (data.notes && data.notes.length) {
    html += `<div class="road-section">`;
    html += `<div class="road-section-title">📋 Notes</div>`;
    html += `<ul class="road-rules">`;
    data.notes.forEach(n => html += `<li>${n}</li>`);
    html += `</ul></div>`;
  }

  document.getElementById('pharmacy-content').innerHTML = html;
}
