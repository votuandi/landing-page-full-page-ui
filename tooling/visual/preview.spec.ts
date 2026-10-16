import { expect, test } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const slug = "preview-e5-t15", other = "preview-e5-t12";
const origin = (host: string) => `http://${host}:3212`;
const preview = origin(`${slug}.preview.solar.localhost`);
function fixture(action: string) {
  return execFileSync(process.execPath, ["--import", "tsx", "scripts/preview-browser-fixture.ts", action], {
    cwd: resolve(__dirname, "../../apps/web"), encoding: "utf8", timeout: 180_000,
  }).trim();
}
test.beforeAll(async ({ request }) => {
  test.setTimeout(600_000);
  // Compile API routes before a synchronous fixture needs to call revalidation.
  expect((await request.post("http://localhost:3212/api/revalidate", { timeout: 180_000 })).status()).toBe(401);
  expect((await request.get("http://localhost:3212/api/preview", { headers: { Host: "t15.localhost" }, timeout: 180_000 })).status()).toBe(401);
  fixture("setup");
  expect((await request.get("http://localhost:3212/", { headers: { Host: `${slug}.solar.localhost` }, timeout: 180_000 })).status()).toBe(200);
});
test.afterAll(() => { fixture("cleanup"); });

test("same-site admin iframe enters draft, survives reload and leaves public content unchanged", async ({ page, browserName }, info) => {
  // The intercepted admin document has no local IP classification; explicitly allow the local test server.
  if (browserName === "chromium") await page.context().grantPermissions(["local-network-access"]);
  const token = fixture("token");
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.route(`http://${slug}.admin.solar.localhost:3212/__frame`, route => route.fulfill({
    contentType: "text/html", body: `<html><body><iframe title="Xem trước" style="width:100%;height:850px" src="${preview}/api/preview?token=${token}&path=/"></iframe></body></html>`,
  }));
  const entryResponse = page.waitForResponse(response => response.url().startsWith(`${preview}/api/preview?`));
  await page.goto(origin(`${slug}.admin.solar.localhost`) + "/__frame");
  expect((await entryResponse).headers()["cache-control"]).toBe("private, no-store");
  const frame = page.frameLocator("iframe");
  await expect(frame.locator("main")).toContainText("[DỮ LIỆU MẪU] nháp");
  const child = page.frames().find(item => item.url() === `${preview}/`);
  expect(child).toBeTruthy();
  const response = await child!.goto(`${preview}/`);
  expect(response?.status()).toBe(200);
  // Next 16.3 next dev overwrites rendered HTML Cache-Control in base-server; production preserves proxy headers.
  expect(response?.headers()["cache-control"]).toBe("no-cache, must-revalidate");
  expect(response?.headers()["x-robots-tag"]).toBe("noindex");
  expect(response?.headers()["content-security-policy"]).toBe(`frame-ancestors http://${slug}.admin.solar.localhost:3212`);
  await expect(frame.locator("main")).toContainText("[DỮ LIỆU MẪU] nháp");
  await page.screenshot({ path: info.outputPath("preview-iframe.png"), fullPage: true });
  const publicPage = await page.context().newPage();
  await publicPage.goto(origin(`${slug}.solar.localhost`));
  await expect(publicPage.locator("main")).toContainText("[DỮ LIỆU MẪU] bản chính");
  await expect(publicPage.locator("main")).not.toContainText("[DỮ LIỆU MẪU] nháp");
  expect(errors).toEqual([]);
  await publicPage.close();
});

test("missing, expired, reused and wrong-host tokens return 401; stolen cookie cannot cross tenant", async ({ request, browser }) => {
  const entry = (token: string, host = `${slug}.preview.solar.localhost`, path = "/") => request.get(`http://localhost:3212/api/preview?token=${token}&path=${encodeURIComponent(path)}`, {
    headers: { Host: host }, maxRedirects: 0,
  });
  for (const token of ["", "invalid", fixture("expired")]) expect((await entry(token)).status()).toBe(401);
  const token = fixture("token");
  expect((await entry(token, `${other}.preview.solar.localhost`)).status()).toBe(401);
  const accepted = await entry(token, undefined, "//evil.example");
  expect(accepted.status()).toBe(307);
  expect(accepted.headers().location).toBe("/");
  expect((await entry(token)).status()).toBe(401);
  const context = await browser.newContext();
  try {
    // Copy the signed preview value to another host as an attacker could; tenant/site MAC must reject it.
    const cookie = (await request.storageState()).cookies.find(item => item.name === "preview");
    expect(cookie).toBeTruthy();
    const page = await context.newPage();
    await context.addCookies([{ ...cookie!, domain: `${slug}.preview.solar.localhost` }]);
    expect((await page.goto(preview))?.status(), "signed cookie alone cannot enable Draft Mode").toBe(404);
    await context.addCookies([{ ...cookie!, domain: `${other}.preview.solar.localhost` }]);
    expect((await page.goto(origin(`${other}.preview.solar.localhost`)))?.status()).toBe(401);
  } finally { await context.close(); }
});
