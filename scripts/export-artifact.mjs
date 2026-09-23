#!/usr/bin/env node
/*
 * Post-processes a `next build` static export so it can be served from a
 * SUBPATH (a published Artifact, a docs folder, any non-root prefix), and
 * prints the exact file list to publish.
 *
 * Run it like this:
 *
 *   1. set next.config.ts to:
 *        output: "export", assetPrefix: ".", images: { unoptimized: true }
 *   2. rm -rf out && npm run build
 *   3. node scripts/export-artifact.mjs
 *   4. publish out/index.html with the printed file list
 *   5. restore next.config.ts and rebuild
 *
 * This exists because every one of the five fixes below was learned by
 * shipping it broken. Four published versions had DEAD JavaScript -- no
 * scroll reveals, no parallax, no count-ups, no background video -- and the
 * page still looked complete, because the motion layer's hidden state is
 * opt-in (nothing is hidden unless the script runs). A silent, invisible
 * failure is exactly the kind that survives four releases, so the checks at
 * the bottom now fail loudly instead.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const out = path.join(root, "out");

const REPLACEMENT_CHAR = String.fromCharCode(0xfffd);

function walk(dir) {
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...walk(full));
    else found.push(full);
  }
  return found;
}

function rewrite(file, fn) {
  const before = fs.readFileSync(file, "latin1");
  const after = fn(before);
  if (after === before) return false;
  fs.writeFileSync(file, after, "latin1");
  return true;
}

if (!fs.existsSync(path.join(out, "index.html"))) {
  console.error("FAIL: out/index.html not found. Run an export build first (see the header).");
  process.exit(1);
}

// ---------------------------------------------------------------- 1. _next
/*
 * The artifact service reserves any published path beginning with "_", so the
 * whole _next directory has to be renamed. Everything that references it has
 * to follow, including two DIFFERENT constants inside the runtime (step 2).
 */
const nextDir = path.join(out, "_next");
const staticDir = path.join(out, "next-static");
if (fs.existsSync(nextDir)) {
  fs.rmSync(staticDir, { recursive: true, force: true });
  fs.renameSync(nextDir, staticDir);
}

const chunkDir = path.join(staticDir, "static", "chunks");
const jsFiles = fs.existsSync(chunkDir)
  ? walk(chunkDir).filter((f) => f.endsWith(".js"))
  : [];
const cssFiles = fs.existsSync(chunkDir)
  ? walk(chunkDir).filter((f) => f.endsWith(".css"))
  : [];

// ------------------------------------------------- 2. the two base paths
/*
 * THE TRAP. There are two unrelated constants and they need OPPOSITE forms:
 *
 *   let t = "./_next/"            -> "./next-static/"   (relative)
 *       the Turbopack runtime's base for building chunk URLs. assetPrefix "."
 *       makes it relative, and it must stay relative.
 *
 *   pathname.indexOf("/_next/")   -> "/next-static/"    (leading slash)
 *       Next asserts its own script URL contains this and THROWS otherwise:
 *         Invariant: Expected document.currentScript src to contain '/_next/'
 *       A served URL is /<prefix>/next-static/... -- there is no "./" in a
 *       pathname, so writing "./next-static/" here makes the assert fail, the
 *       runtime throw, and hydration never happen. That is the bug that
 *       shipped four times.
 */
let runtimeFixes = 0;
for (const file of jsFiles) {
  if (
    rewrite(file, (s) =>
      s
        .replaceAll("./_next/", "./next-static/")
        .replaceAll('"/_next/"', '"/next-static/"')
        .replaceAll("'/_next/'", "'/next-static/'")
        .replaceAll("/_next/image", "/next-static/image")
        .replaceAll("/_next/", "/next-static/")
        .replaceAll('"/video/', '"./video/'),
    )
  ) {
    runtimeFixes += 1;
  }
}

// ------------------------------------------------------- 3. absolute paths
/*
 * Anything the app references from the site root breaks under a prefix.
 * public/ assets are the usual offenders: /video/... and the favicon.
 */
const icoFiles = fs.existsSync(path.join(staticDir, "static", "media"))
  ? walk(path.join(staticDir, "static", "media")).filter((f) => f.endsWith(".ico"))
  : [];
const ico = icoFiles.length ? path.basename(icoFiles[0]) : null;

rewrite(path.join(out, "index.html"), (s) => {
  let next = s.replaceAll("./_next/", "./next-static/");
  if (ico) next = next.replaceAll(`/favicon.ico?${ico}`, `./next-static/static/media/${ico}`);
  return next.replaceAll('"/video/', '"./video/').replaceAll('\\"/video/', '\\"./video/');
});

for (const file of cssFiles) {
  rewrite(file, (s) =>
    s
      .replaceAll("url(/assets/", "url(../../../assets/")
      .replaceAll("url(/video/", "url(../../../video/"),
  );
}

// ----------------------------------------------------------- 4. U+FFFD
/*
 * The artifact service rejects a file containing a literal replacement
 * character. One Next chunk legitimately contains three, inside a
 * percent-decoding polyfill where U+FFFD is the CORRECT output for malformed
 * input -- so it must be escaped, not "corrected". Inside a JS string literal
 * the escape is identical to the character.
 */
let escaped = 0;
for (const file of jsFiles) {
  const s = fs.readFileSync(file, "utf8");
  if (!s.includes(REPLACEMENT_CHAR)) continue;
  const bare = s.split(REPLACEMENT_CHAR).length - 1;
  const quoted = s.split(`"${REPLACEMENT_CHAR}"`).length - 1;
  if (bare !== quoted) {
    console.error(
      `FAIL: ${path.basename(file)} has ${bare} U+FFFD but only ${quoted} inside plain string literals; escape them by hand.`,
    );
    process.exit(1);
  }
  fs.writeFileSync(file, s.replaceAll(`"${REPLACEMENT_CHAR}"`, '"\\uFFFD"'), "utf8");
  escaped += bare;
}

// ------------------------------------------------------------- 5. verify
const textFiles = [path.join(out, "index.html"), ...jsFiles, ...cssFiles];
const problems = [];

// nothing may reference the site root any more
const absolute = /["(]\/(?:_next|assets|favicon|video)/;
for (const file of textFiles) {
  if (absolute.test(fs.readFileSync(file, "latin1"))) {
    problems.push(`absolute site-root reference left in ${path.basename(file)}`);
  }
}

// the assert constant must have kept its leading slash
const assertOk = jsFiles.some((f) =>
  fs.readFileSync(f, "latin1").includes('indexOf("/next-static/")'),
);
if (!assertOk) {
  problems.push(
    'no chunk contains indexOf("/next-static/") -- the currentScript assert will throw and hydration will die silently',
  );
}

// and no chunk may contain the form that makes it throw
for (const file of jsFiles) {
  if (fs.readFileSync(file, "latin1").includes('indexOf("./next-static/")')) {
    problems.push(`${path.basename(file)} asserts on "./next-static/", which never matches a pathname`);
  }
}

if (problems.length) {
  console.error("FAIL:");
  for (const p of problems) console.error("  - " + p);
  process.exit(1);
}

// --------------------------------------------------------- 6. file list
const referenced = new Set();
for (const file of textFiles) {
  const s = fs.readFileSync(file, "latin1");
  for (const m of s.matchAll(/assets\/([0-9a-f]{64}\.[a-z0-9]+)/g)) {
    referenced.add(`assets/${m[1]}`);
  }
}

const rel = (f) => path.relative(out, f).split(path.sep).join("/");
const files = [
  ...walk(staticDir).map(rel).sort(),
  ...[...referenced].sort(),
  ...(fs.existsSync(path.join(out, "video"))
    ? walk(path.join(out, "video")).map(rel).sort()
    : []),
];

const bytes = files.reduce((n, f) => n + fs.statSync(path.join(out, f)).size, 0);
console.log(`ok: renamed _next, fixed ${runtimeFixes} js file(s), escaped ${escaped} U+FFFD`);
console.log(`ok: no absolute site-root references; currentScript assert intact`);
console.log(`\n${files.length} files to publish (${(bytes / 1048576).toFixed(1)} MB) alongside out/index.html:\n`);
console.log(JSON.stringify(files));
