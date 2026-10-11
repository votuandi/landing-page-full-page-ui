import { defineVariants } from "../define";
import { trust } from "./schema";

export const variants = defineVariants(trust, "t15", { t15: () => import("./t15"), t13: () => import("./t13"), t11: () => import("./t11"), t10: () => import("./t10"), t05: () => import("./t05") });
