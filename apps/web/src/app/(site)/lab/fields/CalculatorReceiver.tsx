"use client";

import { useEffect, useState } from "react";
import { onOpenCalculator, type CalculatorPrefill } from "@solar/core";

export default function CalculatorReceiver() {
  const [prefill, setPrefill] = useState<CalculatorPrefill | null>(null);
  useEffect(() => onOpenCalculator(setPrefill), []);
  return (
    <output data-testid="calc-prefill" aria-live="polite" className="block break-words text-fg-muted">
      {prefill === null ? "Chưa nhận yêu cầu dự toán" : JSON.stringify(prefill)}
    </output>
  );
}
