/*
 * Motion gate. Every other harness in this project emulates
 * prefers-reduced-motion so it can measure a settled page -- which means
 * none of them can tell whether the motion layer runs at all. This build
 * shipped FOUR published versions with a dead bundle: reveals, parallax,
 * count-ups and background video all silently inert, and the page still
 * looked complete because the hidden state is opt-in.
 *
 * So this is the one harness that runs with motion ON. It asserts:
 *   1. MotionRoot mounted (html[data-motion="on"]).
 *   2. Below-the-fold reveals actually START hidden -- otherwise nothing is
 *      animating and the attributes are decoration.
 *   3. After a full scroll every reveal ends FULLY OPAQUE. This is the one
 *      that matters most: a reveal that never fires leaves real content
 *      permanently invisible, which is far worse than no animation. The
 *      footer's legal strip did exactly that -- see the rootMargin note in
 *      MotionRoot.
 *
 * Two process details, both learned the hard way:
 *
 * It REFUSES to run against a server it did not start. `srv.kill()` on a
 * shell-spawned `next start` kills only the shell on Windows, so earlier
 * runs left servers listening on half a dozen ports. A stale server plus a
 * rebuilt .next serves 404s for the new chunk hashes, which renders an
 * unstyled, script-less page -- indistinguishable from "the motion layer is
 * dead". That contaminated a real diagnosis. Cleanup uses taskkill /T to
 * take the whole tree, the same way compare.mjs does.
 *
 * It waits for hydration explicitly. networkidle is not hydrated.
 */

import { chromium } from '@playwright/test';
import { spawn, spawnSync } from 'child_process';
import http from 'http';

const PORT = 3031;

function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.request({ hostname: 'localhost', port, method: 'GET', timeout: 1000 }, (res) => {
      res.resume();
      resolve(true);
    });
    req.on('error', () => resolve(false));
    // Node emits 'timeout' but does not destroy the socket itself.
    req.on('timeout', () => { req.destroy(); resolve(false); });
    req.end();
  });
}

if (await checkPort(PORT)) {
  console.error(`Error: port ${PORT} occupied by a server this script did not start.`);
  console.error('Stop it first -- a stale server serves the previous build and makes this gate lie.');
  process.exit(1);
}

const srv = spawn('npx', ['next', 'start', '-p', String(PORT)], { shell: true, stdio: 'ignore' });
function killServer() {
  if (!srv.pid) return;
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/F', '/T', '/PID', String(srv.pid)], { stdio: 'ignore' });
  } else {
    srv.kill('SIGTERM');
  }
}
process.on('exit', killServer);

let up = false;
for (let i = 0; i < 90; i += 1) {
  if (await checkPort(PORT)) { up = true; break; }
  await new Promise((r) => setTimeout(r, 700));
}
if (!up) {
  console.error('Error: server did not come up.');
  process.exit(1);
}

const browser = await chromium.launch();
let fail = 0;

for (const [label, viewport] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 393, height: 852 }]]) {
  // No reducedMotion: this is the one harness that must actually see motion.
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });

  let motionOn = true;
  try {
    await page.waitForFunction(() => document.documentElement.dataset.motion === 'on', null, { timeout: 8000 });
  } catch {
    motionOn = false;
  }

  // Guard against the stale-server / missing-chunk failure mode: if the
  // stylesheet did not load, every assertion below is meaningless.
  const styled = await page.evaluate(() => {
    const stack = document.querySelector('[class*="avatarStack"]');
    if (!stack) return false;
    return getComputedStyle(stack).display === 'flex';
  });
  if (!styled) {
    console.error(`\n=== ${label} ===\n  FAIL: stylesheet did not apply -- the page is unstyled, so this run proves nothing.`);
    fail += 1;
    await page.close();
    continue;
  }

  const before = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('[data-reveal]')) {
      const r = el.getBoundingClientRect();
      out.push({
        lead: el.getAttribute('data-reveal') === 'lead',
        belowFold: r.top > innerHeight,
        opacity: Number(getComputedStyle(el).opacity),
        travel: getComputedStyle(el).getPropertyValue('--reveal-distance').trim() || '(default 24px)',
      });
    }
    return out;
  });
  const belowTotal = before.filter((x) => x.belowFold).length;
  const hiddenBelow = before.filter((x) => x.belowFold && x.opacity < 0.05).length;

  await page.evaluate(async () => {
    const step = Math.round(innerHeight / 3);
    for (let y = 0; y <= document.body.scrollHeight; y += step) {
      scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 110));
    }
    scrollTo(0, document.body.scrollHeight);
  });
  await page.waitForTimeout(1800);

  const after = await page.evaluate(() => {
    const bySection = {};
    for (const el of document.querySelectorAll('[data-reveal]')) {
      const name = el.closest('[data-section]')?.dataset.section ?? '?';
      bySection[name] = bySection[name] || { total: 0, revealed: 0, opaque: 0, stuck: [] };
      bySection[name].total += 1;
      if (el.dataset.revealed === 'true') bySection[name].revealed += 1;
      if (Number(getComputedStyle(el).opacity) > 0.95) bySection[name].opaque += 1;
      else bySection[name].stuck.push((el.className.match(/__([a-zA-Z]+)(?=\s|$)/) || [0, el.tagName])[1]);
    }
    return bySection;
  });

  console.log(`\n=== ${label} ===`);
  console.log(`  html[data-motion=on]: ${motionOn ? 'YES' : 'NO'}`);
  if (pageErrors.length) console.log(`  PAGE ERRORS: ${pageErrors.slice(0, 3).join(' | ')}`);
  console.log(`  below-fold reveals hidden at load: ${hiddenBelow}/${belowTotal}`);
  console.log(`  lead travel: ${[...new Set(before.filter((x) => x.lead).map((x) => x.travel))].join(', ')}  |  item travel: ${[...new Set(before.filter((x) => !x.lead).map((x) => x.travel))].join(', ')}`);
  console.log('  section        reveals  revealed  opaque');
  for (const [name, v] of Object.entries(after)) {
    const bad = v.opaque !== v.total;
    if (bad) fail += 1;
    console.log(`  ${name.padEnd(14)} ${String(v.total).padEnd(8)} ${String(v.revealed).padEnd(9)} ${v.opaque}${bad ? '   <-- STUCK INVISIBLE: ' + v.stuck.join(',') : ''}`);
  }
  if (!motionOn) fail += 1;
  if (belowTotal > 0 && hiddenBelow === 0) {
    console.log('  FAIL: nothing started hidden -- reveals are not running');
    fail += 1;
  }
  await page.close();
}

await browser.close();
killServer();
console.log(fail === 0 ? '\nMOTION OK: every reveal starts hidden and settles fully opaque' : `\nMOTION PROBLEMS: ${fail}`);
process.exit(fail === 0 ? 0 : 1);
