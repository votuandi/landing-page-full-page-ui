import type { CollectionQuery } from "../fields/collection";

/** IDs retain editorial order unless an explicit sort is requested. Never mutate the source. */
export function applyCollectionQuery<T extends { id: string }>(items: readonly T[], query: CollectionQuery): T[] {
  let result = query.ids ? query.ids.flatMap((id) => items.filter((item) => item.id === id)) : [...items];
  result = result.filter((item) => Object.entries(query.filter).every(([field, value]) =>
    Object.prototype.hasOwnProperty.call(item, field) && (item as Record<string, unknown>)[field] === value));
  if (query.sort) {
    const { field, dir } = query.sort;
    result.sort((a, b) => {
      const left = (a as Record<string, unknown>)[field];
      const right = (b as Record<string, unknown>)[field];
      const order = typeof left === "number" && typeof right === "number" ? left - right : String(left ?? "").localeCompare(String(right ?? ""));
      return dir === "desc" ? -order : order;
    });
  }
  return result.slice(0, query.limit);
}
