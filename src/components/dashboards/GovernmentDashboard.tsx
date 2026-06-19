import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { logout as authLogout, getUserId, getPhoneNumber, getEmail } from "@/services/authAPI";
import { getUserProfile } from "@/services/usersAPI";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Topbar } from "@/components/layout/Topbar";
import CustomScrollbar from "@/components/ui/CustomScrollbar";
import {
  LayoutDashboard, Trophy, ReceiptText, ShieldCheck, AlertTriangle,
  Satellite, LogOut, X, ChevronLeft, ChevronRight, ChevronDown, GitCompareArrows,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { crops, seasons } from "@/components/government/gov-data";

// Page components — one file per page
import {
  GovDashboardPage,
  GovLeaderboardPage,
  GovPoliciesPage,
  GovClaimsPage,
  GovSubsidiesPage,
  GovSeasonComparePage,
  GovSectorPage,
  GovCellPage,
  GovVillagePage,
} from "@/components/government/pages";

// ─── Navigation items ──────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "dashboard",   label: "Dashboard",        icon: LayoutDashboard   },
  { id: "leaderboard", label: "Leaderboard",      icon: Trophy            },
  { id: "policies",    label: "Policies",         icon: ShieldCheck       },
  { id: "claims",      label: "Claims & Losses",  icon: AlertTriangle     },
  { id: "invoicing",   label: "Subsidies",        icon: ReceiptText       },
  { id: "compare",     label: "Compare Seasons",  icon: GitCompareArrows  },
] as const;

type PageId = typeof NAV_ITEMS[number]["id"];

const PAGE_META: Record<PageId, { title: string; description: string }> = {
  dashboard:   { title: "National Overview",    description: "Agricultural insurance overview across all provinces" },
  leaderboard: { title: "Leaderboard",          description: "Regional crop health & insurance ranking" },
  policies:    { title: "Policy Registry",      description: "Population financial protection overview — read-only oversight" },
  claims:      { title: "Claims & Losses",      description: "District disaster monitoring & insurer payout oversight" },
  invoicing:   { title: "Subsidies",            description: "Government subsidy budget and utilization" },
  compare:     { title: "Season Comparison",    description: "Pick a region and season for each side — data appears the moment you choose" },
};

function renderPage(page: PageId) {
  switch (page) {
    case "dashboard":   return <GovDashboardPage />;
    case "leaderboard": return <GovLeaderboardPage crop="All Crops" season="Season A 2026" />;
    case "policies":    return <GovPoliciesPage />;
    case "claims":      return <GovClaimsPage />;
    case "invoicing":   return <GovSubsidiesPage />;
    case "compare":     return <GovSeasonComparePage />;
    default:            return <GovDashboardPage />;
  }
}

// ─── Main shell component ──────────────────────────────────────────────────────
export const GovernmentDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pathParts = location.pathname.split("/").filter(Boolean);
  const urlPage = (pathParts[1] || "dashboard") as PageId;
  const activePage: PageId = NAV_ITEMS.some((n) => n.id === urlPage) ? urlPage : "dashboard";

  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("govSidebarCollapsed") === "true");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [viewStack, setViewStack] = useState<{ id: string, level: "Sector" | "Cell" | "Village" }[]>([]);

  const governmentEmail = getEmail() || "";
  const governmentPhone = getPhoneNumber() || "";
  const [governmentProfile, setGovernmentProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const governmentName = governmentEmail || governmentPhone || "Government Official";

  // Global filters
  const [crop, setCrop] = useState<string>("All Crops");
  const [season, setSeason] = useState<string>("Season A 2026");

  useEffect(() => { document.documentElement.classList.remove("dark"); }, []);
  useEffect(() => { localStorage.setItem("govSidebarCollapsed", String(collapsed)); }, [collapsed]);
  useEffect(() => { setViewStack([]); }, [activePage]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollContainer = document.getElementById("gov-main-scroll-area");
      if (scrollContainer) {
        scrollContainer.scrollTop = 0;
        const scrollableChildren = scrollContainer.querySelectorAll("*");
        scrollableChildren.forEach((child) => {
          if (child.scrollTop > 0) {
            child.scrollTop = 0;
          }
        });
      }
      window.scrollTo({ top: 0 });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    handleScroll();
    const t1 = setTimeout(handleScroll, 50);
    const t2 = setTimeout(handleScroll, 150);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [viewStack]);

  useEffect(() => {
    if (!profileLoading && !governmentProfile) {
      setProfileLoading(true);
      getUserProfile()
        .then((res: any) => setGovernmentProfile(res?.data || res))
        .catch(() => {})
        .finally(() => setProfileLoading(false));
    }
  }, []);

  const displayName = governmentProfile
    ? ([governmentProfile.firstName, governmentProfile.lastName].filter(Boolean).join(" ") || governmentProfile.name || governmentName)
    : governmentName;

  const userLocation = (() => {
    const gov = governmentProfile?.governmentProfile;
    if (!gov) return "Rwanda";
    return [gov.village, gov.cell, gov.sector, gov.district, gov.province].find(Boolean) || "Rwanda";
  })();

  const displaySubtitle = (() => {
    const level = governmentProfile?.governmentProfile?.level;
    if (level) {
      const formattedLevel = level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
      return `${formattedLevel}-Level administrator`;
    }
    return undefined;
  })();

  const handleNavigate = (page: PageId) => {
    navigate(`/government/${page}`);
    setMobileOpen(false);
  };

  const meta = PAGE_META[activePage];

  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen w-full bg-gray-50 flex relative">

        {/* Mobile overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 bg-black/10 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
        )}

        {/* ── Sidebar ── */}
        <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-gray-200 shadow-sm transition-all duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
          ${collapsed ? "lg:w-20" : "lg:w-64"} w-64`}
        >
          {/* Brand */}
          <div className={`flex items-center border-b border-gray-100 p-4 min-h-[72px] ${collapsed ? "justify-center" : "justify-between"}`}>
            <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 shrink-0">
                <Satellite className="h-5 w-5 text-white" />
              </div>
              {!collapsed && (
                <div className="leading-tight min-w-0">
                  <p className="text-lg font-black text-slate-900 tracking-tight leading-none uppercase">Starhawk</p>
                  <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">Gov Command</p>
                </div>
              )}
            </div>
            <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 lg:hidden">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Section label */}
          {!collapsed && (
            <p className="px-7 pt-5 pb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Oversight</p>
          )}

          {/* Nav */}
          <div className="flex-1 overflow-y-auto px-3 py-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <nav className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                const btn = (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    className={`w-full flex items-center ${collapsed ? "justify-center px-2" : "px-4"} py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                      isActive ? "bg-indigo-50 text-indigo-700 shadow-sm" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    {collapsed ? (
                      <Icon className={`h-5 w-5 shrink-0 ${isActive ? "text-indigo-600" : "text-gray-500"}`} />
                    ) : (
                      <div className="flex items-center gap-3 w-full">
                        <Icon className={`h-5 w-5 shrink-0 ${isActive ? "text-indigo-600" : "text-gray-500"}`} />
                        <span className="truncate">{item.label}</span>
                        {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600" />}
                      </div>
                    )}
                  </button>
                );
                if (collapsed) {
                  return (
                    <Tooltip key={item.id}>
                      <TooltipTrigger asChild>{btn}</TooltipTrigger>
                      <TooltipContent side="right" className="bg-slate-900 text-white border-none font-semibold">{item.label}</TooltipContent>
                    </Tooltip>
                  );
                }
                return btn;
              })}
            </nav>
          </div>

          {/* User card */}
          {!collapsed && (
            <div className="mx-3 mb-3 rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5 flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                {displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
              </span>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-sm font-semibold text-gray-800">{displayName}</p>
                <p className="truncate text-xs text-gray-500">{userLocation}</p>
              </div>
            </div>
          )}

          {/* Logout + collapse */}
          <div className="border-t border-gray-100 p-3 flex items-center justify-between gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  className={`${collapsed ? "w-full justify-center px-2" : "flex-1 justify-center"} text-gray-500 hover:text-red-600 hover:bg-red-50`}
                  title="Logout"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="ml-2">Logout</span>}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                  <AlertDialogDescription>Are you sure you want to logout?</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => { authLogout(); navigate("/role-selection"); }} className="bg-red-600 hover:bg-red-700">
                    Logout
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </aside>

        {/* ── Main content ── */}
        <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${collapsed ? "lg:ml-20" : "lg:ml-64"}`}>
          <Topbar
            onToggleSidebar={() => {
              if (window.innerWidth >= 1024) setCollapsed(!collapsed);
              else setMobileOpen(!mobileOpen);
            }}
            sidebarCollapsed={collapsed}
            userName={displayName}
            userEmail={displaySubtitle}
            userRole="Government"
          />

          {/* Page header */}
          <div className="border-b border-gray-200 bg-white px-6 py-5 flex items-end justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight truncate">{meta.title}</h1>
              <p className="mt-0.5 text-sm text-gray-500">{meta.description}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {activePage === "leaderboard" && (
                <div className="hidden sm:block">
                  <Select value={crop} onValueChange={setCrop}>
                    <SelectTrigger className="w-[150px] bg-white h-10 border-gray-200 focus:ring-0 focus:ring-offset-0">
                      <SelectValue placeholder="Crop" />
                    </SelectTrigger>
                    <SelectContent>
                      {crops.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="hidden sm:block">
                <Select value={season} onValueChange={setSeason}>
                  <SelectTrigger className="w-[170px] bg-white h-10 border-gray-200 focus:ring-0 focus:ring-offset-0">
                    <SelectValue placeholder="Season" />
                  </SelectTrigger>
                  <SelectContent>
                    {seasons.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Page content */}
          <main className="flex-1 min-h-0 bg-gray-50 flex flex-col">
            <CustomScrollbar id="gov-main-scroll-area" className="flex-1 overflow-auto">
              <div className="px-6 py-6">
                {activePage === "leaderboard" && viewStack.length > 0 ? (
                  (() => {
                    const currentView = viewStack[viewStack.length - 1];
                    const popView = () => setViewStack(prev => prev.slice(0, prev.length - 1));
                    const handleNavigate = (target: { level: "Leaderboard" | "Sector" | "Cell" | "Village"; id?: string }) => {
                      if (target.level === "Leaderboard") {
                        setViewStack([]);
                      } else if (target.level === "Sector" && target.id) {
                        setViewStack([{ id: target.id, level: "Sector" }]);
                      } else if (target.level === "Cell" && target.id) {
                        const sId = target.id.split("-")[0];
                        setViewStack([
                          { id: sId, level: "Sector" },
                          { id: target.id, level: "Cell" }
                        ]);
                      } else if (target.level === "Village" && target.id) {
                        const parts = target.id.split("-");
                        const sId = parts[0];
                        const cId = parts[0] + "-" + parts[1];
                        setViewStack([
                          { id: sId, level: "Sector" },
                          { id: cId, level: "Cell" },
                          { id: target.id, level: "Village" }
                        ]);
                      }
                    };
                    
                    if (currentView.level === "Sector") {
                      return <GovSectorPage sectorId={currentView.id} onBack={popView} onNavigate={handleNavigate} onCellSelect={(cellId) => {
                        setViewStack(prev => [...prev, { id: cellId, level: "Cell" }]);
                      }} />;
                    } else if (currentView.level === "Cell") {
                      return <GovCellPage cellId={currentView.id} onBack={popView} onNavigate={handleNavigate} onVillageSelect={(villageId) => {
                        setViewStack(prev => [...prev, { id: villageId, level: "Village" }]);
                      }} />;
                    } else if (currentView.level === "Village") {
                      return <GovVillagePage villageId={currentView.id} onBack={popView} onNavigate={handleNavigate} />;
                    }
                  })()
                ) : activePage === "leaderboard" ? (
                  <GovLeaderboardPage crop={crop} season={season} onSectorSelect={(id, level) => {
                    setViewStack([{ id, level }]);
                  }} />
                ) : (
                  renderPage(activePage)
                )}
              </div>
            </CustomScrollbar>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
};
