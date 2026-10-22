"use server";
import { action } from "../../lib/action.ts";
import { upgradeSchema } from "../../lib/upgrade.ts";
import { upgradeHandler } from "../../lib/upgradeRuntime.ts";

export const requestUpgrade = action("session", upgradeSchema, upgradeHandler);
