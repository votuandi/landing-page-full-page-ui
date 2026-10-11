import { defineVariants } from "../define";
import { loadProfile } from "./schema";

export const variants = defineVariants(loadProfile, "t06", { t06: () => import("./t06") });
