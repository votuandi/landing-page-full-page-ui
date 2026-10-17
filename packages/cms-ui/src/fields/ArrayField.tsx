"use client";

import { useId, useState } from "react";
import {
  closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { defaultFor, type FieldNode } from "../schema/describe.ts";
import { humanize } from "../schema/labels.ts";
import { pathKey, type Path } from "../schema/path.ts";
import { useSchemaForm, type FieldProps } from "../context.ts";
import { Errors, SmallButton } from "../ui.tsx";
import { Field, ObjectField } from "./Field.tsx";

let nextId = 0;
const newId = () => `item-${nextId++}`;

/** Tóm tắt phần tử cho tiêu đề thu gọn: chuỗi đầu tiên tìm được. */
export function itemSummary(value: unknown, depth = 0): string | undefined {
  if (typeof value === "string") return value || undefined;
  if (typeof value === "number") return String(value);
  if (!value || typeof value !== "object" || depth > 2) return undefined;
  const record = value as Record<string, unknown>;
  if (typeof record.vi === "string") return record.vi || undefined;
  for (const key of ["title", "name", "label", "question", "text", "value"]) {
    const found = itemSummary(record[key], depth + 1);
    if (found) return found;
  }
  for (const child of Object.values(record)) {
    const found = itemSummary(child, depth + 1);
    if (found) return found;
  }
  return undefined;
}

export function ArrayField({ node, path, value, label }: FieldProps<unknown[] | undefined>) {
  const { issues, update } = useSchemaForm();
  const items = value ?? [];
  // Id ổn định cho từng phần tử để React/dnd-kit không lẫn ô nhập khi sắp xếp lại.
  const [idState, setIds] = useState<string[]>(() => items.map(newId));
  let ids = idState;
  if (ids.length !== items.length) {
    ids = [...ids.slice(0, items.length), ...Array.from({ length: Math.max(0, items.length - ids.length) }, newId)];
    setIds(ids);
  }
  const dndId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  if (node.kind !== "array") return null;
  const canAdd = node.max === undefined || items.length < node.max;
  const canRemove = node.min === undefined || items.length > node.min;

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    setIds(arrayMove(ids, from, to));
    update(path, arrayMove(items, from, to));
  };
  const remove = (index: number) => {
    setIds(ids.filter((_, i) => i !== index));
    update(path, items.filter((_, i) => i !== index));
  };
  const duplicate = (index: number) => {
    setIds([...ids.slice(0, index + 1), newId(), ...ids.slice(index + 1)]);
    update(path, [...items.slice(0, index + 1), structuredClone(items[index]), ...items.slice(index + 1)]);
  };
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    move(ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
  };
  const scalar = node.item.kind !== "object" && node.item.kind !== "widget" && node.item.kind !== "union" && node.item.kind !== "array";
  const limits = [node.min !== undefined && `tối thiểu ${node.min}`, node.max !== undefined && `tối đa ${node.max}`].filter(Boolean).join(", ");

  return (
    <fieldset className="space-y-3 rounded-card border border-line/15 p-4">
      <legend className="px-1 text-sm font-semibold text-fg">
        {label} <span className="font-normal text-fg-subtle">({items.length}{limits ? ` · ${limits}` : ""})</span>
      </legend>
      <Errors errors={issues.get(pathKey(path))} />
      <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <ol className="space-y-2">
            {items.map((item, index) => (
              <SortableItem key={ids[index]} id={ids[index]} index={index} count={items.length}
                node={node.item} path={[...path, index]} value={item} scalar={scalar}
                title={`${humanize(String(path.at(-1) ?? "Mục"))} ${index + 1}`}
                canRemove={canRemove} canDuplicate={canAdd}
                onMove={move} onRemove={remove} onDuplicate={duplicate} />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
      {items.length === 0 && <p className="text-sm text-fg-muted">Chưa có mục nào.</p>}
      <SmallButton disabled={!canAdd} className="border border-dashed border-line/30"
        onClick={() => update(path, [...items, defaultFor(node.item)])}>+ Thêm mục</SmallButton>
    </fieldset>
  );
}

function SortableItem({ id, index, count, node, path, value, scalar, title, canRemove, canDuplicate, onMove, onRemove, onDuplicate }: {
  id: string; index: number; count: number; node: FieldNode; path: Path; value: unknown; scalar: boolean; title: string;
  canRemove: boolean; canDuplicate: boolean;
  onMove(from: number, to: number): void; onRemove(index: number): void; onDuplicate(index: number): void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
  const summary = itemSummary(value);
  const controls = (
    <div className="flex shrink-0 items-center gap-0.5">
      <SmallButton aria-label={`Lên trên: ${title}`} disabled={index === 0} onClick={() => onMove(index, index - 1)}>↑</SmallButton>
      <SmallButton aria-label={`Xuống dưới: ${title}`} disabled={index === count - 1} onClick={() => onMove(index, index + 1)}>↓</SmallButton>
      {!scalar && <SmallButton aria-label={`Nhân bản: ${title}`} disabled={!canDuplicate} onClick={() => onDuplicate(index)}>⧉</SmallButton>}
      <SmallButton tone="danger" aria-label={`Xóa: ${title}`} disabled={!canRemove} onClick={() => onRemove(index)}>✕</SmallButton>
    </div>
  );
  const handle = (
    <button type="button" ref={setActivatorNodeRef} {...attributes} {...listeners} aria-label={`Kéo để sắp xếp: ${title}`}
      className="flex min-h-9 min-w-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-button text-fg-subtle hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:cursor-grabbing">
      ⠿
    </button>
  );
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-input border border-line/15 bg-bg-elevated ${isDragging ? "relative z-10 shadow-float" : ""}`}>
      {scalar ? (
        <div className="flex items-start gap-2 p-2">
          {handle}
          <div className="min-w-0 flex-1"><Field node={node} path={path} value={value} label={title} /></div>
          {controls}
        </div>
      ) : (
        <details className="group" open={count <= 3}>
          <summary className="flex cursor-pointer list-none items-center gap-2 p-2 [&::-webkit-details-marker]:hidden">
            {handle}
            <span className="min-w-0 flex-1 truncate text-sm">
              <span className="font-medium text-fg">{title}</span>
              {summary && <span className="text-fg-muted"> · {summary}</span>}
            </span>
            {controls}
          </summary>
          <div className="border-t border-line/10 p-4">
            {node.kind === "object"
              ? <ObjectField bare node={node} path={path} value={value as Record<string, unknown>} label={title} />
              : <Field node={node} path={path} value={value} label={title} />}
          </div>
        </details>
      )}
    </li>
  );
}
