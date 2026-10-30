import { z } from "zod";
import type { OutboxJob } from "@solar/db";
import { authMail, ChannelError, type MailSender } from "@solar/leads";
import { PermanentError } from "../loop.ts";

const payloadSchema = z.object({
  to: z.email().max(254), template: z.enum(["invite", "reset_password", "magic_link"]),
  url: z.url({ protocol: /^https?$/ }).max(8192),
});
const ttl = { invite: 72 * 3600_000, reset_password: 3600_000, magic_link: 900_000 };

export function createMailSend({ send, now = Date.now }: { send: MailSender; now?: () => number }) {
  return async (job: OutboxJob) => {
    const parsed = payloadSchema.safeParse(job.payload);
    if (!parsed.success) throw new PermanentError("Email: payload không hợp lệ");
    const { to, template, url } = parsed.data;
    if (now() - job.createdAt.getTime() > ttl[template]) return;
    try {
      await send({ to, ...authMail(template, url) }, job.idempotencyKey);
    } catch (error) {
      if (error instanceof ChannelError && error.permanent) throw new PermanentError(error.message);
      throw error;
    }
  };
}
