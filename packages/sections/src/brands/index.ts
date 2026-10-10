import { defineVariants } from "../define";
import { brands } from "./schema";

export const variants = defineVariants(brands, "t15", { t15: () => import("./t15") });
