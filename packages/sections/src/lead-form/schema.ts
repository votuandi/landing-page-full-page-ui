import { z } from "zod";
import { defineSectionType } from "../define";
import { localized, mediaRef } from "../fields";
import { leadFormFixture } from "./fixtures";

export const leadFormSchema = z.object({
  title: localized({ max: 160 }),
  points: z.array(localized({ max: 120 })).max(5),
  image: mediaRef(),
  formTitle: localized({ max: 120 }),
  fields: z.object({ zalo: z.boolean().default(true), address: z.boolean().default(true), message: z.boolean().default(true) }),
  messageLabel: localized({ max: 60 }).optional(),
  submitLabel: localized({ max: 60 }),
  successText: localized({ multiline: true, max: 300 }),
  privacyNote: localized({ max: 300 }),
  /** Số gọi khi gửi lỗi. */
  fallbackPhone: z.string().regex(/^[\d\s+.()-]{9,20}$/).optional(),
  /** Nguồn lead, khớp quy tắc làm sạch của /api/lead. */
  source: z.string().regex(/^[\w-]{1,60}$/).default("home-bottom"),
});

export const leadForm = defineSectionType({
  type: "lead-form",
  schemaVersion: 1,
  schema: leadFormSchema,
  defaults: leadFormSchema.parse(leadFormFixture),
  meta: { label: { vi: "Form nhận báo giá", en: "Lead form" }, icon: "inbox", entitlement: "leadForm" },
});
