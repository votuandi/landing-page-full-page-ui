/** [DỮ LIỆU MẪU] Form "Nhận báo giá" cuối trang chủ t15; số điện thoại hư cấu. */
import type { z } from "zod";
import type { leadFormSchema } from "./schema";

export const leadFormFixture = {
  title: { vi: "Nhận báo giá — khảo sát miễn phí trong 48 giờ.", en: "Get a quote — free site survey within 48 hours." },
  points: [
    { vi: "Khảo sát mái & đọc hóa đơn miễn phí", en: "Free roof survey & bill review" },
    { vi: "Báo giá chi tiết trong 24 giờ", en: "Detailed quote within 24 hours" },
    { vi: "Hỗ trợ hồ sơ đấu nối EVN", en: "Grid-connection paperwork handled" },
  ],
  image: { id: "/images/solar-installation-hero.jpg", alt: { vi: "Hệ thống điện mặt trời dưới bầu trời nắng", en: "Solar array under a sunny sky" } },
  formTitle: { vi: "Để lại thông tin, kỹ sư sẽ gọi lại", en: "Leave your details — an engineer will call" },
  fields: { zalo: true, address: true, message: true },
  submitLabel: { vi: "Nhận báo giá chi tiết", en: "Get a detailed quote" },
  successText: { vi: "Kỹ sư sẽ gọi lại trong 2 giờ (trong giờ làm việc).", en: "An engineer will call you back within 2 hours (business hours)." },
  privacyNote: { vi: "Thông tin chỉ dùng để tư vấn & báo giá, không chia sẻ cho bên thứ ba.", en: "Your details are only used for consultation and quotes, never shared." },
  fallbackPhone: "0901 234 500",
  source: "home-bottom",
} satisfies z.input<typeof leadFormSchema>;
