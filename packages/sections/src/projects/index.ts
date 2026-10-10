import { defineVariants } from "../define";
import { projects } from "./schema";

export const variants = defineVariants(projects, "t15", { t15: () => import("./t15") });
