import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { ShieldCheck, FileText, ArrowRight, Hash, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPolicies } from "@/services/policiesApi";
import { getInsuranceRequests } from "@/services/farmsApi";
import { getFarms } from "@/services/farmsApi";
import { useToast } from "@/hooks/use-toast";

export default function InsuranceTab({ onViewDetails }: { onViewDetails: (id: string) => void }) {
  const { toast } = useToast();
  const [policies, setPolicies] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [farms, setFarms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [polRes, reqRes, farmsRes] = await Promise.all([
        getPolicies(1, 100),
        getInsuranceRequests(1, 100),
        getFarms(1, 100)
      ]);

      setPolicies(polRes?.data || polRes || []);
      setRequests(reqRes?.data?.items || reqRes?.items || []);
      setFarms(farmsRes?.data?.items || farmsRes?.items || []);
    } catch (err: any) {
      console.error('Failed to load insurance data:', err);
      toast({
        title: "Error",
        description: "Failed to load insurance information.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const farmNameById = useMemo(() => {
    const map = new Map();
    farms.forEach(f => map.set(f._id || f.id, f.name || "Unnamed Farm"));
    return map;
  }, [farms]);

  const policyGroups = useMemo(() => {
    const pArr = Array.isArray(policies) ? policies : [];
    return {
      pending: pArr.filter(p => p.status === "PENDING_ACCEPTANCE"),
      active: pArr.filter(p => p.status === "ACTIVE"),
      declined: pArr.filter(p => p.status === "DECLINED"),
      others: pArr.filter(p => !["PENDING_ACCEPTANCE", "ACTIVE", "DECLINED"].includes(p.status))
    };
  }, [policies]);

  const [reviewDialog, setReviewDialog] = useState<{ open: boolean; policy: any }>({ open: false, policy: null });
  const [isAccepting, setIsAccepting] = useState(false);

  const handleAcceptPolicy = async (id: string) => {
    setIsAccepting(true);
    try {
      await updatePolicy(id, { status: "ACTIVE" });
      toast({
        title: "Success",
        description: "Policy accepted! Your coverage is now active.",
      });
      setReviewDialog({ open: false, policy: null });
      loadData();
    } catch (err: any) {
      console.error('Failed to accept policy:', err);
      toast({
        title: "Error",
        description: "Failed to accept policy. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Insurance Policies</h1>
          <p className="text-gray-500 mt-1">
            Manage your active policies and track insurance requests.
          </p>
        </div>
      </div>

      {policyGroups.pending.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-amber-800 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-amber-600" />
              Awaiting your acceptance ({policyGroups.pending.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-amber-700 font-medium">
            You have {policyGroups.pending.length} policy offers from insurers. Please review and accept them to activate coverage.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-gray-200 shadow-sm bg-white">
            <CardHeader className="pb-2 border-b border-gray-50">
              <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                <ShieldCheck className="h-5 w-5 text-green-600" />
                Your Policies ({policies.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {policies.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <ShieldCheck className="h-12 w-12 mx-auto text-gray-200 mb-4" />
                  <p>No policies found. Register your farms and request insurance to get started.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {policyGroups.pending.map((p) => (
                    <PolicyItem key={p._id || p.id} p={p} farmName={farmNameById.get(p.farmId?._id || p.farmId)} onReview={() => setReviewDialog({ open: true, policy: p })} onViewDetails={onViewDetails} />
                  ))}
                  {policyGroups.active.map((p) => (
                    <PolicyItem key={p._id || p.id} p={p} farmName={farmNameById.get(p.farmId?._id || p.farmId)} onReview={() => {}} onViewDetails={onViewDetails} />
                  ))}
                  {policyGroups.others.map((p) => (
                    <PolicyItem key={p._id || p.id} p={p} farmName={farmNameById.get(p.farmId?._id || p.farmId)} onReview={() => {}} onViewDetails={onViewDetails} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-gray-200 shadow-sm bg-white">
            <CardHeader className="pb-2 border-b border-gray-50">
              <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                <Hash className="h-5 w-5 text-green-600" />
                Insurance Requests ({requests.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {requests.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-8">
                  No pending insurance requests.
                </div>
              ) : (
                <ul className="space-y-3">
                  {requests.map((r: any) => (
                    <li
                      key={r._id || r.id}
                      className="rounded-lg border border-gray-100 p-4 text-sm bg-gray-50/50 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <Badge variant="outline" className={`${
                          r.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                          r.status === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-200' :
                          'bg-gray-50 text-gray-700 border-gray-200'
                        }`}>
                          {r.status}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {r.createdAt ? format(new Date(r.createdAt), "MMM d, yyyy") : ""}
                        </span>
                      </div>
                      <div className="font-medium text-gray-900 mb-1">
                        Farm: {farmNameById.get(r.farmId?._id || r.farmId) || "Unnamed Farm"}
                      </div>
                      {r.notes && (
                        <p className="text-xs text-gray-500 line-clamp-2 italic">
                          "{r.notes}"
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Review Dialog */}
      <Dialog open={reviewDialog.open} onOpenChange={(open) => !open && setReviewDialog({ open: false, policy: null })}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Review Policy Offer</DialogTitle>
            <DialogDescription>
              Please review the insurance terms offered for your farm.
            </DialogDescription>
          </DialogHeader>
          {reviewDialog.policy && (
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-gray-500 uppercase font-bold">Policy Number</span>
                  <p className="font-medium">{reviewDialog.policy.policyNumber || "TBD"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-gray-500 uppercase font-bold">Farm</span>
                  <p className="font-medium">{farmNameById.get(reviewDialog.policy.farmId?._id || reviewDialog.policy.farmId)}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-gray-500 uppercase font-bold">Coverage Amount</span>
                  <p className="font-bold text-green-600">RWF {reviewDialog.policy.coverageAmount?.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-gray-500 uppercase font-bold">Premium Amount</span>
                  <p className="font-bold text-blue-600">RWF {reviewDialog.policy.premiumAmount?.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 text-sm">
                <h4 className="font-bold mb-1">Terms & Conditions</h4>
                <p className="text-gray-600">
                  By accepting this policy, you agree to the premium payment and coverage terms specified. 
                  Coverage will be effective from {reviewDialog.policy.startDate ? format(new Date(reviewDialog.policy.startDate), "PPP") : "TBD"}.
                </p>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <Button variant="outline" onClick={() => setReviewDialog({ open: false, policy: null })}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleAcceptPolicy(reviewDialog.policy._id || reviewDialog.policy.id)} 
                  disabled={isAccepting}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isAccepting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                  Accept Policy
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PolicyItem({ p, farmName, onReview, onViewDetails }: { p: any; farmName: string; onReview: () => void; onViewDetails: (id: string) => void }) {
  const status = (p.status || "").toUpperCase();
  const premium = typeof p.premiumAmount === "number" ? p.premiumAmount.toLocaleString() : null;

  return (
    <div className="rounded-xl border border-gray-100 p-5 hover:border-green-200 hover:shadow-md transition-all bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="font-bold text-gray-900 truncate">{p.policyNumber || "POLICY-PENDING"}</div>
          <div className="text-sm text-gray-500 mt-1 flex flex-wrap gap-x-4">
            <span className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {farmName || "Unnamed Farm"}
            </span>
            {p.cropType && <span>Crop: {p.cropType}</span>}
          </div>
        </div>
        <Badge
          className={`${
            status === "ACTIVE"
              ? "bg-green-100 text-green-700 border-green-200"
              : status === "PENDING_ACCEPTANCE"
                ? "bg-amber-100 text-amber-700 border-amber-200"
                : "bg-gray-100 text-gray-700 border-gray-200"
          }`}
        >
          {status === "PENDING_ACCEPTANCE" ? "Needs Review" : status}
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-xs">
        <div className="space-y-1">
          <div className="text-gray-400">Coverage</div>
          <div className="font-semibold text-gray-700">RWF {p.coverageAmount?.toLocaleString() || "N/A"}</div>
        </div>
        <div className="space-y-1">
          <div className="text-gray-400">Premium</div>
          <div className="font-semibold text-gray-700">RWF {premium || "N/A"}</div>
        </div>
        <div className="space-y-1">
          <div className="text-gray-400">Start Date</div>
          <div className="font-semibold text-gray-700">{p.startDate ? format(new Date(p.startDate), "MMM d, yyyy") : "TBD"}</div>
        </div>
        <div className="space-y-1">
          <div className="text-gray-400">Expiry Date</div>
          <div className="font-semibold text-gray-700">{p.endDate ? format(new Date(p.endDate), "MMM d, yyyy") : "TBD"}</div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button 
          size="sm" 
          onClick={() => status === 'PENDING_ACCEPTANCE' ? onReview() : onViewDetails(p._id || p.id)}
          className={`flex-1 gap-2 ${status === 'PENDING_ACCEPTANCE' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-green-600 hover:bg-green-700'}`}
        >
          {status === "PENDING_ACCEPTANCE" ? "Review & Accept" : "View Details"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

const Building2 = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M16 18h.01"/></svg>
);

const Hash = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="4" x2="20" y1="9" y2="9"/><line x1="4" x2="20" y1="15" y2="15"/><line x1="10" x2="8" y1="3" y2="21"/><line x1="16" x2="14" y1="3" y2="21"/></svg>
);

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { updatePolicy } from "@/services/policiesApi";
