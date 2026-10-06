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

export const TEAM = [
  { name:"Nguyễn Khải Minh", role:"Giám đốc kỹ thuật [DỮ LIỆU MẪU]", image:"/images/solar-installation-hero.jpg" },
  { name:"Trần Hoàng Phúc", role:"Trưởng nhóm thiết kế [DỮ LIỆU MẪU]", image:"/images/solar-inverter-hero.jpg" },
  { name:"Lê Anh Tuấn", role:"Quản lý thi công & O&M [DỮ LIỆU MẪU]", image:"/images/solar-panels-hero.jpg" }
];

export const TESTIMONIALS = [
  { company:"Công ty Cơ khí An Phát [DỮ LIỆU MẪU]", person:"Trần Quốc H.", text:"Đội kỹ thuật giải thích ROI và phương án thi công theo ca sản xuất rất rõ. Báo cáo sau bàn giao dễ theo dõi.", rating:"5,0/5 Google [DỮ LIỆU MẪU]" },
  { company:"Kho vận Minh Thành [DỮ LIỆU MẪU]", person:"Nguyễn Thanh T.", text:"Điểm tụi tui đánh giá cao là hồ sơ kỹ thuật, kế hoạch an toàn và cách chia khu vực thi công để không ảnh hưởng kho.", rating:"4,9/5 Google [DỮ LIỆU MẪU]" }
] as const;