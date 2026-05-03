import { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
  ArrowLeft, ShieldCheck, Loader2, CheckCircle2, 
  Calendar, Hash, Sprout, Building2, FileText, 
  AlertCircle, ChevronRight, FileCheck, Shield, Clock,
  DollarSign, ArrowUpRight
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getPolicyById, updatePolicy } from "@/services/policiesApi";
import { useToast } from "@/hooks/use-toast";

interface PolicyDetailsTabProps {
  policyId: string;
  onBack: () => void;
  onFileClaim: (policyId: string) => void;
}

export default function PolicyDetailsTab({ policyId, onBack, onFileClaim }: PolicyDetailsTabProps) {
  const { toast } = useToast();
  const [policy, setPolicy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    loadPolicy();
  }, [policyId]);

  const loadPolicy = async () => {
    setLoading(true);
    try {
      const response = await getPolicyById(policyId);
      setPolicy(response?.data || response);
    } catch (err: any) {
      console.error('Failed to load policy details:', err);
      toast({
        title: "Error",
        description: "Could not load policy details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      await updatePolicy(policyId, { status: "ACTIVE" });
      toast({
        title: "Policy Activated",
        description: "Your insurance coverage is now active.",
      });
      loadPolicy();
    } catch (err: any) {
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
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-green-600" />
      </div>
    );
  }

  if (!policy) return null;

  const isPending = policy.status?.toUpperCase() === "PENDING_ACCEPTANCE";
  const isActive = policy.status?.toUpperCase() === "ACTIVE";

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="group -ml-2 text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Insurance
          </Button>
          <div className="flex items-center gap-4">
            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center border shadow-sm ${
              isActive ? 'bg-green-50 text-green-600 border-green-100' : 'bg-amber-50 text-amber-600 border-amber-100'
            }`}>
              <ShieldCheck className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">{policy.policyNumber || "SH-POLICY-TBD"}</h1>
                <Badge className={
                  isActive ? "bg-green-100 text-green-700 hover:bg-green-100" :
                  isPending ? "bg-amber-100 text-amber-700 hover:bg-amber-100 animate-pulse" :
                  "bg-gray-100 text-gray-700"
                }>
                  {policy.status}
                </Badge>
              </div>
              <p className="text-gray-500 mt-1 flex items-center gap-2">
                <Sprout className="h-4 w-4" />
                {policy.farmName || policy.farm?.name || "Assigned Farm"}
              </p>
            </div>
          </div>
        </div>

        {isActive && (
          <Button 
            onClick={() => onFileClaim(policyId)}
            className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200 gap-2"
          >
            <AlertCircle className="h-4 w-4" />
            File a Claim
          </Button>
        )}
      </div>

      {isPending && (
        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white shadow-xl shadow-amber-100/20 overflow-hidden">
          <div className="h-1 bg-amber-400 w-full" />
          <CardHeader>
            <CardTitle className="text-amber-800 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Action Required: Review & Activate
            </CardTitle>
            <CardDescription className="text-amber-700/80">
              Your insurer has proposed these terms. Review the coverage and premium below to activate your insurance.
            </CardDescription>
          </CardHeader>
          <CardFooter className="bg-amber-50/50 border-t border-amber-100 pt-6 pb-6">
            <div className="flex gap-4 w-full md:w-auto">
              <Button 
                onClick={handleAccept} 
                disabled={isAccepting}
                className="flex-1 md:flex-none bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-200 font-bold px-8"
              >
                {isAccepting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileCheck className="h-4 w-4 mr-2" />}
                Accept & Activate Coverage
              </Button>
              <Button variant="outline" className="flex-1 md:flex-none border-amber-200 text-amber-700 hover:bg-white">
                Decline Offer
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Coverage Summary */}
          <Card className="border-gray-200 shadow-sm bg-white">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-[rgba(20,40,75,1)]" />
                Coverage Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Coverage</span>
                    <div className="text-4xl font-black text-gray-900 flex items-baseline gap-1">
                      <span className="text-lg font-bold text-gray-400">RWF</span>
                      {policy.coverageAmount?.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Premium Paid</span>
                    <div className="text-2xl font-bold text-blue-600 flex items-baseline gap-1">
                      <span className="text-sm font-bold text-blue-400">RWF</span>
                      {policy.premiumAmount?.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 transition-hover hover:border-[rgba(20,40,75,0.2)]">
                    <Calendar className="h-10 w-10 text-[rgba(20,40,75,0.5)]" />
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Coverage Period</span>
                      <div className="text-sm font-bold text-gray-900">
                        {policy.startDate ? format(new Date(policy.startDate), "MMM d, yyyy") : "TBD"} — {policy.endDate ? format(new Date(policy.endDate), "MMM d, yyyy") : "TBD"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <Building2 className="h-10 w-10 text-[rgba(20,40,75,0.5)]" />
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Insurer Provider</span>
                      <div className="text-sm font-bold text-gray-900">
                        {policy.insurer?.companyName || "Verified Provider"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* History / Timeline */}
          <Card className="border-gray-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-600" />
                Policy Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-50">
                <TimelineItem 
                  title="Policy Accepted" 
                  date={policy.farmerAcknowledgedAt || policy.updatedAt} 
                  description="You reviewed and activated the insurance coverage."
                  completed={!!policy.farmerAcknowledgedAt || isActive}
                />
                <TimelineItem 
                  title="Policy Issued" 
                  date={policy.issuedAt || policy.createdAt} 
                  description="Insurers generated the policy based on field assessment."
                  completed={true}
                />
                <TimelineItem 
                  title="Field Assessment Completed" 
                  date={policy.createdAt} 
                  description="Assessor verified field data and risk factors."
                  completed={true}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar: Quick Info */}
        <div className="space-y-8">
          <Card className="border-gray-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500">Key Parameters</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <QuickDetail label="Coverage Type" value={policy.coverageLevel || "Standard"} icon={<Shield className="h-4 w-4" />} />
              <QuickDetail label="Policy ID" value={policy.policyNumber || policyId.substring(0, 8)} icon={<Hash className="h-4 w-4" />} mono />
              <QuickDetail label="Insured Crop" value={policy.cropType || "Maize"} icon={<Sprout className="h-4 w-4" />} />
              <Separator />
              <div className="pt-2">
                <Button variant="ghost" className="w-full justify-between text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold group">
                  Download PDF Certificate
                  <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Claims Warning */}
          {!isPending && (
            <Card className="bg-red-50 border-red-100 shadow-none">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-red-900">Need to file a claim?</h4>
                    <p className="text-sm text-red-700 mt-1 leading-relaxed">
                      If you've experienced crop loss due to weather or pests, you can submit a claim directly under this policy.
                    </p>
                    <Button 
                      variant="link" 
                      className="text-red-700 p-0 h-auto font-bold mt-2 hover:no-underline hover:text-red-900"
                      onClick={() => onFileClaim(policyId)}
                    >
                      Start Claim Process →
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function QuickDetail({ label, value, icon, mono }: { label: string; value: string; icon: any; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-gray-500">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <span className={`text-xs font-bold text-gray-900 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

function TimelineItem({ title, date, description, completed }: { title: string; date: string; description: string; completed: boolean }) {
  return (
    <div className="p-6 flex gap-4 transition-colors hover:bg-gray-50/50">
      <div className="flex flex-col items-center">
        <div className={`h-6 w-6 rounded-full flex items-center justify-center border-2 ${
          completed ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-200 text-gray-300'
        }`}>
          {completed && <CheckCircle2 className="h-4 w-4" />}
        </div>
        <div className="w-0.5 h-full bg-gray-100 mt-2" />
      </div>
      <div className="space-y-1 pb-2">
        <div className="flex items-center gap-2">
          <h4 className={`text-sm font-bold ${completed ? 'text-gray-900' : 'text-gray-400'}`}>{title}</h4>
          {date && <span className="text-[10px] text-gray-400 font-medium">{format(new Date(date), "MMM d, yyyy")}</span>}
        </div>
        <p className="text-xs text-gray-500 leading-relaxed max-w-md">
          {description}
        </p>
      </div>
    </div>
  );
}
