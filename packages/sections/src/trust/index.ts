import { defineVariants } from "../define";
import { trust } from "./schema";

export const variants = defineVariants(trust, "t15", { t15: () => import("./t15") });
