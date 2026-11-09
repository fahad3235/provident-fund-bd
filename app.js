// provident-fund-bd -- UI logic. Pure ASCII source; all Bengali strings live
// in I18N_BN below as \uXXXX escapes. No network requests; state in localStorage.
(function () {
  'use strict';

  var L = window.PFLogic;
  var LS_LANG = 'pfbd.lang';
  var LS_HIST = 'pfbd.history.v1';

  var I18N_EN = {
    title: 'Provident Fund Calculator',
    subtitle: 'Retirement savings estimate for employees in Bangladesh \u2014 fully offline',
    tabCalc: 'Calculator',
    tabCompare: 'Compare',
    tabWithdraw: 'Withdrawal',
    tabHistory: 'History',
    tabData: 'Data',
    langBtn: '\u09ac\u09be\u0982\u09b2\u09be',
    calcHeading: 'Maturity calculator',
    lblMonthly: 'Monthly employee contribution (BDT)',
    lblEmployer: 'Employer match (% of employee contribution)',
    lblRate: 'Annual interest rate (%)',
    rateNote: 'Estimate only \u2014 enter your fund\u2019s actual rate. This is not an official rate.',
    lblYears: 'Years of service',
    lblStart: 'Starting balance (BDT, optional)',
    lblIncrement: 'Annual increment of contribution (% \u2014 optional)',
    calcBtn: 'Calculate',
    resMaturity: 'Maturity amount',
    resEmp: 'Your total contribution',
    resEmployer: 'Employer total contribution',
    resInterest: 'Total interest earned',
    schedHeading: 'Year-by-year schedule',
    colYear: 'Year',
    colContrib: 'Contributions',
    colInterest: 'Interest',
    colClosing: 'Closing balance',
    saveLabelPh: 'Name, e.g. 10-year plan',
    saveBtn: 'Save to history',
    savedMsg: 'Saved.',
    disclaimer: 'Educational estimate only \u2014 not official EPF/GPF rules. The interest rate is a user-entered estimate. Check the real rate and rules with your employer or fund authority.',
    cmpHeading: 'Compare three plans',
    cmpCalcBtn: 'Calculate all',
    presetStd: 'Standard 8.5%',
    presetLow: 'Low 6%',
    presetHigh: 'High 12%',
    bestBadge: 'BEST',
    useAsMain: 'Use as main',
    wdHeading: 'Partial withdrawal estimator',
    lblBalance: 'Current balance (BDT)',
    lblWdPct: 'Withdrawal % (10\u201350)',
    wdBtn: 'Calculate',
    wdWithdraw: 'Withdrawable amount',
    wdRemaining: 'Remaining balance',
    wdNote: 'Actual rules vary by employer and fund \u2014 verify before withdrawing.',
    histHeading: 'Saved plans',
    histEmpty: 'No plans saved yet.',
    loadBtn: 'Load',
    delBtn: 'Delete',
    deletedMsg: 'Deleted.',
    dataHeading: 'Export / import / erase data',
    exportBtn: 'Download JSON',
    importBtn: 'Import',
    importPh: 'Paste JSON here\u2026',
    importOk: 'Import successful.',
    importFail: 'Import failed: ',
    eraseLabel: 'Type DELETE to erase everything',
    eraseBtn: 'Erase all data',
    erasedMsg: 'All data erased.',
    eraseWrong: 'Type DELETE exactly.',
    errMonthly: 'Enter a monthly contribution.',
    errMonthlyPos: 'Contribution must be more than 0.',
    errMonthlyMax: 'Contribution is too large (max 1,000,000).',
    errEmployer: 'Employer match must be 0\u2013100%.',
    errRate: 'Interest rate must be 0\u201325%.',
    errYears: 'Years of service must be 1\u201340.',
    errStart: 'Starting balance cannot be negative.',
    errIncrement: 'Annual increment must be 0\u201320%.',
    errWd: 'Withdrawal must be 10\u201350% of the balance.',
    errBalance: 'Balance must be 0 or more.',
    monthsLabel: 'months',
    yearsLabel: 'years'
  };

  var I18N_BN = {
  title: "\u09aa\u09cd\u09b0\u09ad\u09bf\u09a1\u09c7\u09a8\u09cd\u099f \u09ab\u09be\u09a8\u09cd\u09a1 \u0995\u09cd\u09af\u09be\u09b2\u0995\u09c1\u09b2\u09c7\u099f\u09b0",
  subtitle: "\u09ac\u09be\u0982\u09b2\u09be\u09a6\u09c7\u09b6\u09c7\u09b0 \u099a\u09be\u0995\u09b0\u09bf\u099c\u09c0\u09ac\u09c0\u09a6\u09c7\u09b0 \u099c\u09a8\u09cd\u09af \u0985\u09ac\u09b8\u09b0 \u09b8\u099e\u09cd\u099a\u09af\u09bc \u09b9\u09bf\u09b8\u09be\u09ac \u2014 \u09b8\u09ae\u09cd\u09aa\u09c2\u09b0\u09cd\u09a3 \u0985\u09ab\u09b2\u09be\u0987\u09a8",
  tabCalc: "\u0995\u09cd\u09af\u09be\u09b2\u0995\u09c1\u09b2\u09c7\u099f\u09b0",
  tabCompare: "\u09a4\u09c1\u09b2\u09a8\u09be",
  tabWithdraw: "\u0989\u09a4\u09cd\u09a4\u09cb\u09b2\u09a8",
  tabHistory: "\u0987\u09a4\u09bf\u09b9\u09be\u09b8",
  tabData: "\u09a4\u09a5\u09cd\u09af",
  langBtn: "English",
  calcHeading: "\u09ae\u09c7\u09af\u09bc\u09be\u09a6\u09aa\u09c2\u09b0\u09cd\u09a4\u09bf \u09b9\u09bf\u09b8\u09be\u09ac",
  lblMonthly: "\u09ae\u09be\u09b8\u09bf\u0995 \u0995\u09b0\u09cd\u09ae\u099a\u09be\u09b0\u09c0 \u099c\u09ae\u09be (\u099f\u09be\u0995\u09be)",
  lblEmployer: "\u09a8\u09bf\u09af\u09bc\u09cb\u0997\u0995\u09b0\u09cd\u09a4\u09be\u09b0 \u09ae\u09bf\u09b2 (% \u2014 \u0995\u09b0\u09cd\u09ae\u099a\u09be\u09b0\u09c0 \u099c\u09ae\u09be\u09b0 \u09b6\u09a4\u09be\u0982\u09b6)",
  lblRate: "\u09ac\u09be\u09b0\u09cd\u09b7\u09bf\u0995 \u09b8\u09c1\u09a6\u09c7\u09b0 \u09b9\u09be\u09b0 (%)",
  rateNote: "\u09b6\u09c1\u09a7\u09c1 \u0985\u09a8\u09c1\u09ae\u09be\u09a8 \u2014 \u0986\u09aa\u09a8\u09be\u09b0 \u09ab\u09be\u09a8\u09cd\u09a1\u09c7\u09b0 \u09aa\u09cd\u09b0\u0995\u09c3\u09a4 \u09b9\u09be\u09b0 \u09ac\u09b8\u09be\u09a8\u0964 \u098f\u099f\u09bf \u0995\u09cb\u09a8\u09cb \u09b8\u09b0\u0995\u09be\u09b0\u09bf \u09b9\u09be\u09b0 \u09a8\u09af\u09bc\u0964",
  lblYears: "\u099a\u09be\u0995\u09b0\u09bf\u09b0 \u09ae\u09c7\u09af\u09bc\u09be\u09a6 (\u09ac\u099b\u09b0)",
  lblStart: "\u09b6\u09c1\u09b0\u09c1\u09b0 \u099c\u09ae\u09be (\u099f\u09be\u0995\u09be, \u0990\u099a\u09cd\u099b\u09bf\u0995)",
  lblIncrement: "\u099c\u09ae\u09be\u09b0 \u09ac\u09be\u09b0\u09cd\u09b7\u09bf\u0995 \u09ac\u09c3\u09a6\u09cd\u09a7\u09bf (% \u2014 \u0990\u099a\u09cd\u099b\u09bf\u0995)",
  calcBtn: "\u09b9\u09bf\u09b8\u09be\u09ac \u0995\u09b0\u09c1\u09a8",
  resMaturity: "\u09ae\u09c7\u09af\u09bc\u09be\u09a6\u09aa\u09c2\u09b0\u09cd\u09a4\u09bf\u09b0 \u09aa\u09b0\u09bf\u09ae\u09be\u09a3",
  resEmp: "\u0986\u09aa\u09a8\u09be\u09b0 \u09ae\u09cb\u099f \u099c\u09ae\u09be",
  resEmployer: "\u09a8\u09bf\u09af\u09bc\u09cb\u0997\u0995\u09b0\u09cd\u09a4\u09be\u09b0 \u09ae\u09cb\u099f \u099c\u09ae\u09be",
  resInterest: "\u09ae\u09cb\u099f \u09b8\u09c1\u09a6",
  schedHeading: "\u09ac\u099b\u09b0\u09ad\u09bf\u09a4\u09cd\u09a4\u09bf\u0995 \u09b9\u09bf\u09b8\u09be\u09ac",
  colYear: "\u09ac\u099b\u09b0",
  colContrib: "\u099c\u09ae\u09be",
  colInterest: "\u09b8\u09c1\u09a6",
  colClosing: "\u09b6\u09c7\u09b7 \u099c\u09ae\u09be",
  saveLabelPh: "\u09a8\u09be\u09ae \u09b2\u09bf\u0996\u09c1\u09a8 (\u09af\u09c7\u09ae\u09a8: \u09e7\u09e6 \u09ac\u099b\u09b0\u09c7\u09b0 \u09aa\u09b0\u09bf\u0995\u09b2\u09cd\u09aa\u09a8\u09be)",
  saveBtn: "\u09b8\u0982\u09b0\u0995\u09cd\u09b7\u09a3 \u0995\u09b0\u09c1\u09a8",
  savedMsg: "\u09b8\u0982\u09b0\u0995\u09cd\u09b7\u09bf\u09a4 \u09b9\u09af\u09bc\u09c7\u099b\u09c7\u0964",
  disclaimer: "\u09b6\u09bf\u0995\u09cd\u09b7\u09be\u09ae\u09c2\u09b2\u0995 \u0985\u09a8\u09c1\u09ae\u09be\u09a8 \u09ae\u09be\u09a4\u09cd\u09b0 \u2014 \u098f\u099f\u09bf \u09b8\u09b0\u0995\u09be\u09b0\u09bf EPF/GPF \u09a8\u09bf\u09af\u09bc\u09ae \u09a8\u09af\u09bc\u0964 \u09aa\u09cd\u09b0\u0995\u09c3\u09a4 \u09b9\u09be\u09b0 \u0993 \u09a8\u09bf\u09af\u09bc\u09ae \u0986\u09aa\u09a8\u09be\u09b0 \u09a8\u09bf\u09af\u09bc\u09cb\u0997\u0995\u09b0\u09cd\u09a4\u09be \u09ac\u09be \u09ab\u09be\u09a8\u09cd\u09a1 \u0995\u09b0\u09cd\u09a4\u09c3\u09aa\u0995\u09cd\u09b7\u09c7\u09b0 \u0995\u09be\u099b\u09c7 \u09af\u09be\u099a\u09be\u0987 \u0995\u09b0\u09c1\u09a8\u0964",
  cmpHeading: "\u09a4\u09bf\u09a8\u099f\u09bf \u09aa\u09b0\u09bf\u0995\u09b2\u09cd\u09aa\u09a8\u09be \u09a4\u09c1\u09b2\u09a8\u09be \u0995\u09b0\u09c1\u09a8",
  cmpCalcBtn: "\u09b8\u09ac\u0997\u09c1\u09b2\u09cb \u09b9\u09bf\u09b8\u09be\u09ac \u0995\u09b0\u09c1\u09a8",
  presetStd: "\u09b8\u09be\u09a7\u09be\u09b0\u09a3 \u09ee.\u09eb%",
  presetLow: "\u0995\u09ae \u09ec%",
  presetHigh: "\u09ac\u09c7\u09b6\u09bf \u09e7\u09e8%",
  bestBadge: "\u09b8\u09c7\u09b0\u09be",
  useAsMain: "\u09ae\u09c2\u09b2 \u09b9\u09bf\u09b8\u09c7\u09ac\u09c7 \u09a8\u09bf\u09a8",
  wdHeading: "\u0986\u0982\u09b6\u09bf\u0995 \u0989\u09a4\u09cd\u09a4\u09cb\u09b2\u09a8\u09c7\u09b0 \u0985\u09a8\u09c1\u09ae\u09be\u09a8",
  lblBalance: "\u09ac\u09b0\u09cd\u09a4\u09ae\u09be\u09a8 \u099c\u09ae\u09be (\u099f\u09be\u0995\u09be)",
  lblWdPct: "\u0989\u09a4\u09cd\u09a4\u09cb\u09b2\u09a8\u09c7\u09b0 \u09b9\u09be\u09b0 (%)",
  wdBtn: "\u09b9\u09bf\u09b8\u09be\u09ac \u0995\u09b0\u09c1\u09a8",
  wdWithdraw: "\u0989\u09a4\u09cd\u09a4\u09cb\u09b2\u09a8\u09af\u09cb\u0997\u09cd\u09af \u09aa\u09b0\u09bf\u09ae\u09be\u09a3",
  wdRemaining: "\u0985\u09ac\u09b6\u09bf\u09b7\u09cd\u099f \u099c\u09ae\u09be",
  wdNote: "\u09aa\u09cd\u09b0\u0995\u09c3\u09a4 \u09a8\u09bf\u09af\u09bc\u09ae \u09a8\u09bf\u09af\u09bc\u09cb\u0997\u0995\u09b0\u09cd\u09a4\u09be \u0993 \u09ab\u09be\u09a8\u09cd\u09a1\u09ad\u09c7\u09a6\u09c7 \u09ad\u09bf\u09a8\u09cd\u09a8 \u09b9\u09af\u09bc \u2014 \u0989\u09a4\u09cd\u09a4\u09cb\u09b2\u09a8\u09c7\u09b0 \u0986\u0997\u09c7 \u09af\u09be\u099a\u09be\u0987 \u0995\u09b0\u09c1\u09a8\u0964",
  histHeading: "\u09b8\u0982\u09b0\u0995\u09cd\u09b7\u09bf\u09a4 \u09aa\u09b0\u09bf\u0995\u09b2\u09cd\u09aa\u09a8\u09be",
  histEmpty: "\u098f\u0996\u09a8\u09cb \u0995\u09cb\u09a8\u09cb \u09aa\u09b0\u09bf\u0995\u09b2\u09cd\u09aa\u09a8\u09be \u09b8\u0982\u09b0\u0995\u09cd\u09b7\u09a3 \u0995\u09b0\u09be \u09b9\u09af\u09bc\u09a8\u09bf\u0964",
  loadBtn: "\u0996\u09c1\u09b2\u09c1\u09a8",
  delBtn: "\u09ae\u09c1\u099b\u09c1\u09a8",
  deletedMsg: "\u09ae\u09c1\u099b\u09c7 \u09ab\u09c7\u09b2\u09be \u09b9\u09af\u09bc\u09c7\u099b\u09c7\u0964",
  dataHeading: "\u09a4\u09a5\u09cd\u09af \u09b0\u09aa\u09cd\u09a4\u09be\u09a8\u09bf / \u0986\u09ae\u09a6\u09be\u09a8\u09bf / \u09ae\u09c1\u099b\u09c1\u09a8",
  exportBtn: "JSON \u09a1\u09be\u0989\u09a8\u09b2\u09cb\u09a1 \u0995\u09b0\u09c1\u09a8",
  importBtn: "\u0986\u09ae\u09a6\u09be\u09a8\u09bf \u0995\u09b0\u09c1\u09a8",
  importPh: "\u098f\u0996\u09be\u09a8\u09c7 JSON \u09ac\u09b8\u09be\u09a8\u2026",
  importOk: "\u0986\u09ae\u09a6\u09be\u09a8\u09bf \u09b8\u09ab\u09b2 \u09b9\u09af\u09bc\u09c7\u099b\u09c7\u0964",
  importFail: "\u0986\u09ae\u09a6\u09be\u09a8\u09bf \u09ac\u09cd\u09af\u09b0\u09cd\u09a5: ",
  eraseLabel: "\u09b8\u09ac \u09ae\u09c1\u099b\u09a4\u09c7 DELETE \u09b2\u09bf\u0996\u09c1\u09a8",
  eraseBtn: "\u09b8\u09ac \u09ae\u09c1\u099b\u09c7 \u09ab\u09c7\u09b2\u09c1\u09a8",
  erasedMsg: "\u09b8\u09ac \u09a4\u09a5\u09cd\u09af \u09ae\u09c1\u099b\u09c7 \u09ab\u09c7\u09b2\u09be \u09b9\u09af\u09bc\u09c7\u099b\u09c7\u0964",
  eraseWrong: "DELETE \u09b8\u09a0\u09bf\u0995\u09ad\u09be\u09ac\u09c7 \u09b2\u09bf\u0996\u09c1\u09a8\u0964",
  errMonthly: "\u09ae\u09be\u09b8\u09bf\u0995 \u099c\u09ae\u09be \u09a6\u09bf\u09a8\u0964",
  errMonthlyPos: "\u099c\u09ae\u09be \u09e6-\u098f\u09b0 \u09ac\u09c7\u09b6\u09bf \u09b9\u09a4\u09c7 \u09b9\u09ac\u09c7\u0964",
  errMonthlyMax: "\u099c\u09ae\u09be \u0985\u09a8\u09c7\u0995 \u09ac\u09c7\u09b6\u09bf (\u09b8\u09b0\u09cd\u09ac\u09cb\u099a\u09cd\u099a \u09e7,\u09e6\u09e6\u09e6,\u09e6\u09e6\u09e6)\u0964",
  errEmployer: "\u09a8\u09bf\u09af\u09bc\u09cb\u0997\u0995\u09b0\u09cd\u09a4\u09be\u09b0 \u09ae\u09bf\u09b2 \u09e6\u2013\u09e7\u09e6\u09e6% \u09b9\u09a4\u09c7 \u09b9\u09ac\u09c7\u0964",
  errRate: "\u09b8\u09c1\u09a6\u09c7\u09b0 \u09b9\u09be\u09b0 \u09e6\u2013\u09e8\u09eb% \u09b9\u09a4\u09c7 \u09b9\u09ac\u09c7\u0964",
  errYears: "\u099a\u09be\u0995\u09b0\u09bf\u09b0 \u09ae\u09c7\u09af\u09bc\u09be\u09a6 \u09e7\u2013\u09ea\u09e6 \u09ac\u099b\u09b0 \u09b9\u09a4\u09c7 \u09b9\u09ac\u09c7\u0964",
  errStart: "\u09b6\u09c1\u09b0\u09c1\u09b0 \u099c\u09ae\u09be \u09e6 \u09ac\u09be \u09a4\u09be\u09b0 \u09ac\u09c7\u09b6\u09bf \u09b9\u09a4\u09c7 \u09b9\u09ac\u09c7\u0964",
  errIncrement: "\u09ac\u09be\u09b0\u09cd\u09b7\u09bf\u0995 \u09ac\u09c3\u09a6\u09cd\u09a7\u09bf \u09e6\u2013\u09e8\u09e6% \u09b9\u09a4\u09c7 \u09b9\u09ac\u09c7\u0964",
  errWd: "\u0989\u09a4\u09cd\u09a4\u09cb\u09b2\u09a8 \u09e7\u09e6\u2013\u09eb\u09e6% \u09b9\u09a4\u09c7 \u09b9\u09ac\u09c7\u0964",
  errBalance: "\u099c\u09ae\u09be \u09e6 \u09ac\u09be \u09a4\u09be\u09b0 \u09ac\u09c7\u09b6\u09bf \u09b9\u09a4\u09c7 \u09b9\u09ac\u09c7\u0964",
  monthsLabel: "\u09ae\u09be\u09b8",
  yearsLabel: "\u09ac\u099b\u09b0"
};

  var state = {
    lang: 'en',
    history: [],
    lastResult: null,
    lastInputs: null
  };

  function $(id) { return document.getElementById(id); }

  function t(key) {
    var dict = state.lang === 'bn' ? I18N_BN : I18N_EN;
    return dict[key] || I18N_EN[key] || key;
  }

  function fmt(paisa) { return L.formatBDT(paisa, state.lang); }

  function loadState() {
    try {
      var lang = localStorage.getItem(LS_LANG);
      if (lang === 'bn' || lang === 'en') state.lang = lang;
    } catch (e) { /* storage unavailable: stay English */ }
    try {
      var raw = localStorage.getItem(LS_HIST);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) state.history = parsed.filter(L.validHistoryEntry);
      }
    } catch (e) { state.history = []; }
  }

  function saveHistory() {
    try { localStorage.setItem(LS_HIST, JSON.stringify(state.history)); } catch (e) { /* ignore */ }
  }

  function saveLang() {
    try { localStorage.setItem(LS_LANG, state.lang); } catch (e) { /* ignore */ }
  }

  // ---- i18n application ----
  var TEXT_MAP = [
    ['title', 'title'], ['subtitle', 'subtitle'],
    ['tabbtn-calc', 'tabCalc'], ['tabbtn-compare', 'tabCompare'],
    ['tabbtn-withdraw', 'tabWithdraw'], ['tabbtn-history', 'tabHistory'],
    ['tabbtn-data', 'tabData'], ['langBtn', 'langBtn'],
    ['calcHeading', 'calcHeading'], ['lblMonthly', 'lblMonthly'],
    ['lblEmployer', 'lblEmployer'], ['lblRate', 'lblRate'],
    ['rateNote', 'rateNote'], ['lblYears', 'lblYears'],
    ['lblStart', 'lblStart'], ['lblIncrement', 'lblIncrement'],
    ['calcBtn', 'calcBtn'], ['resMaturityLabel', 'resMaturity'],
    ['resEmpLabel', 'resEmp'], ['resEmployerLabel', 'resEmployer'],
    ['resInterestLabel', 'resInterest'], ['schedHeading', 'schedHeading'],
    ['colYear', 'colYear'], ['colContrib', 'colContrib'],
    ['colInterest', 'colInterest'], ['colClosing', 'colClosing'],
    ['saveBtn', 'saveBtn'], ['savedMsg', 'savedMsg'],
    ['disclaimer', 'disclaimer'], ['cmpHeading', 'cmpHeading'],
    ['cmpBtn', 'cmpCalcBtn'], ['wdHeading', 'wdHeading'],
    ['lblBalance', 'lblBalance'], ['lblWdPct', 'lblWdPct'],
    ['wdBtn', 'wdBtn'], ['wdWithdrawLabel', 'wdWithdraw'],
    ['wdRemainingLabel', 'wdRemaining'], ['wdNote', 'wdNote'],
    ['histHeading', 'histHeading'], ['histEmpty', 'histEmpty'],
    ['deletedMsg', 'deletedMsg'], ['dataHeading', 'dataHeading'],
    ['exportBtn', 'exportBtn'], ['importBtn', 'importBtn'],
    ['importOk', 'importOk'], ['eraseLabel', 'eraseLabel'],
    ['eraseBtn', 'eraseBtn'], ['erasedMsg', 'erasedMsg'],
    ['eraseWrong', 'eraseWrong']
  ];

  function applyI18n() {
    document.documentElement.lang = state.lang === 'bn' ? 'bn' : 'en';
    TEXT_MAP.forEach(function (pair) {
      var el = $(pair[0]);
      if (el) el.textContent = t(pair[1]);
    });
    var saveName = $('saveName');
    if (saveName) saveName.placeholder = t('saveLabelPh');
    var importText = $('importText');
    if (importText) importText.placeholder = t('importPh');
    document.title = t('title') + ' BD';
    renderCompareCards();
    renderHistory();
    if (state.lastResult) renderResults(state.lastResult);
  }

  // ---- tabs ----
  function showTab(name) {
    ['calc', 'compare', 'withdraw', 'history', 'data'].forEach(function (n) {
      var panel = $('tab-' + n);
      var btn = $('tabbtn-' + n);
      if (panel) panel.hidden = (n !== name);
      if (btn) btn.classList.toggle('active', n === name);
    });
    if (name === 'history') renderHistory();
  }

  // ---- calculator ----
  function readCalcInputs(prefix) {
    prefix = prefix || '';
    function num(id) {
      var v = $(prefix + id).value.trim();
      return v === '' ? NaN : Number(v);
    }
    return {
      monthly: num('monthlyInput'),
      employerPct: num('employerInput'),
      rate: num('rateInput'),
      years: num('yearsInput'),
      start: ($(prefix + 'startInput').value.trim() === '' ? 0 : num('startInput')),
      incrementPct: ($(prefix + 'incInput').value.trim() === '' ? 0 : num('incInput'))
    };
  }

  function showFieldErrors(errors) {
    var map = {
      monthly: 'err-monthly', employerPct: 'err-employerPct', rate: 'err-rate',
      years: 'err-years', start: 'err-start', incrementPct: 'err-incrementPct'
    };
    var msgKey = {
      monthly: 'errMonthly', employerPct: 'errEmployer', rate: 'errRate',
      years: 'errYears', start: 'errStart', incrementPct: 'errIncrement'
    };
    var any = false;
    Object.keys(map).forEach(function (field) {
      var el = $(map[field]);
      if (!el) return;
      if (errors[field]) {
        el.textContent = t(msgKey[field]);
        el.hidden = false;
        any = true;
      } else {
        el.hidden = true;
      }
    });
    return any;
  }

  function renderResults(res) {
    $('resMaturity').textContent = fmt(res.maturityPaisa);
    $('resEmp').textContent = fmt(res.empPaisa);
    $('resEmployer').textContent = fmt(res.employerPaisa);
    $('resInterest').textContent = fmt(res.interestPaisa);
    var body = $('schedBody');
    body.innerHTML = '';
    res.schedule.forEach(function (row) {
      var tr = document.createElement('tr');
      [String(row.year), fmt(row.contribPaisa), fmt(row.interestPaisa), fmt(row.closingPaisa)]
        .forEach(function (txt) {
          var td = document.createElement('td');
          td.textContent = txt;
          tr.appendChild(td);
        });
      body.appendChild(tr);
    });
    $('results').hidden = false;
  }

  function runCalc() {
    var inputs = readCalcInputs();
    var v = L.validateInputs(inputs);
    showFieldErrors(v.errors);
    if (!v.ok) {
      $('results').hidden = true;
      state.lastResult = null;
      return false;
    }
    var res = L.calcPF(inputs);
    state.lastInputs = inputs;
    state.lastResult = res;
    renderResults(res);
    $('savedMsg').hidden = true;
    return true;
  }

  // ---- compare ----
  var CMP_DEFAULTS = [
    { monthly: 5000, employerPct: 100, rate: 6, years: 10, start: 0, incrementPct: 0 },
    { monthly: 5000, employerPct: 100, rate: 8.5, years: 10, start: 0, incrementPct: 0 },
    { monthly: 5000, employerPct: 100, rate: 12, years: 10, start: 0, incrementPct: 0 }
  ];

  function cmpField(i, field) { return 'cmp-' + i + '-' + field; }

  function renderCompareCards() {
    var grid = $('cmpGrid');
    grid.innerHTML = '';
    CMP_DEFAULTS.forEach(function (d, i) {
      var card = document.createElement('div');
      card.className = 'cmp-card';
      card.id = 'cmp-card-' + i;
      var h = document.createElement('h3');
      h.textContent = (state.lang === 'bn' ? L.toBnDigits(String(i + 1)) : String(i + 1)) +
        (state.lang === 'bn' ? ' \u09a8\u09ae \u09aa\u09b0\u09bf\u0995\u09b2\u09cd\u09aa\u09a8\u09be' : 'Plan');
      card.appendChild(h);
      [['monthly', d.monthly], ['employerPct', d.employerPct], ['rate', d.rate],
       ['years', d.years], ['start', d.start], ['incrementPct', d.incrementPct]
      ].forEach(function (pair) {
        var lab = document.createElement('label');
        lab.setAttribute('for', cmpField(i, pair[0]));
        lab.textContent = pair[0];
        var inp = document.createElement('input');
        inp.id = cmpField(i, pair[0]);
        inp.type = 'number';
        inp.step = 'any';
        inp.value = pair[1];
        card.appendChild(lab);
        card.appendChild(inp);
      });
      var presets = document.createElement('div');
      presets.className = 'presets';
      [[t('presetLow'), 6], [t('presetStd'), 8.5], [t('presetHigh'), 12]].forEach(function (p) {
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = p[0];
        b.addEventListener('click', function () {
          $(cmpField(i, 'rate')).value = p[1];
        });
        presets.appendChild(b);
      });
      card.appendChild(presets);
      var res = document.createElement('div');
      res.className = 'cmp-result';
      res.id = 'cmp-res-' + i;
      card.appendChild(res);
      grid.appendChild(card);
    });
  }

  function runCompare() {
    var results = [];
    var anyErr = false;
    for (var i = 0; i < 3; i++) {
      var inputs = {
        monthly: Number($(cmpField(i, 'monthly')).value),
        employerPct: Number($(cmpField(i, 'employerPct')).value),
        rate: Number($(cmpField(i, 'rate')).value),
        years: Number($(cmpField(i, 'years')).value),
        start: Number($(cmpField(i, 'start')).value),
        incrementPct: Number($(cmpField(i, 'incrementPct')).value)
      };
      var res = L.calcPF(inputs);
      results.push(res);
      if (!res.ok) anyErr = true;
    }
    $('cmpError').hidden = !anyErr;
    if (anyErr) {
      $('cmpError').textContent = t('errRate');
      $('cmpResults').hidden = true;
      return;
    }
    var best = L.pickBest(results);
    results.forEach(function (res, i) {
      var card = $('cmp-card-' + i);
      var box = $('cmp-res-' + i);
      card.classList.toggle('best', i === best);
      box.innerHTML = '';
      var big = document.createElement('span');
      big.className = 'big';
      big.textContent = fmt(res.maturityPaisa);
      box.appendChild(big);
      if (i === best) {
        var badge = document.createElement('span');
        badge.className = 'best-badge';
        badge.textContent = t('bestBadge');
        box.appendChild(badge);
      }
      var use = document.createElement('button');
      use.type = 'button';
      use.className = 'secondary use-main';
      use.textContent = t('useAsMain');
      use.addEventListener('click', function () {
        $('monthlyInput').value = $(cmpField(i, 'monthly')).value;
        $('employerInput').value = $(cmpField(i, 'employerPct')).value;
        $('rateInput').value = $(cmpField(i, 'rate')).value;
        $('yearsInput').value = $(cmpField(i, 'years')).value;
        $('startInput').value = $(cmpField(i, 'start')).value;
        $('incInput').value = $(cmpField(i, 'incrementPct')).value;
        showTab('calc');
        runCalc();
      });
      box.appendChild(use);
    });
    $('cmpResults').hidden = true; // results live inside the cards
  }

  // ---- withdrawal ----
  function runWithdrawal() {
    var bal = Number($('wdBalance').value);
    var pct = Number($('wdPct').value);
    var balErr = $('err-wdBalance');
    var pctErr = $('err-wdPct');
    balErr.hidden = true;
    pctErr.hidden = true;
    var bad = false;
    if (!isFinite(bal) || bal < 0) { balErr.textContent = t('errBalance'); balErr.hidden = false; bad = true; }
    if (!isFinite(pct) || pct < 10 || pct > 50) { pctErr.textContent = t('errWd'); pctErr.hidden = false; bad = true; }
    if (bad) { $('wdResults').hidden = true; return false; }
    var r = L.calcWithdrawal(Math.round(bal * 100), pct);
    $('wdWithdraw').textContent = fmt(r.withdrawPaisa);
    $('wdRemaining').textContent = fmt(r.remainingPaisa);
    $('wdResults').hidden = false;
    return true;
  }

  // ---- history ----
  function renderHistory() {
    var list = $('histList');
    list.innerHTML = '';
    $('histEmpty').hidden = state.history.length !== 0;
    state.history.forEach(function (entry, idx) {
      var li = document.createElement('li');
      var name = document.createElement('span');
      name.className = 'h-name';
      name.textContent = entry.name;
      var meta = document.createElement('span');
      meta.className = 'h-meta';
      var inp = entry.inputs;
      var d = function (n) { return state.lang === 'bn' ? L.toBnDigits(String(n)) : String(n); };
      meta.textContent = entry.savedAt + ' \u00b7 ' + d(inp.monthly) + '/mo \u00b7 ' +
        d(inp.years) + 'y \u00b7 ' + d(inp.rate) + '%';
      var amt = document.createElement('span');
      amt.className = 'h-amt';
      amt.textContent = fmt(entry.result.maturityPaisa);
      var load = document.createElement('button');
      load.type = 'button';
      load.textContent = t('loadBtn');
      load.addEventListener('click', function () {
        var inp = entry.inputs;
        $('monthlyInput').value = inp.monthly;
        $('employerInput').value = inp.employerPct;
        $('rateInput').value = inp.rate;
        $('yearsInput').value = inp.years;
        $('startInput').value = inp.start || 0;
        $('incInput').value = inp.incrementPct || 0;
        showTab('calc');
        runCalc();
      });
      var del = document.createElement('button');
      del.type = 'button';
      del.className = 'del';
      del.textContent = t('delBtn');
      del.addEventListener('click', function () {
        state.history.splice(idx, 1);
        saveHistory();
        renderHistory();
        $('deletedMsg').hidden = false;
      });
      li.appendChild(name);
      li.appendChild(meta);
      li.appendChild(amt);
      li.appendChild(load);
      li.appendChild(del);
      list.appendChild(li);
    });
  }

  function saveCurrent() {
    if (!state.lastResult || !state.lastInputs) return;
    var name = $('saveName').value.trim() || ('Plan ' + (state.history.length + 1));
    var entry = {
      name: name.slice(0, 80),
      inputs: state.lastInputs,
      result: { maturityPaisa: state.lastResult.maturityPaisa },
      savedAt: new Date().toISOString().slice(0, 10)
    };
    if (!L.validHistoryEntry(entry)) return;
    state.history.unshift(entry);
    saveHistory();
    $('saveName').value = '';
    $('savedMsg').hidden = false;
  }

  // ---- data ----
  function doExport() {
    var payload = L.exportPayload(state.history);
    var blob = new Blob([payload], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = $('exportLink');
    a.href = url;
    a.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function doImport() {
    var text = $('importText').value;
    var res = L.importPayload(text);
    $('importOk').hidden = true;
    $('importFail').hidden = true;
    if (!res.ok) {
      $('importFail').textContent = t('importFail') + res.error;
      $('importFail').hidden = false;
      return false;
    }
    state.history = res.history;
    saveHistory();
    renderHistory();
    $('importText').value = '';
    $('importOk').hidden = false;
    return true;
  }

  function doErase() {
    var v = $('eraseInput').value.trim();
    if (v !== 'DELETE') {
      $('eraseWrong').hidden = false;
      $('erasedMsg').hidden = true;
      return false;
    }
    state.history = [];
    state.lastResult = null;
    state.lastInputs = null;
    saveHistory();
    $('results').hidden = true;
    $('eraseInput').value = '';
    $('eraseWrong').hidden = true;
    $('erasedMsg').hidden = false;
    renderHistory();
    return true;
  }

  // ---- wire up ----
  function init() {
    loadState();
    applyI18n();
    document.querySelectorAll('.tab').forEach(function (btn) {
      btn.addEventListener('click', function () { showTab(btn.dataset.tab); });
    });
    $('langBtn').addEventListener('click', function () {
      state.lang = state.lang === 'bn' ? 'en' : 'bn';
      saveLang();
      applyI18n();
    });
    $('calcForm').addEventListener('submit', function (e) { e.preventDefault(); runCalc(); });
    $('saveBtn').addEventListener('click', saveCurrent);
    $('cmpBtn').addEventListener('click', runCompare);
    $('wdForm').addEventListener('submit', function (e) { e.preventDefault(); runWithdrawal(); });
    $('exportBtn').addEventListener('click', doExport);
    $('importBtn').addEventListener('click', doImport);
    $('eraseBtn').addEventListener('click', doErase);
    runCalc();
  }

  // Test hooks (used by tests/smoke.js; harmless in normal use).
  window.__pfbd = {
    state: state,
    calcPF: L.calcPF,
    calcWithdrawal: L.calcWithdrawal,
    pickBest: L.pickBest,
    exportPayload: function () { return L.exportPayload(state.history); },
    importPayload: function (text) {
      var r = L.importPayload(text);
      if (r.ok) { state.history = r.history; saveHistory(); renderHistory(); }
      return r;
    },
    eraseAll: function () {
      state.history = [];
      state.lastResult = null;
      state.lastInputs = null;
      saveHistory();
      $('results').hidden = true;
      renderHistory();
    },
    runCalc: runCalc,
    runCompare: runCompare,
    runWithdrawal: runWithdrawal
  };

  document.addEventListener('DOMContentLoaded', init);
})();
