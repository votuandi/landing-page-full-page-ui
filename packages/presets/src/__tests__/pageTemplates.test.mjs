import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
const require = createRequire(import.meta.url);

test("mẫu trang hợp lệ theo gói: every template × preset × pro/premium", () => {
  const { PAGE_TEMPLATES, presets, presetStructure, validateSiteStructure } = require("../index.ts");
  const { sectionRegistry } = require("@solar/sections");
  const { plans } = require("../../../plans/plans.ts");
  assert.deepEqual(Object.keys(PAGE_TEMPLATES), ["ho-gia-dinh", "nha-xuong", "tuyen-dai-ly"]);
  assert.deepEqual(Object.values(PAGE_TEMPLATES).map(t => t.label.vi), ["Landing hộ gia đình", "Landing nhà xưởng", "Tuyển đại lý"]);
  for (const preset of presets) for (const planId of ["pro", "premium"]) for (const template of Object.values(PAGE_TEMPLATES)) {
    const can = f => plans[planId].features.has(f);
    const base = presetStructure(preset, can);
    const sections = template.sections.filter(type => {
      const def = sectionRegistry.getType(type); assert.ok(def, type);
      return !def.meta.entitlement || can(def.meta.entitlement);
    }).map((type, i) => {
      const variant = preset.sections.find(s => s.type === type)?.variant ?? "t15";
      assert.ok(sectionRegistry.variantsOf(type).includes(variant));
      return { id: `template-${i}`, type, variant, enabled: true };
    });
    assert.deepEqual(validateSiteStructure({ ...base, pages: [...base.pages, { slug: template.slug, sections }] }, { can, pagesLimit: plans[planId].limits.pages, baseline: base }), [], `${preset.id}/${planId}/${template.slug}`);
  }
});
