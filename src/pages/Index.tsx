import { HomeNavbar } from "@/components/layout/HomeNavbar";
import { HeroSection } from "@/components/home/HeroSection";
import { ServiceHeroSection } from "@/components/home/ServiceHeroSection";
import { WhyWeExistSection } from "@/components/home/WhyWeExistSection";
import { ImpactSection } from "@/components/home/ImpactSection";
import { FooterSection } from "@/components/home/FooterSection";
import CustomScrollbar from "@/components/ui/CustomScrollbar";

const Index = () => {
  return (
    <CustomScrollbar>
      <div className="relative min-h-screen">
        <HomeNavbar />
        <HeroSection />
        <div 
          className="relative z-10"
          style={{
            backgroundImage: 'url(/bg_img.png)',
            backgroundAttachment: 'fixed',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          <ImpactSection />
          <WhyWeExistSection />
          <ServiceHeroSection />
          <FooterSection />
        </div>
      </div>
    </CustomScrollbar>
  );
};

export default Index;
