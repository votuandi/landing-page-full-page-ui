import { defineVariants } from "../define";
import { energyMonitoring } from "./schema";

export const variants = defineVariants(energyMonitoring, "t15", { t06: () => import("./t06"), t15: () => import("./t15") });
