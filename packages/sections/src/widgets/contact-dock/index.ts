import { defineVariants } from "../../define";
import { contactDock } from "./schema";

export const variants = defineVariants(contactDock, "t15", { t15: () => import("./t15") });
