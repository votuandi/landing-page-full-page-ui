"use client";

import { createContext, use } from "react";
import { useSchemaForm, type FieldProps } from "@solar/cms-ui";
import type { Collection } from "@solar/db/collections";
import type { CollectionReferences } from "../lib/collections.ts";

export const CollectionFieldOptions = createContext<{ references: CollectionReferences; slugError?: string }>({ references: {} });

function SlugField({ path, value, label }: FieldProps<string | undefined>) {
  const { idPrefix, issues, update } = useSchemaForm();
  const { slugError } = use(CollectionFieldOptions), id = `${idPrefix}-slug`;
  const error = slugError ?? issues.get("slug")?.[0];
  return <div className="space-y-1">
    <label htmlFor={id} className="text-sm font-medium text-fg">{label}</label>
    <input id={id} name="slug" autoComplete="off" spellCheck={false} value={value ?? ""} maxLength={200} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined}
      className="min-h-11 w-full rounded-input border border-line/20 bg-bg px-3 text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      onChange={event => update(path, event.target.value)} />
    {error && <p id={`${id}-error`} className="text-sm text-danger">{error}</p>}
  </div>;
}

function ReferenceField({ path, value, label }: FieldProps<string | null | undefined>) {
  const { idPrefix, issues, update } = useSchemaForm();
  const { references } = use(CollectionFieldOptions);
  const key = path.join("."), id = `${idPrefix}-${key}`, errors = issues.get(key);
  const options = references[path.at(-1) as keyof CollectionReferences] ?? [];
  return <div className="space-y-1">
    <label htmlFor={id} className="text-sm font-medium text-fg">{label}</label>
    <select id={id} value={value ?? ""} aria-invalid={Boolean(errors?.length)} aria-describedby={errors?.length ? `${id}-error` : undefined}
      className="min-h-11 w-full min-w-0 rounded-input border border-line/20 bg-bg px-3 text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      onChange={event => update(path, event.target.value || null)}>
      <option value="">Không chọn</option>
      {value && !options.some(option => option.value === value) && <option value={value}>Lựa chọn không còn trong danh sách</option>}
      {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
    {errors?.length ? <p id={`${id}-error`} className="text-sm text-danger">{errors.join("; ")}</p> : null}
  </div>;
}
// Keep the legacy value in the payload; only columns.segments controls product display.
const HiddenLegacySegment = () => null;
const widgets = { slug: SlugField, "columns.categoryId": ReferenceField, "columns.brandId": ReferenceField, "columns.parentId": ReferenceField };
const productWidgets = { ...widgets, "data.segment": HiddenLegacySegment };
export const collectionWidgets = (name: Collection) => name === "product" ? productWidgets : widgets;
