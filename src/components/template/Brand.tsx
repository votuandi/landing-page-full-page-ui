import Image from "next/image";
import { SITE_CONFIG } from "@/utils/constants";
export default function Brand() {
  return (
    <span className="brand">
      <Image src="/icon.svg" alt="" width={42} height={42} />
      <span>
        {SITE_CONFIG.name}
        <small>NĂNG LƯỢNG CHO NGÀY MAI</small>
      </span>
    </span>
  );
}
