export type ProductCategory = "panel" | "inverter" | "battery" | "allinone" | "bess" | "accessory";
/** Phân khúc dùng cho chip lọc ở mega menu "Thiết bị" (?segment=home|business|project). */
export type ProductSegment = "home" | "business" | "project";
export type Product = {
  slug: string; category: ProductCategory; brand: string; name: string; image: string;
  /** kW (tấm pin/inverter) hoặc kWh (pin lưu trữ, BESS) — dùng cho bộ lọc công suất */
  powerKw: number; price?: number;
  /** Giá khuyến mãi — chỉ hiển thị khi salePrice < price. */
  salePrice?: number; quoteOnly?: boolean; warranty: string; datasheet: string;
  /** Công nghệ — dùng cho chip lọc ?tech= */
  tech: string[]; segment: ProductSegment[];
  specs: Record<string, string>; compatible: string[];
};

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  panel: "Tấm pin", inverter: "Inverter", battery: "Lithium", allinone: "All-in-one", bess: "BESS", accessory: "Phụ kiện",
};
export const PRODUCT_SEGMENT_LABELS: Record<ProductSegment, string> = { home: "Hộ gia đình", business: "Doanh nghiệp", project: "Dự án / nhà xưởng" };

/** [DỮ LIỆU MẪU] — tên hãng và model đều HƯ CẤU. */
export const PRODUCTS: Product[] = [
  { slug:"helionyx-nova-n-590w", category:"panel", brand:"Helionyx", name:"Nova N 590W", image:"/images/product-3.jpg", powerKw:0.59, price:3450000, salePrice:3290000, warranty:"12 năm sản phẩm • 30 năm hiệu suất", datasheet:"#", tech:["N-type TOPCon"], segment:["home","business"], specs:{"Công suất":"590 W","Công nghệ":"N-type TOPCon","Hiệu suất":"22,8%","Kích thước":"2278 × 1134 mm","Ứng dụng":"Hộ gia đình / C&I"}, compatible:["voltaris-vh-10k","kinetra-kx-50k"] },
  { slug:"helionyx-titan-bi-620w", category:"panel", brand:"Helionyx", name:"Titan Bifacial 620W", image:"/images/product-3.jpg", powerKw:0.62, quoteOnly:true, warranty:"15 năm sản phẩm • 30 năm hiệu suất", datasheet:"#", tech:["N-type TOPCon","Bifacial"], segment:["project"], specs:{"Công suất":"620 W","Công nghệ":"TOPCon hai mặt kính","Hiệu suất":"22,9%","Ứng dụng":"Nhà xưởng / mặt đất","Kiểu cell":"Half-cut"}, compatible:["kinetra-kx-110k"] },
  { slug:"solvane-hjt-600w", category:"panel", brand:"Solvane", name:"HJT Pro 600W", image:"/images/product-3.jpg", powerKw:0.6, price:3690000, warranty:"12 năm sản phẩm • 30 năm hiệu suất", datasheet:"#", tech:["HJT","Bifacial"], segment:["business","project"], specs:{"Công suất":"600 W","Công nghệ":"HJT","Hiệu suất":"23,1%","Ứng dụng":"C&I","Kiểu cell":"Half-cut"}, compatible:["kinetra-kx-50k"] },
  { slug:"lumora-mono-450w", category:"panel", brand:"Lumora", name:"Mono Black 450W", image:"/images/product-3.jpg", powerKw:0.45, price:2390000, salePrice:2190000, warranty:"12 năm sản phẩm • 25 năm hiệu suất", datasheet:"#", tech:["P-type PERC"], segment:["home"], specs:{"Công suất":"450 W","Công nghệ":"Mono PERC full black","Hiệu suất":"21,3%","Ứng dụng":"Nhà phố, biệt thự","Kiểu cell":"Half-cut"}, compatible:["voltaris-vh-10k"] },
  { slug:"voltaris-vh-10k", category:"inverter", brand:"Voltaris", name:"VH-10K Hybrid 3 pha", image:"/images/product-4.jpg", powerKw:10, price:42500000, salePrice:39900000, warranty:"5 năm tiêu chuẩn", datasheet:"#", tech:["Hybrid"], segment:["home","business"], specs:{"Công suất":"10 kW","Kiểu":"Hybrid 3 pha","Backup":"Có","MPPT":"2 MPPT","Ứng dụng":"Biệt thự / SME"}, compatible:["litheon-hv-10","cellora-wall-5"] },
  { slug:"voltaris-vg-5k", category:"inverter", brand:"Voltaris", name:"VG-5K Hòa lưới 1 pha", image:"/images/product-1.jpg", powerKw:5, price:14900000, warranty:"5 năm tiêu chuẩn", datasheet:"#", tech:["On-grid"], segment:["home"], specs:{"Công suất AC":"5 kW","Pha":"1 pha","MPPT":"2 MPPT","Bảo vệ":"IP66","Giám sát":"Wi-Fi"}, compatible:["lumora-mono-450w"] },
  { slug:"kinetra-kx-50k", category:"inverter", brand:"Kinetra", name:"KX-50K Hòa lưới", image:"/images/product-1.jpg", powerKw:50, price:68500000, salePrice:69900000, warranty:"5 năm tiêu chuẩn", datasheet:"#", tech:["On-grid"], segment:["business","project"], specs:{"Công suất AC":"50 kW","Pha":"3 pha","MPPT":"4 MPPT","Bảo vệ":"IP65","Giám sát":"Cloud"}, compatible:["helionyx-nova-n-590w","solvane-hjt-600w"] },
  { slug:"kinetra-kx-110k", category:"inverter", brand:"Kinetra", name:"KX-110K Hòa lưới", image:"/images/product-1.jpg", powerKw:110, quoteOnly:true, warranty:"5 năm, tùy chọn mở rộng", datasheet:"#", tech:["On-grid"], segment:["project"], specs:{"Công suất AC":"110 kW","MPPT":"10 MPPT","Hiệu suất cực đại":"98,8%","Bảo vệ":"IP66 / C5","Ứng dụng":"Nhà xưởng"}, compatible:["helionyx-titan-bi-620w"] },
  { slug:"litheon-hv-10", category:"battery", brand:"Litheon", name:"HV Stack 10 kWh", image:"/images/product-2.jpg", powerKw:10.2, quoteOnly:true, warranty:"10 năm theo điều kiện hãng", datasheet:"#", tech:["LiFePO4","High Voltage"], segment:["home","business"], specs:{"Dung lượng":"10,2 kWh","Hóa học":"LiFePO4","Thiết kế":"Module xếp chồng","Điện áp":"High Voltage","Ứng dụng":"Hybrid"}, compatible:["voltaris-vh-10k"] },
  { slug:"cellora-wall-5", category:"battery", brand:"Cellora", name:"PowerWall 5 kWh", image:"/images/product-2.jpg", powerKw:5.1, price:32900000, salePrice:29900000, warranty:"10 năm theo điều kiện hãng", datasheet:"#", tech:["LiFePO4"], segment:["home"], specs:{"Dung lượng":"5,1 kWh","Hóa học":"LiFePO4","Lắp đặt":"Treo tường","BMS":"Tích hợp","Ứng dụng":"Backup tải"}, compatible:["voltaris-vh-10k"] },
  { slug:"kinetra-aio-8", category:"allinone", brand:"Kinetra", name:"All-in-one 8 kW / 10 kWh", image:"/images/product-4.jpg", powerKw:8, price:96000000, warranty:"5 năm inverter • 10 năm pin", datasheet:"#", tech:["Hybrid","LiFePO4"], segment:["home"], specs:{"Inverter":"8 kW hybrid","Pin":"10 kWh LiFePO4","Thiết kế":"Tủ tích hợp","Backup":"< 10 ms","Ứng dụng":"Nhà phố, biệt thự"}, compatible:["helionyx-nova-n-590w"] },
  { slug:"ferrovolt-cube-215", category:"bess", brand:"Ferrovolt", name:"Cube 100 kW / 215 kWh", image:"/images/solar-battery-hero.jpg", powerKw:215, quoteOnly:true, warranty:"10 năm / 6.000 chu kỳ (mẫu)", datasheet:"#", tech:["LiFePO4","Outdoor cabinet"], segment:["business","project"], specs:{"Công suất":"100 kW","Dung lượng":"215 kWh","Làm mát":"Chất lỏng","Bảo vệ":"IP55","Ứng dụng":"Cắt đỉnh, dự phòng"}, compatible:["kinetra-kx-110k"] },
  { slug:"connecta-mc4-kit", category:"accessory", brand:"Connecta", name:"Bộ đầu nối MC4 DC", image:"/images/product-4.jpg", powerKw:0, price:390000, warranty:"Theo lô hàng", datasheet:"#", tech:["MC4"], segment:["home","business","project"], specs:{"Chuẩn":"MC4","Ứng dụng":"Chuỗi DC","Yêu cầu":"Bấm cos đúng dụng cụ","Phân loại":"Phụ kiện","Lắp đặt":"Kỹ thuật viên"}, compatible:[] },
  { slug:"connecta-pv-cable-6", category:"accessory", brand:"Connecta", name:"Cáp DC PV 6 mm² (cuộn 100 m)", image:"/images/product-4.jpg", powerKw:0, price:2850000, warranty:"Theo lô hàng", datasheet:"#", tech:["DC cable"], segment:["home","business","project"], specs:{"Tiết diện":"6 mm²","Chuẩn":"EN 50618 (mẫu)","Vỏ":"XLPO chống UV","Chiều dài":"100 m","Phân loại":"Phụ kiện"}, compatible:[] }
];

export const SERVICES = [
  { slug:"solar-nha-xuong", title:"Solar nhà xưởng", audience:"Nhà máy • Kho lạnh • Logistics", problem:"Chi phí điện ban ngày lớn, cần ROI rõ và không làm gián đoạn sản xuất.", solution:"Khảo sát phụ tải 15 phút, mô phỏng sản lượng, thiết kế string/inverter theo mái và thi công theo khu vực.", image:"/images/solar-installation-hero.jpg", price:"Từ 12,8 triệu đồng/kWp*", packages:[["Khảo sát","Miễn phí với dự án đủ điều kiện"],["EPC tiêu chuẩn","Theo công suất và hiện trạng mái"],["O&M năm đầu","Có thể tích hợp"]] },
  { slug:"solar-gia-dinh", title:"Solar hộ gia đình", audience:"Biệt thự • Nhà phố tiêu thụ cao", problem:"Hóa đơn cao, tải điều hòa/bơm nhiệt/xe điện tăng và cần hệ thống thẩm mỹ.", solution:"Thiết kế hòa lưới hoặc hybrid theo biểu đồ tải, ưu tiên thiết bị gọn và theo dõi trên ứng dụng.", image:"/images/solar-panels-hero.jpg", price:"Từ 14,8 triệu đồng/kWp*", packages:[["5 kWp","Từ 74 triệu đồng*"],["10 kWp","Từ 145 triệu đồng*"],["Hybrid","Báo giá theo tải backup"]] },
  { slug:"hybrid-luu-tru", title:"Hybrid & lưu trữ", audience:"Tải quan trọng • Khu vực điện không ổn định", problem:"Mất điện gây gián đoạn, máy phát tốn nhiên liệu hoặc cần tối ưu tự dùng.", solution:"Phân nhóm tải backup, tính dung lượng pin theo thời gian dự phòng và cấu hình inverter hybrid phù hợp.", image:"/images/solar-battery-hero.jpg", price:"Theo tải và thời gian backup", packages:[["Backup cơ bản","Router, chiếu sáng, thiết bị thiết yếu"],["SME","Tải văn phòng / cửa hàng"],["C&I","Thiết kế riêng theo tải"]] },
  { slug:"om-ve-sinh", title:"O&M & vệ sinh", audience:"Hệ thống đang vận hành", problem:"Sản lượng giảm khó phát hiện, bụi bẩn, connector nóng hoặc lỗi string kéo dài.", solution:"Kiểm tra dữ liệu, đo điện, kiểm tra nhiệt điểm nghi ngờ, vệ sinh và lập biên bản hiệu suất.", image:"/images/product-2.jpg", price:"Từ 1.200.000 đồng/lần*", packages:[["Kiểm tra cơ bản","Visual + sản lượng"],["Bảo trì kỹ thuật","Đo kiểm + vệ sinh"],["O&M định kỳ","Theo quý / 6 tháng"]] }
] as const;

export const FAQS = [
  ["Nhà tôi tiền điện 1–2 triệu/tháng có nên lắp không?","Có thể. Với hộ gia đình, điện mặt trời cắt phần tiêu thụ ở bậc giá cao nhất nên tiết kiệm rõ nhất. Hãy dùng công cụ dự toán ở đầu trang để xem công suất và thời gian hoàn vốn ước tính."],
  ["Có trả góp hoặc lắp 0 đồng không?","Có trả góp qua đối tác tài chính và cho thuê hệ thống. Mô hình lắp đặt 0 đồng (ESCO) dành cho doanh nghiệp có tiền điện lớn, phụ thuộc thẩm định của nhà đầu tư."],
  ["Điện mặt trời thường hoàn vốn bao lâu?","Thời gian hoàn vốn phụ thuộc tỷ lệ tự dùng, biểu giá điện, suất đầu tư và bức xạ tại khu vực. Calculator trên website sử dụng cùng bộ tham số cấu hình để ước tính nhất quán."],
  ["Mái tôn có lắp được không?","Có. Cần khảo sát kết cấu, tuổi mái, vị trí xà gồ và chọn phương án liên kết phù hợp trước khi thi công."],
  ["Lắp solar có làm dột mái không?","Rủi ro được kiểm soát bằng khảo sát, phương án liên kết đúng loại mái và quy trình nghiệm thu chống dột. Phạm vi bảo hành thi công phải ghi rõ trong hợp đồng."],
  ["Hệ thống chịu bão như thế nào?","Thiết kế khung và liên kết phải dựa trên hiện trạng công trình, vùng gió và yêu cầu kỹ thuật. Với dự án C&I nên có kiểm tra kết cấu khi cần."],
  ["Bao lâu nên vệ sinh tấm pin?","Tùy môi trường bụi, mưa và góc nghiêng. Nên dựa trên dữ liệu sản lượng và kiểm tra thực tế thay vì cố định một lịch cho mọi dự án."],
  ["Mùa mưa có tạo ra điện không?","Có, nhưng sản lượng giảm theo bức xạ. Ước tính năm phải tính theo dữ liệu khí hậu vùng, không dựa vào ngày nắng đẹp nhất."],
  ["Mất điện lưới thì solar có chạy không?","Hệ hòa lưới thông thường sẽ ngắt để bảo đảm an toàn. Muốn duy trì tải khi mất điện cần thiết kế hybrid/backup phù hợp."],
  ["Có cần thủ tục với điện lực hoặc cơ quan quản lý không?","Tùy mô hình, công suất, mục đích sử dụng và quy định đang có hiệu lực. Nội dung pháp lý trên website chỉ mang tính tóm tắt; hồ sơ thực tế cần được đối chiếu tại thời điểm triển khai. [CẦN XÁC MINH]"]
] as const;

export const TEAM = [
  { name:"Nguyễn Khải Minh", role:"Giám đốc kỹ thuật [DỮ LIỆU MẪU]", image:"/images/solar-installation-hero.jpg" },
  { name:"Trần Hoàng Phúc", role:"Trưởng nhóm thiết kế [DỮ LIỆU MẪU]", image:"/images/solar-inverter-hero.jpg" },
  { name:"Lê Anh Tuấn", role:"Quản lý thi công & O&M [DỮ LIỆU MẪU]", image:"/images/solar-panels-hero.jpg" }
];

export const TESTIMONIALS = [
  { company:"Hộ gia đình tại Thủ Đức [DỮ LIỆU MẪU]", person:"Chị Lan", text:"Hóa đơn từ 2,4 triệu xuống còn khoảng 700 nghìn. Đội thi công làm gọn trong một ngày, mái không bị dột.", rating:"5,0/5 Google [DỮ LIỆU MẪU]" },
  { company:"Chuỗi siêu thị mini, Cần Thơ [DỮ LIỆU MẪU]", person:"Anh Phúc", text:"Ba cửa hàng theo dõi chung trên một app, tháng nào cũng biết tiết kiệm được bao nhiêu.", rating:"4,9/5 Google [DỮ LIỆU MẪU]" },
  { company:"Công ty phân bón Đồng Nai [DỮ LIỆU MẪU]", person:"Anh Trần Quốc H.", text:"Kỹ sư giải thích ROI và phương án thi công theo ca sản xuất rất rõ. Báo cáo sau bàn giao dễ theo dõi.", rating:"5,0/5 Google [DỮ LIỆU MẪU]" }
] as const;