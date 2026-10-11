import { defineVariants } from "../define";
import { testimonials } from "./schema";

export const variants = defineVariants(testimonials, "t15", {
  t15: () => import("./t15"),
  t10: () => import("./t10"),
});
