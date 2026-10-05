"use client";

import React from "react";
import BestSellerSection from "@/components/BestSellerSection";
import AllProductsSection from "@/components/AllProductsSection";

export default function ProductPage() {
  return (
    <main className="min-h-screen">
      <div className="bg-gray-50">
        {/* Best Seller Section */}
        <BestSellerSection />

        {/* All Products Section */}
        <AllProductsSection />
      </div>
    </main>
  );
}
