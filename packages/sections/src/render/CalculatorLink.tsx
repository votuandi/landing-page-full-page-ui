"use client";

import type { ReactNode } from "react";
import type { CalculatorPrefill } from "@solar/core";
import { handleCalculatorClick } from "../fields/calculatorClick";
import { useOpenCalculator } from "../state/SiteState";

export function CalculatorLink({ href, prefill, className, children }: {
  href: string;
  prefill: CalculatorPrefill;
  className?: string;
  children: ReactNode;
}) {
  const openCalculator = useOpenCalculator();
  return <a href={href} className={className} onClick={(event) => handleCalculatorClick(event, prefill, openCalculator)}>{children}</a>;
}
