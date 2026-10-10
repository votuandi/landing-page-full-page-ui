import { z } from "zod";
import { defineSectionType, defineVariants, type SectionVariant } from "../define";

export const demo = defineSectionType({
  type: "demo",
  schemaVersion: 1,
  schema: z.object({ title: z.string(), count: z.number().default(0) }),
  defaults: { title: "[DỮ LIỆU MẪU] Section", count: 0 },
  meta: { label: { vi: "Section mẫu" }, icon: "layout" },
});

const first: SectionVariant<typeof demo> = ({ data }) => data.title;
const second: SectionVariant<typeof demo> = async ({ data }) => `${data.title}: ${data.count}`;
export const v1 = async () => ({ default: first });
export const v2 = async () => ({ default: second });
export const variants = defineVariants(demo, "v1", { v1, v2 });

export const other = defineSectionType({
  type: "other",
  schemaVersion: 1,
  schema: z.object({ amount: z.number() }),
  defaults: { amount: 1 },
  meta: { label: { vi: "Kiểu khác" }, icon: "layout" },
});
export const otherLoader = async () => ({
  default: (({ data }) => data.amount) satisfies SectionVariant<typeof other>,
});
