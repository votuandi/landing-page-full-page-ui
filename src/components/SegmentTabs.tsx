"use client";

import { useRef, type KeyboardEvent } from "react";
import { SEGMENTS, SEGMENT_ORDER, type Segment } from "@/config/solar";

/** Tab phân khúc có hỗ trợ bàn phím (← →, Home, End) theo mẫu WAI-ARIA Tabs. */
export default function SegmentTabs<T extends Segment | "all">({ value, onChange, idPrefix, withAll = false, label }: {
  value: T;
  onChange: (v: T) => void;
  idPrefix: string;
  withAll?: boolean;
  label: string;
}) {
  const options = [...(withAll ? (["all"] as const) : []), ...SEGMENT_ORDER] as T[];
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKey = (e: KeyboardEvent, index: number) => {
    const last = options.length - 1;
    const next = e.key === "ArrowRight" ? (index === last ? 0 : index + 1) : e.key === "ArrowLeft" ? (index === 0 ? last : index - 1) : e.key === "Home" ? 0 : e.key === "End" ? last : -1;
    if (next < 0) return;
    e.preventDefault();
    onChange(options[next]);
    refs.current[next]?.focus();
  };

  return (
    <div role="tablist" aria-label={label} className="t12-no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      {options.map((option, i) => (
        <button
          key={option}
          ref={(el) => { refs.current[i] = el; }}
          type="button"
          role="tab"
          id={`${idPrefix}-tab-${option}`}
          aria-controls={`${idPrefix}-panel`}
          aria-selected={value === option}
          tabIndex={value === option ? 0 : -1}
          onClick={() => onChange(option)}
          onKeyDown={(e) => onKey(e, i)}
          className="t12-chip shrink-0"
        >
          {option === "all" ? "Tất cả" : SEGMENTS[option as Segment].short}
        </button>
      ))}
    </div>
  );
}
