import { route } from "../../../../lib/action.ts";
import { productCsvHandlers } from "../../../../lib/productCsvRuntime.ts";

export const GET = route("content.edit", productCsvHandlers.export);
