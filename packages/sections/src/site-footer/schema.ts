import { z } from "zod";
import { defineSectionType } from "../define";
import { link, localized, mediaRef } from "../fields";
import { phone } from "../site-header/schema";
import { siteFooterFixture } from "./fixtures";

export const siteFooterSchema = z.object({
  brand: z.object({ name: z.string().min(1).max(60), tagline: localized({ max: 200 }), logo: mediaRef().optional() }),
  socials: z.array(z.object({
    kind: z.enum(["facebook", "youtube", "tiktok", "zalo"]),
    url: z.url({ protocol: /^https?$/ }),
    label: z.string().min(1).max(40),
  })).max(6),
  legal: z.object({
    legalName: z.string().max(160),
    lines: z.array(localized({ max: 200 })).max(6),
    badges: z.array(z.string().max(30)).max(6),
    /** Khung "Đã thông báo Bộ Công Thương" (placeholder, không dùng logo thật); có url → thành link. */
    moitBadge: z.object({ enabled: z.boolean(), url: z.url({ protocol: /^https?$/ }).optional() }),
  }),
  complaintHotline: z.object({ label: localized({ max: 60 }), phone: phone() }).optional(),
  branchesTitle: localized({ max: 40 }),
  branches: z.array(z.object({
    name: z.string().min(1).max(60),
    stores: z.array(z.object({ name: z.string().min(1).max(80), address: z.string().max(200).optional(), phone: phone() })).min(1).max(6),
  })).max(8),
  columns: z.array(z.object({ title: localized({ max: 40 }), links: z.array(link()).max(10) })).max(4),
  contactNote: localized({ multiline: true, max: 200 }),
  disclaimer: z.array(localized({ max: 200 })).max(3),
});

export const siteFooter = defineSectionType({
  type: "site-footer",
  schemaVersion: 1,
  schema: siteFooterSchema,
  defaults: siteFooterSchema.parse(siteFooterFixture),
  meta: { label: { vi: "Chân trang", en: "Site footer" }, icon: "footer", maxPerPage: 1 },
});
