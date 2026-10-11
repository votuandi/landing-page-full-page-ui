import { defineVariants } from "../define";
import { investmentModels } from "./schema";

export const variants = defineVariants(investmentModels, "t15", { t05: () => import("./t05"), t15: () => import("./t15") });
