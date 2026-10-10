import { defineVariants } from "../define";
import { blog } from "./schema";

export const variants = defineVariants(blog, "t15", { t15: () => import("./t15") });
