"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { SEGMENTS, SEGMENT_IDS, type Segment } from "@/content/site";
export const parseSegment = (
  value: string | null | undefined,
): Segment | null =>
  SEGMENT_IDS.includes(value as Segment) ? (value as Segment) : null;
const Context = createContext<{
  segment: Segment | null;
  select: (s: Segment | null) => void;
}>({ segment: null, select: () => {} });
export function SegmentProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [segment, setSegment] = useState<Segment | null>(null);
  useEffect(() => {
    const sync = () =>
      setSegment(
        SEGMENT_IDS.find(
          (id) => pathname === `/giai-phap/${SEGMENTS[id].slug}`,
        ) ??
          parseSegment(
            new URLSearchParams(window.location.search).get("segment"),
          ),
      );
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, [pathname]);
  const select = useCallback((s: Segment | null) => {
    setSegment(s);
    const url = new URL(window.location.href);
    if (s) url.searchParams.set("segment", s);
    else url.searchParams.delete("segment");
    window.history.replaceState(null, "", url);
  }, []);
  return (
    <Context.Provider value={{ segment, select }}>{children}</Context.Provider>
  );
}
export const useSegment = () => useContext(Context);
export function contactUrl(segment: Segment | null, extra?: URLSearchParams) {
  const q = extra ?? new URLSearchParams();
  if (segment) q.set("segment", segment);
  return `/contact-us${q.size ? `?${q}` : ""}`;
}
