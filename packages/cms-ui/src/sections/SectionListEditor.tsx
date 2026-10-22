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
  onUpgrade?(feature: string): void;
  newId?(type: string): string;
  editHref?(section: EditableSection): string;
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
export function SectionListEditor({ value, onChange, can, allowedTypes, lockedTypes = [], newId = newSectionId, editHref, onUpgrade }: SectionListEditorProps) {
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
          {value.map((section, index) => <SectionRow key={section.id} section={section} locked={lockedTypes.includes(section.type)} index={index} count={value.length} can={can} reducedMotion={reduced} editHref={lockedTypes.includes(section.type) ? undefined : editHref?.(section)}
            onMove={update} onToggle={() => onChange(toggle(value, section.id))}
            onVariant={variant => onChange(setVariant(value, section.id, variant))}
            onRemove={() => { if (window.confirm("Xóa section này? Nội dung được giữ lại.")) onChange(remove(value, section.id)); }} />)}
        </ol>
      </SortableContext>
    </DndContext>
    {!value.length && <p className="rounded-card border border-dashed border-line/30 p-6 text-center text-sm text-fg-muted">
      Trang chưa có section nào.{can.reorder ? " Chọn một section bên dưới để bắt đầu." : ""}</p>}
    {(can.reorder || (onUpgrade && lockedTypes.length > 0)) && <section aria-labelledby={`${dndId}-add`} className="space-y-3 pt-2">
      <h2 id={`${dndId}-add`} className="text-base font-semibold">Thêm section</h2>
      <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {[...new Set([...allowedTypes, ...lockedTypes])].map(type => {
          const def = sectionRegistry.getType(type);
          const variant = sectionRegistry.variantsOf(type)?.[0];
          if (!def || !variant) return null;
          const locked = !allowedTypes.includes(type) || lockedTypes.includes(type);
          if (!can.reorder && !locked) return null;
          const reason = locked ? "Cần nâng cấp gói" : sectionLimitIssues([...value, { type }])[0];
          return <li key={type} className="min-w-0">
            <button type="button" aria-label={`Thêm ${def.meta.label.vi}`} disabled={Boolean(reason)} aria-disabled={Boolean(reason)} aria-describedby={reason ? `${dndId}-${type}-reason` : undefined}
              className="flex min-h-11 w-full items-center gap-2 rounded-input border border-line/20 bg-bg px-3 py-2 text-left text-sm font-medium text-fg hover:border-primary/50 hover:bg-bg-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:border-dashed disabled:bg-transparent disabled:text-fg-muted"
              onClick={() => { if (!reason) onChange(add(value, { id: newId(type), type, variant, enabled: true })); }}>
              <span aria-hidden="true" className="w-4 shrink-0 text-center text-base leading-none text-primary">{reason ? (locked ? "🔒" : "–") : "+"}</span>Thêm {def.meta.label.vi}
            </button>
            {reason && <p id={`${dndId}-${type}-reason`} className="mt-1 px-1 text-xs text-fg-muted">{reason}</p>}
            {locked && onUpgrade && def.meta.entitlement && <SmallButton className="min-h-11" aria-label={`Nâng cấp: ${def.meta.label.vi}`} onClick={() => onUpgrade(def.meta.entitlement!)}>Nâng cấp</SmallButton>}
          </li>;
        })}
      </ul>
    </section>}
  </div>;
}

function SectionRow({ section, locked, index, count, can, reducedMotion, editHref, onMove, onToggle, onVariant, onRemove }: {
  section: EditableSection; index: number; count: number; can: SectionListEditorProps["can"];
  locked: boolean;
  reducedMotion: boolean;
  editHref?: string;
  onMove(from: number, to: number): void; onToggle(): void; onVariant(variant: string): void; onRemove(): void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: section.id, disabled: !can.reorder, ...(reducedMotion ? { transition: null } : {}) });
  const label = sectionRegistry.getType(section.type)?.meta.label.vi ?? section.type;
  const variants = sectionRegistry.variantsOf(section.type) ?? [];
  const selectId = useId();
  const name = `${label} (${section.id})`;
  const on = section.enabled;
  return <li ref={setNodeRef} data-section-id={section.id} style={{ transform: CSS.Transform.toString(transform), transition }}
    className={`min-w-0 rounded-card border bg-bg-elevated p-3 sm:p-4 ${on ? "border-line/20" : "border-dashed border-line/30 bg-bg"} ${isDragging ? "relative z-10 shadow-float" : ""}`}>
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      {can.reorder && <button type="button" ref={setActivatorNodeRef} {...attributes} {...listeners} aria-label={`Kéo để sắp xếp: ${name}`}
        className="-ml-1 min-h-11 min-w-9 shrink-0 cursor-grab touch-none rounded-button text-lg text-fg-subtle hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:cursor-grabbing">⠿</button>}
      {/* Ô giữ chỗ thumbnail; ảnh chụp sẵn theo theme ở E7-S13. */}
      <div aria-hidden="true" className={`flex h-12 w-16 shrink-0 items-center justify-center rounded-media border bg-bg-tint text-xs font-semibold text-fg-muted ${on ? "border-line/15" : "border-dashed border-line/40"}`}>{section.variant}</div>
      <div className="min-w-0 flex-1 basis-40 break-words">
        <p className={`font-semibold ${on ? "text-fg" : "text-fg-muted"}`}>{label}</p>
        <p className="text-sm text-fg-muted">{on ? `Kiểu ${section.variant}` : "Đang ẩn khỏi trang"}</p>
        {locked && <p className="text-sm text-fg-muted">Khóa theo gói</p>}
      </div>
      {editHref && <a href={editHref} className="inline-flex min-h-11 items-center rounded-button px-2 text-sm font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Sửa nội dung</a>}
      {can.reorder && <div className="flex w-full items-center justify-between gap-1 sm:w-auto sm:justify-end">
        {!locked && <button type="button" role="switch" aria-checked={on} aria-label={`Hiển thị: ${name}`} onClick={onToggle}
          className="inline-flex min-h-11 items-center gap-2 rounded-button px-2 text-sm font-medium text-fg-muted hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
          <span aria-hidden="true" className={`relative inline-block h-6 w-10 shrink-0 rounded-pill ${on ? "bg-primary" : "bg-line/30"} transition-colors motion-reduce:transition-none`}>
            <span className={`absolute left-0.5 top-0.5 size-5 rounded-pill bg-bg-elevated shadow-sm transition-transform motion-reduce:transition-none ${on ? "translate-x-4" : ""}`} />
          </span>
          {on ? "Hiện" : "Ẩn"}
        </button>}
        <div className="flex items-center">
          <SmallButton className="min-h-11 min-w-11" aria-label={`Lên trên: ${name}`} disabled={index === 0} onClick={() => onMove(index, index - 1)}>↑</SmallButton>
          <SmallButton className="min-h-11 min-w-11" aria-label={`Xuống dưới: ${name}`} disabled={index === count - 1} onClick={() => onMove(index, index + 1)}>↓</SmallButton>
          <SmallButton className="min-h-11" tone="danger" aria-label={`Xóa: ${name}`} onClick={onRemove}>Xóa</SmallButton>
        </div>
      </div>}
    </div>
    {can.variantSwitch && !locked && <div className="mt-3 flex flex-col gap-1 border-t border-line/15 pt-3 sm:flex-row sm:items-center sm:gap-3">
      <label htmlFor={selectId} className="shrink-0 text-sm text-fg-muted">Kiểu hiển thị<span className="sr-only">: {label}</span></label>
      <select id={selectId} aria-label={`Đổi kiểu hiển thị: ${label}`} className={`${inputClass} sm:max-w-xs`} value={section.variant} onChange={e => onVariant(e.target.value)}>
        {!variants.includes(section.variant) && <option value={section.variant}>{section.variant} (không còn hỗ trợ)</option>}
        {variants.map(variant => <option key={variant} value={variant}>{variant}</option>)}
      </select>
    </div>}
  </li>;
}
