"use client";

import { ReactNode } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

interface ScrollAnimationWrapperProps {
  children: ReactNode;
  animation?:
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
  delay?: number;
  duration?: number;
  threshold?: number;
  className?: string;
  triggerOnce?: boolean;
}

export default function ScrollAnimationWrapper({
  children,
  animation = "fade-in-up",
  delay = 0,
  duration = 800,
  threshold = 0.1,
  className = "",
  triggerOnce = true,
}: ScrollAnimationWrapperProps) {
  const { elementRef, isVisible } = useScrollAnimation({
    threshold,
    triggerOnce,
  });

  return (
    <div
      ref={elementRef}
      className={`reveal ${isVisible ? "reveal-in" : ""} ${className}`}
      data-animation={animation}
      style={{
        animationDelay: `${delay}ms`,
        animationDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  );
}
