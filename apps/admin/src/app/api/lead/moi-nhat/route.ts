import { route } from "../../../../lib/action.ts";
import { leadInboxHandlers } from "../../../../lib/leadInboxRuntime.ts";
export const GET = route("leads.view", leadInboxHandlers.latest);
