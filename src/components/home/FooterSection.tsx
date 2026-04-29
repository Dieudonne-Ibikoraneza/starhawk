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
    <footer className="relative bg-[#14284B] overflow-hidden">
      {/* Background subtle pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
        {/* Upper footer */}
        <div className="py-14 grid grid-cols-1 md:grid-cols-3 gap-10 border-b border-white/10">
          {/* Brand column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Link to="/" className="flex items-center gap-3 mb-5 group w-fit">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center group-hover:bg-white/25 transition-colors">
                <Satellite className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-black text-white tracking-tight">STARHAWK</span>
            </Link>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs">
              AI-Powered Agricultural Insurance Platform protecting farmers across Africa with
              satellite intelligence and real-time analytics.
            </p>
            {/* Socials */}
            <div className="flex gap-3 mt-6">
              {socials.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 hover:text-white transition-all duration-200"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </motion.div>

          {/* Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h3 className="text-white font-bold text-sm tracking-widest uppercase mb-5">
              Navigation
            </h3>
            <ul className="space-y-3">
              {footerLinks.map(({ label, to }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="flex items-center gap-2 text-white/50 hover:text-white text-sm font-medium transition-colors duration-200 group"
                  >
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-200" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact / CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="text-white font-bold text-sm tracking-widest uppercase mb-5">
              Contact
            </h3>
            <p className="text-white/50 text-sm mb-2">info@starhawk.rw</p>
            <p className="text-white/50 text-sm mb-6">Kigali, Rwanda</p>
            <Link
              to="/role-selection"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-[#14284B] font-bold text-xs rounded-full hover:bg-white/90 transition-colors shadow-[0_4px_14px_rgba(0,0,0,0.25)]"
            >
              Get Started
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </motion.div>
        </div>

        {/* Bottom strip */}
        <div className="py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/30 text-xs">
            © {new Date().getFullYear()} STARHAWK. All rights reserved.
          </p>
          <p className="text-white/20 text-xs">
            AI-Powered Agricultural Insurance Platform
          </p>
        </div>
      </div>
    </footer>
  );
}
