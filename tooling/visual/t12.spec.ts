import { expect, test } from "@playwright/test";

const calculatorUrl = "/lab/sections/calculator?variant=t12&themes=t12";

test("five-step estimator preserves inputs, blocks an invalid roof and submits the displayed estimate", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  // The app shell can open its consultation popup while the section is under test.
  await page.addLocatorHandler(page.getByRole("button", { name: "Đóng popup tư vấn" }), async (close) => { await close.click(); });
  let payload: Record<string, unknown> | undefined;
  await page.route("**/api/lead", async (route) => {
    payload = route.request().postDataJSON();
    await route.fulfill({ json: { ok: true } });
  });
  await page.goto(calculatorUrl, { waitUntil: "networkidle" });
  const calc = page.locator('[data-lab-cell="t12--t12"]');
  await calc.getByText("Cửa hàng & chuỗi", { exact: true }).click();
  await expect(calc.getByLabel("Tiền điện trung bình mỗi tháng", { exact: true })).toBeVisible();
  await calc.getByLabel("Tiền điện trung bình mỗi tháng", { exact: true }).fill("12.000.000");
  const cost = calc.locator("[data-calculator-cost]");
  const billCost = await cost.textContent();
  await calc.getByRole("button", { name: "Tiếp tục", exact: true }).click();
  await calc.getByLabel("Diện tích mái (m²)", { exact: true }).fill("0");
  await expect(calc.getByRole("button", { name: "Tiếp tục", exact: true })).toBeDisabled();
  await expect(calc.getByRole("button", { name: /^Bước 4:/ })).toBeDisabled();
  await calc.getByLabel("Diện tích mái (m²)", { exact: true }).fill("120");
  await calc.getByRole("button", { name: "Bước trước", exact: true }).click();
  await expect(calc.getByLabel("Tiền điện trung bình mỗi tháng", { exact: true })).toHaveValue("12.000.000");
  await calc.getByRole("button", { name: "Tiếp tục", exact: true }).click();
  await expect(calc.getByLabel("Diện tích mái (m²)", { exact: true })).toHaveValue("120");
  await calc.getByRole("button", { name: "Tiếp tục", exact: true }).click();
  await calc.getByLabel("Tỉnh/thành", { exact: true }).selectOption("Hà Nội");
  await calc.getByRole("button", { name: "Tiếp tục", exact: true }).click();
  await expect(calc.getByRole("heading", { name: "Điện dùng vào ban ngày", exact: true })).toBeFocused();
  const ratio = calc.getByRole("slider", { name: /Điện dùng vào ban ngày/ });
  await ratio.focus();
  await ratio.press("Home");
  await expect(cost).not.toHaveText(billCost ?? "");
  await calc.getByLabel("Họ và tên").fill("[DỮ LIỆU MẪU] Khách test");
  await calc.getByLabel("Số điện thoại di động").fill("0901234567");
  await calc.locator('form button[type="submit"], form button:not([type])').click();
  await expect(calc.getByRole("status")).toContainText("Đã nhận yêu cầu");
  expect(payload?.source).toBe("calculator");
  expect(payload?.estimate).toMatchObject({
    "Hóa đơn/tháng (đ)": "12.000.000", "Diện tích mái (m²)": 120, "Tỉnh/thành": "Hà Nội", "Tỷ lệ ban ngày (%)": 10,
  });
  expect(errors).toEqual([]);
});

test("URL prefill opens the bill step and retains the supplied bill", async ({ page }) => {
  await page.goto(`${calculatorUrl}&phan-khuc=trang-trai&hoa-don=37000000`, { waitUntil: "networkidle" });
  await expect(page.getByLabel("Tiền điện trung bình mỗi tháng", { exact: true })).toHaveValue("37.000.000");
  await expect(page.getByRole("button", { name: /^Bước 2:/ })).toHaveAttribute("aria-current", "step");
});

test("t15 keeps its inline inputs and live calculation after sharing the wizard implementation", async ({ page }) => {
  await page.goto("/lab/sections/calculator?variant=t15&themes=t12", { waitUntil: "networkidle" });
  await expect(page.getByRole("list", { name: "Tiến trình" })).toHaveCount(0);
  const cost = page.locator("[data-calculator-cost]");
  const before = await cost.textContent();
  await page.getByLabel("Tiền điện trung bình mỗi tháng", { exact: true }).fill("5.000.000");
  await expect(cost).not.toHaveText(before ?? "");
  await expect(page.getByLabel("Diện tích mái (m²)", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Tỉnh/thành", { exact: true })).toBeVisible();
});

test("all five inputs and results remain visible without JavaScript", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: "reduce" });
  try {
    const page = await context.newPage();
    await page.goto(`${baseURL}${calculatorUrl}`);
    for (const label of ["Tiền điện trung bình mỗi tháng", "Diện tích mái (m²)", "Tỉnh/thành"]) {
      await expect(page.getByLabel(label, { exact: true })).toBeVisible();
    }
    await expect(page.getByRole("slider", { name: /Điện dùng vào ban ngày/ })).toBeVisible();
    await expect(page.locator("[data-calculator-result]")).toBeVisible();
  } finally { await context.close(); }
});

test("ported variants render in both themes at mobile and desktop widths without overflow", async ({ page }) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const type of ["hero", "segments", "projects", "calculator"]) {
      await page.goto(`/lab/sections/${type}?variant=t12&themes=t12,t15`, { waitUntil: "networkidle" });
      await expect(page.locator("[data-section-fallback]")).toHaveCount(0);
      for (const theme of ["t12", "t15"]) await expect(page.locator(`[data-lab-cell="t12--${theme}"] [data-section-id]`)).not.toBeEmpty();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
  }
});

test("Emerald Dusk applies dark tokens and the wizard also works in English", async ({ page }) => {
  await page.goto(`${calculatorUrl}&lang=en`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Chuyển sang giao diện tối" }).click();
  const calc = page.locator('[data-lab-cell="t12--t12"]');
  await expect(calc.getByRole("button", { name: /^Step 1:/ })).toHaveAttribute("aria-current", "step");
  expect(await calc.evaluate((element) => getComputedStyle(element).getPropertyValue("--c-bg").trim())).toBe("11 31 28");
  await calc.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(calc.getByLabel("Average monthly electricity bill", { exact: true })).toBeVisible();
});
