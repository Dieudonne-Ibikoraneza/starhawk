import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Loader2, 
  RefreshCw, 
  Search, 
  Shield, 
  Eye, 
  Calendar, 
  Coins, 
  HelpCircle,
  X,
  FileSpreadsheet
} from "lucide-react";
import { getClaims } from "@/services/claimsApi";
import { getUserId } from "@/services/authAPI";
import { useToast } from "@/hooks/use-toast";

interface ClaimsTabProps {
  onFileClaim: () => void;
}

export default function ClaimsTab({ onFileClaim }: ClaimsTabProps) {
  const { toast } = useToast();
  const farmerId = getUserId() || "";
  const [claims, setClaims] = useState<any[]>([]);
  const [filteredClaims, setFilteredClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedClaim, setSelectedClaim] = useState<any | null>(null);

  useEffect(() => {
    loadClaims();
  }, []);

  useEffect(() => {
    let result = claims;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => {
        const idStr = (c._id || c.id || "").toLowerCase();
        const numStr = (c.claimNumber || "").toLowerCase();
        const descStr = (c.lossDescription || "").toLowerCase();
        const eventType = (c.lossEventType || "").toLowerCase();
        const farmName = (c.farmId?.name || "").toLowerCase();
        
        return idStr.includes(q) || 
               numStr.includes(q) || 
               descStr.includes(q) || 
               eventType.includes(q) ||
               farmName.includes(q);
      });
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter(c => c.status?.toUpperCase() === statusFilter.toUpperCase());
    }

    setFilteredClaims(result);
  }, [searchQuery, statusFilter, claims]);

  const loadClaims = async () => {
    setLoading(true);
    try {
      const response = await getClaims(1, 100);
      const allClaims = response?.data?.items || response?.items || response?.data || response || [];
      
      // Filter claims by the logged-in farmer
      const farmerClaims = allClaims.filter((c: any) => {
        const id = c.farmerId?._id || c.farmerId || c.farmer?._id || c.farmer;
        return id === farmerId;
      });

      setClaims(farmerClaims);
    } catch (err: any) {
      console.error('Failed to load claims:', err);
      toast({
        title: "Error loading claims",
        description: err.message || "Failed to load claims.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toUpperCase() || "FILED";
    switch (s) {
      case 'APPROVED':
      case 'COMPLETED':
        return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-semibold">Approved</Badge>;
      case 'REJECTED':
      case 'DECLINED':
        return <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-full text-xs font-semibold">Rejected</Badge>;
      case 'ASSIGNED':
      case 'IN_PROGRESS':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-full text-xs font-semibold">Under Assessment</Badge>;
      case 'FILED':
      case 'SUBMITTED':
      default:
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-full text-xs font-semibold">Filed</Badge>;
    }
  };

  const formatLossEventLabel = (label: string) => {
    if (!label) return "N/A";
    return label.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  };

  // Stats Calculations
  const totalClaims = claims.length;
  const pendingClaims = claims.filter(c => ['FILED', 'ASSIGNED', 'IN_PROGRESS', 'SUBMITTED'].includes(c.status?.toUpperCase())).length;
  const approvedClaims = claims.filter(c => ['APPROVED', 'COMPLETED'].includes(c.status?.toUpperCase())).length;
  const rejectedClaims = claims.filter(c => ['REJECTED', 'DECLINED'].includes(c.status?.toUpperCase())).length;
  const totalPayout = claims.reduce((acc, c) => acc + (c.payoutAmount || 0), 0);

  if (loading) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Claim History</h1>
          <p className="text-gray-500 mt-1">Track and manage your agricultural insurance claims and payouts.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={loadClaims} variant="outline" className="gap-2 border-gray-200 hover:bg-gray-50">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={onFileClaim} className="bg-green-600 hover:bg-green-700 text-white gap-2 font-medium !rounded-none">
            <AlertTriangle className="h-4 w-4" />
            File New Claim
          </Button>
        </div>
      </div>

      {/* Stats Cards Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-gray-200 shadow-sm bg-white">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Claims</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-gray-900">{totalClaims}</span>
              <FileSpreadsheet className="h-4 w-4 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200 shadow-sm bg-white">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pending</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-amber-600">{pendingClaims}</span>
              <Clock className="h-4 w-4 text-amber-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200 shadow-sm bg-white">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Approved</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-emerald-600">{approvedClaims}</span>
              <CheckCircle className="h-4 w-4 text-emerald-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200 shadow-sm bg-white">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Rejected</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-rose-600">{rejectedClaims}</span>
              <X className="h-4 w-4 text-rose-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 lg:col-span-1 border-gray-200 shadow-sm bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">Total Payout Received</p>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-xl font-black text-green-800">{totalPayout.toLocaleString()}</span>
              <span className="text-xs font-semibold text-green-700">RWF</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 border border-gray-200 rounded-xl shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search by Claim ID, event type, description, or farm..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 border-gray-200 focus-visible:ring-green-500 !rounded-none"
          />
        </div>
        <div className="w-full sm:w-48">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="border-gray-200 focus-visible:ring-green-500 !rounded-none">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="filed">Filed</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="in_progress">Under Assessment</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Claims Table Card */}
      <Card className="border-gray-200 shadow-sm bg-white overflow-hidden">
        <CardContent className="p-0">
          {filteredClaims.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <FileText className="h-16 w-16 mx-auto text-gray-200 mb-4" />
              <p className="text-lg font-medium text-gray-700">No claims found</p>
              <p className="text-sm text-gray-400 mt-1">Try resetting your search query or status filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/75 border-b border-gray-200 text-left">
                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Claim ID</th>
                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Farm Name</th>
                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Loss Type</th>
                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Event Date</th>
                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Payout</th>
                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="py-4 px-6 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredClaims.map((claim) => (
                    <tr key={claim._id || claim.id} className="hover:bg-gray-50/20 transition-colors group">
                      <td className="py-4 px-6 font-semibold text-gray-900 group-hover:text-green-700 transition-colors">
                        {claim.claimNumber || (claim._id || claim.id).substring(0, 8).toUpperCase()}
                      </td>
                      <td className="py-4 px-6 text-gray-600 font-medium">
                        {claim.farmId?.name || "N/A"}
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1.5 font-medium text-gray-700">
                          {formatLossEventLabel(claim.lossEventType)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-500 text-sm">
                        {claim.lossEventDate 
                          ? new Date(claim.lossEventDate).toLocaleDateString() 
                          : claim.filedAt 
                            ? new Date(claim.filedAt).toLocaleDateString()
                            : "N/A"}
                      </td>

                      <td className="py-4 px-6 font-extrabold text-emerald-700">
                        {claim.payoutAmount ? `${claim.payoutAmount.toLocaleString()} RWF` : "—"}
                      </td>
                      <td className="py-4 px-6">
                        {getStatusBadge(claim.status)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Button 
                          onClick={() => setSelectedClaim(claim)} 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 hover:bg-gray-100 text-gray-500 hover:text-gray-900"
                        >
                          <Eye className="h-4 w-4" />
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

      {/* Claim Detailed Modal */}
      {selectedClaim && (
        <Dialog open={!!selectedClaim} onOpenChange={(open) => !open && setSelectedClaim(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white border border-gray-200 shadow-2xl p-0 scrollbar-none !rounded-none">
            <DialogHeader className="p-6 bg-gray-50 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    Claim #{selectedClaim.claimNumber || (selectedClaim._id || selectedClaim.id).substring(0, 8).toUpperCase()}
                  </DialogTitle>
                  <DialogDescription className="text-sm text-gray-500 mt-1">
                    Filed on {new Date(selectedClaim.filedAt).toLocaleDateString()}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="p-6 space-y-6">
              {/* Progress Flow Tracker */}
              <div className="bg-white border border-gray-100 p-5 rounded-xl shadow-sm">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Claim Status Tracking</h4>
                <div className="grid grid-cols-4 gap-2 relative">
                  {/* Lines between step icons */}
                  <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200 -z-10" />
                  
                  {/* Step 1: Filed */}
                  <div className="flex flex-col items-center text-center">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-md">1</div>
                    <span className="text-xs font-semibold text-gray-800 mt-2">Filed</span>
                    <span className="text-[10px] text-gray-400 mt-0.5">{new Date(selectedClaim.filedAt).toLocaleDateString()}</span>
                  </div>

                  {/* Step 2: Under Assessment */}
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      ['ASSIGNED', 'IN_PROGRESS', 'APPROVED', 'COMPLETED', 'REJECTED', 'DECLINED'].includes(selectedClaim.status?.toUpperCase())
                        ? "bg-emerald-600 text-white shadow-md"
                        : "bg-gray-200 text-gray-400"
                    }`}>2</div>
                    <span className="text-xs font-semibold text-gray-800 mt-2">Assessed</span>
                  </div>

                  {/* Step 3: Review */}
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      ['APPROVED', 'COMPLETED', 'REJECTED', 'DECLINED'].includes(selectedClaim.status?.toUpperCase())
                        ? "bg-emerald-600 text-white shadow-md"
                        : "bg-gray-200 text-gray-400"
                    }`}>3</div>
                    <span className="text-xs font-semibold text-gray-800 mt-2">Reviewed</span>
                  </div>

                  {/* Step 4: Outcome */}
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      ['APPROVED', 'COMPLETED'].includes(selectedClaim.status?.toUpperCase())
                        ? "bg-green-600 text-white shadow-md border-2 border-green-200"
                        : ['REJECTED', 'DECLINED'].includes(selectedClaim.status?.toUpperCase())
                          ? "bg-rose-600 text-white shadow-md border-2 border-rose-200"
                          : "bg-gray-200 text-gray-400"
                    }`}>4</div>
                    <span className="text-xs font-semibold text-gray-800 mt-2">
                      {['APPROVED', 'COMPLETED'].includes(selectedClaim.status?.toUpperCase()) 
                        ? "Approved" 
                        : ['REJECTED', 'DECLINED'].includes(selectedClaim.status?.toUpperCase()) 
                          ? "Rejected" 
                          : "Decision"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Main Information Cards */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="border-gray-100 bg-gray-50/50 shadow-sm">
                  <CardHeader className="py-3 px-4 bg-gray-50 border-b border-gray-100">
                    <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                      <Shield className="h-4 w-4 text-green-600" />
                      Policy & Farm Info
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3 text-sm">
                    <div className="flex justify-between border-b border-gray-100 pb-1.5">
                      <span className="text-gray-500">Farm Name</span>
                      <span className="font-semibold text-gray-900">{selectedClaim.farmId?.name || "N/A"}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-1.5">
                      <span className="text-gray-500">Crop Type</span>
                      <span className="font-semibold text-gray-900 capitalize">{selectedClaim.farmId?.cropType || "N/A"}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-1.5">
                      <span className="text-gray-500">Policy Number</span>
                      <span className="font-semibold text-gray-900 font-mono text-xs">
                        {selectedClaim.policyId?.policyNumber || (selectedClaim.policyId?._id || selectedClaim.policyId || "").substring(0, 10).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Coverage Level</span>
                      <span className="font-semibold text-gray-900">{selectedClaim.policyId?.coverageLevel || "80%"}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gray-100 bg-gray-50/50 shadow-sm">
                  <CardHeader className="py-3 px-4 bg-gray-50 border-b border-gray-100">
                    <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                      <Coins className="h-4 w-4 text-amber-500" />
                      Loss & Valuation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3 text-sm">
                    <div className="flex justify-between border-b border-gray-100 pb-1.5">
                      <span className="text-gray-500">Loss Event Type</span>
                      <span className="font-bold text-red-600">{formatLossEventLabel(selectedClaim.lossEventType)}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-1.5">
                      <span className="text-gray-500">Incident Date</span>
                      <span className="font-semibold text-gray-900">
                        {selectedClaim.lossEventDate ? new Date(selectedClaim.lossEventDate).toLocaleDateString() : "N/A"}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500">Approved Payout</span>
                      <span className="font-extrabold text-emerald-700">{selectedClaim.payoutAmount ? `${selectedClaim.payoutAmount.toLocaleString()} RWF` : "Pending Assessment"}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Loss Description */}
              {selectedClaim.lossDescription && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-700">Detailed Loss Description</h4>
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 text-sm text-gray-700 leading-relaxed italic">
                    "{selectedClaim.lossDescription}"
                  </div>
                </div>
              )}

              {/* Rejection Reason (If Rejected) */}
              {['REJECTED', 'DECLINED'].includes(selectedClaim.status?.toUpperCase()) && selectedClaim.rejectionReason && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-rose-800">Rejection Reason</h4>
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-sm text-rose-800 leading-relaxed">
                    {selectedClaim.rejectionReason}
                  </div>
                </div>
              )}

              {/* Damage Evidence Photos */}
              {selectedClaim.damagePhotos && selectedClaim.damagePhotos.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700">Uploaded Damage Evidence Photos ({selectedClaim.damagePhotos.length})</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {selectedClaim.damagePhotos.map((photo: string, index: number) => (
                      <div key={index} className="relative aspect-video rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shadow-sm group hover:shadow-md transition-all">
                        <img 
                          src={photo} 
                          alt={`Evidence Photo ${index + 1}`} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                          <span className="text-white text-xs font-semibold px-2.5 py-1 bg-black/60 rounded-lg">Photo {index + 1}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
              <Button 
                onClick={() => setSelectedClaim(null)} 
                variant="outline" 
                className="border-gray-200 hover:bg-gray-100 font-medium text-gray-700 !rounded-none"
              >
                Close Details
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
