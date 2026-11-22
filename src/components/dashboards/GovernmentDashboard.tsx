import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getReferenceSeasons } from "@/services/governmentApi";
import { GovAdministrativePage } from "@/components/government/pages/GovAdministrativePage";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  logout as authLogout,
  getPhoneNumber,
  getEmail,
} from "@/services/authAPI";
import { getUserProfile } from "@/services/usersAPI";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Topbar } from "@/components/layout/Topbar";
import CustomScrollbar from "@/components/ui/CustomScrollbar";
import {
  LayoutDashboard,
  Trophy,
  ReceiptText,
  ShieldCheck,
  AlertTriangle,
  Satellite,
  LogOut,
  X,
  ChevronLeft,
  ChevronRight,
  GitCompareArrows,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getMyRegion, getRegionLeaderboard } from "@/services/governmentApi";

// Page components — one file per page
import {
  GovDashboardPage,
  GovLeaderboardPage,
  GovPoliciesPage,
  GovClaimsPage,
  GovSubsidiesPage,
  GovSeasonComparePage,
} from "@/components/government/pages";
import { GovFarmerPage } from "@/components/government/pages/GovFarmerPage";
import { GovPageState } from "@/components/government/pages/GovPageState";

// ─── Navigation items ──────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "leaderboard", label: "Leaderboard", icon: Trophy },
  { id: "policies", label: "Policies", icon: ShieldCheck },
  { id: "claims", label: "Claims & Losses", icon: AlertTriangle },
  { id: "invoicing", label: "Subsidies", icon: ReceiptText },
  { id: "compare", label: "Compare Seasons", icon: GitCompareArrows },
] as const;

type PageId = (typeof NAV_ITEMS)[number]["id"];

const PAGE_META: Record<PageId, { title: string; description: string }> = {
  dashboard: {
    title: "Jurisdiction Overview",
    description: "Agricultural insurance overview across your jurisdiction",
  },
  leaderboard: {
    title: "Leaderboard",
    description: "Regional crop health & insurance ranking",
  },
  policies: {
    title: "Policy Registry",
    description:
      "Population financial protection overview — read-only oversight",
  },
  claims: {
    title: "Claims & Losses",
    description: "District disaster monitoring & insurer payout oversight",
  },
  invoicing: {
    title: "Subsidies",
    description: "Government subsidy budget and utilization",
  },
  compare: {
    title: "Season Comparison",
    description:
      "Pick a region and season for each side — data appears the moment you choose",
  },
};

// ─── Main shell component ──────────────────────────────────────────────────────
export const GovernmentDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pathParts = location.pathname.split("/").filter(Boolean);
  const urlPage = (pathParts[1] || "dashboard") as PageId;
  const activePage: PageId = NAV_ITEMS.some((n) => n.id === urlPage)
    ? urlPage
    : "dashboard";

  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("govSidebarCollapsed") === "true",
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const params = new URLSearchParams(location.search);
  const selectedRegionId = params.get("region");
  const selectedFarmerId = params.get("farmer");
  const referenceSeasons = useQuery({
    queryKey: ["government", "seasons"],
    queryFn: getReferenceSeasons,
  });
  const currentDate = new Date();
  const defaultSeason = `Season ${currentDate.getUTCMonth() < 6 ? "A" : "B"} ${currentDate.getUTCFullYear()}`;
  const season =
    params.get("season") ??
    (referenceSeasons.data?.includes(defaultSeason)
      ? defaultSeason
      : referenceSeasons.data?.[0]);
  const changeSeason = (value: string) => {
    const next = new URLSearchParams(location.search);
    next.set("season", value);
    navigate({ pathname: location.pathname, search: next.toString() });
  };

  const governmentEmail = getEmail() || "";
  const governmentPhone = getPhoneNumber() || "";
  const [governmentProfile, setGovernmentProfile] = useState<any>(null);
  const governmentName =
    governmentEmail || governmentPhone || "Government Official";

  const jurisdiction = useQuery({
    queryKey: ["government", "jurisdiction"],
    queryFn: getMyRegion,
  });
  const myRegionId = jurisdiction.data?.regionId;
  const currentRegionId = selectedRegionId || myRegionId;
  const currentRegion = useQuery({
    queryKey: ["government", "leaderboard", currentRegionId],
    queryFn: () => getRegionLeaderboard(currentRegionId!),
    enabled: !!currentRegionId && activePage === "leaderboard",
  });
  const openRegion = (id: string) =>
    navigate(
      `/government/leaderboard?region=${encodeURIComponent(id)}${season ? `&season=${encodeURIComponent(season)}` : ""}`,
    );
  const openFarmer = (id: string) =>
    navigate(
      `/government/leaderboard?region=${encodeURIComponent(currentRegionId!)}&farmer=${encodeURIComponent(id)}${season ? `&season=${encodeURIComponent(season)}` : ""}`,
    );
  const goBack = () => {
    if (selectedFarmerId) openRegion(currentRegionId!);
    else if (
      currentRegionId !== myRegionId &&
      currentRegion.data?.region.parentId
    )
      openRegion(currentRegion.data.region.parentId);
    else navigate("/government/leaderboard");
  };

  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);
  useEffect(() => {
    localStorage.setItem("govSidebarCollapsed", String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    // Keep existing overview links compatible while storing real IDs in the URL.
    const legacyView = location.state?.viewStack?.at(-1);
    if (legacyView?.id)
      navigate(
        `/government/leaderboard?region=${encodeURIComponent(legacyView.id)}`,
        { replace: true, state: null },
      );
    document.querySelector("#gov-main-scroll-area > div")?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  }, [location.key, location.state, navigate]);

  useEffect(() => {
    let active = true;
    getUserProfile()
      .then((res: any) => {
        if (active) setGovernmentProfile(res?.data || res);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const displayName = governmentProfile
    ? [governmentProfile.firstName, governmentProfile.lastName]
        .filter(Boolean)
        .join(" ") ||
      governmentProfile.name ||
      governmentName
    : governmentName;

  const userLocation = (() => {
    if (jurisdiction.data?.name) return jurisdiction.data.name;
    const gov = governmentProfile?.governmentProfile;
    if (!gov) return "Rwanda";
    return gov[gov.level?.toLowerCase()] || "Rwanda";
  })();

  const displaySubtitle = (() => {
    const level = governmentProfile?.governmentProfile?.level;
    if (level) {
      const formattedLevel =
        level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
      return `${formattedLevel}-Level administrator`;
    }
    return undefined;
  })();

  const handleNavigate = (page: PageId) => {
    navigate(
      `/government/${page}${season ? `?season=${encodeURIComponent(season)}` : ""}`,
    );
    setMobileOpen(false);
  };

  const meta =
    activePage === "dashboard" && jurisdiction.data?.level === "COUNTRY"
      ? {
          title: "National Overview",
          description: "Agricultural insurance overview across all provinces",
        }
      : PAGE_META[activePage];

  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen w-full bg-gray-50 flex relative">
        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/10 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* ── Sidebar ── */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-gray-200 shadow-sm transition-all duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
          ${collapsed ? "lg:w-20" : "lg:w-64"} w-64`}
        >
          {/* Brand */}
          <div
            className={`flex items-center border-b border-gray-100 p-4 min-h-[72px] ${collapsed ? "justify-center" : "justify-between"}`}
          >
            <div
              className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}
            >
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 shrink-0">
                <Satellite className="h-5 w-5 text-white" />
              </div>
              {!collapsed && (
                <div className="leading-tight min-w-0">
                  <p className="text-lg font-black text-slate-900 tracking-tight leading-none uppercase">
                    Starhawk
                  </p>
                  <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">
                    Gov Command
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 lg:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Section label */}
          {!collapsed && (
            <p className="px-7 pt-5 pb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              Oversight
            </p>
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
                      isActive
                        ? "bg-indigo-50 text-indigo-700 shadow-sm"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    {collapsed ? (
                      <Icon
                        className={`h-5 w-5 shrink-0 ${isActive ? "text-indigo-600" : "text-gray-500"}`}
                      />
                    ) : (
                      <div className="flex items-center gap-3 w-full">
                        <Icon
                          className={`h-5 w-5 shrink-0 ${isActive ? "text-indigo-600" : "text-gray-500"}`}
                        />
                        <span className="truncate">{item.label}</span>
                        {isActive && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600" />
                        )}
                      </div>
                    )}
                  </button>
                );
                if (collapsed) {
                  return (
                    <Tooltip key={item.id}>
                      <TooltipTrigger asChild>{btn}</TooltipTrigger>
                      <TooltipContent
                        side="right"
                        className="bg-slate-900 text-white border-none font-semibold"
                      >
                        {item.label}
                      </TooltipContent>
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
                {displayName
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </span>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-sm font-semibold text-gray-800">
                  {displayName}
                </p>
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
                  <AlertDialogDescription>
                    Are you sure you want to logout?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      authLogout();
                      navigate("/role-selection");
                    }}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Logout
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </aside>

        {/* ── Main content ── */}
        <div
          className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${collapsed ? "lg:ml-20" : "lg:ml-64"}`}
        >
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
          {!selectedFarmerId && !selectedRegionId && (
            <div className="border-b border-gray-200 bg-white px-6 py-5 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight truncate">
                  {meta.title}
                </h1>
                <p className="mt-0.5 text-sm text-gray-500">
                  {meta.description}
                </p>
              </div>
              <Select value={season ?? ""} onValueChange={changeSeason}>
                <SelectTrigger
                  aria-label="Dashboard season"
                  className="h-10 w-[170px] border-gray-200 bg-white focus:ring-0 focus:ring-offset-0"
                >
                  <SelectValue
                    placeholder={
                      referenceSeasons.isPending
                        ? "Loading seasons…"
                        : "Select season"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {(referenceSeasons.data ?? []).map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Page content */}
          <main className="flex-1 min-h-0 min-w-0 bg-gray-50 flex flex-col">
            <CustomScrollbar
              id="gov-main-scroll-area"
              className="flex-1 overflow-auto"
            >
              <div className="min-w-0 px-3 py-4 sm:px-6 sm:py-6">
                {jurisdiction.isPending || jurisdiction.error ? (
                  <GovPageState
                    loading={jurisdiction.isPending}
                    error={jurisdiction.error}
                    retry={() => jurisdiction.refetch()}
                  />
                ) : selectedFarmerId ? (
                  <GovFarmerPage
                    key={selectedFarmerId}
                    farmerId={selectedFarmerId}
                    regionContext={currentRegion.data}
                    rootRegionId={myRegionId}
                    onRegionSelect={openRegion}
                    onBack={goBack}
                  />
                ) : activePage === "leaderboard" ? (
                  currentRegion.data &&
                  (selectedRegionId
                    ? ["PROVINCE", "DISTRICT", "SECTOR", "CELL", "VILLAGE"]
                    : ["SECTOR", "CELL", "VILLAGE"]
                  ).includes(currentRegion.data.region.level) ? (
                    <GovAdministrativePage
                      key={currentRegionId}
                      regionId={currentRegionId!}
                      rootRegionId={myRegionId}
                      onBack={
                        selectedRegionId && selectedRegionId !== myRegionId
                          ? goBack
                          : undefined
                      }
                      onRegionSelect={openRegion}
                      onFarmerSelect={openFarmer}
                      season={season}
                    />
                  ) : (
                    <GovLeaderboardPage
                      key={currentRegionId}
                      regionId={currentRegionId!}
                      rootRegionId={myRegionId}
                      onRegionSelect={openRegion}
                      onFarmerSelect={openFarmer}
                      onBack={
                        selectedRegionId && selectedRegionId !== myRegionId
                          ? goBack
                          : undefined
                      }
                      season={season}
                    />
                  )
                ) : activePage === "dashboard" ? (
                  <GovDashboardPage
                    regionId={myRegionId!}
                    onSectorSelect={openRegion}
                    onFarmerSelect={openFarmer}
                    season={season}
                  />
                ) : activePage === "policies" ? (
                  <GovPoliciesPage
                    key={`${myRegionId}-${season}`}
                    regionId={myRegionId!}
                    season={season}
                  />
                ) : activePage === "claims" ? (
                  <GovClaimsPage
                    key={`${myRegionId}-${season}`}
                    regionId={myRegionId!}
                    season={season}
                  />
                ) : activePage === "invoicing" ? (
                  <GovSubsidiesPage
                    key={`${myRegionId}-${season}`}
                    regionId={myRegionId!}
                    season={season}
                  />
                ) : (
                  <GovSeasonComparePage
                    key={myRegionId}
                    regionId={myRegionId!}
                    season={season}
                  />
                )}
              </div>
            </CustomScrollbar>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
};
