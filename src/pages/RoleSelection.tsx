import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ArrowLeft, Phone, Lock, LogIn, AlertCircle, CheckCircle2, Satellite, Wheat, Building2, MapPin, BarChart3, Settings } from "lucide-react";
import CustomScrollbar from "@/components/ui/CustomScrollbar";
import { useToast } from "@/hooks/use-toast";
import { farmerLogin, assessorLogin, insurerLogin, adminLogin } from "@/services/authAPI";
import { API_BASE_URL } from "@/config/api";

// ─────────────────────────────────────────────────────────────────
//  DEMO / OFFLINE CREDENTIALS
//  When the backend is unreachable these credentials bypass the
//  network call and navigate directly to the correct dashboard.
// ─────────────────────────────────────────────────────────────────
const DEMO_CREDENTIALS: Record<string, { password: string; role: string; name: string }> = {
  "0791998365": { password: "farmer@123", role: "FARMER",     name: "Demo Farmer" },
  "0781000001": { password: "insurer@123",role: "INSURER",    name: "Demo Insurer" },
  "0781000002": { password: "assess@123", role: "ASSESSOR",   name: "Demo Assessor" },
  "0781000003": { password: "gov@123",    role: "GOVERNMENT", name: "Demo Government" },
  "0781000004": { password: "admin@123",  role: "ADMIN",      name: "Demo Admin" },
};

const DEMO_CARD_LIST = [
  { icon: Wheat,     label: "Farmer",     phone: "0791998365", password: "farmer@123",  route: "/farmer-dashboard" },
  { icon: Building2, label: "Insurer",    phone: "0781000001", password: "insurer@123", route: "/insurer-dashboard" },
  { icon: MapPin,    label: "Assessor",   phone: "0781000002", password: "assess@123",  route: "/assessor-dashboard" },
  { icon: BarChart3, label: "Government", phone: "0781000003", password: "gov@123",     route: "/government-dashboard" },
  { icon: Settings,  label: "Admin",      phone: "0781000004", password: "admin@123",   route: "/admin-dashboard" },
];

const TRUST_BADGES = [
  { icon: "🛰", label: "Satellite-Powered" },
  { icon: "🔒", label: "Secure & Encrypted" },
  { icon: "⚡", label: "Real-Time Alerts" },
];

const STATS = [
  { value: "5,000+", label: "Farmers Protected" },
  { value: "98%",    label: "Claim Success Rate" },
  { value: "15+",    label: "Districts Covered" },
];

export default function RoleSelection() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({ phoneNumber: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDemo, setShowDemo] = useState(false);

  /* ── Phone validation ── */
  const validatePhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    const validPrefixes = ["072", "073", "078", "079"];
    if (!cleaned) return { valid: false, formatted: cleaned, error: "Phone number is required" };
    if (cleaned.length !== 10) return { valid: false, formatted: cleaned, error: "Phone number must be 10 digits (e.g. 0781234567)" };
    if (!validPrefixes.includes(cleaned.substring(0, 3))) return { valid: false, formatted: cleaned, error: "Must start with 072, 073, 078, or 079" };
    return { valid: true, formatted: cleaned };
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === "phoneNumber") {
      const cleaned = value.replace(/\D/g, "").substring(0, 10);
      setFormData((p) => ({ ...p, [field]: cleaned }));
    } else {
      setFormData((p) => ({ ...p, [field]: value }));
    }
    setError("");
  };

  const getDashboardRoute = (role: string) => {
    const map: Record<string, string> = {
      FARMER: "/farmer-dashboard",
      ASSESSOR: "/assessor-dashboard",
      INSURER: "/insurer-dashboard",
      GOVERNMENT: "/government-dashboard",
      ADMIN: "/admin-dashboard",
    };
    return map[role.toUpperCase()] || "/role-selection";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (!formData.phoneNumber || !formData.password) {
        setError("Please enter both phone number and password.");
        setIsLoading(false);
        return;
      }

      const phoneValidation = validatePhoneNumber(formData.phoneNumber);
      if (!phoneValidation.valid) {
        setError(phoneValidation.error || "Invalid phone number.");
        setIsLoading(false);
        return;
      }

      const formattedPhone = phoneValidation.formatted;

      const demo = DEMO_CREDENTIALS[formattedPhone];

      // ── 1. Try the live backend first ──
      const loginMethods = [
        () => farmerLogin(formattedPhone, formData.password),
        () => assessorLogin(formattedPhone, formData.password),
        () => insurerLogin(formattedPhone, formData.password),
        () => adminLogin(formattedPhone, formData.password),
      ];

      let loginResponse = null;
      let lastError = null;

      for (const method of loginMethods) {
        try {
          loginResponse = await method();
          break;
        } catch (err: any) {
          lastError = err;
        }
      }

      if (!loginResponse) {
        try {
          const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phoneNumber: formattedPhone, password: formData.password }),
          });
          const data = await res.json();
          if (res.ok && data.data?.role === "GOVERNMENT") {
            loginResponse = data.data;
            localStorage.setItem("token", loginResponse.token);
            localStorage.setItem("role", loginResponse.role);
            localStorage.setItem("userId", loginResponse.userId || "");
            localStorage.setItem("phoneNumber", formattedPhone);
          }
        } catch (_) {}
      }

      const isConnectivityError = (err: any) => {
        const message = String(err?.message || "").toLowerCase();
        return (
          message.includes("network") ||
          message.includes("timeout") ||
          message.includes("failed to fetch") ||
          message.includes("service unavailable") ||
          message.includes("bad gateway") ||
          message.includes("gateway timeout")
        );
      };

      // ── 2. Fallback to demo ONLY when backend is unreachable ──
      if (!loginResponse && demo && demo.password === formData.password && isConnectivityError(lastError)) {
        localStorage.setItem("role", demo.role);
        localStorage.setItem("phoneNumber", formattedPhone);
        localStorage.setItem("userId", "demo-" + Date.now());
        localStorage.setItem("token", "demo-token-" + Date.now());

        toast({
          title: `Backend unavailable, using ${demo.name} demo`,
          description: `You are in offline demo mode as ${demo.role.toLowerCase()}.`,
        });

        await new Promise((r) => setTimeout(r, 600));
        navigate(getDashboardRoute(demo.role));
        return;
      }

      if (!loginResponse) {
        throw lastError || new Error("Invalid credentials. Please check your phone number and password.");
      }

      const role = loginResponse.role || localStorage.getItem("role");
      if (!role) throw new Error("Unable to determine user role.");

      toast({ title: "Welcome back!", description: `Redirecting to your ${role.toLowerCase()} dashboard…` });
      navigate(getDashboardRoute(role));
    } catch (err: any) {
      const msg = err.message || "Login failed. Please try again.";
      setError(msg);
      toast({ title: "Login failed", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CustomScrollbar>
      <div className="min-h-screen flex">
        {/* ══════════════════════════════════
            LEFT PANEL — Full-bleed visual
        ══════════════════════════════════ */}
        <div className="hidden lg:flex lg:w-[52%] relative flex-col">
          {/* Background photo */}
          <img
            src="/farmer.jpg"
            alt="Rwandan farmer in green field"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Navy gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#14284B]/85 via-[#14284B]/60 to-[#0a1628]/70" />
          {/* Subtle grid */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />

          {/* Back button */}
          <div className="relative z-10 p-8">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium transition-colors duration-200 group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform duration-200" />
              Back to Home
            </button>
          </div>

          {/* Center content */}
          <div className="relative z-10 flex-1 flex flex-col justify-center px-12 xl:px-16">
            {/* Trust badges */}
            <div className="flex gap-3 mb-10 flex-wrap">
              {TRUST_BADGES.map((b) => (
                <div
                  key={b.label}
                  className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-4 py-1.5"
                >
                  <span className="text-sm">{b.icon}</span>
                  <span className="text-white/80 text-xs font-medium">{b.label}</span>
                </div>
              ))}
            </div>

            <h2 className="text-4xl xl:text-5xl font-black text-white leading-tight mb-5">
              Protecting Africa's<br />
              <span className="text-white/60">farmers with AI.</span>
            </h2>
            <p className="text-white/60 text-base leading-relaxed max-w-sm mb-12">
              Join thousands of farmers, insurers, and assessors using STARHAWK to secure
              agriculture across Rwanda and beyond.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {STATS.map((s) => (
                <div key={s.label} className="bg-white/8 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                  <div className="text-2xl xl:text-3xl font-black text-white">{s.value}</div>
                  <div className="text-white/50 text-xs mt-1 font-medium">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom logo watermark */}
          <div className="relative z-10 p-8 pb-10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center border border-white/20">
                <Satellite className="h-4 w-4 text-white" />
              </div>
              <span className="text-white/40 text-sm font-bold tracking-widest uppercase">
                STARHAWK © {new Date().getFullYear()}
              </span>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════
            RIGHT PANEL — Login form
        ══════════════════════════════════ */}
        <div className="w-full lg:w-[48%] bg-[#f8f9fc] flex items-center justify-center p-6 sm:p-10 relative overflow-hidden">
          {/* Subtle background circles */}
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#14284B]/4 pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-[#14284B]/3 pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative z-10 w-full max-w-md"
          >
            {/* Mobile back button */}
            <div className="lg:hidden mb-6">
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-2 text-slate-500 hover:text-[#14284B] text-sm font-medium transition-colors group"
              >
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform duration-200" />
                Back to Home
              </button>
            </div>

            {/* ── Logo ── */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-6">
                <img
                  src="/logo.png"
                  alt="STARHAWK Logo"
                  className="h-12 w-auto"
                />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#14284B] leading-tight">
                Welcome back
              </h1>
              <p className="text-slate-500 text-sm mt-1.5">
                Sign in to access your STARHAWK dashboard
              </p>
            </div>

            {/* ── Form Card ── */}
            <div className="bg-white rounded-2xl border border-[#14284B]/8 shadow-[0_8px_40px_rgba(20,40,75,0.1)] p-7 sm:p-8">
              {/* Error banner */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200/60 rounded-xl p-4"
                  >
                    <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 leading-snug">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Phone number */}
                <div>
                  <label
                    htmlFor="phoneNumber"
                    className="block text-sm font-semibold text-[#14284B] mb-2"
                  >
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      id="phoneNumber"
                      type="tel"
                      inputMode="numeric"
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                      placeholder="0781234567"
                      maxLength={10}
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-200 bg-slate-50 text-[#14284B] text-sm font-medium placeholder-slate-400 focus:outline-none focus:border-[#14284B] focus:bg-white transition-all duration-200"
                    />
                    {formData.phoneNumber.length === 10 && (
                      <CheckCircle2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                    )}
                  </div>
                  <p className="mt-1.5 text-xs text-slate-400">
                    Rwandan numbers: 072, 073, 078, or 079
                  </p>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor="password"
                      className="block text-sm font-semibold text-[#14284B]"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      className="text-xs text-[#14284B]/60 hover:text-[#14284B] font-medium transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      placeholder="Enter your password"
                      required
                      className="w-full pl-10 pr-11 py-3 rounded-xl border-2 border-slate-200 bg-slate-50 text-[#14284B] text-sm font-medium placeholder-slate-400 focus:outline-none focus:border-[#14284B] focus:bg-white transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember me */}
                <div className="flex items-center gap-2.5">
                  <input
                    id="remember"
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-[#14284B] focus:ring-[#14284B] cursor-pointer"
                  />
                  <label htmlFor="remember" className="text-sm text-slate-500 cursor-pointer select-none">
                    Keep me signed in
                  </label>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-[#14284B] text-white font-bold text-sm rounded-xl hover:bg-[#0f1e38] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 shadow-[0_4px_20px_rgba(20,40,75,0.3)] hover:shadow-[0_6px_28px_rgba(20,40,75,0.4)] hover:-translate-y-0.5 mt-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4" />
                      Sign In to Dashboard
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* ── Demo Access Section ── */}
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowDemo(!showDemo)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-dashed border-[#14284B]/20 hover:border-[#14284B]/40 bg-[#14284B]/3 hover:bg-[#14284B]/6 transition-all duration-200 group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🎮</span>
                  <span className="text-sm font-semibold text-[#14284B]/70 group-hover:text-[#14284B]">
                    Demo Access — click to explore
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  {showDemo ? "hide ▲" : "show ▼"}
                </span>
              </button>

              <AnimatePresence>
                {showDemo && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-3 grid grid-cols-1 gap-2">
                      {DEMO_CARD_LIST.map((d) => {
                        const Icon = d.icon;
                        return (
                          <button
                            key={d.phone}
                            type="button"
                            onClick={() => {
                              setFormData({ phoneNumber: d.phone, password: d.password });
                              setError("");
                              setShowDemo(false);
                            }}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#14284B]/10 bg-white hover:bg-[#14284B] hover:border-[#14284B] group transition-all duration-200 text-left shadow-sm"
                          >
                            <div className="w-8 h-8 rounded-lg bg-[#14284B]/8 group-hover:bg-white/15 flex items-center justify-center flex-shrink-0 transition-colors">
                              <Icon className="h-4 w-4 text-[#14284B] group-hover:text-white transition-colors" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-[#14284B] group-hover:text-white transition-colors">
                                {d.label}
                              </div>
                              <div className="text-[11px] text-slate-400 group-hover:text-white/60 transition-colors font-mono">
                                {d.phone} · {d.password}
                              </div>
                            </div>
                            <span className="text-[11px] text-slate-400 group-hover:text-white/50 transition-colors font-medium flex-shrink-0">
                              click to fill →
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-3 text-center text-[11px] text-slate-400">
                      Click any role above to auto-fill credentials, then press Sign In.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer note */}
            <p className="mt-6 text-center text-xs text-slate-400 leading-relaxed">
              Access is role-based. If you don't have credentials,{" "}
              <a
                href="mailto:info@starhawk.rw"
                className="text-[#14284B] font-semibold hover:underline"
              >
                contact your administrator
              </a>
              .
            </p>

            {/* Security notice */}
            <div className="mt-4 flex items-center justify-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/15 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-xs text-slate-400 font-medium">
                256-bit SSL encrypted · Secure login
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </CustomScrollbar>
  );
}
