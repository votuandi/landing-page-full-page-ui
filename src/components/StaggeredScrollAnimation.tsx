"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import type { ScrollAnimation } from "./ScrollAnimationWrapper";

interface StaggeredScrollAnimationProps {
  children: ReactNode;
  staggerDelay?: number;
  animation?: ScrollAnimation;
  duration?: number;
  threshold?: number;
  className?: string;
}

const hiddenClasses: Partial<Record<ScrollAnimation, string>> = {
  "fade-in": "opacity-0",
  "fade-in-up": "opacity-0 translate-y-6",
  "fade-in-down": "opacity-0 -translate-y-6",
  "fade-in-left": "opacity-0 -translate-x-6",
  "fade-in-right": "opacity-0 translate-x-6",
  "slide-in-left": "opacity-0 -translate-x-12",
  "slide-in-right": "opacity-0 translate-x-12",
  "slide-in-up": "opacity-0 translate-y-12",
  "zoom-in": "opacity-0 scale-90",
  "bounce-in": "opacity-0 scale-95",
  "fall-down": "opacity-0 -translate-y-8 scale-95",
  "drop-in": "opacity-0 -translate-y-16",
};

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

  return (
    <div ref={elementRef} className={className}>
      {Children.map(children, (child, index) => {
        if (!isValidElement(child)) return child;

        const element = child as ReactElement<{
          className?: string;
          style?: CSSProperties;
        }>;
        const animationClass = isVisible
          ? "opacity-100 translate-y-0 translate-x-0 scale-100"
          : hiddenClasses[animation] ?? "opacity-0 translate-y-6";

        return cloneElement(element, {
          className: [
            element.props.className,
            "transition-all ease-out motion-reduce:transition-none",
            animationClass,
          ]
            .filter(Boolean)
            .join(" "),
          style: {
            ...element.props.style,
            transitionDelay: `${isVisible ? staggerDelay * index : 0}ms`,
            transitionDuration: `${duration}ms`,
          },
        });
      })}
    </div>
  );
}
