#!/usr/bin/env node
// Verifies public/assets/* against design/sections.json (T2).
// Run with: npm run verify:assets
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SECTIONS_PATH = path.join(ROOT, "design/sections.json");
const MANIFEST_PATH = path.join(ROOT, "public/assets/manifest.json");
const RAW_DIR = path.join(ROOT, "design/raw");
const SRC_DIR = path.join(ROOT, "src");

let failures = 0;
function fail(msg) {
  failures++;
  console.error("FAIL:", msg);
}
function ok(msg) {
  console.log("ok:", msg);
}

function sha256Of(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function walkFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(p));
    else out.push(p);
  }
  return out;
}

if (!fs.existsSync(SECTIONS_PATH)) {
  fail("design/sections.json missing");
  process.exit(1);
}
if (!fs.existsSync(MANIFEST_PATH)) {
  fail("public/assets/manifest.json missing");
  process.exit(1);
}

const sections = JSON.parse(fs.readFileSync(SECTIONS_PATH, "utf8"));
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));

// --- 1. every image/vector node id in sections.json maps to an existing, non-empty file
//        whose sha256 matches ---
let assetRefCount = 0;
for (const section of sections) {
  const assets = section.assets || [];
  for (const a of assets) {
    assetRefCount++;
    const abs = path.join(ROOT, a.localPath);
    if (!fs.existsSync(abs)) {
      fail(`${section.id} node ${a.nodeId}: localPath does not exist on disk: ${a.localPath}`);
      continue;
    }
    const buf = fs.readFileSync(abs);
    if (buf.length === 0) {
      fail(`${section.id} node ${a.nodeId}: file is empty: ${a.localPath}`);
      continue;
    }
    const actualSha = sha256Of(buf);
    if (actualSha !== a.sha256) {
      fail(`${section.id} node ${a.nodeId}: sha256 mismatch for ${a.localPath} (recorded ${a.sha256}, actual ${actualSha})`);
      continue;
    }
    // filename itself should also encode the sha256 (public/assets/<sha256>.<ext>)
    const base = path.basename(a.localPath, path.extname(a.localPath));
    if (base !== a.sha256) {
      fail(`${section.id} node ${a.nodeId}: localPath filename does not match its sha256: ${a.localPath}`);
    }
  }
}
if (failures === 0) ok(`${assetRefCount} sections.json asset references resolve to matching, non-empty files`);

// --- 2. no manifest localPath points off-disk ---
let manifestOk = true;
for (const rec of manifest) {
  const abs = path.join(ROOT, rec.localPath);
  if (!abs.startsWith(ROOT)) {
    fail(`manifest entry escapes project root: ${rec.localPath}`);
    manifestOk = false;
    continue;
  }
  if (!fs.existsSync(abs)) {
    fail(`manifest localPath missing on disk: ${rec.localPath}`);
    manifestOk = false;
    continue;
  }
  const buf = fs.readFileSync(abs);
  if (buf.length === 0) {
    fail(`manifest localPath is empty: ${rec.localPath}`);
    manifestOk = false;
    continue;
  }
  const actualSha = sha256Of(buf);
  if (actualSha !== rec.sha256) {
    fail(`manifest sha256 mismatch for ${rec.localPath}`);
    manifestOk = false;
  }
}
if (manifestOk) ok(`${manifest.length} manifest.json entries all resolve on disk with matching sha256`);

// --- 3. no figma.com URL survives in src/ or public/assets/manifest.json ---
const manifestText = fs.readFileSync(MANIFEST_PATH, "utf8");
if (manifestText.includes("figma.com")) fail("public/assets/manifest.json still contains a figma.com URL");
else ok("public/assets/manifest.json contains no figma.com URLs");

const srcFiles = walkFiles(SRC_DIR).filter((f) => /\.(ts|tsx|js|jsx|css|json|md)$/.test(f));
let srcLeak = null;
for (const f of srcFiles) {
  const text = fs.readFileSync(f, "utf8");
  if (text.includes("figma.com")) {
    srcLeak = path.relative(ROOT, f);
    break;
  }
}
if (srcLeak) fail(`figma.com URL leaked into ${srcLeak}`);
else ok("no figma.com URLs in src/");

// --- 4. PRINT (do not fail on) every raster whose pixel width is below 2x its largest
//        rendered width. "Largest rendered width" is read from the raw design context's
//        CSS near each node-id usage (w-[Npx] / size-[Npx] / width="N").
function largestRenderedWidthForNodeId(nodeId) {
  let best = 0;
  const files = fs.existsSync(RAW_DIR) ? fs.readdirSync(RAW_DIR).filter((f) => f.endsWith(".md")) : [];
  for (const f of files) {
    const text = fs.readFileSync(path.join(RAW_DIR, f), "utf8");
    const idx = text.indexOf(`data-node-id="${nodeId}"`);
    if (idx === -1) continue;
    // look at a window around the node-id declaration (its own tag + the next line, which
    // is typically the <img> it wraps) for explicit pixel widths.
    const windowText = text.slice(Math.max(0, idx - 300), idx + 300);
    const patterns = [/w-\[([\d.]+)px\]/g, /size-\[([\d.]+)px\]/g, /width="([\d.]+)"/g];
    for (const re of patterns) {
      let m;
      while ((m = re.exec(windowText))) {
        const v = parseFloat(m[1]);
        if (v > best) best = v;
      }
    }
  }
  return best;
}

console.log("");
console.log("Rasters below 2x their largest rendered width (informational, not a failure):");
let belowCount = 0;
for (const rec of manifest) {
  if (rec.kind !== "image") continue;
  let maxRendered = 0;
  for (const nodeId of rec.nodeIds) {
    const w = largestRenderedWidthForNodeId(nodeId);
    if (w > maxRendered) maxRendered = w;
  }
  if (maxRendered > 0 && rec.width < maxRendered * 2) {
    belowCount++;
    console.log(
      `  ${rec.localPath}: actual ${rec.width}px < 2x largest rendered width ${maxRendered}px (needs ${
        maxRendered * 2
      }px for crisp 2x)`
    );
  }
}
if (belowCount === 0) console.log("  (none)");

console.log("");
if (failures > 0) {
  console.error(`check-assets: ${failures} failure(s)`);
  process.exit(1);
} else {
  console.log("check-assets: all checks passed");
}
