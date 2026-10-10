import { defineVariants } from "../../define";
import { quoteCart } from "./schema";

export const variants = defineVariants(quoteCart, "t15", { t15: () => import("./t15") });
