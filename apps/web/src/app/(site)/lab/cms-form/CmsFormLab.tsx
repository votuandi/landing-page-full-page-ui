"use client";

import { useState } from "react";
import type { z } from "zod";
import { SchemaForm } from "@solar/cms-ui";
import { sectionRegistry } from "@solar/sections";

const calculator = sectionRegistry.types.calculator;

export default function CmsFormLab() {
  const [value, setValue] = useState(() => structuredClone(calculator.defaults) as z.input<typeof calculator.schema>);
  const [saved, setSaved] = useState<string>("");
  return (
    <div className="space-y-4">
      <div className="rounded-card border border-line/15 bg-bg-elevated p-4 sm:p-6">
        <SchemaForm schema={calculator.schema} value={value} bilingual submitLabel="Kiểm tra"
          onChange={(next) => { setValue(next); setSaved(""); }} onSubmit={(data) => setSaved(JSON.stringify(data))} />
      </div>
      <output data-testid="cms-form-saved" className="block break-all text-xs text-fg-muted">{saved}</output>
    </div>
  );
}
