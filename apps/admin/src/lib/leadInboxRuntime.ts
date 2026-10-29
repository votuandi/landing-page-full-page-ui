import { forTenant, listLeads, latestLeadAt, updateLead, deleteLead, resendLead, withTenantTransaction } from "@solar/db";
import type { Session } from "@solar/auth";
import { getRuntime } from "./runtime.ts";
import { getSiteEntitlements } from "./entitlements.ts";
import { createLeadInboxHandlers, leadActor, type LeadInboxDeps } from "./leadInbox.ts";

async function actor(tenantId: string, session: Session) {
  const ghost = session.kind === "ghost" ? await forTenant(getRuntime().db, tenantId).siteSession.get(session.id) : null;
  return leadActor(session, ghost?.ghostGrantId);
}
export const leadInboxDeps: LeadInboxDeps = {
  can: getSiteEntitlements,
  list: (tenantId, filters, options) => listLeads(getRuntime().db, tenantId, filters, options),
  latest: tenantId => latestLeadAt(getRuntime().db, tenantId),
  update: async (tenantId, id, patch, session) => updateLead(getRuntime().db, tenantId, id, patch, await actor(tenantId, session)),
  remove: async (tenantId, id, session) => deleteLead(getRuntime().db, tenantId, id, await actor(tenantId, session)),
  resend: async (tenantId, leadId, jobId, session) => resendLead(getRuntime().db, tenantId, leadId, jobId, await actor(tenantId, session)),
  auditExport: async (tenantId, session, data) => {
    const by = await actor(tenantId, session);
    await withTenantTransaction(getRuntime().db, tenantId, repo => repo.auditLog.create({ actorType: by.type, actorId: by.id, ghostGrantId: by.ghostGrantId, action: "lead.export", entity: "Lead", data }));
  },
};
export const leadInboxHandlers = createLeadInboxHandlers(leadInboxDeps);
