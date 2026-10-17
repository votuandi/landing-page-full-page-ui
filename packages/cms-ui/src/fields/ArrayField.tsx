"use client";

import { useId, useState, useSyncExternalStore } from "react";
import {
  closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type Announcements, type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { defaultFor, type FieldNode } from "../schema/describe.ts";
import { humanize } from "../schema/labels.ts";
import { issuesUnder, pathKey, type Path } from "../schema/path.ts";
import { useSchemaForm, type FieldProps } from "../context.ts";
import { Errors, SmallButton } from "../ui.tsx";
import { Field, hasContent, ObjectField, useLabel } from "./Field.tsx";

const REDUCED = "(prefers-reduced-motion: reduce)";
const subscribeMotion = (onChange: () => void) => {
  const query = window.matchMedia(REDUCED);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
/** Animation sắp xếp tắt khi người dùng bật giảm chuyển động (AGENTS.md §4). */
const useReducedMotion = () => useSyncExternalStore(subscribeMotion, () => window.matchMedia(REDUCED).matches, () => true);
const subscribeNothing = () => () => {};
/** false khi render ở server/hydrate: nội dung thu gọn vẫn hiện khi tắt JavaScript. */
const useHydrated = () => useSyncExternalStore(subscribeNothing, () => true, () => false);

/** Thông báo cho trình đọc màn hình bằng tiếng Việt (mặc định của dnd-kit là tiếng Anh). */
const position = (ids: readonly string[], id: string | number | undefined) => ids.indexOf(String(id)) + 1;
const announcementsFor = (ids: readonly string[]): Announcements => ({
  onDragStart: ({ active }) => `Đã nhấc mục ${position(ids, active.id)}. Dùng phím mũi tên để di chuyển, Space để thả, Esc để hủy.`,
  onDragOver: ({ over }) => (over ? `Đang ở vị trí ${position(ids, over.id)}.` : "Ra ngoài danh sách."),
  onDragEnd: ({ over }) => (over ? `Đã thả vào vị trí ${position(ids, over.id)}.` : "Đã thả, giữ nguyên vị trí."),
  onDragCancel: () => "Đã hủy sắp xếp.",
});
const SCREEN_READER = { draggable: "Nhấn Space hoặc Enter để nhấc mục, phím mũi tên để di chuyển, Space để thả, Esc để hủy." };

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
    if (hasContent(items[index]) && !window.confirm("Xóa mục này cùng nội dung đã nhập?")) return;
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
    <fieldset className="min-w-0 space-y-3 rounded-card border border-line/15 p-3 sm:p-4">
      <legend className="px-1 text-sm font-semibold text-fg">
        {label} <span className="font-normal text-fg-subtle">({items.length}{limits ? ` · ${limits}` : ""})</span>
      </legend>
      <Errors errors={issues.get(pathKey(path))} />
      <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}
        accessibility={{ announcements: announcementsFor(ids), screenReaderInstructions: SCREEN_READER }}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <ol className="space-y-2">
            {items.map((item, index) => (
              <SortableItem key={ids[index]} id={ids[index]} index={index} count={items.length}
                node={node.item} path={[...path, index]} value={item} scalar={scalar}
                title={humanize(String(path.at(-1) ?? "Mục"))}
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

function SortableItem({ id, index, count, node, path, value, scalar, title: fallbackTitle, canRemove, canDuplicate, onMove, onRemove, onDuplicate }: {
  id: string; index: number; count: number; node: FieldNode; path: Path; value: unknown; scalar: boolean; title: string;
  canRemove: boolean; canDuplicate: boolean;
  onMove(from: number, to: number): void; onRemove(index: number): void; onDuplicate(index: number): void;
}) {
  const reduced = useReducedMotion();
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable(
    reduced ? { id, transition: null } : { id });
  const { issues, inputErrorKeys } = useSchemaForm();
  // Nhãn override theo đường dẫn (vd. "rows.*") thay phần tên; số thứ tự luôn kèm theo.
  const title = `${useLabel(path, fallbackTitle)} ${index + 1}`;
  // Thu gọn bằng nút (không dùng <summary>: không được lồng nút trong summary). Nội dung chỉ ẩn, không unmount,
  // để ô đang gõ dở giữ nguyên. Server render mở hết (đọc được khi tắt JS); dòng có lỗi schema luôn mở.
  const hydrated = useHydrated();
  const [open, setOpen] = useState(count <= 3);
  const key = pathKey(path);
  const hasErrors = issuesUnder(issues, path).length > 0;
  const hasInputErrors = [...inputErrorKeys].some((k) => k === key || k.startsWith(`${key}.`));
  const expanded = !hydrated || open || hasErrors;
  const bodyId = `${useId()}-body`;
  const summary = itemSummary(value);
  const controls = (
    <div className="ml-auto flex shrink-0 items-center gap-0.5">
      <SmallButton aria-label={`Lên trên: ${title}`} disabled={index === 0} onClick={() => onMove(index, index - 1)}>↑</SmallButton>
      <SmallButton aria-label={`Xuống dưới: ${title}`} disabled={index === count - 1} onClick={() => onMove(index, index + 1)}>↓</SmallButton>
      {!scalar && <SmallButton className="max-sm:hidden" aria-label={`Nhân bản: ${title}`} disabled={!canDuplicate} onClick={() => onDuplicate(index)}>⧉</SmallButton>}
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
        <>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 p-2">
            {handle}
            <button type="button" aria-expanded={expanded} aria-controls={bodyId} onClick={() => setOpen(!expanded)}
              className="flex min-h-9 min-w-32 flex-1 items-center gap-2 truncate rounded-button px-1 text-left text-sm hover:bg-bg-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
              <span aria-hidden className="text-fg-subtle">{expanded ? "▾" : "▸"}</span>
              <span className="truncate">
                <span className="font-medium text-fg">{title}</span>
                {summary && <span className="text-fg-muted"> · {summary}</span>}
              </span>
              {(hasErrors || hasInputErrors) && <span className="shrink-0 rounded-pill bg-danger/10 px-2 text-xs font-medium text-danger">Có lỗi</span>}
            </button>
            {controls}
          </div>
          <div id={bodyId} hidden={!expanded} className="border-t border-line/10 p-4">
            {node.kind === "object"
              ? <ObjectField bare node={node} path={path} value={value as Record<string, unknown>} label={title} />
              : <Field node={node} path={path} value={value} label={title} />}
          </div>
        </>
      )}
    </li>
  );
}
