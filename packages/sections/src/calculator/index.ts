import { defineVariants } from "../define";
import { calculator } from "./schema";

export const variants = defineVariants(calculator, "t15", { t15: () => import("./t15"), t12: () => import("./t12") });
