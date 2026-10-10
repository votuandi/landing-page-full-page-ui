import { z } from "zod";
import { localized } from "./localized";
import { fieldRegistry } from "./widget";

export function mediaRef() {
  return z.object({
    id: z.string().min(1),
    alt: localized(),
    focal: z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }).optional(),
  }).register(fieldRegistry, { widget: "media" });
}

export type MediaRef = z.output<ReturnType<typeof mediaRef>>;
