import { defineVariants } from "../define";
import { siteFooter } from "./schema";

export const variants = defineVariants(siteFooter, "t15", { t15: () => import("./t15") });
