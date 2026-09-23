#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { spawn, spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import http from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const refDir = path.join(projectRoot, 'design', 'ref');
const outDir = path.join(__dirname, 'out', 'diff');

// Gate thresholds. Starting points -- calibrate against a measured baseline.
const MEAN_ABS_DIFF_MAX = 8;
const DIFF_PIXEL_CHANNEL_DELTA = 20;
const DIFF_PIXEL_PCT_MAX = 10;

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 393, height: 852 }
};

// ---------------------------------------------------------------- args

const args = process.argv.slice(2);
let sections = null;
let viewportFilter = 'both';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--section' && i + 1 < args.length) {
    sections = args[i + 1].split(',').map(s => s.trim()).filter(Boolean);
    i++;
  } else if (args[i] === '--viewport' && i + 1 < args.length) {
    viewportFilter = args[i + 1].trim();
    i++;
  } else {
    console.error(`Error: unrecognised argument "${args[i]}"`);
    console.error('Usage: node scripts/compare.mjs [--section id[,id]] [--viewport desktop|mobile|both]');
    process.exit(1);
  }
}

if (!['desktop', 'mobile', 'both'].includes(viewportFilter)) {
  console.error(`Error: --viewport must be desktop, mobile or both (got "${viewportFilter}")`);
  process.exit(1);
}
const viewportNames = viewportFilter === 'both' ? ['desktop', 'mobile'] : [viewportFilter];

// ---------------------------------------------------------------- design data

let designData;
try {
  designData = JSON.parse(fs.readFileSync(path.join(projectRoot, 'design', 'sections.json'), 'utf-8'));
} catch (e) {
  console.error('Error loading design/sections.json:', e.message);
  process.exit(1);
}

const nodeMap = new Map();
for (const section of designData) {
  nodeMap.set(section.id, {
    desktop: section.desktopNodeId,
    mobile: section.mobileNodeId
  });
}

const allSectionIds = Array.from(nodeMap.keys());
if (!sections) sections = allSectionIds;

for (const id of sections) {
  if (!nodeMap.has(id)) {
    console.error(`Error: Unknown section "${id}". Available: ${allSectionIds.join(', ')}`);
    process.exit(1);
  }
}

const refPathFor = nodeId => path.join(refDir, `${String(nodeId).replace(':', '-')}.png`);

// ---------------------------------------------------------------- server

function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port,
      method: 'GET',
      timeout: 1000
    }, (res) => {
      // Drain, or the socket is left open and the process will not exit.
      res.resume();
      resolve(true);
    });
    req.on('error', () => resolve(false));
    // Node emits 'timeout' but does NOT destroy the socket on its own. Without
    // this handler, something that completes the TCP handshake and then goes
    // silent never fires 'error' or the response callback, and this promise
    // never settles -- waitForPort would spin forever.
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });
}

async function waitForPort(port, timeout = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await checkPort(port)) return true;
    await new Promise(r => setTimeout(r, 500));
  }
  return false;
}

let serverProcess = null;
let baseUrl = null;

async function startServer() {
  const port = Number(process.env.COMPARE_PORT || 3019);

  if (await checkPort(port)) {
    console.error(`Error: port ${port} occupied by a server this script did not start`);
    process.exit(1);
  }

  console.log(`Starting production server on port ${port}...`);

  // shell:true is required on Windows: spawn('npm', ...) hits ENOENT because npm
  // is npm.cmd, not an executable. Invoke next directly so the port override is
  // not fighting the -p already baked into the `start` script.
  serverProcess = spawn('npx', ['next', 'start', '-p', String(port)], {
    cwd: projectRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32'
  });

  const ready = await waitForPort(port);
  if (!ready) {
    console.error('Error: server failed to start within timeout (did you run `npm run build`?)');
    killServer();
    process.exit(1);
  }

  baseUrl = `http://localhost:${port}`;
  console.log(`Server ready at ${baseUrl}`);
}

function killServer() {
  if (!serverProcess) return;
  if (process.platform === 'win32') {
    // Kill only our own child pid (and its tree) -- never by port or image name.
    try {
      spawnSync('taskkill', ['/F', '/T', '/PID', String(serverProcess.pid)], { stdio: 'ignore' });
    } catch {
      // already gone
    }
  } else {
    serverProcess.kill('SIGTERM');
  }
  serverProcess = null;
}

// ---------------------------------------------------------------- settle

// Do NOT use img.decode(): it does not reliably settle for an <img> pointing at
// an SVG in Chromium, and most of this page's images are SVGs. complete +
// naturalWidth is reliable and strictly stronger -- a missing or corrupt file
// reports complete === true with naturalWidth === 0.
async function waitForSettle(page) {
  return page.evaluate(async () => {
    const problems = [];
    const deadline = Date.now() + 15000;

    let fontsReady = false;
    await Promise.race([
      document.fonts.ready.then(() => { fontsReady = true; }),
      new Promise(r => setTimeout(r, 10000))
    ]);
    if (!fontsReady) problems.push('document.fonts.ready never resolved');

    const onScreen = el => {
      const r = el.getBoundingClientRect();
      return r.bottom > 0 && r.top < window.innerHeight
        && r.right > 0 && r.left < window.innerWidth;
    };

    for (const img of Array.from(document.querySelectorAll('img'))) {
      const src = img.currentSrc || img.src;
      // A lazy img below the fold has not been asked to load yet. Chromium still
      // sets currentSrc on it, so being on screen -- not currentSrc -- is what
      // distinguishes "in flight" from "deferred".
      if (!img.complete && !onScreen(img)) continue;
      while (!img.complete && Date.now() < deadline) {
        await new Promise(r => setTimeout(r, 50));
      }
      if (!img.complete) problems.push(`never finished loading: ${src}`);
      else if (img.naturalWidth === 0) {
        problems.push(`loaded with zero intrinsic width (missing or corrupt): ${src}`);
      }
    }
    return problems;
  });
}

// ---------------------------------------------------------------- diffing

function largestDiffRegion(mask, w, h) {
  // 4-connected flood fill. Consumes `mask` (visited pixels are zeroed).
  const stack = new Int32Array(w * h);
  let best = null;

  for (let i = 0; i < mask.length; i++) {
    if (!mask[i]) continue;
    let sp = 0;
    stack[sp++] = i;
    mask[i] = 0;
    let minX = w, maxX = -1, minY = h, maxY = -1, area = 0;

    while (sp > 0) {
      const p = stack[--sp];
      const y = (p / w) | 0;
      const x = p - y * w;
      area++;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (x > 0 && mask[p - 1]) { mask[p - 1] = 0; stack[sp++] = p - 1; }
      if (x < w - 1 && mask[p + 1]) { mask[p + 1] = 0; stack[sp++] = p + 1; }
      if (y > 0 && mask[p - w]) { mask[p - w] = 0; stack[sp++] = p - w; }
      if (y < h - 1 && mask[p + w]) { mask[p + w] = 0; stack[sp++] = p + w; }
    }

    if (!best || area > best.area) {
      best = { area, x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
    }
  }
  return best;
}

function diffImages(refRaw, builtRaw, w, h) {
  const px = w * h;
  const heat = Buffer.alloc(px * 3);
  const mask = new Uint8Array(px);
  let sumAbs = 0;
  let overCount = 0;

  for (let i = 0; i < px; i++) {
    const o = i * 3;
    const dr = Math.abs(refRaw[o] - builtRaw[o]);
    const dg = Math.abs(refRaw[o + 1] - builtRaw[o + 1]);
    const db = Math.abs(refRaw[o + 2] - builtRaw[o + 2]);
    sumAbs += dr + dg + db;

    const dmax = dr > dg ? (dr > db ? dr : db) : (dg > db ? dg : db);
    if (dmax > DIFF_PIXEL_CHANNEL_DELTA) {
      overCount++;
      mask[i] = 1;
    }

    // black -> red -> yellow -> white ramp
    heat[o] = Math.min(255, dmax * 4);
    heat[o + 1] = Math.max(0, Math.min(255, (dmax - 64) * 4));
    heat[o + 2] = Math.max(0, Math.min(255, (dmax - 160) * 4));
  }

  return {
    meanAbsDiff: sumAbs / (px * 3),
    diffPixelPct: (overCount / px) * 100,
    diffPixelCount: overCount,
    largestRegion: largestDiffRegion(mask, w, h),
    heat
  };
}

async function writeDiffPng(file, refRaw, builtRaw, heat, w, h) {
  const panel = raw => sharp(raw, { raw: { width: w, height: h, channels: 3 } }).png().toBuffer();
  const [a, b, c] = await Promise.all([panel(refRaw), panel(builtRaw), panel(heat)]);
  const gap = 8;
  await sharp({
    create: {
      width: w * 3 + gap * 2,
      height: h,
      channels: 3,
      background: { r: 24, g: 24, b: 24 }
    }
  })
    .composite([
      { input: a, left: 0, top: 0 },
      { input: b, left: w + gap, top: 0 },
      { input: c, left: (w + gap) * 2, top: 0 }
    ])
    .png()
    .toFile(file);
}

// ---------------------------------------------------------------- main

async function run() {
  fs.mkdirSync(outDir, { recursive: true });
  await startServer();

  let browser;
  const results = [];
  let settleFailed = false;

  try {
    browser = await /* Contexts below request reduced motion: the page's scroll reveals
   start at opacity 0, so without it a harness captures a half-faded
   page. MotionRoot honours the preference by never hiding anything. */
    chromium.launch({ headless: true });

    for (const viewportName of viewportNames) {
      const viewport = VIEWPORTS[viewportName];
      console.log(`\nComparing at ${viewport.width}x${viewport.height} (${viewportName})...`);

      const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: 'reduce' });
      const page = await context.newPage();
      await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 60000 });

      for (const sectionId of sections) {
        const nodeId = nodeMap.get(sectionId)[viewportName];
        const refFile = refPathFor(nodeId);
        const base = {
          section: sectionId,
          viewport: viewportName,
          node: nodeId
        };

        const element = await page.$(`[data-section="${sectionId}"]`);
        if (!element) {
          results.push({ ...base, status: 'FAIL', note: 'element [data-section] not found' });
          continue;
        }

        if (!fs.existsSync(refFile)) {
          results.push({ ...base, status: 'FAIL', note: `reference missing: ${path.relative(projectRoot, refFile)}` });
          continue;
        }

        // Scroll the section in first so its lazy images are actually asked to
        // load, then assert the page has settled before capturing.
        await element.scrollIntoViewIfNeeded();
        const problems = await waitForSettle(page);
        if (problems.length > 0) {
          console.error(`\nFAIL: page did not settle at ${viewportName} for section "${sectionId}":`);
          for (const p of problems) console.error(`  ${p}`);
          settleFailed = true;
        }

        const refImg = sharp(refFile);
        const refMeta = await refImg.metadata();
        const w = refMeta.width;
        const h = refMeta.height;
        const refDim = `${w}x${h}`;

        // Measure the element's own laid-out box in page coordinates. Do NOT use
        // elementHandle.screenshot(): it expands the clip past the element's
        // fractional box and hands back an image 1px taller than the layout,
        // which would read as visual error where there is none. Take the layout
        // box as the source of truth and clip the page to it explicitly.
        const rect = await element.evaluate(el => {
          const r = el.getBoundingClientRect();
          return { x: r.x + window.scrollX, y: r.y + window.scrollY, width: r.width, height: r.height };
        });
        const builtW = Math.round(rect.width);
        const builtH = Math.round(rect.height);
        const builtDim = `${builtW}x${builtH}`;

        // Nothing is ever resized -- rescaling to force a comparison would
        // invent pixel differences that do not exist. But refusing to compare
        // at all left five of fourteen sections with no number whatsoever,
        // which is worse information than an honest partial one. So a small
        // mismatch still FAILS on size, and additionally reports the metrics
        // over the region the two images genuinely share, clipped from the
        // same top-left origin. Anything larger stays uncompared, because the
        // overlap would no longer represent the same content.
        const sizeMismatch = builtW !== w || builtH !== h;
        const OVERLAP_TOLERANCE_PX = 8;
        if (
          sizeMismatch &&
          (Math.abs(builtW - w) > OVERLAP_TOLERANCE_PX ||
            Math.abs(builtH - h) > OVERLAP_TOLERANCE_PX)
        ) {
          results.push({
            ...base,
            refDim,
            builtDim,
            status: 'FAIL',
            note: `dimension mismatch (laid out ${rect.width.toFixed(2)}x${rect.height.toFixed(2)}, `
              + `off by ${builtW - w}x${builtH - h}) - too large to compare`
          });
          continue;
        }
        const cmpW = Math.min(builtW, w);
        const cmpH = Math.min(builtH, h);

        // fullPage is required: `clip` is resolved against the captured image,
        // and most sections are taller than the viewport, so a viewport-only
        // capture rejects the clip as out of bounds.
        const shotBuf = await page.screenshot({
          type: 'png',
          fullPage: true,
          clip: { x: Math.round(rect.x), y: Math.round(rect.y), width: cmpW, height: cmpH }
        });
        const builtImg = sharp(shotBuf);
        const shotMeta = await builtImg.metadata();
        if (shotMeta.width !== cmpW || shotMeta.height !== cmpH) {
          results.push({
            ...base,
            refDim,
            builtDim: `${shotMeta.width}x${shotMeta.height}`,
            status: 'FAIL',
            note: 'clipped capture came back the wrong size - not compared'
          });
          continue;
        }

        // Crop the reference to the same shared region so both buffers
        // describe the same pixels. extract() is a crop, never a resize.
        const refCropped =
          cmpW === w && cmpH === h
            ? refImg.clone()
            : refImg.clone().extract({ left: 0, top: 0, width: cmpW, height: cmpH });
        const refRaw = await refCropped.removeAlpha().raw().toBuffer();
        const builtRaw = await builtImg.clone().removeAlpha().raw().toBuffer();

        const d = diffImages(refRaw, builtRaw, cmpW, cmpH);

        const diffFile = path.join(outDir, `${sectionId}-${viewportName}.png`);
        await writeDiffPng(diffFile, refRaw, builtRaw, d.heat, cmpW, cmpH);

        // A size mismatch is always a failure, however good the pixels over
        // the shared region are -- the section is the wrong size.
        const failed =
          sizeMismatch ||
          d.meanAbsDiff > MEAN_ABS_DIFF_MAX ||
          d.diffPixelPct > DIFF_PIXEL_PCT_MAX;
        results.push({
          ...base,
          refDim,
          builtDim,
          meanAbsDiff: d.meanAbsDiff,
          diffPixelPct: d.diffPixelPct,
          diffPixelCount: d.diffPixelCount,
          largestRegion: d.largestRegion,
          diffFile: path.relative(projectRoot, diffFile),
          status: failed ? 'FAIL' : 'PASS',
          note: sizeMismatch
            ? `SIZE off by ${builtW - w}x${builtH - h}; metrics are over the shared ${cmpW}x${cmpH}`
            : undefined
        });
      }

      await context.close();
    }
  } finally {
    if (browser) await browser.close();
    killServer();
  }

  // ------------------------------------------------------------ report

  console.log('\n=== Visual Comparison ===\n');
  const head = 'Section      | Viewport | Reference  | Built      | mean|d| | %>20   | Largest differing region        | Status';
  console.log(head);
  console.log('-'.repeat(head.length));

  for (const r of results) {
    const row = [
      r.section.padEnd(12),
      r.viewport.padEnd(8),
      (r.refDim || '-').padEnd(10),
      (r.builtDim || '-').padEnd(10),
      (r.meanAbsDiff === undefined ? '-' : r.meanAbsDiff.toFixed(2)).padStart(7),
      (r.diffPixelPct === undefined ? '-' : r.diffPixelPct.toFixed(2) + '%').padStart(6),
      (r.largestRegion
        ? `${r.largestRegion.w}x${r.largestRegion.h} @ ${r.largestRegion.x},${r.largestRegion.y} (${r.largestRegion.area}px)`
        : '-').padEnd(31),
      r.status
    ].join(' | ');
    console.log(row);
    if (r.note) console.log(`             ! ${r.note}`);
  }

  console.log(`\nGates: mean|d| <= ${MEAN_ABS_DIFF_MAX}, pixels differing by more than ${DIFF_PIXEL_CHANNEL_DELTA} <= ${DIFF_PIXEL_PCT_MAX}%`);
  console.log(`Side-by-side + heatmap PNGs: ${path.relative(projectRoot, outDir)}`);

  const failures = results.filter(r => r.status === 'FAIL');
  if (failures.length > 0) {
    console.log(`\n${failures.length} of ${results.length} comparisons FAILED.`);
  } else {
    console.log(`\nAll ${results.length} comparisons PASSED.`);
  }

  return failures.length === 0 && !settleFailed;
}

try {
  const ok = await run();
  process.exit(ok ? 0 : 1);
} catch (e) {
  console.error('Error during comparison:', e.stack || e.message);
  killServer();
  process.exit(1);
}
