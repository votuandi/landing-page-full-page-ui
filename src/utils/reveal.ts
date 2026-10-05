import type { CSSProperties } from "react";

/** Inline transition delay for a `data-reveal` element, in seconds. */
export const delay = (seconds: number) => ({ "--rd": `${seconds}s` }) as CSSProperties;
