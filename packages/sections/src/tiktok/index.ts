import { defineVariants } from "../define";
import { tiktok } from "./schema";

export const variants = defineVariants(tiktok, "t15", { t15: () => import("./t15") });
