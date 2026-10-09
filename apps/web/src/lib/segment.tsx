"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { scrollToSection, segmentFromParam, type Segment } from "@solar/core";

type SegmentState = {
  /** Phân khúc đang chọn; null = "Tất cả". */
  segment: Segment | null;
  /** Tăng mỗi lần phân khúc được CHỌN CHỦ ĐỘNG (kể cả chọn lại cùng phân khúc) để calculator điền lại. */
  version: number;
  /** Nguồn lead của lần chọn gần nhất (vd. "story-cta" khi đến calculator từ nút trong video). */
  source?: string;
  setSegment: (segment: Segment | null) => void;
  /** Chọn phân khúc rồi cuộn tới section (vd. video, calculator). */
  focusSegment: (segment: Segment, sectionId: string, source?: string) => void;
};

const SegmentContext = createContext<SegmentState | null>(null);

/**
 * State phân khúc dùng chung của trang chủ: lưới phân khúc ghi vào, video / gói giải pháp /
 * calculator / công trình đọc ra để lọc hoặc điền sẵn. Hỗ trợ `?phan-khuc=ho-gia-dinh` trên URL.
 */
export function SegmentProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ segment: Segment | null; version: number; source?: string }>({ segment: null, version: 0 });

  const setSegment = useCallback((segment: Segment | null, source?: string) => {
    setState((s) => ({ segment, version: s.version + 1, source }));
  }, []);

  const focusSegment = useCallback((segment: Segment, sectionId: string, source?: string) => {
    setSegment(segment, source);
    // chờ React render bộ lọc mới rồi mới cuộn để vị trí đích không bị nhảy
    requestAnimationFrame(() => scrollToSection(sectionId, segment));
  }, [setSegment]);

  useEffect(() => {
    const fromUrl = segmentFromParam(new URLSearchParams(window.location.search).get("phan-khuc"));
    if (fromUrl) setSegment(fromUrl);
  }, [setSegment]);

  const value = useMemo(() => ({ ...state, setSegment, focusSegment }), [state, setSegment, focusSegment]);
  return <SegmentContext.Provider value={value}>{children}</SegmentContext.Provider>;
}

const FALLBACK: SegmentState = {
  segment: null,
  version: 0,
  setSegment: () => {},
  focusSegment: (segment, sectionId) => scrollToSection(sectionId, segment),
};

/** Dùng được cả ngoài trang chủ (trả về state rỗng, CTA chuyển hướng về trang chủ). */
export function useSegment() {
  return useContext(SegmentContext) ?? FALLBACK;
}
