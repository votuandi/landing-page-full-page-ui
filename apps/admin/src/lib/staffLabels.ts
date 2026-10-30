export const roleLabels = { owner: "Chủ sở hữu", admin: "Quản trị viên", editor: "Biên tập viên", staff: "Nhân viên", viewer: "Chỉ xem", client: "Khách hàng" };
export const statusLabels = { invited: "Chờ nhận lời mời", unverified: "Chưa xác minh", active: "Đang hoạt động", locked: "Đã khóa", disabled: "Đã vô hiệu hóa" };
export function deviceLabel(agent: string | null) {
  if (!agent) return "Không rõ trình duyệt";
  const browser = /Edg\//.test(agent) ? "Edge" : /Firefox\//.test(agent) ? "Firefox" : /Chrome\//.test(agent) ? "Chrome" : /Safari\//.test(agent) ? "Safari" : "Trình duyệt khác";
  const system = /iPhone|iPad/.test(agent) ? "iOS" : /Android/.test(agent) ? "Android" : /Windows/.test(agent) ? "Windows" : /Mac OS X/.test(agent) ? "macOS" : /Linux/.test(agent) ? "Linux" : "";
  return system ? `${browser} trên ${system}` : browser;
}
export function staffDate(value: string | null) {
  return value ? new Date(value).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : "Chưa đăng nhập";
}
