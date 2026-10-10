import { z } from "zod";
import { localized } from "../fields";

export const segmentLabelsSchema = z.object({ household: localized(), shop: localized(), factory: localized(), farm: localized() });
