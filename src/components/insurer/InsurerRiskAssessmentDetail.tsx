import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, CheckCircle, AlertTriangle, MapPin, Download, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import assessmentsApiService from "@/services/assessmentsApi";
import { createPolicyFromAssessment } from "@/services/policiesApi";
import OverviewTab from "../assessor/tabs/OverviewTab";
import DroneTab from "../assessor/tabs/DroneTab";
import { WeatherAnalysisTab } from "../assessor/tabs/WeatherAnalysisTab";
import { BasicInfoTab } from "../assessor/tabs/BasicInfoTab";

export default function InsurerRiskAssessmentDetail({ 
  assessmentId, 
  onBack, 
  onActionComplete 
}: { 
  assessmentId: string; 
  onBack: () => void;
  onActionComplete: () => void;
}) {
  const { toast } = useToast();
  const [assessment, setAssessment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isCreatingPolicy, setIsCreatingPolicy] = useState(false);

  useEffect(() => {
    loadAssessment();
  }, [assessmentId]);

  const loadAssessment = async () => {
    setLoading(true);
    try {
      const response = await assessmentsApiService.getAssessmentById(assessmentId);
      setAssessment(response.data || response);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to load assessment details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await assessmentsApiService.approveAssessment(assessmentId);
      toast({ title: "Success", description: "Assessment approved successfully" });
      onActionComplete();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to approve", variant: "destructive" });
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      await assessmentsApiService.rejectAssessment(assessmentId, "Rejected by insurer");
      toast({ title: "Success", description: "Assessment rejected successfully" });
      onActionComplete();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to reject", variant: "destructive" });
    } finally {
      setIsRejecting(false);
    }
  };

  const handleCreatePolicy = async () => {
    setIsCreatingPolicy(true);
    try {
      await createPolicyFromAssessment(assessmentId);
      toast({ title: "Success", description: "Policy created successfully" });
      onActionComplete();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to create policy", variant: "destructive" });
    } finally {
      setIsCreatingPolicy(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-white border-gray-200">
        <CardContent className="p-12 text-center">
          <img src="/loading.gif" alt="Loading" className="w-16 h-16 mx-auto mb-4" />
          <p className="text-gray-500">Loading comprehensive assessment data...</p>
        </CardContent>
      </Card>
    );
  }

  if (!assessment) return null;

  const farm = assessment.farmId || assessment.farm || {};
  const farmer = assessment.farmerId || farm.farmerId || assessment.farmer || {};

  return (
    <div className="space-y-6">
      {/* Insurer Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <Button variant="ghost" onClick={onBack} className="mb-2 -ml-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to List
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Risk Assessment Review</h1>
          <p className="text-sm text-gray-600 flex items-center mt-1">
            <MapPin className="h-4 w-4 mr-1 text-gray-400" />
            {farm.name || "Unknown Farm"} • {farmer.name || farmer.email || "Unknown Farmer"}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {assessment.status === 'APPROVED' ? (
            <Button onClick={handleCreatePolicy} disabled={isCreatingPolicy} className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-10">
              <Shield className="h-4 w-4 mr-2" />
              {isCreatingPolicy ? "Creating..." : "Create Policy"}
            </Button>
          ) : assessment.status === 'SUBMITTED' || assessment.status === 'PENDING' ? (
            <>
              <Button onClick={handleReject} disabled={isRejecting} variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 rounded-xl h-10">
                Reject
              </Button>
              <Button onClick={handleApprove} disabled={isApproving} className="bg-green-600 hover:bg-green-700 text-white rounded-xl h-10">
                <CheckCircle className="h-4 w-4 mr-2" />
                {isApproving ? "Approving..." : "Approve Assessment"}
              </Button>
            </>
          ) : (
            <Badge className="bg-gray-100 text-gray-700 h-8 px-4 font-semibold border-none">
              {assessment.status}
            </Badge>
          )}
        </div>
      </div>

      {/* Reused Assessor Tabs for Data Representation */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-white border border-gray-100 p-1 mb-6 rounded-xl flex flex-wrap gap-2 justify-start shadow-sm h-auto">
          <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-gray-900 data-[state=active]:text-white">Overview</TabsTrigger>
          <TabsTrigger value="drone" className="rounded-lg data-[state=active]:bg-gray-900 data-[state=active]:text-white">Drone Analysis</TabsTrigger>
          <TabsTrigger value="weather" className="rounded-lg data-[state=active]:bg-gray-900 data-[state=active]:text-white">Weather Analysis</TabsTrigger>
          <TabsTrigger value="basic-info" className="rounded-lg data-[state=active]:bg-gray-900 data-[state=active]:text-white">Basic Info</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0">
          <OverviewTab assessment={assessment} farm={farm} farmer={farmer} />
        </TabsContent>
        <TabsContent value="drone" className="mt-0">
          <DroneTab assessment={assessment} mapImageUrl={null} isInsurerView={true} />
        </TabsContent>
        <TabsContent value="weather" className="mt-0">
          <WeatherAnalysisTab assessment={assessment} />
        </TabsContent>
        <TabsContent value="basic-info" className="mt-0">
          <BasicInfoTab 
            farm={farm} 
            farmer={farmer} 
            fieldStatistics={null} 
            weatherData={null}
            loadingData={false}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
