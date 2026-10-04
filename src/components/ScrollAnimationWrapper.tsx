"use client";

import type { ReactNode } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export type ScrollAnimation =
  | "fade-in"
  | "fade-in-up"
  | "fade-in-down"
  | "fade-in-left"
  | "fade-in-right"
  | "slide-in-left"
  | "slide-in-right"
  | "slide-in-up"
  | "slide-in-down"
  | "zoom-in"
  | "zoom-in-up"
  | "zoom-in-down"
  | "scale-up"
  | "bounce-in"
  | "fall-down"
  | "drop-in";

interface ScrollAnimationWrapperProps {
  children: ReactNode;
  animation?: ScrollAnimation;
  delay?: number;
  duration?: number;
  threshold?: number;
  className?: string;
  triggerOnce?: boolean;
}

const hiddenClasses: Record<ScrollAnimation, string> = {
  "fade-in": "opacity-0",
  "fade-in-up": "opacity-0 translate-y-8",
  "fade-in-down": "opacity-0 -translate-y-8",
  "fade-in-left": "opacity-0 -translate-x-8",
  "fade-in-right": "opacity-0 translate-x-8",
  "slide-in-left": "opacity-0 -translate-x-16",
  "slide-in-right": "opacity-0 translate-x-16",
  "slide-in-up": "opacity-0 translate-y-16",
  "slide-in-down": "opacity-0 -translate-y-16",
  "zoom-in": "opacity-0 scale-90",
  "zoom-in-up": "opacity-0 scale-90 translate-y-8",
  "zoom-in-down": "opacity-0 scale-90 -translate-y-8",
  "scale-up": "opacity-0 scale-95",
  "bounce-in": "opacity-0 scale-95",
  "fall-down": "opacity-0 -translate-y-12 scale-95",
  "drop-in": "opacity-0 -translate-y-20",
};

export default function ScrollAnimationWrapper({
  children,
  animation = "fade-in-up",
  delay = 0,
  duration = 800,
  threshold = 0.1,
  className = "",
  triggerOnce = true,
}: ScrollAnimationWrapperProps) {
  const { elementRef, isVisible } = useScrollAnimation({ threshold, triggerOnce });

  return (
    <div
      ref={elementRef}
      className={[
        "transition-all ease-out motion-reduce:transition-none",
        isVisible
          ? "opacity-100 translate-y-0 translate-x-0 scale-100"
          : hiddenClasses[animation],
        className,
      ].join(" ")}
      style={{
        transitionDelay: `${delay}ms`,
        transitionDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  );
}
