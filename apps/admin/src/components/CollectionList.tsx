"use client";

import Link from "next/link";
import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type Announcements } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ActionResult, AdminAction } from "../lib/action.ts";
import { duplicateCollection, removeCollection, sortCollection } from "../app/(admin)/noi-dung/actions.ts";

type Row = { id: string; title: string; slug: string; status: "draft" | "published" };
const button = "inline-flex min-h-11 min-w-11 items-center justify-center rounded-button border border-line/20 px-3 text-sm text-fg hover:bg-bg-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50";
const announcements: Announcements = {
  onDragStart: () => "Đã nhấc bản ghi. Dùng phím mũi tên để di chuyển, Space để thả, Esc để hủy.",
  onDragOver: ({ over }) => over ? "Đang di chuyển bản ghi." : "Ra ngoài danh sách.",
  onDragEnd: () => "Đã thả bản ghi.", onDragCancel: () => "Đã hủy sắp xếp.",
};
export function CollectionList({ path, rows, canReorder }: { path: string; rows: Row[]; canReorder: boolean }) {
  const [result, setResult] = useState<ActionResult>({});
  const [pending, startTransition] = useTransition(), router = useRouter(), dndId = useId();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const run = (action: AdminAction, values: Record<string, string>) => startTransition(async () => {
    const form = new FormData(); form.set("collection", path);
    for (const [key, value] of Object.entries(values)) form.set(key, value);
    const response = await action({}, form); setResult(response);
    if (response.ok) router.refresh();
  });
  const move = (from: number, to: number) => {
    if (!canReorder || pending || from === to || from < 0 || to < 0 || to >= rows.length) return;
    const next = arrayMove(rows, from, to);
    run(sortCollection, { ids: JSON.stringify(next.map(row => row.id)) });
  };
  const items = rows;
  return <div className="min-w-0 space-y-3" aria-busy={pending}>
    {!canReorder && <p className="text-sm text-fg-muted">Sắp xếp tạm tắt. Xóa tìm kiếm và bộ lọc để sắp xếp toàn bộ danh sách.</p>}
    <p role="status" aria-live="polite" className="text-sm text-fg-muted">{pending ? "Đang lưu…" : result.message}</p>
    {result.error && <p role="alert" className="text-danger">{result.error}</p>}
    <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} accessibility={{ announcements, screenReaderInstructions: { draggable: "Nhấn Space để nhấc, mũi tên để di chuyển, Space để thả, Esc để hủy." } }}
      onDragEnd={({ active, over }) => { if (over) move(items.findIndex(r => r.id === active.id), items.findIndex(r => r.id === over.id)); }}>
      <SortableContext items={items.map(row => row.id)} strategy={verticalListSortingStrategy}>
        <ol aria-label="Danh sách nội dung" className="space-y-3">{items.map((row, index) => <CollectionRow key={row.id} row={row} path={path} disabled={!canReorder || pending} index={index} count={items.length}
          onMove={to => move(index, to)} onDuplicate={() => run(duplicateCollection, { id: row.id })}
          onRemove={() => { if (window.confirm(`Xóa “${row.title}”? Thao tác này không thể hoàn tác.`)) run(removeCollection, { id: row.id }); }} pending={pending} />)}</ol>
      </SortableContext>
    </DndContext>
    {!items.length && <p className="rounded-card border border-dashed border-line/20 p-6 text-fg-muted">Chưa có nội dung phù hợp. Thêm bản ghi hoặc xóa bộ lọc.</p>}
  </div>;
}
function CollectionRow({ row, path, disabled, index, count, onMove, onDuplicate, onRemove, pending }: { row: Row; path: string; disabled: boolean; index: number; count: number; onMove(to: number): void; onDuplicate(): void; onRemove(): void; pending: boolean }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform } = useSortable({ id: row.id, disabled, transition: null });
  return <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform) }} className="min-w-0 rounded-card border border-line/20 bg-bg-elevated p-4">
    <div className="flex min-w-0 flex-wrap items-center gap-3">
      <button type="button" ref={setActivatorNodeRef} {...attributes} {...listeners} disabled={disabled} aria-label={`Kéo để sắp xếp: ${row.title}`} className={`${button} touch-none cursor-grab`}>⠿</button>
      <div className="min-w-0 flex-1 basis-40"><p className="break-words font-medium text-fg">{row.title}</p><p className="break-all text-sm text-fg-muted">{row.slug}</p><p className="text-sm text-fg-muted">{row.status === "published" ? "Đã xuất bản" : "Nháp"}</p></div>
      <div className="flex flex-wrap gap-2">
        <button className={button} disabled={disabled || index === 0} aria-label={`Lên trên: ${row.title}`} onClick={() => onMove(index - 1)}>↑</button>
        <button className={button} disabled={disabled || index === count - 1} aria-label={`Xuống dưới: ${row.title}`} onClick={() => onMove(index + 1)}>↓</button>
        <Link className={button} href={`/noi-dung/${path}/${row.id}`}>Sửa<span className="sr-only"> {row.title}</span></Link>
        <button className={button} disabled={pending} onClick={onDuplicate}>Nhân bản<span className="sr-only"> {row.title}</span></button>
        <button className={button} disabled={pending} onClick={onRemove}>Xóa<span className="sr-only"> {row.title}</span></button>
      </div>
    </div>
  </li>;
}
