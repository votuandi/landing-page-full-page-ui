import type { SectionPropsOf } from "../../define";
import { pickLocale } from "../../fields";
import type { themeSwitch } from "./schema";
import ThemeSwitch from "./t15.client";

export default function ThemeSwitchT15({ data, site }: SectionPropsOf<typeof themeSwitch>) {
  return <ThemeSwitch lightLabel={pickLocale(data.lightLabel, site.locale)} darkLabel={pickLocale(data.darkLabel, site.locale)} />;
}
