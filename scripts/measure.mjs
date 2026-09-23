#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { spawn, spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { chromium } from '@playwright/test';
import http from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// Parse command line arguments
const args = process.argv.slice(2);
let sections = null;
let overflowOnly = false;
let customUrl = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--section' && i + 1 < args.length) {
    sections = args[i + 1].split(',').map(s => s.trim());
    i++;
  } else if (args[i] === '--all') {
    sections = ['hero', 'transactions', 'features', 'habits', 'pricing', 'faq', 'footer'];
  } else if (args[i] === '--overflow-only') {
    overflowOnly = true;
  } else if (args[i] === '--url' && i + 1 < args.length) {
    customUrl = args[i + 1];
    i++;
  }
}

// Load design/sections.json
let designData;
try {
  const designPath = path.join(projectRoot, 'design', 'sections.json');
  designData = JSON.parse(fs.readFileSync(designPath, 'utf-8'));
} catch (e) {
  console.error('Error loading design/sections.json:', e.message);
  process.exit(1);
}

// Build height map
const heightMap = new Map();
designData.forEach(section => {
  heightMap.set(section.id, {
    desktopHeight: section.desktopHeight,
    mobileHeight: section.mobileHeight
  });
});

// Use all sections if none specified
if (!sections) {
  sections = ['hero', 'transactions', 'features', 'habits', 'pricing', 'faq', 'footer'];
}

// Validate sections
const allSectionIds = Array.from(heightMap.keys());
for (const section of sections) {
  if (!heightMap.has(section)) {
    console.error(`Error: Unknown section "${section}". Available: ${allSectionIds.join(', ')}`);
    process.exit(1);
  }
}

// Check if Chromium is installed (skip this check as playwright will launch it)
function checkChromium() {
  // Playwright will handle launching chromium if it's available
  // This check is mainly to give a better error message
}

// Simpler port check using http
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
    // Node emits 'timeout' but does NOT destroy the socket on its own, so
    // without this handler neither 'error' nor the response callback ever
    // fires against something that completes the TCP handshake and then
    // goes silent -- the promise never settles and waitForPort spins
    // forever. dev-smoke.mjs has always had this; this did not.
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });
}

// Wait for port to be ready
async function waitForPort(port, timeout = 30000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (await checkPort(port)) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  return false;
}

let serverProcess = null;
let baseUrl = customUrl;

// Normalize file:// URLs for proper file path handling
if (baseUrl && baseUrl.startsWith('file://')) {
  // Extract the path part after file://
  let filePath = baseUrl.replace(/^file:\/\//, '');

  // On Windows, Git Bash returns /d/... paths that need to be converted
  // Convert /d/Orbix to D:/Orbix (Windows format)
  if (process.platform === 'win32' && filePath.match(/^\/[a-z]\//i)) {
    const drive = filePath[1].toUpperCase();
    filePath = drive + ':' + filePath.substring(2);
  }

  // Convert to proper file:// URL with encoding
  // Use path.resolve to get absolute path, then convert to file URL
  const absolutePath = path.resolve(filePath);
  baseUrl = new URL(`file://${absolutePath}`).href;
}

async function startServer() {
  if (customUrl) {
    console.log(`Using custom URL: ${customUrl}`);
    return;
  }

  const port = Number(process.env.MEASURE_PORT || 3017);

  // Check if port is already in use
  if (await checkPort(port)) {
    console.error(`Error: port ${port} occupied by a server this script did not start`);
    process.exit(1);
  }

  console.log(`Starting server on port ${port}...`);

  // shell:true is required on Windows: spawn('npm', ...) hits ENOENT because npm
  // is npm.cmd, not an executable. Invoke next directly so the port override is not
  // fighting the -p already baked into the `start` script.
  serverProcess = spawn('npx', ['next', 'start', '-p', String(port)], {
    cwd: projectRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32'
  });

  // Wait for server to be ready
  const ready = await waitForPort(port);
  if (!ready) {
    console.error('Error: Server failed to start within timeout');
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
    }
    process.exit(1);
  }

  baseUrl = `http://localhost:${port}`;
  console.log(`Server ready at ${baseUrl}`);
}

function killServer() {
  if (!serverProcess) return;

  if (process.platform === 'win32') {
    // On Windows, use taskkill to kill process tree
    try {
      spawnSync('taskkill', ['/F', '/T', '/PID', serverProcess.pid.toString()], {
        stdio: 'ignore'
      });
    } catch (e) {
      // Ignore errors
    }
  } else {
    // On Unix, use SIGTERM
    serverProcess.kill('SIGTERM');
  }
}

async function measureSections() {
  checkChromium();

  await startServer();

  let browser;
  const results = [];
  const consoleErrors = [];
  let passed = true;

  try {
    browser = await /* Contexts request reduced motion: the page's scroll reveals start at
   opacity 0 under html[data-motion="on"], so without it a harness
   captures a half-faded page. MotionRoot honours the preference by
   never hiding anything, which makes measurement deterministic. */
    chromium.launch({ headless: true });

    // Desktop viewport: 1440x900
    if (!overflowOnly) {
      console.log('\nMeasuring at 1440x900 (desktop)...');
      const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
      const desktopPage = await desktopContext.newPage();

      desktopPage.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(`Desktop (1440x900): ${msg.text()}`);
        }
      });

      const waitUntil = baseUrl.startsWith('file://') ? 'domcontentloaded' : 'networkidle';
      await desktopPage.goto(baseUrl, { waitUntil, timeout: 30000 });

      // Wait for fonts and images, and REPORT what did not settle.
      //
      // This used to await img.decode() with `.catch(() => {})`. decode()
      // rejects when an image failed to load (404, corrupt file), so the
      // catch converted the one available signal that a referenced asset is
      // missing into silence -- and next/image reserves the box from
      // width/height, so the height never moved and the tolerance gate
      // stayed green. decode() also does not reliably settle for an <img>
      // pointing at an SVG in Chromium (57 of this page's 73 images are
      // SVGs), so it cannot be asserted on either. complete + naturalWidth
      // is reliable here and strictly stronger: a missing or corrupt file
      // reports complete === true with naturalWidth === 0.
      const desktopStalled = await desktopPage.evaluate(async () => {
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
          // A lazy img below the fold has not been asked to load yet.
          // Chromium still sets currentSrc on it, so being on screen -- not
          // currentSrc -- is what distinguishes "in flight" from "deferred".
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
      if (desktopStalled.length > 0) {
        console.error(`
FAIL: page did not settle at desktop viewport:`);
        for (const problem of desktopStalled) console.error(`  ${problem}`);
        process.exitCode = 1;
      }

      for (const sectionId of sections) {
        const selector = `[data-section="${sectionId}"]`;
        const element = await desktopPage.$(selector);

        if (element) {
          const bbox = await element.boundingBox();
          const height = Math.round(bbox.height);
          const expected = heightMap.get(sectionId).desktopHeight;
          const delta = ((height - expected) / expected * 100).toFixed(2);
          const deltaAbs = Math.abs(parseFloat(delta));
          const status = deltaAbs <= 2 ? 'PASS' : 'FAIL';

          results.push({
            section: sectionId,
            viewport: '1440x900',
            measured: height,
            expected,
            delta: `${delta}%`,
            status
          });

          if (status === 'FAIL') {
            passed = false;
          }
        } else {
          results.push({
            section: sectionId,
            viewport: '1440x900',
            measured: 'NOT FOUND',
            expected: heightMap.get(sectionId).desktopHeight,
            delta: 'N/A',
            status: 'FAIL'
          });
          passed = false;
        }
      }

      await desktopContext.close();
    }

    // Mobile viewport: 393x852
    if (!overflowOnly) {
      console.log('Measuring at 393x852 (mobile)...');
      const mobileContext = await browser.newContext({ viewport: { width: 393, height: 852 }, reducedMotion: 'reduce' });
      const mobilePage = await mobileContext.newPage();

      mobilePage.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(`Mobile (393x852): ${msg.text()}`);
        }
      });

      const waitUntilMobile = baseUrl.startsWith('file://') ? 'domcontentloaded' : 'networkidle';
      await mobilePage.goto(baseUrl, { waitUntil: waitUntilMobile, timeout: 30000 });

      // Wait for fonts and images, and REPORT what did not settle.
      //
      // This used to await img.decode() with `.catch(() => {})`. decode()
      // rejects when an image failed to load (404, corrupt file), so the
      // catch converted the one available signal that a referenced asset is
      // missing into silence -- and next/image reserves the box from
      // width/height, so the height never moved and the tolerance gate
      // stayed green. decode() also does not reliably settle for an <img>
      // pointing at an SVG in Chromium (57 of this page's 73 images are
      // SVGs), so it cannot be asserted on either. complete + naturalWidth
      // is reliable here and strictly stronger: a missing or corrupt file
      // reports complete === true with naturalWidth === 0.
      const mobileStalled = await mobilePage.evaluate(async () => {
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
          // A lazy img below the fold has not been asked to load yet.
          // Chromium still sets currentSrc on it, so being on screen -- not
          // currentSrc -- is what distinguishes "in flight" from "deferred".
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
      if (mobileStalled.length > 0) {
        console.error(`
FAIL: page did not settle at mobile viewport:`);
        for (const problem of mobileStalled) console.error(`  ${problem}`);
        process.exitCode = 1;
      }

      for (const sectionId of sections) {
        const selector = `[data-section="${sectionId}"]`;
        const element = await mobilePage.$(selector);

        if (element) {
          const bbox = await element.boundingBox();
          const height = Math.round(bbox.height);
          const expected = heightMap.get(sectionId).mobileHeight;
          const delta = ((height - expected) / expected * 100).toFixed(2);
          const deltaAbs = Math.abs(parseFloat(delta));
          const status = deltaAbs <= 2 ? 'PASS' : 'FAIL';

          results.push({
            section: sectionId,
            viewport: '393x852',
            measured: height,
            expected,
            delta: `${delta}%`,
            status
          });

          if (status === 'FAIL') {
            passed = false;
          }
        } else {
          results.push({
            section: sectionId,
            viewport: '393x852',
            measured: 'NOT FOUND',
            expected: heightMap.get(sectionId).mobileHeight,
            delta: 'N/A',
            status: 'FAIL'
          });
          passed = false;
        }
      }

      await mobileContext.close();
    }

    // Overflow test at various viewports
    console.log('Testing overflow at viewports: 320, 393, 768, 1024, 1440, 1920...');
    const overflowViewports = [320, 393, 768, 1024, 1440, 1920];

    for (const width of overflowViewports) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      const page = await context.newPage();

      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(`Overflow (${width}px): ${msg.text()}`);
        }
      });

      const waitUntilOverflow = baseUrl.startsWith('file://') ? 'domcontentloaded' : 'networkidle';
      await page.goto(baseUrl, { waitUntil: waitUntilOverflow, timeout: 30000 });

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const innerWidth = await page.evaluate(() => window.innerWidth);

      if (scrollWidth > innerWidth) {
        console.log(`  ${width}px: scrollWidth ${scrollWidth} > innerWidth ${innerWidth} - FAIL`);
        passed = false;
      } else {
        console.log(`  ${width}px: OK (scrollWidth ${scrollWidth} <= innerWidth ${innerWidth})`);
      }

      await context.close();
    }

  } finally {
    if (browser) {
      await browser.close();
    }
    killServer();
  }

  // Print results table
  if (!overflowOnly && results.length > 0) {
    console.log('\n=== Measurement Results ===\n');
    console.log('Section      | Viewport  | Measured | Expected | Delta    | Status');
    console.log('-------------|-----------|----------|----------|----------|-------');

    for (const result of results) {
      const section = result.section.padEnd(12);
      const viewport = result.viewport.padEnd(9);
      const measured = String(result.measured).padEnd(8);
      const expected = String(result.expected).padEnd(8);
      const delta = String(result.delta).padEnd(8);
      const status = result.status;

      console.log(`${section} | ${viewport} | ${measured} | ${expected} | ${delta} | ${status}`);
    }
  }

  // Print console errors
  if (consoleErrors.length > 0) {
    console.log('\n=== Console Errors ===\n');
    for (const error of consoleErrors) {
      console.log(`  ${error}`);
    }
    passed = false;
  }

  return passed;
}

// Run the measurement
try {
  const success = await measureSections();
  process.exit(success ? 0 : 1);
} catch (e) {
  console.error('Error during measurement:', e.message);
  killServer();
  process.exit(1);
}
