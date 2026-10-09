/** Dịch vụ (trang /giai-phap) và đội ngũ (trang /ve-chung-toi). [DỮ LIỆU MẪU] */
export const SERVICES = [
  { slug:"solar-nha-xuong", title:"Solar nhà xưởng", audience:"Nhà máy • Kho lạnh • Logistics", problem:"Chi phí điện ban ngày lớn, cần ROI rõ và không làm gián đoạn sản xuất.", solution:"Khảo sát phụ tải 15 phút, mô phỏng sản lượng, thiết kế string/inverter theo mái và thi công theo khu vực.", image:"/images/solar-installation-hero.jpg", price:"Từ 12,8 triệu đồng/kWp*", packages:[["Khảo sát","Miễn phí với dự án đủ điều kiện"],["EPC tiêu chuẩn","Theo công suất và hiện trạng mái"],["O&M năm đầu","Có thể tích hợp"]] },
  { slug:"solar-gia-dinh", title:"Solar hộ gia đình", audience:"Biệt thự • Nhà phố tiêu thụ cao", problem:"Hóa đơn cao, tải điều hòa/bơm nhiệt/xe điện tăng và cần hệ thống thẩm mỹ.", solution:"Thiết kế hòa lưới hoặc hybrid theo biểu đồ tải, ưu tiên thiết bị gọn và theo dõi trên ứng dụng.", image:"/images/solar-panels-hero.jpg", price:"Từ 14,8 triệu đồng/kWp*", packages:[["5 kWp","Từ 74 triệu đồng*"],["10 kWp","Từ 145 triệu đồng*"],["Hybrid","Báo giá theo tải backup"]] },
  { slug:"hybrid-luu-tru", title:"Hybrid & lưu trữ", audience:"Tải quan trọng • Khu vực điện không ổn định", problem:"Mất điện gây gián đoạn, máy phát tốn nhiên liệu hoặc cần tối ưu tự dùng.", solution:"Phân nhóm tải backup, tính dung lượng pin theo thời gian dự phòng và cấu hình inverter hybrid phù hợp.", image:"/images/solar-battery-hero.jpg", price:"Theo tải và thời gian backup", packages:[["Backup cơ bản","Router, chiếu sáng, thiết bị thiết yếu"],["SME","Tải văn phòng / cửa hàng"],["C&I","Thiết kế riêng theo tải"]] },
  { slug:"om-ve-sinh", title:"O&M & vệ sinh", audience:"Hệ thống đang vận hành", problem:"Sản lượng giảm khó phát hiện, bụi bẩn, connector nóng hoặc lỗi string kéo dài.", solution:"Kiểm tra dữ liệu, đo điện, kiểm tra nhiệt điểm nghi ngờ, vệ sinh và lập biên bản hiệu suất.", image:"/images/product-2.jpg", price:"Từ 1.200.000 đồng/lần*", packages:[["Kiểm tra cơ bản","Visual + sản lượng"],["Bảo trì kỹ thuật","Đo kiểm + vệ sinh"],["O&M định kỳ","Theo quý / 6 tháng"]] }
] as const;

export const TEAM = [
  { name:"Nguyễn Khải Minh", role:"Giám đốc kỹ thuật [DỮ LIỆU MẪU]", image:"/images/solar-installation-hero.jpg" },
  { name:"Trần Hoàng Phúc", role:"Trưởng nhóm thiết kế [DỮ LIỆU MẪU]", image:"/images/solar-inverter-hero.jpg" },
  { name:"Lê Anh Tuấn", role:"Quản lý thi công & O&M [DỮ LIỆU MẪU]", image:"/images/solar-panels-hero.jpg" }
];
