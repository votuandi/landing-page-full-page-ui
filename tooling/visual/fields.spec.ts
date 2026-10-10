import { expect, test } from "@playwright/test";

test("link calculator gửi prefill qua bus và giữ nguyên trang", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/lab/fields", { waitUntil: "networkidle" });
  const url = page.url();
  const timeOrigin = await page.evaluate(() => performance.timeOrigin);
  await page.getByRole("link", { name: "[DỮ LIỆU MẪU] Dự toán nhà xưởng" }).click();
  await expect(page.getByTestId("calc-prefill")).toHaveText('{"segment":"factory","bill":15000000}');
  expect(page.url()).toBe(url);
  expect(await page.evaluate(() => performance.timeOrigin)).toBe(timeOrigin);
  await page.getByRole("link", { name: "[DỮ LIỆU MẪU] Mở dự toán" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("calc-prefill")).toHaveText("{}");
  expect(page.url()).toBe(url);
  expect(errors).toEqual([]);
  await testInfo.attach("fields-lab", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
});

test("richText độc hiển thị dạng chữ và không tạo script/ảnh", async ({ page }) => {
  await page.goto("/lab/fields");
  const content = page.getByTestId("richtext");
  await expect(content).toContainText('<script>alert(1)</script><img src=x onerror="alert(1)">');
  await expect(content.locator("script, img")).toHaveCount(0);
  await expect(content.locator("strong")).toContainText("đậm");
  await expect(content.locator("em")).toContainText("nghiêng");
  await expect(content.locator("li")).toHaveCount(2);
  await expect(content.getByRole("link")).toHaveAttribute("rel", "noopener noreferrer");
});

test("tắt JavaScript vẫn render richText và href calculator đúng", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  try {
    const page = await context.newPage();
    const response = await page.goto("/lab/fields");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("link", { name: "[DỮ LIỆU MẪU] Dự toán nhà xưởng" }))
      .toHaveAttribute("href", "/?phan-khuc=factory&hoa-don=15000000#du-toan");
    await expect(page.getByRole("link", { name: "[DỮ LIỆU MẪU] Mở dự toán" })).toHaveAttribute("href", "/#du-toan");
    await expect(page.getByTestId("richtext")).toContainText("[DỮ LIỆU MẪU]");
    await expect(page.getByTestId("richtext").locator("script, img")).toHaveCount(0);
  } finally {
    await context.close();
  }
});
