const express = require('express');
const fs = require('fs');
const path = require('path');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;
const CACHE_DIR = path.join(__dirname, 'cache');
const CACHE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days
const FETCH_TIMEOUT_MS = 15 * 1000;              // 15 s upstream timeout
const FETCH_MAX_BYTES = 2 * 1024 * 1024;         // 2 MiB response cap

if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR);

// Embassy URL mapping
const EMBASSY_PATHS = {
  CZ: 'czechrepublic', PL: 'poland', HU: 'hungary', DE: 'berlin',
  AT: 'austria', IT: 'italy', FR: 'france', ES: 'spain',
  PT: 'portugal', GR: 'greece', HR: 'croatia', NL: 'netherlands',
  BE: 'belgium', TR: 'ankara', GB: 'england', CH: 'switzerland',
  TH: 'thailand', JP: 'japan', RO: 'romania', BG: 'bulgaria',
};

const EMBASSY_CITIES = {
  CZ: 'Prague', PL: 'Warsaw', HU: 'Budapest', DE: 'Berlin',
  AT: 'Vienna', IT: 'Rome', FR: 'Paris', ES: 'Madrid',
  PT: 'Lisbon', GR: 'Athens', HR: 'Zagreb', NL: 'The Hague',
  BE: 'Brussels', TR: 'Ankara', GB: 'London', CH: 'Bern',
  TH: 'Bangkok', JP: 'Tokyo', RO: 'Bucharest', BG: 'Sofia',
};

/* fetchPage fetches an HTTPS resource with a hard timeout, a bounded
   response size, and a redirect cap. Without these, a stalled or
   malicious upstream embassy server could hold sockets open indefinitely
   or send an unbounded body and exhaust memory.

   `opts.client` is a test seam: it lets tests pass `require('http')`
   so a local cleartext fixture can exercise the size-cap / timeout
   branches without needing a self-signed TLS cert. Production code
   never sets `opts.client`, so the default https.get path is preserved.
*/
function fetchPage(url, opts) {
  const timeoutMs = (opts && opts.timeoutMs) || FETCH_TIMEOUT_MS;
  const maxBytes = (opts && opts.maxBytes) || FETCH_MAX_BYTES;
  const client = (opts && opts.client) || https;
  return new Promise((resolve, reject) => {
    const doFetch = (u, redirects) => {
      if (redirects > 5) return reject(new Error('Too many redirects'));
      const req = client.get(u, { headers: { 'User-Agent': 'TravelHelpers/1.0' } }, res => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const next = res.headers.location.startsWith('http')
            ? res.headers.location
            : new URL(res.headers.location, u).href;
          res.resume();
          return doFetch(next, redirects + 1);
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        let total = 0;
        const chunks = [];
        res.on('data', chunk => {
          total += chunk.length;
          if (total > maxBytes) {
            res.destroy();
            req.destroy();
            return reject(new Error(`Response exceeded ${maxBytes} bytes`));
          }
          chunks.push(chunk);
        });
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        res.on('error', reject);
      });
      req.setTimeout(timeoutMs, () => {
        req.destroy(new Error(`Request timed out after ${timeoutMs}ms`));
      });
      req.on('error', reject);
    };
    doFetch(url, 0);
  });
}

function parseEmbassyHtml(html, code) {
  const result = {
    city: EMBASSY_CITIES[code],
    url: `https://embassies.gov.il/${EMBASSY_PATHS[code]}/en`,
    contacts: `https://embassies.gov.il/${EMBASSY_PATHS[code]}/en/contacts`,
    phones: [],
    emails: [],
    address: null,
    hours: null,
    name: null,
  };

  // Embassy name
  const nameMatch = html.match(/<div class="location-name">([^<]+)<\/div>/);
  if (nameMatch) result.name = nameMatch[1].trim();

  // Phones: grab all title+number pairs from the page
  const allPhones = [...html.matchAll(
    /<div class="field-title">([^<]+)<\/div>\s*(?:\n\s*)*<div class="field-phone-number"><a href="tel:([^"]+)">/g
  )];
  for (const m of allPhones) {
    result.phones.push({ label: m[1].trim(), number: m[2].trim() });
  }

  // Emails
  const emailMatches = html.matchAll(
    /<div class="field-title">([^<]+)<\/div>\s*\n?\s*<div class="field-email-address"><a href="mailto:([^"]+)"/g
  );
  for (const m of emailMatches) {
    result.emails.push({ label: m[1].trim(), address: m[2].trim() });
  }

  // Address
  const addrMatch = html.match(/<div class="full-address">([\s\S]*?)<\/div>/);
  if (addrMatch) {
    result.address = addrMatch[1]
      .replace(/<br\s*\/?>/g, ', ')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .replace(/,\s*,/g, ',')
      .trim()
      .replace(/^,\s*/, '')
      .replace(/,\s*$/, '');
  }

  // Working hours
  const hoursMatch = html.match(/<div class="field-working-time">([^<]+)<\/div>/);
  if (hoursMatch) result.hours = hoursMatch[1].trim();

  // Working days
  const daysMatch = html.match(/<div class="field-day">([\s\S]*?)<\/div>/);
  if (daysMatch && result.hours) {
    const days = daysMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    // Abbreviate "Monday, Tuesday, Wednesday, Thursday, Friday" → "Mon–Fri"
    if (/Monday.*Friday/i.test(days)) {
      result.hours = 'Mon–Fri ' + result.hours;
    } else {
      result.hours = days + ' ' + result.hours;
    }
  }

  // Google Maps link
  const mapsMatch = html.match(/href="(https:\/\/www\.google\.com\/maps\/dir\/\/[^"]+)"/);
  if (mapsMatch) result.mapsUrl = mapsMatch[1].replace(/&amp;/g, '&');

  return result;
}

/* readCachedEmbassy reads and parses a cache file safely. A truncated or
   corrupted cache entry must not crash the endpoint — it should be
   reported as null so callers can refetch or fall back. */
function readCachedEmbassy(cacheFile) {
  try {
    const raw = fs.readFileSync(cacheFile, 'utf8');
    return JSON.parse(raw);
  } catch (_err) {
    // Best-effort: delete the corrupt file so the next request refetches.
    try { fs.unlinkSync(cacheFile); } catch (_unlinkErr) { /* ignore */ }
    return null;
  }
}

/* Test seam: the embassy route invokes `fetchImpl(url)` instead of
   calling `fetchPage` directly. Tests can call setFetchImplForTest(fn)
   to install a deterministic stub (e.g. one that rejects) so the
   stale-cache fallback branch can be exercised without depending on
   real network conditions. Production code never calls the setter. */
let fetchImpl = fetchPage;
function setFetchImplForTest(fn) { fetchImpl = fn || fetchPage; }

// API endpoint
app.get('/api/embassy/:code', async (req, res) => {
  const code = req.params.code.toUpperCase();
  if (!EMBASSY_PATHS[code]) {
    return res.status(404).json({ error: 'Unknown country code' });
  }

  // Check disk cache
  const cacheFile = path.join(CACHE_DIR, `embassy_${code}.json`);
  if (fs.existsSync(cacheFile)) {
    const stat = fs.statSync(cacheFile);
    if (Date.now() - stat.mtimeMs < CACHE_MAX_AGE) {
      const cached = readCachedEmbassy(cacheFile);
      if (cached) {
        cached._cached = true;
        return res.json(cached);
      }
      // fell through: corrupt cache, treat as a miss and refetch.
    }
  }

  // Scrape
  try {
    const url = `https://embassies.gov.il/${EMBASSY_PATHS[code]}/en/contacts`;
    const html = await fetchImpl(url);
    const data = parseEmbassyHtml(html, code);
    data._fetched = new Date().toISOString();

    fs.writeFileSync(cacheFile, JSON.stringify(data, null, 2));
    res.json(data);
  } catch (err) {
    // Return stale cache if available
    if (fs.existsSync(cacheFile)) {
      const cached = readCachedEmbassy(cacheFile);
      if (cached) {
        cached._cached = true;
        cached._stale = true;
        return res.json(cached);
      }
    }
    res.status(502).json({ error: 'Failed to fetch embassy data: ' + err.message });
  }
});

// All embassies endpoint
app.get('/api/embassies', async (req, res) => {
  const results = {};
  for (const code of Object.keys(EMBASSY_PATHS)) {
    const cacheFile = path.join(CACHE_DIR, `embassy_${code}.json`);
    if (fs.existsSync(cacheFile)) {
      const cached = readCachedEmbassy(cacheFile);
      results[code] = cached || { city: EMBASSY_CITIES[code], url: `https://embassies.gov.il/${EMBASSY_PATHS[code]}/en` };
    } else {
      results[code] = { city: EMBASSY_CITIES[code], url: `https://embassies.gov.il/${EMBASSY_PATHS[code]}/en` };
    }
  }
  res.json(results);
});

// Vendored jsQR (pinned via package.json + package-lock.json instead of
// loaded from an unpinned CDN at runtime).
app.get('/vendor/jsQR.min.js', (req, res) => {
  res.type('application/javascript');
  res.sendFile(path.join(__dirname, 'node_modules', 'jsqr', 'dist', 'jsQR.js'));
});

// Static files
app.use(express.static(path.join(__dirname, 'public')));

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Travel Helpers running on http://localhost:${PORT}`);
  });
}

module.exports = {
  app,
  fetchPage,
  parseEmbassyHtml,
  readCachedEmbassy,
  setFetchImplForTest,
  EMBASSY_PATHS,
  EMBASSY_CITIES,
  CACHE_DIR,
};
