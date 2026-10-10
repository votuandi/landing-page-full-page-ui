import { defineVariants } from "../define";
import { press } from "./schema";

export const variants = defineVariants(press, "t15", { t15: () => import("./t15") });
