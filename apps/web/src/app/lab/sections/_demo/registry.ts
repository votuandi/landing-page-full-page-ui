import { createRegistry } from "@solar/sections";
import { variants as demoA } from "./demo-a";
import { variants as demoB } from "./demo-b";

export const demoRegistry = createRegistry({ "demo-a": demoA, "demo-b": demoB });
