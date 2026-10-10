import { defineVariants } from "../define";
import { siteHeader } from "./schema";

export const variants = defineVariants(siteHeader, "t15", { t15: () => import("./t15") });
