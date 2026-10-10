import { z } from "zod";
import { defineSectionType } from "../../define";
import { fixture } from "./fixtures";

export const scrollProgressSchema = z.object({
  
});
export const scrollProgress = defineSectionType({
  type: "scroll-progress", schemaVersion: 1, schema: scrollProgressSchema, defaults: scrollProgressSchema.parse(fixture),
  meta: {"label": {"vi": "scroll-progress"}, "icon": "scroll-progress"},
});
