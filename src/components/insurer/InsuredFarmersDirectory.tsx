import { useState, useEffect, useMemo } from "react";
import { 
  Search, 
  Filter, 
  Users, 
  MapPin, 
  Leaf, 
  DollarSign, 
  Calendar, 
  ChevronRight, 
  X, 
  RefreshCw, 
  SlidersHorizontal, 
  CheckCircle2, 
  Mail, 
  Phone, 
  Map, 
  Grid, 
  List,
  Shield,
  Clock,
  Info,
  ArrowUpDown
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { insurerService, InsuredFarmer } from "@/lib/api/services/insurer";
import { formatCropTypeLabel } from "@/lib/crops";
import { useToast } from "@/hooks/use-toast";

// Highly curated covered crop types active in the project
const COVERED_CROP_TYPES = [
  "MAIZE",
  "BEANS",
  "RICE",
  "WHEAT",
  "SORGHUM",
  "POTATOES",
  "COFFEE",
  "TEA"
] as const;

// 100% self-contained Rwanda administrative geography to ensure absolute uptime and no null errors
const RWANDA_GEOGRAPHY: Record<string, { id: string; name: string; districts: { id: string; name: string }[] }> = {
  "kigali_city": {
    id: "kigali_city",
    name: "Kigali City",
    districts: [
      { id: "gasabo", name: "Gasabo" },
      { id: "kicukiro", name: "Kicukiro" },
      { id: "nyarugenge", name: "Nyarugenge" }
    ]
  },
  "northern_province": {
    id: "northern_province",
    name: "Northern Province",
    districts: [
      { id: "burera", name: "Burera" },
      { id: "gakenke", name: "Gakenke" },
      { id: "gicumbi", name: "Gicumbi" },
      { id: "musanze", name: "Musanze" },
      { id: "rulindo", name: "Rulindo" }
    ]
  },
  "southern_province": {
    id: "southern_province",
    name: "Southern Province",
    districts: [
      { id: "gisagara", name: "Gisagara" },
      { id: "huye", name: "Huye" },
      { id: "kamonyi", name: "Kamonyi" },
      { id: "muhanga", name: "Muhanga" },
      { id: "nyamagabe", name: "Nyamagabe" },
      { id: "nyanza", name: "Nyanza" },
      { id: "nyaruguru", name: "Nyaruguru" },
      { id: "ruhango", name: "Ruhango" }
    ]
  },
  "eastern_province": {
    id: "eastern_province",
    name: "Eastern Province",
    districts: [
      { id: "bugesera", name: "Bugesera" },
      { id: "gatsibo", name: "Gatsibo" },
      { id: "kayonza", name: "Kayonza" },
      { id: "kirehe", name: "Kirehe" },
      { id: "ngoma", name: "Ngoma" },
      { id: "nyagatare", name: "Nyagatare" },
      { id: "rwamagana", name: "Rwamagana" }
    ]
  },
  "western_province": {
    id: "western_province",
    name: "Western Province",
    districts: [
      { id: "karongi", name: "Karongi" },
      { id: "ngororero", name: "Ngororero" },
      { id: "nyabihu", name: "Nyabihu" },
      { id: "nyamasheke", name: "Nyamasheke" },
      { id: "rubavu", name: "Rubavu" },
      { id: "rusizi", name: "Rusizi" },
      { id: "rutsiro", name: "Rutsiro" }
    ]
  }
};

// Bilingual translation mapping to support both English and Kinyarwanda stored values in the database
const PROVINCE_TRANSLATIONS: Record<string, string[]> = {
  "kigali city": ["kigali", "umujyi wa kigali", "kigali city"],
  "northern province": ["northern", "amajyaruguru", "northern province"],
  "southern province": ["southern", "amajyepfo", "southern province"],
  "eastern province": ["eastern", "iburasirazuba", "eastern province", "iburasirazuba province"],
  "western province": ["western", "iburengerazuba", "western province"]
};

export default function InsuredFarmersDirectory() {
  const { toast } = useToast();
  const [farmers, setFarmers] = useState<InsuredFarmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [sortBy, setSortBy] = useState<string>("name_asc");
  
  // Drawer states
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [side, setSide] = useState<"right" | "bottom">("right");

  // Selected administrative keys inside active filter form
  const [selectedProvinceKey, setSelectedProvinceKey] = useState<string>("ALL");
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>("ALL");

  // Filter form states
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [cropFilter, setCropFilter] = useState<string>("ALL");
  const [provinceFilter, setProvinceFilter] = useState<string>("");
  const [districtFilter, setDistrictFilter] = useState<string>("");
  const [minPremium, setMinPremium] = useState<string>("");
  const [maxPremium, setMaxPremium] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Applied filter state (copy of form states that trigger filtering)
  const [appliedFilters, setAppliedFilters] = useState({
    status: "ALL",
    crop: "ALL",
    province: "",
    district: "",
    minPremium: "",
    maxPremium: "",
    startDate: "",
    endDate: "",
  });

  // Handle mobile drawer responsiveness
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setSide("bottom");
      } else {
        setSide("right");
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const loadFarmers = async () => {
    setLoading(true);
    try {
      const data = await insurerService.getInsuredFarmers();
      setFarmers(data);
    } catch (error: any) {
      console.error("Failed to load insured farmers:", error);
      toast({
        title: "Error loading directory",
        description: error.message || "Could not retrieve farmers list. Make sure the backend is active.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFarmers();
  }, []);

  // Districts based on selected province key
  const availableDistricts = useMemo(() => {
    if (selectedProvinceKey === "ALL" || !RWANDA_GEOGRAPHY[selectedProvinceKey]) {
      return [];
    }
    return RWANDA_GEOGRAPHY[selectedProvinceKey].districts;
  }, [selectedProvinceKey]);

  // Handle province change
  const handleProvinceChange = (provinceKey: string) => {
    setSelectedProvinceKey(provinceKey);
    setSelectedDistrictId("ALL");
    setDistrictFilter("");

    if (provinceKey === "ALL") {
      setProvinceFilter("");
    } else {
      setProvinceFilter(RWANDA_GEOGRAPHY[provinceKey].name);
    }
  };

  // Handle district change
  const handleDistrictChange = (districtId: string) => {
    setSelectedDistrictId(districtId);
    if (districtId === "ALL" || selectedProvinceKey === "ALL") {
      setDistrictFilter("");
    } else {
      const dist = RWANDA_GEOGRAPHY[selectedProvinceKey].districts.find(d => d.id === districtId);
      setDistrictFilter(dist ? dist.name : "");
    }
  };

  // Handle Apply Filters
  const handleApplyFilters = () => {
    setAppliedFilters({
      status: statusFilter,
      crop: cropFilter,
      province: provinceFilter,
      district: districtFilter,
      minPremium,
      maxPremium,
      startDate,
      endDate,
    });
    setIsFilterOpen(false);
    toast({
      title: "Filters applied",
      description: "Farmers directory filtered successfully.",
    });
  };

  // Reset Filters
  const handleResetFilters = () => {
    setStatusFilter("ALL");
    setCropFilter("ALL");
    setProvinceFilter("");
    setDistrictFilter("");
    setSelectedProvinceKey("ALL");
    setSelectedDistrictId("ALL");
    setMinPremium("");
    maxPremium && setMaxPremium("");
    setStartDate("");
    setEndDate("");

    setAppliedFilters({
      status: "ALL",
      crop: "ALL",
      province: "",
      district: "",
      minPremium: "",
      maxPremium: "",
      startDate: "",
      endDate: "",
    });
    setIsFilterOpen(false);
    toast({
      title: "Filters cleared",
      description: "Displaying all registered farmers.",
    });
  };

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (appliedFilters.status !== "ALL") count++;
    if (appliedFilters.crop !== "ALL") count++;
    if (appliedFilters.province !== "") count++;
    if (appliedFilters.district !== "") count++;
    if (appliedFilters.minPremium !== "") count++;
    if (appliedFilters.maxPremium !== "") count++;
    if (appliedFilters.startDate !== "") count++;
    if (appliedFilters.endDate !== "") count++;
    return count;
  }, [appliedFilters]);

  // Perform search and filtering locally
  const filteredFarmers = useMemo(() => {
    return farmers.filter((farmer) => {
      // 1. Search Query Match
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = farmer.name.toLowerCase().includes(query);
        const matchesEmail = farmer.email.toLowerCase().includes(query);
        const matchesPhone = farmer.phoneNumber.includes(query);
        const matchesProvince = farmer.province?.toLowerCase().includes(query);
        const matchesDistrict = farmer.district?.toLowerCase().includes(query);
        const matchesCrop = farmer.latestPolicy?.cropType?.toLowerCase().includes(query);
        
        if (!matchesName && !matchesEmail && !matchesPhone && !matchesProvince && !matchesDistrict && !matchesCrop) {
          return false;
        }
      }

      // 2. Status Match
      if (appliedFilters.status !== "ALL") {
        if (farmer.status !== appliedFilters.status) return false;
      }

      // 3. Crop Type Match
      if (appliedFilters.crop !== "ALL") {
        const farmerCrop = farmer.latestPolicy?.cropType || "";
        if (farmerCrop.toUpperCase() !== appliedFilters.crop.toUpperCase()) return false;
      }

      // 4. Province Match
      if (appliedFilters.province) {
        const farmerProv = (farmer.province || "").toLowerCase().trim();
        const filterProv = appliedFilters.province.toLowerCase().trim();
        
        // Retrieve translated names for the selected province (e.g. "eastern province" matches "iburasirazuba")
        const allowedTerms = PROVINCE_TRANSLATIONS[filterProv] || [filterProv];
        
        // Match if the farmer's province overlaps with any translation variant
        const isMatch = allowedTerms.some(term => 
          farmerProv.includes(term) || term.includes(farmerProv)
        );
        
        if (!isMatch) return false;
      }

      // 5. District Match
      if (appliedFilters.district) {
        const farmerDist = (farmer.district || "").toLowerCase().trim();
        const filterDist = appliedFilters.district.toLowerCase().trim();
        const isMatch = farmerDist.includes(filterDist) || filterDist.includes(farmerDist);
        if (!isMatch) return false;
      }

      // 6. Premium Range Match
      if (appliedFilters.minPremium) {
        const premium = farmer.latestPolicy?.premiumAmount || 0;
        if (premium < parseFloat(appliedFilters.minPremium)) return false;
      }
      if (appliedFilters.maxPremium) {
        const premium = farmer.latestPolicy?.premiumAmount || 0;
        if (premium > parseFloat(appliedFilters.maxPremium)) return false;
      }

      // 7. Start/End Date Match
      if (appliedFilters.startDate && farmer.latestPolicy?.startDate) {
        const policyStart = new Date(farmer.latestPolicy.startDate);
        const filterStart = new Date(appliedFilters.startDate);
        if (policyStart < filterStart) return false;
      }
      if (appliedFilters.endDate && farmer.latestPolicy?.endDate) {
        const policyEnd = new Date(farmer.latestPolicy.endDate);
        const filterEnd = new Date(appliedFilters.endDate);
        if (policyEnd > filterEnd) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "name_asc") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "name_desc") {
        return b.name.localeCompare(a.name);
      }
      if (sortBy === "premium_high_low") {
        const premA = a.latestPolicy?.premiumAmount || 0;
        const premB = b.latestPolicy?.premiumAmount || 0;
        return premB - premA;
      }
      if (sortBy === "premium_low_high") {
        const premA = a.latestPolicy?.premiumAmount || 0;
        const premB = b.latestPolicy?.premiumAmount || 0;
        return premA - premB;
      }
      if (sortBy === "policies_desc") {
        return b.totalPoliciesCount - a.totalPoliciesCount;
      }
      if (sortBy === "newest") {
        const dateA = a.latestPolicy?.startDate ? new Date(a.latestPolicy.startDate).getTime() : 0;
        const dateB = b.latestPolicy?.startDate ? new Date(b.latestPolicy.startDate).getTime() : 0;
        return dateB - dateA;
      }
      return 0;
    });
  }, [farmers, searchQuery, appliedFilters, sortBy]);

  // Aggregate stats
  const stats = useMemo(() => {
    const total = farmers.length;
    const active = farmers.filter((f) => f.status === "ACTIVE").length;
    const totalPolicies = farmers.reduce((sum, f) => sum + f.totalPoliciesCount, 0);

    return { total, active, totalPolicies };
  }, [farmers]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadgeClass = (status: string) => {
    return status === "ACTIVE" 
      ? "bg-emerald-100/60 text-emerald-700 border border-emerald-200" 
      : "bg-gray-100/60 text-gray-500 border border-gray-200";
  };

  return (
    <div className="space-y-6">
      {/* Directory Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200/60">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="h-7 w-7 text-indigo-600" />
            Farmers Directory
          </h1>
          <p className="text-sm font-semibold text-gray-500 mt-1">
            Access records of all farmers with active crop coverage or past policy histories
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadFarmers}
            disabled={loading}
            className="border-gray-200 text-gray-700 bg-white hover:bg-gray-50 rounded-xl h-10 px-4 cursor-pointer flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 text-gray-500 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <div className="bg-white border border-gray-200 rounded-xl p-1 flex gap-0.5">
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8 rounded-lg cursor-pointer"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8 rounded-lg cursor-pointer"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="bg-white border-gray-200/60 shadow-sm rounded-2xl relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <Users className="h-20 w-20 text-indigo-600" />
          </div>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total Associated Farmers</p>
              <p className="text-2xl font-black text-slate-800 mt-1">{loading ? "..." : stats.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200/60 shadow-sm rounded-2xl relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <CheckCircle2 className="h-20 w-20 text-emerald-600" />
          </div>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Active Coverage</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-black text-slate-800">{loading ? "..." : stats.active}</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200/60 shadow-sm rounded-2xl relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <Shield className="h-20 w-20 text-blue-600" />
          </div>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total Issued Policies</p>
              <p className="text-2xl font-black text-slate-800 mt-1">{loading ? "..." : stats.totalPolicies}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Directory Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-4.5 w-4.5" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, phone, location..."
            className="pl-10 h-11 border-gray-200 rounded-xl bg-gray-50/30 focus-visible:ring-indigo-500 font-medium"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")} 
              className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Interactive Sort Selector */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider shrink-0 flex items-center gap-1.5">
            <ArrowUpDown className="h-3.5 w-3.5 text-indigo-500" />
            Sort By:
          </span>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="border-gray-200 rounded-xl h-11 bg-white focus:ring-indigo-500 font-bold text-xs text-gray-700 min-w-[170px] w-full sm:w-auto cursor-pointer">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name_asc">Name (A - Z)</SelectItem>
              <SelectItem value="name_desc">Name (Z - A)</SelectItem>
              <SelectItem value="premium_high_low">Premium (High to Low)</SelectItem>
              <SelectItem value="premium_low_high">Premium (Low to High)</SelectItem>
              <SelectItem value="policies_desc">Most Policies First</SelectItem>
              <SelectItem value="newest">Newest Covered First</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filter Drawer Trigger */}
        <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className={`h-11 rounded-xl px-5 border-gray-200 font-bold transition-all relative flex items-center gap-2 cursor-pointer ${
                activeFiltersCount > 0 
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100" 
                  : "bg-white hover:bg-gray-50 text-gray-700"
              }`}
            >
              <Filter className="h-4 w-4" />
              Advanced Filters
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-indigo-600 text-white rounded-full text-[10px] w-5 h-5 flex items-center justify-center border-2 border-white shadow-sm font-black">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </SheetTrigger>

          <SheetContent 
            side={side} 
            className={
              side === "bottom" 
                ? "h-[85vh] rounded-t-3xl flex flex-col p-0 bg-white border-t border-gray-100" 
                : "h-full w-full sm:max-w-md flex flex-col p-0 bg-white border-l border-gray-100"
            }
          >
            <SheetHeader className="p-6 border-b border-gray-50 text-left bg-slate-50/50 flex-shrink-0">
              <SheetTitle className="text-xl font-black text-slate-900 flex items-center gap-2.5">
                <SlidersHorizontal className="h-5 w-5 text-indigo-600" />
                Advanced Filters
              </SheetTitle>
              <SheetDescription className="text-sm font-semibold text-gray-500 mt-1">
                Refine the directory listings based on location, crop type, premium range, and dates.
              </SheetDescription>
            </SheetHeader>

            {/* Scrollable Filters Form */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Coverage Status */}
              <div className="space-y-2">
                <Label className="text-sm font-bold text-gray-700">Coverage Status</Label>
                <div className="grid grid-cols-3 gap-2">
                  {["ALL", "ACTIVE", "INACTIVE"].map((status) => (
                    <Button
                      key={status}
                      type="button"
                      variant={statusFilter === status ? "default" : "outline"}
                      className={`rounded-xl text-xs font-bold cursor-pointer h-10 ${
                        statusFilter === status 
                          ? "bg-slate-900 text-white hover:bg-slate-800" 
                          : "border-gray-200 hover:bg-slate-50 text-gray-600"
                      }`}
                      onClick={() => setStatusFilter(status)}
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Crop Type Select (Mapped from Project Enums) */}
              <div className="space-y-2">
                <Label className="text-sm font-bold text-gray-700">Crop Type</Label>
                <Select value={cropFilter} onValueChange={setCropFilter}>
                  <SelectTrigger className="border-gray-200 rounded-xl h-11 bg-white focus:ring-indigo-500 font-medium">
                    <SelectValue placeholder="Select crop type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Crops</SelectItem>
                    {COVERED_CROP_TYPES.map((crop) => (
                      <SelectItem key={crop} value={crop}>
                        {formatCropTypeLabel(crop)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Geographic Dropdowns (Provinces & Districts of Rwanda) */}
              <div className="space-y-4">
                <Label className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                  <Map className="h-4 w-4 text-indigo-500" />
                  Region Filters (Rwanda)
                </Label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Province Dropdown */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-500">Province</Label>
                    <Select 
                      value={selectedProvinceKey} 
                      onValueChange={handleProvinceChange}
                    >
                      <SelectTrigger className="border-gray-200 rounded-xl h-11 bg-white focus:ring-indigo-500 font-medium">
                        <SelectValue placeholder="All Provinces" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Provinces</SelectItem>
                        {Object.keys(RWANDA_GEOGRAPHY).map((key) => (
                          <SelectItem key={key} value={key}>
                            {RWANDA_GEOGRAPHY[key].name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* District Dropdown */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-500">District</Label>
                    <Select 
                      value={selectedDistrictId} 
                      onValueChange={handleDistrictChange}
                      disabled={selectedProvinceKey === "ALL"}
                    >
                      <SelectTrigger className="border-gray-200 rounded-xl h-11 bg-white focus:ring-indigo-500 font-medium">
                        <SelectValue placeholder={
                          selectedProvinceKey === "ALL" 
                            ? "Select a province first" 
                            : "All Districts"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Districts</SelectItem>
                        {availableDistricts.map((dist) => (
                          <SelectItem key={dist.id} value={dist.id}>
                            {dist.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Premium Range */}
              <div className="space-y-4">
                <Label className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4 text-indigo-500" />
                  Premium Range ($)
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="minPremium" className="text-xs font-semibold text-gray-500">Min Premium</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs">$</span>
                      <Input
                        id="minPremium"
                        type="number"
                        value={minPremium}
                        onChange={(e) => setMinPremium(e.target.value)}
                        placeholder="0"
                        className="pl-6 border-gray-200 rounded-xl h-10 bg-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="maxPremium" className="text-xs font-semibold text-gray-500">Max Premium</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs">$</span>
                      <Input
                        id="maxPremium"
                        type="number"
                        value={maxPremium}
                        onChange={(e) => setMaxPremium(e.target.value)}
                        placeholder="10000"
                        className="pl-6 border-gray-200 rounded-xl h-10 bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Policy Dates */}
              <div className="space-y-4">
                <Label className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-indigo-500" />
                  Coverage Period
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="startDate" className="text-xs font-semibold text-gray-500">Start Bound</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="border-gray-200 rounded-xl h-10 bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="endDate" className="text-xs font-semibold text-gray-500">End Bound</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="border-gray-200 rounded-xl h-10 bg-white"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Actions */}
            <div className="p-6 border-t border-gray-50 bg-slate-50/50 flex gap-3 flex-shrink-0">
              <Button
                variant="outline"
                className="flex-1 border-gray-200 rounded-xl h-12 font-bold hover:bg-gray-100 text-gray-700 cursor-pointer"
                onClick={handleResetFilters}
              >
                Clear All
              </Button>
              <Button
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 rounded-xl h-12 font-bold text-white shadow-sm shadow-indigo-100 cursor-pointer"
                onClick={handleApplyFilters}
              >
                Apply Filters
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Active Filters Summary Pills */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">Active:</span>
          {appliedFilters.status !== "ALL" && (
            <Badge variant="secondary" className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-lg px-2.5 py-1 text-xs text-indigo-700 font-bold flex items-center gap-1.5">
              Status: {appliedFilters.status}
              <X className="h-3 w-3 cursor-pointer opacity-70 hover:opacity-100" onClick={() => { setStatusFilter("ALL"); setAppliedFilters(prev => ({...prev, status: "ALL"})); }} />
            </Badge>
          )}
          {appliedFilters.crop !== "ALL" && (
            <Badge variant="secondary" className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-lg px-2.5 py-1 text-xs text-indigo-700 font-bold flex items-center gap-1.5">
              Crop: {formatCropTypeLabel(appliedFilters.crop)}
              <X className="h-3 w-3 cursor-pointer opacity-70 hover:opacity-100" onClick={() => { setCropFilter("ALL"); setAppliedFilters(prev => ({...prev, crop: "ALL"})); }} />
            </Badge>
          )}
          {appliedFilters.province && (
            <Badge variant="secondary" className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-lg px-2.5 py-1 text-xs text-indigo-700 font-bold flex items-center gap-1.5">
              Province: {appliedFilters.province}
              <X className="h-3 w-3 cursor-pointer opacity-70 hover:opacity-100" onClick={() => { setProvinceFilter(""); setSelectedProvinceKey("ALL"); setAppliedFilters(prev => ({...prev, province: ""})); }} />
            </Badge>
          )}
          {appliedFilters.district && (
            <Badge variant="secondary" className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-lg px-2.5 py-1 text-xs text-indigo-700 font-bold flex items-center gap-1.5">
              District: {appliedFilters.district}
              <X className="h-3 w-3 cursor-pointer opacity-70 hover:opacity-100" onClick={() => { setDistrictFilter(""); setSelectedDistrictId("ALL"); setAppliedFilters(prev => ({...prev, district: ""})); }} />
            </Badge>
          )}
          {(appliedFilters.minPremium || appliedFilters.maxPremium) && (
            <Badge variant="secondary" className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-lg px-2.5 py-1 text-xs text-indigo-700 font-bold flex items-center gap-1.5">
              Premium: ${appliedFilters.minPremium || "0"} - ${appliedFilters.maxPremium || "∞"}
              <X className="h-3 w-3 cursor-pointer opacity-70 hover:opacity-100" onClick={() => { setMinPremium(""); setMaxPremium(""); setAppliedFilters(prev => ({...prev, minPremium: "", maxPremium: ""})); }} />
            </Badge>
          )}
          {(appliedFilters.startDate || appliedFilters.endDate) && (
            <Badge variant="secondary" className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-lg px-2.5 py-1 text-xs text-indigo-700 font-bold flex items-center gap-1.5">
              Dates: {appliedFilters.startDate || "Any"} to {appliedFilters.endDate || "Any"}
              <X className="h-3 w-3 cursor-pointer opacity-70 hover:opacity-100" onClick={() => { setStartDate(""); setEndDate(""); setAppliedFilters(prev => ({...prev, startDate: "", endDate: ""})); }} />
            </Badge>
          )}
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleResetFilters}
            className="text-xs font-black text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-8 rounded-lg px-2 flex items-center gap-1 ml-1 cursor-pointer"
          >
            Clear Filters
          </Button>
        </div>
      )}

      {/* Content Section */}
      {loading ? (
        // Skeleton Loaders
        <div className={viewMode === "list" ? "space-y-4" : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5"}>
          {[1, 2, 3].map((idx) => (
            <Card key={idx} className="bg-white border-gray-100 shadow-sm rounded-2xl p-5">
              <div className="flex gap-4 animate-pulse">
                <div className="h-12 w-12 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-3 py-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : filteredFarmers.length === 0 ? (
        // Empty State
        <div className="bg-white border border-gray-200/80 rounded-3xl p-16 text-center max-w-xl mx-auto shadow-sm">
          <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-slate-100 shadow-inner">
            <Users className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-black text-slate-800">No Farmers Found</h3>
          <p className="text-gray-400 text-sm font-semibold mt-2 max-w-sm mx-auto leading-relaxed">
            There are no directory results matching your search terms or active advanced filter configurations.
          </p>
          <div className="flex justify-center gap-3 mt-6">
            <Button
              variant="outline"
              onClick={handleResetFilters}
              className="border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl h-11 px-4 cursor-pointer"
            >
              Reset Filters
            </Button>
            <Button
              onClick={() => setSearchQuery("")}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl h-11 px-4 cursor-pointer"
            >
              Clear Search Query
            </Button>
          </div>
        </div>
      ) : viewMode === "list" ? (
        // List Layout
        <div className="space-y-4">
          {filteredFarmers.map((farmer) => {
            const initials = getInitials(farmer.name);
            const statusLabel = farmer.status;
            
            return (
              <Card 
                key={farmer.id}
                className="bg-white border-gray-200/60 shadow-sm rounded-2xl hover:shadow-md transition-all group overflow-hidden"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between p-5 gap-5">
                  {/* Farmer Core Profile Details */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-black text-sm shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform overflow-hidden">
                      {farmer.profilePictureUrl ? (
                        <img 
                          src={farmer.profilePictureUrl} 
                          alt={farmer.name} 
                          className="h-full w-full object-cover" 
                        />
                      ) : (
                        initials
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-extrabold text-slate-800 leading-tight">
                          {farmer.name}
                        </h3>
                        <Badge className={`shadow-none px-2 py-0.5 rounded-md text-[10px] uppercase font-black tracking-wider ${getStatusBadgeClass(farmer.status)}`}>
                          {statusLabel}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center text-xs text-gray-500 font-semibold gap-x-4 gap-y-1">
                        <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-gray-400" /> {farmer.email}</span>
                        <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-gray-400" /> {farmer.phoneNumber}</span>
                        <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-gray-400" /> {farmer.district}, {farmer.province}</span>
                      </div>
                    </div>
                  </div>

                  {/* Coverage Details Card */}
                  <div className="flex items-center gap-5 flex-wrap lg:flex-nowrap border-t lg:border-t-0 border-slate-100 pt-4 lg:pt-0">
                    
                    {/* Policy stats */}
                    <div className="text-left lg:text-right space-y-1 lg:min-w-[120px]">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Policies Managed</p>
                      <div className="flex items-center lg:justify-end gap-1.5 mt-0.5">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-bold rounded-md px-1.5">
                          {farmer.totalPoliciesCount} Total
                        </Badge>
                        {farmer.activePoliciesCount > 0 && (
                          <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 font-bold rounded-md px-1.5 border border-indigo-100">
                            {farmer.activePoliciesCount} Active
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Latest Policy Box */}
                    {farmer.latestPolicy ? (
                      <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3 flex items-center gap-3.5 max-w-sm">
                        <div className="p-2 bg-white rounded-lg text-emerald-600 border border-slate-100 shadow-sm flex-shrink-0">
                          <Leaf className="h-4.5 w-4.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Latest Coverage</p>
                          <p className="text-xs font-black text-slate-800 mt-0.5 truncate leading-none">
                            {formatCropTypeLabel(farmer.latestPolicy.cropType)}
                          </p>
                          <p className="text-[10px] font-bold text-slate-500 mt-1 truncate">
                            Policy: {farmer.latestPolicy.policyNumber}
                          </p>
                        </div>
                        <div className="text-right border-l border-slate-200/60 pl-3 flex-shrink-0">
                          <p className="text-[9px] font-bold text-gray-400 uppercase">Premium</p>
                          <p className="text-xs font-extrabold text-indigo-600 mt-0.5">${farmer.latestPolicy.premiumAmount.toLocaleString()}</p>
                          {farmer.latestPolicy.endDate && (
                            <p className="text-[9px] font-semibold text-gray-500 mt-1">
                              Expires: {new Date(farmer.latestPolicy.endDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl py-3 px-6 text-center text-xs font-bold text-gray-400 min-w-[200px] flex items-center justify-center gap-2">
                        <Info className="h-4 w-4 text-gray-300" />
                        No associated policies
                      </div>
                    )}

                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        // Grid Layout
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {filteredFarmers.map((farmer) => {
            const initials = getInitials(farmer.name);
            const statusLabel = farmer.status;

            return (
              <Card 
                key={farmer.id}
                className="bg-white border-gray-200/60 shadow-sm rounded-2xl hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-5 flex-1 space-y-4">
                  {/* Top line with Avatar and Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="h-11 w-11 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-black text-sm shadow-sm group-hover:scale-105 transition-transform overflow-hidden">
                      {farmer.profilePictureUrl ? (
                        <img 
                          src={farmer.profilePictureUrl} 
                          alt={farmer.name} 
                          className="h-full w-full object-cover" 
                        />
                      ) : (
                        initials
                      )}
                    </div>
                    <Badge className={`shadow-none px-2 py-0.5 rounded-md text-[10px] uppercase font-black tracking-wider ${getStatusBadgeClass(farmer.status)}`}>
                      {statusLabel}
                    </Badge>
                  </div>

                  {/* Profile info */}
                  <div className="space-y-1">
                    <h3 className="text-base font-extrabold text-slate-800 leading-tight">
                      {farmer.name}
                    </h3>
                    <div className="space-y-1 text-xs text-gray-500 font-semibold pt-1">
                      <p className="flex items-center gap-1.5 truncate"><Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" /> {farmer.email}</p>
                      <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" /> {farmer.phoneNumber}</p>
                      <p className="flex items-center gap-1.5 truncate"><MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" /> {farmer.district}, {farmer.province}</p>
                    </div>
                  </div>

                  {/* Total policies count */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-bold rounded-md text-[10px]">
                      {farmer.totalPoliciesCount} Policies
                    </Badge>
                    {farmer.activePoliciesCount > 0 && (
                      <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 font-bold rounded-md text-[10px] border border-indigo-100">
                        {farmer.activePoliciesCount} Active
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Latest Policy Box (at grid item bottom) */}
                <div className="bg-slate-50/80 border-t border-slate-100/60 p-4 flex items-center justify-between gap-3 flex-shrink-0">
                  {farmer.latestPolicy ? (
                    <>
                      <div className="min-w-0">
                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Active Crop</p>
                        <p className="text-xs font-black text-slate-800 mt-0.5 truncate leading-none">
                          {formatCropTypeLabel(farmer.latestPolicy.cropType)}
                        </p>
                        <p className="text-[10px] font-semibold text-gray-500 mt-1 truncate">
                          No: {farmer.latestPolicy.policyNumber}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[8px] font-bold text-gray-400 uppercase">Premium</p>
                        <p className="text-xs font-extrabold text-indigo-600 mt-0.5">${farmer.latestPolicy.premiumAmount.toLocaleString()}</p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-[10px] font-bold text-gray-400 w-full flex items-center justify-center gap-1 py-1">
                      <Clock className="h-3.5 w-3.5 text-gray-300" />
                      No associated policy history
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
