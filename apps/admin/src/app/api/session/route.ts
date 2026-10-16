import { route } from "../../../lib/action.ts";

export const GET = route("dashboard.view", async (_request, context) => Response.json({ accountId: context.session!.accountId, tenantId: context.tenantId, role: context.session!.role }));
