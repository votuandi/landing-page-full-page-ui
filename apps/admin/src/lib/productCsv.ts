import { z } from "zod";
import { exportProductsCsv, previewProductCsv, CollectionError, type Collection, type CollectionRow } from "@solar/db";
import { authorize } from "./gate.ts";
import type { ActionContext, ActionResult } from "./action.ts";

export const productCsvSchema = z.object({ text: z.string().max(500_000) });
export type ProductCsvDeps = {
  entitlements(): Promise<(feature: string) => boolean>;
  list(tenantId: string, name: Collection): Promise<CollectionRow[]>;
  import(tenantId: string, text: string, options: { bilingual: boolean }): Promise<{ count: number }>;
};
export function createProductCsvHandlers(deps: ProductCsvDeps) {
  async function load(context: ActionContext) {
    authorize(context.session, context.tenantId, "content.edit");
    const can = await deps.entitlements();
    if (!can("catalog")) return null;
    const [products, categories, brands] = await Promise.all(["product", "productCategory", "brand"].map(name => deps.list(context.tenantId, name as Collection)));
    return { products, refs: { categories, brands }, bilingual: can("bilingual") };
  }
  async function run(input: z.output<typeof productCsvSchema>, context: ActionContext, confirm: boolean): Promise<ActionResult> {
    const data = await load(context);
    if (!data) return { ok: false, status: 403, error: "Gói hiện tại không có sản phẩm" };
    const preview = previewProductCsv(input.text, data.products, data.refs, data);
    const errors = preview.rows.flatMap(row => row.errors.map(e => `Dòng ${row.line}, cột ${e.column}: ${e.message}`));
    if (errors.length) return { ok: false, status: 400, csvRows: preview.rows, error: errors.join("; ") };
    if (!confirm) return { ok: true, csvRows: preview.rows };
    try {
      const result = await deps.import(context.tenantId, input.text, { bilingual: data.bilingual });
      return { ok: true, message: `Đã nhập ${result.count} sản phẩm` };
    } catch (error) {
      if (error instanceof CollectionError) return { ok: false, status: error.status, error: error.message };
      throw error;
    }
  }
  return {
    preview: (input: z.output<typeof productCsvSchema>, context: ActionContext) => run(input, context, false),
    import: (input: z.output<typeof productCsvSchema>, context: ActionContext) => run(input, context, true),
    async export(_request: Request, context: ActionContext): Promise<Response> {
      const data = await load(context);
      if (!data) return Response.json({ error: "Không tìm thấy" }, { status: 404 });
      try {
        return new Response(exportProductsCsv(data.products, data.refs.categories, data.refs.brands), { headers: {
          "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="san-pham.csv"',
        } });
      } catch { return Response.json({ error: "Chỉ có thể xuất tối đa 1000 sản phẩm" }, { status: 400 }); }
    },
  };
}
