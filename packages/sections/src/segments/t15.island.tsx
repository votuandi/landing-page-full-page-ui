"use client";

import type { ReactNode } from "react";
import type { Segment } from "@solar/core";
import { isPlainClick } from "../fields/calculatorClick";
import { useSegment } from "../state/SiteState";

export function SegmentLink({ segment, anchor, href, className, children }: {
  segment: Segment; anchor: string; href: string; className?: string; children: ReactNode;
}) {
  const shared = useSegment();
  return <a href={href} className={className} aria-current={shared.segment === segment ? "true" : undefined}
    onClick={(event) => {
      if (!isPlainClick(event)) return;
      event.preventDefault();
      shared.focusSegment(segment, anchor, "segments");
    }}>{children}</a>;
}
