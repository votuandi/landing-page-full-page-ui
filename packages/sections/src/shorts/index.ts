import { defineVariants } from "../define";
import { shorts } from "./schema";

export const variants = defineVariants(shorts, "t15", { t15: () => import("./t15") });
