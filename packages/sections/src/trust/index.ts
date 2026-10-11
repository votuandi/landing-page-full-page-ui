import { defineVariants } from "../define";
import { trust } from "./schema";

export const variants = defineVariants(trust, "t15", { t05: () => import("./t05"), t15: () => import("./t15"), t13: () => import("./t13") });
