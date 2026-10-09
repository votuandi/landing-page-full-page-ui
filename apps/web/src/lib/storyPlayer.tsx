"use client";

import dynamic from "next/dynamic";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { Story } from "@/data/stories";

// Trình phát chỉ được tải (JS) khi người dùng mở video lần đầu
const StoryPlayer = dynamic(() => import("@/components/StoryPlayer"), { ssr: false });

type StoryPlayerApi = {
  /** Mở trình phát tại `storyId` trong danh sách `list`; focus trả về `trigger` khi đóng. */
  open: (list: Story[], storyId: string, trigger?: HTMLElement | null) => void;
};

const Ctx = createContext<StoryPlayerApi | null>(null);

/** Một trình phát dùng chung cho carousel video (3.5) và gallery công trình (3.7). */
export function StoryPlayerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ list: Story[]; index: number } | null>(null);
  const trigger = useRef<HTMLElement | null>(null);

  const open = useCallback((list: Story[], storyId: string, el?: HTMLElement | null) => {
    const index = list.findIndex((s) => s.id === storyId);
    if (index < 0) return;
    trigger.current = el ?? (document.activeElement as HTMLElement | null);
    setState({ list, index });
  }, []);

  const close = useCallback(() => {
    setState(null);
    requestAnimationFrame(() => trigger.current?.focus({ preventScroll: true }));
  }, []);

  const api = useMemo(() => ({ open }), [open]);

  return (
    <Ctx.Provider value={api}>
      {children}
      {state && <StoryPlayer stories={state.list} startIndex={state.index} onClose={close} />}
    </Ctx.Provider>
  );
}

export function useStoryPlayer() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStoryPlayer phải nằm trong StoryPlayerProvider");
  return ctx;
}
