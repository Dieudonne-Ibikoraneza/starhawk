import { motion } from "framer-motion";
import { Target, Heart, Globe2 } from "lucide-react";

const values = [
  {
    icon: Target,
    title: "Our Mission",
    description: "To protect and empower farmers through innovative technology, ensuring food security and sustainable agricultural practices across communities."
  },
  {
    icon: Heart,
    title: "Our Impact",
    description: "Supporting thousands of farmers with comprehensive insurance coverage, real-time monitoring, and rapid claims processing to safeguard their livelihoods."
  },
  {
    icon: Globe2,
    title: "Our Vision",
    description: "Creating a resilient agricultural ecosystem where every farmer has access to affordable, reliable insurance and data-driven insights for better decision-making."
  }
];

export function WhyWeExistSection() {
  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      {/* Satellite SVG Decoration - Right */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2 opacity-20 pointer-events-none z-0">
        <img 
          src="/satelite.svg" 
          alt="Satellite decoration" 
          className="w-[600px] h-auto md:w-[800px] lg:w-[1000px] xl:w-[1200px] scale-x-[-1]"
        />
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-left mb-12 md:mb-16 max-w-3xl"
        >
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-700 mb-4">
            Why We Exist
          </h2>
          <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
            We are committed to transforming agricultural insurance through technology, 
            providing farmers with the protection and tools they need to thrive in an 
            ever-changing world.
          </p>
        </motion.div>

        {/* Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {values.map((value, index) => {
            const Icon = value.icon;
            return (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white p-8 md:p-10 border border-gray-200 shadow-sm"
              >
                {/* Icon and Title - Same Line, Title Right Aligned */}
                <div className="flex items-center justify-between mb-4">
                  <Icon className="h-8 w-8 md:h-10 md:w-10 text-gray-700 flex-shrink-0" />
                  <h3 className="text-lg md:text-xl font-bold text-gray-700 text-right flex-1">
                    {value.title}
                  </h3>
                </div>
                <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

