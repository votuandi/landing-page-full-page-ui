import type { ReactNode } from "react";
import { SiteStateProvider } from "@solar/sections";

export default function SectionsLabLayout({ children }: { children: ReactNode }) {
  return <SiteStateProvider>{children}</SiteStateProvider>;
}
