import { defineVariants } from "../../define";
import { consultPopup } from "./schema";

export const variants = defineVariants(consultPopup, "t15", { t15: () => import("./t15") });
