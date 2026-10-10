import { defineVariants } from "../define";
import { investmentModels } from "./schema";

export const variants = defineVariants(investmentModels, "t15", { t15: () => import("./t15") });
