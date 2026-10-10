import { defineVariants } from "../../define";
import { scrollProgress } from "./schema";

export const variants = defineVariants(scrollProgress, "t15", { t15: () => import("./t15") });
