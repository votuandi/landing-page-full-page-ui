// Kiểm tra bất biến tài chính và giới hạn, không cần thêm thư viện vào sản phẩm.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
function load(file, imports = {}) {
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2017,
    },
  }).outputText;
  const m = { exports: {} };
  new Function("exports", "module", "require", code)(
    m.exports,
    m,
    (name) => imports[name] ?? require(name),
  );
  return m.exports;
}
const data = load("src/content/site.ts");
const { estimateSolar, estimateMessage } = load("src/utils/estimate.ts", {
  "@/content/site": data,
});
let checks = 0;
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-6);
for (const segment of data.SEGMENT_IDS) {
  for (const region of Object.keys(data.CALCULATOR.regions)) {
    const bill = data.CALCULATOR.segments[segment].defaultBill;
    const b = estimateSolar({ segment, region, mode: "bill", value: bill });
    assert.ok(b);
    near(
      b.monthlySaving,
      bill * data.CALCULATOR.segments[segment].targetSaving,
    );
    near(b.annualSaving, b.monthlySaving * 12);
    near(b.paybackYears, b.investment / (b.annualSaving - b.maintenance));
    assert.ok(b.monthlySaving <= bill);
    assert.ok(b.co2Kg > 0);
    checks++;
    const r = estimateSolar({ segment, region, mode: "roof", value: 60 });
    near(r.kwp, 10);
    near(r.roofArea, 60);
    assert.ok(r.paybackYears > 0);
    checks++;
    for (const value of [0, -1, NaN, Infinity, 1e20]) {
      assert.equal(
        estimateSolar({ segment, region, mode: "bill", value }),
        null,
      );
      checks++;
    }
  }
}
const input = {
  segment: "home",
  region: "south",
  mode: "bill",
  value: 3000000,
};
const e = estimateSolar(input);
near(e.kwp, (3000000 * 0.35) / (3050 * 4.7 * 30 * 0.8 * 0.7));
const text = estimateMessage(input);
assert.ok(text.includes(data.COPY.reference));
assert.ok(text.includes("kWp"));
checks++;
const n = estimateSolar({ ...input, region: "north" });
assert.ok(n.kwp > e.kwp);
assert.ok(n.paybackYears > e.paybackYears);
checks++;
const tiny = estimateSolar({ ...input, value: 100000 });
assert.ok(tiny.monthlySaving <= 100000);
checks++;
assert.equal(estimateSolar({ ...input, segment: "unknown" }), null);
checks++;
for (const region of ["__proto__", "toString", "unknown"]) {
  assert.equal(estimateSolar({ ...input, region }), null);
  checks++;
}
console.log(`${checks} calculator scenarios passed`);
