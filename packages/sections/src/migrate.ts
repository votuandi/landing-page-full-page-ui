import type { SectionTypeDef } from "./define";
import { sectionRegistry } from "./registry";

export type SectionMigration = (data: Record<string, unknown>) => Record<string, unknown>;

const warned = new Set<string>();
const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

export function missingMigrations(def: SectionTypeDef): number[] {
  return Array.from({ length: def.schemaVersion - 1 }, (_, index) => index + 1)
    .filter((version) => typeof def.migrations?.[version] !== "function");
}

export function migrateSectionData(def: SectionTypeDef, fromVersion: number, data: unknown) {
  if (!Number.isInteger(fromVersion) || fromVersion < 1) {
    throw new Error(`[sections] ${def.type}: invalid schema version ${fromVersion}`);
  }
  if (fromVersion >= def.schemaVersion) {
    const key = `${def.type}:${fromVersion}:${def.schemaVersion}`;
    if (fromVersion > def.schemaVersion && !warned.has(key)) {
      warned.add(key);
      console.warn(`[sections] ${def.type}: data v${fromVersion} newer than app v${def.schemaVersion}`);
    }
    return { schemaVersion: fromVersion, data, changed: false };
  }
  if (!isObject(data)) throw new Error(`[sections] ${def.type}: migration data must be an object`);
  let next = structuredClone(data);
  for (let version = fromVersion; version < def.schemaVersion; version++) {
    const migrate = def.migrations?.[version];
    if (!migrate) throw new Error(`[sections] ${def.type}: missing migration v${version} → v${version + 1}`);
    next = migrate(next);
    if (!isObject(next)) throw new Error(`[sections] ${def.type}: migration v${version} must return an object`);
  }
  return { schemaVersion: def.schemaVersion, data: next, changed: true };
}

export function migrateSnapshot<T>(snapshot: T, registry: Pick<typeof sectionRegistry, "getType"> = sectionRegistry): { snapshot: T; changed: boolean } {
  if (!isObject(snapshot) || !Array.isArray(snapshot.contents)) throw new Error("[sections] invalid snapshot: contents must be an array");
  let changed = false;
  const contents = snapshot.contents.map((entry: unknown, index: number) => {
    if (!isObject(entry) || typeof entry.type !== "string") throw new Error(`[sections] invalid snapshot content ${index}`);
    const def = registry.getType(entry.type);
    if (!def) return entry;
    const result = migrateSectionData(def, entry.schemaVersion as number, entry.data);
    changed ||= result.changed;
    return result.changed ? { ...entry, schemaVersion: result.schemaVersion, data: result.data } : entry;
  });
  return { snapshot: changed ? { ...snapshot, contents } as T : snapshot, changed };
}
