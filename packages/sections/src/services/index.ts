import { defineVariants } from "../define";
import { services } from "./schema";

export const variants = defineVariants(services, "t15", { t15: () => import("./t15"), t10: () => import("./t10"), t06: () => import("./t06"), t02: () => import("./t02") });
