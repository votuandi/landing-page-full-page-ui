import { randomUUID } from "node:crypto";
import { z } from "zod";
import { loadEnv, workerEnv } from "@solar/env";
import { authMail, sendMail } from "@solar/leads";

const recipient = z.email().safeParse(process.argv[2]);
if (!recipient.success) {
  console.error("Cách dùng: pnpm --filter worker exec tsx scripts/mail-test.ts <địa chỉ email nhận>");
  process.exitCode = 1;
} else {
  const env = loadEnv(workerEnv);
  try {
    const sample = authMail("invite", "https://example.com/moi?token=DU-LIEU-MAU");
    await sendMail({ to: recipient.data, subject: `[DỮ LIỆU MẪU] ${sample.subject}`,
      text: `[DỮ LIỆU MẪU]\n${sample.text}`, html: `<p>[DỮ LIỆU MẪU]</p>${sample.html}`,
    }, `mail-test:${randomUUID()}`, env);
    console.log("Đã gửi email mẫu. Kiểm tra hộp thư hoặc kết quả mail-tester; link trong thư là dữ liệu mẫu.");
  } catch {
    console.error("Không gửi được email mẫu. Kiểm tra cấu hình Resend, tên miền đã xác minh và MAIL_FROM.");
    process.exitCode = 1;
  }
}
