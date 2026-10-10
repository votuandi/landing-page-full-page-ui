import { defineVariants } from "../define";
import { energyMonitoring } from "./schema";

export const variants = defineVariants(energyMonitoring, "t15", { t15: () => import("./t15") });
