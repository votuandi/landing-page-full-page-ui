"use client";

import React, {
  ReactNode,
  Children,
  cloneElement,
  isValidElement,
} from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

interface StaggeredScrollAnimationProps {
  children: ReactNode;
  staggerDelay?: number;
  animation?:
    | "fade-in"
    | "fade-in-up"
    | "fade-in-down"
    | "fade-in-left"
    | "fade-in-right"
    | "slide-in-left"
    | "slide-in-right"
    | "slide-in-up"
    | "zoom-in"
    | "bounce-in"
    | "fall-down"
    | "drop-in";
  duration?: number;
  threshold?: number;
  className?: string;
}

export default function StaggeredScrollAnimation({
  children,
  staggerDelay = 100,
  animation = "fade-in-up",
  duration = 600,
  threshold = 0.1,
  className = "",
}: StaggeredScrollAnimationProps) {
  const { elementRef, isVisible } = useScrollAnimation({
    threshold,
    triggerOnce: true,
  });

  const getAnimationClass = (index: number) => {
    const baseClass = "transition-all";
    const durationClass = `duration-${duration}`;

    if (isVisible) {
      return `${baseClass} ${durationClass} opacity-100 translate-y-0 translate-x-0 scale-100`;
    }

    switch (animation) {
      case "fade-in":
        return `${baseClass} ${durationClass} opacity-0 ease-out`;
      case "fade-in-up":
        return `${baseClass} ${durationClass} opacity-0 translate-y-6 ease-out`;
      case "fade-in-down":
        return `${baseClass} ${durationClass} opacity-0 -translate-y-6 ease-out`;
      case "fade-in-left":
        return `${baseClass} ${durationClass} opacity-0 -translate-x-6 ease-out`;
      case "fade-in-right":
        return `${baseClass} ${durationClass} opacity-0 translate-x-6 ease-out`;
      case "slide-in-left":
        return `${baseClass} ${durationClass} opacity-0 -translate-x-12 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]`;
      case "slide-in-right":
        return `${baseClass} ${durationClass} opacity-0 translate-x-12 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]`;
      case "slide-in-up":
        return `${baseClass} ${durationClass} opacity-0 translate-y-12 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]`;
      case "zoom-in":
        return `${baseClass} ${durationClass} opacity-0 scale-90 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]`;
      case "bounce-in":
        return `${baseClass} ${durationClass} opacity-0 scale-95 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)]`;
      case "fall-down":
        return `${baseClass} ${durationClass} opacity-0 -translate-y-8 scale-95 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]`;
      case "drop-in":
        return `${baseClass} ${durationClass} opacity-0 -translate-y-16 ease-[cubic-bezier(0.34,1.56,0.64,1)]`;
      default:
        return `${baseClass} ${durationClass} opacity-0 translate-y-6 ease-out`;
    }
  };

  return (
    <div ref={elementRef as any} className={className}>
      {Children.map(children, (child, index) => {
        if (isValidElement(child)) {
          const childProps = child.props as any;
          const existingStyle = (childProps?.style ||
            {}) as React.CSSProperties;

          return cloneElement(child, {
            ...childProps,
            className: `${childProps?.className || ""} ${getAnimationClass(
              index
            )}`.trim(),
            style: {
              ...existingStyle,
              transitionDelay: `${isVisible ? staggerDelay * index : 0}ms`,
            },
          });
        }
        return child;
      })}
    </div>
  );
}
