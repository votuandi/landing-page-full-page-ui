import { defineVariants } from "../define";
import { process } from "./schema";

export const variants = defineVariants(process, "t15", { t05: () => import("./t05"), t15: () => import("./t15") });
