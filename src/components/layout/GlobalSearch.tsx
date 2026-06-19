import { useEffect, useState } from "react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { useNavigate } from "react-router-dom";
import { 
  ClipboardCheck, 
  FileText, 
  Leaf, 
  MapPin, 
  Wallet, 
  BarChart3, 
  Settings, 
  FileBadge, 
  Shield,
  Activity,
  User,
  History,
  Search,
  AlertTriangle
} from "lucide-react";
import { getPolicies } from "@/services/policiesApi";
import { getClaims } from "@/services/claimsApi";
import assessmentsApiService from "@/services/assessmentsApi";
import { getMonitoringHistory } from "@/services/cropMonitoringApi";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getInsurers } from "@/services/usersAPI";
import { Building2, Bell } from "lucide-react";

export function GlobalSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [policies, setPolicies] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [monitorings, setMonitorings] = useState<any[]>([]);
  const [insurers, setInsurers] = useState<any[]>([]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    if (isGovernment) return; // Government only needs navigation links
    setLoading(true);
    try {
      const [p, c, a, m, i] = await Promise.allSettled([
        getPolicies(1, 100),
        getClaims(),
        assessmentsApiService.getAssessments(1, 100),
        getMonitoringHistory(),
        getInsurers(0, 100)
      ]);

      if (p.status === "fulfilled") {
        const data = (p.value as any).data || p.value || [];
        setPolicies(Array.isArray(data) ? data : (data.items || data.results || []));
      }
      if (c.status === "fulfilled") {
        const data = (c.value as any).data || c.value || [];
        setClaims(Array.isArray(data) ? data : (data.items || data.results || []));
      }
      if (a.status === "fulfilled") {
        const data = (a.value as any).data || a.value || [];
        setAssessments(Array.isArray(data) ? data : (data.items || data.results || []));
      }
      if (m.status === "fulfilled") {
        const data = (m.value as any).data || m.value || [];
        setMonitorings(Array.isArray(data) ? data : (data.items || data.results || []));
      }
      if (i.status === "fulfilled") {
        const data = (i.value as any).items || i.value || [];
        setInsurers(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Global search data load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const getFarmerName = (item: any) => {
    const farmer = item.farmerId || item.farmer || item.farmId?.farmerId || item.farm?.farmerId || {};
    if (typeof farmer === 'string') return "ID: " + farmer;
    if (farmer.firstName || farmer.lastName) {
      return `${farmer.firstName || ""} ${farmer.lastName || ""}`.trim();
    }
    return (
      farmer.name || 
      farmer.email || 
      item.farmerName || 
      item.farmerId?.name || 
      item.farmId?.farmerId?.name ||
      "Unknown Farmer"
    );
  };

  const formatStatus = (status: string) => {
    if (!status) return "Pending";
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getStatusStyles = (status: string) => {
    const s = (status || "").toUpperCase();
    if (s === "APPROVED" || s === "ACTIVE" || s === "SUCCESS") {
      return "bg-emerald-100/60 text-emerald-700 border-emerald-200/50";
    }
    if (s === "IN_PROGRESS" || s === "SUBMITTED" || s === "PROCESSING") {
      return "bg-blue-100/60 text-blue-700 border-blue-200/50";
    }
    if (s === "REJECTED" || s === "EXPIRED" || s === "FAILED") {
      return "bg-rose-100/60 text-rose-700 border-rose-200/50";
    }
    return "bg-amber-100/60 text-amber-700 border-amber-200/50"; // PENDING
  };

  const go = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  const role = localStorage.getItem('userType') || localStorage.getItem('role') || 'insurer';
  const isAssessor = role.toLowerCase() === 'assessor';
  const isFarmer = role.toLowerCase() === 'farmer';
  const isAdmin = role.toLowerCase() === 'admin';
  const isGovernment = role.toLowerCase() === 'government';
  const isInsurer = !isAssessor && !isFarmer && !isAdmin && !isGovernment;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} className="sm:max-w-[750px] md:max-w-[850px]">
      <CommandInput placeholder="Search farmers, farms, policies, claims, fields…" className="h-14 text-lg border-none focus:ring-0 pr-12" />
      <CommandList className="max-h-[60vh] sm:max-h-[550px] overflow-y-auto scrollbar-thin">
        {loading ? (
          <div className="p-4 space-y-4">
             {[1, 2, 3].map(i => (
               <div key={i} className="space-y-2">
                 <Skeleton className="h-3 w-[100px] mb-2 opacity-50" />
                 <Skeleton className="h-14 w-full rounded-xl" />
                 <Skeleton className="h-14 w-full rounded-xl" />
               </div>
             ))}
          </div>
        ) : (
          <>
            <CommandEmpty className="py-12 text-center text-muted-foreground">
              <div className="mb-2 flex justify-center"><Search className="h-8 w-8 opacity-20" /></div>
              No results found matching your search.
            </CommandEmpty>

            <CommandGroup heading="Platform Navigation">
              {isAssessor ? (
                <>
                  <CommandItem onSelect={() => go("/assessor/dashboard")} className="py-3 px-4 rounded-xl cursor-pointer"><BarChart3 className="mr-3 h-4 w-4 text-green-500" />Overview Dashboard</CommandItem>
                  <CommandItem onSelect={() => go("/assessor/risk-assessments")} className="py-3 px-4 rounded-xl cursor-pointer"><Shield className="mr-3 h-4 w-4 text-emerald-500" />Risk Assessments</CommandItem>
                  <CommandItem onSelect={() => go("/assessor/loss-assessments")} className="py-3 px-4 rounded-xl cursor-pointer"><FileText className="mr-3 h-4 w-4 text-amber-500" />Loss Assessments</CommandItem>
                  <CommandItem onSelect={() => go("/assessor/farmers")} className="py-3 px-4 rounded-xl cursor-pointer"><User className="mr-3 h-4 w-4 text-blue-500" />Farmers Management</CommandItem>
                  <CommandItem onSelect={() => go("/assessor/crop-monitoring")} className="py-3 px-4 rounded-xl cursor-pointer"><Activity className="mr-3 h-4 w-4 text-rose-500" />Field Monitoring</CommandItem>
                </>
              ) : isFarmer ? (
                <>
                  <CommandItem onSelect={() => go("/farmer/dashboard")} className="py-3 px-4 rounded-xl cursor-pointer"><BarChart3 className="mr-3 h-4 w-4 text-green-600" />Farmer Dashboard</CommandItem>
                  <CommandItem onSelect={() => go("/farmer/my-fields")} className="py-3 px-4 rounded-xl cursor-pointer"><Leaf className="mr-3 h-4 w-4 text-emerald-600" />My Fields & Farms</CommandItem>
                  <CommandItem onSelect={() => go("/farmer/insurance")} className="py-3 px-4 rounded-xl cursor-pointer"><Shield className="mr-3 h-4 w-4 text-blue-600" />Insurance Policies</CommandItem>
                  <CommandItem onSelect={() => go("/farmer/claims")} className="py-3 px-4 rounded-xl cursor-pointer"><Wallet className="mr-3 h-4 w-4 text-slate-600" />Claims History</CommandItem>
                  <CommandItem onSelect={() => go("/farmer/insurers")} className="py-3 px-4 rounded-xl cursor-pointer"><Building2 className="mr-3 h-4 w-4 text-amber-600" />Insurers Network</CommandItem>
                  <CommandItem onSelect={() => go("/farmer/monitoring")} className="py-3 px-4 rounded-xl cursor-pointer"><Activity className="mr-3 h-4 w-4 text-rose-600" />Field Monitoring</CommandItem>
                  <CommandItem onSelect={() => go("/farmer/notifications")} className="py-3 px-4 rounded-xl cursor-pointer"><Bell className="mr-3 h-4 w-4 text-indigo-600" />Notifications</CommandItem>
                  <CommandItem onSelect={() => go("/farmer/file-claim")} className="py-3 px-4 rounded-xl cursor-pointer"><AlertTriangle className="mr-3 h-4 w-4 text-amber-500" />File New Claim</CommandItem>
                  <CommandItem onSelect={() => go("/farmer/profile")} className="py-3 px-4 rounded-xl cursor-pointer"><Settings className="mr-3 h-4 w-4 text-slate-500" />Account Settings</CommandItem>
                </>
              ) : isAdmin ? (
                <>
                  <CommandItem onSelect={() => go("/admin/dashboard")} className="py-3 px-4 rounded-xl cursor-pointer"><BarChart3 className="mr-3 h-4 w-4 text-purple-600" />Admin Dashboard</CommandItem>
                  <CommandItem onSelect={() => go("/admin/users")} className="py-3 px-4 rounded-xl cursor-pointer"><User className="mr-3 h-4 w-4 text-blue-600" />User Management</CommandItem>
                  <CommandItem onSelect={() => go("/admin/policies")} className="py-3 px-4 rounded-xl cursor-pointer"><Shield className="mr-3 h-4 w-4 text-emerald-600" />Policies Management</CommandItem>
                  <CommandItem onSelect={() => go("/admin/claims")} className="py-3 px-4 rounded-xl cursor-pointer"><Wallet className="mr-3 h-4 w-4 text-slate-600" />Claims Management</CommandItem>
                  <CommandItem onSelect={() => go("/admin/assessments")} className="py-3 px-4 rounded-xl cursor-pointer"><ClipboardCheck className="mr-3 h-4 w-4 text-amber-600" />Assessments Management</CommandItem>
                </>
              ) : isGovernment ? (
                <>
                  <CommandItem onSelect={() => go("/government/dashboard")} className="py-3 px-4 rounded-xl cursor-pointer"><BarChart3 className="mr-3 h-4 w-4 text-emerald-600" />National Overview</CommandItem>
                  <CommandItem onSelect={() => go("/government/leaderboard")} className="py-3 px-4 rounded-xl cursor-pointer"><Activity className="mr-3 h-4 w-4 text-amber-600" />Regional Leaderboard</CommandItem>
                  <CommandItem onSelect={() => go("/government/policies")} className="py-3 px-4 rounded-xl cursor-pointer"><Shield className="mr-3 h-4 w-4 text-blue-600" />Policy Registry</CommandItem>
                  <CommandItem onSelect={() => go("/government/claims")} className="py-3 px-4 rounded-xl cursor-pointer"><AlertTriangle className="mr-3 h-4 w-4 text-rose-600" />Claims & Losses</CommandItem>
                  <CommandItem onSelect={() => go("/government/invoicing")} className="py-3 px-4 rounded-xl cursor-pointer"><Wallet className="mr-3 h-4 w-4 text-indigo-600" />Subsidies Overview</CommandItem>
                  <CommandItem onSelect={() => go("/government/compare")} className="py-3 px-4 rounded-xl cursor-pointer"><History className="mr-3 h-4 w-4 text-purple-600" />Season Comparison</CommandItem>
                </>
              ) : (
                <>
                  <CommandItem onSelect={() => go("/insurer/dashboard")} className="py-3 px-4 rounded-xl cursor-pointer"><BarChart3 className="mr-3 h-4 w-4 text-indigo-500" />Overview Dashboard</CommandItem>
                  <CommandItem onSelect={() => go("/insurer/requests")} className="py-3 px-4 rounded-xl cursor-pointer"><FileBadge className="mr-3 h-4 w-4 text-amber-500" />Insurance Requests</CommandItem>
                  <CommandItem onSelect={() => go("/insurer/assessments")} className="py-3 px-4 rounded-xl cursor-pointer"><ClipboardCheck className="mr-3 h-4 w-4 text-emerald-500" />Risk Assessments</CommandItem>
                  <CommandItem onSelect={() => go("/insurer/policies")} className="py-3 px-4 rounded-xl cursor-pointer"><Shield className="mr-3 h-4 w-4 text-blue-500" />Policy Management</CommandItem>
                  <CommandItem onSelect={() => go("/insurer/monitoring")} className="py-3 px-4 rounded-xl cursor-pointer"><Activity className="mr-3 h-4 w-4 text-rose-500" />Crop Monitoring</CommandItem>
                  <CommandItem onSelect={() => go("/insurer/claims")} className="py-3 px-4 rounded-xl cursor-pointer"><Wallet className="mr-3 h-4 w-4 text-slate-500" />Claims Processing</CommandItem>
                </>
              )}
            </CommandGroup>

            <CommandSeparator className="my-2 opacity-50" />

            {!isGovernment && assessments.length > 0 && (
              <CommandGroup heading="Active Assessments">
                {assessments.map((a) => {
                  const farmerName = getFarmerName(a);
                  const farmName = a.farmId?.name || a.farm?.name || "Farm";
                  const district = a.farmId?.locationName?.split(',')[0] || a.farmId?.district || "N/A";
                  return (
                    <CommandItem key={a._id || a.id} value={`${farmerName} ${farmName} ${a.status} assessment`} onSelect={() => go(isAssessor ? `/assessor/risk-assessments/${a._id || a.id}` : isFarmer ? `/farmer/dashboard` : isAdmin ? `/admin/assessments` : `/insurer/assessments/${a._id || a.id}`)} className="py-3 px-4 rounded-xl cursor-pointer">
                      <div className="mr-3 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-900">{farmerName}</span>
                          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border tracking-tighter shadow-sm", getStatusStyles(a.status))}>
                            {formatStatus(a.status)}
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-500 font-medium">{farmName} · {district}</span>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}

            {!isGovernment && policies.length > 0 && (
              <CommandGroup heading="Managed Policies">
                {policies.map((p) => {
                  const pNum = p.policyNumber || `POL-${(p._id || p.id)?.slice(-6).toUpperCase()}`;
                  const farmerName = getFarmerName(p);
                  return (
                    <CommandItem key={p._id || p.id} value={`${pNum} ${farmerName} ${p.cropType} policy`} onSelect={() => go(isAssessor ? `/assessor/farmers` : isFarmer ? `/farmer/insurance` : isAdmin ? `/admin/policies` : `/insurer/policies`)} className="py-3 px-4 rounded-xl cursor-pointer">
                      <div className="mr-3 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <Shield className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-900">{pNum}</span>
                          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border tracking-tighter shadow-sm", getStatusStyles(p.status || 'Active'))}>
                            {formatStatus(p.status || 'Active')}
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-500 font-medium">{farmerName} · {p.cropType || "Crop"}</span>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}

            {!isGovernment && claims.length > 0 && (
              <CommandGroup heading="Insurance Claims">
                {claims.map((c) => {
                  const cNum = c.claimNumber || `CLM-${(c._id || c.id)?.slice(-6).toUpperCase()}`;
                  const farmerName = getFarmerName(c);
                  const cause = c.cause || "Claim Request";
                  return (
                    <CommandItem key={c._id || c.id} value={`${cNum} ${farmerName} ${c.status} claim`} onSelect={() => go(isAssessor ? `/assessor/loss-assessments/${c._id || c.id}` : isFarmer ? `/farmer/claims` : isAdmin ? `/admin/claims` : `/insurer/claims/${c._id || c.id}`)} className="py-3 px-4 rounded-xl cursor-pointer">
                      <div className="mr-3 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-600">
                        <Wallet className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-900">{cNum}</span>
                          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border tracking-tighter shadow-sm", getStatusStyles(c.status))}>
                            {formatStatus(c.status)}
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-500 font-medium">{farmerName} · {cause}</span>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}

            {!isGovernment && monitorings.length > 0 && (
              <CommandGroup heading="Monitored Crop Fields">
                {monitorings.map((f) => {
                  const mId = f._id || f.id;
                  const farmName = f.farmId?.name || "Field";
                  const farmerName = getFarmerName(f);
                  const crop = f.policyId?.cropType || f.cropType || "Crop";
                  return (
                    <CommandItem key={mId} value={`${mId} ${farmName} ${crop} monitoring field`} onSelect={() => go(isAssessor ? `/assessor/crop-monitoring/${mId}` : isFarmer ? `/farmer/monitoring` : isAdmin ? `/admin/dashboard` : `/insurer/monitoring/${mId}`)} className="py-3 px-4 rounded-xl cursor-pointer">
                      <div className="mr-3 flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                        <Leaf className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-900">FLD-{(mId?.toString() || "0000").slice(-4).toUpperCase()}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100/50 text-rose-700 border border-rose-200/50 uppercase tracking-tighter shadow-sm">Live Monitor</span>
                        </div>
                        <span className="text-[11px] text-gray-500 font-medium">{farmName} · {farmerName} · {crop}</span>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}

            {!isGovernment && insurers.length > 0 && (
              <CommandGroup heading="Insurance Partners">
                {insurers.map((i) => {
                  const name = i.name || i.companyName || "Insurer";
                  const email = i.email || "partner@starhawk.com";
                  return (
                    <CommandItem key={i._id || i.id} value={`${name} ${email} insurer partner`} onSelect={() => go(isFarmer ? `/farmer/insurers` : isAdmin ? `/admin/users` : `/insurer/dashboard`)} className="py-3 px-4 rounded-xl cursor-pointer">
                      <div className="mr-3 flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-900">{name}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100/50 text-amber-700 border border-amber-200/50 uppercase tracking-tighter shadow-sm">Partner</span>
                        </div>
                        <span className="text-[11px] text-gray-500 font-medium">{email}</span>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
