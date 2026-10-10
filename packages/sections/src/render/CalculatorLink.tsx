"use client";

import type { ReactNode } from "react";
import type { CalculatorPrefill } from "@solar/core";
import { handleCalculatorClick } from "../fields/calculatorClick";

export function CalculatorLink({ href, prefill, className, children }: {
  href: string;
  prefill: CalculatorPrefill;
  className?: string;
  children: ReactNode;
}) {
  return <a href={href} className={className} onClick={(event) => handleCalculatorClick(event, prefill)}>{children}</a>;
}
