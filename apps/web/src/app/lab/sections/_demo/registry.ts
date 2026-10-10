import { createRegistry } from "@solar/sections";
import { variants as demoA } from "./demo-a";
import { variants as demoB } from "./demo-b";
import { variants as demoCrash } from "./demo-crash";

export const demoRegistry = createRegistry({ "demo-a": demoA, "demo-b": demoB, "demo-crash": demoCrash });
