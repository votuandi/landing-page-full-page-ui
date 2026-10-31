import type { Session } from "@solar/auth";
import { forTenant, withTenantTransaction, type TenantRepo } from "@solar/db";
import { createResendDomain, getResendDomain, verifyResendDomain, deleteResendDomain } from "@solar/leads";
import { getSiteEntitlements } from "./entitlements.ts";
import { getRuntime } from "./runtime.ts";
import { createSenderDomainHandlers, type SenderDomainDeps, type SendingDomainRow } from "./senderDomain.ts";

async function audit(repo: TenantRepo, session: Session, row: SendingDomainRow, action: string) {
  const ghost = session.kind === "ghost" ? await repo.siteSession.get(session.id) : null;
  await repo.auditLog.create({ actorType: session.kind === "ghost" ? "platform_admin" : "site_user", actorId: session.accountId,
    ghostGrantId: ghost?.ghostGrantId, action: `senderDomain.${action}`, entity: "SendingDomain", entityId: row.id, data: { hostname: row.hostname } });
}
function mailHostname(from: string | undefined) {
  return from?.match(/@([^<>\s]+)>?\s*$/)?.[1] ?? "";
}
export const senderDomainDeps: SenderDomainDeps = {
  get env() { return { RESEND_DOMAINS_API_KEY: process.env.RESEND_DOMAINS_API_KEY }; },
  get reserved() { return [getRuntime().platform, mailHostname(process.env.MAIL_FROM), mailHostname(process.env.LEAD_EMAIL_FROM)]; },
  can: getSiteEntitlements,
  get: tenantId => forTenant(getRuntime().db, tenantId).sendingDomain.first(),
  reserve: (tenantId, session, hostname) => withTenantTransaction(getRuntime().db, tenantId, async repo => {
    const row = await repo.sendingDomain.create({ hostname });
    await audit(repo, session, row, "reserve"); return row;
  }),
  update: (tenantId, session, before, patch, action) => withTenantTransaction(getRuntime().db, tenantId, async repo => {
    const result = await repo.sendingDomain.update(before.id, patch, { hostname: before.hostname, providerId: before.providerId });
    if (!result.count) return false;
    await audit(repo, session, before, action); return true;
  }),
  remove: (tenantId, session, before) => withTenantTransaction(getRuntime().db, tenantId, async repo => {
    // Lock the same reservation before deletion: add may have attached its provider id since it was read.
    const held = await repo.sendingDomain.update(before.id, { hostname: before.hostname }, { providerId: before.providerId });
    if (!held.count) return false;
    const result = await repo.sendingDomain.delete(before.id);
    if (!result.count) return false;
    await audit(repo, session, before, "remove"); return true;
  }),
  provider: {
    create: hostname => createResendDomain(hostname, senderDomainDeps.env), get: id => getResendDomain(id, senderDomainDeps.env),
    verify: id => verifyResendDomain(id, senderDomainDeps.env), remove: id => deleteResendDomain(id, senderDomainDeps.env),
  },
};
export const senderDomainHandlers = createSenderDomainHandlers(senderDomainDeps);
