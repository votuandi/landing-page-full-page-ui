import {
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  BuildingOffice2Icon,
} from "@heroicons/react/24/outline";
import { getBrand } from "@/content/solar";
export default function StickyContact() {
  const b = getBrand();
  return (
    <nav className="solar-sticky-contact" aria-label="Liên hệ nhanh">
      <a href={`tel:${b.hotlines[0].phone}`}>
        <PhoneIcon />
        <span>Gọi</span>
      </a>
      <a href={b.zalo.home} target="_blank" rel="noreferrer">
        <ChatBubbleLeftRightIcon />
        <span>Zalo Gia đình</span>
      </a>
      <a href={b.zalo.business} target="_blank" rel="noreferrer">
        <BuildingOffice2Icon />
        <span>Zalo Doanh nghiệp</span>
      </a>
    </nav>
  );
}
