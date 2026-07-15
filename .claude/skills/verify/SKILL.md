---
name: verify
description: Drive this app in a headless browser to verify UI changes (Vite dev server + Playwright)
---

# Verifying UI changes in this repo

The app is a 375×812 phone-frame React prototype at **http://localhost:5173/**
(dev server is usually already running; `pnpm dev` if not). All state is
in-memory — a reload resets everything, so drive one flow per page load.

## Handle

No Playwright in the repo (don't add it — keep package.json lean). Install it
in the session scratchpad instead:

```bash
cd <scratchpad> && npm init -y && npm install playwright
# Chromium is already cached at ~/Library/Caches/ms-playwright
```

Then `node <script>.js` with `const { chromium } = require('playwright')`.
Viewport 900×950 fits the whole phone frame in one screenshot.

## Driving

- **QuickNav** (jump to any screen): the FAB is
  `div.fixed.bottom-6.left-6 > button`; the panel lists screens by label
  ("Dashboard", "Invoice List", …) and, nested under Dashboard, the hero
  scenario switchers ("Happy path", "Some overdue", "All overdue",
  "Fully collected", "Nothing collected") — dev-server only.
- Wait ~800ms after navigation clicks (spring animations).
- Collect `page.on('pageerror')` + console errors; ignore the CORS font
  errors from db.onlinewebfonts.com (pre-existing, cosmetic) and the
  pre-existing validateDOMNesting button-in-button warning from
  sales-invoice-list/InvoiceCard.
- Showcase gallery: `http://localhost:5173/#showcase` for DS components.
