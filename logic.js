// provident-fund-bd -- pure provident-fund math (no DOM). Node-testable.
// Money is integer paisa everywhere (1 taka = 100 paisa).
//
// Model (labelled assumption, see README):
//   * Each month the employee contribution and the employer match are added
//     to the balance first, then monthly interest is added on the
//     post-contribution balance: interest = balance * (annualRate/100/12),
//     rounded to the nearest paisa each month.
//   * The annual increment raises the monthly contribution at the start of
//     each service year: year y monthly contribution =
//     round(base * (1 + incrementPct/100)^(y-1)) paisa.
//   * The annual interest rate is a USER-ENTERED ESTIMATE. This app does not
//     know or fetch any official EPF/GPF rate; 8.5% is only a default input.
(function (root) {
  'use strict';

  var APP = 'provident-fund-bd';
  var VERSION = 1;

  var TAKA = '\u09f3';
  var BN_DIGITS = ['\u09e6', '\u09e7', '\u09e8', '\u09e9', '\u09ea',
                   '\u09eb', '\u09ec', '\u09ed', '\u09ee', '\u09ef'];

  var LIMITS = {
    monthlyMax: 1000000,      // BDT per month
    employerPctMax: 100,
    rateMax: 25,              // % per year
    yearsMin: 1,
    yearsMax: 40,
    startMax: 100000000,      // BDT
    incrementPctMax: 20,
    withdrawPctMin: 10,
    withdrawPctMax: 50
  };

  function isFiniteNumber(x) { return typeof x === 'number' && isFinite(x); }

  function toBnDigits(s) {
    return String(s).replace(/[0-9]/g, function (d) { return BN_DIGITS[+d]; });
  }

  // Format integer paisa as "Tk 1,894,710.66" (Bengali digits when lang === 'bn').
  function formatBDT(paisa, lang) {
    var neg = paisa < 0;
    var abs = Math.abs(Math.round(paisa));
    var taka = Math.floor(abs / 100);
    var p = abs % 100;
    var s = String(taka).replace(/\B(?=(\d{3})+(?!\d))/g, ',') +
            '.' + String(p).padStart(2, '0');
    if (lang === 'bn') s = toBnDigits(s);
    return (neg ? '-' : '') + TAKA + s;
  }

  // Validate calculator inputs. Returns { ok, errors } where errors is a map
  // field -> message key (English message; UI localises via its own table).
  function validateInputs(inp) {
    var errors = {};
    var m = inp.monthly;
    if (!isFiniteNumber(m)) errors.monthly = 'Enter a monthly contribution.';
    else if (m <= 0) errors.monthly = 'Contribution must be more than 0.';
    else if (m > LIMITS.monthlyMax) errors.monthly = 'Contribution is too large (max 1,000,000).';
    var e = inp.employerPct;
    if (!isFiniteNumber(e)) errors.employerPct = 'Enter the employer match %.';
    else if (e < 0 || e > LIMITS.employerPctMax) errors.employerPct = 'Employer match must be 0-100%.';
    var r = inp.rate;
    if (!isFiniteNumber(r)) errors.rate = 'Enter the annual interest rate.';
    else if (r < 0 || r > LIMITS.rateMax) errors.rate = 'Interest rate must be 0-25%.';
    var y = inp.years;
    if (!isFiniteNumber(y) || Math.floor(y) !== y) errors.years = 'Years must be a whole number.';
    else if (y < LIMITS.yearsMin || y > LIMITS.yearsMax) errors.years = 'Years of service must be 1-40.';
    var s = inp.start;
    if (s === undefined || s === null || s === '') s = 0;
    if (!isFiniteNumber(s)) errors.start = 'Starting balance must be a number.';
    else if (s < 0) errors.start = 'Starting balance cannot be negative.';
    else if (s > LIMITS.startMax) errors.start = 'Starting balance is too large.';
    var g = inp.incrementPct;
    if (g === undefined || g === null || g === '') g = 0;
    if (!isFiniteNumber(g)) errors.incrementPct = 'Increment must be a number.';
    else if (g < 0 || g > LIMITS.incrementPctMax) errors.incrementPct = 'Annual increment must be 0-20%.';
    return { ok: Object.keys(errors).length === 0, errors: errors };
  }

  // Core calculator. inp: { monthly, employerPct, rate, years, start, incrementPct }
  // All money inputs are in BDT (may be fractional taka); all outputs in paisa.
  function calcPF(inp) {
    var v = validateInputs(inp);
    if (!v.ok) return { ok: false, errors: v.errors };
    var monthlyPaisa = Math.round(inp.monthly * 100);
    var employerPct = inp.employerPct;
    var rate = inp.rate;
    var years = inp.years;
    var startPaisa = Math.round((inp.start || 0) * 100);
    var incPct = inp.incrementPct || 0;

    var balance = startPaisa;
    var empTotal = 0, employerTotal = 0, interestTotal = 0;
    var schedule = [];
    var monthPaisa = monthlyPaisa;
    for (var y = 1; y <= years; y++) {
      var employerMonthly = Math.round(monthPaisa * employerPct / 100);
      var yearContrib = 0, yearInterest = 0;
      for (var mo = 0; mo < 12; mo++) {
        balance += monthPaisa + employerMonthly;
        empTotal += monthPaisa;
        employerTotal += employerMonthly;
        yearContrib += monthPaisa + employerMonthly;
        var interest = Math.round(balance * rate / 1200);
        balance += interest;
        interestTotal += interest;
        yearInterest += interest;
      }
      schedule.push({
        year: y,
        contribPaisa: yearContrib,
        interestPaisa: yearInterest,
        closingPaisa: balance
      });
      monthPaisa = Math.round(monthPaisa * (1 + incPct / 100));
    }
    return {
      ok: true,
      maturityPaisa: balance,
      empPaisa: empTotal,
      employerPaisa: employerTotal,
      interestPaisa: interestTotal,
      startPaisa: startPaisa,
      months: years * 12,
      schedule: schedule
    };
  }

  // Partial withdrawal: balance in paisa, pct in [10, 50].
  function calcWithdrawal(balancePaisa, pct) {
    if (!isFiniteNumber(balancePaisa) || balancePaisa < 0) {
      return { ok: false, error: 'Balance must be 0 or more.' };
    }
    if (!isFiniteNumber(pct)) return { ok: false, error: 'Enter a withdrawal %.' };
    if (pct < LIMITS.withdrawPctMin || pct > LIMITS.withdrawPctMax) {
      return { ok: false, error: 'Withdrawal must be 10-50% of the balance.' };
    }
    var withdraw = Math.round(balancePaisa * pct / 100);
    return { ok: true, withdrawPaisa: withdraw, remainingPaisa: balancePaisa - withdraw };
  }

  // Compare: results is an array of calcPF results (ok === true). Returns the
  // index of the highest maturity, or -1 if none are valid.
  function pickBest(results) {
    var best = -1, bestVal = -1;
    for (var i = 0; i < results.length; i++) {
      if (results[i] && results[i].ok && results[i].maturityPaisa > bestVal) {
        bestVal = results[i].maturityPaisa;
        best = i;
      }
    }
    return best;
  }

  // ---- history / export / import ----

  function exportPayload(history) {
    return JSON.stringify({
      app: APP,
      version: VERSION,
      exportedAt: new Date().toISOString().slice(0, 10),
      history: history || []
    }, null, 2);
  }

  function validHistoryEntry(e) {
    if (!e || typeof e !== 'object') return false;
    if (typeof e.name !== 'string' || e.name.trim().length === 0 || e.name.length > 80) return false;
    if (!e.inputs || typeof e.inputs !== 'object') return false;
    if (!validateInputs(e.inputs).ok) return false;
    if (!e.result || typeof e.result !== 'object') return false;
    if (!isFiniteNumber(e.result.maturityPaisa) || e.result.maturityPaisa < 0) return false;
    if (typeof e.savedAt !== 'string' || e.savedAt.length === 0) return false;
    return true;
  }

  // Strict import validation. Returns { ok, history } or { ok: false, error }.
  // Never mutates the caller's data; a failed import leaves existing data intact.
  function importPayload(text) {
    var obj;
    try { obj = JSON.parse(text); }
    catch (e) { return { ok: false, error: 'Not valid JSON.' }; }
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
      return { ok: false, error: 'Import must be a JSON object.' };
    }
    if (obj.app !== APP) return { ok: false, error: 'Not a provident-fund-bd file.' };
    if (obj.version !== VERSION) return { ok: false, error: 'Unsupported file version.' };
    if (!Array.isArray(obj.history)) return { ok: false, error: 'History must be a list.' };
    if (obj.history.length > 200) return { ok: false, error: 'Too many saved scenarios (max 200).' };
    for (var i = 0; i < obj.history.length; i++) {
      if (!validHistoryEntry(obj.history[i])) {
        return { ok: false, error: 'Saved scenario #' + (i + 1) + ' is invalid.' };
      }
    }
    return { ok: true, history: obj.history };
  }

  var api = {
    APP: APP,
    VERSION: VERSION,
    LIMITS: LIMITS,
    TAKA: TAKA,
    toBnDigits: toBnDigits,
    formatBDT: formatBDT,
    validateInputs: validateInputs,
    calcPF: calcPF,
    calcWithdrawal: calcWithdrawal,
    pickBest: pickBest,
    exportPayload: exportPayload,
    importPayload: importPayload,
    validHistoryEntry: validHistoryEntry
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.PFLogic = api;
})(typeof window !== 'undefined' ? window : globalThis);
