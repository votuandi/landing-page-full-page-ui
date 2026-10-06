import SolarHome from "@/components/solar/SolarHome";
import { makeMetadata } from "@/utils/solar";
import { getFaqSchema, getSeoContent, serializeSchema } from "@/lib/solar-seo";
const seo = getSeoContent();
export const metadata = {
  ...makeMetadata(
    seo.title,
    seo.description,
    "/",
    "/images/illustrations/home-solar.webp",
  ),
  title: { absolute: seo.title },
};
export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeSchema(getFaqSchema()) }}
      />
      <SolarHome />
    </>
  );
}
