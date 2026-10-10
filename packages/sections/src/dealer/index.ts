import { defineVariants } from "../define";
import { dealer } from "./schema";

export const variants = defineVariants(dealer, "t15", { t15: () => import("./t15") });
