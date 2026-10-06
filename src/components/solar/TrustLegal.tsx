import Image from "next/image";
import { ShieldCheckIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { getBrand, getLegal } from "@/content/solar";
import SectionHeading from "./SectionHeading";
export default function TrustLegal() {
  const licenses=getBrand().licenses.filter(l=>l.lookupUrl&&/^https?:\/\//.test(l.lookupUrl));
  return <section className="solar-section" id="phap-ly"><div className="solar-container"><SectionHeading step="05" label="Minh bạch từ đầu" title="Cần kiểm tra gì trước khi ký hợp đồng?" answer="Cần đối chiếu pháp nhân, phạm vi công việc, thiết bị, bảo hành và yêu cầu pháp lý của công trình. Thông tin chưa xác nhận không nên được coi là cam kết." />
    {licenses.length>0 ? <div className="solar-license-grid">{licenses.map(l=><a className="solar-card solar-license" key={l.id} href={l.lookupUrl} target="_blank" rel="noreferrer">{l.image?<Image src={l.image} alt={`Hồ sơ ${l.title}`} width={160} height={120} loading="lazy" unoptimized={l.image.startsWith("http")} />:<ShieldCheckIcon className="solar-icon" />}<span>{l.title}</span><ArrowTopRightOnSquareIcon className="solar-icon" /></a>)}</div> : <p className="solar-legal-empty">Bản demo chưa có link hồ sơ doanh nghiệp để tra cứu. Chủ website cần cung cấp hồ sơ thực trước khi xuất bản.</p>}
    <div className="solar-legal-grid"><div><h3>Pháp lý cần biết</h3><p className="solar-note">Xác nhận với đơn vị chuyên môn và điện lực tại thời điểm triển khai; không suy ra điều kiện áp dụng từ phép tính tiết kiệm.</p></div><div>{getLegal().map(l=><details className="solar-accordion" key={l.id}><summary>{l.question}</summary><p>{l.answer}</p><a href={l.source} target="_blank" rel="noreferrer">Tra cứu nguồn của mục này</a>{process.env.NODE_ENV==="development"&&!l.verified&&<small className="solar-note solar-dev-note">Dữ liệu legal chưa xác minh · verified: false</small>}</details>)}</div></div>
  </div></section>;
}
