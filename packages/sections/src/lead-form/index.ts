import { defineVariants } from "../define";
import { leadForm } from "./schema";

export const variants = defineVariants(leadForm, "t15", { t15: () => import("./t15") });
