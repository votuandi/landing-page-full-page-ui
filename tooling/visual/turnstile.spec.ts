import { expect, test, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

function fixture(action: string) {
  return execFileSync(process.execPath, ["--import", "tsx", "scripts/tenant-browser-fixture.ts", action], { cwd: resolve(__dirname, "../../apps/web"), encoding: "utf8" });
}
test.beforeAll(() => { fixture("setup"); fixture("turnstile"); });
test.afterAll(() => { fixture("cleanup"); });

async function widget(page: Page) {
  await page.route("https://challenges.cloudflare.com/turnstile/v0/api.js**", route => route.fulfill({ contentType: "application/javascript", body: `
    (() => {
      const widgets = new Map(); let sequence = 0;
      window.turnstile = {
        render(element, options) {
          if (options.sitekey !== '1x00000000000000000000AA') throw new Error('test site key missing');
          const input = document.createElement('input'); input.type = 'hidden'; input.name = 'cf-turnstile-response';
          input.value = 'XXXX.DUMMY.TOKEN.XXXX.spent'; element.append(input);
          const id = 'test-widget-' + (++sequence); widgets.set(id, input); return id;
        },
        reset(id) { const input = widgets.get(id); input.value = 'XXXX.DUMMY.TOKEN.XXXX'; input.dataset.reset = 'true'; }
      };
    })();` }));
}
async function exercise(page: Page, path: string, selector: string, dealer = false) {
  // The timed consult popup would cover the form's submit button.
  await page.addInitScript(() => sessionStorage.setItem("t15-consult-shown", "1"));
  await widget(page);
  const bodies: Record<string, unknown>[] = [];
  await page.route("**/api/lead", async route => {
    bodies.push(route.request().postDataJSON());
    if (bodies.length === 1) await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ ok: false, message: "Chưa thể gửi. Vui lòng thử lại." }) });
    else await route.continue();
  });
  await page.goto(`http://review.localhost:3213${path}`, { waitUntil: "networkidle" });
  const form = page.locator(selector).first();
  await expect(form.locator('input[name="cf-turnstile-response"]')).toHaveValue("XXXX.DUMMY.TOKEN.XXXX.spent");
  const name = "[DỮ LIỆU MẪU] Turnstile", phone = `09${String(Date.now()).slice(-8)}`;
  await form.locator('[name="name"]').fill(name); await form.locator('[name="phone"]').fill(phone);
  if (dealer) {
    await form.locator('[name="province"]').selectOption({ index: 1 });
    await form.locator('[name="businessType"]').selectOption({ index: 1 });
  }
  // Exercise the real anti-spam fill timer; the first request is injected 503, the retry hits Siteverify + DB.
  await page.waitForTimeout(3_100);
  await form.locator('button[type="submit"], button:not([type])').click();
  await expect(form.getByRole("alert")).toContainText("Chưa thể gửi");
  await expect(form.locator('input[name="cf-turnstile-response"][data-reset="true"]')).toHaveValue("XXXX.DUMMY.TOKEN.XXXX");
  await expect(form.locator('[name="name"]')).toHaveValue(name); await expect(form.locator('[name="phone"]')).toHaveValue(phone);
  const response = page.waitForResponse(res => res.url().endsWith("/api/lead") && res.request().method() === "POST");
  await form.locator('button[type="submit"], button:not([type])').click();
  const received = await response;
  expect(received.status()).toBe(200); expect((await received.json()).id).toBeTruthy();
  expect(bodies).toHaveLength(2);
  expect(bodies[0]["cf-turnstile-response"]).not.toBe(bodies[1]["cf-turnstile-response"]);
  expect(bodies[1]["cf-turnstile-response"]).toBe("XXXX.DUMMY.TOKEN.XXXX");
  for (const body of bodies) { expect(body.name).toBe(name); expect(body.phone).toBe(phone); expect(Number(body.elapsedMs)).toBeGreaterThanOrEqual(3_000); }
  await expect(form).toHaveCount(0);
}
test("Turnstile: section LeadForm 503 → reset → token mới → 200, giữ dữ liệu", async ({ page }) => {
  await exercise(page, "/", '[data-section-type="lead-form"] form');
});
test("Turnstile: dealer 503 → reset → token mới → 200, giữ dữ liệu", async ({ page }) => {
  await exercise(page, "/", '[data-section-type="dealer"] form', true);
});
test("Turnstile: LeadForm giải pháp 503 → reset → token mới → 200, giữ dữ liệu", async ({ page }) => {
  await exercise(page, "/giai-phap/solar-gia-dinh", 'main form:has(input[name="phone"])');
});
