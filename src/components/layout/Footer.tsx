import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Shield, 
  Phone, 
  Mail, 
  MapPin, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Instagram,
  ArrowRight,
  Globe,
  FileText,
  Users,
  Briefcase
} from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { name: "Home", href: "/" },
    { name: "Services", href: "/services" },
    { name: "Team", href: "/team" },
    { name: "Contact", href: "/contact" },
    { name: "File a Claim", href: "/claim" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" }
  ];

  const services = [
    { name: "Risk Assessment", href: "/services/risk-assessment" },
    { name: "Claims Processing", href: "/services/claims" },
    { name: "Crop Monitoring", href: "/services/monitoring" },
    { name: "Policy Management", href: "/services/policies" },
    { name: "Drone Surveillance", href: "/services/drone" },
    { name: "Satellite Analysis", href: "/services/satellite" }
  ];

  const platforms = [
    { name: "Insurer Portal", href: "/insurer", icon: Shield },
    { name: "Government Analytics", href: "/government", icon: Users },
    { name: "Assessor Tasks", href: "/assessor", icon: FileText },
    { name: "Admin Panel", href: "/admin", icon: Briefcase }
  ];

  const socialLinks = [
    { name: "Facebook", href: "#", icon: Facebook },
    { name: "Twitter", href: "#", icon: Twitter },
    { name: "LinkedIn", href: "#", icon: Linkedin },
    { name: "Instagram", href: "#", icon: Instagram }
  ];

  return (
    <footer className="border-t border-gray-100" style={{ backgroundColor: 'rgba(20, 40, 75, 1)' }}>
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Company Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(15, 30, 56, 1)' }}>
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-light text-white tracking-tight">STARHAWK</h3>
                <p className="text-sm text-white/70 font-light">AI Agricultural Insurance</p>
              </div>
            </div>
            <p className="text-sm text-white/80 leading-relaxed font-light">
              Revolutionizing agricultural insurance through cutting-edge AI technology, 
              real-time data analysis, and intelligent risk assessment for modern farming.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <Button
                    key={social.name}
                    variant="ghost"
                    size="sm"
                    className="text-white/60 hover:text-white hover:bg-white/10 rounded-full"
                    asChild
                  >
                    <a href={social.href} aria-label={social.name}>
                      <Icon className="h-5 w-5" />
                    </a>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h4 className="text-lg font-medium text-white">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-white/70 hover:text-white transition-colors font-light"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-6">
            <h4 className="text-lg font-medium text-white">Our Services</h4>
            <ul className="space-y-3">
              {services.map((service) => (
                <li key={service.name}>
                  <Link
                    to={service.href}
                    className="text-sm text-white/70 hover:text-white transition-colors font-light"
                  >
                    {service.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Platform Access & Newsletter */}
          <div className="space-y-6">
            <h4 className="text-lg font-medium text-white">Platform Access</h4>
            <div className="space-y-3">
              {platforms.map((platform) => {
                const Icon = platform.icon;
                return (
                  <Link
                    key={platform.name}
                    to={platform.href}
                    className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors font-light"
                  >
                    <Icon className="h-4 w-4" />
                    {platform.name}
                  </Link>
                );
              })}
            </div>

            <div className="pt-4">
              <h4 className="text-lg font-medium mb-3 text-white">Newsletter</h4>
              <p className="text-sm text-white/70 mb-4 font-light">
                Stay updated with the latest in agricultural insurance technology.
              </p>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-full"
                />
                <Button className="rounded-full" style={{ backgroundColor: 'rgba(20, 40, 75, 1)', color: 'white' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(15, 30, 56, 1)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(20, 40, 75, 1)'}>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Info Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid gap-6 md:grid-cols-3 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <Phone className="h-4 w-4 text-white/70" />
              <span className="text-sm text-white/70 font-light">+250 123 456 789</span>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-3">
              <Mail className="h-4 w-4 text-white/70" />
              <span className="text-sm text-white/70 font-light">info@starhawk.com</span>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-3">
              <MapPin className="h-4 w-4 text-white/70" />
              <span className="text-sm text-white/70 font-light">Kigali, Rwanda</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-white/70 font-light">
              © {currentYear} STARHAWK. All rights reserved. | AI Agricultural Insurance Platform
            </div>
            <div className="flex items-center gap-6 text-sm text-white/70">
              <Link to="/privacy" className="hover:text-white transition-colors font-light">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-white transition-colors font-light">
                Terms of Service
              </Link>
              <Link to="/cookies" className="hover:text-white transition-colors font-light">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
