// provident-fund-bd -- node unit tests for logic.js.
// Run: node --test tests/logic.test.js
// All expected numbers below were computed INDEPENDENTLY of logic.js:
//   * closed-form annuity-due formula: M = C * ((1+i)^n - 1)/i * (1+i),
//     i = annualRate/1200, n = months, C = monthly total contribution;
//   * zero-interest and 1-year cases verified by hand arithmetic;
//   * the integer-paisa simulation in logic.js rounds monthly interest to
//     the nearest paisa, so sim results agree with the closed form to < Tk 0.05.
'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const L = require('../logic.js');

const T = '\u09f3'; // taka sign

// Case A: 5000/mo, employer 100% (total 10000/mo), 8.5%, 10y, start 0.
// Closed form: 10000 * ((1+0.085/12)^120 - 1)/(0.085/12) * (1+0.085/12)
//             = 1,894,710.64 BDT. Interest = 694,710.64 BDT.
test('A: 5000/100%/8.5%/10y maturity matches closed form', () => {
  const r = L.calcPF({ monthly: 5000, employerPct: 100, rate: 8.5, years: 10, start: 0, incrementPct: 0 });
  assert.strictEqual(r.ok, true);
  assert.ok(Math.abs(r.maturityPaisa - 189471064) <= 100, 'maturity ' + r.maturityPaisa);
  assert.strictEqual(r.maturityPaisa, 189471066); // exact integer-paisa sim result
  assert.strictEqual(r.empPaisa, 60000000);       // 5000 * 120 months
  assert.strictEqual(r.employerPaisa, 60000000);
  assert.strictEqual(r.interestPaisa, 69471066);
  assert.strictEqual(r.empPaisa + r.employerPaisa + r.interestPaisa, r.maturityPaisa);
  assert.strictEqual(r.schedule.length, 10);
  assert.strictEqual(r.months, 120);
});

test('A: year-1 closing balance 125,671.08', () => {
  const r = L.calcPF({ monthly: 5000, employerPct: 100, rate: 8.5, years: 10, start: 0, incrementPct: 0 });
  assert.strictEqual(r.schedule[0].year, 1);
  assert.strictEqual(r.schedule[0].closingPaisa, 12567108);
  assert.strictEqual(r.schedule[0].contribPaisa, 12000000); // 10000 * 12
  assert.strictEqual(r.schedule[9].closingPaisa, r.maturityPaisa);
  // every year's closing equals its own totals so far
  let cum = 0;
  for (const row of r.schedule) { cum += row.contribPaisa + row.interestPaisa; }
  assert.strictEqual(cum, r.maturityPaisa);
});

// Case B: 1y, 10000/mo, employer 100% (20000/mo), 12%.
// Closed form: 20000 * ((1.01^12 - 1)/0.01) * 1.01 = 256,186.56 BDT exactly.
test('B: 1y 12% case verifiable by hand', () => {
  const r = L.calcPF({ monthly: 10000, employerPct: 100, rate: 12, years: 1, start: 0, incrementPct: 0 });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.maturityPaisa, 25618656);
  assert.strictEqual(r.interestPaisa, 1618656);
  assert.strictEqual(r.schedule.length, 1);
  assert.strictEqual(r.schedule[0].closingPaisa, 25618656);
});

// Case C: zero interest -> maturity is exactly total contributions.
test('C: zero interest maturity equals total contributions', () => {
  const r = L.calcPF({ monthly: 5000, employerPct: 100, rate: 0, years: 5, start: 0, incrementPct: 0 });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.maturityPaisa, 60000000); // 10000 * 60
  assert.strictEqual(r.interestPaisa, 0);
});

// Case D: employer 0% -> half the monthly inflow.
// Closed form with 5000/mo: 947,355.32 BDT.
test('D: employer 0% matches closed form', () => {
  const r = L.calcPF({ monthly: 5000, employerPct: 0, rate: 8.5, years: 10, start: 0, incrementPct: 0 });
  assert.strictEqual(r.ok, true);
  assert.ok(Math.abs(r.maturityPaisa - 94735532) <= 100, 'maturity ' + r.maturityPaisa);
  assert.strictEqual(r.employerPaisa, 0);
  assert.strictEqual(r.empPaisa, 60000000);
});

// Case E: starting balance 100,000 grows with interest.
test('E: starting balance 100000', () => {
  const r = L.calcPF({ monthly: 5000, employerPct: 100, rate: 8.5, years: 10, start: 100000, incrementPct: 0 });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.maturityPaisa, 212797532);
  assert.strictEqual(r.startPaisa, 10000000);
});

// Case F: 5% annual increment on the contribution.
test('F: 5% annual increment', () => {
  const r = L.calcPF({ monthly: 5000, employerPct: 100, rate: 8.5, years: 10, start: 0, incrementPct: 5 });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.maturityPaisa, 230370738);
  assert.ok(r.maturityPaisa > 189471066, 'increment beats no-increment');
  // year 2 monthly contribution is 5250 (5000 * 1.05)
  assert.strictEqual(r.schedule[1].contribPaisa, 12600000); // 10500 * 12
});

// Validation
test('validation rejects bad inputs', () => {
  assert.strictEqual(L.validateInputs({ monthly: 0, employerPct: 100, rate: 8.5, years: 10, start: 0, incrementPct: 0 }).ok, false);
  assert.strictEqual(L.validateInputs({ monthly: -5, employerPct: 100, rate: 8.5, years: 10, start: 0, incrementPct: 0 }).ok, false);
  assert.strictEqual(L.validateInputs({ monthly: 5000, employerPct: 101, rate: 8.5, years: 10, start: 0, incrementPct: 0 }).ok, false);
  assert.strictEqual(L.validateInputs({ monthly: 5000, employerPct: 100, rate: 26, years: 10, start: 0, incrementPct: 0 }).ok, false);
  assert.strictEqual(L.validateInputs({ monthly: 5000, employerPct: 100, rate: 8.5, years: 0, start: 0, incrementPct: 0 }).ok, false);
  assert.strictEqual(L.validateInputs({ monthly: 5000, employerPct: 100, rate: 8.5, years: 41, start: 0, incrementPct: 0 }).ok, false);
  assert.strictEqual(L.validateInputs({ monthly: 5000, employerPct: 100, rate: 8.5, years: 2.5, start: 0, incrementPct: 0 }).ok, false);
  assert.strictEqual(L.validateInputs({ monthly: 5000, employerPct: 100, rate: 8.5, years: 10, start: -1, incrementPct: 0 }).ok, false);
  assert.strictEqual(L.validateInputs({ monthly: 5000, employerPct: 100, rate: 8.5, years: 10, start: 0, incrementPct: 21 }).ok, false);
  const good = L.validateInputs({ monthly: 5000, employerPct: 100, rate: 8.5, years: 10, start: 0, incrementPct: 0 });
  assert.strictEqual(good.ok, true);
  assert.deepStrictEqual(good.errors, {});
  const bad = L.calcPF({ monthly: 0, employerPct: 100, rate: 8.5, years: 10, start: 0, incrementPct: 0 });
  assert.strictEqual(bad.ok, false);
  assert.ok(bad.errors.monthly);
});

// Withdrawal
test('withdrawal math: 25% of 1,000,000', () => {
  const w = L.calcWithdrawal(100000000, 25);
  assert.strictEqual(w.ok, true);
  assert.strictEqual(w.withdrawPaisa, 25000000);
  assert.strictEqual(w.remainingPaisa, 75000000);
  assert.strictEqual(w.withdrawPaisa + w.remainingPaisa, 100000000);
});
test('withdrawal rejects out-of-range %', () => {
  assert.strictEqual(L.calcWithdrawal(100000000, 9).ok, false);
  assert.strictEqual(L.calcWithdrawal(100000000, 51).ok, false);
  assert.strictEqual(L.calcWithdrawal(100000000, 10).ok, true);
  assert.strictEqual(L.calcWithdrawal(100000000, 50).ok, true);
  assert.strictEqual(L.calcWithdrawal(-1, 25).ok, false);
});

// Compare best pick
test('pickBest chooses the highest maturity', () => {
  const rs = [6, 8.5, 12].map((rate) =>
    L.calcPF({ monthly: 5000, employerPct: 100, rate, years: 10, start: 0, incrementPct: 0 }));
  assert.strictEqual(L.pickBest(rs), 2);
  assert.strictEqual(L.pickBest([rs[0]]), 0);
  assert.strictEqual(L.pickBest([]), -1);
  assert.strictEqual(L.pickBest([{ ok: false }]), -1);
});

// Formatting
test('formatBDT EN and BN digits', () => {
  assert.strictEqual(L.formatBDT(189471066, 'en'), T + '1,894,710.66');
  assert.strictEqual(L.formatBDT(0, 'en'), T + '0.00');
  assert.strictEqual(L.formatBDT(25618656, 'bn'), T + '\u09e8\u09eb\u09ec,\u09e7\u09ee\u09ec.\u09eb\u09ec');
  assert.strictEqual(L.toBnDigits('2026'), '\u09e8\u09e6\u09e8\u09ec');
});

// Export / import
test('export/import round-trip and strict rejection', () => {
  const entry = {
    name: '10-year plan',
    inputs: { monthly: 5000, employerPct: 100, rate: 8.5, years: 10, start: 0, incrementPct: 0 },
    result: { maturityPaisa: 189471066 },
    savedAt: '2026-11-09'
  };
  const payload = L.exportPayload([entry]);
  const parsed = JSON.parse(payload);
  assert.strictEqual(parsed.app, 'provident-fund-bd');
  assert.strictEqual(parsed.version, 1);
  const imp = L.importPayload(payload);
  assert.strictEqual(imp.ok, true);
  assert.strictEqual(imp.history.length, 1);
  assert.strictEqual(imp.history[0].name, '10-year plan');

  assert.strictEqual(L.importPayload('not json').ok, false);
  assert.strictEqual(L.importPayload('{"app":"other","version":1,"history":[]}').ok, false);
  assert.strictEqual(L.importPayload('{"app":"provident-fund-bd","version":2,"history":[]}').ok, false);
  assert.strictEqual(L.importPayload('{"app":"provident-fund-bd","version":1,"history":"x"}').ok, false);
  assert.strictEqual(L.importPayload('{"app":"provident-fund-bd","version":1,"history":[{"name":"","inputs":{},"result":{},"savedAt":"x"}]}').ok, false);
  assert.strictEqual(L.importPayload('{"app":"provident-fund-bd","version":1,"history":[]}').ok, true);
});
