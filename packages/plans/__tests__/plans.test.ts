import assert from "node:assert/strict";
import test from "node:test";
import { FEATURES, PLAN_IDS, plans, getPlan, isFeature, isPlanId, featureLabels, featureDependencies, limitLabels, themeLabels, type Feature } from "../index";

const basic = ["leadForm", "blog", "customDomain"];
const pro = ["calculator", "quoteForm", "packages", "faq", "testimonials", "stats", "energyMonitoring", "investmentModels", "trust", "social", "leadWebhook", "leadInbox", "sectionReorder", "variantSwitch"];
const premium = ["shorts", "tiktok", "catalog", "quoteCart", "dealer", "branchMap", "press", "bilingual", "leadExport", "themeOverride", "builder", "landingPages", "abTest"];

test("plans match the independent tier matrix, themes, labels and quotas", () => {
  assert.deepEqual(PLAN_IDS, ["basic", "pro", "premium"]);
  const expected = [basic, [...basic, ...pro], [...basic, ...pro, ...premium]];
  const themes = [["classic"], ["classic", "pro"], ["classic", "pro", "signature"]];
  const limits = [[1, 1, 1, 1], [1, 5, 3, 3], [3, 20, 20, 10]];
  PLAN_IDS.forEach((id, i) => {
    const plan = getPlan(id)!;
    assert.equal(plan.id, id);
    assert.equal(plan.name, ["Cơ bản", "Nâng cao", "Cao cấp"][i]);
    assert.deepEqual([...plan.features].sort(), expected[i].slice().sort());
    assert.deepEqual(plan.themes, themes[i]);
    assert.deepEqual([plan.limits.domains, plan.limits.mediaGb, plan.limits.pages, plan.limits.users], limits[i]);
  });
  assert.equal(new Set([...basic, ...pro, ...premium]).size, 30);
  assert.equal(new Set(FEATURES).size, FEATURES.length);
  assert.deepEqual([...new Set(PLAN_IDS.flatMap(id => [...plans[id].features]))].sort(), [...FEATURES].sort());
  assert.deepEqual([...FEATURES].sort(), [...basic, ...pro, ...premium].sort());
});

test("labels cover all keys; dependencies use valid names and have no cycles", () => {
  assert.deepEqual(Object.keys(featureLabels).sort(), [...FEATURES].sort());
  assert.deepEqual(Object.keys(limitLabels).sort(), ["domains", "mediaGb", "pages", "users"]);
  assert.deepEqual(Object.keys(themeLabels).sort(), ["classic", "pro", "signature"]);
  for (const label of [...Object.values(featureLabels), ...Object.values(themeLabels), ...Object.values(limitLabels)]) assert.ok(label.trim());
  assert.deepEqual(featureDependencies, { quoteCart: ["catalog"] });
  function visit(feature: Feature, path: Feature[]) {
    assert.ok(!path.includes(feature), `dependency cycle: ${[...path, feature]}`);
    for (const dependency of featureDependencies[feature] ?? []) {
      assert.ok(isFeature(dependency));
      visit(dependency, [...path, feature]);
    }
  }
  for (const feature of FEATURES) visit(feature, []);
  for (const feature of Object.keys(featureDependencies)) assert.ok(isFeature(feature));
});

test("unknown and prototype names fail closed", () => {
  for (const name of ["missing", "constructor", "__proto__", "toString", "", "BASIC"]) {
    assert.equal(getPlan(name), undefined);
    assert.equal(isPlanId(name), false);
    assert.equal(isFeature(name), false);
  }
  for (const id of PLAN_IDS) assert.ok(isPlanId(id));
  for (const feature of FEATURES) assert.ok(isFeature(feature));
});

test("public definitions cannot mutate rights, limits or themes between requests", () => {
  const plan = plans.basic;
  for (const method of ["add", "delete", "clear"]) assert.equal(method in plan.features, false);
  assert.ok(Object.isFrozen(plan.features));
  assert.throws(() => Object.assign(plan.limits, { users: 999 }), TypeError);
  assert.throws(() => (plan.themes as string[]).push("signature"), TypeError);
  assert.throws(() => Object.assign(plans, { basic: plans.premium }), TypeError);
  plan.features.forEach((value, key, set) => {
    assert.equal(value, key);
    assert.equal(set, plan.features);
    assert.equal("add" in set, false);
  });
  const copy = [...plan.features]; copy.push("builder");
  assert.equal(plan.features.has("builder"), false);
});
