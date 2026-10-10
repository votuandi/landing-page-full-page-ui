/** [DỮ LIỆU MẪU] Nội dung lưới phân khúc t15; mức giảm hóa đơn cần xác minh theo công trình thực tế. */
import type { z } from "zod";
import type { segmentsSchema } from "./schema";

const img = (id: string) => ({ id, alt: { vi: "" } });

export const segmentsFixture = {
  eyebrow: { vi: "Giải pháp theo công trình", en: "Solutions by building" },
  title: { vi: "Bạn cần lắp cho công trình nào?", en: "What are you powering?" },
  description: {
    vi: "Chọn một mục — video, gói giải pháp, dự toán và công trình bên dưới sẽ hiển thị đúng nhu cầu của bạn.",
    en: "Pick one — videos, packages, the estimator and projects below adapt to your needs.",
  },
  savingLabel: { vi: "Giảm đến", en: "Save up to" },
  items: [
    { segment: "household", label: { vi: "Hộ gia đình", en: "Households" }, pitch: { vi: "Cắt phần điện bậc thang đắt nhất", en: "Cut the most expensive tariff tiers" }, image: img("/images/illustrations/home-solar.webp"), saving: "50–90%" },
    { segment: "shop", label: { vi: "Cửa hàng & chuỗi", en: "Shops & chains" }, pitch: { vi: "Điều hòa, tủ mát chạy bằng nắng", en: "Run AC and fridges on sunshine" }, image: img("/images/illustrations/shop-solar.webp"), saving: "30–50%" },
    { segment: "factory", label: { vi: "Nhà xưởng", en: "Factories" }, pitch: { vi: "Mái xưởng thành nhà máy điện riêng", en: "Turn your roof into a power plant" }, image: img("/images/illustrations/factory-solar.webp"), saving: "25–40%" },
    { segment: "farm", label: { vi: "Trang trại", en: "Farms" }, pitch: { vi: "Quạt hút, bơm, sưởi cho trại gà, heo", en: "Fans, pumps and heating for livestock" }, image: img("/images/illustrations/farm-hybrid-solar.webp"), saving: "30–60%" },
  ],
} satisfies z.input<typeof segmentsSchema>;
