#!/usr/bin/env node
// Dev-server smoke test (T12, definition-of-done item 2).
//
// This exercises `next dev` specifically -- everything else in the plan
// (measure.mjs, lighthouse.mjs, tests/) exercises `next start`, the
// production server. Nothing here is a substitute for those; it only proves
// the dev server boots, serves all seven sections, and serves every
// committed asset.
//
// Run with: node scripts/dev-smoke.mjs  (or: npm run verify:dev)

import fs from 'fs';
import path from 'path';
import { spawn, spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import http from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const PORT = Number(process.env.DEV_SMOKE_PORT || 3017);
const SECTIONS = ['hero', 'transactions', 'features', 'habits', 'pricing', 'faq', 'footer'];
const READY_TIMEOUT_MS = 60000;
const PAGE_FETCH_TIMEOUT_MS = 60000; // first request can block on a cold Turbopack compile
const ASSET_FETCH_TIMEOUT_MS = 10000;
const ASSET_CONCURRENCY = 10;

// Simple TCP/HTTP reachability probe -- true once *something* answers on the port.
function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.request({ hostname: 'localhost', port, method: 'GET', timeout: 1000 }, (res) => {
      res.resume();
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });
}

async function waitForPort(port, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await checkPort(port)) return true;
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

let serverProcess = null;

function killServer() {
  if (!serverProcess || serverProcess.killed) return;
  if (process.platform === 'win32') {
    // /F (force) matters: without it the inner `next` process survives the
    // shell wrapper and keeps holding the port, poisoning the next run.
    try {
      spawnSync('taskkill', ['/F', '/T', '/PID', serverProcess.pid.toString()], { stdio: 'ignore' });
    } catch {
      // best-effort
    }
  } else {
    serverProcess.kill('SIGTERM');
  }
  serverProcess = null;
}

async function withConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  async function run() {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

async function main() {
  // --- port preflight -----------------------------------------------------
  // Connecting to a stale server already on the port is how a false pass
  // happens: we'd measure whatever was left running, not this checkout.
  if (await checkPort(PORT)) {
    console.error(
      `FAIL: port ${PORT} is already occupied by a server this script did not start. ` +
        `Stop it first, or set DEV_SMOKE_PORT to a free port.`
    );
    process.exit(1);
  }

  let failed = false;

  // --- spawn `next dev` directly ------------------------------------------
  // spawn('npm', ...) hits ENOENT on Windows because npm is npm.cmd, not an
  // executable; shell: true on win32 (as scripts/measure.mjs does for `next
  // start`) fixes that. Spawning `next dev` directly (rather than `npm run
  // dev`) also lets DEV_SMOKE_PORT override the port baked into the `dev`
  // script.
  console.log(`Starting dev server on port ${PORT}...`);
  serverProcess = spawn('npx', ['next', 'dev', '-p', String(PORT)], {
    cwd: projectRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32'
  });

  serverProcess.on('error', (err) => {
    console.error('FAIL: failed to spawn dev server:', err.message);
  });

  try {
    const ready = await waitForPort(PORT, READY_TIMEOUT_MS);
    if (!ready) {
      console.error(`FAIL: dev server did not start listening on port ${PORT} within ${READY_TIMEOUT_MS}ms`);
      process.exit(1);
    }
    console.log(`Dev server listening on port ${PORT}.`);

    const baseUrl = `http://localhost:${PORT}`;

    // --- fetch the page and assert all seven sections are present --------
    console.log('Fetching / and checking for all seven data-section elements...');
    let html;
    try {
      const res = await fetchWithTimeout(`${baseUrl}/`, PAGE_FETCH_TIMEOUT_MS);
      if (!res.ok) {
        console.error(`FAIL: GET / returned HTTP ${res.status}`);
        failed = true;
      }
      html = await res.text();
    } catch (e) {
      console.error(`FAIL: GET / did not respond within ${PAGE_FETCH_TIMEOUT_MS}ms:`, e.message);
      process.exit(1);
    }

    for (const id of SECTIONS) {
      const present = html.includes(`data-section="${id}"`);
      console.log(`  ${id}: ${present ? 'present' : 'MISSING'}`);
      if (!present) failed = true;
    }

    // --- assert every manifest asset returns 200 --------------------------
    const manifestPath = path.join(projectRoot, 'public', 'assets', 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      console.error(`FAIL: ${manifestPath} does not exist`);
      failed = true;
    } else {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      console.log(`Checking ${manifest.length} assets from public/assets/manifest.json...`);

      const results = await withConcurrency(manifest, ASSET_CONCURRENCY, async (rec) => {
        // localPath is repo-relative, e.g. "public/assets/<sha256>.svg"; public/
        // is served at the site root, so strip that one leading segment.
        const urlPath = '/' + path.relative('public', rec.localPath).split(path.sep).join('/');
        const url = `${baseUrl}${urlPath}`;
        try {
          const res = await fetchWithTimeout(url, ASSET_FETCH_TIMEOUT_MS);
          res.body?.cancel?.();
          return { url, ok: res.status === 200, status: res.status };
        } catch (e) {
          return { url, ok: false, status: `error: ${e.message}` };
        }
      });

      const badAssets = results.filter((r) => !r.ok);
      if (badAssets.length > 0) {
        for (const r of badAssets) {
          console.error(`  FAIL: ${r.url} -> ${r.status}`);
        }
        failed = true;
      } else {
        console.log(`  all ${results.length} assets returned HTTP 200`);
      }
    }
  } finally {
    console.log('Stopping dev server (own process tree only)...');
    killServer();
  }

  if (failed) {
    console.error('\ndev-smoke: FAILED');
    process.exit(1);
  }
  console.log('\ndev-smoke: all checks passed');
  process.exit(0);
}

main().catch((e) => {
  console.error('dev-smoke: unexpected error:', e);
  killServer();
  process.exit(1);
});
