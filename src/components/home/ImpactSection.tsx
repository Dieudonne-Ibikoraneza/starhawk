import { motion } from "framer-motion";

export function ImpactSection() {
  return (
    <section className="relative w-full py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Left Side - Map Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex justify-center lg:justify-start order-2 lg:order-1"
          >
            <div className="w-full max-w-md">
              <img 
                src="/rwanda.png" 
                alt="Rwanda Map - Our Impact" 
                className="w-full h-auto object-contain"
              />
            </div>
          </motion.div>

          {/* Right Side - Journey Paragraph */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="order-1 lg:order-2"
          >
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-700 mb-4 text-left"
            >
              Our Impact Journey
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base sm:text-lg text-gray-700 leading-relaxed text-left max-w-2xl"
            >
              The platform enables seamless farmer enrollment by capturing detailed farm data to establish insurance coverage, followed by AI-driven risk assessment using satellite imagery and weather data. Farms are continuously monitored in real time to track crop health and generate early alerts, while automated damage assessment ensures fast and accurate claims processing. Rapid payout distribution supports farmer recovery after losses, and comprehensive data analytics provide valuable insights for improved planning, risk management, and policy decision-making.
            </motion.p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

