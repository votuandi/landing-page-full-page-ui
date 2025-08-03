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

  const getAnimationClass = () => {
    const baseClass = "transition-all";
    const durationClass = `duration-${duration}`;

    if (isVisible) {
      return `${baseClass} ${durationClass} opacity-100 translate-y-0 translate-x-0 scale-100 rotate-0`;
    }

    switch (animation) {
      case "fade-in":
        return `${baseClass} ${durationClass} opacity-0 ease-out`;
      case "fade-in-up":
        return `${baseClass} ${durationClass} opacity-0 translate-y-8 ease-out`;
      case "fade-in-down":
        return `${baseClass} ${durationClass} opacity-0 -translate-y-8 ease-out`;
      case "fade-in-left":
        return `${baseClass} ${durationClass} opacity-0 -translate-x-8 ease-out`;
      case "fade-in-right":
        return `${baseClass} ${durationClass} opacity-0 translate-x-8 ease-out`;
      case "slide-in-left":
        return `${baseClass} ${durationClass} opacity-0 -translate-x-16 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]`;
      case "slide-in-right":
        return `${baseClass} ${durationClass} opacity-0 translate-x-16 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]`;
      case "slide-in-up":
        return `${baseClass} ${durationClass} opacity-0 translate-y-16 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]`;
      case "slide-in-down":
        return `${baseClass} ${durationClass} opacity-0 -translate-y-16 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]`;
      case "zoom-in":
        return `${baseClass} ${durationClass} opacity-0 scale-90 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]`;
      case "zoom-in-up":
        return `${baseClass} ${durationClass} opacity-0 scale-90 translate-y-8 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]`;
      case "zoom-in-down":
        return `${baseClass} ${durationClass} opacity-0 scale-90 -translate-y-8 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]`;
      case "scale-up":
        return `${baseClass} ${durationClass} opacity-0 scale-95 ease-out`;
      case "bounce-in":
        return `${baseClass} ${durationClass} opacity-0 scale-95 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)]`;
      case "fall-down":
        return `${baseClass} ${durationClass} opacity-0 -translate-y-12 scale-95 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]`;
      case "drop-in":
        return `${baseClass} ${durationClass} opacity-0 -translate-y-20 ease-[cubic-bezier(0.34,1.56,0.64,1)]`;
      default:
        return `${baseClass} ${durationClass} opacity-0 translate-y-8 ease-out`;
    }
  };

  return (
    <div
      ref={elementRef as any}
      className={`${getAnimationClass()} ${className}`}
      style={{
        transitionDelay: `${delay}ms`,
        transitionDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  );
}
