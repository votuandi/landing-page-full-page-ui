import { defineVariants } from "../define";
import { packages } from "./schema";

export const variants = defineVariants(packages, "t15", { t15: () => import("./t15") });
