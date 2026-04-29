import { motion } from "framer-motion";
import { Mail, ArrowRight } from "lucide-react";
import { useState } from "react";

export function ServiceHeroSection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setEmail("");
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <section className="relative w-full overflow-hidden">
      <div className="relative w-full min-h-[50vh] flex flex-col">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="/service.png"
            alt="Subscribe background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#14284B]/90 via-[#14284B]/75 to-[#0a1628]/85" />
          {/* Grid texture */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 flex items-center justify-center py-16 md:py-20 px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65 }}
            className="text-center max-w-2xl w-full"
          >
            <span className="inline-block text-white/50 text-xs font-semibold tracking-[0.18em] uppercase mb-4">
              Stay In The Loop
            </span>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 leading-tight"
            >
              Get the Latest<br />
              <span className="text-white/60">AgriInsurance Insights</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="text-white/70 text-sm sm:text-base mb-8 leading-relaxed"
            >
              Technology updates, weather alerts, and industry news — delivered to your inbox.
            </motion.p>

            {/* Form */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.35 }}
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <div className="flex-1 relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full pl-11 pr-5 py-3.5 bg-white/95 text-[#14284B] placeholder-slate-400 text-sm font-medium rounded-full border-2 border-transparent focus:border-white focus:outline-none transition-all duration-200 shadow-lg"
                />
              </div>
              <button
                type="submit"
                className="flex items-center justify-center gap-2 px-7 py-3.5 bg-white text-[#14284B] font-bold text-sm rounded-full hover:bg-[#e8eef7] transition-all duration-300 shadow-lg whitespace-nowrap"
              >
                {submitted ? "✓ Subscribed!" : (
                  <>
                    Subscribe
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </motion.form>

            <p className="mt-4 text-white/40 text-xs">
              No spam. Unsubscribe anytime.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
