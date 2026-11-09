# TEST_RESULTS.md — provident-fund-bd

Run date: 2026-11-09 (Asia/Dhaka). All results below are from real runs
on this machine, not invented.

## Node unit tests — 13/13 pass

Command: `node --test tests/logic.test.js` (Node v24.22.1)

| # | Test | Result |
|---|------|--------|
| 1 | A: 5000/100%/8.5%/10y maturity matches closed form | pass |
| 2 | A: year-1 closing balance 125,671.08 | pass |
| 3 | B: 1y 12% case verifiable by hand | pass |
| 4 | C: zero interest maturity equals total contributions | pass |
| 5 | D: employer 0% matches closed form | pass |
| 6 | E: starting balance 100000 | pass |
| 7 | F: 5% annual increment | pass |
| 8 | validation rejects bad inputs | pass |
| 9 | withdrawal math: 25% of 1,000,000 | pass |
| 10 | withdrawal rejects out-of-range % | pass |
| 11 | pickBest chooses the highest maturity | pass |
| 12 | formatBDT EN and BN digits | pass |
| 13 | export/import round-trip and strict rejection | pass |

## Hand-verified numbers (computed independently of `logic.js`)

Closed-form check used the annuity-due formula
M = C × ((1+i)^n − 1)/i × (1+i), i = annualRate/1200, n = months,
C = monthly total contribution (employee + employer). The app's
integer-paisa simulation (monthly interest rounded to the nearest
paisa) agrees with the closed form to under ৳0.05 in every case.

- **Case A** — 5000/mo, employer 100%, 8.5%, 10y, start 0:
  maturity **৳1,894,710.66** (closed form ৳1,894,710.64);
  employee total ৳600,000.00; employer total ৳600,000.00;
  interest ৳694,710.66; year-1 closing **৳125,671.08**;
  totals sum exactly to maturity.
- **Case B** — 10000/mo, employer 100%, 12%, 1y, start 0:
  maturity **৳256,186.56** exactly (hand: 20000 × 12.809328…);
  interest ৳16,186.56.
- **Case C** — 5000/mo, employer 100%, 0%, 5y:
  maturity **৳600,000.00** exactly (= total contributions, interest 0).
- **Case D** — 5000/mo, employer 0%, 8.5%, 10y:
  maturity **৳947,355.29** (closed form ৳947,355.32).
- **Case E** — as A plus starting balance ৳100,000:
  maturity **৳2,127,975.32**.
- **Case F** — as A plus 5% annual increment:
  maturity **৳2,303,707.38**; year-2 contributions ৳126,000.00.
- **Withdrawal** — 25% of ৳1,000,000 = **৳250,000.00** withdrawable,
  **৳750,000.00** remaining.
- **Compare presets** (5000/mo, 100%, 10y): 6% → ৳1,646,987.49;
  8.5% → ৳1,894,710.66; 12% → ৳2,323,390.75 (best = 12%).

## Headless-Chrome smoke test — 55/55 pass

Command: `node tests/smoke.js` (raw CDP against the Playwright
`chromium_headless_shell-1187` binary; `file://` + `?asof=2026-11-09`).

Covered, all passing:
- Page loads; 5 tabs; disclaimer and rate-estimate note render.
- Default calculator numbers match the unit tests exactly
  (maturity ৳1,894,710.66; interest ৳694,710.66; 10-row schedule;
  year-1 closing ৳125,671.08).
- Inline validation: zero contribution shows an error and hides results.
- Zero-interest edge in the live UI: ৳600,000.00.
- Compare: 3 cards, best = plan 3 (12%, ৳2,323,390.75) with BEST badge;
  "Use as main" copies rate 12 into the calculator and reproduces the
  same maturity.
- Withdrawal: 25% of ৳1,000,000 → ৳250,000.00 / ৳750,000.00;
  60% shows an inline error.
- History: save → list → reload persistence → delete → empty state.
- Export → wipe → import round-trip; wrong-app and malformed-JSON
  imports rejected with existing data intact.
- Typed-DELETE erase: wrong word rejected (data kept), `DELETE` erases.
- EN/বাংলা toggle: Bengali title/tab labels, Bengali-digit totals
  (৳১,৮৯৪,৭১০.৬৬), language persists across reload.
- 390px mobile: no horizontal overflow on calc, compare, history,
  and data tabs.
- Zero non-`file://` network requests; zero console/page errors.

## Repairs made

1. **Smoke-test expectation error (test bug, not app bug):** my first
   draft asserted compare maturities ৳2,115,251.55 / ৳1,647,447.66
   from memory — the computed values are ৳2,323,390.75 / ৳1,646,987.49.
   Fixed the assertions to the computed values; app code untouched.
2. **Smoke-test double-stringify (test bug):** one erase check wrapped
   `exportPayload()` in `JSON.stringify`, escaping the quotes it
   searched for. Fixed to use the raw payload; app code untouched.
3. **Non-ASCII leaks in app sources:** a literal বাংলা button label in
   `index.html` and a ৳ in a `logic.js` comment. Replaced with ASCII
   ("Bangla" label, set by JS i18n at runtime; "Tk" in the comment).
   `grep -P '[^\x00-\x7F]'` now returns zero matches across
   `index.html`, `styles.css`, `app.js`, `logic.js`, `tests/*.js`.
4. **History meta bug (app bug, found by code review before smoke):**
   `renderHistory` referenced a nonexistent `inputs.monthsLabel`
   (would have rendered "undefined"). Fixed to show
   `monthly/mo · years y · rate%` with Bengali digits in BN mode.
5. **Chrome binary:** `/opt/meta-chromium/chrome` did not start under
   CDP on this VM; the smoke test now defaults to the Playwright
   `chromium_headless_shell-1187` binary (same as the bus-fare-bd
   sibling), with `CHROME_BIN` override kept.

## Final state

- Node unit tests: **13/13 pass, 0 fail**
- Headless-Chrome smoke: **55/55 checks, 0 failed**
- App sources pure ASCII: verified by grep (0 matches)
- No secrets, no network requests, ships with empty history
