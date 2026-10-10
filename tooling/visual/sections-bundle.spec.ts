import { expect, test } from "@playwright/test";

test("chỉ tải island của variant v1 và island tương tác được", async ({ page }, testInfo) => {
  const scripts: Promise<{ url: string; body: string }>[] = [];
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (new URL(response.url()).pathname.endsWith(".js")) {
      scripts.push(response.text().then((body) => ({ url: response.url(), body })));
    }
  });
  const response = await page.goto("/lab/sections", { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await expect(page.locator("main section")).toHaveCount(3);
  for (const type of ["demo-a", "demo-b"]) {
    const island = page.locator(`[data-island="SECTIONS_ISLAND_${type}_v1"]`).first();
    await expect(island).toHaveText("Số lần nhấn: 0");
    await island.click();
    await expect(island).toHaveText("Số lần nhấn: 1");
  }
  const loaded = await Promise.all(scripts);
  const bodies = loaded.map(({ body }) => body).join("\n");
  const markers = [...new Set(bodies.match(/SECTIONS_ISLAND_demo-[ab]_v[12]/g) ?? [])];
  await testInfo.attach("javascript-requests", {
    body: JSON.stringify(loaded.map(({ url, body }) => ({
      url, markers: body.match(/SECTIONS_ISLAND_demo-[ab]_v[12]/g) ?? [],
    })), null, 2),
    contentType: "application/json",
  });
  await testInfo.attach("sections-lab", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
  for (const type of ["demo-a", "demo-b"]) {
    expect(markers).toContain(`SECTIONS_ISLAND_${type}_v1`);
    expect(markers).not.toContain(`SECTIONS_ISLAND_${type}_v2`);
  }
  expect(errors).toEqual([]);
});

test("HTML ban đầu vẫn hiện nội dung và island khi tắt JavaScript", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  try {
    const page = await context.newPage();
    const response = await page.goto("/lab/sections");
    expect(response?.status()).toBe(200);
    for (const id of ["demo-a-v1", "demo-b-v1", "demo-b-fallback"]) {
      const section = page.locator(`#${id}`);
      await expect(section).toContainText("[DỮ LIỆU MẪU]");
      await expect(section.locator("h2")).toContainText("v1");
      await expect(section.getByRole("button")).toHaveText("Số lần nhấn: 0");
    }
    await expect(page.locator('[data-island$="_v2"]')).toHaveCount(0);
  } finally {
    await context.close();
  }
});
