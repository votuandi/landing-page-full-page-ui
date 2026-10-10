import { defineVariants } from "@solar/sections";
import { demo } from "./schema";

export const variants = defineVariants(demo, "v1", {
  v1: () => import("./v1"),
  v2: () => import("./v2"),
});
