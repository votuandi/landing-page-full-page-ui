"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Don't track visits on admin routes
    if (pathname?.startsWith("/admin")) {
      return;
    }

    // Track visit
    const trackVisit = async () => {
      try {
        await fetch("/api/visits/track", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
      } catch (error) {
        // Silently fail - we don't want to break the user experience
        console.error("Failed to track visit:", error);
      }
    };

    trackVisit();
  }, [pathname]);

  return null; // This component doesn't render anything
}
