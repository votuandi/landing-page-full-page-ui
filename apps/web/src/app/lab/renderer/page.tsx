import { PageRenderer, pageConfigSchema, type LoadSectionData, type SiteContext } from "@solar/sections";
import { demoRegistry } from "../sections/_demo/registry";

const site: SiteContext = { tenantId: "lab-demo", locale: "vi", themeId: "t15" };
const title = (vi: string) => ({ title: { vi: `[DỮ LIỆU MẪU] ${vi}` } });

// Thứ tự cố ý khác registry; "bi-tat" tắt, "loi-server" lỗi khi chuẩn bị dữ liệu, "loi-client" lỗi khi hydrate.
const page = pageConfigSchema.parse({ sections: [
  { id: "mo-dau", type: "demo-b", variant: "v1", data: title("Mở đầu") },
  { id: "bi-tat", type: "demo-a", variant: "v1", enabled: false, data: title("Section đã tắt") },
  { id: "loi-server", type: "demo-a", variant: "v2", data: title("Lỗi dữ liệu server") },
  { id: "loi-client", type: "demo-crash", variant: "v1", data: title("Lỗi render client") },
  { id: "du-toan", type: "demo-a", variant: "v1", anchor: "du-toan", data: title("Dự toán") },
] });

const loadData: LoadSectionData = ({ section, data }) => {
  if (section.id === "loi-server") throw new Error("[DỮ LIỆU MẪU] truy vấn collection lỗi");
  return data;
};

export default function RendererLabPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-6 py-12">
      <h1 className="text-3xl font-bold text-fg">[DỮ LIỆU MẪU] Lab PageRenderer</h1>
      <p className="text-fg-muted">Trang render từ cấu hình: một section tắt, một lỗi dữ liệu server, một lỗi render client.</p>
      <PageRenderer page={page} site={site} registry={demoRegistry} loadData={loadData} />
    </main>
  );
}
