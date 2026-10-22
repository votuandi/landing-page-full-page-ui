"use client";
import { UpgradeDialog } from "@solar/cms-ui";
import { featureLabels, isFeature, themeLabels, type ThemeGroup } from "@solar/plans";
import { requestUpgrade } from "../app/(admin)/upgrade-actions.ts";

export function UpgradeRequest({ feature, onClose }: { feature: string; onClose(): void }) {
  const label = isFeature(feature) ? featureLabels[feature] : themeLabels[feature.slice(6) as ThemeGroup];
  return <UpgradeDialog open label={label} onClose={onClose} submit={async message => {
    const form = new FormData(); form.set("feature", feature); form.set("message", message);
    return requestUpgrade({}, form);
  }} />;
}
