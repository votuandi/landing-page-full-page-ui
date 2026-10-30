export const roleLabels = { owner: "Chủ sở hữu", admin: "Quản trị viên", editor: "Biên tập viên", staff: "Nhân viên", viewer: "Chỉ xem", client: "Khách hàng" };
export const statusLabels = { invited: "Chờ nhận lời mời", unverified: "Chưa xác minh", active: "Đang hoạt động", locked: "Đã khóa", disabled: "Đã vô hiệu hóa" };
export function staffDate(value: string | null) {
  return value ? new Date(value).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : "Chưa đăng nhập";
}
