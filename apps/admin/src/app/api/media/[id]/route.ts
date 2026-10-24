import { route } from "../../../../lib/action.ts";
import { mediaHandlers } from "../../../../lib/mediaRuntime.ts";

export const GET = route("media.view", mediaHandlers.read);
export const DELETE = route("media.manage", mediaHandlers.remove);
