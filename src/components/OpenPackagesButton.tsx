"use client";

import type { ReactNode } from "react";
import type { Segment } from "@/config/solar";
import { openPackages } from "@/lib/calculatorBus";

/** Nút nhỏ phía client; nội dung bên trong vẫn render phía server. */
export default function OpenPackagesButton({ segment, className, children }: { segment: Segment; className?: string; children: ReactNode }) {
  return <button type="button" onClick={() => openPackages(segment)} className={className}>{children}</button>;
}
