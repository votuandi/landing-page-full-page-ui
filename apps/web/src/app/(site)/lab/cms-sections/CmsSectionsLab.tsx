"use client";

import { useState } from "react";
import { SectionListEditor, type EditableSection } from "@solar/cms-ui";
import { sectionLimitIssues } from "@solar/sections";

const initial: EditableSection[] = [
  { id: "hero", type: "hero", variant: "t12", enabled: true },
  { id: "calculator", type: "calculator", variant: "t15", enabled: false },
];
const control = "min-h-11 rounded-button border border-line/20 px-4 py-2 text-sm text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40";
export default function CmsSectionsLab() {
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(JSON.stringify(initial));
  const [message, setMessage] = useState("");
  return <div className="space-y-4">
    <SectionListEditor value={value} onChange={setValue} can={{ reorder: true, variantSwitch: true }}
      allowedTypes={["hero", "calculator", "projects"]} lockedTypes={["shorts"]} />
    <div className="flex flex-wrap gap-2">
      <button type="button" className={control} disabled={saved === JSON.stringify(value) || sectionLimitIssues(value).length > 0}
        onClick={() => { setSaved(JSON.stringify(value)); setMessage("Đã lưu nháp"); }}>Lưu nháp</button>
      <button type="button" className={control} onClick={() => setValue([...initial, { ...initial[1], id: "calculator-legacy" }])}>Nạp dữ liệu vượt giới hạn</button>
    </div>
    <p role="status" className="text-sm text-fg-muted">{message}</p>
    <output data-testid="sections-saved" className="block break-all text-xs text-fg-muted">{saved}</output>
  </div>;
}
