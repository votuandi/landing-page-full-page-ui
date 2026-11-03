"use client";

import { useId, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { LIBRARY_GROUPS, libraryStatus, SectionThumbnail, thumbnailSrc } from "@solar/cms-ui";
import { sectionRegistry } from "@solar/sections";
import type { BuilderEditor } from "../../../../../lib/pageSections.ts";

export type LibraryItem = { type: string; variant: string };
type Props = Pick<BuilderEditor, "themeId" | "sections" | "allowedTypes" | "lockedTypes" | "canReorder"> & {
  disabled: boolean; onAdd(type: string, variant: string): void;
};
const button = "min-h-11 min-w-0 rounded-input border border-line/20 bg-bg-elevated p-2 text-left text-sm text-fg hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:text-fg-muted";

export default function SectionLibrary({ themeId, sections, allowedTypes, lockedTypes, canReorder, disabled, onAdd }: Props) {
  const id = useId();
  return <aside aria-label="Thư viện section" className="max-h-[60dvh] min-w-0 space-y-4 overflow-y-auto overscroll-contain rounded-card border border-line/20 bg-bg-elevated p-3 xl:max-h-[78dvh]">
    <h2 className="text-lg font-semibold text-fg">Thư viện section</h2>
    {!canReorder && <p id={`${id}-readonly`} className="text-sm text-fg-muted">Gói hoặc quyền hiện tại không cho thêm section.</p>}
    {LIBRARY_GROUPS.map(group => <section key={group.id} aria-labelledby={`${id}-${group.id}`} className="space-y-2">
      <h3 id={`${id}-${group.id}`} className="font-semibold text-fg">{group.label}</h3>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">{group.types.map(type => {
        const status = libraryStatus(type, sections, allowedTypes, lockedTypes);
        const reason = !canReorder ? "Gói hoặc quyền hiện tại không cho thêm section" : status.kind !== "ok" ? status.reason : undefined;
        return <LibraryRow key={type} type={type} themeId={themeId} status={status.kind} reason={reason} disabled={disabled || Boolean(reason)} onAdd={onAdd} />;
      })}</ul>
    </section>)}
  </aside>;
}

function LibraryRow({ type, themeId, status, reason, disabled, onAdd }: {
  type: string; themeId: string; status: "ok" | "locked" | "limit"; reason?: string; disabled: boolean; onAdd: Props["onAdd"];
}) {
  const [expanded, setExpanded] = useState(false);
  const id = useId(), label = sectionRegistry.getType(type)!.meta.label.vi;
  const variants = sectionRegistry.variantsOf(type)!;
  return <li data-library-type={type} data-library-status={status} className="min-w-0 space-y-2">
    <AddButton type={type} variant={variants[0]} themeId={themeId} label={`Thêm ${label}`} disabled={disabled} describedBy={reason ? `${id}-reason` : undefined} onAdd={onAdd} />
    {status === "locked" && <span className="block text-xs font-medium text-fg-muted">Khóa theo gói</span>}
    {reason && <p id={`${id}-reason`} className="text-xs text-fg-muted">{reason}</p>}
    <button type="button" aria-label={`Kiểu của ${label}`} aria-expanded={expanded} aria-controls={expanded ? `${id}-variants` : undefined} disabled={disabled}
      className="min-h-11 rounded-button px-2 text-sm text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:text-fg-muted"
      onClick={() => setExpanded(value => !value)}>Kiểu hiển thị ({variants.length})</button>
    {expanded && <div id={`${id}-variants`} className="grid grid-cols-2 gap-2">{variants.map(variant => <AddButton key={variant} type={type} variant={variant} themeId={themeId}
      label={`Thêm ${label} kiểu ${variant}`} disabled={disabled} describedBy={reason ? `${id}-reason` : undefined} onAdd={onAdd} />)}</div>}
  </li>;
}

function AddButton({ type, variant, themeId, label, disabled, describedBy, onAdd }: LibraryItem & {
  themeId: string; label: string; disabled: boolean; describedBy?: string; onAdd: Props["onAdd"];
}) {
  const id = useId();
  const { setNodeRef, attributes, listeners } = useDraggable({ id, data: { type, variant }, disabled });
  return <button type="button" ref={setNodeRef} {...attributes} {...listeners} aria-label={label} aria-roledescription="section có thể kéo"
    aria-describedby={describedBy ?? attributes["aria-describedby"]} disabled={disabled}
    className={`${button} grid w-full gap-2 ${disabled ? "" : "cursor-grab active:cursor-grabbing"}`} onClick={() => onAdd(type, variant)}>
    <SectionThumbnail src={thumbnailSrc(themeId, type, variant)} variant={variant} fill />
    <span className="break-words">{label}</span>
  </button>;
}
