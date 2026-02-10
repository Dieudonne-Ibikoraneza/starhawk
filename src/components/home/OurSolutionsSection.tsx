import { motion } from "framer-motion";

export function OurSolutionsSection() {
  return (
    <section className="relative w-full py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Image Container with Overlay Text */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative w-full"
        >
          {/* Image */}
          <img 
            src="/drone1.jpg" 
            alt="Our Solutions" 
            className="w-full h-auto object-cover rounded"
          />
          
          {/* Dark Overlay for text contrast */}
          <div className="absolute inset-0 bg-black/30 rounded"></div>

          {/* Text Content - Top Left */}
          <div className="absolute top-6 left-6 md:top-8 md:left-8 lg:top-12 lg:left-12 z-10">
            {/* Heading */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl sm:text-2xl md:text-3xl font-semibold text-white mb-3"
            >
              Our Solutions
            </motion.h2>
            
            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-sm sm:text-base text-white/90 leading-relaxed max-w-md md:max-w-lg"
            >
              Comprehensive agricultural insurance solutions designed to protect and empower farmers worldwide
            </motion.p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

