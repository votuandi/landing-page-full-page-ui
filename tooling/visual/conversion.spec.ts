import { expect, test } from "@playwright/test";

const TYPES = ["site-header", "hero", "segments", "packages", "calculator", "lead-form", "site-footer"];

test("7 section luồng chuyển đổi t15 render từ fixture, dự toán và tab gói tương tác được", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));

  const response = await page.goto("/lab/sections/t15", { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);

  const sections = page.locator("[data-section-id]");
  expect(await sections.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-section-type")))).toEqual(TYPES);
  await expect(page.locator("[data-section-fallback]")).toHaveCount(0);
  for (const type of TYPES) await expect(page.locator(`[data-section-type="${type}"]`)).not.toBeEmpty();

  // Dự toán: đổi tiền điện → chi phí ước tính đổi.
  const calc = page.locator("#du-toan");
  const cost = calc.locator("[data-calculator-cost]");
  const before = await cost.textContent();
  await calc.getByLabel("Tiền điện trung bình mỗi tháng").fill("5.000.000");
  await expect(cost).not.toHaveText(before ?? "");
  // Chọn phân khúc nhà xưởng → ô tiền điện về mặc định của phân khúc.
  await calc.getByText("Nhà xưởng", { exact: true }).click();
  await expect(calc.getByLabel("Tiền điện trung bình mỗi tháng")).toHaveValue("80.000.000");

  // Tab gói: chọn Trang trại → thẻ gói trang trại.
  const pkgs = page.locator("#goi-giai-phap");
  await pkgs.getByRole("button", { name: "Trang trại" }).click();
  await expect(pkgs.getByRole("heading", { name: "Gói Trại nhỏ" })).toBeVisible();

  // Nút gói mở dự toán, điền sẵn nhu cầu.
  await pkgs.getByRole("button", { name: /Nhận tư vấn gói này/ }).first().click();
  await expect(calc.getByText(/Đang hỏi giá: Gói Trại nhỏ/)).toBeVisible();

  expect(errors).toEqual([]);
  await testInfo.attach("lab-t15", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
});

test("lab t15 render tiếng Anh qua site.locale", async ({ page }) => {
  await page.goto("/lab/sections/t15?lang=en", { waitUntil: "networkidle" });
  await expect(page.locator('[data-section-type="hero"] h1')).toContainText("Clean power from");
  await expect(page.locator("#du-toan").getByLabel("Average monthly electricity bill")).toBeVisible();
});
