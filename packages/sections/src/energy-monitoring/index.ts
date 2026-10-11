import { defineVariants } from "../define";
import { energyMonitoring } from "./schema";

export const variants = defineVariants(energyMonitoring, "t15", { t15: () => import("./t15"), t08: () => import("./t08"), t10: () => import("./t10"), t07: () => import("./t07"), t06: () => import("./t06") });
