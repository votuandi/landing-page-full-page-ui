import { z } from "zod";
import { defineSectionType } from "../../define";
import { localized } from "../../fields";
import { fixture } from "./fixtures";

export const themeSwitchSchema = z.object({
  lightLabel: localized(), darkLabel: localized(),
});
export const themeSwitch = defineSectionType({
  type: "theme-switch", schemaVersion: 1, schema: themeSwitchSchema, defaults: themeSwitchSchema.parse(fixture),
  meta: {"label": {"vi": "theme-switch"}, "icon": "theme-switch"},
});
