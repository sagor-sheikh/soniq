import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const AXE_VIEWPORTS = [
  { width: 1440, height: 900, label: "1440x900" },
  { width: 393, height: 852, label: "393x852" },
] as const;

test.describe("axe wcag2a/wcag2aa", () => {
  for (const viewport of AXE_VIEWPORTS) {
    test(`zero violations at ${viewport.label}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/");

      // The oversized "Soniq" footer watermark is excluded deliberately. It is
      // aria-hidden, bleeds off the top edge, and sits at 1.19:1 BY DESIGN --
      // it is texture, not readable text. WCAG 1.4.3 exempts text that is pure
      // decoration, so raising its contrast would alter the comp to satisfy a
      // rule that does not apply to it. This is the only exemption; every other
      // contrast finding is fixed at source (see PLAN.md, T11 AUDIT RESULT).
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .exclude('[data-decorative="wordmark"]')
        .analyze();

      expect(
        results.violations,
        JSON.stringify(results.violations, null, 2),
      ).toEqual([]);

      // results.incomplete was previously discarded, which hid a real blind
      // spot: axe cannot compute a contrast ratio for text sitting on a
      // raster or a multi-stop gradient, so those land in `incomplete`, not
      // `violations`. Every text-over-photo claim on this page (hero headline
      // over .backgroundImage, the FAQ accordion over its gradient stack,
      // the transactions mockup captions, the habits portrait names) is in
      // that bucket and asserted by nothing.
      //
      // Asserting incomplete === [] would be a gate demanding the impossible,
      // so instead the blind spot is pinned: it must stay confined to
      // color-contrast. A NEW rule going indeterminate fails here, and the
      // node list prints so the unmeasured set is visible rather than silent.
      const incompleteByRule = [...new Set(results.incomplete.map((r) => r.id))].sort();
      if (results.incomplete.length > 0) {
        console.log(
          `axe could not determine ${results.incomplete.length} node(s) at ${viewport.label}, by rule: ${incompleteByRule.join(", ")}`,
        );
      }
      expect(
        incompleteByRule.filter((id) => id !== "color-contrast"),
        `axe returned indeterminate results for rule(s) other than color-contrast at ${viewport.label}; these are unverified by any gate: ${JSON.stringify(results.incomplete, null, 2)}`,
      ).toEqual([]);
    });
  }
});

test.describe("FAQ accordion keyboard operation", () => {
  test("Enter opens and reveals the region, Space closes it again", async ({ page }) => {
    await page.goto("/");

    const firstButton = page
      .locator('[data-section="faq"] button[aria-expanded]')
      .first();

    // Focus the trigger directly rather than counting Tab presses from the
    // top of the page: the number of focusable stops before the FAQ (nav
    // links, mobile-nav toggle, hero/other section CTAs) is owned by other
    // sections and is not this gate's concern. A native <button> reached by
    // Tab or by .focus() behaves identically for Enter/Space activation.
    await firstButton.focus();
    await expect(firstButton).toBeFocused();

    // The FAQ's documented initial state has item 0 (the first button)
    // already expanded, so normalize to a closed baseline before asserting
    // that Enter is what opens it.
    if ((await firstButton.getAttribute("aria-expanded")) === "true") {
      await page.keyboard.press("Enter");
      await expect(firstButton).toHaveAttribute("aria-expanded", "false");
    }

    await page.keyboard.press("Enter");
    await expect(firstButton).toHaveAttribute("aria-expanded", "true");

    const panelId = await firstButton.getAttribute("aria-controls");
    expect(panelId).toBeTruthy();
    const panel = page.locator(`#${panelId}`);
    await expect(panel).toBeVisible();

    await page.keyboard.press("Space");
    await expect(firstButton).toHaveAttribute("aria-expanded", "false");
    await expect(panel).toBeHidden();
  });

  test("opening every FAQ item grows the page without horizontal clipping", async ({
    page,
  }) => {
    await page.goto("/");

    const buttons = page.locator('[data-section="faq"] button[aria-expanded]');
    const itemCount = await buttons.count();
    expect(itemCount).toBeGreaterThan(0);

    // Collapse the documented initial-open item (item 0) so we start from
    // an all-closed baseline.
    const firstButton = buttons.nth(0);
    if ((await firstButton.getAttribute("aria-expanded")) === "true") {
      await firstButton.click();
    }
    for (let i = 0; i < itemCount; i++) {
      await expect(buttons.nth(i)).toHaveAttribute("aria-expanded", "false");
    }
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
      .toBe(true);
    const heightAllClosed = await page.evaluate(
      () => document.documentElement.scrollHeight,
    );

    // Item 0 is the only one with real answer copy (design/sections.json
    // faq.copy.items[1..4].answer is null) -- opening it must grow the page.
    await firstButton.click();
    await expect(firstButton).toHaveAttribute("aria-expanded", "true");
    const firstPanelId = await firstButton.getAttribute("aria-controls");
    await expect(page.locator(`#${firstPanelId}`)).toBeVisible();

    const heightWithAnswerOpen = await page.evaluate(
      () => document.documentElement.scrollHeight,
    );
    expect(heightWithAnswerOpen).toBeGreaterThan(heightAllClosed);

    const overflowingAfterFirst = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflowingAfterFirst).toBe(false);

    // Walk through the remaining items (single-open accordion, so each
    // click closes the previous one). Assert only the aria state toggles
    // -- do NOT assert panel text OR panel visibility for items 1-4, whose
    // answer is intentionally null in the source design: an empty panel
    // legitimately renders at zero height (Faq.module.css's
    // .accordionPanel:empty rule), which is correct, not clipping.
    for (let i = 1; i < itemCount; i++) {
      const button = buttons.nth(i);
      await button.click();
      await expect(button).toHaveAttribute("aria-expanded", "true");
      await expect(button).toHaveAttribute("aria-controls", /faq-\d+-panel/);

      const overflowing = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      );
      expect(overflowing, `horizontal clipping after opening item ${i}`).toBe(false);
    }
  });
});
