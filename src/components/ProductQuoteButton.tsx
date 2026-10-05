"use client";
import { useRFQ } from "@/components/SiteShell";
export default function ProductQuoteButton({ slug }: { slug: string }) {
  const rfq = useRFQ();
  return <button type="button" onClick={() => { rfq.add(slug); rfq.open(); }} className="t5-button t5-button-primary">Thêm vào yêu cầu báo giá</button>;
}