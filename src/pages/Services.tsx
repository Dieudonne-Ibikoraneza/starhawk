import { useState } from "react";
import { motion } from "framer-motion";
import { HomeNavbar } from "@/components/layout/HomeNavbar";
import { FooterSection } from "@/components/home/FooterSection";
import CustomScrollbar from "@/components/ui/CustomScrollbar";
import {
  Satellite,
  Shield,
  BarChart3,
  CloudRain,
  Smartphone,
  Zap,
  TrendingUp,
  Globe,
  Camera,
  MapPin,
  FileText,
  Users,
  ChevronDown,
  ChevronUp
} from "lucide-react";

const services = [
  {
    icon: Satellite,
    title: "Satellite Monitoring",
    description: "Real-time satellite imagery analysis for comprehensive farm monitoring and crop health assessment.",
    features: ["Real-time crop health monitoring", "NDVI analysis", "Multi-spectral imaging", "Automated alerts"]
  },
  {
    icon: Shield,
    title: "AI-Powered Risk Assessment",
    description: "Advanced machine learning algorithms analyze weather patterns and historical data to assess agricultural risks.",
    features: ["Weather pattern analysis", "Historical data insights", "Predictive risk modeling", "Automated risk scoring"]
  },
  {
    icon: BarChart3,
    title: "Automated Claims Processing",
    description: "Streamlined claims processing with AI-driven damage assessment and fast payout recommendations.",
    features: ["AI damage assessment", "Fast claim processing", "Automated verification", "Quick payouts"]
  },
  {
    icon: CloudRain,
    title: "Weather Intelligence",
    description: "Accurate weather forecasts and historical data to help farmers make informed decisions.",
    features: ["7-day weather forecasts", "Historical weather data", "Extreme weather alerts", "Climate trend analysis"]
  },
  {
    icon: Camera,
    title: "Drone Surveillance",
    description: "High-resolution aerial imagery captured by drones for detailed field inspection and damage assessment.",
    features: ["High-resolution imaging", "On-demand field inspection", "Precise damage mapping", "Detailed crop analysis"]
  },
  {
    icon: Smartphone,
    title: "Mobile-First Platform",
    description: "Access your farm data, submit claims, and receive alerts anywhere through our mobile application.",
    features: ["Mobile app access", "Offline capabilities", "Push notifications", "Easy claim submission"]
  },
  {
    icon: Zap,
    title: "Real-Time Alerts",
    description: "Get instant notifications about weather threats, crop stress, and important updates for your farms.",
    features: ["Weather threat alerts", "Crop stress notifications", "Policy updates", "Customizable alerts"]
  },
  {
    icon: TrendingUp,
    title: "Data Analytics",
    description: "Comprehensive analytics and insights to optimize farming operations and maximize yields.",
    features: ["Performance analytics", "Yield optimization", "Trend analysis", "Custom reports"]
  },
  {
    icon: Globe,
    title: "Multi-Location Support",
    description: "Manage multiple farms across different locations from a single unified dashboard.",
    features: ["Multi-farm management", "Centralized dashboard", "Location-based insights", "Bulk operations"]
  },
  {
    icon: MapPin,
    title: "GPS Field Mapping",
    description: "Precise GPS-based field mapping and boundary definition for accurate coverage and monitoring.",
    features: ["GPS field boundaries", "Area calculation", "Field mapping tools", "Boundary verification"]
  },
  {
    icon: FileText,
    title: "Policy Management",
    description: "Comprehensive policy management system with easy enrollment, renewal, and claims tracking.",
    features: ["Easy enrollment", "Policy renewal", "Claims tracking", "Document management"]
  },
  {
    icon: Users,
    title: "Farmer Support",
    description: "Dedicated support team and resources to help farmers navigate the insurance process.",
    features: ["24/7 support", "Training resources", "Community forums", "Expert guidance"]
  }
];

export default function Services() {
  const [showAll, setShowAll] = useState(false);
  const visibleServices = showAll ? services : services.slice(0, 3);
  
  return (
    <CustomScrollbar>
      <div 
        className="bg-white relative min-h-screen"
        style={{
          backgroundImage: 'url(/bg_img.png)',
          backgroundAttachment: 'fixed',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <HomeNavbar />
        
        {/* Hero Section */}
        <section className="relative w-full overflow-hidden">
          <div className="relative w-full min-h-[35vh] md:min-h-[40vh] flex flex-col">
            {/* Background Image */}
            <div className="absolute inset-0">
              <img 
                src="/service.png" 
                alt="Services background" 
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-black/40"></div>

            {/* Content */}
            <div className="relative z-10 flex-1 flex items-center justify-center py-8 md:py-12">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center px-4 sm:px-6 lg:px-8 max-w-4xl"
              >
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-white mb-3"
                >
                  Our Services
                </motion.h1>
                
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="text-base sm:text-lg md:text-xl text-white/90 leading-relaxed"
                >
                  Comprehensive agricultural insurance solutions powered by cutting-edge technology
                </motion.p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Services Grid */}
        <section className="relative w-full py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12 md:mb-16"
            >
              <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-[rgba(20,40,75,1)] mb-3">
                What We Offer
              </h2>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed max-w-3xl mx-auto">
                Discover our comprehensive suite of services designed to protect and empower farmers through innovative technology
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {visibleServices.map((service, index) => {
                const Icon = service.icon;
                return (
                  <motion.div
                    key={service.title}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    className="bg-white p-6 md:p-8 border border-gray-200 shadow-sm h-full flex flex-col"
                  >
                    {/* Icon and Title */}
                    <div className="flex items-center gap-3 mb-3">
                      <Icon className="h-8 w-8 md:h-10 md:w-10 text-[rgba(20,40,75,1)] flex-shrink-0" />
                      <h3 className="text-lg md:text-xl font-bold text-gray-700">
                        {service.title}
                      </h3>
                    </div>

                    {/* Description */}
                    <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-4 flex-1">
                      {service.description}
                    </p>

                    {/* Features List */}
                    <ul className="space-y-2">
                      {service.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-[rgba(20,40,75,1)] mt-1">•</span>
                          <span className="text-xs md:text-sm text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                );
              })}
            </div>
            
            {services.length > 3 && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="flex items-center gap-2 px-6 py-3 bg-[rgba(20,40,75,1)] text-white rounded-lg hover:bg-[rgba(15,30,56,1)] transition-colors font-medium"
                >
                  {showAll ? (
                    <>
                      Show Less
                      <ChevronUp className="h-5 w-5" />
                    </>
                  ) : (
                    <>
                      Show More Services ({services.length - 3} more)
                      <ChevronDown className="h-5 w-5" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </section>

        <div className="relative z-10">
          <FooterSection />
        </div>
      </div>
    </CustomScrollbar>
  );
}
