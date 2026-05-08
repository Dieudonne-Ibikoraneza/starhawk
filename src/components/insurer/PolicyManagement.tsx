import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dashboardTheme } from "@/utils/dashboardTheme";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PolicyDetailsView from "./PolicyDetailsView";
import { getPolicies } from "@/services/policiesApi";
import { useToast } from "@/hooks/use-toast";
import { 
  Search,
  Filter,
  Eye,
  Shield,
  User,
  MapPin,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  X
} from "lucide-react";

interface Policy {
  id: string;
  policyNumber: string;
  farmerId: string;
  farmerName: string;
  cropType: string;
  coverageAmount: number;
  premiumAmount: number;
  startDate: string;
  endDate: string;
  status: "active" | "pending" | "expired" | "cancelled";
  location: string;
  farmSize: number;
  farmName: string;
  riskLevel: "low" | "medium" | "high";
  deductible: number;
  createdAt: string;
  coverageLevel: string;
}

interface PolicyManagementProps {
  selectedPolicyIdFromNav?: string | null;
  onClearPolicyNav?: () => void;
}

export default function PolicyManagement({ 
  selectedPolicyIdFromNav, 
  onClearPolicyNav 
}: PolicyManagementProps = {}) {
  const { toast } = useToast();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cropFilter, setCropFilter] = useState("all");
  const [viewingPolicy, setViewingPolicy] = useState<Policy | null>(null);

  // Load policies from API
  useEffect(() => {
    loadPolicies();
  }, []);

  // Handle auto-linking from claims
  useEffect(() => {
    if (selectedPolicyIdFromNav && policies.length > 0) {
      const found = policies.find(p => p.id === selectedPolicyIdFromNav);
      if (found) {
        setViewingPolicy(found);
      }
      if (onClearPolicyNav) {
        onClearPolicyNav();
      }
    }
  }, [selectedPolicyIdFromNav, policies]);

  const loadPolicies = async () => {
    setLoading(true);
    setError(null);
    try {
      const response: any = await getPolicies(1, 100);
      let policiesData: any[] = [];
      
      if (Array.isArray(response)) {
        policiesData = response;
      } else if (response && typeof response === 'object') {
        policiesData = response.data || response.policies || [];
      }
      
      // Map API response to Policy interface
      const mappedPolicies: Policy[] = policiesData.map((policy: any) => ({
        id: policy._id || policy.id || '',
        policyNumber: policy.policyNumber || (policy._id ? `POL-${policy._id.slice(-6).toUpperCase()}` : 'N/A'),
        farmerId: typeof policy.farmerId === 'object' && policy.farmerId
          ? (policy.farmerId._id || policy.farmerId.id || '') 
          : (policy.farmerId || policy.farmer?._id || policy.farmer?.id || ''),
        farmerName: (() => {
          const f = (typeof policy.farmerId === 'object' && policy.farmerId) || policy.farmer || {};
          if (f.firstName && f.lastName) return `${f.firstName} ${f.lastName}`;
          if (f.name) return f.name;
          if (typeof policy.farmerName === 'string') return policy.farmerName;
          return 'Unknown Farmer';
        })(),
        cropType: policy.cropType || policy.farmId?.cropType || 'Unknown',
        coverageAmount: policy.coverageAmount || policy.coverage || 0,
        premiumAmount: policy.premiumAmount || policy.premium || 0,
        startDate: policy.startDate || policy.validityPeriod?.start || new Date().toISOString().split('T')[0],
        endDate: policy.endDate || 
                 policy.validityPeriod?.end || 
                 (typeof policy.validityPeriod === 'string' ? policy.validityPeriod : '') || 
                 new Date().toISOString().split('T')[0],
        status: (() => {
          const s = (policy.status || 'pending').toUpperCase();
          if (s === 'PENDING_ACCEPTANCE') return 'pending';
          if (s === 'ACTIVE') return 'active';
          if (s === 'EXPIRED') return 'expired';
          if (s === 'CANCELLED' || s === 'DECLINED') return 'cancelled';
          return 'pending';
        })() as "active" | "pending" | "expired" | "cancelled",
        location: (() => {
          const loc = policy.location || policy.farmId?.locationName || policy.farm?.location;
          if (!loc) return 'Unknown';
          if (typeof loc === 'string') return loc;
          if (typeof loc === 'object') {
            if (loc.coordinates && Array.isArray(loc.coordinates) && loc.coordinates.length >= 2) {
              return `GPS: [${Number(loc.coordinates[1])?.toFixed(4)}, ${Number(loc.coordinates[0])?.toFixed(4)}]`;
            }
            if (loc.type) return `GeoJSON: ${loc.type}`;
            return JSON.stringify(loc);
          }
          return 'Unknown';
        })(),
        farmSize: policy.farmSize || policy.farmId?.area || policy.farm?.size || 0,
        farmName: policy.farmId?.name || 'Unknown Farm',
        riskLevel: (policy.riskLevel || 'medium').toLowerCase() as "low" | "medium" | "high",
        deductible: policy.deductible || 0,
        createdAt: policy.createdAt || policy.created || new Date().toISOString().split('T')[0],
        coverageLevel: policy.coverageLevel || "STANDARD",
      }));
      
      setPolicies(mappedPolicies);
    } catch (err: any) {
      console.error('Failed to load policies:', err);
      setError(err.message || 'Failed to load policies');
      toast({
        title: "Error",
        description: err.message || 'Failed to load policies',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "expired": return "bg-red-100 text-red-800";
      case "cancelled": return "bg-gray-700 text-white";
      default: return "bg-gray-700 text-white";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <CheckCircle className="h-4 w-4" />;
      case "pending": return <Clock className="h-4 w-4" />;
      case "expired": return <AlertTriangle className="h-4 w-4" />;
      case "cancelled": return <X className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case "low": return "bg-green-100 text-green-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "high": return "bg-red-100 text-red-800";
      default: return "bg-gray-700 text-white";
    }
  };

  const filteredPolicies = policies.filter(policy => {
    const matchesSearch = policy.farmerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         policy.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         policy.farmerId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || policy.status === statusFilter;
    const matchesCrop = cropFilter === "all" || policy.cropType === cropFilter;
    
    return matchesSearch && matchesStatus && matchesCrop;
  });

  const handleViewPolicy = (policy: Policy) => {
    setViewingPolicy(policy);
  };

  const handleBackToList = () => {
    setViewingPolicy(null);
  };

  // If viewing a specific policy, show the details view
  if (viewingPolicy) {
    return (
      <PolicyDetailsView
        policy={viewingPolicy}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Policy Management</h1>
        <p className="text-sm text-gray-600 mt-1">Review active and historical crop insurance policies</p>
      </div>

      {/* Filters */}
      <Card className="border border-gray-100 shadow-sm bg-white/70 backdrop-blur-md rounded-2xl">
        <CardContent className="p-5">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search policies by farmer name, ID, or policy ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 border-gray-200 focus-visible:ring-blue-500 rounded-xl"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 h-11 border-gray-200 rounded-xl">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={cropFilter} onValueChange={setCropFilter}>
                <SelectTrigger className="w-40 h-11 border-gray-200 rounded-xl">
                  <SelectValue placeholder="Crop Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Crops</SelectItem>
                  <SelectItem value="maize">Maize</SelectItem>
                  <SelectItem value="rice">Rice</SelectItem>
                  <SelectItem value="potatoes">Potatoes</SelectItem>
                  <SelectItem value="beans">Beans</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="bg-red-50 border-red-200 rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <p className="text-red-700 font-medium">{error}</p>
            </div>
            <Button
              onClick={loadPolicies}
              variant="outline"
              size="sm"
              className="border-red-200 text-red-700 hover:bg-red-100"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-5 grid-cols-2 md:grid-cols-4">
        <Card className="border border-gray-100 shadow-sm bg-white rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Total Policies</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{policies.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 shadow-sm bg-white rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Active Policies</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{policies.filter(p => p.status === 'active').length}</p>
              </div>
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center border border-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 shadow-sm bg-white rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Pending Policies</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{policies.filter(p => p.status === 'pending').length}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center border border-yellow-100">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 shadow-sm bg-white rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Total Coverage</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {(policies.reduce((sum, p) => sum + p.coverageAmount, 0) / 1000000).toFixed(1)}M RWF
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center border border-purple-100">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Policies Table */}
      <Card className="border border-gray-100 shadow-sm bg-white rounded-2xl">
        <CardHeader className="pb-3 border-b border-gray-100">
          <CardTitle className="text-lg font-bold text-gray-900">Policies ({filteredPolicies.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <Clock className="h-10 w-10 animate-spin text-blue-600 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Loading policies...</p>
              </div>
            </div>
          ) : filteredPolicies.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <Shield className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-500 text-sm">No policies found</p>
                {searchTerm || statusFilter !== "all" || cropFilter !== "all" ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                      setCropFilter("all");
                    }}
                    className="mt-3 rounded-xl border-gray-200"
                  >
                    Clear Filters
                  </Button>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70 text-gray-600 text-xs uppercase font-semibold">
                    <th className="py-4 px-4">Policy Number</th>
                    <th className="py-4 px-4">Farmer</th>
                    <th className="py-4 px-4">Crop</th>
                    <th className="py-4 px-4">Premium</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredPolicies.map((policy) => (
                    <tr key={policy.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-4 font-mono font-bold text-xs text-blue-600">{policy.policyNumber}</td>
                      <td className="py-4 px-4">
                        <div>
                          <div className="font-semibold text-gray-900">{policy.farmerName}</div>
                          <div className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1">
                            <MapPin className="h-2.5 w-2.5" /> {policy.location}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 capitalize font-semibold text-gray-900">{policy.cropType}</td>
                      <td className="py-4 px-4 font-semibold text-gray-700">{policy.premiumAmount.toLocaleString()} RWF</td>
                      <td className="py-4 px-4">
                        <Badge className={`${getStatusColor(policy.status)} border-0 text-[10px] font-bold shadow-none`}>
                          <span className="capitalize">{policy.status}</span>
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewPolicy(policy)}
                          className="h-8 w-8 p-0 rounded-lg hover:bg-gray-100"
                        >
                          <Eye className="h-4 w-4 text-gray-600" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
