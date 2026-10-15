import { sectionRegistry } from "../../packages/sections/src/registry";
import { themes } from "../../packages/themes/src/index";

// Discover tests from the same registry as the lab, including newly added types.
export const matrixTypes = Object.keys(sectionRegistry.types);
export const matrixThemes = themes.map((theme) => theme.meta.id);
export const matrixVariants = Object.fromEntries(matrixTypes.map((type) => [type, sectionRegistry.variantsOf(type)!]));
