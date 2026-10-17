"use client";

import { useEffect, useState } from "react";
import type { CollectionQuery } from "@solar/sections";
import { describe } from "../schema/describe.ts";
import { humanize } from "../schema/labels.ts";
import { issuesUnder, pathKey } from "../schema/path.ts";
import { useSchemaForm, type FieldProps } from "../context.ts";
import { describedBy, Errors, FieldShell, inputClass, SmallButton } from "../ui.tsx";
import { Field, fieldId } from "../fields/Field.tsx";

type Scalar = string | number | boolean;
export type FilterType = "string" | "number" | "boolean";

/** Kiểu do người dùng chọn quyết định giá trị lọc ("001" dạng chữ vẫn là chữ). Số sai → giữ chữ để schema báo lỗi rõ. */
export function toFilterValue(input: string, type: FilterType): Scalar {
  if (type === "boolean") return input === "true";
  if (type === "number") return input.trim() !== "" && Number.isFinite(Number(input)) ? Number(input) : input;
  return input;
}

const typeOf = (value: Scalar): FilterType => (typeof value === "number" ? "number" : typeof value === "boolean" ? "boolean" : "string");

type Row = { id: number; key: string; value: Scalar; type: FilterType };
let nextRow = 0;
const rowsOf = (filter: Record<string, Scalar> | undefined): Row[] =>
  Object.entries(filter ?? {}).map(([key, value]) => ({ id: nextRow++, key, value, type: typeOf(value) }));
/** Bản nháp đang khớp dữ liệu (không tính thứ tự khóa): khi đó giữ nguyên kiểu/draft người dùng đang chọn. */
const sameAsRows = (filter: Record<string, Scalar> | undefined, rows: Row[]) => {
  const entries = Object.entries(filter ?? {});
  return entries.length === rows.length && new Set(rows.map((row) => row.key)).size === rows.length && rows.every((row) => Object.hasOwn(filter ?? {}, row.key) && filter![row.key] === row.value);
};

export function CollectionQueryField({ node, path, value, label }: FieldProps<CollectionQuery | undefined>) {
  const { idPrefix, issues, update, pickers, setInputError } = useSchemaForm();
  // Dòng lọc là bản nháp cục bộ (id + khóa + giá trị + kiểu người dùng chọn): đổi khóa làm đổi thứ tự trong object
  // hay trùng khóa cũng không làm lệch kiểu hoặc mất dòng. Chỉ ghi vào dữ liệu khi khóa không trùng.
  const [rows, setRows] = useState<Row[]>(() => rowsOf(value?.filter));
  // Parent thay dữ liệu (tải bản khác, hoàn tác…) → dựng lại bản nháp; phản hồi từ chính thao tác đang gõ thì giữ nguyên.
  const [seen, setSeen] = useState(value?.filter);
  if (value?.filter !== seen) {
    setSeen(value?.filter);
    if (!sameAsRows(value?.filter, rows)) setRows(rowsOf(value?.filter));
  }
  const [items, setItems] = useState<readonly { id: string; label: string }[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const collection = node.kind === "widget" ? node.collection : undefined;
  const filterKey = pathKey([...path, "filter"]);
  const duplicate = rows.some((row, i) => rows.findIndex((other) => other.key === row.key) !== i);
  const badNumber = rows.some((row) => row.type === "number" && typeof row.value !== "number");
  const draftError = duplicate ? "Tên trường lọc bị trùng" : badNumber ? "Giá trị lọc kiểu số chưa hợp lệ" : null;
  useEffect(() => {
    setInputError(filterKey, draftError);
    return () => setInputError(filterKey, null);
  }, [filterKey, draftError, setInputError]);
  useEffect(() => {
    if (!collection || !pickers.collectionItems) return;
    let alive = true;
    pickers.collectionItems(collection).then(
      (list) => { if (alive) setItems(list); },
      () => { if (alive) setLoadError(true); },
    );
    return () => { alive = false; };
  }, [collection, pickers]);
  if (node.kind !== "widget") return null;
  const shape = (node.schema as unknown as { shape: Record<"limit" | "sort", never> }).shape;
  const current = value ?? (node.schema.parse({}) as CollectionQuery);
  const idsId = fieldId(idPrefix, [...path, "ids"]);
  const idsErrors = [...issuesUnder(issues, [...path, "ids"]), ...(loadError ? ["Không tải được danh sách mục; nhập mã thủ công"] : [])];
  const pinned = current.ids ?? [];
  const commit = (next: Row[]) => {
    setRows(next);
    if (new Set(next.map((row) => row.key)).size === next.length) {
      update([...path, "filter"], Object.fromEntries(next.map((row) => [row.key, row.value])));
    }
  };
  const patch = (id: number, change: Partial<Row>) => commit(rows.map((row) => (row.id === id ? { ...row, ...change } : row)));
  const hint = items ? "Chọn mục muốn hiển thị; bỏ trống = lấy theo điều kiện lọc." : "Mỗi dòng một mã mục; bỏ trống = lấy theo điều kiện lọc.";

  return (
    <fieldset className="min-w-0 space-y-4 rounded-card border border-line/15 p-3 sm:p-4">
      <legend className="px-1 text-sm font-semibold text-fg">{label} {collection && <span className="font-normal text-fg-subtle">· {humanize(collection)}</span>}</legend>
      <Errors errors={issues.get(pathKey(path))} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field node={describe(shape.limit)} path={[...path, "limit"]} value={current.limit} label="Số mục hiển thị" />
      </div>
      <Field node={describe(shape.sort)} path={[...path, "sort"]} value={current.sort} label="Sắp xếp" />

      <div className="space-y-2">
        <p className="text-sm font-medium text-fg">Lọc theo trường</p>
        {rows.map((row, index) => (
          <div key={row.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:grid-cols-[minmax(0,1fr)_7rem_minmax(0,1fr)_auto]">
            <input aria-label={`Tên trường lọc ${index + 1}`} value={row.key} placeholder="featured" className={inputClass}
              aria-invalid={duplicate && rows.some((other) => other !== row && other.key === row.key) ? true : undefined}
              onChange={(event) => patch(row.id, { key: event.target.value })} />
            <select aria-label={`Kiểu giá trị lọc ${index + 1}`} value={row.type} className={`${inputClass} max-sm:order-3`}
              onChange={(event) => {
                const type = event.target.value as FilterType;
                patch(row.id, { type, value: toFilterValue(String(row.value), type) });
              }}>
              <option value="string">Chữ</option>
              <option value="number">Số</option>
              <option value="boolean">Đúng/sai</option>
            </select>
            {row.type === "boolean" ? (
              <select aria-label={`Giá trị lọc ${index + 1}`} value={String(row.value)} className={`${inputClass} max-sm:order-4`}
                onChange={(event) => patch(row.id, { value: event.target.value === "true" })}>
                <option value="true">Đúng</option>
                <option value="false">Sai</option>
              </select>
            ) : (
              <input aria-label={`Giá trị lọc ${index + 1}`} value={String(row.value)} inputMode={row.type === "number" ? "decimal" : undefined}
                aria-invalid={row.type === "number" && typeof row.value !== "number" ? true : undefined}
                className={`${inputClass} max-sm:order-4`} onChange={(event) => patch(row.id, { value: toFilterValue(event.target.value, row.type) })} />
            )}
            <SmallButton tone="danger" className="max-sm:order-2" aria-label={`Xóa điều kiện lọc ${index + 1}`}
              onClick={() => commit(rows.filter((other) => other.id !== row.id))}>✕</SmallButton>
          </div>
        ))}
        <SmallButton className="border border-dashed border-line/30" onClick={() => commit([...rows, { id: nextRow++, key: "", value: "", type: "string" }])}>+ Thêm điều kiện</SmallButton>
        <Errors errors={[...issuesUnder(issues, [...path, "filter"]), ...(draftError ? [draftError] : [])]} />
      </div>

      <FieldShell id={idsId} label="Chọn đích danh (tùy chọn)" errors={idsErrors} hint={hint}>
        {items ? (
          <div id={idsId} role="group" aria-describedby={describedBy(idsId, hint, idsErrors)}
            className="max-h-56 space-y-1 overflow-y-auto rounded-input border border-line/15 p-2">
            {items.map((item) => (
              <label key={item.id} className="flex min-h-9 items-center gap-2 text-sm text-fg">
                <input type="checkbox" checked={pinned.includes(item.id)} className="size-4 accent-primary"
                  onChange={(event) => {
                    const next = event.target.checked ? [...pinned, item.id] : pinned.filter((id) => id !== item.id);
                    update([...path, "ids"], next.length ? next : undefined);
                  }} />
                {item.label}
              </label>
            ))}
          </div>
        ) : (
          <textarea id={idsId} rows={3} value={pinned.join("\n")} className={inputClass}
            aria-invalid={idsErrors.length ? true : undefined} aria-describedby={describedBy(idsId, hint, idsErrors)}
            onChange={(event) => {
              const next = event.target.value.split("\n");
              update([...path, "ids"], next.some(Boolean) ? next : undefined);
            }} />
        )}
      </FieldShell>
    </fieldset>
  );
}
