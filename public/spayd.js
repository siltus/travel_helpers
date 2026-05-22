/* ══════════════════════════════════════
   SPAYD Viewer
   ══════════════════════════════════════ */
const CZ_BANKS = {
  '0100':'Komerční banka','0300':'ČSOB','0600':'MONETA','0710':'ČNB',
  '0800':'Česká spořitelna','2010':'Fio banka','2020':'MBANK',
  '2030':'Hello bank!','2060':'Citfin','2070':'Moravský Peněžní Ústav',
  '2100':'Hypoteční banka','2200':'Peněžní dům','2220':'Artesa',
  '2240':'Poštová banka','2250':'Banka CREDITAS','2260':'NEY spořitelní družstvo',
  '2275':'Podnikatelská družstevní záložna','2600':'Citibank','2700':'UniCredit Bank',
  '3030':'Air Bank','3050':'BNP Paribas','3060':'PKO BP',
  '3500':'ING Bank','4000':'Max banka','4300':'Národní rozvojová banka',
  '5500':'Raiffeisenbank','5800':'J&T Banka','6000':'PPF banka',
  '6100':'Equa bank','6200':'COMMERZBANK','6210':'mBank (BRE)',
  '6300':'BNP Paribas (Fortis)','6700':'Všeobecná úverová banka',
  '6800':'Sberbank CZ','7910':'Deutsche Sparkassen','7940':'Waldviertler Sparkasse',
  '7950':'Raiffeisen im Waldviertel','7960':'Oberbank','7970':'Česká exportní banka',
  '7980':'Wüstenrot hypoteční banka','7990':'Modrá pyramida',
  '8030':'Raiffeisenbank im Stiftland','8040':'Oberbank AG',
  '8060':'Sparkasse Oberlausitz-Niederschlesien',
  '8090':'Česká spořitelna (Sparkasse)','8150':'HSBC',
  '8190':'Sparkasse Niederbayern-Mitte',
  '8200':'PRIVAT BANK','8215':'TRINITY BANK','8220':'Payment Execution',
  '8230':'EEPAYS','8240':'Družstevní záložna Kredit','8250':'Bank of China',
  '8260':'PAYMASTER','8265':'ICB','8270':'Fairplay Pay',
  '8280':'B-Efekt','8290':'Poštová banka (SK)','8291':'CREDITAS',
  '8292':'NLB Banka','8293':'Banka Creditas','8500':'PrivatBank'
};

/* ── Tab switching ── */
function switchSpaydTab(name) {
  document.querySelectorAll('#page-qr .tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('#page-qr .tab-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('panel-' + name).classList.add('active');
  const idx = { qr: 0, camera: 1, text: 2 }[name];
  document.querySelectorAll('#page-qr .tab')[idx].classList.add('active');
  if (name !== 'camera') stopCamera();
}

/* ── QR image scanning with jsQR ── */
function decodeQRFromImage(imgEl) {
  const canvas = document.createElement('canvas');
  const scale = Math.max(1, Math.ceil(300 / Math.max(imgEl.naturalWidth, imgEl.naturalHeight)));
  canvas.width = imgEl.naturalWidth * scale;
  canvas.height = imgEl.naturalHeight * scale;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(imgEl, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' });
  return code ? code.data : null;
}

function handleImageFile(file) {
  if (!file || !file.type.startsWith('image/')) {
    showSpaydError('Please select an image file'); return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const preview = document.getElementById('qr-preview');
      preview.src = e.target.result;
      preview.style.display = 'block';
      const data = decodeQRFromImage(img);
      if (!data) { showSpaydError('No QR code found in this image. Try a clearer photo.'); return; }
      if (!data.startsWith('SPD') && !data.startsWith('BCD') && !data.startsWith('SPC')) {
        showSpaydError('QR code found but not a recognized payment format: ' + escHtml(data.substring(0, 80)));
        return;
      }
      parseAndShow(data);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function initSpaydEventWiring() {
  var fileInput = document.getElementById('fileInput');
  if (fileInput) {
    fileInput.addEventListener('change', e => handleImageFile(e.target.files[0]));
  }

  var dropzone = document.getElementById('dropzone');
  if (dropzone) {
    dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('dragover'); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    dropzone.addEventListener('drop', e => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files[0]) handleImageFile(e.dataTransfer.files[0]);
    });
  }

  document.addEventListener('paste', e => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        handleImageFile(item.getAsFile());
        const pageQr = document.getElementById('page-qr');
        if (pageQr && pageQr.classList.contains('active')) switchSpaydTab('qr');
        return;
      }
    }
    if (document.activeElement === document.getElementById('input')) {
      setTimeout(parseText, 50);
    }
  });

  var inputEl = document.getElementById('input');
  if (inputEl) {
    inputEl.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); parseText(); }
    });
  }
}

if (typeof document !== 'undefined' && document.getElementById && document.getElementById('fileInput')) {
  initSpaydEventWiring();
}

/* ── Camera scanning ── */
let cameraStream = null;
let cameraScanInterval = null;

function startCamera() {
  const video = document.getElementById('camera-video');
  const wrap = document.getElementById('camera-wrap');
  const status = document.getElementById('camera-status');
  document.getElementById('btn-camera-start').style.display = 'none';
  document.getElementById('btn-camera-stop').style.display = '';
  status.textContent = 'Starting camera…';

  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    .then(stream => {
      cameraStream = stream;
      video.srcObject = stream;
      video.play();
      wrap.style.display = 'block';
      status.textContent = 'Point at a payment QR code…';
      cameraScanInterval = setInterval(scanCameraFrame, 250);
    })
    .catch(err => {
      status.textContent = 'Camera error: ' + err.message;
      document.getElementById('btn-camera-start').style.display = '';
      document.getElementById('btn-camera-stop').style.display = 'none';
    });
}

function scanCameraFrame() {
  const video = document.getElementById('camera-video');
  const canvas = document.getElementById('camera-canvas');
  if (video.readyState !== video.HAVE_ENOUGH_DATA) return;
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(video, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
  if (code && (code.data.startsWith('SPD') || code.data.startsWith('BCD') || code.data.startsWith('SPC'))) {
    stopCamera();
    document.getElementById('camera-status').textContent = '✅ QR code found!';
    parseAndShow(code.data);
  }
}

function stopCamera() {
  if (cameraScanInterval) { clearInterval(cameraScanInterval); cameraScanInterval = null; }
  if (cameraStream) { cameraStream.getTracks().forEach(t => t.stop()); cameraStream = null; }
  document.getElementById('camera-video').srcObject = null;
  document.getElementById('camera-wrap').style.display = 'none';
  document.getElementById('btn-camera-start').style.display = '';
  document.getElementById('btn-camera-stop').style.display = 'none';
}

/* ── Text tab ── */
function parseText() {
  const input = document.getElementById('input').value.trim();
  if (!input) { showSpaydError('Please enter a payment QR string'); return; }
  parseAndShow(input);
}

function loadExample() {
  document.getElementById('input').value = 'SPD*1.0*ACC:CZ1120100000002101727312*AM:1850.00*CC:CZK*X-PER:7*X-VS:2026000111';
  parseText();
}

/* ── SPAYD parser (moved to qr-parsers.js) ── */

/* ── Render result (safe DOM construction) ── */
function parseAndShow(qrString) {
  var errEl = document.getElementById('spayd-error');
  var cardEl = document.getElementById('result');
  var fieldsEl = document.getElementById('fields');
  errEl.style.display = 'none';
  cardEl.style.display = 'none';
  document.getElementById('input').value = qrString;

  var data;
  try { data = detectAndParse(qrString); }
  catch(e) { showSpaydError(e.message); return; }

  document.getElementById('version-badge').textContent = data._format + ' ' + (data._version || '');

  while (fieldsEl.firstChild) fieldsEl.removeChild(fieldsEl.firstChild);
  renderPaymentData(data, fieldsEl);

  cardEl.style.display = 'block';
  cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* renderPaymentData builds the result tree using DOM APIs only.
   Every untrusted value is set via textContent or attribute setters,
   never concatenated into innerHTML. Click-to-copy uses
   addEventListener with the raw value captured in a closure — no
   inline "onclick" attributes are produced from QR content. */
function renderPaymentData(data, container) {
  var doc = container.ownerDocument || document;

  // IBAN (all formats have it)
  if (data.iban) {
    container.appendChild(createPaymentField(doc, 'IBAN', formatIbanNodes(doc, data.iban), data.iban, true));
  }
  if (data.bic) {
    container.appendChild(createPaymentField(doc, 'BIC / SWIFT', data.bic, data.bic));
  }

  // CZ local account (SPAYD specific)
  if (data._format === 'SPAYD' && data.iban && data.iban.startsWith('CZ') && data.iban.length === 24) {
    var bankCode = data.iban.substring(4, 8);
    var prefix = data.iban.substring(8, 14).replace(/^0+/, '');
    var number = data.iban.substring(14, 24).replace(/^0+/, '');
    var local = (prefix ? prefix + '-' : '') + number + '/' + bankCode;
    var bankName = CZ_BANKS[bankCode] || '';
    var displayNode;
    if (bankName) {
      displayNode = doc.createDocumentFragment();
      displayNode.appendChild(doc.createTextNode(local + ' '));
      var span = doc.createElement('span');
      span.style.color = 'var(--muted)';
      span.textContent = '(' + bankName + ')';
      displayNode.appendChild(span);
    } else {
      displayNode = local;
    }
    container.appendChild(createPaymentField(doc, 'CZ Account', displayNode, local));
  }

  // Recipient name
  if (data.recipientName) {
    container.appendChild(createPaymentField(doc, 'Recipient', data.recipientName, data.recipientName));
  }

  // Amount
  if (data.amount != null) {
    var cc = data.currency || '';
    var formatted = data.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    container.appendChild(createSeparator(doc));
    var amountField = createPaymentField(doc, 'Amount', formatted + (cc ? ' ' + cc : ''), data.amount + (cc ? ' ' + cc : ''));
    amountField.classList.add('amount-row');
    container.appendChild(amountField);
  } else if (data.currency) {
    container.appendChild(createPaymentField(doc, 'Currency', data.currency, data.currency));
  }

  // Format-specific fields
  container.appendChild(createSeparator(doc));
  container.appendChild(createSectionLabel(doc, 'Details'));

  if (data._format === 'SPAYD') {
    var fields = data._fields || {};
    if (fields['X-VS']) container.appendChild(createPaymentField(doc, 'Variable Symbol', fields['X-VS'], fields['X-VS'], true));
    if (fields['X-SS']) container.appendChild(createPaymentField(doc, 'Specific Symbol', fields['X-SS'], fields['X-SS'], true));
    if (fields['X-KS']) container.appendChild(createPaymentField(doc, 'Constant Symbol', fields['X-KS'], fields['X-KS'], true));
    if (data.reference) container.appendChild(createPaymentField(doc, 'Reference', data.reference, data.reference));
    if (data.message) container.appendChild(createPaymentField(doc, 'Message', data.message, data.message));
    if (data.date) {
      var d = data.date;
      var pretty = d.length === 8
        ? d.substring(0, 4) + '-' + d.substring(4, 6) + '-' + d.substring(6, 8)
        : d;
      container.appendChild(createPaymentField(doc, 'Due Date', pretty, d));
    }
    if (data.paymentType) container.appendChild(createPaymentField(doc, 'Payment Type', data.paymentType, data.paymentType));
  }

  if (data._format === 'EPC') {
    if (data.purpose) container.appendChild(createPaymentField(doc, 'Purpose', data.purpose, data.purpose));
    if (data.remittanceUnstructured) container.appendChild(createPaymentField(doc, 'Reference', data.remittanceUnstructured, data.remittanceUnstructured));
    if (data.remittanceStructured) container.appendChild(createPaymentField(doc, 'Structured Ref', data.remittanceStructured, data.remittanceStructured));
    if (data.information) container.appendChild(createPaymentField(doc, 'Information', data.information, data.information));
  }

  if (data._format === 'SwissQR') {
    if (data.creditor && data.creditor.street) {
      var addr = formatSwissAddress(data.creditor);
      container.appendChild(createPaymentField(doc, 'Address', addr, addr));
    }
    if (data.referenceType && data.referenceType !== 'NON') container.appendChild(createPaymentField(doc, 'Ref Type', data.referenceType, data.referenceType));
    if (data.reference) container.appendChild(createPaymentField(doc, 'Reference', data.reference, data.reference));
    if (data.message) container.appendChild(createPaymentField(doc, 'Message', data.message, data.message));
    if (data.debtor) container.appendChild(createPaymentField(doc, 'Debtor', data.debtor.name || '', data.debtor.name || ''));
  }

  // Warnings
  if (data._warnings && data._warnings.length) {
    container.appendChild(createSeparator(doc));
    container.appendChild(createSectionLabel(doc, '⚠ Warnings'));
    data._warnings.forEach(function(w) {
      var field = doc.createElement('div');
      field.className = 'field';
      var lbl = doc.createElement('div');
      lbl.className = 'field-label';
      lbl.style.color = 'var(--error)';
      lbl.textContent = '⚠';
      field.appendChild(lbl);
      var val = doc.createElement('div');
      val.className = 'field-value';
      val.style.color = 'var(--error)';
      val.textContent = w;
      field.appendChild(val);
      container.appendChild(field);
    });
  }
}

function formatSwissAddress(addr) {
  if (!addr) return '';
  if (addr.type === 'K') {
    return [addr.addressLine1, addr.addressLine2, addr.country].filter(Boolean).join(', ');
  }
  return [addr.street, addr.buildingNumber, addr.postalCode, addr.city, addr.country].filter(Boolean).join(', ');
}

/* ── Helpers ── */
function formatIbanNodes(doc, iban) {
  var groups = String(iban).replace(/(.{4})/g, '$1 ').trim().split(' ');
  var frag = doc.createDocumentFragment();
  groups.forEach(function(g, i) {
    var span = doc.createElement('span');
    span.className = 'iban-group';
    span.textContent = g;
    frag.appendChild(span);
    if (i < groups.length - 1) frag.appendChild(doc.createTextNode(' '));
  });
  return frag;
}

function createPaymentField(doc, label, displayContent, copyValue, mono) {
  var field = doc.createElement('div');
  field.className = 'field';
  field.addEventListener('click', function() {
    if (typeof copyVal === 'function') copyVal(copyValue == null ? '' : String(copyValue));
  });

  var labelEl = doc.createElement('div');
  labelEl.className = 'field-label';
  labelEl.textContent = label;
  field.appendChild(labelEl);

  var valueEl = doc.createElement('div');
  valueEl.className = mono ? 'field-value mono' : 'field-value';
  appendDisplayContent(doc, valueEl, displayContent);
  field.appendChild(valueEl);
  return field;
}

function appendDisplayContent(doc, valueEl, displayContent) {
  if (displayContent == null) return;
  if (typeof displayContent === 'string' || typeof displayContent === 'number') {
    valueEl.textContent = String(displayContent);
  } else if (displayContent.nodeType) {
    valueEl.appendChild(displayContent);
  } else if (Array.isArray(displayContent)) {
    displayContent.forEach(function(n) {
      if (n && n.nodeType) valueEl.appendChild(n);
      else if (n != null) valueEl.appendChild(doc.createTextNode(String(n)));
    });
  } else {
    valueEl.textContent = String(displayContent);
  }
}

function createSeparator(doc) {
  var sep = doc.createElement('div');
  sep.className = 'separator';
  return sep;
}

function createSectionLabel(doc, text) {
  var lbl = doc.createElement('div');
  lbl.className = 'section-label';
  lbl.textContent = text;
  return lbl;
}

function showSpaydError(msg) {
  const el = document.getElementById('spayd-error');
  el.textContent = '⚠ ' + msg;
  el.style.display = 'block';
}

function clearAll() {
  document.getElementById('input').value = '';
  document.getElementById('spayd-error').style.display = 'none';
  document.getElementById('result').style.display = 'none';
  document.getElementById('qr-preview').style.display = 'none';
  document.getElementById('fileInput').value = '';
}

function copyAll() {
  const lines = [];
  document.getElementById('fields').querySelectorAll('.field').forEach(f => {
    const label = f.querySelector('.field-label')?.textContent || '';
    const value = f.querySelector('.field-value')?.textContent?.trim() || '';
    if (label && value) lines.push(`${label}: ${value}`);
  });
  navigator.clipboard.writeText(lines.join('\n')).then(() => showToast('All fields copied!'));
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    renderPaymentData,
    createPaymentField,
    formatIbanNodes,
    formatSwissAddress,
    createSeparator,
    createSectionLabel,
  };
}
