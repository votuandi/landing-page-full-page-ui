import { expect, test } from "@playwright/test";

test("PageRenderer giữ thứ tự, bỏ section tắt và cô lập lỗi server/client", async ({ page }, testInfo) => {
  const logs: string[] = [];
  const pageErrors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") logs.push(message.text()); });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  const response = await page.goto("/lab/renderer", { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);

  const sections = page.locator("[data-section-id]");
  await expect(sections).toHaveCount(4);
  expect(await sections.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-section-id"))))
    .toEqual(["mo-dau", "loi-server", "loi-client", "du-toan"]);

  const server = page.locator('[data-section-id="loi-server"]');
  await expect(server).toHaveAttribute("data-section-fallback", "");
  await expect(server).toBeEmpty();
  await expect(page.locator('[data-section-id="loi-client"]')).toBeEmpty();
  await expect(page.locator('[data-section-id="mo-dau"] section')).toBeVisible();
  await expect(page.locator("#du-toan section")).toContainText("Dự toán");
  await expect(page.locator('#du-toan [data-island="SECTIONS_ISLAND_demo-a_v1"]')).toHaveText("Số lần nhấn: 0");

  await expect.poll(() => logs.find((log) => log.includes("render section lỗi"))).toBeTruthy();
  const log = logs.find((text) => text.includes("render section lỗi"))!;
  expect(log).toContain("lab-demo");
  expect(log).toContain("loi-client");
  expect(pageErrors).toEqual([]);

  await testInfo.attach("console-errors", { body: logs.join("\n"), contentType: "text/plain" });
  await testInfo.attach("renderer-lab", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
});

test("HTML server có nội dung khi tắt JavaScript và section lỗi server rỗng", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  try {
    const page = await context.newPage();
    const response = await page.goto("/lab/renderer");
    expect(response?.status()).toBe(200);
    await expect(page.locator('[data-section-id="bi-tat"]')).toHaveCount(0);
    await expect(page.locator('[data-section-id="loi-server"]')).toBeEmpty();
    await expect(page.locator("#du-toan section")).toBeVisible();
    await expect(page.locator('[data-section-id="loi-client"] section')).toBeVisible();
  } finally {
    await context.close();
  }
});
