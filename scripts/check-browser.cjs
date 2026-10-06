const { spawn } = require("node:child_process"),
  fs = require("node:fs"),
  assert = require("node:assert/strict"),
  path = require("node:path");
const { pathToFileURL } = require("node:url");
const qaResolve = (name) =>
  require.resolve(
    name,
    process.env.QA_NODE_MODULES
      ? { paths: [path.dirname(process.env.QA_NODE_MODULES)] }
      : undefined,
  );
const qaRequire = (name) => require(qaResolve(name));
const browserPath = process.env.QA_CHROMIUM_PATH;
if (!browserPath)
  throw new Error(
    "Set QA_CHROMIUM_PATH to your Chromium/Chrome executable. See docs/QA-template-10.md.",
  );
const { chromium } = qaRequire("playwright");
const Chrome = {
  args: [
    "--no-sandbox",
    "--no-zygote",
    "--disable-dev-shm-usage",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--window-size=412,823",
    "--run-all-compositor-stages-before-draw",
  ],
};
const AxeBuilder = qaRequire("@axe-core/playwright").default;
const root = path.resolve(process.env.QA_OUTPUT_DIR || ".qa-results");
fs.mkdirSync(root, { recursive: true });
const base = "http://127.0.0.1:3010",
  results = {
    responsive: [],
    flows: [],
    consoleErrors: [],
    failedRequests: [],
    a11y: [],
    lighthouse: {},
  };
(async () => {
  const server = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      "3010",
    ],
    {
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, LEAD_WEBHOOK_URL: "", LEAD_WEBHOOK_TOKEN: "" },
    },
  );
  let browser, chrome;
  let serverLog = "";
  server.stdout.on("data", (d) => (serverLog += d));
  server.stderr.on("data", (d) => (serverLog += d));
  try {
    for (let i = 0; i < 80; i++) {
      await new Promise((r) => setTimeout(r, 250));
      try {
        if ((await fetch(base)).ok) break;
      } catch {}
    }
    browser = await chromium.launch({
      executablePath: browserPath,
      args: Chrome.args.filter((a) => !a.startsWith("--headless")),
      headless: true,
    });
    const routes = [
      "/",
      "/giai-phap/nha-may",
      "/giai-phap/chuoi-cua-hang",
      "/giai-phap/ho-gia-dinh",
      "/service",
      "/about-us",
      "/product",
      "/product/bien-tan-hybrid-10kw",
      "/project/phan-bon-dong-xanh",
      "/project/ca-phe-drinking",
      "/project/khu-dan-cu-vuon-sen",
      "/news",
      "/news/2",
      "/contact-us",
    ];
    const context = await browser.newContext({
      viewport: { width: 360, height: 900 },
    });
    const page = await context.newPage();
    page.on("pageerror", (e) => results.consoleErrors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") results.consoleErrors.push(m.text());
    });
    page.on("response", (r) => {
      if (r.status() >= 400)
        results.failedRequests.push({ url: r.url(), status: r.status() });
    });
    for (const width of [360, 768, 1280, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of routes) {
        await page.goto(base + route, { waitUntil: "networkidle" });
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth,
        );
        const h1 = await page.locator("h1").count();
        assert.equal(overflow, false, `overflow ${width} ${route}`);
        assert.equal(h1, 1, `h1 ${route}`);
        const broken = await page
          .locator("img")
          .evaluateAll((imgs) =>
            imgs
              .filter((i) => i.complete && i.naturalWidth === 0)
              .map((i) => i.src),
          );
        assert.equal(broken.length, 0, `broken images ${route}`);
        results.responsive.push({ width, route, overflow, h1 });
      }
      await page.goto(base, { waitUntil: "networkidle" });
      await page.screenshot({ path: root + `/template10-${width}.png` });
    }
    await page.setViewportSize({ width: 360, height: 900 });
    for (const [id, label] of [
      ["factory", "Nhà máy"],
      ["retail", "Cửa hàng"],
      ["home", "Gia đình"],
    ]) {
      await page.goto(base + "/?segment=" + id + "&utm_source=demo");
      await page.waitForFunction(
        (s) => document.querySelector("h1").textContent.includes(s),
        id === "factory"
          ? "nhà xưởng"
          : id === "retail"
            ? "chuỗi cửa hàng"
            : "Gia đình",
      );
      assert.equal(
        await page.locator('select[name="segment"]').inputValue(),
        id,
      );
      results.flows.push("query " + id);
    }
    await page.goto(base, { waitUntil: "networkidle" });
    await page
      .getByRole("button", { name: "Cửa hàng", exact: true })
      .first()
      .click();
    assert.ok(page.url().includes("segment=retail"));
    await page.reload();
    await page.waitForFunction(() =>
      document.querySelector("h1").textContent.includes("chuỗi"),
    );
    assert.ok((await page.locator("h1").innerText()).includes("chuỗi"));
    results.flows.push("hero selection persists on reload");
    await page.locator("#may-tinh").scrollIntoViewIfNeeded();
    await page
      .locator("#may-tinh")
      .getByRole("button", { name: "Gia đình", exact: true })
      .click();
    await page.locator("#estimate-value").fill("4500000");
    await page.locator("#estimate-region").selectOption("north");
    await page
      .getByRole("link", { name: "Nhận báo giá chi tiết", exact: true })
      .click();
    await page.waitForURL("**/contact-us?**");
    await page.waitForFunction(
      () => document.querySelector('select[name="segment"]').value === "home",
    );
    assert.equal(
      await page.locator('select[name="segment"]').inputValue(),
      "home",
    );
    assert.ok(
      (await page.locator("textarea").inputValue()).includes("4.500.000"),
    );
    assert.ok(
      (await page.locator("textarea").inputValue()).includes("Miền Bắc"),
    );
    results.flows.push("bill result prefills contact");
    await page.locator('select[name="segment"]').selectOption("retail");
    assert.equal(
      await page.locator('select[name="segment"]').inputValue(),
      "retail",
    );
    results.flows.push("contact segment remains editable");
    await page
      .getByLabel("Họ và tên", { exact: true })
      .fill("Khách hàng kiểm thử");
    await page.getByLabel("Số điện thoại", { exact: true }).fill("0901234567");
    await page.getByRole("checkbox").check();
    await page
      .getByRole("button", { name: "Nhận tư vấn & khảo sát", exact: true })
      .click();
    await page
      .getByText("Nội dung tư vấn đã sẵn sàng.", { exact: true })
      .waitFor();
    results.flows.push("lead manual handoff reports not sent");
    await page.goto(base + "/?segment=factory", { waitUntil: "networkidle" });
    await page.waitForFunction(() =>
      document.querySelector("h1").textContent.includes("nhà xưởng"),
    );
    await page
      .getByRole("button", { name: "Diện tích mái", exact: true })
      .click();
    await page.locator("#estimate-value").fill("600");
    await page.waitForFunction(() =>
      document.querySelector("#may-tinh a")?.href.includes("value=600"),
    );
    await page
      .getByRole("link", { name: "Nhận báo giá chi tiết", exact: true })
      .click();
    await page.waitForURL("**/contact-us?**");
    await page.waitForFunction(() =>
      document.querySelector("textarea")?.value.includes("100 kWp"),
    );
    assert.ok(
      (await page.locator("textarea").inputValue()).includes("100 kWp"),
    );
    results.flows.push("roof result prefills 100 kWp");
    await page.goto(base, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Tạm dừng chuyển động" }).click();
    assert.equal(
      await page
        .locator(".marquee-track")
        .evaluate((el) => getComputedStyle(el).animationPlayState),
      "paused",
    );
    await page
      .getByRole("button", { name: "Nông nghiệp", exact: true })
      .click();
    assert.equal(
      await page.locator(".marquee-group").first().locator("li").count(),
      1,
    );
    results.flows.push("marquee industry filter and pause");
    const reviewGroup = page.getByRole("group", {
      name: "Lọc nhận xét theo khách hàng",
    });
    await reviewGroup.getByRole("button", { name: "Gia đình" }).click();
    assert.ok(
      (
        await page.getByText("Nhận xét 1 trên 2", { exact: true }).innerText()
      ).includes("2"),
    );
    await page
      .getByRole("button", { name: "Nhận xét tiếp theo", exact: true })
      .click();
    await page.getByText("Nhận xét 2 trên 2", { exact: true }).waitFor();
    results.flows.push("filtered carousel navigates");
    await page.goto(base + "/product");
    await page
      .getByRole("button", { name: "Thêm vào yêu cầu báo giá", exact: true })
      .first()
      .click();
    await page.getByRole("dialog").waitFor();
    await page.keyboard.press("Escape");
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    assert.equal(await page.getByRole("dialog").count(), 0);
    await page.getByRole("button", { name: /Mở yêu cầu báo giá/ }).click();
    await page
      .getByRole("link", { name: "Tiếp tục gửi yêu cầu", exact: true })
      .click();
    await page.waitForURL("**/contact-us?**");
    await page.waitForFunction(() =>
      document.querySelector("textarea")?.value.includes("Tấm pin"),
    );
    assert.ok(
      (await page.locator("textarea").inputValue()).includes("Tấm pin"),
    );
    results.flows.push("RFQ dialog escape, focus and prefill");
    for (const route of [
      "/",
      "/giai-phap/nha-may",
      "/giai-phap/chuoi-cua-hang",
      "/giai-phap/ho-gia-dinh",
      "/contact-us",
      "/product",
    ]) {
      await page.goto(base + route, { waitUntil: "networkidle" });
      const axe = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      results.a11y.push({
        route,
        violations: axe.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          nodes: v.nodes.map((n) => n.target),
        })),
      });
    }
    const invalid = await fetch(base + "/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: "abc" }),
    });
    assert.equal(invalid.status, 400);
    const malformed = await fetch(base + "/api/lead", {
      method: "POST",
      body: "{",
    });
    assert.equal(malformed.status, 400);
    results.flows.push("lead API invalid payload rejects");
    await browser.close();
    browser = null;
    chrome = spawn(
      browserPath,
      [
        "--no-sandbox",
        "--headless",
        "--no-zygote",
        "--disable-dev-shm-usage",
        "--use-gl=angle",
        "--use-angle=swiftshader",
        "--enable-unsafe-swiftshader",
        "--window-size=412,823",
        "--run-all-compositor-stages-before-draw",
        "--remote-debugging-port=9222",
      ],
      { stdio: "ignore" },
    );
    await new Promise((r) => setTimeout(r, 1500));
    const { default: lighthouse } = await import(
      pathToFileURL(qaResolve("lighthouse")).href
    );
    for (const [name, route] of [
      ["home", "/"],
      ["factory", "/giai-phap/nha-may"],
      ["retail", "/giai-phap/chuoi-cua-hang"],
      ["family", "/giai-phap/ho-gia-dinh"],
    ]) {
      const lh = await lighthouse(base + route, {
        port: 9222,
        output: "json",
        onlyCategories: ["performance", "accessibility", "seo"],
        logLevel: "error",
      });
      fs.writeFileSync(root + `/lighthouse10-${name}.json`, lh.report);
      results.lighthouse[name] = {
        scores: Object.fromEntries(
          Object.entries(lh.lhr.categories).map(([k, v]) => [
            k,
            v.score === null ? null : Math.round(v.score * 100),
          ]),
        ),
        errors: lh.lhr.runWarnings,
        metrics: Object.fromEntries(
          [
            "first-contentful-paint",
            "largest-contentful-paint",
            "speed-index",
            "total-blocking-time",
            "cumulative-layout-shift",
          ].map((id) => [
            id,
            {
              value: lh.lhr.audits[id].numericValue,
              error: lh.lhr.audits[id].errorMessage,
            },
          ]),
        ),
      };
      console.log(name, results.lighthouse[name]);
    }
  } finally {
    if (browser) await browser.close();
    if (chrome) chrome.kill();
    server.kill();
    fs.writeFileSync(
      root + "/qa-template10.json",
      JSON.stringify(results, null, 2),
    );
    fs.writeFileSync(root + "/qa-server.log", serverLog);
  }
  console.log(
    "QA complete",
    results.flows.length,
    "flows",
    results.responsive.length,
    "responsive pages",
  );
  assert.equal(results.consoleErrors.length, 0);
  assert.equal(results.failedRequests.length, 0);
  assert.equal(
    results.a11y.reduce((n, a) => n + a.violations.length, 0),
    0,
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
