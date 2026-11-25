import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// E14-S06: 0 vi phạm axe mức serious/critical trên 15 preset (WCAG 2.x A/AA), mỗi preset với theme của nó.
const presets = Array.from({ length: 15 }, (_, i) => `t${String(i + 1).padStart(2, "0")}`);

async function settle(page: Page) {
  await page.addStyleTag({ content: "section, footer { content-visibility: visible !important; }" });
  await page.evaluate(async () => {
    await document.fonts.ready;
    for (let y = 0; y < document.documentElement.scrollHeight; y += 700) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((done) => setTimeout(done, 30));
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  });
}

async function seriousViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  return violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => ({
      id: v.id, impact: v.impact, count: v.nodes.length,
      nodes: v.nodes.slice(0, 8).map((n) => ({ target: n.target.join(" "), html: n.html.slice(0, 160), data: n.any[0]?.data })),
    }));
}

for (const width of [390, 1440]) for (const scheme of ["light", "dark"] as const) {
  test.describe(`a11y ${width}px ${scheme}`, () => {
    test.use({ viewport: { width, height: width === 390 ? 844 : 900 }, colorScheme: scheme });
    for (const id of presets) test(`a11y preset ${id} ${width}px ${scheme} has no serious/critical axe violations`, async ({ page }, info) => {
      await page.addInitScript((s) => { localStorage.setItem("t15-theme", s); sessionStorage.setItem("t15-consult-shown", "1"); }, scheme);
      expect((await page.goto(`/lab/presets/${id}`, { waitUntil: "networkidle" }))?.status()).toBe(200);
      await settle(page);
      const found = await seriousViolations(page);
      if (found.length) await info.attach(`axe-${id}`, { body: JSON.stringify(found, null, 2), contentType: "application/json" });
      expect(found).toEqual([]);
    });
  });
}

test("a11y carousel strip is keyboard scrollable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => { sessionStorage.setItem("t15-consult-shown", "1"); });
  await page.goto("/lab/presets/t15", { waitUntil: "networkidle" });
  const strip = page.locator("[data-section-type=services] [role=region][tabindex='0']").first();
  await strip.scrollIntoViewIfNeeded();
  await strip.focus();
  await expect(strip).toBeFocused();
  const before = await strip.evaluate((el) => el.scrollLeft);
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => strip.evaluate((el) => el.scrollLeft)).toBeGreaterThan(before);
});

test("a11y hotline button has an accessible name at 1440px", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/lab/presets/t15", { waitUntil: "networkidle" });
  await expect(page.getByRole("button", { name: "Hotline" })).toBeVisible();
});
