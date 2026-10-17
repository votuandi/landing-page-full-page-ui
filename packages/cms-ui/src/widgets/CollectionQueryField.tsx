"use client";

import { useEffect, useState } from "react";
import type { CollectionQuery } from "@solar/sections";
import { describe } from "../schema/describe.ts";
import { humanize } from "../schema/labels.ts";
import { issuesUnder, pathKey } from "../schema/path.ts";
import { useSchemaForm, type FieldProps } from "../context.ts";
import { Errors, FieldShell, inputClass, SmallButton } from "../ui.tsx";
import { Field, fieldId } from "../fields/Field.tsx";

type Scalar = string | number | boolean;

/** "true"/"false" → boolean, số → number, còn lại giữ chuỗi (đúng union của `filter`). */
export const parseFilterValue = (input: string): Scalar =>
  input === "true" ? true : input === "false" ? false : input.trim() !== "" && Number.isFinite(Number(input)) ? Number(input) : input;

export function CollectionQueryField({ node, path, value, label }: FieldProps<CollectionQuery | undefined>) {
  const { idPrefix, issues, update, pickers } = useSchemaForm();
  const [items, setItems] = useState<readonly { id: string; label: string }[] | null>(null);
  const collection = node.kind === "widget" ? node.collection : undefined;
  useEffect(() => {
    if (!collection || !pickers.collectionItems) return;
    let alive = true;
    pickers.collectionItems(collection).then((list) => { if (alive) setItems(list); });
    return () => { alive = false; };
  }, [collection, pickers]);
  if (node.kind !== "widget") return null;
  const shape = (node.schema as unknown as { shape: Record<"limit" | "sort", never> }).shape;
  const current = value ?? (node.schema.parse({}) as CollectionQuery);
  const filter = Object.entries(current.filter ?? {});
  const idsId = fieldId(idPrefix, [...path, "ids"]);
  const pinned = current.ids ?? [];
  const setFilter = (entries: [string, Scalar][]) => update([...path, "filter"], Object.fromEntries(entries));

  return (
    <fieldset className="space-y-4 rounded-card border border-line/15 p-4">
      <legend className="px-1 text-sm font-semibold text-fg">{label} {collection && <span className="font-normal text-fg-subtle">· {humanize(collection)}</span>}</legend>
      <Errors errors={issues.get(pathKey(path))} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field node={describe(shape.limit)} path={[...path, "limit"]} value={current.limit} label="Số mục hiển thị" />
      </div>
      <Field node={describe(shape.sort)} path={[...path, "sort"]} value={current.sort} label="Sắp xếp" />

      <div className="space-y-2">
        <p className="text-sm font-medium text-fg">Lọc theo trường</p>
        {filter.map(([key, item], index) => (
          <div key={index} className="flex items-center gap-2">
            <input aria-label={`Tên trường lọc ${index + 1}`} value={key} placeholder="featured" className={inputClass}
              onChange={(event) => setFilter(filter.map((entry, i) => (i === index ? [event.target.value, entry[1]] : entry)))} />
            <span className="text-fg-subtle">=</span>
            <input aria-label={`Giá trị lọc ${index + 1}`} value={String(item)} placeholder="true" className={inputClass}
              onChange={(event) => setFilter(filter.map((entry, i) => (i === index ? [entry[0], parseFilterValue(event.target.value)] : entry)))} />
            <SmallButton tone="danger" aria-label={`Xóa điều kiện lọc ${index + 1}`} onClick={() => setFilter(filter.filter((_, i) => i !== index))}>✕</SmallButton>
          </div>
        ))}
        <SmallButton className="border border-dashed border-line/30" onClick={() => setFilter([...filter, ["", ""]])}>+ Thêm điều kiện</SmallButton>
        <Errors errors={issuesUnder(issues, [...path, "filter"])} />
      </div>

      <FieldShell id={idsId} label="Chọn đích danh (tùy chọn)" errors={issuesUnder(issues, [...path, "ids"])}
        hint={items ? "Chọn mục muốn hiển thị; bỏ trống = lấy theo điều kiện lọc." : "Mỗi dòng một mã mục; bỏ trống = lấy theo điều kiện lọc."}>
        {items ? (
          <div id={idsId} className="max-h-56 space-y-1 overflow-y-auto rounded-input border border-line/15 p-2">
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
            onChange={(event) => {
              const next = event.target.value.split("\n");
              update([...path, "ids"], next.some(Boolean) ? next : undefined);
            }} />
        )}
      </FieldShell>
    </fieldset>
  );
}
