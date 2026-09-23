#!/usr/bin/env node
// For each of the seven sections, screenshots the built section at 1440 and
// writes it alongside the committed design/ref/<desktopNodeId>.png into
// scripts/out/ as a side-by-side HTML page, for human visual judgement.
// This script does NOT assert anything about visual parity.

import fs from "fs";
import path from "path";
import http from "http";
import { spawn, spawnSync } from "child_process";
import { fileURLToPath } from "url";
import { chromium } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const PORT = Number(process.env.OVERLAY_PORT || 3017);
const BASE_URL = `http://localhost:${PORT}/`;
const OUT_DIR = path.join(projectRoot, "scripts", "out");
const REF_DIR = path.join(projectRoot, "design", "ref");

function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.request({ hostname: "localhost", port, method: "GET", timeout: 1000 }, () => resolve(true));
    req.on("error", () => resolve(false));
    req.end();
  });
}

async function waitForPort(port, timeout = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await checkPort(port)) return true;
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

let serverProcess = null;

async function startServer() {
  if (await checkPort(PORT)) {
    console.error(`Error: port ${PORT} occupied by a server this script did not start`);
    process.exit(1);
  }
  console.log(`Starting production server on port ${PORT}...`);
  serverProcess = spawn("npx", ["next", "start", "-p", String(PORT)], {
    cwd: projectRoot,
    stdio: ["ignore", "pipe", "pipe"],
    shell: process.platform === "win32",
  });
  const ready = await waitForPort(PORT);
  if (!ready) {
    console.error("Error: server failed to start within timeout");
    killServer();
    process.exit(1);
  }
  console.log(`Server ready at ${BASE_URL}`);
}

function killServer() {
  if (!serverProcess) return;
  if (process.platform === "win32") {
    try {
      spawnSync("taskkill", ["/F", "/T", "/PID", serverProcess.pid.toString()], { stdio: "ignore" });
    } catch {
      // ignore
    }
  } else {
    serverProcess.kill("SIGTERM");
  }
  serverProcess = null;
}

// Copied from scripts/measure.mjs: a next/image lazy img below the fold
// never starts loading, so img.decode() stays pending forever. Skip images
// with nothing in flight and cap every wait.
async function waitForLoadSettled(page) {
  await page.evaluate(() => {
    const cap = (p, ms) => Promise.race([p, new Promise((r) => setTimeout(r, ms))]);
    return cap(
      Promise.all([
        document.fonts.ready,
        ...Array.from(document.querySelectorAll("img")).map((img) => {
          if (!img.complete && !img.currentSrc) return Promise.resolve();
          return img.decode ? cap(img.decode().catch(() => {}), 3000) : Promise.resolve();
        }),
      ]),
      15000,
    );
  });
}

function refFileFor(desktopNodeId) {
  return `${desktopNodeId.replace(":", "-")}.png`;
}

async function main() {
  const designData = JSON.parse(
    fs.readFileSync(path.join(projectRoot, "design", "sections.json"), "utf-8"),
  );

  fs.mkdirSync(OUT_DIR, { recursive: true });

  await startServer();

  let browser;
  const rows = [];

  try {
    browser = await /* Contexts request reduced motion: the page's scroll reveals start at
   opacity 0 under html[data-motion="on"], so without it a harness
   captures a half-faded page. MotionRoot honours the preference by
   never hiding anything, which makes measurement deterministic. */
    chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 30000 });
    await waitForLoadSettled(page);

    for (const section of designData) {
      const locator = page.locator(`[data-section="${section.id}"]`);
      const builtFileName = `${section.id}-built.png`;
      const builtPath = path.join(OUT_DIR, builtFileName);

      await locator.scrollIntoViewIfNeeded();
      await locator.screenshot({ path: builtPath });

      const refFileName = refFileFor(section.desktopNodeId);
      const refExists = fs.existsSync(path.join(REF_DIR, refFileName));

      rows.push({
        id: section.id,
        desktopNodeId: section.desktopNodeId,
        expectedHeight: section.desktopHeight,
        builtFileName,
        refFileName,
        refExists,
      });

      console.log(
        `  ${section.id}: built -> scripts/out/${builtFileName}, ref -> ${refExists ? `design/ref/${refFileName}` : "MISSING " + refFileName}`,
      );
    }

    await context.close();
  } finally {
    if (browser) await browser.close();
    killServer();
  }

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Soniq landing -- built vs design/ref overlay (1440)</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 0; padding: 24px; background: #111; color: #eee; }
  h1 { font-size: 18px; }
  .row { margin-bottom: 40px; border-bottom: 1px solid #333; padding-bottom: 24px; }
  .row h2 { font-size: 15px; margin: 0 0 8px; }
  .row .meta { font-size: 12px; color: #999; margin-bottom: 8px; }
  .pair { display: flex; gap: 16px; align-items: flex-start; }
  .pair figure { margin: 0; flex: 1; min-width: 0; }
  .pair figcaption { font-size: 12px; color: #999; margin-bottom: 4px; }
  .pair img { max-width: 100%; display: block; border: 1px solid #333; }
  .missing { color: #f66; font-size: 12px; }
</style>
</head>
<body>
<h1>Built sections vs design/ref -- 1440px, for human visual judgement (not asserted)</h1>
${rows
  .map(
    (row) => `<div class="row">
  <h2>${row.id}</h2>
  <div class="meta">desktopNodeId ${row.desktopNodeId} -- expected height ${row.expectedHeight}px</div>
  <div class="pair">
    <figure>
      <figcaption>design/ref/${row.refFileName}</figcaption>
      ${row.refExists ? `<img src="../../design/ref/${row.refFileName}" alt="design reference for ${row.id}" />` : `<div class="missing">missing ${row.refFileName}</div>`}
    </figure>
    <figure>
      <figcaption>built (${row.builtFileName})</figcaption>
      <img src="${row.builtFileName}" alt="built screenshot for ${row.id}" />
    </figure>
  </div>
</div>`,
  )
  .join("\n")}
</body>
</html>
`;

  fs.writeFileSync(path.join(OUT_DIR, "index.html"), html);
  console.log(`\nWrote ${rows.length} section overlays to scripts/out/index.html`);
}

main().catch((err) => {
  console.error("Error running overlay:", err);
  killServer();
  process.exit(1);
});
