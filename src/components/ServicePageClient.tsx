"use client";

import React, { useState } from "react";
import AllServicesSection from "@/components/AllServicesSection";
import WarrantySection from "@/components/WarrantySection";
import { Service } from "@/types";

interface ServicePageClientProps {
  services: Service[];
}

export default function ServicePageClient({
  services,
}: ServicePageClientProps) {
  const [activeTab, setActiveTab] = useState<"services" | "warranty">(
    "services"
  );

  return (
    <>
      {/* Tab Content */}
      {activeTab === "services" ? (
        <AllServicesSection services={services} />
      ) : (
        <WarrantySection />
      )}
    </>
  );
}
