import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, BarChart3, AlertTriangle, CheckCircle, Clock, Loader2, RefreshCw } from "lucide-react";
import { getClaims } from "@/services/claimsApi";
import assessmentsApiService from "@/services/assessmentsApi";
import { getUserId } from "@/services/authAPI";
import { useToast } from "@/hooks/use-toast";

export default function ReportsTab() {
  const { toast } = useToast();
  const farmerId = getUserId() || "";
  const [claims, setClaims] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const [claimsRes, assessmentsRes] = await Promise.all([
        getClaims(1, 100),
        assessmentsApiService.getAllAssessments()
      ]);

      const allClaims = claimsRes?.data?.items || claimsRes?.items || [];
      const farmerClaims = allClaims.filter((c: any) => {
        const id = c.farmerId?._id || c.farmerId || c.farmer?._id || c.farmer;
        return id === farmerId;
      });

      const allAssessments = assessmentsRes?.data || assessmentsRes || [];
      const farmerAssessments = allAssessments.filter((a: any) => {
        const id = a.farmerId?._id || a.farmerId || a.farm?.farmerId?._id || a.farm?.farmerId;
        return id === farmerId;
      });

      setClaims(farmerClaims);
      setAssessments(farmerAssessments);
    } catch (err: any) {
      console.error('Failed to load reports:', err);
      toast({
        title: "Error",
        description: "Failed to load reports.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED':
      case 'COMPLETED':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'REJECTED':
      case 'DECLINED':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'PENDING':
      case 'SUBMITTED':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 mt-1">View your claim history and risk assessment reports.</p>
        </div>
        <Button onClick={loadReports} variant="outline" size="sm" className="gap-2 border-gray-200">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="space-y-6">
        {/* Claim Reports */}
        <Card className="border-gray-200 shadow-sm bg-white overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-red-600" />
              Claim History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {claims.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-12 w-12 mx-auto text-gray-200 mb-4" />
                <p>No claims found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-white border-b border-gray-50">
                      <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Claim ID</th>
                      <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Crop</th>
                      <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Date</th>
                      <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Amount (RWF)</th>
                      <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {claims.map((claim) => (
                      <tr key={claim._id || claim.id} className="hover:bg-gray-50/30 transition-colors">
                        <td className="py-4 px-6 font-medium text-gray-900">{claim.claimNumber || (claim._id || claim.id).substring(0, 8)}</td>
                        <td className="py-4 px-6 text-gray-600">{claim.cropType || "N/A"}</td>
                        <td className="py-4 px-6 text-gray-600">{claim.createdAt ? new Date(claim.createdAt).toLocaleDateString() : "N/A"}</td>
                        <td className="py-4 px-6 text-gray-900 font-bold">{claim.estimatedLoss?.toLocaleString() || claim.amount?.toLocaleString() || "0"}</td>
                        <td className="py-4 px-6">
                          <Badge className={getStatusColor(claim.status)}>{claim.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Risk Assessment Reports */}
        <Card className="border-gray-200 shadow-sm bg-white overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Risk Assessments
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {assessments.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto text-gray-200 mb-4" />
                <p>No risk assessments found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-white border-b border-gray-50">
                      <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase">ID</th>
                      <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Type</th>
                      <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Date</th>
                      <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Risk Score</th>
                      <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {assessments.map((a) => (
                      <tr key={a._id || a.id} className="hover:bg-gray-50/30 transition-colors">
                        <td className="py-4 px-6 font-medium text-gray-900">{(a._id || a.id).substring(0, 8)}</td>
                        <td className="py-4 px-6 text-gray-600">{a.type || "Assessment"}</td>
                        <td className="py-4 px-6 text-gray-600">{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "N/A"}</td>
                        <td className="py-4 px-6">
                          {a.riskScore ? (
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className={`h-full ${a.riskScore > 70 ? 'bg-red-500' : a.riskScore > 40 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                  style={{ width: `${a.riskScore}%` }}
                                />
                              </div>
                              <span className="font-bold text-gray-900">{a.riskScore}%</span>
                            </div>
                          ) : "N/A"}
                        </td>
                        <td className="py-4 px-6">
                          <Badge className={getStatusColor(a.status)}>{a.status}</Badge>
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
    </div>
  );
}
