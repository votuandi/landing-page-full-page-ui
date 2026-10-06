// Dùng compiler có sẵn, không thêm framework test/dependency.
const ts = require("typescript"),
  fs = require("fs"),
  vm = require("vm"),
  assert = require("node:assert/strict");
function load(path) {
  const module = { exports: {} };
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(path, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    }).outputText,
    { module, exports: module.exports, require, Intl, console },
  );
  return module.exports;
}
const c = load("src/lib/solar-calc.ts"),
  d = load("src/content/solar/data.ts");
assert.equal(d.pvout.length, 34);
assert.equal(new Set(d.pvout.map((p) => p.id)).size, 34);
assert.ok(
  Math.abs(d.assumptions.monthlyFactors.reduce((s, v) => s + v, 0) - 12) < 1e-9,
);
for (const p of d.pricing) {
  const province = d.pvout.find((x) => x.id === d.assumptions.defaultProvince),
    a = d.assumptions,
    r = c.estimate(p, province, a);
  assert.equal(r.dailyKwh, p.kwp * province.pvout * a.pr);
  assert.equal(
    r.monthlySaving,
    r.dailyKwh * 30 * a.electricityPrice * a.selfUse[p.type],
  );
  assert.equal(r.paybackYears, p.price / (r.monthlySaving * 12));
  assert.equal(r.cumulative[0].net, -p.price);
  assert.equal(r.cumulative[5].net, r.annualSaving * 5 - p.price);
  assert.ok(
    Math.abs(r.monthly.reduce((s, m) => s + m.kwh, 0) - r.annualKwh) < 1e-7,
  );
  const changed = c.estimate({ ...p, price: p.price * 2 }, province, a);
  assert.equal(changed.paybackYears, r.paybackYears * 2);
  assert.equal(changed.cumulative[5].net, r.annualSaving * 5 - p.price * 2);
  assert.equal(
    c.installment(p.price, 12, r.monthlySaving).extra,
    p.price / 12 - r.monthlySaving,
  );
  assert.ok(
    Math.abs(
      c.suggestKwp(r.monthlySaving, "money", p.type, province, a) - p.kwp,
    ) < 1e-9,
  );
}
assert.equal(
  c.packagesForBill(d.pricing, 1500000, "money", d.assumptions)[0].id,
  "comfort-hoa-luoi",
);
assert.equal(
  c.packagesForBill(d.pricing, 60000000, "money", d.assumptions).length,
  2,
);
for (const value of [0, -1, NaN, Infinity])
  assert.throws(() =>
    c.suggestKwp(value, "money", "hybrid", d.pvout[0], d.assumptions),
  );
assert.throws(() => c.installment(1000, 0, 0));
console.log(
  "PASS: 12 gói riêng biệt, 34 tỉnh, ranh giới hóa đơn, công thức, giá thay đổi, trả góp và đầu vào không hợp lệ.",
);
