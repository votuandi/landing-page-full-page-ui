"use client";
import type { ReactNode } from "react";
import { openConsult } from "../events";
export default function ConsultButton({ label, className, children }: { label: string; className: string; children: ReactNode }) {
  return <button type="button" aria-label={label} onClick={openConsult} className={className}>{children}</button>;
}
