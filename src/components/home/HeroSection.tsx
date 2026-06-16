import { motion } from "framer-motion";
import { Satellite, Shield, BarChart3, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const features = [
  {
    icon: Satellite,
    title: "Satellite Monitoring",
    description:
      "Real-time satellite imagery for comprehensive farm monitoring and crop health assessment.",
    stat: "99.7%",
    statLabel: "Coverage Accuracy",
  },
  {
    icon: Shield,
    title: "AI Risk Assessment",
    description:
      "Machine learning algorithms analyze weather, crop health, and historical data in real-time.",
    stat: "< 24h",
    statLabel: "Assessment Time",
  },
  {
    icon: BarChart3,
    title: "Claims Processing",
    description:
      "AI-driven damage assessment with fast, accurate payout recommendations for farmers.",
    stat: "3x",
    statLabel: "Faster Payouts",
  },
];

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative w-full overflow-hidden">
      {/* ── Video Hero ── */}
      <div className="relative w-full min-h-[92vh] flex items-end">

        {/* Full-bleed video — 100% visible, no blur */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/MOISE.mp4" type="video/mp4" />
        </video>

        {/*
          Cinematic scrim strategy:
          - Bottom-to-top dark vignette so the bottom content area is legible
          - A very faint top fade so the navbar doesn't clash
          - NO left/right white blur — video stays 100% visible
        */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10 pointer-events-none" />

        {/* Content — anchored to the bottom-left, overlaid on the video */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 pb-16 md:pb-24 pt-40">
          {/* Small eyebrow label */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-xs font-bold tracking-[0.2em] uppercase text-white/60 mb-4"
          >
            AI-Powered Agricultural Insurance
          </motion.p>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight mb-5 max-w-4xl"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            Fast, Data-Backed{" "}
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, #93c5fd, #a5f3fc, #ffffff)",
              }}
            >
              Crop Insurance.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.22 }}
            className="text-base sm:text-lg md:text-xl text-white/75 font-light leading-relaxed max-w-2xl mb-10"
          >
            Replace slow manual field inspections with high-resolution satellite
            intelligence. Starhawk delivers insurance-ready risk and loss reports
            using geospatial AI.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.34 }}
            className="flex flex-wrap gap-4"
          >
            <button
              onClick={() => navigate("/role-selection")}
              className="group flex items-center gap-2 px-8 py-3.5 bg-white text-[#14284B] font-bold text-sm rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:shadow-[0_6px_28px_rgba(0,0,0,0.35)] hover:-translate-y-0.5 transition-all duration-300"
            >
              Get Started
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              onClick={() => navigate("/services")}
              className="flex items-center gap-2 px-8 py-3.5 border border-white/40 text-white font-semibold text-sm rounded-full backdrop-blur-sm hover:bg-white/10 hover:border-white/70 transition-all duration-300"
            >
              Explore Services
            </button>
          </motion.div>
        </div>
      </div>

      {/* ── Feature Cards ── */}
      <div className="relative z-20 bg-[#f8f9fc] px-4 sm:px-6 lg:px-8 pt-10 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 -mt-16">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 36 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group"
                >
                  <div className="h-full bg-white rounded-2xl shadow-[0_8px_40px_rgba(20,40,75,0.09)] border border-slate-100 p-7 md:p-8 flex flex-col hover:shadow-[0_14px_50px_rgba(20,40,75,0.15)] hover:-translate-y-1.5 transition-all duration-300">
                    <div className="flex items-start justify-between mb-5">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-[#14284B] transition-colors duration-300">
                        <Icon className="h-6 w-6 text-[#14284B] group-hover:text-white transition-colors duration-300" />
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-black text-[#14284B] tracking-tight">
                          {feature.stat}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          {feature.statLabel}
                        </div>
                      </div>
                    </div>
                    <div className="w-8 h-[2px] bg-[#14284B]/15 rounded mb-4 group-hover:w-full transition-all duration-500" />
                    <h3 className="text-base font-bold text-[#14284B] mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed flex-1">
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
