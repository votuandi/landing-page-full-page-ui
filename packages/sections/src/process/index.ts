import { defineVariants } from "../define";
import { process } from "./schema";

export const variants = defineVariants(process, "t15", { t15: () => import("./t15"), t10: () => import("./t10"), t07: () => import("./t07"), t05: () => import("./t05"), t02: () => import("./t02") });
