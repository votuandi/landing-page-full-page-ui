import { defineVariants } from "../define";
import { branchMap } from "./schema";

export const variants = defineVariants(branchMap, "t15", { t15: () => import("./t15") });
