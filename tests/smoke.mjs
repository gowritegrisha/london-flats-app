#!/usr/bin/env node
/**
 * Playwright WebKit smoke (iPhone 13). Usage:
 *   node tests/smoke.mjs [URL]
 * Default URL: http://127.0.0.1:8765/
 * Stub Telegram.WebApp as iOS dark + fake #tgWebAppData.
 */
import { webkit, devices } from 'playwright';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
require.resolve('playwright');

const BASE = (process.argv[2] || 'http://127.0.0.1:8765/').replace(/\/?$/, '/');
const STUB = `window.Telegram={WebApp:{ready(){},expand(){},platform:'ios',version:'8.0',colorScheme:'dark',
initData:'query_id=AA_test&user=%7B%22id%22%3A1%7D&auth_date=1&hash=x',
initDataUnsafe:{user:{id:1,first_name:'Test'},auth_date:1,hash:'x'},
sendData(d){window.__sent=d},openLink(u){window.__open=u},
HapticFeedback:{notificationOccurred(){},selectionChanged(){}},
BackButton:{show(){},hide(){},onClick(fn){window.__bb=fn},offClick(){}},
MainButton:{show(){},hide(){},setText(){},onClick(){}},
themeParams:{},setHeaderColor(){},setBackgroundColor(){},
isExpanded:true,viewportHeight:700,viewportStableHeight:700}};`;

const CHANNELS = ['Email', 'WhatsApp', 'OpenRent', 'Rightmove'];
function chanKey(e) {
  const a = (e.agent || '').toLowerCase(), c = (e.channel || '').toLowerCase();
  if (a.startsWith('openrent') || c === 'openrent') return 'OpenRent';
  if (c.includes('whatsapp')) return 'WhatsApp';
  if (c && c !== 'rightmove') return 'Email';
  return 'Rightmove';
}

const errs = [];
const fail = (m) => errs.push(m);

const browser = await webkit.launch();
const context = await browser.newContext({ ...devices['iPhone 13'], colorScheme: 'dark' });
const page = await context.newPage();
page.on('pageerror', e => fail('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error') fail('console.error: ' + m.text()); });

await page.addInitScript(STUB);
await page.route('**/telegram-web-app.js', r => r.fulfill({
  contentType: 'application/javascript', body: STUB + '\n/* stub */',
}));

// Enrich sent.json so every required channel exists (WhatsApp often absent in live data).
await page.route('**/sent.json*', async (route) => {
  const res = await route.fetch();
  let data = [];
  try { data = await res.json(); } catch { data = []; }
  if (!Array.isArray(data)) data = [];
  const by = {};
  for (const e of data) { const k = chanKey(e); if (!by[k]) by[k] = e; }
  const base = data[0] ? { ...data[0] } : {
    listing_id: 'smoke-stub', title: 'Smoke stub', status: 'sent', channel: 'rightmove',
    source: 'assistant', sent_at: new Date().toISOString(), thread: [],
    next: { who: 'none', text: 'ok' },
  };
  const need = {
    Rightmove: { channel: 'rightmove' },
    Email: { channel: 'chestertons', agent: 'Portico Lettings' },
    WhatsApp: { channel: 'whatsapp', agent: 'Agent WA' },
    OpenRent: { channel: 'openrent', agent: 'OpenRent' },
  };
  for (const ch of CHANNELS) {
    if (by[ch]) continue;
    data.push({
      ...base,
      ...need[ch],
      listing_id: 'smoke-' + ch.toLowerCase(),
      title: 'Smoke ' + ch + ' flat',
      thread: [{ dir: 'masha', enquiry: 1, text: 'Hello smoke ' + ch, date: new Date().toISOString() }],
      next: { who: 'none', text: 'ok', kind: 'awaiting' },
    });
  }
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(data),
  });
});

const target = BASE + '#tgWebAppData=query_id%3DAA_test%26user%3D%257B%2522id%2522%253A1%257D';
const t0 = Date.now();
await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 60000 });

await page.waitForFunction(() => !document.getElementById('boot') && document.querySelectorAll('.card').length > 0, null, { timeout: 25000 });

if (await page.locator('#dbgp').isVisible().catch(() => false)) fail('debug panel #dbgp visible by default');
if (await page.locator('#errbox').isVisible().catch(() => false)) {
  fail('visible error box: ' + (await page.locator('#errbox').innerText()).slice(0, 240));
}

const listingN = await page.evaluate(() => {
  const t = (document.getElementById('cnt')?.textContent || '').replace(/[^\d]/g, '');
  return parseInt(t || '0', 10) || document.querySelectorAll('.card').length;
});
if (!(listingN > 0)) fail('listings count is 0');

for (const tab of ['viewings', 'replies', 'flats']) {
  await page.locator(`nav#tabs [data-tab="${tab}"]`).tap();
  await page.waitForTimeout(150);
}

// Pick one id per channel from enriched S via openSheet (function is global)
await page.locator('nav#tabs [data-tab="replies"]').tap();
await page.waitForTimeout(250);

const channelIds = await page.evaluate((channels) => {
  // Recompute from DOM rows is hard; call openSheet after reading via a temporary hook:
  // App keeps S in script scope — expose by monkeypatching through a known global function.
  // We stored stubs with listing_id smoke-*; also real ones exist.
  const want = {};
  // Probe known stub ids + scan reply rows' onclick
  document.querySelectorAll('#rlist .row1').forEach(el => {
    const m = (el.getAttribute('onclick') || '').match(/openSheet\('([^']+)'\)/);
    if (m) {
      // can't know channel from DOM alone; collect all ids
      want._all = want._all || [];
      want._all.push(m[1]);
    }
  });
  return want;
}, CHANNELS);

// Open each channel by known stub id or by trying candidates from replies list
const candidates = channelIds._all || [];
const tryIds = {
  Rightmove: ['smoke-rightmove', ...candidates],
  Email: ['smoke-email', ...candidates],
  WhatsApp: ['smoke-whatsapp', ...candidates],
  OpenRent: ['smoke-openrent', ...candidates],
};

for (const ch of CHANNELS) {
  let opened = false;
  let lastLabel = '';
  for (const id of tryIds[ch]) {
    const ok = await page.evaluate((id) => {
      try {
        if (typeof openSheet !== 'function') return { err: 'no openSheet' };
        openSheet(id);
        const sh = document.getElementById('sheet');
        const vis = sh && getComputedStyle(sh).display !== 'none';
        const label = document.querySelector('#sheet .sndr')?.textContent || '';
        return { vis: !!vis, label, hasConv: !!document.querySelector('#sheet .conv2') };
      } catch (e) {
        return { err: e.message };
      }
    }, id);
    if (ok.err && ok.err.includes("Can't find variable")) fail(`openSheet ${id}: ${ok.err}`);
    if (ok.err && /chanOf|isAs|agName|whoM|senderTag/.test(ok.err)) fail(`missing helper: ${ok.err}`);
    if (ok.vis && ok.hasConv) {
      lastLabel = ok.label || '';
      const expect = ch === 'OpenRent' ? /OpenRent/i : new RegExp(ch, 'i');
      if (expect.test(lastLabel) || (ch === 'Rightmove' && /Rightmove/i.test(lastLabel))) {
        opened = true;
        await page.evaluate(() => { try { sheetClose(); } catch (_) {} });
        break;
      }
      // wrong channel — close and try next id
      await page.evaluate(() => { try { sheetClose(); } catch (_) {} });
    }
  }
  if (!opened) {
    // Force-open stub id even if label check failed on candidates
    const stub = 'smoke-' + ch.toLowerCase();
    const ok = await page.evaluate((id) => {
      try {
        openSheet(id);
        const sh = document.getElementById('sheet');
        return {
          vis: !!(sh && getComputedStyle(sh).display !== 'none'),
          label: document.querySelector('#sheet .sndr')?.textContent || '',
          errbox: document.getElementById('errbox')?.textContent || '',
        };
      } catch (e) { return { err: e.message }; }
    }, stub);
    if (ok.err) fail(`${ch} openSheet error: ${ok.err}`);
    else if (!ok.vis) fail(`${ch} sheet not visible`);
    else if (ok.errbox) fail(`${ch} errbox: ${ok.errbox.slice(0, 160)}`);
    else if (ch !== 'Rightmove' && ok.label && !new RegExp(ch === 'OpenRent' ? 'OpenRent' : ch, 'i').test(ok.label)) {
      fail(`${ch} unexpected sender label: ${ok.label}`);
    } else {
      opened = true;
    }
    await page.evaluate(() => { try { sheetClose(); } catch (_) {} });
  }
  if (!opened) fail(`could not open enquiry sheet for ${ch}`);
}

// Viewing tab: open sheet from a viewing that has an enquiry, else open first vrow's related card
await page.locator('nav#tabs [data-tab="viewings"]').tap();
await page.waitForTimeout(200);
const vrows = await page.locator('.vrow').count();
if (!vrows) fail('no viewings rendered');
else {
  const vOpened = await page.evaluate(() => {
    const btn = document.querySelector('.vrow .cta .b, .vrow a.b');
    if (btn && /Переписка|Карточка|💬|🏠/.test(btn.textContent || '')) {
      btn.click();
      return true;
    }
    return false;
  });
  await page.waitForTimeout(200);
  if (vOpened) {
    const vis = await page.evaluate(() => {
      const sh = document.getElementById('sheet');
      return sh && getComputedStyle(sh).display !== 'none';
    });
    if (!vis) fail('viewing-related sheet did not open');
    await page.evaluate(() => { try { sheetClose(); } catch (_) {} });
  }
}

// Flat ⋯ menu + score sheet
await page.locator('nav#tabs [data-tab="flats"]').tap();
await page.waitForTimeout(200);

const moreBtn = page.locator('.card button[aria-label="Ещё"]').first();
if (await moreBtn.count()) {
  await moreBtn.tap();
  await page.waitForTimeout(250);
  if (!(await page.evaluate(() => !!document.querySelector('#sheet .menu')))) fail('⋯ menu sheet missing .menu');
  await page.evaluate(() => { try { sheetClose(); } catch (_) {} });
} else fail('no ⋯ button on cards');

const scoreBtn = page.locator('.card button.score').first();
if (await scoreBtn.count()) {
  await scoreBtn.tap();
  await page.waitForTimeout(300);
  const scoreSheet = await page.evaluate(() => {
    const sh = document.getElementById('sheet');
    return sh && getComputedStyle(sh).display !== 'none';
  });
  if (!scoreSheet) fail('score sheet not open');
  await page.evaluate(() => { try { sheetClose(); } catch (_) {} });
} else fail('no score button');

// Scroll / load more (one page only — keep gate fast)
const before = await page.locator('.card').count();
await page.evaluate(() => { try { fillList(); } catch (_) {} });
await page.waitForTimeout(200);
const after = await page.locator('.card').count();
if (listingN > before && after <= before) fail(`expected more cards after load-more (had ${before}, total~${listingN}, now ${after})`);

if (await page.locator('#errbox').isVisible().catch(() => false)) {
  fail('error box visible at end: ' + (await page.locator('#errbox').innerText()).slice(0, 240));
}
if (await page.locator('#dbgp').isVisible().catch(() => false)) fail('debug panel visible at end');

await browser.close();
const ms = Date.now() - t0;
if (errs.length) {
  console.error(`smoke: FAIL (${ms}ms) url=${BASE}`);
  for (const e of errs) console.error(' -', e);
  process.exit(1);
}
console.log(`smoke: OK (${ms}ms) listings~${listingN} cards=${after} url=${BASE}`);
