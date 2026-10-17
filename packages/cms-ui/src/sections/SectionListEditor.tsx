"use client";

import { useId, useSyncExternalStore } from "react";
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type Announcements } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { sectionLimitIssues, sectionRegistry } from "@solar/sections";
import { Errors, inputClass, SmallButton } from "../ui.tsx";
import { add, move, remove, setVariant, toggle, type EditableSection } from "./ops.ts";

export type SectionListEditorProps = {
  value: readonly EditableSection[];
  onChange(next: EditableSection[]): void;
  can: { reorder: boolean; variantSwitch: boolean };
  allowedTypes: readonly string[];
  lockedTypes?: readonly string[];
  newId?(type: string): string;
};
const newSectionId = (type: string) => `${type}-${crypto.randomUUID().slice(0, 8)}`;
const instructions = { draggable: "Nhấn Space để nhấc section, phím mũi tên để di chuyển, Space để thả, Esc để hủy." };
const announcements: Announcements = {
  onDragStart: () => "Đã nhấc section. Dùng phím mũi tên để di chuyển, Space để thả, Esc để hủy.",
  onDragOver: ({ over }) => over ? `Đang ở section ${over.id}.` : "Ra ngoài danh sách.",
  onDragEnd: ({ over }) => over ? `Đã thả tại section ${over.id}.` : "Đã thả, giữ nguyên vị trí.",
  onDragCancel: () => "Đã hủy sắp xếp.",
};
const reducedQuery = "(prefers-reduced-motion: reduce)";
const subscribeMotion = (notify: () => void) => {
  const query = window.matchMedia(reducedQuery);
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
};

/** Controlled editor dùng chung CMS/wizard; chỉ phát descriptor, không chạm nội dung hay mạng. */
export function SectionListEditor({ value, onChange, can, allowedTypes, lockedTypes = [], newId = newSectionId }: SectionListEditorProps) {
  const dndId = useId();
  const reduced = useSyncExternalStore(subscribeMotion, () => window.matchMedia(reducedQuery).matches, () => true);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const update = (from: number, to: number) => { if (can.reorder) onChange(move(value, from, to)); };
  return <div className="min-w-0 space-y-4 text-fg">
    <Errors errors={sectionLimitIssues(value)} />
    <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} accessibility={{ announcements, screenReaderInstructions: instructions }}
      onDragEnd={({ active, over }) => { if (over && active.id !== over.id) update(value.findIndex(s => s.id === active.id), value.findIndex(s => s.id === over.id)); }}>
      <SortableContext items={value.map(s => s.id)} strategy={verticalListSortingStrategy}>
        <ol aria-label="Section của trang" className="space-y-3">
          {value.map((section, index) => <SectionRow key={section.id} section={section} index={index} count={value.length} can={can} reducedMotion={reduced}
            onMove={update} onToggle={() => onChange(toggle(value, section.id))}
            onVariant={variant => onChange(setVariant(value, section.id, variant))}
            onRemove={() => { if (window.confirm("Xóa section này? Nội dung được giữ lại.")) onChange(remove(value, section.id)); }} />)}
        </ol>
      </SortableContext>
    </DndContext>
    {!value.length && <p className="text-sm text-fg-muted">Chưa có section nào.</p>}
    {can.reorder && <section aria-label="Thêm section" className="space-y-3 rounded-card border border-line/20 p-4">
      <h2 className="font-semibold">Thêm section</h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {[...new Set([...allowedTypes, ...lockedTypes])].map(type => {
          const def = sectionRegistry.getType(type);
          const variant = sectionRegistry.variantsOf(type)?.[0];
          if (!def || !variant) return null;
          const locked = !allowedTypes.includes(type) || lockedTypes.includes(type);
          const reason = locked ? "Gói hiện tại chưa hỗ trợ" : sectionLimitIssues([...value, { type }])[0];
          return <li key={type} className="min-w-0 rounded-input border border-line/15 p-3">
            <SmallButton className="min-h-11 whitespace-normal text-left" disabled={Boolean(reason)} aria-disabled={Boolean(reason)} aria-describedby={reason ? `${dndId}-${type}-reason` : undefined}
              onClick={() => { if (!reason) onChange(add(value, { id: newId(type), type, variant, enabled: true })); }}>
              Thêm {def.meta.label.vi}
            </SmallButton>
            {reason && <p id={`${dndId}-${type}-reason`} className="text-xs text-fg-muted">{reason}</p>}
          </li>;
        })}
      </ul>
    </section>}
  </div>;
}

function SectionRow({ section, index, count, can, reducedMotion, onMove, onToggle, onVariant, onRemove }: {
  section: EditableSection; index: number; count: number; can: SectionListEditorProps["can"];
  reducedMotion: boolean;
  onMove(from: number, to: number): void; onToggle(): void; onVariant(variant: string): void; onRemove(): void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: section.id, disabled: !can.reorder, ...(reducedMotion ? { transition: null } : {}) });
  const label = sectionRegistry.getType(section.type)?.meta.label.vi ?? section.type;
  const variants = sectionRegistry.variantsOf(section.type) ?? [];
  const selectId = useId();
  const name = `${label} (${section.id})`;
  return <li ref={setNodeRef} data-section-id={section.id} style={{ transform: CSS.Transform.toString(transform), transition }}
    className={`min-w-0 rounded-card border border-line/20 bg-bg-elevated p-4 ${isDragging ? "relative z-10 shadow-float" : ""}`}>
    <div className="flex flex-wrap items-center gap-3">
      {can.reorder && <button type="button" ref={setActivatorNodeRef} {...attributes} {...listeners} aria-label={`Kéo để sắp xếp: ${name}`}
        className="min-h-11 min-w-11 shrink-0 touch-none rounded-button text-fg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">⠿</button>}
      <div aria-hidden="true" className="flex min-h-16 w-20 shrink-0 items-center justify-center rounded-media bg-bg-tint text-sm text-fg-muted">{section.variant}</div>
      <div className="min-w-0 flex-1 break-words"><p className="font-semibold">{label}</p><p className="text-sm text-fg-muted">{section.variant} · {section.enabled ? "Đang bật" : "Đang tắt"}</p></div>
      {can.reorder && <div className="flex flex-wrap items-center gap-1">
        <SmallButton className="min-h-11 min-w-11" aria-label={`Lên trên: ${name}`} disabled={index === 0} onClick={() => onMove(index, index - 1)}>↑</SmallButton>
        <SmallButton className="min-h-11 min-w-11" aria-label={`Xuống dưới: ${name}`} disabled={index === count - 1} onClick={() => onMove(index, index + 1)}>↓</SmallButton>
        <SmallButton className="min-h-11" role="switch" aria-checked={section.enabled} aria-label={`Bật/tắt: ${name}`} onClick={onToggle}>{section.enabled ? "Tắt" : "Bật"}</SmallButton>
        <SmallButton className="min-h-11" tone="danger" aria-label={`Xóa: ${name}`} onClick={onRemove}>Xóa</SmallButton>
      </div>}
    </div>
    {can.variantSwitch && <div className="mt-3 space-y-1">
      <label htmlFor={selectId} className="text-sm text-fg-muted">Đổi kiểu hiển thị: {label}</label>
      <select id={selectId} className={inputClass} value={section.variant} onChange={e => onVariant(e.target.value)}>
        {!variants.includes(section.variant) && <option value={section.variant}>{section.variant} (không còn hỗ trợ)</option>}
        {variants.map(variant => <option key={variant} value={variant}>{variant} · {label}</option>)}
      </select>
      <div className="flex flex-wrap gap-2" aria-hidden="true">{variants.map(variant => <span key={variant} className="rounded-input bg-bg-tint px-3 py-2 text-xs text-fg-muted">{variant}</span>)}</div>
    </div>}
  </li>;
}
