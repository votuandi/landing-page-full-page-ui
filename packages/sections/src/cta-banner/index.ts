import { defineVariants } from "../define";
import { ctaBanner } from "./schema";

export const variants = defineVariants(ctaBanner, "t15", { t15: () => import("./t15") });
