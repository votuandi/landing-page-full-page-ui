import type { SectionPropsOf } from "../define";
import type { packages } from "./schema";
import PackagesT04 from "./t04.client";

export default function PackagesSectionT04(props: SectionPropsOf<typeof packages>) {
  return <PackagesT04 {...props} />;
}
