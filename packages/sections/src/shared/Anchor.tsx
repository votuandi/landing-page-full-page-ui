"use client";

import type { ReactNode } from "react";
import { handleCalculatorClick } from "../fields/calculatorClick";
import type { ClientLink } from "./links";

/** Anchor cho island: href chạy khi tắt JS; link calculator mở dự toán qua calculatorBus. */
export function Anchor({ link, className, children, onNavigate }: {
  link: ClientLink; className?: string; children?: ReactNode; onNavigate?: () => void;
}) {
  return (
    <a href={link.href} className={className}
      target={link.external ? "_blank" : undefined} rel={link.external ? "noopener noreferrer" : undefined}
      onClick={(event) => {
        if (link.calculator) handleCalculatorClick(event, link.calculator);
        onNavigate?.();
      }}>
      {children ?? link.label}
    </a>
  );
}
