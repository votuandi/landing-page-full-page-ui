import SliderBanner from "@/components/SliderBanner";
import Hero from "@/components/Hero";
import OurPartners from "@/components/OurPartners";
import ProductSection from "@/components/ProductSection";
import ProjectsSection from "@/components/ProjectsSection";
import NewsSection from "@/components/NewsSection";

export default function Home() {
  return (
    <main className="min-h-screen">
      <SliderBanner />
      <Hero />
      <OurPartners />
      <ProductSection />
      <ProjectsSection />
      <NewsSection />
    </main>
  );
}
