import { defineVariants } from "../define";
import { stats } from "./schema";

export const variants = defineVariants(stats, "t15", { t15: () => import("./t15") });
