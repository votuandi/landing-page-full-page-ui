import { createAppearanceHandlers } from "./appearance.ts";
import { siteSettingsDeps } from "./siteSettingsRuntime.ts";
export const appearanceHandlers = createAppearanceHandlers(siteSettingsDeps);
