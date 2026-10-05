import SliderBanner from "@/components/SliderBanner";
import Hero from "@/components/Hero";
import SolarBenefitsSection from "@/components/SolarBenefitsSection";
import SolarExpertiseSection from "@/components/SolarExpertiseSection";
import ProductSection from "@/components/ProductSection";
import OurPartners from "@/components/OurPartners";
import ProjectsSection from "@/components/ProjectsSection";
import NewsSection from "@/components/NewsSection";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#fffaf0]">
      <SliderBanner />
      <Hero />
      <SolarBenefitsSection />
      <ProductSection />
      <SolarExpertiseSection />
      <OurPartners />
      <ProjectsSection />
      <NewsSection />
    </main>
  );
}
