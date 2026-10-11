import { defineVariants } from "../define";
import { hero } from "./schema";

export const variants = defineVariants(hero, "t15", { t06: () => import("./t06"), t15: () => import("./t15") });
