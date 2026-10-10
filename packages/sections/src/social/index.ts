import { defineVariants } from "../define";
import { social } from "./schema";

export const variants = defineVariants(social, "t15", { t15: () => import("./t15") });
