import { motion } from "framer-motion";
import { 
  Satellite, 
  Shield, 
  BarChart3
} from "lucide-react";

const features = [
  {
    icon: Satellite,
    title: "Satellite Monitoring",
    description: "Real-time satellite imagery analysis for comprehensive farm monitoring and crop health assessment."
  },
  {
    icon: Shield,
    title: "AI-Powered Risk Assessment",
    description: "Advanced machine learning algorithms analyze weather patterns, crop health, and historical data to assess risks."
  },
  {
    icon: BarChart3,
    title: "Automated Claims Processing",
    description: "Streamlined claims processing with AI-driven damage assessment and fast payout recommendations."
  }
];

export function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden">
      {/* Hero Section */}
      <div className="relative w-full min-h-[70vh] md:min-h-[80vh] flex flex-col pb-20 md:pb-32 lg:pb-40">
        {/* Background Image - Full width aerial drone photo */}
        <div className="absolute inset-0">
          <img 
            src="/intro.webp" 
            alt="Hero background" 
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Color Overlay to mask green and provide text contrast */}
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(20, 40, 75, 0.6)' }}></div>

        {/* Content Container - Top-left aligned */}
        <div className="relative z-10 flex-1 flex flex-col">
          {/* Top Section - STARHAWK Text */}
          <div className="flex-1 flex items-start justify-start px-16 sm:px-20 md:px-28 lg:px-36 xl:px-44 pt-16 md:pt-20 lg:pt-24">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-left"
            >
              {/* Large Bold Heading */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-3 tracking-tight"
                style={{ fontFamily: 'AvenirLTStd-Black, sans-serif' }}
              >
                STARHAWK
              </motion.h1>
              
              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-base sm:text-lg md:text-xl lg:text-2xl text-white font-normal leading-relaxed"
              >
                AI-Powered Agricultural Insurance Platform
              </motion.p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Feature Cards Section - Partially overlapping hero */}
      <div className="relative -mt-20 md:-mt-24 lg:-mt-32 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group relative"
                >
                  <div className="h-full bg-white border-r-2 border-b-2 border-l-2 border-r-gray-100 border-b-gray-100 border-l-gray-100 border-dotted p-8 md:p-10 relative overflow-hidden">
                    {/* Top Border Decoration */}
                    <div className="absolute top-0 left-0 right-0 h-2 overflow-hidden">
                      <img 
                        src="/title.png" 
                        alt="Border decoration" 
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                    
                    {/* Icon and Title - Same Line */}
                    <div className="flex items-center gap-3 mb-3 mt-2">
                      <Icon className="h-8 w-8 md:h-10 md:w-10 text-gray-700 flex-shrink-0" />
                      <h3 className="text-lg md:text-xl font-bold text-gray-900">
                        {feature.title}
                      </h3>
                    </div>
                    <p className="text-base md:text-lg text-gray-600 leading-relaxed">
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
