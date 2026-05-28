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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

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
        getFarms(0, 100)
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

  const getPolicyFarmName = (policy: any) => {
    if (!policy) return "Unnamed Farm";
    const farm = policy.farmId;
    if (farm && typeof farm === 'object') {
      return farm.name || farmNameById.get(farm._id || farm.id) || "Unnamed Farm";
    }
    if (typeof farm === 'string') {
      return farmNameById.get(farm) || "Unnamed Farm";
    }
    return "Unnamed Farm";
  };

  const policyGroups = useMemo(() => {
    const pArr = Array.isArray(policies) ? policies : [];
    return {
      pending: pArr.filter(p => p.status === "PENDING_ACCEPTANCE"),
      active: pArr.filter(p => p.status === "ACTIVE"),
      declined: pArr.filter(p => p.status === "DECLINED"),
      others: pArr.filter(p => !["PENDING_ACCEPTANCE", "ACTIVE", "DECLINED"].includes(p.status))
    };
  }, [policies]);

  const handleAction = async () => {
    if (!actionDialog.policy || !actionDialog.type) return;
    
    const { policy, type } = actionDialog;
    const id = policy._id || policy.id;

    if ((type === "REJECT" || type === "FLAG") && reason.length < 5) {
      toast({
        title: "Error",
        description: "Please provide a reason of at least 5 characters.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (type === "ACCEPT") {
        await farmerAcknowledgePolicy(id);
        toast({ title: "Success", description: "Policy accepted! Your coverage is now active." });
      } else if (type === "REJECT") {
        await farmerRejectPolicy(id, reason);
        toast({ title: "Success", description: "Policy declined." });
      } else if (type === "FLAG") {
        await farmerFlagPolicyForCorrection(id, reason);
        toast({ title: "Success", description: "Policy flagged for correction." });
      }
      setActionDialog({ open: false, policy: null, type: null });
      setReason("");
      loadData();
    } catch (err: any) {
      console.error(`Failed to ${type} policy:`, err);
      toast({
        title: "Error",
        description: `Failed to ${type.toLowerCase()} policy. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openActionDialog = (type: "ACCEPT" | "REJECT" | "FLAG", policy: any) => {
    setActionDialog({ open: true, policy, type });
    setReason("");
    setTermsAccepted(false);
  };

  const [actionDialog, setActionDialog] = useState<{ open: boolean; policy: any; type: "ACCEPT" | "REJECT" | "FLAG" | null }>({ open: false, policy: null, type: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reason, setReason] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

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

      <div className="space-y-6">
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
                  <PolicyItem key={p._id || p.id} p={p} farmName={getPolicyFarmName(p)} onAction={openActionDialog} onViewDetails={onViewDetails} />
                ))}
                {policyGroups.active.map((p) => (
                  <PolicyItem key={p._id || p.id} p={p} farmName={getPolicyFarmName(p)} onAction={() => {}} onViewDetails={onViewDetails} />
                ))}
                {policyGroups.others.map((p) => (
                  <PolicyItem key={p._id || p.id} p={p} farmName={getPolicyFarmName(p)} onAction={() => {}} onViewDetails={onViewDetails} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Confirmation Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => !open && setActionDialog({ open: false, policy: null, type: null })}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === "ACCEPT" && "Confirm Policy Acceptance"}
              {actionDialog.type === "REJECT" && "Decline Policy Offer"}
              {actionDialog.type === "FLAG" && "Flag for Correction"}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.type === "ACCEPT" && "Are you sure you want to accept this policy? This will activate your coverage."}
              {actionDialog.type === "REJECT" && "Please provide a reason for declining this policy offer."}
              {actionDialog.type === "FLAG" && "What needs to be corrected in this policy offer?"}
            </DialogDescription>
          </DialogHeader>

          {actionDialog.policy && (
            <div className="space-y-4 pt-2">
              {(actionDialog.type === "REJECT" || actionDialog.type === "FLAG") && (
                <div className="space-y-2">
                  <Label className="text-gray-900 font-medium">
                    {actionDialog.type === "REJECT" ? "Reason for Rejection *" : "Correction Details *"}
                  </Label>
                  <Textarea 
                    value={reason} 
                    onChange={(e) => setReason(e.target.value)} 
                    placeholder={actionDialog.type === "REJECT" ? "Why are you rejecting this policy offer?" : "What needs to be corrected?"}
                    className="resize-none"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500">Please provide at least 5 characters.</p>
                </div>
              )}
              
              {actionDialog.type === "ACCEPT" && (
                <div className="space-y-4">
                  {actionDialog.policy.termsAndConditions ? (
                    <div className="p-4 bg-gray-50 rounded-lg border border-amber-200 text-sm">
                      <h4 className="font-bold mb-2 text-amber-900">Terms & Conditions</h4>
                      <div className="bg-white p-3 rounded border border-gray-200 max-h-40 overflow-y-auto mb-4 whitespace-pre-wrap text-gray-700">
                        {actionDialog.policy.termsAndConditions}
                      </div>
                      <div className="flex items-start space-x-2 mt-4">
                        <Checkbox 
                          id="modal-terms-accept" 
                          checked={termsAccepted}
                          onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                          className="mt-1"
                        />
                        <div className="grid gap-1.5 leading-none">
                          <label
                            htmlFor="modal-terms-accept"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700 cursor-pointer"
                          >
                            I have read and accept the terms and conditions
                          </label>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 text-sm">
                      <h4 className="font-bold mb-1">Terms & Conditions</h4>
                      <p className="text-gray-600">
                        By accepting this policy, you agree to the premium payment and coverage terms specified. 
                        Coverage will be effective from {actionDialog.policy.startDate ? format(new Date(actionDialog.policy.startDate), "PPP") : "TBD"}.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4">
                <Button variant="outline" onClick={() => setActionDialog({ open: false, policy: null, type: null })} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAction} 
                  disabled={
                    isSubmitting || 
                    ((actionDialog.type === "REJECT" || actionDialog.type === "FLAG") && reason.length < 5) ||
                    (actionDialog.type === "ACCEPT" && actionDialog.policy.termsAndConditions && !termsAccepted)
                  }
                  className={
                    actionDialog.type === "REJECT" ? "bg-red-600 hover:bg-red-700 text-white" : 
                    actionDialog.type === "FLAG" ? "bg-amber-600 hover:bg-amber-700 text-white" : 
                    "bg-green-600 hover:bg-green-700 text-white"
                  }
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {actionDialog.type === "REJECT" ? "Confirm Rejection" : 
                   actionDialog.type === "FLAG" ? "Submit Correction" : 
                   "Accept & Activate"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PolicyItem({ p, farmName, onAction, onViewDetails }: { p: any; farmName: string; onAction: (type: "ACCEPT" | "REJECT" | "FLAG", policy: any) => void; onViewDetails: (id: string) => void }) {
  const status = (p.status || "").toUpperCase();
  const premium = typeof p.premiumAmount === "number" ? p.premiumAmount.toLocaleString() : null;
  
  // Fallback calculation for older policies missing coverageAmount
  const fallbackCoverage = typeof p.premiumAmount === 'number' ? (
    p.coverageLevel === 'PREMIUM' ? p.premiumAmount * 20 :
    p.coverageLevel === 'STANDARD' ? p.premiumAmount * 15 :
    p.premiumAmount * 10
  ) : null;
  const coverage = p.coverageAmount || fallbackCoverage;

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
                : status === "NEEDS_CORRECTION"
                  ? "bg-orange-100 text-orange-700 border-orange-200"
                  : status === "DECLINED"
                    ? "bg-red-100 text-red-700 border-red-200"
                    : "bg-gray-100 text-gray-700 border-gray-200"
          }`}
        >
          {status === "PENDING_ACCEPTANCE" ? "Needs Review" : 
           status === "NEEDS_CORRECTION" ? "Needs Correction" : 
           status === "DECLINED" ? "Declined" :
           status === "ACTIVE" ? "Active" :
           status}
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4 text-xs">
        <div className="space-y-1">
          <div className="text-gray-400">Insurer</div>
          <div className="font-semibold text-gray-700 truncate">
            {p.insurerId?.insurerProfile?.companyName || p.insurerId?.companyName || p.insurer?.companyName || 
             (p.insurerId?.firstName || p.insurerId?.lastName ? `${p.insurerId.firstName || ''} ${p.insurerId.lastName || ''}`.trim() : "Verified Provider")}
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-gray-400">Coverage</div>
          <div className="font-semibold text-gray-700">RWF {coverage?.toLocaleString() || "N/A"}</div>
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
        {status === "PENDING_ACCEPTANCE" ? (
          <>
            <Button size="sm" variant="outline" onClick={() => onAction("REJECT", p)} className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
              Reject
            </Button>
            <Button size="sm" variant="outline" onClick={() => onAction("FLAG", p)} className="flex-1 border-amber-200 text-amber-600 hover:bg-amber-50 hover:text-amber-700">
              Flag Correction
            </Button>
            <Button size="sm" onClick={() => onAction("ACCEPT", p)} className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              Accept
            </Button>
          </>
        ) : (
          <Button 
            size="sm" 
            onClick={() => onViewDetails(p._id || p.id)}
            className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
          >
            View Details
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
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
import { farmerAcknowledgePolicy, farmerRejectPolicy, farmerFlagPolicyForCorrection } from "@/services/policiesApi";
