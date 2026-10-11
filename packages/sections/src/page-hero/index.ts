import { defineVariants } from "../define";
import { pageHero } from "./schema";

export const variants = defineVariants(pageHero, "t03", { t03: () => import("./t03") });
