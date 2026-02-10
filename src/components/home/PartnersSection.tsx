import { LogoLoop } from '@/components/ui/LogoLoop';
import { useRef } from 'react';
import VariableProximity from '@/components/ui/VariableProximity';
import { motion } from 'framer-motion';

const PartnersSection = () => {
  const containerRef = useRef(null);

  // Partner logos - you can replace these with actual partner logos
  const partnerLogos = [
    { 
      src: "/logos/microsoft.svg", 
      alt: "Microsoft", 
      title: "Microsoft",
      href: "https://microsoft.com" 
    },
    { 
      src: "/logos/google.svg", 
      alt: "Google", 
      title: "Google",
      href: "https://google.com" 
    },
    { 
      src: "/logos/aws.svg", 
      alt: "Amazon Web Services", 
      title: "AWS",
      href: "https://aws.amazon.com" 
    },
    { 
      src: "/logos/ibm.svg", 
      alt: "IBM", 
      title: "IBM",
      href: "https://ibm.com" 
    },
    { 
      src: "/logos/oracle.svg", 
      alt: "Oracle", 
      title: "Oracle",
      href: "https://oracle.com" 
    },
    { 
      src: "/logos/salesforce.svg", 
      alt: "Salesforce", 
      title: "Salesforce",
      href: "https://salesforce.com" 
    },
    { 
      src: "/logos/adobe.svg", 
      alt: "Adobe", 
      title: "Adobe",
      href: "https://adobe.com" 
    },
    { 
      src: "/logos/intel.svg", 
      alt: "Intel", 
      title: "Intel",
      href: "https://intel.com" 
    }
  ];

  return (
    <section className="relative py-16 sm:py-20 lg:py-24" ref={containerRef}>
      {/* Background decorations */}
      <div className="absolute inset-0 opacity-70 flex items-center justify-center">
        <img
          src="/lines.png"
          alt="Grid lines"
          className="w-3/4 h-3/4 object-contain"
        />
      </div>

      <div className="absolute bottom-0 left-0 opacity-60">
        <img
          src="/lines2.png"
          alt="Bottom left lines"
          className="w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 xl:w-[32rem] xl:h-[32rem]"
        />
      </div>
      <div className="absolute bottom-0 right-0 opacity-60">
        <img
          src="/lines2.png"
          alt="Bottom right lines"
          className="w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 xl:w-[32rem] xl:h-[32rem]"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center" style={{ position: 'relative' }}>
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center space-x-2 bg-green-50 border border-green-200 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full mb-4 sm:mb-6">
            <span className="text-gray-700 text-xs sm:text-sm font-medium">Trusted Partners</span>
          </div>
        </motion.div>        

        {/* Logo Loop */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-6xl mx-auto"
        >
          <div style={{ height: '120px', position: 'relative', overflow: 'hidden' }}>
            <LogoLoop
              logos={partnerLogos}
              speed={80}
              direction="left"
              logoHeight={48}
              gap={48}
              pauseOnHover
              scaleOnHover
              fadeOut
              fadeOutColor="#1a1a1a"
              ariaLabel="Technology partners"
            />
          </div>
        </motion.div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <VariableProximity
            label="Join 500+ companies already using STARHAWK"
            fromFontVariationSettings="'wght' 400, 'opsz' 14"
            toFontVariationSettings="'wght' 600, 'opsz' 15"
            containerRef={containerRef}
            radius={50}
            falloff="linear"
            className="text-sm sm:text-base text-gray-600 mt-8 sm:mt-12 cursor-pointer"
          />
        </motion.div>
      </div>
    </section>
  );
};

export default PartnersSection;
