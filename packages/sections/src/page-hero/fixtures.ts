import type { z } from "zod";
import type { pageHeroSchema } from "./schema";

export const pageHeroFixture = {
  eyebrow: { vi: "Về chúng tôi", en: "About us" },
  title: { vi: "[DỮ LIỆU MẪU] Đồng hành cùng năng lượng sạch", en: "[SAMPLE DATA] Your clean energy partner" },
  subtitle: { vi: "Tư vấn, thiết kế và thi công hệ thống điện mặt trời theo nhu cầu thực tế.", en: "Solar consulting, design and installation for your needs." },
  media: { id: "/images/solar-installation-hero.jpg", alt: { vi: "Thi công điện mặt trời", en: "Solar installation" } },
  breadcrumb: [{ kind: "page", value: "", label: { vi: "Trang chủ", en: "Home" } }],
  ctas: [{ kind: "page", value: "lien-he", label: { vi: "Nhận tư vấn", en: "Get advice" } }],
} satisfies z.input<typeof pageHeroSchema>;
