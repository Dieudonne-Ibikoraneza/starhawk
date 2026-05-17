import { HomeNavbar } from "@/components/layout/HomeNavbar";
import { HeroSection } from "@/components/home/HeroSection";
import { RedefiningClaimSection } from "@/components/home/RedefiningClaimSection";
import { SatelliteDroneSection } from "@/components/home/SatelliteDroneSection";
import { FooterSection } from "@/components/home/FooterSection";
import CustomScrollbar from "@/components/ui/CustomScrollbar";

const Index = () => {
  return (
    <CustomScrollbar>
      <div className="relative min-h-screen bg-[#f8f9fc]">
        <HomeNavbar />
        {/* Hero does NOT need top padding — it has pt-28 built in */}
        <HeroSection />
        {/* Rest of sections sit below the hero overlap cards */}
        <div className="relative z-10 pt-6">
          <RedefiningClaimSection />
          <SatelliteDroneSection />
          <FooterSection />
        </div>
      </div>
    </CustomScrollbar>
  );
};

export default Index;
