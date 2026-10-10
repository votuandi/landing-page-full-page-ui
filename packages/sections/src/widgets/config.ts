import { z } from "zod";

export const widgetEntrySchema = z.object({
  enabled: z.boolean().default(false), variant: z.string().min(1).default("t15"), data: z.unknown().optional(),
});
export const siteWidgetsSchema = z.object({
  "contact-dock": widgetEntrySchema.optional(),
  "consult-popup": widgetEntrySchema.optional(),
  "mobile-bottom-nav": widgetEntrySchema.optional(),
  "commitments-strip": widgetEntrySchema.optional(),
  "quote-cart": widgetEntrySchema.optional(),
  "theme-switch": widgetEntrySchema.optional(),
  "scroll-progress": widgetEntrySchema.optional(),
 }).superRefine((widgets, ctx) => {
  const dock = widgets["contact-dock"];
  if (dock?.enabled && widgets["mobile-bottom-nav"]?.enabled && dock.data && typeof dock.data === "object"
    && "mobileBar" in dock.data && dock.data.mobileBar === true) {
    ctx.addIssue({ code: "custom", path: ["contact-dock", "data", "mobileBar"], message: "Mobile bars cannot overlap" });
  }
});
export type SiteWidgetsConfig = z.output<typeof siteWidgetsSchema>;
