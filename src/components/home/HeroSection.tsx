import { motion } from "framer-motion";
import { Satellite, Shield, BarChart3, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const features = [
  {
    icon: Satellite,
    title: "Satellite Monitoring",
    description:
      "Real-time satellite imagery analysis for comprehensive farm monitoring and crop health assessment.",
    stat: "99.7%",
    statLabel: "Coverage Accuracy",
  },
  {
    icon: Shield,
    title: "AI Risk Assessment",
    description:
      "Advanced machine learning algorithms analyze weather patterns, crop health, and historical data.",
    stat: "< 24h",
    statLabel: "Assessment Time",
  },
  {
    icon: BarChart3,
    title: "Claims Processing",
    description:
      "Streamlined AI-driven damage assessment with fast payout recommendations for farmers.",
    stat: "3x",
    statLabel: "Faster Payouts",
  },
];

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative w-full overflow-hidden">
      {/* ── Hero Banner ── */}
      <div className="relative w-full min-h-[88vh] flex flex-col">
        {/* Background */}
        <div className="absolute inset-0">
          <motion.img
            src="/intro.webp"
            alt="STARHAWK hero — AI-powered farmland monitoring"
            className="w-full h-full object-cover origin-center"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          />
          {/* Gradient overlay — navy tint bottom */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#14284B]/80 via-[#14284B]/60 to-[#0a1628]/75" />
          {/* Subtle grid texture */}
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-6 sm:px-10 md:px-16 lg:px-24 xl:px-32 pt-28 pb-32 md:pb-40">
          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight mb-6"
            style={{ fontFamily: "AvenirLTStd-Black, sans-serif" }}
          >
            Fast, Data-Backed{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#a8c4e0] to-[#e2eaf5]">
              Crop Insurance Assessments.
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-lg sm:text-xl md:text-2xl text-white/80 font-light leading-relaxed max-w-2xl mb-10"
          >
            Replace slow, expensive manual field inspections with high-resolution aerial insights. Starhawk delivers insurance-ready risk and loss reports using geospatial AI.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.38 }}
            className="flex flex-wrap gap-4"
          >
            <button
              onClick={() => navigate("/role-selection")}
              className="flex items-center gap-2 px-8 py-3.5 bg-white text-[#14284B] font-bold text-sm rounded-full shadow-[0_6px_24px_rgba(255,255,255,0.25)] hover:shadow-[0_8px_30px_rgba(255,255,255,0.35)] hover:-translate-y-0.5 transition-all duration-300"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigate("/services")}
              className="flex items-center gap-2 px-8 py-3.5 border-2 border-white/30 text-white font-semibold text-sm rounded-full backdrop-blur-sm hover:border-white/60 hover:bg-white/10 transition-all duration-300"
            >
              Explore Services
            </button>
          </motion.div>

        </div>
      </div>

      {/* ── Feature Cards — Overlap ── */}
      <div className="relative -mt-24 md:-mt-28 z-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.55, delay: index * 0.12 }}
                  className="group"
                >
                  <div className="h-full bg-white rounded-2xl shadow-[0_8px_40px_rgba(20,40,75,0.14)] border border-[#14284B]/8 p-7 md:p-8 flex flex-col hover:shadow-[0_12px_50px_rgba(20,40,75,0.2)] hover:-translate-y-1 transition-all duration-300">
                    {/* Top: icon + stat */}
                    <div className="flex items-start justify-between mb-5">
                      <div className="w-12 h-12 rounded-xl bg-[#14284B]/8 flex items-center justify-center group-hover:bg-[#14284B] transition-colors duration-300">
                        <Icon className="h-6 w-6 text-[#14284B] group-hover:text-white transition-colors duration-300" />
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-black text-[#14284B]">
                          {feature.stat}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          {feature.statLabel}
                        </div>
                      </div>
                    </div>
                    {/* Divider */}
                    <div className="w-8 h-[2px] bg-[#14284B]/20 rounded mb-4 group-hover:w-full transition-all duration-500" />
                    <h3 className="text-base font-bold text-[#14284B] mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed flex-1">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
