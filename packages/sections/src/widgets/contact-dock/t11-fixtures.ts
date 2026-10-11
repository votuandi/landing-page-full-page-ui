import type { z } from "zod";
import type { contactDockSchema } from "./schema";
/** [DỮ LIỆU MẪU] Links must be replaced before publication. */
export const t11Fixture = {
  mobileBar: true,
  ariaLabel: { vi: "Liên hệ nhanh", en: "Quick contact" },
  items: [
    { kind: "call", label: { vi: "Gọi", en: "Call" }, link: { kind: "phone", value: "0901234567", label: { vi: "Gọi" } } },
    { kind: "zalo", label: { vi: "Zalo Gia đình", en: "Zalo · Home" }, link: { kind: "zalo", value: "0901234567", label: { vi: "Zalo Gia đình" } } },
    { kind: "zalo", label: { vi: "Zalo Doanh nghiệp", en: "Zalo · Business" }, link: { kind: "zalo", value: "0901234567", label: { vi: "Zalo Doanh nghiệp" } } },
  ],
} satisfies z.input<typeof contactDockSchema>;
