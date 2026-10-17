import { z } from "zod";
import { defineSectionType } from "@solar/sections";

export const demo = defineSectionType({
  type: "demo-crash",
  schemaVersion: 1,
  schema: z.object({ title: z.object({ vi: z.string(), en: z.string().optional() }) }),
  defaults: { title: { vi: "[DỮ LIỆU MẪU] Section ném lỗi khi render ở client" } },
  meta: { label: { vi: "Section mẫu lỗi client" }, icon: "layout" },
});
