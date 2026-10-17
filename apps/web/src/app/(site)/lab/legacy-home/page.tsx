import HomePage from "@/components/HomePage";
import LegacySiteShell from "@/components/LegacySiteShell";
import SiteFooter from "@/components/SiteFooter";

// Independent pre-preset reference for E4 visual/TTFB checks; remove in E5-S04.
export default function LegacyHomePage() {
  return <LegacySiteShell footer={<SiteFooter />}><HomePage /></LegacySiteShell>;
}
