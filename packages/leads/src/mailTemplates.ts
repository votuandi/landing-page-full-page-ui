export type AuthTemplate = "invite" | "reset_password" | "magic_link";
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
const content = (subject: string, text: string) => ({
  subject: subject.replace(/[\r\n]/g, " "), text,
  html: text.split("\n").map(line => `<p>${escapeHtml(line)}</p>`).join(""),
});

export function authMail(template: AuthTemplate, url: string) {
  const labels = { invite: "Lời mời tham gia quản trị website", reset_password: "Đặt lại mật khẩu", magic_link: "Đăng nhập bằng link" };
  const ttl = { invite: "72 giờ", reset_password: "1 giờ", magic_link: "15 phút" };
  const host = new URL(url).host;
  const text = `${labels[template]}\nWebsite: ${host}\nMở link sau để tiếp tục (có hiệu lực ${ttl[template]} từ khi yêu cầu):\n${url}\nNếu bạn không yêu cầu, hãy bỏ qua email này. Không chia sẻ link cho người khác.`;
  const mail = content(labels[template], text);
  return { ...mail, html: `${mail.html}<p><a href="${escapeHtml(url)}">${escapeHtml(labels[template])}</a></p>` };
}

const vietnamDate = (iso: string) => new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
}).format(new Date(iso));

/** Pure templates: no current time, random values, or provider state in a retried request. */
export function notifyMail(kind: string, payload: Record<string, unknown>, siteName: string) {
  switch (kind) {
    case "plan-changed": return content(`Thay đổi gói — ${siteName}`, `Website: ${siteName}\nGói dịch vụ đã đổi từ ${payload.from} sang ${payload.to}.`);
    case "renewal": return content(`Nhắc gia hạn — ${siteName}`, `Website: ${siteName}\nGói dịch vụ còn ${payload.days} ngày.\nHết hạn: ${vietnamDate(payload.expiresAt as string)} (giờ Việt Nam). Vui lòng gia hạn để duy trì dịch vụ.`);
    case "suspended": return content(`Website tạm khóa — ${siteName}`, `Website: ${siteName}\nDịch vụ đã tạm khóa sau thời gian ân hạn.\nNgày hết hạn: ${vietnamDate(payload.expiresAt as string)} (giờ Việt Nam). Vui lòng liên hệ hỗ trợ để gia hạn.`);
    case "domain-warning": return content(`Cảnh báo tên miền — ${siteName}`, `Website: ${siteName}\nTên miền: ${payload.hostname}\nCảnh báo: ${payload.reason}\nVui lòng kiểm tra cấu hình tên miền.`);
    default: return null;
  }
}
