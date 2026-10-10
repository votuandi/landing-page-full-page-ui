import { z } from "zod";
import { defineSectionType } from "../../define";
import { localized, link } from "../../fields";
import { fixture } from "./fixtures";

export const contactDockSchema = z.object({
  items: z.array(z.object({ kind: z.enum(["consult", "call", "zalo", "messenger"]), label: localized(), link: link().optional() }).refine((item) => item.kind === "consult" || Boolean(item.link), { message: "Contact link required", path: ["link"] })).min(1).max(4),
  mobileBar: z.boolean().default(false), ariaLabel: localized(),
});
export const contactDock = defineSectionType({
  type: "contact-dock", schemaVersion: 1, schema: contactDockSchema, defaults: contactDockSchema.parse(fixture),
  meta: {"label": {"vi": "contact-dock"}, "icon": "contact-dock"},
});
