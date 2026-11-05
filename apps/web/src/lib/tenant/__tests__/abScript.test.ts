import assert from "node:assert/strict";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { abScript, withAbVariant } from "../abTest";
import { sectionRegistry } from "@solar/sections";

const id = "e8000000-0000-4000-8000-000000000001";
function run(cookie: string, random = 0.9, blocked = false) {
  let assigned = "", written = "";
  const beacons: unknown[] = [];
  const document = { documentElement: { setAttribute: (name: string, value: string) => { assert.equal(name, "data-ab"); assigned = value; } },
    get cookie() { if (blocked) throw new Error("blocked"); return cookie; },
    set cookie(value: string) { if (blocked) throw new Error("blocked"); written = value; } };
  runInNewContext(abScript(id), { document, Math: { random: () => random }, navigator: { sendBeacon: (url: string, payload: string) => beacons.push([url, JSON.parse(payload)]) } });
  return { assigned, written, beacons };
}
test("giữ phiên bản A/B từ cookie, lần đầu chia 50/50 và lưu 90 ngày", () => {
  for (const v of ["A", "B"]) {
    const result = run(`other=x; ab_${id}=${v}`, v === "A" ? 0.9 : 0.1);
    assert.equal(result.assigned, v); assert.equal(result.written, "");
    assert.deepEqual(result.beacons, [["/api/ab", { t: id, v }]]);
  }
  for (const [random, v] of [[0.1, "A"], [0.9, "B"]] as const) {
    for (const cookie of ["", `ab_${id}=C`, `ab_old=B`, `prefix_ab_${id}=A`]) {
      const result = run(cookie, random);
      assert.equal(result.assigned, v);
      assert.match(result.written, new RegExp(`^ab_${id}=${v};`));
      assert.match(result.written, /path=\/;max-age=7776000;samesite=lax/i);
    }
  }
});
test("cookie bị chặn vẫn chọn phiên bản và gửi lượt xem; id không hợp lệ không sinh script", () => {
  const result = run("", 0.1, true);
  assert.equal(result.assigned, "A"); assert.equal(result.beacons.length, 1);
  assert.throws(() => abScript('</script><script>alert(1)</script>'));
});
test("withAbVariant chỉ đổi title và nhãn CTA, giữ link và dữ liệu A", () => {
  const a = sectionRegistry.types.hero.defaults, before = structuredClone(a);
  const b = { title: { lead: { vi: "B" }, highlight: { vi: "" }, sub: { vi: "" }, subHighlight: { vi: "" } }, ctaLabel: { vi: "Nút B" } };
  const result = withAbVariant(a, b);
  assert.deepEqual(a, before); assert.deepEqual(result.title, b.title);
  assert.deepEqual(result.primaryCta, { ...a.primaryCta, label: b.ctaLabel });
  assert.deepEqual(sectionRegistry.types.hero.schema.parse(result), result);
});
