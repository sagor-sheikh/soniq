#!/usr/bin/env node
// Verifies the raw Figma design extraction in design/ (T2).
// Run with: npm run verify:design
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const RAW_DIR = path.join(ROOT, "design/raw");
const REF_DIR = path.join(ROOT, "design/ref");
const SECTIONS_PATH = path.join(ROOT, "design/sections.json");

const FORBIDDEN_IDS = ["2655:706", "2655:707", "2665:311"];

// nodeId -> expected {width, height}, from tasks.json figma.sections (7 desktop + 7 mobile).
const EXPECTED_SIZE = {
  "2655:708": { w: 1440, h: 1923 },
  "2672:686": { w: 393, h: 1951 },
  "2665:459": { w: 1440, h: 1326 },
  "2676:988": { w: 393, h: 1841 },
  "2655:959": { w: 1440, h: 1238 },
  "2676:1004": { w: 393, h: 849 },
  "2655:978": { w: 1440, h: 956 },
  "2676:1010": { w: 393, h: 1042 },
  "2655:1039": { w: 1440, h: 933 },
  "2676:1141": { w: 393, h: 1370 },
  "2655:1110": { w: 1440, h: 859 },
  "2677:1262": { w: 393, h: 868 },
  "2655:1159": { w: 1440, h: 554 },
  "2677:1369": { w: 393, h: 550 },
};

let failures = 0;
function fail(msg) {
  failures++;
  console.error("FAIL:", msg);
}
function ok(msg) {
  console.log("ok:", msg);
}

// --- 1. exactly 14 raw files ---
const rawFiles = fs.existsSync(RAW_DIR) ? fs.readdirSync(RAW_DIR).filter((f) => f.endsWith(".md")) : [];
if (rawFiles.length === 14) ok(`14 raw context files present`);
else fail(`expected 14 raw files, found ${rawFiles.length}`);

// --- 2. no forbidden node ids anywhere under design/ (text files only) ---
function walkTextFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkTextFiles(p));
    else if (/\.(md|json)$/.test(entry.name)) out.push(p);
  }
  return out;
}
const designTextFiles = fs.existsSync(path.join(ROOT, "design")) ? walkTextFiles(path.join(ROOT, "design")) : [];
let forbiddenHit = null;
for (const f of designTextFiles) {
  const text = fs.readFileSync(f, "utf8");
  for (const id of FORBIDDEN_IDS) {
    if (text.includes(id)) {
      forbiddenHit = `${id} found in ${path.relative(ROOT, f)}`;
      break;
    }
  }
  if (forbiddenHit) break;
}
if (forbiddenHit) fail(`forbidden node id leaked: ${forbiddenHit}`);
else ok("no forbidden node ids (2655:706, 2655:707, 2665:311) under design/");

// --- 3. each raw context's root frame size matches the table ---
for (const [nodeId, size] of Object.entries(EXPECTED_SIZE)) {
  const filename = nodeId.replace(":", "-") + ".md";
  const p = path.join(RAW_DIR, filename);
  if (!fs.existsSync(p)) {
    fail(`missing raw file for node ${nodeId}: ${filename}`);
    continue;
  }
  const text = fs.readFileSync(p, "utf8");
  const needle = `size ${size.w} x ${size.h}`;
  if (text.includes(needle)) ok(`${filename} root frame recorded as ${size.w}x${size.h}`);
  else fail(`${filename} does not record expected root frame size "${needle}"`);
}

// --- 4. each design/ref PNG is a valid PNG ---
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const refFiles = fs.existsSync(REF_DIR) ? fs.readdirSync(REF_DIR).filter((f) => f.endsWith(".png")) : [];
if (refFiles.length === 14) ok("14 ref screenshots present");
else fail(`expected 14 ref PNGs, found ${refFiles.length}`);
for (const f of refFiles) {
  const buf = fs.readFileSync(path.join(REF_DIR, f));
  if (buf.length >= 8 && buf.subarray(0, 8).equals(PNG_MAGIC)) ok(`${f} is a valid PNG`);
  else fail(`${f} is not a valid PNG (bad magic bytes)`);
}

// --- 5. both stale headings overridden in sections.json ---
if (!fs.existsSync(SECTIONS_PATH)) {
  fail("design/sections.json missing");
} else {
  const sections = JSON.parse(fs.readFileSync(SECTIONS_PATH, "utf8"));
  const habits = sections.find((s) => s.id === "habits");
  const faq = sections.find((s) => s.id === "faq");
  const HABITS_EXPECTED = "Build Better Financial Habits With Soniq";
  const FAQ_EXPECTED = "Questions About Managing Money With Soniq?";

  if (habits?.copy?.mobileHeadingOverride === HABITS_EXPECTED) ok("habits mobile heading overridden with desktop copy");
  else fail(`habits.copy.mobileHeadingOverride is not "${HABITS_EXPECTED}"`);

  if (faq?.copy?.mobileHeadingOverride === FAQ_EXPECTED) ok("faq mobile heading overridden with desktop copy");
  else fail(`faq.copy.mobileHeadingOverride is not "${FAQ_EXPECTED}"`);

  if (habits?.copy?.mobileHeadingRawAsExtracted === "See Every Transaction In One Place")
    ok("habits raw stale heading recorded for audit trail");
  else fail("habits.copy.mobileHeadingRawAsExtracted missing/incorrect");

  if (faq?.copy?.mobileHeadingRawAsExtracted === "See Every Transaction In One Place")
    ok("faq raw stale heading recorded for audit trail");
  else fail("faq.copy.mobileHeadingRawAsExtracted missing/incorrect");
}

// The 14 heights live in four places: design/sections.json, src/lib/sections.ts,
// EXPECTED_SIZE above, and tasks.json. Nothing used to compare any pair, and
// sections.ts's own sum invariant is permutation-invariant -- swapping faq's
// 859 with footer's 554 keeps the total at 7789 and passes. sections.ts also
// says "Generated from design/sections.json -- do not hand-edit" with nothing
// enforcing it. This ties each section's numbers POSITIONALLY to EXPECTED_SIZE,
// which the raw-markdown check above already validates against design/raw.
{
  const tsPath = path.join(ROOT, "src/lib/sections.ts");
  const ts = fs.readFileSync(tsPath, "utf-8");
  const entryPattern =
    /id:\s*"([^"]+)",\s*desktopNodeId:\s*"([^"]+)",\s*mobileNodeId:\s*"([^"]+)",\s*desktopHeight:\s*(\d+),\s*mobileHeight:\s*(\d+)/g;

  const entries = [...ts.matchAll(entryPattern)].map((m) => ({
    id: m[1],
    desktopNodeId: m[2],
    mobileNodeId: m[3],
    desktopHeight: Number(m[4]),
    mobileHeight: Number(m[5]),
  }));

  if (entries.length !== 7) {
    fail(`src/lib/sections.ts: parsed ${entries.length} section entries, expected 7`);
  } else {
    ok("src/lib/sections.ts declares 7 section entries");
  }

  for (const entry of entries) {
    const desktop = EXPECTED_SIZE[entry.desktopNodeId];
    const mobile = EXPECTED_SIZE[entry.mobileNodeId];

    if (!desktop) {
      fail(`sections.ts ${entry.id}: desktopNodeId ${entry.desktopNodeId} is not a known node`);
    } else if (desktop.h !== entry.desktopHeight) {
      fail(
        `sections.ts ${entry.id}: desktopHeight ${entry.desktopHeight} != ${desktop.h} recorded for node ${entry.desktopNodeId}`,
      );
    }

    if (!mobile) {
      fail(`sections.ts ${entry.id}: mobileNodeId ${entry.mobileNodeId} is not a known node`);
    } else if (mobile.h !== entry.mobileHeight) {
      fail(
        `sections.ts ${entry.id}: mobileHeight ${entry.mobileHeight} != ${mobile.h} recorded for node ${entry.mobileNodeId}`,
      );
    }
  }

  if (entries.length === 7) {
    ok("every sections.ts height matches the node size recorded from design/raw");
  }
}

console.log("");
if (failures > 0) {
  console.error(`check-design: ${failures} failure(s)`);
  process.exit(1);
} else {
  console.log("check-design: all checks passed");
}
