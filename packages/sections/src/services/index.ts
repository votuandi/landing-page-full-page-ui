import { defineVariants } from "../define";
import { services } from "./schema";

export const variants = defineVariants(services, "t15", { t06: () => import("./t06"), t15: () => import("./t15") });
