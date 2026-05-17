import { motion } from "framer-motion";
import { Search, LineChart, FileWarning, ShieldCheck } from "lucide-react";

const services = [
  {
    icon: ShieldCheck,
    title: "Pre-season risk assessment",
  },
  {
    icon: LineChart,
    title: "Crop monitoring during growth",
  },
  {
    icon: FileWarning,
    title: "Post-event crop damage assessment",
  },
  {
    icon: Search,
    title: "Data-driven insurance claim processing",
  },
];

export function SatelliteDroneSection() {
  return (
    <section className="relative w-full py-20 md:py-28 overflow-hidden bg-[#fafbfc]">
      {/* subtle top divider */}
      <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-[#14284B]/15 to-transparent" />

      {/* Decorative background for mobile/tablet */}
      <div className="absolute top-1/2 right-[-20%] -translate-y-1/2 opacity-[0.04] xl:opacity-0 pointer-events-none w-[800px] max-w-none">
        <motion.img
          src="/satelite.svg"
          alt=""
          className="w-full h-auto scale-125"
          animate={{ y: [0, -25, 0], rotate: [0, 3, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Content Column */}
          <div className="xl:col-span-7 flex flex-col">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-12"
            >
              <span className="inline-block text-[#14284B]/60 text-xs font-semibold tracking-[0.18em] uppercase mb-4">
                Our Approach
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#14284B] leading-tight mb-6">
                Satellite & Drone-Powered Insurance
              </h2>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                Satellite & Drone-based crop insurance services use satellite and unmanned aerial vehicles (UAVs) equipped with advanced sensors to collect real-time agricultural data. Then, artificial intelligence (AI) analyzes this data to support the entire insurance lifecycle.
              </p>
            </motion.div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10 text-left">
              {services.map((service, index) => {
                const Icon = service.icon;
                return (
                  <motion.div
                    key={service.title}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="group relative bg-white p-6 rounded-2xl border border-[#14284B]/10 shadow-[0_4px_20px_rgba(20,40,75,0.03)] hover:shadow-[0_8px_30px_rgba(20,40,75,0.08)] hover:-translate-y-1 transition-all duration-300 flex items-start gap-4"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#14284B]/5 flex items-center justify-center group-hover:bg-[#14284B] transition-colors duration-300">
                      <Icon className="h-5 w-5 text-[#14284B] group-hover:text-white transition-colors duration-300" />
                    </div>
                    <h3 className="text-[15px] font-bold text-[#14284B] leading-snug pt-2">
                      {service.title}
                    </h3>
                  </motion.div>
                );
              })}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mr-auto w-fit"
            >
              <div className="inline-flex items-center gap-3 px-6 py-4 bg-[#14284B] text-white rounded-full shadow-[0_8px_24px_rgba(20,40,75,0.2)]">
                <span className="flex h-2 w-2 rounded-full bg-[#4ade80] animate-pulse" />
                <span className="font-semibold text-sm">
                  As a result, insurers improve accuracy & reduce manual work
                </span>
              </div>
            </motion.div>
          </div>

          {/* Visual Column */}
          <div className="hidden xl:flex xl:col-span-5 items-center justify-center relative h-[600px]">
             {/* Decorative Background Aura */}
             <div className="absolute inset-0 bg-gradient-to-br from-[#14284B]/10 via-[#14284B]/5 to-transparent rounded-full blur-[80px]" />
             
             {/* Animated Satellite */}
             <motion.img
               src="/satelite.svg"
               alt="Satellite Technology"
               className="relative z-10 w-[140%] max-w-[850px] scale-125 drop-shadow-2xl translate-x-8"
               animate={{ y: [0, -25, 0], rotate: [-2, 3, -2] }}
               transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
             />
          </div>

        </div>
      </div>
    </section>
  );
}
