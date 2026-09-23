#!/usr/bin/env node
// Runs Lighthouse twice against the production server with EXPLICIT
// screenEmulation for both designed widths. Lighthouse's own defaults
// (412x823 mobile, 1350x940 desktop) audit neither 393x852 nor 1440x900, so
// leaving screenEmulation unset would silently test the wrong viewport.

import fs from "fs";
import path from "path";
import http from "http";
import { spawn, spawnSync } from "child_process";
import { fileURLToPath } from "url";
import { chromium } from "@playwright/test";
import { launch as launchChrome } from "chrome-launcher";
import lighthouse from "lighthouse";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const PORT = Number(process.env.LIGHTHOUSE_PORT || 3017);
const URL_UNDER_TEST = `http://localhost:${PORT}/`;
const REPORTS_DIR = path.join(projectRoot, "reports");

const ACCESSIBILITY_MIN_SCORE = 95;
const CLS_MAX = 0.1;

const RUNS = [
  {
    label: "mobile-393x852",
    formFactor: "mobile",
    screenEmulation: { width: 393, height: 852, mobile: true, deviceScaleFactor: 3, disabled: false },
  },
  {
    label: "desktop-1440x900",
    formFactor: "desktop",
    screenEmulation: { width: 1440, height: 900, mobile: false, deviceScaleFactor: 1, disabled: false },
  },
];

function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.request({ hostname: "localhost", port, method: "GET", timeout: 1000 }, (res) => {
      res.resume();
      resolve(true);
    });
    req.on("error", () => resolve(false));
    // Without a 'timeout' handler Node emits the event but leaves the socket
    // open, so nothing ever settles this promise against a host that accepts
    // the connection and then goes silent, and waitForPort hangs forever.
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
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
  // shell:true is required on Windows -- npm resolves to npm.cmd, which
  // child_process.spawn will not find without a shell (see scripts/measure.mjs).
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
  console.log(`Server ready at ${URL_UNDER_TEST}`);
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

async function runOne(chromePort, run) {
  console.log(`\nRunning Lighthouse (${run.label})...`);

  const result = await lighthouse(
    URL_UNDER_TEST,
    {
      port: chromePort,
      output: "json",
      logLevel: "error",
      onlyCategories: ["accessibility", "performance"],
    },
    {
      extends: "lighthouse:default",
      settings: {
        formFactor: run.formFactor,
        screenEmulation: run.screenEmulation,
      },
    },
  );

  if (!result || !result.lhr) {
    throw new Error(`Lighthouse produced no result for ${run.label}`);
  }

  const { lhr } = result;
  const accessibilityScore = Math.round((lhr.categories.accessibility?.score ?? 0) * 100);
  const cls = lhr.audits["cumulative-layout-shift"]?.numericValue ?? null;

  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const reportPath = path.join(REPORTS_DIR, `lighthouse-${run.label}.json`);
  fs.writeFileSync(reportPath, result.report);

  const accessibilityPass = accessibilityScore >= ACCESSIBILITY_MIN_SCORE;
  const clsPass = cls !== null && cls < CLS_MAX;

  console.log(`  accessibility: ${accessibilityScore} (>= ${ACCESSIBILITY_MIN_SCORE} required) - ${accessibilityPass ? "PASS" : "FAIL"}`);
  console.log(`  CLS: ${cls} (< ${CLS_MAX} required) - ${clsPass ? "PASS" : "FAIL"}`);
  console.log(`  report written to ${reportPath}`);

  return { label: run.label, accessibilityScore, cls, accessibilityPass, clsPass, reportPath };
}

async function main() {
  await startServer();

  let chrome;
  const summary = [];
  let allPassed = true;

  try {
    chrome = await launchChrome({
      chromePath: chromium.executablePath(),
      chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu"],
    });

    for (const run of RUNS) {
      const row = await runOne(chrome.port, run);
      summary.push(row);
      if (!row.accessibilityPass || !row.clsPass) allPassed = false;
    }
  } finally {
    if (chrome) await chrome.kill();
    killServer();
  }

  console.log("\n=== Lighthouse Summary ===");
  console.log("Run               | Accessibility | CLS");
  console.log("------------------|----------------|-------");
  for (const row of summary) {
    console.log(
      `${row.label.padEnd(18)}| ${String(row.accessibilityScore).padEnd(15)}| ${row.cls}`,
    );
  }

  if (!allPassed) {
    console.error("\nLighthouse gate FAILED");
    process.exit(1);
  }
  console.log("\nLighthouse gate PASSED");
}

main().catch((err) => {
  console.error("Error running Lighthouse:", err);
  killServer();
  process.exit(1);
});
