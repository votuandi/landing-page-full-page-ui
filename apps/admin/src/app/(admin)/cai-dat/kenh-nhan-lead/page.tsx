import { getTenant, requirePagePermission } from "../../../../lib/auth.ts";
import { leadChannelDeps } from "../../../../lib/leadChannelsRuntime.ts";
import { summarizeChannel, telegramInstructions } from "../../../../lib/leadChannels.ts";
import { LeadChannels } from "../../../../components/LeadChannels.tsx";

export default async function LeadChannelPage() {
  await requirePagePermission("settings.manage");
  const { tenantId } = await getTenant();
  const [rows, can] = await Promise.all([leadChannelDeps.list(tenantId), leadChannelDeps.can()]);
  const username = process.env.TELEGRAM_BOT_USERNAME;
  return <div className="space-y-6">
    <div><h1 className="text-2xl font-semibold text-fg">Kênh nhận lead</h1><p className="mt-2 text-fg-muted">Chọn nơi nhận thông tin khách hàng và gửi thử trước khi sử dụng.</p></div>
    <LeadChannels channels={rows.map(row => summarizeChannel(row, leadChannelDeps.env))} webhookAllowed={can("leadWebhook")} />
    <section aria-labelledby="telegram-help" className="space-y-3 rounded-card border border-line/20 bg-bg-elevated p-6">
      <h2 id="telegram-help" className="text-lg font-semibold text-fg">Kết nối Telegram</h2>
      <p className="max-w-prose whitespace-pre-line text-sm text-fg-muted">{telegramInstructions(username)}</p>
      {username && /^[A-Za-z0-9_]{5,32}$/.test(username) && <a href={`https://t.me/${username}`} className="inline-flex min-h-11 items-center text-primary underline">Mở bot Telegram</a>}
    </section>
  </div>;
}
