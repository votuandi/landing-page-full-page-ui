import { defineVariants } from "../define";
import { faq } from "./schema";

export const variants = defineVariants(faq, "t15", { t05: () => import("./t05"), t15: () => import("./t15") });
