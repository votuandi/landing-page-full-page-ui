import { route } from "../../../lib/action.ts";
import { mediaHandlers } from "../../../lib/mediaRuntime.ts";

export const POST = route("media.manage", mediaHandlers.reserve);
