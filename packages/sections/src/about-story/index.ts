import { defineVariants } from "../define";
import { aboutStory } from "./schema";

export const variants = defineVariants(aboutStory, "t15", { t15: () => import("./t15") });
