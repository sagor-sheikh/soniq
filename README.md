# Soniq landing page

A static marketing landing page implemented from Figma file `JLWztY7Ce18rqZzozztzcX`
("Novyra"), section `2655:706` ("Soniq"), at two designed widths: **1440px desktop**
and **393px mobile**, fluid between and slightly beyond them (down to 320px, up to
1920px). Built with Next.js 16.2.4, React 19.2.4, TypeScript, and Tailwind CSS v4.

This is a standalone, self-contained implementation of a single page — there is no
routing, no other pages, and no shared design system beyond what lives in this repo.

## Install

```bash
npm install
```

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Starts the Next.js dev server on port **3017**. |
| `npm run start` | Starts the production server (after `build`) on port **3017**. |
| `npm run build` | Production build. |
| `npm run lint` | `eslint .` (Next 16 removed `next lint`). |
| `npm run verify:design` | Checks `design/sections.json` against source and design/raw extraction (`scripts/check-design.mjs`). |
| `npm run verify:assets` | Verifies every asset referenced in `design/sections.json` and `public/assets/manifest.json` resolves on disk with a matching sha256, and that no `figma.com` URL leaked into `src/` or the manifest (`scripts/check-assets.mjs`). |
| `npm run verify` | **Everything, in order, against one fresh build**: `build` -> design -> assets -> measure -> Playwright -> Lighthouse -> dev smoke. Use this rather than running the checks individually; `next start` does not verify that `.next` is newer than `src/`, so a harness run without a preceding build can pass against stale output. |
| `npm run verify:dev` | Dev-server smoke test — see below (`scripts/dev-smoke.mjs`). |
| `npm run verify:measure` | `scripts/measure.mjs --all` — the height/overflow harness. |
| `npm run export:artifact` | Post-processes a static export so it can be served from a **subpath** (a published page, a docs folder), and prints the file list to publish. Fails loudly if the export would hydrate dead — see the script header. |
| `npm run test:e2e` | Playwright suite: section order/heights, overflow at six widths, same-origin network, alt text, heading order, console errors, axe accessibility, keyboard accordion (`tests/`). |
| `npm run audit` | Lighthouse accessibility + CLS at both designed widths, with explicit `screenEmulation` (`scripts/lighthouse.mjs`). |
| `npm run overlay` | Screenshots every built section next to its Figma reference for manual visual review (`scripts/overlay.mjs`, non-asserting). |
| `node scripts/measure.mjs --all` | Playwright height/overflow harness — measures every section against its expected height at both widths and checks for horizontal overflow at six viewports. |
| `node scripts/dev-smoke.mjs` | Same as `npm run verify:dev`. |

**Port:** everything (`dev`, `start`, `measure.mjs`, `dev-smoke.mjs`, Playwright/Lighthouse)
defaults to **3017**, not the Next.js default of 3000.

### What `dev-smoke.mjs` actually checks

Every other verification script in this project (`measure.mjs`, `lighthouse.mjs`,
`overlay.mjs`, `tests/`) runs against the **production** server (`next start`).
`scripts/dev-smoke.mjs` is the one check that exercises `npm run dev` itself:

1. Port preflight on 3017 (override with `DEV_SMOKE_PORT`) — if something is already
   listening, it fails immediately with a clear message instead of measuring whatever
   is already there.
2. Spawns `next dev` directly, waits for the port to come up (with a timeout).
3. Fetches `/` and asserts all seven `data-section` elements are present: `hero`,
   `transactions`, `features`, `habits`, `pricing`, `faq`, `footer`.
4. Fetches every asset listed in `public/assets/manifest.json` and asserts HTTP 200.
5. Kills only the dev server process it spawned (on Windows, `taskkill /F /T /PID` on
   its own child PID — never by port number or process name), so a stale server never
   poisons the next run.

## Asset and font provenance

- **Images and vectors** were exported from the Figma file and are committed under
  `public/assets/`, named by their own sha256 (`public/assets/<sha256>.<ext>`).
  `public/assets/manifest.json` records, for every asset, which Figma node IDs use it,
  its section, kind, pixel dimensions, and sha256 — `npm run verify:assets` checks the
  whole chain (file exists, non-empty, hash matches, filename matches hash) and confirms
  no live `figma.com` URL survives anywhere in `src/` or the manifest.
- **Fonts** are self-hosted via `next/font/local` — no runtime font CDN of any kind
  (not Google Fonts, not Fontshare, not a `<link>` to any external font host):
  - **Satoshi** (body), from Fontshare, under the Fontshare Free Font Licence.
  - **Inter Tight** (display/headings — substituted for the design's Helvetica Neue;
    see "Design corrections" below), from Fontsource, under the SIL Open Font License 1.1.
  - Full license text for both is in `src/fonts/LICENSES.md`.

## Design corrections and deviations

These were found and recorded during implementation (full detail in `PLAN.md`):

- **Two stale mobile headings.** The mobile Figma nodes for the habits section
  (`2676:1010`) and the FAQ section (`2677:1262`) both literally contain the copy
  "See Every Transaction In One Place" — leftover text copy-pasted from the
  transactions section. The implementation overrides both with their correct desktop
  heading ("Build Better Financial Habits With Soniq" and "Questions About Managing
  Money With Soniq?" respectively); the raw extracted (stale) strings are preserved
  in `design/sections.json` for audit purposes.
- **Helvetica Neue → Inter Tight.** The design specifies Helvetica Neue for display/
  heading type; it is not freely licensable for self-hosting, so Inter Tight was
  substituted. The hero section served as a calibration gate — its measured height at
  both widths had to land within ±2% of spec before any other section was built, to
  confirm the substitution didn't distort layout. No font-size, letter-spacing, or
  `size-adjust` correction was ultimately needed; small spacer values were adjusted
  instead (see `PLAN.md`'s "R1 CALIBRATION RESULT").
- **Colour and radius collapse.** The extracted design used many near-duplicate colour
  and radius values (e.g. `#f5f6ee` vs `#fffff5`, `#b5fa08` vs `#b0f10e`). These were
  collapsed to a single token set in `src/app/globals.css` (radii: `12`, `20`, `24`,
  `90`, `pill`), with drift values snapped to the nearest kept token.
- **`--color-lime-text-on-light` token.** No lime colour in the palette clears WCAG AA
  contrast on a light surface (the brightest, `#b0f10e`, measures 1.36:1 on white; the
  darkest, `#9fab26`, measures 2.52:1 — both fail even the 3:1 large-text bar). A
  dedicated token, `#5c6b0a` (≥4.5:1 on both `#ffffff` and `#fffff5`), was added and is
  used *only* for lime-coloured text on light surfaces; decorative lime shapes/fills are
  untouched.
- **Four contrast deviations from the comp**, each darkening or adjusting an opacity
  just enough to clear WCAG AA, documented inline at each site:
  - **Pricing label opacity** (`.featuresLabel`, `Pricing.module.css`) — comp sets 48%
    black, measuring 3.36:1 / 3.71:1 on the two card fills; raised to 60% (4.88:1 / 5.73:1).
  - **Footer heading opacity** (`.navHeading`, `Footer.module.css`) — comp dims nav
    column labels to 40% of `#bbbcb3` (2.5:1 on the dark background); raised to 70% (5.1:1).
  - **FAQ ellipse extent** (`.overlay`, `Faq.module.css`) — the dark gradient blob behind
    the accordion is carried further left than the Figma export so the white accordion
    text clears WCAG AA against it.
  - **Transactions income green** (`--tx-income`, `Transactions.module.css`) — the
    comp's `#0ece52` measures 2.11:1 on white; darkened, hue preserved, to `#098836`
    (4.58:1).
- **One axe exemption.** The footer's oversized decorative "Soniq" wordmark
  (`Footer.tsx`, `.wordmark`) bleeds off the top edge at 1.19:1 contrast by design —
  it's `aria-hidden` background texture, not information-bearing text. It's marked
  `data-decorative="wordmark"` and excluded from the axe scan by that explicit marker
  (never by a hashed/generated class), as a judged WCAG 1.4.3 logotype/decorative-text
  exemption rather than a fix. This is the only axe rule exclusion in the project; the
  `color-contrast` rule stays enabled for everything else.

## Scope: everything is presentational

**All calls to action are presentational only.** There is no backend, no form
submission, no payment processing, and no CMS. Every control the comp gives no
destination — including the footer's social icons and legal links — renders as
`<button type="button">`, never as an anchor. An `href` is used only where there is a
real in-page target to scroll to (`#pricing`, `#faq`, …); a self-referential `href`
such as `#footer` is still a no-op that pushes history and moves focus, so it is not
used either. Nothing on this page sends data anywhere.

## Known content gaps (both need a designer decision)

**FAQ answers.** In the extracted source design, `faq.copy.items[1..4].answer` is
`null` — only the first of five FAQ questions has answer copy in the Figma file. The
other four accordion panels intentionally render open-but-empty when expanded. **This
is not a bug** — it's a gap in the source design.

**Four misspellings ship as drawn.** The Figma source contains "Soniq Case Main
Balence" (likely "Cash" / "Balance"), "Neopay Nmber" ("Number"), "Withdaw"
("Withdraw"), and "Team of Services" ("Terms of Service"). All four are verbatim in
`design/raw/2665-459.md`, `2676-988.md`, `2655-1159.md` and `2677-1369.md`, and are
reproduced faithfully rather than silently corrected — rewriting a designer's copy is
the same kind of invention as writing the missing FAQ answers would be. One line per
string is all that is needed to fix them.

## Measured fidelity

Every section is within ±2% of its spec height at both designed widths (1440×900 and
393×852), measured by `scripts/measure.mjs`:

| Section | Desktop (measured/expected) | Mobile (measured/expected) |
|---|---|---|
| hero | 1922 / 1923 | 1957 / 1951 |
| transactions | 1327 / 1326 | 1841 / 1841 |
| features | 1238 / 1238 | 849 / 849 |
| habits | 956 / 956 | 1042 / 1042 |
| pricing | 931 / 933 | 1376 / 1370 |
| faq | 859 / 859 | 868 / 868 |
| footer | 554 / 554 | 550 / 550 |

Page totals: **7787 / 7789** desktop, **8483 / 8471** mobile.

No horizontal overflow at 320, 393, 768, 1024, 1440, or 1920px.

**Lighthouse:** accessibility **96/96** (mobile/desktop), **CLS 0/0** at both widths,
with explicit `screenEmulation` for 393×852 and 1440×900 (Lighthouse's own defaults are
neither of those).

See `PLAN.md` for the full adversarial-planning history, task list, and audit results.
# soniq
