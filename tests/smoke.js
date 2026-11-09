// provident-fund-bd -- headless-Chrome smoke test via raw CDP (no puppeteer dependency).
// Usage: node tests/smoke.js
// Exits non-zero on any failed assertion; fails on page console errors.
// ?asof=2026-11-09 pins "today" for saved-plan dates.
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const PORT = 9352;
const FILE = 'file://' + path.resolve(__dirname, '..', 'index.html') + '?asof=2026-11-09';
let failures = 0;
let count = 0;
const pageErrors = [];
function check(name, cond, extra) {
  count++;
  console.log((cond ? 'ok - ' : 'FAIL - ') + name + (cond ? '' : ' :: ' + (extra || '')));
  if (!cond) failures++;
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const CHROME_BIN = process.env.CHROME_BIN ||
    require('os').homedir() + '/.cache/ms-playwright/chromium_headless_shell-1187/chrome-linux/headless_shell';
  const chrome = spawn(CHROME_BIN, [
    '--headless=new', '--no-sandbox', '--disable-gpu',
    '--remote-debugging-port=' + PORT, '--user-data-dir=/tmp/pfbd-smoke-' + process.pid,
    'about:blank',
  ], { stdio: 'ignore' });
  let targets = [];
  for (let i = 0; i < 50 && targets.length === 0; i++) {
    await wait(200);
    try {
      targets = JSON.parse(await new Promise((res, rej) => {
        http.get('http://127.0.0.1:' + PORT + '/json/list', (r) => {
          let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => res(d));
        }).on('error', rej);
      }));
    } catch (e) { /* retry */ }
  }
  if (!targets.length) { console.log('FAIL - chrome did not start'); process.exit(2); }
  const wsUrl = targets[0].webSocketDebuggerUrl;
  const ws = new WebSocket(wsUrl);
  await new Promise((res) => { ws.onopen = res; });
  let seq = 0; const pending = new Map();
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    if (msg.method === 'Runtime.exceptionThrown') {
      pageErrors.push('exception: ' + JSON.stringify(msg.params.exceptionDetails).slice(0, 300));
    }
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      pageErrors.push('console.error: ' + JSON.stringify(msg.params.args).slice(0, 300));
    }
  };
  function send(method, params) {
    return new Promise((res) => {
      const id = ++seq;
      pending.set(id, res);
      ws.send(JSON.stringify({ id, method, params: params || {} }));
    });
  }
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: FILE });
  await wait(1500);
  const ev = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.result && r.result.exceptionDetails) return { error: JSON.stringify(r.result.exceptionDetails).slice(0, 300) };
    return r.result ? r.result.result.value : undefined;
  };
  const T = '\u09f3'; // taka sign
  const BN = (s) => s.replace(/[0-9]/g, (d) => '\u09e6\u09e7\u09e8\u09e9\u09ea\u09eb\u09ec\u09ed\u09ee\u09ef'[+d]);

  check('page title contains Provident Fund', (await ev('document.title'))?.includes('Provident Fund'));
  check('5 tabs render', (await ev(`document.querySelectorAll('.tab').length`)) === 5);
  check('calc tab visible by default', (await ev(`document.getElementById('tab-calc').hidden`)) === false);
  check('disclaimer renders', (await ev(`document.getElementById('disclaimer').textContent.length`)) > 40);
  check('rate note labels estimate', (await ev(`document.getElementById('rateNote').textContent`)).includes('Estimate only'));

  // Default calc: 5000/100%/8.5%/10y -> maturity 1,894,710.66 (matches unit tests).
  check('default maturity ' + T + '1,894,710.66', (await ev(`document.getElementById('resMaturity').textContent`)) === T + '1,894,710.66');
  check('default emp total ' + T + '600,000.00', (await ev(`document.getElementById('resEmp').textContent`)) === T + '600,000.00');
  check('default interest ' + T + '694,710.66', (await ev(`document.getElementById('resInterest').textContent`)) === T + '694,710.66');
  check('schedule has 10 rows', (await ev(`document.querySelectorAll('#schedBody tr').length`)) === 10);
  check('year-1 closing ' + T + '125,671.08', (await ev(`document.querySelector('#schedBody tr').textContent`)).includes(T + '125,671.08'));

  // Validation: zero contribution shows inline error.
  await ev(`document.getElementById('monthlyInput').value='0';`);
  await ev(`document.getElementById('calcBtn').click()`);
  check('zero contribution shows error', (await ev(`document.getElementById('err-monthly').hidden`)) === false);
  check('results hidden after invalid calc', (await ev(`document.getElementById('results').hidden`)) === true);

  // Zero-interest edge: rate 0, 5y -> exactly 600,000.00.
  await ev(`document.getElementById('monthlyInput').value='5000'; document.getElementById('rateInput').value='0'; document.getElementById('yearsInput').value='5';`);
  await ev(`document.getElementById('calcBtn').click()`);
  check('zero-interest maturity ' + T + '600,000.00', (await ev(`document.getElementById('resMaturity').textContent`)) === T + '600,000.00');
  await ev(`document.getElementById('rateInput').value='8.5'; document.getElementById('yearsInput').value='10';`);
  await ev(`document.getElementById('calcBtn').click()`);
  check('back to default maturity', (await ev(`document.getElementById('resMaturity').textContent`)) === T + '1,894,710.66');

  // Compare: 3 cards, best is plan 3 (12%), badge present, use-as-main copies rate 12.
  await ev(`document.getElementById('tabbtn-compare').click()`);
  check('compare has 3 cards', (await ev(`document.querySelectorAll('.cmp-card').length`)) === 3);
  await ev(`document.getElementById('cmpBtn').click()`);
  check('best card is plan 3', (await ev(`document.getElementById('cmp-card-2').classList.contains('best')`)) === true);
  check('best badge shows BEST', (await ev(`document.getElementById('cmp-res-2').textContent`)).includes('BEST'));
  check('plan 3 maturity ' + T + '2,323,390.75', (await ev(`document.getElementById('cmp-res-2').textContent`)).includes(T + '2,323,390.75'));
  check('plan 1 maturity lower', (await ev(`document.getElementById('cmp-res-0').textContent`)).includes(T + '1,646,987.49'));
  await ev(`document.querySelector('#cmp-res-2 .use-main').click()`);
  check('use-as-main switches to calc tab', (await ev(`document.getElementById('tab-calc').hidden`)) === false);
  check('use-as-main sets rate 12', (await ev(`document.getElementById('rateInput').value`)) === '12');
  check('use-as-main maturity matches plan 3', (await ev(`document.getElementById('resMaturity').textContent`)) === T + '2,323,390.75');
  await ev(`document.getElementById('rateInput').value='8.5'; document.getElementById('calcBtn').click()`);

  // Withdrawal: 25% of 1,000,000 -> 250,000 withdraw, 750,000 remain; 60% rejected.
  await ev(`document.getElementById('tabbtn-withdraw').click()`);
  await ev(`document.getElementById('wdBtn').click()`);
  check('withdraw 25% = ' + T + '250,000.00', (await ev(`document.getElementById('wdWithdraw').textContent`)) === T + '250,000.00');
  check('remaining ' + T + '750,000.00', (await ev(`document.getElementById('wdRemaining').textContent`)) === T + '750,000.00');
  await ev(`document.getElementById('wdPct').value='60'; document.getElementById('wdBtn').click()`);
  check('60% withdrawal shows error', (await ev(`document.getElementById('err-wdPct').hidden`)) === false);
  await ev(`document.getElementById('wdPct').value='25';`);

  // History: save + reload persistence + delete.
  await ev(`window.__pfbd.eraseAll()`);
  await ev(`document.getElementById('tabbtn-calc').click()`);
  await ev(`document.getElementById('calcBtn').click()`);
  await ev(`document.getElementById('saveName').value='My 10y plan'; document.getElementById('saveBtn').click();`);
  check('saved message shows', (await ev(`document.getElementById('savedMsg').hidden`)) === false);
  await ev(`document.getElementById('tabbtn-history').click()`);
  check('history row label My 10y plan', (await ev(`document.getElementById('histList').textContent`)).includes('My 10y plan'));
  check('history row amount ' + T + '1,894,710.66', (await ev(`document.getElementById('histList').textContent`)).includes(T + '1,894,710.66'));
  check('history empty state hidden', (await ev(`document.getElementById('histEmpty').hidden`)) === true);
  await send('Page.navigate', { url: FILE });
  await wait(1200);
  await ev(`document.getElementById('tabbtn-history').click()`);
  check('saved plan persists after reload', (await ev(`document.getElementById('histList').textContent`)).includes('My 10y plan'));
  await ev(`document.querySelector('#histList .del').click()`);
  check('delete removes row', (await ev(`document.querySelectorAll('#histList li').length`)) === 0);
  check('empty state returns after delete', (await ev(`document.getElementById('histEmpty').hidden`)) === false);

  // Export / import round-trip + malformed import rejected, data intact.
  await ev(`document.getElementById('tabbtn-calc').click()`);
  await ev(`document.getElementById('calcBtn').click()`);
  await ev(`document.getElementById('saveName').value='Roundtrip'; document.getElementById('saveBtn').click();`);
  const payload = await ev(`window.__pfbd.exportPayload()`);
  check('export payload is provident-fund-bd v1', payload.includes('"app": "provident-fund-bd"') && payload.includes('"version": 1'), payload);
  check('export payload carries saved plan', payload.includes('Roundtrip'));
  await ev(`window.__pfbd.eraseAll()`);
  check('eraseAll clears history', (await ev(`window.__pfbd.exportPayload()`)).includes('"history": []'));
  const imp = await ev(`JSON.stringify(window.__pfbd.importPayload(${JSON.stringify(payload)}))`);
  check('import valid payload ok', imp.includes('"ok":true'), imp);
  check('import restores saved plan', (await ev(`JSON.stringify(window.__pfbd.exportPayload())`)).includes('Roundtrip'));
  const badImp = await ev(`JSON.stringify(window.__pfbd.importPayload('{"app":"bus-fare-bd","version":1}'))`);
  check('import wrong app rejected', badImp.includes('"ok":false'));
  check('invalid import leaves data intact', (await ev(`JSON.stringify(window.__pfbd.exportPayload())`)).includes('Roundtrip'));
  const badJson = await ev(`JSON.stringify(window.__pfbd.importPayload('{not json'))`);
  check('malformed JSON rejected', badJson.includes('"ok":false'));
  await ev(`window.__pfbd.eraseAll()`);

  // Data tab: typed-DELETE erase via UI; wrong word rejected.
  await ev(`document.getElementById('tabbtn-calc').click()`);
  await ev(`document.getElementById('calcBtn').click()`);
  await ev(`document.getElementById('saveName').value='EraseTest'; document.getElementById('saveBtn').click();`);
  await ev(`document.getElementById('tabbtn-data').click()`);
  await ev(`document.getElementById('eraseInput').value='delete'; document.getElementById('eraseBtn').click();`);
  check('wrong erase word rejected', (await ev(`document.getElementById('eraseWrong').hidden`)) === false);
  check('wrong erase keeps data', (await ev(`JSON.stringify(window.__pfbd.exportPayload())`)).includes('EraseTest'));
  await ev(`document.getElementById('eraseInput').value='DELETE'; document.getElementById('eraseBtn').click();`);
  check('DELETE erases data', (await ev(`window.__pfbd.exportPayload()`)).includes('"history": []'));
  check('erase success message shows', (await ev(`document.getElementById('erasedMsg').hidden`)) === false);

  // Language toggle: Bengali title + digits, persists after reload.
  await ev(`document.getElementById('langBtn').click()`);
  check('BN toggle: title in Bengali', (await ev(`document.getElementById('title').textContent`)) === '\u09aa\u09cd\u09b0\u09ad\u09bf\u09a1\u09c7\u09a8\u09cd\u099f \u09ab\u09be\u09a8\u09cd\u09a1 \u0995\u09cd\u09af\u09be\u09b2\u0995\u09c1\u09b2\u09c7\u099f\u09b0');
  check('BN toggle: tab label in Bengali', (await ev(`document.getElementById('tabbtn-calc').textContent`)) === '\u0995\u09cd\u09af\u09be\u09b2\u0995\u09c1\u09b2\u09c7\u099f\u09b0');
  await ev(`document.getElementById('tabbtn-calc').click()`);
  await ev(`document.getElementById('calcBtn').click()`);
  check('BN toggle: total in Bengali digits', (await ev(`document.getElementById('resMaturity').textContent`)) === T + BN('1,894,710.66'));
  await send('Page.navigate', { url: FILE });
  await wait(1200);
  check('BN toggle persists after reload', (await ev(`window.__pfbd.state.lang`)) === 'bn');
  await ev(`document.getElementById('langBtn').click()`);
  check('back to EN', (await ev(`window.__pfbd.state.lang`)) === 'en');

  // Mobile 390px: no horizontal overflow on calc + compare + history + data tabs.
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await send('Page.navigate', { url: FILE });
  await wait(1200);
  const overflow = await ev(`document.documentElement.scrollWidth - document.documentElement.clientWidth`);
  check('390px no horizontal overflow (calc)', overflow <= 0, 'overflow=' + overflow);
  await ev(`document.getElementById('tabbtn-compare').click()`);
  const overflow2 = await ev(`document.documentElement.scrollWidth - document.documentElement.clientWidth`);
  check('390px no horizontal overflow (compare)', overflow2 <= 0, 'overflow=' + overflow2);
  await ev(`document.getElementById('tabbtn-history').click()`);
  const overflow3 = await ev(`document.documentElement.scrollWidth - document.documentElement.clientWidth`);
  check('390px no horizontal overflow (history)', overflow3 <= 0, 'overflow=' + overflow3);
  await ev(`document.getElementById('tabbtn-data').click()`);
  const overflow4 = await ev(`document.documentElement.scrollWidth - document.documentElement.clientWidth`);
  check('390px no horizontal overflow (data)', overflow4 <= 0, 'overflow=' + overflow4);

  // Zero network requests: app is fully offline (only file:// loads).
  const reqs = await ev(`performance.getEntriesByType('resource').map(r => r.name).filter(n => !n.startsWith('file://')).length`);
  check('zero non-file network requests', reqs === 0, 'non-file=' + reqs);

  check('no console/page errors', pageErrors.length === 0, pageErrors.slice(0, 3).join(' | '));

  chrome.kill();
  console.log('\n' + count + ' checks, ' + failures + ' failed');
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.log('FAIL - harness error: ' + e.message); try { chrome.kill(); } catch (_) {} process.exit(2); });
