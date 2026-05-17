import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Satellite, Mail, Linkedin, Twitter, ArrowRight } from "lucide-react";

const footerLinks = [
  { label: "Home", to: "/" },
  { label: "Services", to: "/services" },
  { label: "Team", to: "/team" },
  { label: "Get Started", to: "/role-selection" },
];

const socials = [
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Mail, href: "mailto:info@starhawk.rw", label: "Email" },
];

export function FooterSection() {
  return (
    <footer className="relative bg-[#0a1628] overflow-hidden pt-16">
      {/* Top Emerald Accent Line */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#4ade80]/50 to-transparent" />

      {/* Decorative Glows */}
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[300px] bg-[#14284B]/40 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-10 right-1/4 w-[400px] h-[200px] bg-[#4ade80]/[0.02] blur-[100px] rounded-full pointer-events-none" />

      {/* Dynamic Edge Circular Accent (Moved from Stay In The Loop) */}
      <div className="absolute bottom-[-20%] -right-[15%] xl:-right-[5%] opacity-[0.08] pointer-events-none select-none z-0 mix-blend-screen overflow-hidden">
        <motion.img
          src="/circle.svg"
          alt=""
          className="w-[600px] h-[600px] lg:w-[900px] lg:h-[900px] max-w-none"
          animate={{ rotate: 360 }}
          transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16 pb-16 border-b border-white/5">
          
          {/* Brand Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="md:col-span-5 lg:col-span-4"
          >
            <Link to="/" className="flex items-center gap-3 mb-6 group w-fit">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4ade80] to-[#22c55e] flex items-center justify-center shadow-[0_4px_20px_rgba(74,222,128,0.25)] group-hover:shadow-[0_6px_25px_rgba(74,222,128,0.4)] transition-all duration-300">
                <Satellite className="h-5 w-5 text-[#0a1628]" />
              </div>
              <span className="text-2xl font-black text-white tracking-tight">STARHAWK</span>
            </Link>
            <p className="text-white/50 text-sm leading-relaxed mb-8 max-w-sm">
              Providing farmers across Africa with AI-powered insurance, satellite intelligence, and real-time agricultural analytics for sustainable growth.
            </p>
            {/* Socials */}
            <div className="flex gap-3">
              {socials.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white/50 hover:bg-[#14284B] hover:text-[#4ade80] hover:border-[#4ade80]/30 transition-all duration-300"
                >
                  <Icon className="h-[18px] w-[18px]" />
                </a>
              ))}
            </div>
          </motion.div>

          {/* Quick Links Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="md:col-span-3 lg:col-span-3 lg:col-start-7"
          >
            <h3 className="text-white font-semibold text-sm tracking-[0.15em] uppercase mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#4ade80] opacity-70" />
              Navigation
            </h3>
            <ul className="space-y-4">
              {footerLinks.map(({ label, to }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="flex items-center gap-2 text-white/50 hover:text-white text-sm font-medium transition-all duration-200 group w-fit"
                  >
                    {label}
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-[#4ade80] transition-all duration-300" />
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="md:col-span-4 lg:col-span-3"
          >
            <h3 className="text-white font-semibold text-sm tracking-[0.15em] uppercase mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#3b82f6] opacity-70" />
              Contact Us
            </h3>
            <div className="space-y-4 mb-8 text-sm cursor-default">
              <a href="mailto:info@starhawk.rw" className="flex items-center gap-3 text-white/50 hover:text-white transition-colors duration-200">
                <Mail className="w-4 h-4 text-white/30" />
                info@starhawk.rw
              </a>
              <div className="flex items-center gap-3 text-white/50">
                <Satellite className="w-4 h-4 text-white/30" />
                Kigali, Rwanda
              </div>
            </div>
            
            <Link
              to="/role-selection"
              className="group inline-flex items-center gap-2 px-6 py-3 bg-[#14284B] border border-[#14284B] hover:border-[#4ade80]/50 text-white font-bold text-xs tracking-wide rounded-full transition-all duration-300 shadow-lg hover:shadow-[0_4px_20px_rgba(74,222,128,0.15)] overflow-hidden relative"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              Start Your Journey
              <ArrowRight className="h-4 w-4 text-[#4ade80] group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

        </div>

        {/* Bottom Legal Strip */}
        <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-xs font-medium">
            © {new Date().getFullYear()} STARHAWK. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-xs font-medium text-white/30">
            <a href="#" className="hover:text-white transition-colors duration-200">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors duration-200">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
