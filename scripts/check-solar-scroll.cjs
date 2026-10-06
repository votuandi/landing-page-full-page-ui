/* QA dependencies stay outside the app; same variables as check-template-11.cjs. */
const { spawn } = require("node:child_process");
const assert = require("node:assert/strict");
const { chromium } = require(
  require.resolve("playwright-core", {
    paths: [process.env.QA_NODE_MODULES || process.cwd()],
  }),
);
const server = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3115",
  ],
  { stdio: "ignore" },
);
(async () => {
  let browser;
  try {
    for (let i = 0; i < 100; i++) {
      try {
        if ((await fetch("http://127.0.0.1:3115")).ok) break;
      } catch {}
      await new Promise((r) => setTimeout(r, 200));
    }
    browser = await chromium.launch({
      executablePath: process.env.QA_CHROMIUM_PATH,
      args: ["--no-sandbox", "--no-zygote", "--disable-dev-shm-usage"],
    });
    for (const width of [360, 768, 1280]) {
      const page = await browser.newPage({
        viewport: { width, height: 900 },
        reducedMotion: "no-preference",
      });
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto("http://127.0.0.1:3115");
      await page.locator(".solar-home[data-solar-motion]").waitFor();
      const heading = page.locator("#giai-phap .solar-section-heading");
      await page.waitForFunction(
        () =>
          getComputedStyle(
            document.querySelector("#giai-phap .solar-section-heading"),
          ).opacity === "0",
      );
      assert.equal(
        await heading.evaluate((e) => getComputedStyle(e).opacity),
        "0",
      );
      await heading.scrollIntoViewIfNeeded();
      await page.waitForFunction(() =>
        document
          .querySelector("#giai-phap .solar-section-heading")
          .hasAttribute("data-solar-shown"),
      );
      const duration = await heading.evaluate(
        (e) => getComputedStyle(e).transitionDuration,
      );
      assert.ok(duration.includes("0.6s"));
      await page.waitForTimeout(850);
      assert.equal(
        await heading.evaluate((e) => getComputedStyle(e).opacity),
        "1",
      );
      await page.evaluate(() => scrollTo(0, 0));
      await page.waitForTimeout(100);
      assert.equal(await heading.getAttribute("data-solar-shown"), "");
      await page.locator("#du-an").scrollIntoViewIfNeeded();
      await page
        .locator(".solar-project-filters")
        .getByRole("button")
        .last()
        .click();
      await page.waitForTimeout(850);
      assert.ok(await page.locator(".solar-project").count());
      await page.waitForFunction(() =>
        [...document.querySelectorAll(".solar-project")].every(
          (element) => getComputedStyle(element).opacity === "1",
        ),
      );
      for (const card of await page.locator(".solar-project").all())
        assert.equal(
          await card.evaluate((e) => getComputedStyle(e).opacity),
          "1",
        );
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.waitForFunction(
        () =>
          !document
            .querySelector(".solar-home")
            .hasAttribute("data-solar-motion"),
      );
      assert.equal(
        await heading.evaluate((e) => getComputedStyle(e).opacity),
        "1",
      );
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth),
        width,
      );
      assert.deepEqual(errors, []);
      await page.close();
    }
    const noJs = await browser.newPage({ javaScriptEnabled: false });
    await noJs.goto("http://127.0.0.1:3115");
    assert.equal(
      await noJs
        .locator("#giai-phap .solar-section-heading")
        .evaluate((e) => getComputedStyle(e).opacity),
      "1",
    );
    await noJs.close();
    console.log(
      "PASS: actual scroll reveals at 360/768/1280, 600ms transition, once-only display, filtered cards visible, reduced-motion toggle, no-JS fallback, zero overflow/runtime errors.",
    );
  } finally {
    await browser?.close();
    server.kill();
  }
})().catch((e) => {
  console.error(e);
  server.kill();
  process.exitCode = 1;
});
