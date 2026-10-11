import assert from "node:assert/strict";
import { test, mock } from "node:test";
import { z } from "zod";
import { defineSectionType } from "../define";
import { migrateSectionData, migrateSnapshot, missingMigrations } from "../migrate";
import { sectionRegistry } from "../registry";
import { widgetRegistry } from "../widgets/registry";

const v1Schema = z.object({ title: z.string() });
const demo = defineSectionType({
  type: "migration-demo", schemaVersion: 2,
  schema: v1Schema.extend({ note: z.string().optional() }), defaults: { title: "Demo" },
  meta: { label: { vi: "Demo" }, icon: "test" },
  migrations: { 1: (data) => ({ ...data, note: "Added" }) },
});

test("v1 → v2 preserves input and is idempotent; an old app can parse the result", () => {
  const input = { title: "Tenant title", extra: { keep: true } };
  const result = migrateSectionData(demo, 1, input);
  assert.deepEqual(result, { schemaVersion: 2, data: { ...input, note: "Added" }, changed: true });
  assert.deepEqual(input, { title: "Tenant title", extra: { keep: true } });
  assert.deepEqual(migrateSectionData(demo, result.schemaVersion, result.data), { ...result, changed: false });
  assert.deepEqual(v1Schema.parse(result.data), { title: input.title });
});

test("missing steps and corrupt data/versions fail with context", () => {
  const broken = { ...demo, schemaVersion: 3 };
  assert.deepEqual(missingMigrations(broken), [2]);
  assert.throws(() => migrateSectionData(broken, 1, {}), /migration-demo.*2.*3/);
  for (const data of [null, [], "bad"]) assert.throws(() => migrateSectionData(demo, 1, data), /migration-demo.*object/);
  for (const version of [0, -1, 1.5, NaN]) assert.throws(() => migrateSectionData(demo, version, {}), /version/i);
});

test("a newer version stays intact during rolling deployment and warns once", () => {
  const warn = mock.method(console, "warn", () => {});
  try {
    const data = { title: "Future", note: "Keep", future: true };
    for (let i = 0; i < 2; i++) assert.deepEqual(migrateSectionData(demo, 4, data), { schemaVersion: 4, data, changed: false });
    assert.equal(warn.mock.callCount(), 1);
    assert.deepEqual(v1Schema.parse(data), { title: "Future" });
  } finally { warn.mock.restore(); }
});

test("shorts v1 → v3 runs both steps and preserves tenant values", () => {
  const def = sectionRegistry.getType("shorts")!;
  const defaults = def.defaults as Record<string, unknown>;
  const { segmentLabels: _labels, channels: _channels, ...v1 } = defaults;
  const result = migrateSectionData(def, 1, v1);
  assert.equal(result.schemaVersion, 3);
  assert.deepEqual(result.data, { ...v1, segmentLabels: defaults.segmentLabels, channels: [] });
  assert.ok(def.schema.safeParse(result.data).success);
  const custom = { ...defaults, channels: [{ kind: "youtube", url: "https://example.com", label: "Tenant" }] };
  assert.deepEqual(migrateSectionData(def, 1, custom).data, custom);
});

test("CI guard: every section/widget version has a complete expand-only migration chain", () => {
  const addedKeys: Record<string, string[]> = {
    shorts: ["segmentLabels", "channels"], "site-header": ["controls"], trust: ["cardDetails"],
    "quote-cart": ["attachEstimateLabel", "estimateSummary"],
  };
  for (const def of [...Object.values(sectionRegistry.types), ...Object.values(widgetRegistry.types)]) {
    assert.deepEqual(missingMigrations(def), [], def.type);
    const defaults = def.defaults as Record<string, unknown>;
    assert.ok(def.schema.safeParse({ ...defaults, rollingDeployExtra: true }).success, `${def.type} must accept future keys`);
    for (const initial of [defaults, Object.fromEntries(Object.entries(defaults).filter(([key]) => !addedKeys[def.type]?.includes(key)))]) {
      let data = structuredClone(initial);
      for (let version = 1; version < def.schemaVersion; version++) {
        const before = structuredClone(data);
        data = def.migrations![version](data);
        for (const [key, value] of Object.entries(before)) assert.deepEqual(data[key], value, `${def.type} v${version} changed ${key}`);
      }
      assert.ok(def.schema.safeParse(data).success, `${def.type} legacy data must parse`);
      assert.deepEqual(migrateSectionData(def, def.schemaVersion, data).data, data);
    }
  }
});

test("snapshot migration preserves descriptors, metadata and unknown types without mutating input", () => {
  const snapshot = { sections: [{ id: "video", enabled: true }], revision: 1, contents: [
    { sectionId: "video", type: "shorts", schemaVersion: 1, data: { tenantKey: "keep" } },
    { sectionId: "future", type: "unknown", schemaVersion: 10, data: { keep: true } },
  ] };
  const before = structuredClone(snapshot);
  const result = migrateSnapshot(snapshot);
  assert.equal(result.changed, true);
  assert.equal(result.snapshot.contents[0].schemaVersion, 3);
  assert.equal(result.snapshot.contents[0].data.tenantKey, "keep");
  assert.deepEqual(result.snapshot.sections, snapshot.sections);
  assert.deepEqual(result.snapshot.contents[1], snapshot.contents[1]);
  assert.deepEqual(snapshot, before);
  assert.deepEqual(migrateSnapshot(result.snapshot), { snapshot: result.snapshot, changed: false });
  for (const corrupt of [null, {}, { contents: [null] }, { contents: [{ type: "shorts", data: {} }] }]) {
    assert.throws(() => migrateSnapshot(corrupt), /snapshot|version/i);
  }
});
