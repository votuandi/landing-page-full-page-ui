import { z } from "zod";
import type { Segment } from "@solar/core";

export const SEGMENTS = ["household", "shop", "factory", "farm"] as const satisfies readonly Segment[];
export const segmentEnum = () => z.enum(SEGMENTS);

/** Mảng không có hai phần tử trùng khóa (vd. hai thẻ cùng phân khúc). */
export const uniqueBy = <K extends string>(key: K) => (items: Record<K, unknown>[]) =>
  new Set(items.map((item) => item[key])).size === items.length;
