import { defineVariants } from "../define";
import { faq } from "./schema";

export const variants = defineVariants(faq, "t15", { t15: () => import("./t15"), t10: () => import("./t10"), t05: () => import("./t05"), t02: () => import("./t02") }, {"t15":["background","spacing"],"t02":["background","spacing","align"],"t05":["background","spacing"],"t10":["background","spacing"]});
