import { defineVariants } from "../../define";
import { themeSwitch } from "./schema";

export const variants = defineVariants(themeSwitch, "t15", { t15: () => import("./t15") });
