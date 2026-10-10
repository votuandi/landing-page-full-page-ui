import { defineVariants } from "../define";
import { services } from "./schema";

export const variants = defineVariants(services, "t15", { t15: () => import("./t15") });
