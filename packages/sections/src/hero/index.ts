import { defineVariants } from "../define";
import { hero } from "./schema";

export const variants = defineVariants(hero, "t15", { t15: () => import("./t15"), t12: () => import("./t12"), t11: () => import("./t11"), t07: () => import("./t07") });
