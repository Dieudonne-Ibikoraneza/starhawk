import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowRight, Menu, X } from "lucide-react";

export function HomeNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-[0_2px_20px_rgba(20,40,75,0.12)] border-b border-[#14284B]/10"
          : "bg-white/80 backdrop-blur-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex items-center justify-between h-18 py-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src="/logo.png"
              alt="STARHAWK - Agricultural Insurance Platform"
              className="h-11 w-auto transition-opacity group-hover:opacity-85"
            />
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-1">
            {[
              { label: "Home", path: "/" },
              { label: "Services", path: "/services" },
              { label: "Team", path: "/team" },
            ].map(({ label, path }) => (
              <Link
                key={path}
                to={path}
                className={`relative px-5 py-2.5 text-[0.9rem] font-medium tracking-wide transition-colors duration-200 group ${
                  isActive(path)
                    ? "text-[#14284B]"
                    : "text-slate-600 hover:text-[#14284B]"
                }`}
              >
                {label}
                <span
                  className={`absolute bottom-1 left-5 right-5 h-[2px] bg-[#14284B] rounded-full transition-transform duration-300 origin-left ${
                    isActive(path) ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  }`}
                />
              </Link>
            ))}
          </div>

          {/* CTA Button */}
          <div className="hidden lg:flex items-center">
            <button
              onClick={() => navigate("/role-selection")}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#14284B] text-white text-sm font-semibold rounded-full hover:bg-[#0f1e38] transition-all duration-300 shadow-[0_4px_14px_rgba(20,40,75,0.3)] hover:shadow-[0_6px_20px_rgba(20,40,75,0.4)] hover:-translate-y-0.5"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden transition-all duration-300 overflow-hidden ${
          isMenuOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="bg-white border-t border-[#14284B]/10 px-6 py-4 space-y-1">
          {[
            { label: "Home", path: "/" },
            { label: "Services", path: "/services" },
            { label: "Team", path: "/team" },
          ].map(({ label, path }) => (
            <Link
              key={path}
              to={path}
              onClick={() => setIsMenuOpen(false)}
              className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive(path)
                  ? "bg-[#14284B]/5 text-[#14284B]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-[#14284B]"
              }`}
            >
              {label}
            </Link>
          ))}
          <div className="pt-2">
            <button
              onClick={() => {
                navigate("/role-selection");
                setIsMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#14284B] text-white text-sm font-semibold rounded-full shadow-md"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
