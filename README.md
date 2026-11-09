# Provident Fund Calculator BD

A static, fully offline, bilingual (English / বাংলা) Provident Fund (PF)
maturity calculator for employees in Bangladesh. Estimate what a monthly
provident-fund contribution grows to over a career, compare plans,
estimate a partial withdrawal, and keep named plans on the device.

## Problem

Provident-fund members in Bangladesh rarely see what their monthly
contribution is actually worth at maturity: the employer match, monthly
compounding, annual increments, and starting balance all interact, and
the fund's own statements are hard to project forward. This app makes the
projection transparent — every input is editable, the year-by-year
schedule is shown, and nothing is sent anywhere.

## Features

1. **Maturity calculator** — monthly employee contribution, employer
   match % (default 100%), annual interest rate (default 8.5%),
   years of service (1–40), optional starting balance, optional annual
   increment % of the contribution. Monthly compounding: each month the
   employee + employer contribution is added first, then interest =
   balance × (annual rate / 100 / 12) on the post-contribution balance.
   Shows maturity amount, total employee contribution, total employer
   contribution, total interest earned, and a year-by-year schedule
   (contributions, interest, closing balance per year).
2. **Compare mode** — up to 3 scenarios side by side with quick rate
   presets (6% / 8.5% / 12%), best maturity highlighted, one-click
   "Use as main" per scenario.
3. **Partial withdrawal estimator** — current balance + withdrawal %
   (10–50%), shows withdrawable amount and remaining balance.
4. **History** — save a named scenario/result to localStorage, list,
   load, delete; persists across reloads.
5. **Data** — JSON export (download) and strict import validation
   (malformed or wrong-app files are rejected, existing data intact);
   typed-`DELETE` erase-all with confirm.
6. **EN/বাংলা toggle** — persisted in localStorage; Bengali digits
   (০–৯) in all amounts; responsive 390px mobile layout with no
   horizontal overflow. Inline validation errors for every input.

## Stack

- Pure static HTML + CSS + vanilla JavaScript. No framework, no build
  step, no network requests at runtime (verified: 0 non-`file://`
  resources in the smoke test).
- Money is integer paisa internally (1 taka = 100 paisa); monthly
  interest is rounded to the nearest paisa each month.
- Bengali text is stored as `\uXXXX` escapes in `app.js`, so all app
  sources are pure ASCII (`grep -P '[^\x00-\x7F]'` returns zero
  matches on `index.html`, `styles.css`, `app.js`, `logic.js`).

## Prerequisites

- Any modern browser (open `index.html`, or serve the folder).
- Node.js 18+ only for running the tests.

## Install / run

```sh
# No install step. Open directly:
open index.html
# or serve locally:
python3 -m http.server 8000   # then http://localhost:8000
```

## Dev commands

```sh
node --test tests/logic.test.js   # node unit tests (math)
node tests/smoke.js               # headless-Chrome smoke test (CDP, no puppeteer)
```

## Testing

See [TEST_RESULTS.md](TEST_RESULTS.md). Summary: **13/13 node unit
tests + 55/55 headless-Chrome smoke checks**, all passing. Unit tests
verify the math against independently computed closed-form values
(annuity-due formula), a hand-verified 1-year case, a zero-interest
edge case (maturity = total contributions exactly), and the employer-0%
case. The smoke test drives the real app in headless Chrome and checks
calculator numbers, compare highlighting, withdrawal math, history
save/delete + reload persistence, EN/BN toggle + persistence,
export → wipe → import round-trip, malformed-import rejection,
typed-DELETE erase, 390px no-overflow, zero network requests, and
zero console/page errors.

## Deployment

Static site — copy the folder to any static host (GitHub Pages,
Netlify, or any web server). No server-side code, no environment
variables, no secrets.

## Limitations / honest disclaimers

- **Educational estimate only.** This is not official EPF/GPF rules
  and does not fetch any official rate. The 8.5% default is a
  user-editable estimate; enter your fund's actual declared rate.
  Real rules (vesting, withdrawal eligibility, tax, employer-specific
  caps) vary — verify with your employer or fund authority.
- Interest is computed as a fixed monthly rate on the post-contribution
  balance; real funds may credit interest annually or on different
  bases, so results will differ from a real fund statement.
- The withdrawal estimator is a simple percentage of the balance; it
  does not model eligibility, service-length conditions, or tax.
- History and language live in the browser's localStorage on one
  device only; there is no account or sync.
- Maximums: contribution 1,000,000 BDT/month, rate 0–25%, years 1–40,
  increment 0–20%, withdrawal 10–50%, 200 saved scenarios.

## Status

Complete MVP. All tests passing (see TEST_RESULTS.md). No known bugs.
