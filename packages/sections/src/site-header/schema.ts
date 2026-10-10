import { z } from "zod";
import { defineSectionType } from "../define";
import { link, localized, mediaRef } from "../fields";
import { segmentEnum } from "../shared/schema";
import { siteHeaderFixture } from "./fixtures";

export const phone = () => z.string().regex(/^[\d\s+.()-]{9,20}$/);
const slug = () => z.string().regex(/^[a-z0-9-]+$/);

export const siteHeaderSchema = z.object({
  brand: z.object({ name: z.string().min(1).max(60), logo: mediaRef().optional() }),
  /** Dải cam kết chạy ngang trên header; rỗng → ẩn. */
  topBar: z.array(localized({ max: 120 })).max(8),
  /** Mega menu "Bảng giá": chip mở dự toán, điền sẵn phân khúc + tiền điện + nhu cầu. */
  pricingMenu: z.object({
    label: localized({ max: 40 }),
    hint: localized({ max: 80 }),
    categories: z.array(z.object({
      id: slug(),
      label: localized({ max: 40 }),
      hint: localized({ max: 80 }),
      segment: segmentEnum(),
      groups: z.array(z.object({
        title: localized({ max: 40 }).optional(),
        chips: z.array(z.object({
          label: localized({ max: 30 }),
          bill: z.number().int().positive().max(1e12).optional(),
          popular: z.boolean().default(false),
        })).min(1).max(8),
      })).min(1).max(4),
    })).min(1).max(8),
  }).optional(),
  /** Mega menu dạng cột link (Thiết bị, Cẩm nang…). */
  menus: z.array(z.object({
    label: localized({ max: 40 }),
    columns: z.array(z.object({
      title: localized({ max: 40 }),
      description: localized({ max: 120 }).optional(),
      link: link().optional(),
      links: z.array(link()).max(8),
    })).min(1).max(8),
  })).max(3),
  links: z.array(link()).max(6),
  /** Link chỉ hiện trong menu mobile. */
  mobileLinks: z.array(link()).max(8),
  hotlineLabel: localized({ max: 40 }),
  hotlines: z.array(z.object({
    name: z.string().min(1).max(60),
    main: phone(),
    lines: z.array(z.object({ label: localized({ max: 30 }), phone: phone() })).max(3),
    mapLink: link().optional(),
  })).max(8),
  cta: link(),
  /** Nút cuối menu mobile (tư vấn, Zalo…). */
  drawerActions: z.array(link()).max(3),
});

export const siteHeader = defineSectionType({
  type: "site-header",
  schemaVersion: 1,
  schema: siteHeaderSchema,
  defaults: siteHeaderSchema.parse(siteHeaderFixture),
  meta: { label: { vi: "Đầu trang", en: "Site header" }, icon: "menu", maxPerPage: 1 },
});
