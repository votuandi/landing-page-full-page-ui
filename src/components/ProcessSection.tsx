import { Tr } from "@/i18n/LangProvider";

const STEPS = [
  ["01", ["Khảo sát", "Survey"], ["Phụ tải, hóa đơn, mái, trạm điện và điều kiện thi công.", "Loads, bills, roof, substation and site conditions."], ["Biên bản khảo sát + dữ liệu đầu vào", "Survey report + input data"]],
  ["02", ["Thiết kế", "Design"], ["Mô phỏng sản lượng, chọn thiết bị, layout và phương án đấu nối.", "Yield simulation, equipment, layout and grid connection."], ["Hồ sơ kỹ thuật + mô hình tài chính", "Technical file + financial model"]],
  ["03", ["Thi công", "Installation"], ["Kế hoạch an toàn, chia khu vực, quản lý vật tư và chất lượng.", "Safety plan, zoned works, materials and QA."], ["Checklist thi công + nhật ký", "Checklist + site log"]],
  ["04", ["Nghiệm thu", "Commissioning"], ["Đo kiểm, cấu hình giám sát, hướng dẫn vận hành.", "Testing, monitoring setup, operator training."], ["Biên bản nghiệm thu + hồ sơ bàn giao", "Acceptance + handover file"]],
  ["05", ["Bảo trì", "O&M"], ["Theo dõi sản lượng, cảnh báo, vệ sinh và bảo trì.", "Output tracking, alerts, cleaning and maintenance."], ["Báo cáo hiệu suất định kỳ", "Periodic performance report"]],
] as const;

const DOTS = ["bg-leaf", "bg-sky", "bg-accent", "bg-primary", "bg-secondary"];

/** Quy trình 5 bước — mỗi bước có đầu ra rõ ràng. Thanh "dòng năng lượng" nối các bước. */
export default function ProcessSection() {
  return (
    <section id="quy-trinh" className="t15-section relative overflow-hidden bg-bg-tint" aria-labelledby="quy-trinh-title">
      <div aria-hidden className="t15-dots pointer-events-none absolute inset-0 opacity-60" />
      <div className="t15-container relative">
        <div data-reveal="down" className="max-w-3xl">
          <span className="t15-eyebrow"><Tr vi="Quy trình triển khai" en="How we deliver" /></span>
          <h2 id="quy-trinh-title" className="t15-heading"><Tr vi="Mỗi bước đều có đầu ra rõ ràng để bạn kiểm soát." en="Every step has a clear deliverable you can check." /></h2>
        </div>
        <div className="relative mt-12">
          <div aria-hidden className="t15-energy-line absolute left-[10%] right-[10%] top-7 hidden h-1 rounded-full lg:block" />
          <ol data-reveal-stagger="up" data-reveal-step="0.12" className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {STEPS.map(([no, title, desc, output], i) => (
              <li key={no} className="t15-card t15-card-hover flex flex-col p-6">
                <span className="relative grid h-14 w-14 place-items-center rounded-2xl bg-bg-elevated text-lg font-black text-fg shadow-lg ring-1 ring-line/10">
                  {no}<span aria-hidden className={`absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full ring-4 ring-bg-elevated ${DOTS[i]}`} />
                </span>
                <h3 className="mt-5 text-xl font-black text-fg"><Tr vi={title[0]} en={title[1]} /></h3>
                <p className="mt-2 text-sm leading-6 text-fg-muted"><Tr vi={desc[0]} en={desc[1]} /></p>
                <div className="mt-auto pt-6">
                  <div className="rounded-2xl bg-bg-tint p-3 text-xs font-bold leading-5 text-fg"><span className="mb-1 block text-[10px] uppercase tracking-[.16em] text-primary"><Tr vi="Đầu ra" en="Deliverable" /></span><Tr vi={output[0]} en={output[1]} /></div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
