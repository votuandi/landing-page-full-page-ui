import { redirect } from "next/navigation";
import { SEGMENTS, SEGMENT_IDS } from "@/content/site";
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const id = SEGMENT_IDS.find((s) => SEGMENTS[s].slug === slug);
  redirect(id ? `/giai-phap/${SEGMENTS[id].slug}` : "/service");
}
