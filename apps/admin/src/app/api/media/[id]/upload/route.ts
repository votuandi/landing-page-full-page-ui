import { route } from "../../../../../lib/action.ts";
import { mediaHandlers } from "../../../../../lib/mediaRuntime.ts";

export const PUT = route("media.manage", mediaHandlers.upload);
