# Getting started

## Prerequisites

* Node.js 20+ and npm 10+ (developed against Node 24, npm 11).
* A POSIX-like shell for husky hooks. On Windows, husky uses Git Bash
  via `core.sh.exe`, which is bundled with Git for Windows.

## Install

```bash
git clone <repo-url> travel_helpers
cd travel_helpers
npm install
```

`npm install` also installs the husky pre-commit hook (via the
`prepare` script).

## Run

```bash
npm start                 # http://localhost:3000
PORT=4000 npm start       # override port
```

The server scrapes embassy data on first request for a country and
caches the response under `cache/embassy_<CODE>.json` for 30 days.

## Run the tests

```bash
npm test                  # all suites, no coverage report
npm run coverage          # full coverage with 90% line floor (HTML in coverage/)
npm run lint              # eslint with the project's flat config
npm run audit             # npm audit, fail at high+
npm run gate              # lint + coverage + audit (same as pre-commit hook)
```

`npm test` runs `test/run-tests.js` which sequentially spawns each
`test-*.js` file in `test/` and aggregates the exit codes.

To bypass the pre-commit gate in an emergency:

```bash
AIDOR_SKIP_GATE=1 git commit -m "..."
```

(Only use this for mechanical fixups — every normal commit must pass
the gate.)

## Docker

```bash
docker compose up -d      # production-style: builds the image
docker compose logs -f
```

`docker-compose.yml` publishes the container's port 3000 on host port
**7777** (`http://localhost:7777`). Change the left side of the
`ports:` mapping if you need a different host port.

Embassy cache lives in the named Docker volume `embassy-cache` (mounted
at `/app/cache` inside the container), so cached embassy JSON survives
container restarts and re-creations.

## Project layout

```
.
├── server.js                  Express app + embassy scraper + jsQR vendor route
├── public/                    Static UI (vanilla JS, no framework)
│   ├── index.html
│   ├── qr-parsers.js          Pure parsing for SPAYD / EPC / Swiss QR
│   ├── url-safety.js          safe{Tel,Mailto,Http}Href validators
│   ├── spayd.js               QR scanner UI (DOM construction, no innerHTML)
│   ├── emergency.js           Embassy + emergency numbers UI
│   ├── countries.js exchange.js tip.js road.js pharmacy.js transit.js payment.js app.js
├── test/                      Mocha-free node-driven tests
│   ├── run-tests.js           Discovers and spawns every test-*.js
│   ├── _jsdom-helper.js       Helper (leading _ = not discovered)
│   └── test-*.js              One feature suite per file (see
│                              ARCHITECTURE.md "Testing" for the
│                              current list). Add new tests as
│                              test-<module>.js; never as
│                              test_review_*.js / test_round_*.js.
├── cache/                     Embassy JSON cache (gitignored at runtime)
├── eslint.config.js           Flat config for ESLint 9+
├── .husky/pre-commit          Runs `npm run gate` before every commit
├── ARCHITECTURE.md
├── GETTING_STARTED.md
└── README.md
```

## Where to add new code

* New QR-format parser → `public/qr-parsers.js`, plus a section in
  `test/test-qr-parsers.js`.
* New scraped-data renderer → use `document.createElement` +
  `textContent` + `addEventListener`. Never `innerHTML +=` and never
  inline `onclick=` strings.
* New URL scheme to render → extend `public/url-safety.js` with an
  explicit validator and a row in `test/test-url-safety.js`.
* New server endpoint that hits the network → reuse `fetchPage` so the
  timeout + byte-cap apply automatically; cache to disk via a helper
  that uses `readCachedEmbassy`-style validation on read.
