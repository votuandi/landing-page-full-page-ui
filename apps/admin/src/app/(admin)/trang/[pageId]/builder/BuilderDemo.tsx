"use client";

import { useId, useReducer, useState, useSyncExternalStore, useTransition } from "react";
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, pointerWithin, useDraggable, useDroppable, useSensor, useSensors, type Announcements, type CollisionDetection, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PreviewFrame, SchemaForm, useLeaveGuard, type EditableSection } from "@solar/cms-ui";
import { sectionLimitIssues, sectionRegistry } from "@solar/sections";
import type { BuilderData, PageSectionResult } from "../../../../../lib/pageSections.ts";
import { saveBuilderDraft } from "../../actions.ts";
import { BUILDER_TYPES, builderReducer, createBuilderHistory, editedContents, libraryReason } from "./builderState.ts";

const button = "inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-button border border-line/25 bg-bg-elevated px-3 py-2 text-sm font-medium text-fg hover:bg-bg-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50";
const panel = "min-w-0 space-y-3 rounded-card border border-line/20 bg-bg-elevated p-4";
const motionQuery = "(prefers-reduced-motion: reduce)";
const subscribeMotion = (notify: () => void) => {
  const query = window.matchMedia(motionQuery);
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
};
const instructions = { draggable: "Nhấn Space để nhấc section, phím mũi tên để sắp xếp, Space để thả, Esc để hủy. Trong thư viện, nhấn Enter để thêm vào cuối trang." };
const announcements: Announcements = {
  onDragStart: () => "Đã nhấc section. Di chuyển tới vị trí muốn thả, nhấn Esc để hủy.",
  onDragOver: ({ over }) => over ? `Vị trí thả: ${over.data.current?.label ?? "cuối trang"}.` : "Ngoài danh sách section.",
  onDragEnd: ({ over }) => over ? "Đã thả section vào danh sách." : "Không thay đổi danh sách.",
  onDragCancel: () => "Đã hủy kéo section.",
};
const collision: CollisionDetection = args => {
  const droppableContainers = args.droppableContainers.filter(container => container.data.current?.kind === "section"
    || (args.active.data.current?.kind === "library" && container.data.current?.kind === "end"));
  return args.pointerCoordinates ? pointerWithin({ ...args, droppableContainers }) : closestCenter({ ...args, droppableContainers });
};

export default function BuilderDemo({ data }: { data: BuilderData }) {
  const { editor } = data;
  const dndId = useId();
  const [history, dispatch] = useReducer(builderReducer, { sections: editor.sections, contents: data.contents }, createBuilderHistory);
  const snapshot = history.present;
  const [saved, setSaved] = useState(snapshot);
  const [revision, setRevision] = useState(editor.page.revision);
  const [selectedId, setSelectedId] = useState<string>();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [formEpoch, setFormEpoch] = useState(0);
  const [invalidForms, setInvalidForms] = useState<Record<string, boolean>>({});
  const [pending, start] = useTransition();
  const reduced = useSyncExternalStore(subscribeMotion, () => window.matchMedia(motionQuery).matches, () => true);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const policy = { canReorder: editor.can.reorder, allowedTypes: editor.allowedTypes, lockedTypes: editor.lockedTypes };
  const edits = editedContents(snapshot, saved);
  const dirty = JSON.stringify(snapshot) !== JSON.stringify(saved);
  useLeaveGuard(dirty || Object.values(invalidForms).some(Boolean));
  const disabled = pending || conflict;
  const invalid = sectionLimitIssues(snapshot.sections).length > 0 || Object.values(invalidForms).some(Boolean)
    || snapshot.sections.some(s => Object.hasOwn(edits, s.id) && !sectionRegistry.getType(s.type)?.schema.safeParse(edits[s.id]).success);
  const selected = snapshot.sections.find(s => s.id === selectedId);
  const def = selected && sectionRegistry.getType(selected.type);
  const selectedLocked = selected && editor.lockedTypes.some(type => type === selected.type);
  const editable = selected && BUILDER_TYPES.some(type => type === selected.type) && !selectedLocked;

  function insert(type: string, index: number) {
    if (disabled || libraryReason(snapshot, type, policy)) return;
    const id = `${type}-${crypto.randomUUID().slice(0, 8)}`;
    dispatch({ type: "insert", sectionType: type, id, index, policy });
    setSelectedId(id); setMessage("");
  }
  function drop({ active, over }: DragEndEvent) {
    if (!over || disabled || !editor.can.reorder) return;
    if (active.data.current?.kind === "library") {
      let index = snapshot.sections.findIndex(s => s.id === over.id);
      if (over.data.current?.kind === "end") index = snapshot.sections.length;
      else {
        const rect = active.rect.current.translated;
        if (rect && rect.top + rect.height / 2 > over.rect.top + over.rect.height / 2) index++;
      }
      if (index >= 0) insert(active.data.current.sectionType, index);
    } else {
      dispatch({ type: "move", from: snapshot.sections.findIndex(s => s.id === active.id), to: snapshot.sections.findIndex(s => s.id === over.id) });
      setMessage("");
    }
  }
  function timeTravel(type: "undo" | "redo") {
    dispatch({ type }); setInvalidForms({}); setFormEpoch(n => n + 1); setMessage("");
  }
  function save() {
    if (disabled || invalid) return;
    const form = new FormData();
    form.set("pageId", editor.page.id); form.set("revision", String(revision));
    form.set("sections", JSON.stringify(snapshot.sections)); form.set("contents", JSON.stringify(edits));
    setError(""); setMessage("");
    start(async () => {
      try {
        const result: PageSectionResult = await saveBuilderDraft({}, form);
        if (!result.ok) {
          setError(result.error ?? "Không thể lưu nháp");
          if (result.status === 409) setConflict(true);
          return;
        }
        if (result.revision !== undefined) setRevision(result.revision);
        setSaved(snapshot); setMessage("Đã lưu nháp"); setRefreshKey(n => n + 1);
      } catch (cause) { setError(cause instanceof Error ? cause.message : "Không thể kết nối. Vui lòng thử lại."); }
    });
  }

  return <div className="min-w-0 space-y-4 text-fg">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line/20 bg-bg-elevated p-3" aria-busy={pending}>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={button} disabled={disabled || !history.past.length} onClick={() => timeTravel("undo")}>Hoàn tác</button>
        <button type="button" className={button} disabled={disabled || !history.future.length} onClick={() => timeTravel("redo")}>Làm lại</button>
      </div>
      <p role="status" className="text-sm text-fg-muted">{pending ? "Đang lưu…" : message || (dirty ? "Có thay đổi chưa lưu" : "Không có thay đổi chưa lưu")}</p>
      <button type="button" className={button} disabled={disabled || invalid} onClick={save}>Lưu nháp</button>
    </div>
    {error && <p role="alert" className="text-danger">{error}</p>}
    {conflict && <button type="button" className={button} onClick={() => window.location.reload()}>Tải lại trang</button>}
    <fieldset disabled={disabled} className="min-w-0">
      <legend className="sr-only">Trình dựng trang</legend>
      <DndContext id={dndId} sensors={sensors} collisionDetection={collision} accessibility={{ announcements, screenReaderInstructions: instructions }} onDragEnd={drop}>
        <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,2fr)]">
          <section aria-labelledby={`${dndId}-library`} className={panel}>
            <h2 id={`${dndId}-library`} className="font-semibold">Thư viện section</h2>
            <p className="text-sm text-fg-muted">Kéo vào danh sách hoặc nhấn nút để thêm vào cuối trang.</p>
            <ul className="space-y-3">{BUILDER_TYPES.map(type => <LibraryItem key={type} type={type} reason={libraryReason(snapshot, type, policy)} disabled={disabled} onAdd={() => insert(type, snapshot.sections.length)} />)}</ul>
          </section>
          <section aria-labelledby={`${dndId}-list`} className={panel}>
            <h2 id={`${dndId}-list`} className="font-semibold">Section của trang</h2>
            <SortableContext items={snapshot.sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
              <ol aria-label="Section của trang" className="space-y-3">{snapshot.sections.map((section, index) => <SectionRow key={section.id} section={section} index={index} count={snapshot.sections.length}
                disabled={disabled || !editor.can.reorder} selected={selectedId === section.id} reduced={reduced}
                onSelect={() => setSelectedId(section.id)} onMove={to => { dispatch({ type: "move", from: index, to }); setMessage(""); }} />)}</ol>
            </SortableContext>
            <EndDrop disabled={disabled || !editor.can.reorder} empty={!snapshot.sections.length} />
          </section>
          <section aria-labelledby={`${dndId}-properties`} className={panel}>
            <h2 id={`${dndId}-properties`} className="font-semibold">Thuộc tính section</h2>
            {selected && def && editable ? <>
              <p className="text-sm text-fg-muted">{def.meta.label.vi} · {selected.id}</p>
              <label htmlFor={`${dndId}-variant`} className="block text-sm font-medium">Kiểu hiển thị</label>
              <select id={`${dndId}-variant`} value={selected.variant} disabled={!editor.can.variantSwitch} className="min-h-11 w-full rounded-input border border-line/25 bg-bg px-3 text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                onChange={event => { dispatch({ type: "variant", id: selected.id, variant: event.target.value }); setMessage(""); }}>
                {(sectionRegistry.variantsOf(selected.type) ?? []).map(variant => <option key={variant} value={variant}>{variant}</option>)}
              </select>
              <fieldset disabled={!editor.canEditContent} className="min-w-0">
                <legend className="sr-only">Nội dung {def.meta.label.vi}</legend>
                <SchemaForm key={`${selected.id}-${formEpoch}`} schema={def.schema} value={snapshot.contents[selected.id] ?? def.defaults}
                  onChange={value => { dispatch({ type: "content", id: selected.id, data: value }); setMessage(""); }}
                  onValidityChange={valid => setInvalidForms(prev => Boolean(prev[selected.id]) === !valid ? prev : { ...prev, [selected.id]: !valid })} />
              </fieldset>
            </> : <p className="text-sm text-fg-muted">{!selected ? "Chọn một section để sửa nội dung." : selectedLocked ? "Section khóa theo gói. Nội dung được giữ nguyên." : "Section ngoài phạm vi demo. Có thể sắp xếp; nội dung được giữ nguyên."}</p>}
          </section>
        </div>
      </DndContext>
    </fieldset>
    <section aria-labelledby={`${dndId}-preview`} className={panel}>
      <h2 id={`${dndId}-preview`} className="font-semibold">Xem trước</h2>
      <p className="text-sm text-fg-muted">Bản xem trước cập nhật sau khi lưu nháp.</p>
      <PreviewFrame src={data.previewUrl} title="Xem trước" sectionId={selectedId ?? data.editor.sections[0]?.id ?? "trang"} targetOrigin={new URL(data.previewUrl).origin} refreshKey={refreshKey} />
    </section>
  </div>;
}

function LibraryItem({ type, reason, disabled, onAdd }: { type: string; reason?: string; disabled: boolean; onAdd(): void }) {
  const id = useId();
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: `library-${type}`, data: { kind: "library", sectionType: type }, disabled: disabled || Boolean(reason) });
  const label = sectionRegistry.getType(type)?.meta.label.vi ?? type;
  return <li>
    {/* Enter/Space thêm bằng nút native; KeyboardSensor dành cho sắp xếp trong danh sách. */}
    <button ref={setNodeRef} {...attributes} {...listeners} onKeyDown={undefined} type="button" data-testid={`lib-${type}`} aria-label={`Thêm ${label}`} aria-disabled={Boolean(reason) || disabled}
      aria-describedby={reason ? id : undefined} disabled={disabled || Boolean(reason)} onClick={onAdd}
      style={{ transform: CSS.Translate.toString(transform) }} className={`${button} relative z-20 w-full touch-none text-left`}>Thêm {label}</button>
    {reason && <p id={id} className="mt-1 text-sm text-fg-muted">{reason}</p>}
  </li>;
}

function SectionRow({ section, index, count, disabled, selected, reduced, onSelect, onMove }: {
  section: EditableSection; index: number; count: number; disabled: boolean; selected: boolean; reduced: boolean; onSelect(): void; onMove(to: number): void;
}) {
  const label = sectionRegistry.getType(section.type)?.meta.label.vi ?? section.type;
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition } = useSortable({ id: section.id, data: { kind: "section", label: `${label}, vị trí ${index + 1}` }, disabled, transition: reduced ? null : undefined });
  return <li ref={setNodeRef} data-testid="section" data-section-id={section.id} data-section-type={section.type}
    style={{ transform: CSS.Transform.toString(transform), transition: reduced ? undefined : transition }}
    className={`min-w-0 space-y-2 rounded-card border p-3 ${selected ? "border-primary bg-bg-tint" : "border-line/20 bg-bg"}`}>
    <div className="flex items-center gap-2">
      <button ref={setActivatorNodeRef} {...attributes} {...listeners} type="button" disabled={disabled} aria-label={`Kéo để sắp xếp: ${label} (${section.id})`} className={`${button} touch-none cursor-grab`}><span aria-hidden="true">⠿</span></button>
      <button type="button" onClick={onSelect} aria-pressed={selected} aria-label={`Chọn ${label} (${section.id})`} className={`${button} min-w-0 flex-1 break-words`}>{index + 1}. {label} · {section.variant}{!section.enabled && " · Đang ẩn"}</button>
    </div>
    <div className="flex gap-2">
      <button type="button" className={button} disabled={disabled || index === 0} onClick={() => onMove(index - 1)} aria-label={`Lên trên: ${label} (${section.id})`}>Lên</button>
      <button type="button" className={button} disabled={disabled || index === count - 1} onClick={() => onMove(index + 1)} aria-label={`Xuống dưới: ${label} (${section.id})`}>Xuống</button>
    </div>
  </li>;
}

function EndDrop({ disabled, empty }: { disabled: boolean; empty: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: "builder-end", data: { kind: "end" }, disabled });
  return <div ref={setNodeRef} data-testid="section-end" className={`flex min-h-11 items-center justify-center rounded-card border border-dashed p-3 text-sm text-fg-muted ${isOver ? "border-primary bg-bg-tint" : "border-line/25"}`}>{empty ? "Trang chưa có section. Thả section đầu tiên tại đây." : "Thả vào cuối trang"}</div>;
}
