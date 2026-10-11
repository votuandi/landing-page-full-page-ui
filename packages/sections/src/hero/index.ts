import { defineVariants } from "../define";
import { hero } from "./schema";

export const variants = defineVariants(hero, "t15", { t15: () => import("./t15"), t12: () => import("./t12"), t11: () => import("./t11"), t10: () => import("./t10"), t07: () => import("./t07"), t06: () => import("./t06"), minwy: () => import("./minwy"), t02: () => import("./t02"), t03: () => import("./t03"), t04: () => import("./t04") });
