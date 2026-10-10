import { z } from "zod";
import { defineSectionType } from "../../define";
import { localized, link } from "../../fields";
import { fixture } from "./fixtures";

export const mobileBottomNavSchema = z.object({
  ariaLabel: localized(), items: z.array(z.object({ icon: z.enum(["home", "menu", "call", "zalo", "calculator", "cart"]), label: localized(), link: link().optional(), emphasis: z.boolean().optional() }).refine((item) => ["menu", "cart"].includes(item.icon) || Boolean(item.link), { message: "Navigation link required", path: ["link"] })).min(3).max(5),
}).refine((data) => data.items.filter((item) => item.emphasis).length <= 1, { message: "Only one emphasized item", path: ["items"] });
export const mobileBottomNav = defineSectionType({
  type: "mobile-bottom-nav", schemaVersion: 1, schema: mobileBottomNavSchema, defaults: mobileBottomNavSchema.parse(fixture),
  meta: {"label": {"vi": "mobile-bottom-nav"}, "icon": "mobile-bottom-nav"},
});
