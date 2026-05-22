# 🧳 Travel Helpers

A multitool for travelers — mobile-friendly, dark-themed, offline-capable where possible.

## Tools

### 💳 SPAYD / EPC / Swiss QR Viewer
Decode Czech SPAYD, EPC and Swiss payment QR codes. Scan via camera, drop an image, or paste the raw string.
All decoding happens client-side; the parser is strict about amount fields and rejects malformed input rather than truncating silently.

### 💱 Exchange Rates
Quick-reference conversion tables between your local travel currency and ILS, EUR, USD.
Rates from ECB via [frankfurter.dev](https://frankfurter.dev), cached 24h client-side.

### 🧮 Tip Calculator
Country-aware tipping guidance with calculated amounts and home-currency equivalents.

### 🆘 Emergency Info
Emergency numbers, Israeli embassy contacts (scraped live from embassies.gov.il), MFA situation room.
Scraped content is rendered using DOM construction with explicit URL validation — `javascript:` / `data:` URLs found in scraped pages are dropped, not rendered.

### 🚗 Road Rules
Speed limits, alcohol limits, key driving rules, and notable road signs with SVG illustrations.

### 💊 Pharmacy / 🚌 Transit / 💳 Payment
Local conventions for pharmacies, public transit, and payment methods per country.

## Running

### Local development
```bash
npm install
npm start        # http://localhost:3000
```

### Docker (production)
```bash
docker compose up -d
```

Embassy data is scraped from embassies.gov.il on first request and cached to disk for 30 days.

## Testing & quality gate

```bash
npm test            # all suites
npm run coverage    # full coverage with 90% line floor
npm run lint        # eslint
npm run audit       # npm audit (fails at high+)
npm run gate        # lint + coverage + audit (also runs as pre-commit hook)
```

See **[GETTING_STARTED.md](GETTING_STARTED.md)** for a deeper walkthrough and
**[ARCHITECTURE.md](ARCHITECTURE.md)** for the design and security posture.

