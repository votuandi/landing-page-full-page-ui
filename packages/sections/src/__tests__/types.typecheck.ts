import { defineSectionType, defineVariants, type SectionPropsOf, type SectionVariant } from "../define";
import { demo, otherLoader, v1, v2 } from "./fixtures";

const valid: SectionVariant<typeof demo> = ({ data, site, sectionId }) => {
  const count: number = data.count;
  const locale: "vi" | "en" = site.locale;
  return `${sectionId}: ${data.title.toUpperCase()} (${count}, ${locale})`;
};
defineVariants(demo, "v1", { v1, v2, valid: async () => ({ default: valid }) });

const invalid: SectionVariant<typeof demo> = ({ data }) => {
  // @ts-expect-error Trường không nằm trong schema.
  data.khongCo;
  // @ts-expect-error title là string, không phải number.
  data.title.toFixed();
  return data.title;
};
void invalid;

// @ts-expect-error Loader phải nhận props của cùng type.
defineVariants(demo, "v1", { v1: otherLoader });
// @ts-expect-error Variant mặc định phải nằm trong các key đã khai báo.
defineVariants(demo, "v3", { v1, v2 });
defineSectionType({
  ...demo,
  // @ts-expect-error Defaults là output sau parse, title là bắt buộc.
  defaults: { count: 0 },
});
defineSectionType({
  ...demo,
  // @ts-expect-error count có default nhưng bắt buộc ở output sau parse.
  defaults: { title: "Mẫu" },
});
const output: SectionPropsOf<typeof demo>["data"] = demo.schema.parse({ title: "Mẫu" });
const count: number = output.count;
void count;
