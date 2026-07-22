import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import PromoModal from "@/components/PromoModal";
import HeroSection from "@/components/home/HeroSection";
import AboutSnippet from "@/components/home/AboutSnippet";
import ServicesSection from "@/components/home/ServicesSection";
import ProcessSection from "@/components/home/ProcessSection";
import GoalsSection from "@/components/home/GoalsSection";
import OpenAccountBanner from "@/components/home/OpenAccountBanner";
import ContactSection from "@/components/home/ContactSection";
import FaqSection from "@/components/home/FaqSection";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <AboutSnippet />
        <ServicesSection />
        <ProcessSection />
        <GoalsSection />
        <OpenAccountBanner />
        <ContactSection />
        <FaqSection />
      </main>
      <Footer />
      <WhatsAppFloat />
      <PromoModal />
    </>
  );
}
