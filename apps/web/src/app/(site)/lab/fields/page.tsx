import { CALCULATOR_ID } from "@solar/core";
import { link, richText, RichText, SectionLink } from "@solar/sections";
import CalculatorReceiver from "./CalculatorReceiver";

const example = richText().parse({ vi: [
  { type: "heading", level: 2, children: [{ type: "text", text: "[DỮ LIỆU MẪU] Rich text an toàn" }] },
  { type: "paragraph", children: [
    { type: "text", text: "Nội dung đậm", bold: true },
    { type: "text", text: " và nghiêng", italic: true },
  ] },
  { type: "list", ordered: false, items: [
    [{ type: "text", text: "[DỮ LIỆU MẪU] Điện mặt trời cho nhà xưởng" }],
    [{ type: "text", text: "[DỮ LIỆU MẪU] Dự toán theo tiền điện hằng tháng" }],
  ] },
  { type: "paragraph", children: [{
    type: "link", link: { kind: "url", value: "https://example.com", label: { vi: "[DỮ LIỆU MẪU] Liên kết" } },
    children: [{ type: "text", text: "[DỮ LIỆU MẪU] Liên kết tham khảo" }],
  }] },
  { type: "paragraph", children: [{ type: "text", text: '<script>alert(1)</script><img src=x onerror="alert(1)">' }] },
] });

const calculator = link().parse({ kind: "calculator", value: "", label: { vi: "[DỮ LIỆU MẪU] Mở dự toán" } });
const factory = link().parse({
  kind: "calculator", value: "phan-khuc=factory&hoa-don=15000000", label: { vi: "[DỮ LIỆU MẪU] Dự toán nhà xưởng" },
});
const linkClass = "inline-flex min-h-11 items-center rounded-pill bg-primary px-5 py-3 font-semibold text-on-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export default function FieldsLabPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-6 py-12 text-fg">
      <h1 className="text-3xl font-bold">[DỮ LIỆU MẪU] Lab kiểu trường chuẩn</h1>
      <div data-testid="richtext" className="space-y-3 break-words">
        <RichText value={example} locale="vi" />
      </div>
      <div className="flex flex-wrap gap-3">
        <SectionLink link={calculator} locale="vi" className={linkClass} />
        <SectionLink link={factory} locale="vi" className={linkClass} />
      </div>
      <section id={CALCULATOR_ID} className="space-y-3 rounded-card bg-bg-elevated p-6">
        <h2 className="font-heading text-xl font-semibold">[DỮ LIỆU MẪU] Tham số dự toán đã nhận</h2>
        <CalculatorReceiver />
      </section>
    </main>
  );
}
