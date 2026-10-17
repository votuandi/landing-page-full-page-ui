import type { z } from "zod";

export type Path = readonly (string | number)[];

export const pathKey = (path: Path) => path.join(".");

export function getAt(value: unknown, path: Path): unknown {
  let current = value;
  for (const key of path) {
    if (current === null || typeof current !== "object") return undefined;
    current = (current as Record<string | number, unknown>)[key];
  }
  return current;
}

/** Ghi bất biến; nhánh không đổi giữ nguyên tham chiếu. `undefined` ở khóa object = xóa khóa (trường tùy chọn). */
export function setAt<T>(value: T, path: Path, next: unknown): T {
  if (path.length === 0) return next as T;
  const [key, ...rest] = path;
  const child = setAt(getAt(value, [key]), rest, next);
  if (Array.isArray(value)) {
    const copy = [...value];
    copy[key as number] = child;
    return copy as T;
  }
  const copy = { ...(value as Record<string, unknown> | undefined) };
  if (child === undefined) delete copy[key];
  else copy[key] = child;
  return copy as T;
}

export function issuesByPath(error: z.core.$ZodError | undefined): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const issue of error?.issues ?? []) {
    const key = pathKey(issue.path as (string | number)[]);
    map.set(key, [...(map.get(key) ?? []), issue.message]);
  }
  return map;
}

/** Lỗi của một widget gộp: chính nó + mọi đường dẫn con. */
export function issuesUnder(issues: Map<string, string[]>, path: Path): string[] {
  const key = pathKey(path);
  return [...issues].flatMap(([issuePath, messages]) =>
    issuePath === key || issuePath.startsWith(key === "" ? "" : `${key}.`) ? messages : []);
}
