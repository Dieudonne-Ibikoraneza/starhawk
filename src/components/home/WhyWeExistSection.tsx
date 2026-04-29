import { motion } from "framer-motion";
import { Target, Heart, Globe2, CheckCircle2 } from "lucide-react";

const pillars = [
  {
    icon: Target,
    title: "Our Mission",
    description:
      "To protect and empower farmers through innovative technology, ensuring food security and sustainable agricultural practices across communities.",
    points: ["AI-driven risk models", "Real-time crop health tracking", "Rapid claims resolution"],
  },
  {
    icon: Heart,
    title: "Our Impact",
    description:
      "Supporting thousands of farmers with comprehensive insurance coverage, real-time monitoring, and rapid claims processing to safeguard their livelihoods.",
    points: ["5 000+ farms enrolled", "98% claim success rate", "15+ districts covered"],
  },
  {
    icon: Globe2,
    title: "Our Vision",
    description:
      "Creating a resilient agricultural ecosystem where every farmer has access to affordable, reliable insurance and data-driven insights for better decision-making.",
    points: ["National scaling by 2026", "Climate-adaptive policies", "Open data partnerships"],
  },
];

export function WhyWeExistSection() {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50/0 via-slate-50/60 to-slate-50/0 pointer-events-none" />
      {/* Satellite SVG decoration */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2 opacity-[0.06] pointer-events-none select-none">
        <img
          src="/satelite.svg"
          alt=""
          className="w-[500px] md:w-[700px] xl:w-[900px] scale-x-[-1]"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-14 md:mb-18"
        >
          <span className="inline-block text-[#14284B]/60 text-xs font-semibold tracking-[0.18em] uppercase mb-3">
            Why We Exist
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#14284B] leading-tight max-w-xl">
            Built for farmers,<br />
            <span className="text-[#14284B]/50">driven by data.</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
            We are committed to transforming agricultural insurance through technology,
            providing farmers with the protection and tools they need to thrive in an
            ever-changing world.
          </p>
        </motion.div>

        {/* Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {pillars.map((pillar, index) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: index * 0.12 }}
                className="group relative"
              >
                <div className="h-full bg-white rounded-2xl border border-[#14284B]/8 shadow-[0_4px_24px_rgba(20,40,75,0.07)] p-8 hover:shadow-[0_8px_40px_rgba(20,40,75,0.14)] hover:-translate-y-1 transition-all duration-300 flex flex-col">
                  {/* Icon badge */}
                  <div className="w-14 h-14 rounded-2xl bg-[#14284B] flex items-center justify-center mb-6 shadow-[0_4px_14px_rgba(20,40,75,0.3)]">
                    <Icon className="h-7 w-7 text-white" />
                  </div>

                  <h3 className="text-lg font-bold text-[#14284B] mb-3">
                    {pillar.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-6 flex-1">
                    {pillar.description}
                  </p>

                  {/* Bullet points */}
                  <ul className="space-y-2">
                    {pillar.points.map((pt) => (
                      <li key={pt} className="flex items-center gap-2.5">
                        <CheckCircle2 className="h-4 w-4 text-[#14284B]/60 flex-shrink-0" />
                        <span className="text-xs text-slate-600 font-medium">{pt}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Bottom accent line */}
                  <div className="mt-6 h-[2px] bg-gradient-to-r from-[#14284B] to-[#14284B]/0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
