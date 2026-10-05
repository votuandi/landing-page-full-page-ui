export type ProductCategory = "panel" | "inverter" | "battery" | "accessory";
export type Product = {
  slug: string; category: ProductCategory; brand: string; name: string; image: string;
  powerKw: number; price?: number; quoteOnly?: boolean; warranty: string; datasheet: string;
  specs: Record<string, string>; compatible: string[];
};

export const PRODUCTS: Product[] = [
  { slug:"jinko-tiger-neo-585w", category:"panel", brand:"JinkoSolar", name:"Tiger Neo N-type 585W", image:"/images/product-3.jpg", powerKw:0.585, price:3450000, warranty:"12 năm sản phẩm • 30 năm hiệu suất", datasheet:"#", specs:{"Công suất":"585 W","Công nghệ":"N-type TOPCon","Hiệu suất":"22,65%","Kích thước":"2278 × 1134 mm","Ứng dụng":"C&I"}, compatible:["sungrow-sg125cx","huawei-sun2000-100ktl"] },
  { slug:"longi-hi-mo-7-580w", category:"panel", brand:"LONGi", name:"Hi-MO 7 580W", image:"/images/product-3.jpg", powerKw:0.58, price:3320000, warranty:"15 năm sản phẩm • 30 năm hiệu suất", datasheet:"#", specs:{"Công suất":"580 W","Công nghệ":"HPDC","Hiệu suất":"22,5%","Ứng dụng":"C&I / utility","Kiểu cell":"Half-cut"}, compatible:["sungrow-sg125cx"] },
  { slug:"trina-vertex-n-595w", category:"panel", brand:"Trina Solar", name:"Vertex N 595W", image:"/images/product-3.jpg", powerKw:0.595, quoteOnly:true, warranty:"12 năm sản phẩm • 30 năm hiệu suất", datasheet:"#", specs:{"Công suất":"595 W","Công nghệ":"N-type i-TOPCon","Hiệu suất":"22%+","Ứng dụng":"Nhà xưởng","Kiểu cell":"Half-cut"}, compatible:["huawei-sun2000-100ktl"] },
  { slug:"sungrow-sg125cx", category:"inverter", brand:"Sungrow", name:"SG125CX-P2", image:"/images/product-1.jpg", powerKw:125, quoteOnly:true, warranty:"5 năm tiêu chuẩn, tùy chọn mở rộng", datasheet:"#", specs:{"Công suất AC":"125 kW","MPPT":"12 MPPT","Hiệu suất cực đại":"98,9%","Bảo vệ":"IP66 / C5","Giám sát":"iSolarCloud"}, compatible:["jinko-tiger-neo-585w","longi-hi-mo-7-580w"] },
  { slug:"huawei-sun2000-100ktl", category:"inverter", brand:"Huawei", name:"SUN2000-100KTL-M2", image:"/images/product-1.jpg", powerKw:100, quoteOnly:true, warranty:"Theo chính sách hãng/nhà phân phối", datasheet:"#", specs:{"Công suất AC":"100 kW","MPPT":"10 MPPT","Giám sát":"FusionSolar","Bảo vệ":"Smart String-level","Ứng dụng":"C&I"}, compatible:["jinko-tiger-neo-585w","trina-vertex-n-595w"] },
  { slug:"goodwe-gw50kn-mt", category:"inverter", brand:"GoodWe", name:"GW50KN-MT", image:"/images/product-1.jpg", powerKw:50, price:68500000, warranty:"5 năm tiêu chuẩn", datasheet:"#", specs:{"Công suất AC":"50 kW","Pha":"3 pha","MPPT":"4 MPPT","Bảo vệ":"IP65","Giám sát":"SEMS Portal"}, compatible:["jinko-tiger-neo-585w"] },
  { slug:"byd-battery-box-hvm", category:"battery", brand:"BYD", name:"Battery-Box Premium HVM", image:"/images/product-2.jpg", powerKw:13.8, quoteOnly:true, warranty:"10 năm theo điều kiện hãng", datasheet:"#", specs:{"Dung lượng mẫu":"13,8 kWh","Hóa học":"LiFePO4","Thiết kế":"Module xếp chồng","Điện áp":"High Voltage","Ứng dụng":"Hybrid"}, compatible:["goodwe-et-plus-10kw"] },
  { slug:"pylontech-force-h2", category:"battery", brand:"Pylontech", name:"Force H2 14.2 kWh", image:"/images/product-2.jpg", powerKw:14.2, quoteOnly:true, warranty:"10 năm theo điều kiện hãng", datasheet:"#", specs:{"Dung lượng":"14,2 kWh","Hóa học":"LiFePO4","Thiết kế":"Module","BMS":"Tích hợp","Ứng dụng":"Backup tải"}, compatible:["goodwe-et-plus-10kw"] },
  { slug:"goodwe-et-plus-10kw", category:"inverter", brand:"GoodWe", name:"ET Plus+ 10kW Hybrid", image:"/images/product-4.jpg", powerKw:10, price:42500000, warranty:"5 năm tiêu chuẩn", datasheet:"#", specs:{"Công suất":"10 kW","Kiểu":"Hybrid 3 pha","Backup":"Có","MPPT":"2 MPPT","Ứng dụng":"Biệt thự / SME"}, compatible:["byd-battery-box-hvm","pylontech-force-h2"] },
  { slug:"mc4-dc-kit", category:"accessory", brand:"Staubli", name:"Bộ đầu nối MC4 DC", image:"/images/product-4.jpg", powerKw:0, price:390000, warranty:"Theo lô hàng", datasheet:"#", specs:{"Chuẩn":"MC4","Ứng dụng":"Chuỗi DC","Yêu cầu":"Bấm cos đúng dụng cụ","Phân loại":"Phụ kiện","Lắp đặt":"Kỹ thuật viên"}, compatible:[] }
];

export const PROJECTS = [
  { slug:"nha-may-thuc-pham-long-an", title:"Nhà máy thực phẩm Long An", type:"Nhà xưởng sản xuất", location:"Long An", capacity:"998 kWp", image:"/images/solar-panels-hero.jpg", saving:"~1,42 tỷ đồng/năm", selfUse:"91%", detail:"Hệ thống áp mái cho nhà máy vận hành tải lạnh và dây chuyền sản xuất chủ yếu ban ngày. Thiết kế ưu tiên tỷ lệ tự dùng cao và khả năng cô lập từng khu vực khi bảo trì.", metrics:[["Công suất","998 kWp"],["Tự dùng","91%"],["CO₂ ước tính","~840 tấn/năm"],["Thời gian thi công","8 tuần"]] },
  { slug:"kho-lanh-binh-duong", title:"Kho lạnh Bình Dương", type:"Kho lạnh", location:"Bình Dương", capacity:"620 kWp", image:"/images/illustrations/cold-storage-solar.webp", saving:"~930 triệu đồng/năm", selfUse:"95%", detail:"Tải lạnh ổn định giúp hệ thống solar bám sát nhu cầu điện ban ngày. Bố trí string theo vùng mái để thuận tiện kiểm tra và vệ sinh.", metrics:[["Công suất","620 kWp"],["Tự dùng","95%"],["Giảm mua điện lưới","~38%"],["Theo dõi","Theo string"]] },
  { slug:"trang-trai-dong-nai", title:"Trang trại công nghệ cao Đồng Nai", type:"Nông nghiệp", location:"Đồng Nai", capacity:"320 kWp + 215 kWh", image:"/images/illustrations/farm-hybrid-solar.webp", saving:"~510 triệu đồng/năm", selfUse:"88%", detail:"Giải pháp hybrid ưu tiên cấp điện cho tải điều khiển, bơm và khu vận hành quan trọng khi điện lưới gián đoạn.", metrics:[["Solar","320 kWp"],["Lưu trữ","215 kWh"],["Tải ưu tiên","Có"],["Giám sát","24/7"]] }
] as const;

export const SERVICES = [
  { slug:"solar-nha-xuong", title:"Solar nhà xưởng", audience:"Nhà máy • Kho lạnh • Logistics", problem:"Chi phí điện ban ngày lớn, cần ROI rõ và không làm gián đoạn sản xuất.", solution:"Khảo sát phụ tải 15 phút, mô phỏng sản lượng, thiết kế string/inverter theo mái và thi công theo khu vực.", image:"/images/solar-installation-hero.jpg", price:"Từ 12,8 triệu đồng/kWp*", packages:[["Khảo sát","Miễn phí với dự án đủ điều kiện"],["EPC tiêu chuẩn","Theo công suất và hiện trạng mái"],["O&M năm đầu","Có thể tích hợp"]] },
  { slug:"solar-gia-dinh", title:"Solar hộ gia đình", audience:"Biệt thự • Nhà phố tiêu thụ cao", problem:"Hóa đơn cao, tải điều hòa/bơm nhiệt/xe điện tăng và cần hệ thống thẩm mỹ.", solution:"Thiết kế hòa lưới hoặc hybrid theo biểu đồ tải, ưu tiên thiết bị gọn và theo dõi trên ứng dụng.", image:"/images/solar-panels-hero.jpg", price:"Từ 14,8 triệu đồng/kWp*", packages:[["5 kWp","Từ 74 triệu đồng*"],["10 kWp","Từ 145 triệu đồng*"],["Hybrid","Báo giá theo tải backup"]] },
  { slug:"hybrid-luu-tru", title:"Hybrid & lưu trữ", audience:"Tải quan trọng • Khu vực điện không ổn định", problem:"Mất điện gây gián đoạn, máy phát tốn nhiên liệu hoặc cần tối ưu tự dùng.", solution:"Phân nhóm tải backup, tính dung lượng pin theo thời gian dự phòng và cấu hình inverter hybrid phù hợp.", image:"/images/solar-battery-hero.jpg", price:"Theo tải và thời gian backup", packages:[["Backup cơ bản","Router, chiếu sáng, thiết bị thiết yếu"],["SME","Tải văn phòng / cửa hàng"],["C&I","Thiết kế riêng theo tải"]] },
  { slug:"om-ve-sinh", title:"O&M & vệ sinh", audience:"Hệ thống đang vận hành", problem:"Sản lượng giảm khó phát hiện, bụi bẩn, connector nóng hoặc lỗi string kéo dài.", solution:"Kiểm tra dữ liệu, đo điện, kiểm tra nhiệt điểm nghi ngờ, vệ sinh và lập biên bản hiệu suất.", image:"/images/product-2.jpg", price:"Từ 1.200.000 đồng/lần*", packages:[["Kiểm tra cơ bản","Visual + sản lượng"],["Bảo trì kỹ thuật","Đo kiểm + vệ sinh"],["O&M định kỳ","Theo quý / 6 tháng"]] }
] as const;

export const FAQS = [
  ["Điện mặt trời thường hoàn vốn bao lâu?","Thời gian hoàn vốn phụ thuộc tỷ lệ tự dùng, biểu giá điện, suất đầu tư và bức xạ tại khu vực. Calculator trên website sử dụng cùng bộ tham số cấu hình để ước tính nhất quán."],
  ["Mái tôn có lắp được không?","Có. Cần khảo sát kết cấu, tuổi mái, vị trí xà gồ và chọn phương án liên kết phù hợp trước khi thi công."],
  ["Lắp solar có làm dột mái không?","Rủi ro được kiểm soát bằng khảo sát, phương án liên kết đúng loại mái và quy trình nghiệm thu chống dột. Phạm vi bảo hành thi công phải ghi rõ trong hợp đồng."],
  ["Hệ thống chịu bão như thế nào?","Thiết kế khung và liên kết phải dựa trên hiện trạng công trình, vùng gió và yêu cầu kỹ thuật. Với dự án C&I nên có kiểm tra kết cấu khi cần."],
  ["Bao lâu nên vệ sinh tấm pin?","Tùy môi trường bụi, mưa và góc nghiêng. Nên dựa trên dữ liệu sản lượng và kiểm tra thực tế thay vì cố định một lịch cho mọi dự án."],
  ["Mùa mưa có tạo ra điện không?","Có, nhưng sản lượng giảm theo bức xạ. Ước tính năm phải tính theo dữ liệu khí hậu vùng, không dựa vào ngày nắng đẹp nhất."],
  ["Mất điện lưới thì solar có chạy không?","Hệ hòa lưới thông thường sẽ ngắt để bảo đảm an toàn. Muốn duy trì tải khi mất điện cần thiết kế hybrid/backup phù hợp."],
  ["Có cần thủ tục với điện lực hoặc cơ quan quản lý không?","Tùy mô hình, công suất, mục đích sử dụng và quy định đang có hiệu lực. Nội dung pháp lý trên website chỉ mang tính tóm tắt; hồ sơ thực tế cần được đối chiếu tại thời điểm triển khai. [CẦN XÁC MINH]"]
] as const;

export const POLICY_SUMMARY = [
  "Ưu tiên thiết kế hệ thống phục vụ nhu cầu tự dùng tại công trình.",
  "Yêu cầu đấu nối, đo đếm, an toàn điện/PCCC và hồ sơ có thể thay đổi theo loại dự án. [CẦN XÁC MINH]",
  "Cơ chế mua bán điện dư, nếu có áp dụng, cần kiểm tra văn bản đang hiệu lực tại thời điểm ký hợp đồng. [CẦN XÁC MINH]",
  "Dự án nhà xưởng cần rà soát tải mái, kết cấu, quyền sử dụng mái và yêu cầu bảo hiểm của chủ tài sản."
] as const;

export const TEAM = [
  { name:"Nguyễn Khải Minh", role:"Giám đốc kỹ thuật [DỮ LIỆU MẪU]", image:"/images/solar-installation-hero.jpg" },
  { name:"Trần Hoàng Phúc", role:"Trưởng nhóm thiết kế [DỮ LIỆU MẪU]", image:"/images/solar-inverter-hero.jpg" },
  { name:"Lê Anh Tuấn", role:"Quản lý thi công & O&M [DỮ LIỆU MẪU]", image:"/images/solar-panels-hero.jpg" }
];

export const TESTIMONIALS = [
  { company:"Công ty Cơ khí An Phát [DỮ LIỆU MẪU]", person:"Trần Quốc H.", text:"Đội kỹ thuật giải thích ROI và phương án thi công theo ca sản xuất rất rõ. Báo cáo sau bàn giao dễ theo dõi.", rating:"5,0/5 Google [DỮ LIỆU MẪU]" },
  { company:"Kho vận Minh Thành [DỮ LIỆU MẪU]", person:"Nguyễn Thanh T.", text:"Điểm tụi tui đánh giá cao là hồ sơ kỹ thuật, kế hoạch an toàn và cách chia khu vực thi công để không ảnh hưởng kho.", rating:"4,9/5 Google [DỮ LIỆU MẪU]" }
] as const;