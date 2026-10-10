import { defineVariants } from "../../define";
import { mobileBottomNav } from "./schema";

export const variants = defineVariants(mobileBottomNav, "t15", { t15: () => import("./t15") });
