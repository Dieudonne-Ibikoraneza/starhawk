import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import { useState } from "react";

export function ServiceHeroSection() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle newsletter subscription
    console.log("Subscribing:", email);
    setEmail("");
  };

  return (
    <section className="relative w-full overflow-hidden">
      {/* Newsletter Section */}
      <div className="relative w-full min-h-[40vh] md:min-h-[50vh] flex flex-col">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src="/service.png" 
            alt="Newsletter background" 
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Dark Overlay for text contrast */}
        <div className="absolute inset-0 bg-black/40"></div>

        {/* Content Container */}
        <div className="relative z-10 flex-1 flex items-center justify-center py-12 md:py-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center px-4 sm:px-6 lg:px-8 max-w-2xl w-full"
          >
            {/* Heading */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white mb-3"
            >
              Subscribe to Our Newsletter
            </motion.h2>
            
            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-sm sm:text-base text-white/90 mb-6 leading-relaxed"
            >
              Stay updated with the latest agricultural insurance insights, technology updates, and industry news.
            </motion.p>

            {/* Email Subscription Form */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <div className="flex-1 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-white/90 backdrop-blur-sm border border-white/20 rounded text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 text-white font-medium rounded transition-colors duration-200 whitespace-nowrap"
                style={{ backgroundColor: 'rgba(20, 40, 75, 1)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(15, 30, 56, 1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(20, 40, 75, 1)'}
              >
                Subscribe
              </button>
            </motion.form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

