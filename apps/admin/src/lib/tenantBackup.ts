import type { Session } from "@solar/auth";
import type { ActionContext } from "./action.ts";

export type BackupDeps = {
  export(tenantId: string): Promise<unknown>;
  audit(tenantId: string, session: Session): Promise<void>;
};
export function createBackupHandler(deps: BackupDeps) {
  return async (_request: Request, context: ActionContext) => {
    const bundle = await deps.export(context.tenantId);
    await deps.audit(context.tenantId, context.session!);
    const slug = context.slug.replace(/[^a-z0-9-]/g, "-");
    return Response.json(bundle, { headers: {
      "Content-Disposition": `attachment; filename="${slug}-backup-${new Date().toISOString().slice(0, 10)}.json"`,
      "X-Content-Type-Options": "nosniff",
    } });
  };
}
