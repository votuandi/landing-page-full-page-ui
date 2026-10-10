import { expect, test } from "@playwright/test";
import { collectionSchemas } from "../../packages/sections/src/collections/schemas";
import { staticCollectionSource } from "../../apps/web/src/lib/sectionCollections";

const TYPES = ["projects", "shorts", "stats", "energy-monitoring", "process", "testimonials", "trust", "brands", "faq", "blog", "cta-banner", "calculator"];
const route = "/lab/sections/t15-content";

test("temporary web adapter produces valid collection items", async () => {
  for (const name of Object.keys(collectionSchemas) as (keyof typeof collectionSchemas)[]) {
    const items = await staticCollectionSource[name]!({ tenantId: "lab-demo", locale: "vi", themeId: "t15" });
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) expect(collectionSchemas[name].safeParse(item).success).toBe(true);
  }
});

test("11 content sections render with collection data and FAQPage JSON-LD", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  const response = await page.goto(route, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  expect(await page.locator("[data-section-type]").evaluateAll((nodes) => nodes.map((n) => n.getAttribute("data-section-type")))).toEqual(TYPES);
  await expect(page.locator("[data-section-fallback]")).toHaveCount(0);
  for (const type of TYPES) await expect(page.locator(`[data-section-type="${type}"]`)).not.toBeEmpty();
  const json = await page.locator('[data-section-type="faq"] script[type="application/ld+json"]').textContent();
  expect(JSON.parse(json!).mainEntity).toHaveLength(10);
  expect(JSON.parse(json!)["@type"]).toBe("FAQPage");
  expect(await response!.text()).toContain('"@type":"FAQPage"');
  expect(errors).toEqual([]);
  await testInfo.attach("lab-t15-content", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
});

for (const origin of ["projects", "shorts"]) {
  test(`${origin} story CTA submits calculator lead with story-cta source`, async ({ page }) => {
    let body: Record<string, unknown> | undefined;
    await page.route("**/api/lead", async (request) => {
      body = request.request().postDataJSON();
      await request.fulfill({ status: 200, json: { ok: true } });
    });
    await page.goto(route, { waitUntil: "networkidle" });
    const section = page.locator(`[data-section-type="${origin}"]`);
    if (origin === "shorts") {
      await section.getByRole("button", { name: /Phát video:/ }).first().click();
      await page.getByRole("dialog").getByRole("link", { name: "Nhận báo giá công trình tương tự" }).click();
      await expect(page.getByRole("dialog")).toHaveCount(0);
    } else await section.getByRole("link", { name: "Nhận báo giá công trình tương tự" }).first().click();
    const calc = page.locator("#du-toan");
    await expect(calc.getByText(/Đang hỏi giá: Công trình tương tự:/)).toBeVisible();
    await calc.getByLabel("Họ và tên").fill("Khách kiểm thử");
    await calc.getByLabel("Số điện thoại di động").fill("0901234500");
    await calc.getByRole("button", { name: "Nhận báo giá chi tiết" }).click();
    await expect.poll(() => body?.source).toBe("story-cta");
    expect(body?.segment).toBe("Hộ gia đình");
  });
}

test("project and shorts filters are local; player supports keyboard close and focus restore", async ({ page }) => {
  await page.goto(`${route}?phan-khuc=trang-trai`, { waitUntil: "networkidle" });
  const projects = page.locator('[data-section-type="projects"]');
  await expect(projects.locator("article")).toHaveCount(2);
  await projects.getByRole("button", { name: "Cửa hàng", exact: true }).click();
  await expect(projects.locator("article")).toHaveCount(2);
  const shorts = page.locator('[data-section-type="shorts"]');
  await expect(shorts.getByRole("button", { name: /Phát video:/ })).toHaveCount(2);
  const opener = shorts.getByRole("button", { name: /Phát video:/ }).first();
  await opener.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("dialog")).toContainText("Chủ trại heo");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(opener).toBeFocused();
});

test("content and final stats remain visible without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(`http://localhost:3210${route}`);
    for (const type of TYPES) {
      const section = page.locator(`[data-section-type="${type}"]`);
      await expect(section).not.toBeEmpty();
      await expect(section.getByRole("heading").first()).toBeVisible();
    }
    await expect(page.locator('[data-section-type="stats"]')).toContainText("4.200");
    await expect(page.locator('[data-section-type="trust"]')).toContainText("QA-MẪU-9001");
    const href = await page.locator('[data-section-type="projects"]').getByRole("link", { name: "Nhận báo giá công trình tương tự" }).first().getAttribute("href");
    expect(href).toContain("nguon=story-cta");
    expect(href).toContain("#du-toan");
  } finally { await context.close(); }
});
