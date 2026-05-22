# Architecture

Travel Helpers is a small Node.js / Express server that ships a static
single-page UI plus one server-side capability: scraping and caching
contact data for Israeli embassies abroad.

```
┌────────────┐         ┌────────────────────────────┐
│  Browser   │ ──GET── │ Express (server.js)        │
│ public/    │         │  /                         │
│ (vanilla   │         │  /vendor/jsQR.min.js       │
│  JS)       │         │  /api/embassies            │
└─────┬──────┘         │  /api/embassy/:code        │
      │                └──────────┬─────────────────┘
      │                           │
      │                  miss /   │
      │                  stale    │
      │                           ▼
      │              ┌─────────────────────────────┐
      │              │ https://embassies.gov.il/.. │
      │              │ (HTML scrape, then cached   │
      │              │  for 30 days under cache/)  │
      │              └─────────────────────────────┘
```

## Server (`server.js`)

* **`fetchPage(url, { timeoutMs = 15_000, maxBytes = 2 * 1024 * 1024 })`** —
  HTTPS GET with a configurable wall-clock timeout and a hard cap on
  response bytes. Both limits cancel the underlying socket on breach so
  a hostile or slow upstream cannot exhaust the process.
* **`parseEmbassyHtml(html, code)`** — tolerant DOM-light parser over
  the public embassies.gov.il page. Extracts name, address, phones,
  emails, hours.
* **`readCachedEmbassy(cacheFile)`** — wraps `JSON.parse` in try/catch
  and `fs.unlinkSync`'s the file if it is corrupt, so a truncated /
  half-written cache cannot crash the API.
* **`/api/embassy/:code`** — returns fresh cache if < 30 days old
  (see `CACHE_MAX_AGE` in `server.js`), else re-fetches upstream.
  Falls back to the stale cache on upstream failure rather than
  returning 502 if any cache exists.
* **`/api/embassies`** — returns a metadata sketch (city + URL) for
  every supported country; surfaces cached records when available.
* **`/vendor/jsQR.min.js`** — serves the pinned `jsqr` package file
  out of `node_modules/`. The UI loads this URL instead of an
  unpinned CDN, so the version is locked by `package-lock.json` and
  cannot silently change at runtime.

The server module is `require()`able for tests: `app.listen` runs only
when invoked as `require.main === module`.

## UI (`public/`)

All UI logic is vanilla JS (no framework) loaded as `<script>` tags.

* **`qr-parsers.js`** — pure parsing logic for SPAYD, EPC and Swiss QR
  payment payloads. Strict numeric validation: amount fields that don't
  match `^\d+(?:\.\d{1,2})?$` (Swiss) / `^\d+(?:\.\d+)?$` (SPAYD) throw
  rather than coerce silently.
* **`url-safety.js`** — `safeTelHref` / `safeMailtoHref` /
  `safeHttpHref`. Each returns `null` for any unsafe input
  (`javascript:`, `data:`, embedded newlines, etc.); callers MUST treat
  `null` as "do not render this link at all".
* **`spayd.js`** — renders parsed QR data using `document.createElement`
  + `textContent` + `addEventListener`. **No `innerHTML` string
  concatenation; no inline `onclick` strings.** Field click handlers
  are attached in JS and reference the raw value via closure.
* **`emergency.js`** — same DOM-construction discipline for embassy
  cards. Wraps each `renderSos()` call with a monotonic
  `sosRenderToken`: if the user changes country while an embassy fetch
  is in flight, the stale response cannot overwrite the now-current
  screen.
* **`countries.js`, `exchange.js`, `tip.js`, `road.js`, `pharmacy.js`,
  `transit.js`, `payment.js`, `app.js`** — page-specific UI modules.

## Security posture

* CSP `<meta>` in `index.html` restricts `script-src`, `style-src`,
  `font-src`, `object-src`, `frame-src` to `'self'` (plus
  `'unsafe-inline'` for script/style and `data:` for fonts and the
  favicon SVG). `connect-src` is `'self' https://api.frankfurter.dev`
  — the rates API in `exchange.js` is the only allowed external
  endpoint; every other XHR must hit the same origin. `img-src` is
  `'self' data: blob:` — no external image origins are permitted; the
  `data:` token covers the inline favicon and `FileReader` data URLs
  used by the QR preview, `blob:` covers any future in-memory image
  blobs. `'unsafe-inline'` for `script-src` / `style-src` is retained
  as a transitional compromise because `index.html` ships ~22
  author-controlled inline `onclick` attributes; removing them is
  tracked as follow-up work. The pinned directives are asserted by
  `test/test-index-html.js` so the policy cannot silently widen.
* All untrusted strings (parsed QR fields, scraped embassy data) reach
  the DOM via `textContent`, never `innerHTML`.
* All URLs sourced from scraped pages are run through `url-safety.js`
  before becoming `<a href=…>` — non-`tel:`/`mailto:`/`https?:` schemes
  are dropped.
* The `jsqr` decoder is pinned in `package-lock.json` and served from
  the local `node_modules/`, not from a CDN.
* The Express embassy fetcher caps response time and size to prevent
  a hostile upstream from hanging or OOMing the process.

## Testing

Test discovery is by convention: `test/run-tests.js` spawns every
`test-*.js` file in `test/` in its own child process and aggregates
exit codes. Helper modules use a leading underscore
(e.g. `test/_jsdom-helper.js`) so they are not picked up as suites.
The current suites are:

* `test/test-qr-parsers.js` — parser unit tests (SPAYD, EPC, Swiss),
  XSS rejection, country mapping, strict amount validation.
* `test/test-url-safety.js` — URL validator allow/deny matrix.
* `test/test-spayd-render.js` — jsdom-driven renderer tests; asserts
  that malicious QR fields cannot produce `<img>`/`<script>` or
  `onclick`/`onerror` attributes.
* `test/test-emergency-render.js` — jsdom-driven embassy renderer
  tests; XSS in scraped fields, race-condition under country switch,
  `javascript:` / `data:` URL rejection.
* `test/test-server.js` — supertest against the Express app:
  `/api/embassy/:code` (cached / corrupt / unknown), `/api/embassies`,
  `/vendor/jsQR.min.js`, `fetchPage` timeout and size cap.
* `test/test-app.js` — `switchPage`, `updateQrTabVisibility`,
  `toggleMenu`, `copyVal`, `showToast` against a jsdom-driven shell.
* `test/test-countries.js` — country select population, persistence,
  and the `loadCachedRates` localStorage round-trip.
* `test/test-exchange.js` — exchange-rates rendering, conversion
  helpers, and the `populateCurrencySelect` ordering invariant.
* `test/test-tip.js` — country-aware tipping calculator and the
  home-currency equivalent formatter.
* `test/test-road.js`, `test/test-pharmacy.js`, `test/test-transit.js`,
  `test/test-payment.js` — page-specific data + render coverage for
  the road-rules, pharmacy, transit, and payment pages.
* `test/test-index-html.js` — static regression that parses
  `public/index.html` and pins the CSP directives shipped to users
  (no `https:` wildcard in `connect-src` or `img-src`, etc.).
* `test/test-dockerfile.js` — static checks on the production
  container build (`--omit=dev --ignore-scripts`, copy ordering).
* `test/run-tests.js` — the discovery + aggregation runner itself.

`npm run gate` chains `lint`, `coverage` (90% line floor), and `audit`
(npm advisory database, fail at high+). The same command runs as a
husky `pre-commit` hook.
