import { z } from "zod";
import { collectionInputSchema, slugify } from "./collections.ts";
import type { CollectionInput, CollectionRow } from "./collectionWrite.ts";
import { parseCsv, toCsv } from "./csv.ts";

export const PRODUCT_CSV_COLUMNS = ["slug", "title_vi", "title_en", "status", "category", "brand", "price", "salePrice", "featured", "segments", "powerKw", "images", "warranty", "tech", "segment", "specs", "compatible", "unit", "datasheet"] as const;
type Column = typeof PRODUCT_CSV_COLUMNS[number];
export type ProductCsvRefs = { categories: CollectionRow[]; brands: CollectionRow[] };
export type ProductCsvPreview = { rows: { line: number; slug: string; kind: "create" | "update" | "unchanged" | "error"; errors: { column: string; message: string }[] }[]; inputs: CollectionInput[] };
const arrayColumns = new Set(["segments", "images", "tech", "segment", "compatible"]);
// Escape existing apostrophes as well, so literal '=text and =text remain distinct.
const dangerous = /^'*[=+\-@\t\r]/;
function encode(value: unknown): string {
  let text: string;
  if (value == null) text = "";
  else if (Array.isArray(value)) text = value.length && value.every(v => typeof v === "string" && v !== "" && !/[|]/.test(v) && !/^[\[{"]/.test(v)) ? value.join("|") : JSON.stringify(value);
  else if (typeof value === "object" || typeof value === "string" && /^[\[{"]/.test(value)) text = JSON.stringify(value);
  else text = String(value);
  return dangerous.test(text) ? "'" + text : text;
}
const unescape = (value: string) => value.startsWith("'") && dangerous.test(value.slice(1)) ? value.slice(1) : value;
export function productToCsvRow(row: CollectionRow, refs: ProductCsvRefs): string[] {
  const title = row.title as { vi?: string; en?: string }, data = row.data as Record<string, unknown>;
  const values: Record<string, unknown> = { ...data, ...Object.fromEntries(["price", "salePrice", "featured", "segments"].map(k => [k, row[k]])),
    slug: row.slug, title_vi: title?.vi, title_en: title?.en, status: row.status,
    category: refs.categories.find(r => r.id === row.categoryId)?.slug,
    brand: refs.brands.find(r => r.id === row.brandId)?.slug };
  return PRODUCT_CSV_COLUMNS.map(key => encode(values[key]));
}
export function exportProductsCsv(rows: CollectionRow[], categories: CollectionRow[], brands: CollectionRow[]): string {
  if (rows.length > 1000) throw new Error("Chỉ có thể xuất tối đa 1000 sản phẩm");
  return toCsv([PRODUCT_CSV_COLUMNS, ...rows.map(row => productToCsvRow(row, { categories, brands }))]);
}
export function previewProductCsv(text: string, existing: CollectionRow[], refs: ProductCsvRefs, options: { bilingual: boolean }): ProductCsvPreview {
  const result: ProductCsvPreview = { rows: [], inputs: [] };
  const fileError = (message: string) => ({ rows: [{ line: 1, slug: "", kind: "error" as const, errors: [{ column: "CSV", message }] }], inputs: [] });
  if (Buffer.byteLength(text, "utf8") > 500_000) return fileError("File CSV không được vượt quá 500 kB");
  let records: string[][];
  try { records = parseCsv(text); } catch (error) { return fileError((error as Error).message); }
  if (!records.length) return result;
  const [header, ...rows] = records;
  if (header.length !== PRODUCT_CSV_COLUMNS.length || new Set(header).size !== header.length || PRODUCT_CSV_COLUMNS.some(c => !header.includes(c))) return fileError("Header CSV thiếu cột, trùng cột hoặc có cột không hợp lệ");
  if (rows.length > 1000) return fileError("Chỉ có thể nhập tối đa 1000 dòng sản phẩm");
  const bySlug = new Map(existing.map(row => [row.slug, row])), seen = new Map<string, number>();
  for (const [index, record] of rows.entries()) {
    const line = index + 2, errors: ProductCsvPreview["rows"][number]["errors"] = [];
    const raw = Object.fromEntries(header.map((key, i) => [key, record[i] ?? ""])) as Record<Column, string>;
    const cells = Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, unescape(value)])) as Record<Column, string>;
    const values: Record<string, unknown> = {};
    for (const key of PRODUCT_CSV_COLUMNS) {
      const cell = cells[key];
      try {
        values[key] = /^[\[{"]/.test(cell) ? JSON.parse(cell) : arrayColumns.has(key) ? cell === "" ? key === "compatible" ? undefined : [] : cell.split("|") : cell;
      } catch { errors.push({ column: key, message: "JSON không hợp lệ" }); }
    }
    const slug = cells.slug.trim() || slugify(String(values.title_vi ?? "")), before = bySlug.get(slug);
    if (record.length !== header.length) errors.push({ column: "CSV", message: "Số ô không khớp header" });
    if (seen.has(slug)) errors.push({ column: "slug", message: `Đường dẫn trùng với dòng ${seen.get(slug)}` });
    else seen.set(slug, line);
    const exported = before ? productToCsvRow(before, refs) : null;
    if (!errors.length && exported && PRODUCT_CSV_COLUMNS.every((key, i) => raw[key] === exported[i])) {
      result.rows.push({ line, slug, kind: "unchanged", errors }); continue;
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 200) errors.push({ column: "slug", message: "Đường dẫn không hợp lệ" });
    for (const key of ["price", "salePrice", "powerKw"] as const) {
      const cell = cells[key];
      if (!cell && key !== "powerKw") values[key] = null;
      else if (!cell.trim() || !Number.isFinite(Number(cell))) errors.push({ column: key, message: "Số không hợp lệ" });
      else values[key] = Number(cell);
    }
    if (!/^(true|false)$/i.test(cells.featured)) errors.push({ column: "featured", message: "Chỉ nhận true hoặc false" });
    const reference = (key: "category" | "brand", list: CollectionRow[]) => {
      if (!cells[key]) return null;
      const ref = list.find(r => r.slug === cells[key]);
      if (!ref) errors.push({ column: key, message: "Không tìm thấy trong website này" });
      return ref?.id ?? null;
    };
    const oldEn = (before?.title as { en?: string } | undefined)?.en;
    const en = values.title_en === "" ? undefined : values.title_en;
    if (!options.bilingual && en !== oldEn) errors.push({ column: "title_en", message: "Gói hiện tại không có nội dung song ngữ" });
    const input = { ...(before ? { id: before.id } : {}), slug, title: { vi: values.title_vi, ...(en !== undefined ? { en } : {}) }, status: values.status,
      columns: { categoryId: reference("category", refs.categories), brandId: reference("brand", refs.brands), price: values.price, salePrice: values.salePrice, featured: cells.featured.toLowerCase() === "true", segments: values.segments },
      data: Object.fromEntries(PRODUCT_CSV_COLUMNS.slice(10).filter(key => values[key] !== undefined && !(values[key] === "" && ["unit", "datasheet"].includes(key))).map(key => [key, values[key]])) };
    const parsed = collectionInputSchema("product").safeParse(input, { error: z.locales.vi().localeError });
    if (!parsed.success) for (const issue of parsed.error.issues) {
      const column = issue.path[0] === "title" ? issue.path[1] === "en" ? "title_en" : "title_vi" : String(issue.path[1] ?? issue.path[0]);
      errors.push({ column: column === "categoryId" ? "category" : column === "brandId" ? "brand" : column, message: issue.message });
    }
    result.rows.push({ line, slug, kind: errors.length ? "error" : before ? "update" : "create", errors });
    if (!errors.length && parsed.success) result.inputs.push(parsed.data);
  }
  return result;
}
