import { defineVariants } from "../../define";
import { commitmentsStrip } from "./schema";

export const variants = defineVariants(commitmentsStrip, "t15", { t15: () => import("./t15") });
