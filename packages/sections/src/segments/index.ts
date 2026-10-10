import { defineVariants } from "../define";
import { segments } from "./schema";

export const variants = defineVariants(segments, "t15", { t15: () => import("./t15") });
