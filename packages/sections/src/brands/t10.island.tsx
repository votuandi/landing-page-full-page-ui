"use client";

import { useState } from "react";
import { Wordmark } from "@solar/ui";
import { T10 } from "../shared/t10";

type Item = { name: string; group: string; groupLabel: string; logo?: string };

export default function ClientWall({ ui, title, groups, items }: {
  ui: { all: string; pause: string; play: string; filter: string }; title: string; groups: { id: string; label: string }[]; items: Item[];
}) {
  const [group, setGroup] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const shown = items.filter((item) => !group || item.group === group);
  return (
    <>
      {groups.length > 1 && (
        <div role="group" aria-label={ui.filter} className="mb-7 flex flex-wrap gap-2">
          {[{ id: null, label: ui.all }, ...groups].map((option) => (
            <button key={option.id ?? "all"} type="button" aria-pressed={group === option.id} className={T10.pill} onClick={() => setGroup(option.id)}>{option.label}</button>
          ))}
        </div>
      )}
      <button type="button" aria-pressed={paused} className={`${T10.button} ${T10.secondary} mb-4`} onClick={() => setPaused(!paused)}>{paused ? ui.play : ui.pause}</button>
      <div className="t15-marquee" tabIndex={0} aria-label={title}>
        <div key={group ?? "all"} className="t15-marquee-track flex w-max" style={paused ? { animationPlayState: "paused", animationDuration: "65s" } : { animationDuration: "65s" }}>
          {[false, true].map((duplicate) => (
            <ul key={String(duplicate)} aria-hidden={duplicate || undefined} className={`flex gap-4 pr-4 ${duplicate ? "t15-marquee-dup" : ""}`}>
              {shown.map((item, i) => (
                <li key={i} className="w-[230px] shrink-0 rounded-card border border-line/10 bg-bg-elevated p-5">
                  <Wordmark name={item.name} src={item.logo} size="lg" className="max-w-full" />
                  <p className="mt-3 text-xs leading-6 text-fg-muted">{item.name}</p>
                  <p className="mt-1 text-xs font-bold text-primary-strong">{item.groupLabel}</p>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </>
  );
}
