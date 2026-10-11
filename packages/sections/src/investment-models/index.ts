import { defineVariants } from "../define";
import { investmentModels } from "./schema";

export const variants = defineVariants(investmentModels, "t15", { t15: () => import("./t15"), t10: () => import("./t10"), t05: () => import("./t05") });
