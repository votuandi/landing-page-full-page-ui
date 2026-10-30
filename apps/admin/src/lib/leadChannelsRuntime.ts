import { forTenant, withTenantTransaction, findLeadSender, demoteSendingDomain } from "@solar/db";
import { assertPublicUrl, sendTest, senderFrom } from "@solar/leads";
import { getSiteEntitlements } from "./entitlements.ts";
import { getRuntime } from "./runtime.ts";
import { createLeadChannelHandlers, type LeadChannelDeps } from "./leadChannels.ts";

export const leadChannelDeps: LeadChannelDeps = {
  env: process.env,
  can: getSiteEntitlements,
  get: (tenantId, id) => forTenant(getRuntime().db, tenantId).leadIntegration.get(id),
  list: tenantId => forTenant(getRuntime().db, tenantId).leadIntegration.list({ orderBy: { createdAt: "asc" } }),
  validateUrl: assertPublicUrl,
  send: async (tenantId, config) => {
    const db = getRuntime().db;
    const row = config.kind === "email" ? await findLeadSender(db, tenantId) : null;
    return sendTest(config, process.env, row ? { hostname: row.hostname, from: senderFrom(row.name, row.hostname), onRejected: () => demoteSendingDomain(db, tenantId, row.hostname) } : null);
  },
  write: (tenantId, session, operation, row) => withTenantTransaction(getRuntime().db, tenantId, async repo => {
    const data = { kind: row.kind, name: row.name, enabled: row.enabled, configEncrypted: row.configEncrypted };
    if (operation === "create") await repo.leadIntegration.create({ id: row.id, ...data });
    else {
      const result = operation === "delete" ? await repo.leadIntegration.delete(row.id) : await repo.leadIntegration.update(row.id, data);
      if (!result.count) return false;
    }
    const ghost = session.kind === "ghost" ? await repo.siteSession.get(session.id) : null;
    await repo.auditLog.create({ actorType: session.kind === "ghost" ? "platform_admin" : "site_user", actorId: session.accountId, ghostGrantId: ghost?.ghostGrantId,
      action: `lead-channel.${operation}`, entity: "LeadIntegration", entityId: row.id, data: { kind: row.kind, enabled: row.enabled } });
    return true;
  }),
};
export const leadChannelHandlers = createLeadChannelHandlers(leadChannelDeps);
