"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { CALCULATOR_ID, openCalculator, segmentFromParam, type CalculatorPrefill, type Segment } from "@solar/core";
import { openConsult } from "../widgets/events";
import { resolveCalculatorAction, withSegmentParam } from "./logic";

type SegmentState = {
  segment: Segment | null;
  version: number;
  source?: string;
  setSegment(segment: Segment | null, source?: string): void;
  focusSegment(segment: Segment, anchor: string, source?: string): void;
};
const SiteState = createContext<(SegmentState & { calculatorHref?: string | null }) | null>(null);

function useSegmentStore(): SegmentState {
  const [state, setState] = useState<{ segment: Segment | null; version: number; source?: string }>({ segment: null, version: 0 });
  useEffect(() => {
    const segment = segmentFromParam(new URLSearchParams(window.location.search).get("phan-khuc"));
    if (segment) setState({ segment, version: 1, source: "url" });
  }, []);
  const setSegment = useCallback((segment: Segment | null, source?: string) => {
    setState((previous) => ({ segment, version: previous.version + 1, source }));
    const { pathname, search, hash } = window.location;
    window.history.replaceState(window.history.state, "", `${pathname}${withSegmentParam(search, segment)}${hash}`);
  }, []);
  const focusSegment = useCallback((segment: Segment, anchor: string, source?: string) => {
    setSegment(segment, source);
    requestAnimationFrame(() => document.getElementById(anchor)?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start",
    }));
  }, [setSegment]);
  return { ...state, setSegment, focusSegment };
}

export function SiteStateProvider({ children, calculatorHref }: { children: ReactNode; calculatorHref?: string | null }) {
  const state = useSegmentStore();
  return <SiteState.Provider value={{ ...state, calculatorHref }}>{children}</SiteState.Provider>;
}

export function useSegment(): SegmentState {
  const context = useContext(SiteState);
  const local = useSegmentStore();
  return context ?? local;
}

export function useOpenCalculator(): (input?: Segment | CalculatorPrefill) => void {
  const calculatorHref = useContext(SiteState)?.calculatorHref;
  return useCallback((input?: Segment | CalculatorPrefill) => {
    const prefill = typeof input === "string" ? { segment: input } : input ?? {};
    const action = resolveCalculatorAction(!!document.getElementById(CALCULATOR_ID), calculatorHref, prefill);
    if (action.kind === "bus") openCalculator(prefill);
    else if (action.kind === "navigate") window.location.href = action.href;
    else openConsult();
  }, [calculatorHref]);
}
