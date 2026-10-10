import { z } from "zod";
import { defineSectionType } from "@solar/sections";

export const demo = defineSectionType({
  type: "demo-b",
  schemaVersion: 1,
  schema: z.object({ title: z.object({ vi: z.string(), en: z.string().optional() }) }),
  defaults: { title: { vi: "[DỮ LIỆU MẪU] Section demo-b" } },
  meta: { label: { vi: "Section mẫu demo-b" }, icon: "layout" },
});
