"use client";
import { CATALOG_COPY } from "@/content/site";
import { useRFQ } from "./SiteShell";
export default function ProductQuoteButton({ slug }: { slug: string }) {
  const rfq = useRFQ();
  return (
    <button
      onClick={() => {
        rfq.add(slug);
        rfq.open();
      }}
      className="t5-button t5-button-primary"
    >
      {CATALOG_COPY.add}
    </button>
  );
}
