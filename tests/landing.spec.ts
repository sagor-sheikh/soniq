import fs from "fs";
import path from "path";
import { test, expect, type Page } from "@playwright/test";
import { SECTIONS, PAGE_HEIGHT } from "../src/lib/sections";

const EXPECTED_SECTION_ORDER = [
  "hero",
  "transactions",
  "features",
  "habits",
  "pricing",
  "faq",
  "footer",
];

const HEIGHT_TOLERANCE = 0.02; // +/-2%
const FORBIDDEN_HOSTS = ["figma.com", "fontshare", "googleapis", "gstatic"];
const ASSET_RESOURCE_TYPES = new Set(["image", "font", "stylesheet"]);

function isAssetRequest(url: string, resourceType: string) {
  return ASSET_RESOURCE_TYPES.has(resourceType) || /\.svg(?:[?#]|$)/i.test(url);
}

// Waits for the page to actually finish rendering, and FAILS if it does not.
//
// Two earlier versions of this were verification theater. The first resolved
// on timeout and swallowed decode() rejections, so a stalled font or broken
// image let every downstream assertion run against half-rendered output and
// still pass. The second reported decode() timeouts as failures -- but
// HTMLImageElement.decode() does not reliably settle in Chromium for an <img>
// pointing at an SVG, and 57 of this page's 73 images are SVGs, so it failed
// on correctly-rendered content.
//
// complete + naturalWidth is used instead: reliable here (measured: all 73
// images report complete with a non-zero intrinsic width) and a stronger
// signal than decode(), because a 404 or corrupt file reports
// complete === true with naturalWidth === 0 -- the defect actually worth
// catching. Fonts are still waited on, and a stall is reported, not ignored.
async function waitForLoadSettled(page: Page) {
  const problems = await page.evaluate(async () => {
    const found: string[] = [];
    const deadline = Date.now() + 15000;

    let fontsReady = false;
    await Promise.race([
      document.fonts.ready.then(() => {
        fontsReady = true;
      }),
      new Promise<void>((resolve) => setTimeout(resolve, 10000)),
    ]);
    if (!fontsReady) found.push("document.fonts.ready never resolved");

    const inViewport = (el: Element) => {
      const r = el.getBoundingClientRect();
      return (
        r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth
      );
    };

    for (const img of Array.from(document.querySelectorAll("img"))) {
      const src = img.currentSrc || img.src;
      // A next/image lazy img below the fold has not been asked to load yet,
      // so requiring it to be complete would fail on correct behaviour.
      // Chromium assigns currentSrc to such an image while still deferring
      // the fetch, so currentSrc alone does not identify "in flight" --
      // whether it is actually on screen does. Off-screen and incomplete is
      // skipped here; every asset's response status is covered instead by
      // the network-isolation test, which scrolls the whole page first.
      if (!img.complete && !inViewport(img)) continue;

      while (!img.complete && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      if (!img.complete) {
        found.push(`never finished loading: ${src}`);
      } else if (img.naturalWidth === 0) {
        found.push(`loaded with zero intrinsic width (missing or corrupt): ${src}`);
      }
    }

    return found;
  });

  expect(problems, `page never settled: ${problems.join("; ")}`).toEqual([]);
}

test.describe("document structure", () => {
  test("seven data-section ids appear in document order", async ({ page }) => {
    await page.goto("/");
    const ids = await page.$$eval("[data-section]", (els) =>
      els.map((el) => el.getAttribute("data-section")),
    );
    expect(ids).toEqual(EXPECTED_SECTION_ORDER);
  });

  test("every <img> has an alt attribute", async ({ page }) => {
    await page.goto("/");
    await waitForLoadSettled(page);
    const missingAlt = await page.$$eval("img", (imgs) =>
      imgs.filter((img) => !img.hasAttribute("alt")).map((img) => img.currentSrc || img.src),
    );
    expect(missingAlt).toEqual([]);
  });

  test("exactly one h1, and no heading-level jump greater than 1 in DOM order", async ({
    page,
  }) => {
    await page.goto("/");
    const levels = await page.$$eval("h1, h2, h3, h4, h5, h6", (els) =>
      els.map((el) => Number(el.tagName.slice(1))),
    );

    const h1Count = levels.filter((level) => level === 1).length;
    expect(h1Count, `expected exactly one <h1>, found ${h1Count}`).toBe(1);

    for (let i = 1; i < levels.length; i++) {
      const jump = levels[i] - levels[i - 1];
      expect(
        jump,
        `heading jumped from h${levels[i - 1]} to h${levels[i]} at position ${i}`,
      ).toBeLessThanOrEqual(1);
    }
  });

  test("every self-hosted font file is preloaded and served", async ({ page, baseURL }) => {
    // `length > 0` was the old assertion, and one stray preload satisfied it
    // while a second font silently fell back. The count is now tied to a fact
    // outside the served HTML -- the number of .woff2 files actually shipped
    // in src/fonts -- and each preloaded URL must really resolve.
    const shippedFontFiles = fs
      .readdirSync(path.join(__dirname, "..", "src", "fonts"))
      .filter((name) => name.endsWith(".woff2"));
    expect(
      shippedFontFiles.length,
      "expected src/fonts to contain .woff2 files",
    ).toBeGreaterThan(0);

    const origin = new URL(baseURL ?? "http://localhost:3017").origin;
    const response = await page.request.get(`${origin}/`);
    expect(response.ok()).toBeTruthy();
    const html = await response.text();

    const preloadFontLinks = html.match(/<link[^>]+rel="preload"[^>]+as="font"[^>]*>/g) ?? [];
    expect(
      preloadFontLinks.length,
      `expected one preload per shipped font file (${shippedFontFiles.length}: ${shippedFontFiles.join(", ")}), found ${preloadFontLinks.length}`,
    ).toBe(shippedFontFiles.length);

    for (const link of preloadFontLinks) {
      const href = link.match(/href="([^"]+)"/)?.[1];
      expect(href, `preload link has no href: ${link}`).toBeTruthy();
      const fontUrl = new URL(href!, origin);
      expect(
        fontUrl.origin,
        `font must be self-hosted, got ${fontUrl.href}`,
      ).toBe(origin);
      const fontResponse = await page.request.get(fontUrl.href);
      expect(
        fontResponse.status(),
        `preloaded font did not resolve: ${fontUrl.href}`,
      ).toBe(200);
    }
  });

  test("zero console errors during load", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/");
    await waitForLoadSettled(page);

    expect(errors).toEqual([]);
  });
});

test.describe("network isolation", () => {
  test("every image, svg, font and stylesheet request is same-origin", async ({
    page,
    baseURL,
  }) => {
    const origin = new URL(baseURL ?? "http://localhost:3017").origin;
    const crossOriginAssetRequests: string[] = [];
    const forbiddenHostRequests: string[] = [];
    // Origin is not health: a same-origin 404 for an image, stylesheet or
    // font satisfied every assertion in this test before these two lists
    // existed, so a broken asset path shipped green.
    const badAssetResponses: string[] = [];
    const failedAssetRequests: string[] = [];

    page.on("request", (request) => {
      const url = request.url();
      const resourceType = request.resourceType();
      if (isAssetRequest(url, resourceType)) {
        try {
          if (new URL(url).origin !== origin) {
            crossOriginAssetRequests.push(`${resourceType}: ${url}`);
          }
        } catch {
          // Not a fetchable absolute URL (e.g. data:) -- ignore.
        }
      }

      for (const host of FORBIDDEN_HOSTS) {
        if (url.includes(host)) {
          forbiddenHostRequests.push(url);
        }
      }
    });

    page.on("response", (response) => {
      const request = response.request();
      if (!isAssetRequest(request.url(), request.resourceType())) return;
      if (response.status() >= 400) {
        badAssetResponses.push(`${response.status()} ${request.resourceType()}: ${response.url()}`);
      }
    });

    page.on("requestfailed", (request) => {
      if (!isAssetRequest(request.url(), request.resourceType())) return;
      failedAssetRequests.push(
        `${request.resourceType()}: ${request.url()} (${request.failure()?.errorText ?? "unknown"})`,
      );
    });

    await page.goto("/");
    await waitForLoadSettled(page);
    // Scroll the full page so below-the-fold sections' lazy assets also
    // issue their requests before we assert on the network log.
    await page.evaluate(async () => {
      const step = window.innerHeight;
      const total = document.documentElement.scrollHeight;
      for (let y = 0; y < total; y += step) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForLoadState("networkidle");

    expect(crossOriginAssetRequests).toEqual([]);
    expect(forbiddenHostRequests).toEqual([]);
    expect(badAssetResponses, `asset requests returned an error status: ${badAssetResponses.join(", ")}`).toEqual([]);
    expect(failedAssetRequests, `asset requests failed outright: ${failedAssetRequests.join(", ")}`).toEqual([]);
  });
});

test.describe("overflow", () => {
  for (const width of [320, 393, 768, 1024, 1440, 1920]) {
    test(`scrollWidth <= innerWidth at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      const { scrollWidth, innerWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));
      expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
    });
  }
});

const VIEWPORTS = [
  { width: 1440, height: 900, label: "1440x900" },
  { width: 393, height: 852, label: "393x852" },
] as const;

for (const viewport of VIEWPORTS) {
  test.describe(`section heights at ${viewport.label}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test(`every section and the page total are within +/-2% at ${viewport.label}`, async ({
      page,
    }) => {
      // The FAQ accordion's initialOpenId defaults to item 0, so no
      // interaction is needed to reach the documented initial state.
      await page.goto("/");
      await waitForLoadSettled(page);

      for (const section of SECTIONS) {
        const box = await page.locator(`[data-section="${section.id}"]`).boundingBox();
        expect(box, `${section.id} not found at ${viewport.label}`).not.toBeNull();

        const expected =
          viewport.width === 1440 ? section.desktopHeight : section.mobileHeight;
        const measured = box!.height;
        const delta = Math.abs((measured - expected) / expected);

        expect(
          delta,
          `${section.id} measured ${measured}px vs expected ${expected}px at ${viewport.label} (${(delta * 100).toFixed(2)}% delta)`,
        ).toBeLessThanOrEqual(HEIGHT_TOLERANCE);
      }

      const totalHeight = await page.evaluate(() => document.documentElement.scrollHeight);
      const expectedTotal = viewport.width === 1440 ? PAGE_HEIGHT.desktop : PAGE_HEIGHT.mobile;
      const totalDelta = Math.abs((totalHeight - expectedTotal) / expectedTotal);

      expect(
        totalDelta,
        `page total measured ${totalHeight}px vs expected ${expectedTotal}px at ${viewport.label} (${(totalDelta * 100).toFixed(2)}% delta)`,
      ).toBeLessThanOrEqual(HEIGHT_TOLERANCE);
    });
  });
}
