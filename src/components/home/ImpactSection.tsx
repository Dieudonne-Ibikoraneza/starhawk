import { motion } from "framer-motion";
import { MapPin, TrendingUp, Layers, Clock } from "lucide-react";

const metrics = [
  { icon: MapPin,     value: "15+",    label: "Districts Covered",   desc: "Across Rwanda" },
  { icon: TrendingUp, value: "5,000+", label: "Farms Enrolled",      desc: "& growing fast" },
  { icon: Layers,     value: "98%",    label: "Claim Success Rate",  desc: "Industry leading" },
  { icon: Clock,      value: "< 24h",  label: "Assessment Speed",    desc: "AI-powered analysis" },
];

export function ImpactSection() {
  return (
    <section className="relative w-full py-20 md:py-28 overflow-hidden">
      {/* subtle top divider */}
      <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-[#14284B]/15 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          {/* ── Map visual ── */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="order-2 lg:order-1 flex justify-center lg:justify-start"
          >
            <div className="relative max-w-sm w-full">
              {/* Glow behind map */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#14284B]/10 to-transparent blur-2xl scale-110" />
              <div className="relative rounded-3xl bg-white/50 backdrop-blur-sm border border-[#14284B]/10 p-6 shadow-[0_8px_40px_rgba(20,40,75,0.1)]">
                <img
                  src="/rwanda.png"
                  alt="Rwanda — our operating territory"
                  className="w-full h-auto object-contain drop-shadow-lg"
                />
              </div>

              {/* Floating tag */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="absolute -bottom-4 -right-4 bg-[#14284B] text-white text-xs font-bold rounded-xl px-4 py-2.5 shadow-[0_4px_20px_rgba(20,40,75,0.35)]"
              >
                🛰 Live Monitoring
              </motion.div>
            </div>
          </motion.div>

          {/* ── Copy + metrics ── */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="order-1 lg:order-2"
          >
            <span className="inline-block text-[#14284B]/60 text-xs font-semibold tracking-[0.18em] uppercase mb-3">
              Our Impact Journey
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#14284B] leading-tight mb-5">
              Transforming<br />
              <span className="text-[#14284B]/50">African agriculture.</span>
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-10">
              The platform enables seamless farmer enrollment by capturing detailed farm data to establish
              insurance coverage, followed by AI-driven risk assessment using satellite imagery and
              weather data. Farms are continuously monitored in real time to track crop health and
              generate early alerts, while automated damage assessment ensures fast and accurate
              claims processing.
            </p>

            {/* Metrics grid */}
            <div className="grid grid-cols-2 gap-4">
              {metrics.map((m, i) => {
                const Icon = m.icon;
                return (
                  <motion.div
                    key={m.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: i * 0.08 }}
                    className="group bg-white rounded-xl border border-[#14284B]/8 p-4 shadow-[0_2px_12px_rgba(20,40,75,0.06)] hover:shadow-[0_6px_24px_rgba(20,40,75,0.12)] hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="h-4 w-4 text-[#14284B]/50" />
                      <span className="text-[11px] text-slate-500 font-medium">{m.desc}</span>
                    </div>
                    <div className="text-2xl font-black text-[#14284B]">{m.value}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{m.label}</div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
