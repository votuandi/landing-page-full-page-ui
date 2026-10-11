import { defineVariants } from "../define";
import { process } from "./schema";

export const variants = defineVariants(process, "t15", {
  t15: () => import("./t15"),
  t10: () => import("./t10"),
});
