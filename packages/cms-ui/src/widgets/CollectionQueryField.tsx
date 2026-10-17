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

export function CollectionQueryField({ node, path, value, label }: FieldProps<CollectionQuery | undefined>) {
  const { idPrefix, issues, update, pickers } = useSchemaForm();
  const [items, setItems] = useState<readonly { id: string; label: string }[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const collection = node.kind === "widget" ? node.collection : undefined;
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
  const filter = Object.entries(current.filter ?? {});
  const idsId = fieldId(idPrefix, [...path, "ids"]);
  const idsErrors = [...issuesUnder(issues, [...path, "ids"]), ...(loadError ? ["Không tải được danh sách mục; nhập mã thủ công"] : [])];
  const pinned = current.ids ?? [];
  const setFilter = (entries: [string, Scalar][]) => update([...path, "filter"], Object.fromEntries(entries));
  const setEntry = (index: number, entry: [string, Scalar]) => setFilter(filter.map((old, i) => (i === index ? entry : old)));
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
        {filter.map(([key, item], index) => {
          const type = typeOf(item);
          return (
            <div key={index} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:grid-cols-[minmax(0,1fr)_7rem_minmax(0,1fr)_auto]">
              <input aria-label={`Tên trường lọc ${index + 1}`} value={key} placeholder="featured" className={inputClass}
                onChange={(event) => setEntry(index, [event.target.value, item])} />
              <select aria-label={`Kiểu giá trị lọc ${index + 1}`} value={type} className={`${inputClass} max-sm:order-3`}
                onChange={(event) => setEntry(index, [key, toFilterValue(String(item), event.target.value as FilterType)])}>
                <option value="string">Chữ</option>
                <option value="number">Số</option>
                <option value="boolean">Đúng/sai</option>
              </select>
              {type === "boolean" ? (
                <select aria-label={`Giá trị lọc ${index + 1}`} value={String(item)} className={`${inputClass} max-sm:order-4`}
                  onChange={(event) => setEntry(index, [key, event.target.value === "true"])}>
                  <option value="true">Đúng</option>
                  <option value="false">Sai</option>
                </select>
              ) : (
                <input aria-label={`Giá trị lọc ${index + 1}`} value={String(item)} inputMode={type === "number" ? "decimal" : undefined}
                  className={`${inputClass} max-sm:order-4`} onChange={(event) => setEntry(index, [key, toFilterValue(event.target.value, type)])} />
              )}
              <SmallButton tone="danger" className="max-sm:order-2" aria-label={`Xóa điều kiện lọc ${index + 1}`}
                onClick={() => setFilter(filter.filter((_, i) => i !== index))}>✕</SmallButton>
            </div>
          );
        })}
        <SmallButton className="border border-dashed border-line/30" onClick={() => setFilter([...filter, ["", ""]])}>+ Thêm điều kiện</SmallButton>
        <Errors errors={issuesUnder(issues, [...path, "filter"])} />
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
