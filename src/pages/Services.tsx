import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  ChevronUp,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const services = [
  {
    icon: Satellite,
    title: "Satellite Monitoring",
    description:
      "Real-time satellite imagery analysis for comprehensive farm monitoring and crop health assessment.",
    features: [
      "Real-time crop health monitoring",
      "NDVI analysis",
      "Multi-spectral imaging",
      "Automated alerts",
    ],
    color: "from-blue-50 to-indigo-50",
    accent: "bg-blue-600",
  },
  {
    icon: Shield,
    title: "AI-Powered Risk Assessment",
    description:
      "Advanced machine learning algorithms analyze weather patterns and historical data to assess agricultural risks.",
    features: [
      "Weather pattern analysis",
      "Historical data insights",
      "Predictive risk modeling",
      "Automated risk scoring",
    ],
    color: "from-slate-50 to-blue-50",
    accent: "bg-[#14284B]",
  },
  {
    icon: BarChart3,
    title: "Automated Claims Processing",
    description:
      "Streamlined claims processing with AI-driven damage assessment and fast payout recommendations.",
    features: [
      "AI damage assessment",
      "Fast claim processing",
      "Automated verification",
      "Quick payouts",
    ],
    color: "from-emerald-50 to-teal-50",
    accent: "bg-emerald-600",
  },
  {
    icon: CloudRain,
    title: "Weather Intelligence",
    description:
      "Accurate weather forecasts and historical data to help farmers make informed decisions.",
    features: [
      "7-day weather forecasts",
      "Historical weather data",
      "Extreme weather alerts",
      "Climate trend analysis",
    ],
    color: "from-sky-50 to-cyan-50",
    accent: "bg-sky-600",
  },
  {
    icon: Camera,
    title: "Drone Surveillance",
    description:
      "High-resolution aerial imagery captured by drones for detailed field inspection and damage assessment.",
    features: [
      "High-resolution imaging",
      "On-demand field inspection",
      "Precise damage mapping",
      "Detailed crop analysis",
    ],
    color: "from-violet-50 to-purple-50",
    accent: "bg-violet-600",
  },
  {
    icon: Smartphone,
    title: "Mobile-First Platform",
    description:
      "Access your farm data, submit claims, and receive alerts anywhere through our mobile application.",
    features: [
      "Mobile app access",
      "Offline capabilities",
      "Push notifications",
      "Easy claim submission",
    ],
    color: "from-orange-50 to-amber-50",
    accent: "bg-orange-500",
  },
  {
    icon: Zap,
    title: "Real-Time Alerts",
    description:
      "Get instant notifications about weather threats, crop stress, and important updates for your farms.",
    features: [
      "Weather threat alerts",
      "Crop stress notifications",
      "Policy updates",
      "Customizable alerts",
    ],
    color: "from-yellow-50 to-amber-50",
    accent: "bg-yellow-500",
  },
  {
    icon: TrendingUp,
    title: "Data Analytics",
    description:
      "Comprehensive analytics and insights to optimize farming operations and maximize yields.",
    features: [
      "Performance analytics",
      "Yield optimization",
      "Trend analysis",
      "Custom reports",
    ],
    color: "from-teal-50 to-emerald-50",
    accent: "bg-teal-600",
  },
  {
    icon: Globe,
    title: "Multi-Location Support",
    description:
      "Manage multiple farms across different locations from a single unified dashboard.",
    features: [
      "Multi-farm management",
      "Centralized dashboard",
      "Location-based insights",
      "Bulk operations",
    ],
    color: "from-indigo-50 to-violet-50",
    accent: "bg-indigo-600",
  },
  {
    icon: MapPin,
    title: "GPS Field Mapping",
    description:
      "Precise GPS-based field mapping and boundary definition for accurate coverage and monitoring.",
    features: [
      "GPS field boundaries",
      "Area calculation",
      "Field mapping tools",
      "Boundary verification",
    ],
    color: "from-red-50 to-rose-50",
    accent: "bg-rose-600",
  },
  {
    icon: FileText,
    title: "Policy Management",
    description:
      "Comprehensive policy management system with easy enrollment, renewal, and claims tracking.",
    features: [
      "Easy enrollment",
      "Policy renewal",
      "Claims tracking",
      "Document management",
    ],
    color: "from-slate-50 to-gray-100",
    accent: "bg-slate-700",
  },
  {
    icon: Users,
    title: "Farmer Support",
    description:
      "Dedicated support team and resources to help farmers navigate the insurance process.",
    features: [
      "24/7 support",
      "Training resources",
      "Community forums",
      "Expert guidance",
    ],
    color: "from-green-50 to-emerald-50",
    accent: "bg-green-600",
  },
];

export default function Services() {
  const [showAll, setShowAll] = useState(false);
  const visibleServices = showAll ? services : services.slice(0, 6);

  return (
    <CustomScrollbar>
      <div className="bg-[#f8f9fc] relative min-h-screen">
        <HomeNavbar />

        {/* ── Hero Banner ── */}
        <section className="relative w-full overflow-hidden">
          <div className="relative w-full min-h-[52vh] flex flex-col">
            <div className="absolute inset-0">
              <img
                src="/service.png"
                alt="Services hero"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-[#14284B]/88 via-[#14284B]/70 to-[#0a1628]/80" />
              <div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
                  backgroundSize: "60px 60px",
                }}
              />
            </div>

            <div className="relative z-10 flex-1 flex items-center justify-center py-16 pt-32">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65 }}
                className="text-center px-6 max-w-3xl"
              >
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="inline-block text-white/50 text-xs font-semibold tracking-[0.18em] uppercase mb-4"
                >
                  What We Offer
                </motion.span>
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.15 }}
                  className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4 leading-tight"
                >
                  Our Services
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.28 }}
                  className="text-base sm:text-lg text-white/70 leading-relaxed"
                >
                  Comprehensive agricultural insurance solutions powered by cutting-edge technology
                  — protecting farmers every step of the way.
                </motion.p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── Services Grid ── */}
        <section className="relative w-full py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
            {/* Section header */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12 md:mb-16"
            >
              <span className="inline-block text-[#14284B]/50 text-xs font-semibold tracking-[0.18em] uppercase mb-3">
                Powered by AI
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-[#14284B] mb-4">
                Everything you need to protect your farm
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
                From real-time satellite monitoring to automated claims — our end-to-end platform
                empowers farmers with the tools to grow with confidence.
              </p>
            </motion.div>

            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence initial={false}>
                {visibleServices.map((service, index) => {
                  const Icon = service.icon;
                  return (
                    <motion.div
                      key={service.title}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.45, delay: (index % 6) * 0.07 }}
                      className="group"
                    >
                      <div
                        className={`h-full bg-gradient-to-br ${service.color} rounded-2xl border border-[#14284B]/8 shadow-[0_2px_16px_rgba(20,40,75,0.07)] hover:shadow-[0_8px_36px_rgba(20,40,75,0.14)] hover:-translate-y-1 transition-all duration-300 p-6 md:p-7 flex flex-col overflow-hidden relative`}
                      >
                        {/* Top accent stripe */}
                        <div className={`absolute top-0 left-0 right-0 h-[3px] ${service.accent} opacity-60`} />

                        {/* Icon */}
                        <div
                          className={`w-12 h-12 rounded-xl ${service.accent} bg-opacity-10 flex items-center justify-center mb-5 shadow-sm`}
                          style={{ backgroundColor: "rgba(20,40,75,0.08)" }}
                        >
                          <Icon className="h-6 w-6 text-[#14284B]" />
                        </div>

                        <h3 className="text-base font-bold text-[#14284B] mb-2">
                          {service.title}
                        </h3>
                        <p className="text-sm text-slate-600 leading-relaxed mb-5 flex-1">
                          {service.description}
                        </p>

                        {/* Feature pills */}
                        <ul className="space-y-2">
                          {service.features.map((feature) => (
                            <li key={feature} className="flex items-center gap-2">
                              <CheckCircle2 className="h-3.5 w-3.5 text-[#14284B]/50 flex-shrink-0" />
                              <span className="text-xs text-slate-600 font-medium">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Show more/less */}
            {services.length > 6 && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="flex items-center gap-2 px-8 py-3.5 bg-[#14284B] text-white text-sm font-bold rounded-full hover:bg-[#0f1e38] transition-all duration-300 shadow-[0_4px_20px_rgba(20,40,75,0.3)] hover:shadow-[0_6px_28px_rgba(20,40,75,0.4)] hover:-translate-y-0.5"
                >
                  {showAll ? (
                    <>Show Less <ChevronUp className="h-4 w-4" /></>
                  ) : (
                    <>Show All Services ({services.length - 6} more) <ChevronDown className="h-4 w-4" /></>
                  )}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ── CTA Banner ── */}
        <section className="py-16 md:py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65 }}
              className="relative bg-[#14284B] rounded-3xl p-10 md:p-14 text-center overflow-hidden shadow-[0_20px_60px_rgba(20,40,75,0.3)]"
            >
              {/* Pattern */}
              <div
                className="absolute inset-0 opacity-[0.05] rounded-3xl"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
                  backgroundSize: "40px 40px",
                }}
              />
              <div className="relative z-10">
                <span className="inline-block text-white/40 text-xs font-semibold tracking-[0.18em] uppercase mb-4">
                  Ready to Start?
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
                  Protect your farm today
                </h2>
                <p className="text-white/60 text-sm sm:text-base mb-8 max-w-xl mx-auto leading-relaxed">
                  Join thousands of farmers already using STARHAWK to safeguard their crops and livelihoods.
                </p>
                <a
                  href="/role-selection"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-[#14284B] font-bold text-sm rounded-full hover:bg-white/90 transition-all duration-300 shadow-lg"
                >
                  Get Started Now
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        <FooterSection />
      </div>
    </CustomScrollbar>
  );
}
