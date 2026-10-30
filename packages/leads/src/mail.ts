import { ChannelError, checkStatus } from "./errors.ts";

export type MailEnv = { RESEND_API_KEY?: string; MAIL_FROM?: string };
export type Mail = { from?: string; to: string | string[]; subject: string; text: string; html?: string };
export type MailSender = (mail: Mail, key: string) => Promise<void>;

export async function sendMail(mail: Mail, key: string, env: MailEnv, fetcher = fetch) {
  const from = mail.from ?? env.MAIL_FROM;
  if (!env.RESEND_API_KEY || !from) throw new ChannelError("Nền tảng chưa cấu hình email (RESEND_API_KEY / MAIL_FROM)");
  try {
    const response = await fetcher("https://api.resend.com/emails", {
      method: "POST", headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": key },
      body: JSON.stringify({ ...mail, from }), signal: AbortSignal.timeout(10_000), redirect: "error",
    });
    await response.body?.cancel();
    checkStatus(response.status, "Email");
  } catch (error) {
    if (error instanceof ChannelError) throw error;
    // Provider/network errors may contain the entire auth URL or recipient address.
    throw new ChannelError("Không kết nối được dịch vụ gửi email. Vui lòng thử lại.");
  }
}
