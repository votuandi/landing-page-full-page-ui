import { defineVariants } from "../define";
import { warranty } from "./schema";

export const variants = defineVariants(warranty, "t15", { t15: () => import("./t15") });
