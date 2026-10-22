import { z } from "zod";
import { FEATURES, themeAllowed, type ThemeGroup } from "@solar/plans";
import type { ActionContext, ActionResult } from "./action.ts";
import { authorize } from "./gate.ts";

export const upgradeSchema = z.object({
  feature: z.union([z.enum(FEATURES), z.enum(["theme:classic", "theme:pro", "theme:signature"])]),
  message: z.string().trim().max(1000).optional(),
});
export type UpgradeRecord = { tenantId: string; actorId: string; feature: string; message?: string };
export type UpgradeDeps = {
  tenant(): Promise<{ tenantId: string; planId: string }>;
  entitlements(): Promise<(feature: string) => boolean>;
  record(input: UpgradeRecord, since: Date): Promise<void>;
  now?(): Date;
};
export function createUpgradeHandler(deps: UpgradeDeps) {
  return async (input: z.output<typeof upgradeSchema>, context: ActionContext): Promise<ActionResult> => {
    const session = authorize(context.session, context.tenantId, "session");
    if (!session.accountId || session.kind === "ghost") return { ok: false, status: 403, error: "Phiên hiện tại không hỗ trợ yêu cầu nâng cấp" };
    const tenant = await deps.tenant();
    if (tenant.tenantId !== context.tenantId) return { ok: false, status: 403, error: "Website không hợp lệ" };
    const available = input.feature.startsWith("theme:")
      ? themeAllowed(tenant.planId, input.feature.slice(6) as ThemeGroup)
      : (await deps.entitlements())(input.feature);
    if (available) return { ok: false, status: 400, error: "Tính năng đã có trong gói hiện tại" };
    const now = deps.now?.() ?? new Date();
    await deps.record({ tenantId: context.tenantId, actorId: session.accountId, feature: input.feature, message: input.message }, new Date(now.getTime() - 86_400_000));
    return { ok: true, message: "Đã gửi yêu cầu nâng cấp. Đội tư vấn sẽ liên hệ với bạn." };
  };
}
