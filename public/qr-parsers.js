/* ══════════════════════════════════════
   QR Payment Parsers
   SPAYD (CZ/SK) · EPC QR (SEPA) · Swiss QR (CH)
   ══════════════════════════════════════ */

/* ── IBAN validation (MOD-97) ── */
function validateIban(iban) {
  const cleaned = iban.replace(/\s/g, '').toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{4,30}$/.test(cleaned)) return false;
  const rearranged = cleaned.slice(4) + cleaned.slice(0, 4);
  const numStr = rearranged.replace(/[A-Z]/g, ch => (ch.charCodeAt(0) - 55).toString());
  let remainder = 0;
  for (let i = 0; i < numStr.length; i += 7) {
    remainder = parseInt(remainder + numStr.substring(i, i + 7), 10) % 97;
  }
  return remainder === 1;
}

/* ── HTML escaping (XSS prevention for QR content) ── */
function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* ══════════════════════════════════════
   SPAYD Parser (CZ/SK)
   Format: SPD*1.0*KEY:VALUE*KEY:VALUE*...
   ══════════════════════════════════════ */
function parseSpayd(str) {
  str = str.trim();
  const parts = str.split('*');
  if (parts[0] !== 'SPD')
    throw new Error('Not a SPAYD string — must start with "SPD*"');
  if (!parts[1] || !/^\d+\.\d+$/.test(parts[1]))
    throw new Error('Invalid or missing protocol version');

  const result = { _format: 'SPAYD', _version: parts[1], _fields: {} };
  for (let i = 2; i < parts.length; i++) {
    const idx = parts[i].indexOf(':');
    if (idx < 1) continue;
    const key = parts[i].substring(0, idx);
    const val = decodeURIComponent(parts[i].substring(idx + 1));
    result._fields[key] = val;
  }
  if (!result._fields['ACC'])
    throw new Error('Missing required ACC (account) field');

  // Extract standard fields.
  // SPAYD AM (amount) must be a complete non-negative decimal. Bare
  // parseFloat() accepts truncated input like "100abc" and silently
  // turns it into 100, which would change the payment instruction.
  const acc = result._fields['ACC'].split('+');
  result.iban = acc[0];
  result.bic = acc[1] || null;
  if (result._fields['AM']) {
    const am = result._fields['AM'];
    if (!/^\d+(?:\.\d+)?$/.test(am)) {
      throw new Error('Invalid amount: ' + am + ' (expected non-negative decimal, e.g. 1850.00)');
    }
    const parsed = parseFloat(am);
    if (!Number.isFinite(parsed)) {
      throw new Error('Invalid amount: ' + am);
    }
    result.amount = parsed;
  } else {
    result.amount = null;
  }
  result.currency = result._fields['CC'] || null;
  result.recipientName = result._fields['RN'] || null;
  result.reference = result._fields['RF'] || null;
  result.date = result._fields['DT'] || null;
  result.message = result._fields['MSG'] || null;
  result.paymentType = result._fields['PT'] || null;

  if (result.iban && !validateIban(result.iban))
    result._warnings = (result._warnings || []).concat('IBAN checksum invalid');

  return result;
}

/* ══════════════════════════════════════
   EPC QR Parser (SEPA)
   Format: 12 positional fields separated by \n
   ══════════════════════════════════════ */
function parseEpcQr(str) {
  str = str.trim();
  // Normalize line endings
  const lines = str.replace(/\r\n/g, '\n').split('\n');

  if (lines[0] !== 'BCD')
    throw new Error('Not an EPC QR code — must start with "BCD"');

  const version = lines[1];
  if (version !== '001' && version !== '002')
    throw new Error('Unsupported EPC QR version: ' + version);

  const charset = parseInt(lines[2], 10);
  if (isNaN(charset) || charset < 1 || charset > 8)
    throw new Error('Invalid character set: ' + lines[2]);

  const identification = lines[3];
  if (identification !== 'SCT')
    throw new Error('Unknown identification code: ' + identification + ' (expected SCT)');

  const iban = (lines[6] || '').trim();
  if (!iban)
    throw new Error('Missing IBAN (field 7)');

  const name = (lines[5] || '').trim();
  if (!name)
    throw new Error('Missing beneficiary name (field 6)');

  // Parse amount: "EUR123.45" or empty
  let amount = null;
  let currency = 'EUR';
  const amountStr = (lines[7] || '').trim();
  if (amountStr) {
    const amtMatch = amountStr.match(/^([A-Z]{3})(\d+(?:\.\d+)?)$/);
    if (amtMatch) {
      currency = amtMatch[1];
      amount = parseFloat(amtMatch[2]);
    } else {
      throw new Error('Invalid amount format: ' + amountStr + ' (expected e.g. EUR123.45)');
    }
  }

  const result = {
    _format: 'EPC',
    _version: version,
    _charset: charset,
    bic: (lines[4] || '').trim() || null,
    recipientName: name,
    iban: iban,
    amount: amount,
    currency: currency,
    purpose: (lines[8] || '').trim() || null,
    remittanceUnstructured: (lines[9] || '').trim() || null,
    remittanceStructured: (lines[10] || '').trim() || null,
    information: (lines[11] || '').trim() || null,
  };

  if (!validateIban(result.iban))
    result._warnings = (result._warnings || []).concat('IBAN checksum invalid');

  // Remittance: only one of structured/unstructured should be set
  if (result.remittanceUnstructured && result.remittanceStructured)
    result._warnings = (result._warnings || []).concat('Both structured and unstructured remittance present');

  return result;
}

/* ══════════════════════════════════════
   Swiss QR Parser (SPC)
   Format: ~31 positional fields separated by \r\n or \n
   ══════════════════════════════════════ */
function parseSwissQr(str) {
  str = str.trim();
  const lines = str.replace(/\r\n/g, '\n').split('\n');

  if (lines[0] !== 'SPC')
    throw new Error('Not a Swiss QR code — must start with "SPC"');

  if (lines[1] !== '0200')
    throw new Error('Unsupported Swiss QR version: ' + lines[1]);

  const coding = lines[2];
  if (coding !== '1')
    throw new Error('Unsupported coding type: ' + coding);

  const iban = (lines[3] || '').trim();
  if (!iban)
    throw new Error('Missing creditor IBAN');

  // Creditor address: type is at position 4 (S or K — currently unused
  // but parsed to document the field's existence and validate the layout).
  const _creditorAddrType = (lines[4] || '').trim();
  const creditor = parseSwissAddress(lines, 4);

  // Ultimate creditor: positions 11-17
  const ultimateCreditor = parseSwissAddress(lines, 11);

  // Amount and currency.
  // SwissQR amount must be empty or a non-negative decimal with up to two
  // fractional digits. parseFloat() alone accepts truncated input like
  // "10abc" and silently turns it into 10 — that is unacceptable for a
  // payment instruction. Reject anything that is not a complete number.
  const amountStr = (lines[18] || '').trim();
  let amount = null;
  if (amountStr) {
    if (!/^\d+(?:\.\d{1,2})?$/.test(amountStr)) {
      throw new Error('Invalid amount: ' + amountStr + ' (expected non-negative decimal, e.g. 1949.75)');
    }
    amount = parseFloat(amountStr);
    if (!Number.isFinite(amount)) {
      throw new Error('Invalid amount: ' + amountStr);
    }
  }
  const currency = (lines[19] || '').trim();
  if (currency && currency !== 'CHF' && currency !== 'EUR')
    throw new Error('Invalid currency: ' + currency + ' (must be CHF or EUR)');

  // Debtor: positions 20-26
  const debtor = parseSwissAddress(lines, 20);

  // Reference
  const refType = (lines[27] || '').trim();
  if (refType && !['QRR', 'SCOR', 'NON'].includes(refType))
    throw new Error('Invalid reference type: ' + refType + ' (must be QRR, SCOR, or NON)');

  const reference = (lines[28] || '').trim() || null;
  const unstructuredMsg = (lines[29] || '').trim() || null;

  // Trailer
  const trailer = (lines[30] || '').trim();

  // Billing info
  const billingInfo = (lines[31] || '').trim() || null;

  // Alternative schemes
  const av1 = (lines[32] || '').trim() || null;
  const av2 = (lines[33] || '').trim() || null;

  const result = {
    _format: 'SwissQR',
    _version: '0200',
    iban: iban,
    creditor: creditor,
    ultimateCreditor: ultimateCreditor.name ? ultimateCreditor : null,
    amount: amount,
    currency: currency || 'CHF',
    debtor: debtor.name ? debtor : null,
    referenceType: refType || 'NON',
    reference: reference,
    message: unstructuredMsg,
    billingInfo: billingInfo,
    recipientName: creditor.name,
    _av1: av1,
    _av2: av2,
  };

  const warnings = [];
  if (trailer && trailer !== 'EPD')
    warnings.push('Expected trailer "EPD", got "' + trailer + '"');
  if (!validateIban(result.iban))
    warnings.push('IBAN checksum invalid');
  if (refType === 'QRR' && !reference)
    warnings.push('QRR reference type but no reference provided');
  if (refType === 'SCOR' && !reference)
    warnings.push('SCOR reference type but no reference provided');
  if (refType === 'NON' && reference)
    warnings.push('NON reference type but reference is present');
  if (warnings.length) result._warnings = warnings;

  return result;
}

function parseSwissAddress(lines, startIdx) {
  const addrType = (lines[startIdx] || '').trim();
  const name = (lines[startIdx + 1] || '').trim() || null;
  const line1 = (lines[startIdx + 2] || '').trim() || null;
  const line2 = (lines[startIdx + 3] || '').trim() || null;
  const postal = (lines[startIdx + 4] || '').trim() || null;
  const city = (lines[startIdx + 5] || '').trim() || null;
  const country = (lines[startIdx + 6] || '').trim() || null;

  if (addrType === 'K') {
    // Combined: line1 and line2 are full address lines
    return {
      type: 'K', name,
      addressLine1: line1, addressLine2: line2,
      country,
    };
  }
  // Structured (S) or empty
  return {
    type: addrType || null, name,
    street: line1, buildingNumber: line2,
    postalCode: postal, city, country,
  };
}

/* ══════════════════════════════════════
   Auto-detect format and parse
   ══════════════════════════════════════ */
function detectAndParse(str) {
  str = str.trim();
  if (str.startsWith('SPD*')) return parseSpayd(str);
  if (str.startsWith('BCD\n') || str.startsWith('BCD\r\n')) return parseEpcQr(str);
  if (str.startsWith('SPC\n') || str.startsWith('SPC\r\n')) return parseSwissQr(str);
  throw new Error('Unknown QR payment format. Expected SPAYD (SPD*), EPC QR (BCD), or Swiss QR (SPC).');
}

/* ── Country → QR format mapping ── */
const QR_COUNTRY_FORMAT = {
  CZ: 'SPAYD', SK: 'SPAYD',
  DE: 'EPC', AT: 'EPC', NL: 'EPC', BE: 'EPC',
  IT: 'EPC', FR: 'EPC', ES: 'EPC', PT: 'EPC',
  GR: 'EPC', HR: 'EPC', FI: 'EPC',
  CH: 'SwissQR',
};

const QR_FORMAT_LABELS = {
  SPAYD: '💳 SPAYD',
  EPC: '💳 EPC QR',
  SwissQR: '💳 Swiss QR',
};

/* ── Node.js exports for testing ── */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    parseSpayd, parseEpcQr, parseSwissQr, detectAndParse,
    validateIban, escHtml, QR_COUNTRY_FORMAT, QR_FORMAT_LABELS,
  };
}
