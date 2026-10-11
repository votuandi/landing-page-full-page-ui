import { expect, test } from "@playwright/test";

test("t11 hero emits its bill on the calculator bus; calculator accepts the same prefill", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/lab/sections/hero?variant=t11&themes=t11", { waitUntil: "networkidle" });
  // Individual lab routes isolate sections. Add a bus target to observe the real hero submission without navigation.
  await page.evaluate(() => {
    const target = document.createElement("div"); target.id = "du-toan"; document.body.append(target);
    window.addEventListener("t15:open-calculator", (e) => { document.body.dataset.prefill = JSON.stringify((e as CustomEvent).detail); });
  });
  await page.getByLabel("Tiền điện / tháng (đồng)").fill("3200000");
  await page.locator('form[action="#du-toan"] button[type="submit"]').click();
  await expect(page.locator("body")).toHaveAttribute("data-prefill", JSON.stringify({ bill: 3200000, source: "hero-bill" }));
  const prefill = JSON.parse((await page.locator("body").getAttribute("data-prefill"))!);
  await page.goto("/lab/sections/calculator?variant=t11&themes=t11", { waitUntil: "networkidle" });
  await page.evaluate((detail) => window.dispatchEvent(new CustomEvent("t15:open-calculator", { detail })), prefill);
  await expect(page.getByLabel("Nhập tiền điện / tháng", { exact: true })).toHaveValue("3200000");
  await expect(page.locator("[data-package]")).toHaveCount(2);
  await expect(page.locator("[data-package]").first()).toContainText("10 kWp");
  await page.getByLabel("Đơn vị nhập").selectOption("kwh");
  await page.getByLabel("Nhập điện tiêu thụ / tháng").fill("2000");
  await expect(page.locator("[data-package]").first()).toContainText("20 kWp");
  await page.getByRole("button", { name: "Chọn gói", exact: true }).click();
  await expect(page.getByRole("button", { name: "Đang chọn", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByLabel("Nhập điện tiêu thụ / tháng").fill("");
  await expect(page.locator("[data-package]")).toHaveCount(0);
  await expect(page.getByRole("status")).toContainText("lớn hơn 0");
  expect(errors).toEqual([]);
});

test("t11 URL prefill, both themes and chart tables work at mobile and desktop widths", async ({ page }) => {
  for (const theme of ["t11", "t15"]) {
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/lab/sections/calculator?variant=t11&themes=${theme}&hoa-don=3200000`, { waitUntil: "networkidle" });
      await expect(page.getByLabel("Nhập tiền điện / tháng", { exact: true })).toHaveValue("3200000");
      await page.getByText("Thiết bị và biểu đồ riêng của gói", { exact: true }).first().click();
      await expect(page.locator(".fill-chart-a").first()).toBeVisible();
      await expect(page.locator(".stroke-chart-b").first()).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(overflow).toBe(false);
    }
  }
});

test("t11 hero form and calculator defaults remain visible with JavaScript disabled", async ({ browser }, testInfo) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL: String(testInfo.project.use.baseURL) });
  try {
    const page = await context.newPage();
    await page.goto("/lab/sections/hero?variant=t11&themes=t11");
    const form = page.locator('form[action="#du-toan"]');
    await expect(form).toBeVisible();
    await expect(form).toHaveAttribute("method", "get");
    await page.getByLabel("Tiền điện / tháng (đồng)").fill("3200000");
    await form.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/hoa-don=3200000.*#du-toan$/);
    await page.goto("/lab/sections/calculator?variant=t11&themes=t11");
    await expect(page.locator("[data-package]")).toHaveCount(2);
    await expect(page.getByText("Công thức và giả định đang dùng", { exact: true })).toBeVisible();
  } finally { await context.close(); }
});

test("t11 segment tabs support keyboard focus and project filters update totals", async ({ page }) => {
  await page.goto("/lab/sections/segments?variant=t11&themes=t11", { waitUntil: "networkidle" });
  const tabs = page.getByRole("tab");
  await expect(tabs.first()).toHaveAttribute("aria-selected", "true");
  await tabs.first().focus();
  await page.keyboard.press("ArrowRight");
  await expect(tabs.nth(1)).toBeFocused();
  await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel")).toHaveCount(1);
  await page.keyboard.press("End");
  await expect(tabs.last()).toBeFocused();
  await page.keyboard.press("Home");
  await expect(tabs.first()).toBeFocused();
  await page.goto("/lab/sections/projects?variant=t11&themes=t11", { waitUntil: "networkidle" });
  const section = page.locator('[data-section-type="projects"]');
  await section.getByRole("button", { name: "Tất cả", exact: true }).click();
  const count = await section.locator("article").count();
  await section.getByRole("button", { name: "Hộ gia đình", exact: true }).click();
  const filtered = await section.locator("article").count();
  expect(filtered).toBeLessThan(count);
  await expect(section.getByRole("region", { name: "Bảng tổng theo bộ lọc" })).toContainText(`· ${filtered}`);
});
