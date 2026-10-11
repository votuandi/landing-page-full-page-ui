/** [DỮ LIỆU MẪU] Phụ tải và sản lượng C&I từ template-6/template-9; không phải cam kết thiết kế. */
export const loadProfileFixture = {
  eyebrow: { vi: "[DỮ LIỆU MẪU] Phân tích phụ tải", en: "[SAMPLE DATA] Load analysis" },
  title: { vi: "Thiết kế bắt đầu từ đường cong phụ tải, không phải diện tích mái.", en: "Design starts with the load curve, not roof area." },
  description: { vi: "Mô hình 24 giờ cho thấy tải nền, công suất đỉnh và thời gian điện mặt trời tạo giá trị cao nhất.", en: "A daily model shows base load, peak power and when solar creates the most value." },
  chart: {
    production: [0,0,0,0,0,4,18,42,67,84,96,100,94,82,66,44,21,6,0,0,0,0,0,0],
    consumption: [34,31,30,29,31,40,58,76,89,96,100,98,92,95,101,103,99,91,82,69,56,48,42,37],
    productionLabel: { vi: "Điện mặt trời", en: "Solar production" },
    consumptionLabel: { vi: "Phụ tải nhà máy", en: "Factory load" },
  },
  unit: { vi: "% công suất tham chiếu", en: "% reference power" },
  metrics: [
    { label: { vi: "Công suất đỉnh", en: "Peak load" }, value: "1.03 MW" },
    { label: { vi: "Phụ tải nền ban ngày", en: "Daytime base load" }, value: "0.76 MW" },
    { label: { vi: "Tỷ lệ tự dùng", en: "Self-consumption" }, value: "92%" },
    { label: { vi: "Rủi ro điện dư", en: "Export risk" }, value: "Thấp / Low" },
  ],
};
