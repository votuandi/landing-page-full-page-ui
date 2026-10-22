"use server";
import { action } from "../../../lib/action.ts";
import { settingsPayloadSchema } from "../../../lib/siteSettings.ts";
import { siteSettingsHandlers } from "../../../lib/siteSettingsRuntime.ts";
export const saveSiteProfile = action("settings.manage", settingsPayloadSchema, siteSettingsHandlers.profile);
