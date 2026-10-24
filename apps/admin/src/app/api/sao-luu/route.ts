import { route } from "../../../lib/action.ts";
import { backupHandler } from "../../../lib/tenantBackupRuntime.ts";

export const GET = route("site.backup", backupHandler);
