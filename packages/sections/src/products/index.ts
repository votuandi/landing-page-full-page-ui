import { defineVariants } from "../define";
import { products } from "./schema";

export const variants = defineVariants(products, "t15", { t15: () => import("./t15") });
