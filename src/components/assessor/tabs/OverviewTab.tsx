import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  FileText, 
  Download, 
  CheckCircle2, 
  Clock, 
  Calendar,
  User,
  MapPin,
  TrendingUp,
  Wind,
  Droplets,
  Thermometer,
  ShieldAlert
} from "lucide-react";
import { useComprehensiveNotes } from "@/hooks/useComprehensiveNotes";
import { 
  calculateOverallRisk, 
  formatRiskPercent,
  RiskAssessment
} from "@/utils/riskCalculation";
import { ComprehensiveReportGenerator } from "@/utils/reportGenerator";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { apiClient } from "@/lib/api";

interface OverviewTabProps {
  assessment: any;
  onRefresh?: () => void;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ assessment, onRefresh }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { notes } = useComprehensiveNotes();

  if (!assessment) return null;

  const farm = assessment.farmId || {};
  const farmer = farm.farmerId || {};
  
  // Calculate risk using the utility
  const riskAssessment: RiskAssessment = calculateOverallRisk(
    assessment.dronePdfs || [],
    assessment.weatherData
  );

  const handleDownloadReport = async () => {
    setIsGenerating(true);
    try {
      const generator = new ComprehensiveReportGenerator();
      await generator.downloadReport({
        assessmentId: assessment._id || "N/A",
        farmDetails: {
          name: farm.name || "Unknown Farm",
          cropType: farm.cropType || "N/A",
          area: farm.area || 0,
          location: farm.location || "N/A",
          farmerName: `${farmer.firstName || ""} ${farmer.lastName || ""}`.trim() || "N/A",
        },
        dronePdfs: assessment.dronePdfs || [],
        weatherData: assessment.weatherData,
        comprehensiveNotes: notes.summary || notes.agronomic || "No notes provided.",
        riskAssessment,
        reportGeneratedAt: new Date(),
      });
      toast.success("Report generated and download started");
    } catch (error) {
      console.error("Report generation failed:", error);
      toast.error("Failed to generate report");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmitAssessment = async () => {
    setIsSubmitting(true);
    try {
      await apiClient.updateAssessment(assessment._id, {
        status: "COMPLETED",
        riskScore: riskAssessment.score,
        riskLevel: riskAssessment.level,
        notes: notes.summary || notes.agronomic,
        completedAt: new Date().toISOString()
      });
      toast.success("Assessment submitted successfully");
      setShowConfirmSubmit(false);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Submission failed:", error);
      toast.error("Failed to submit assessment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "LOW": return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
      case "MODERATE": return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      case "HIGH": return "text-orange-500 bg-orange-500/10 border-orange-500/20";
      case "CRITICAL": return "text-rose-500 bg-rose-500/10 border-rose-500/20";
      default: return "text-slate-500 bg-slate-500/10 border-slate-500/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED": return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "PENDING": return <Clock className="h-4 w-4 text-amber-500" />;
      case "IN_PROGRESS": return <Clock className="h-4 w-4 text-blue-500" />;
      default: return <Clock className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Farm & Farmer Info */}
        <Card className="lg:col-span-2 overflow-hidden border-none shadow-sm bg-white/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl font-bold text-slate-900">{farm.name || "Farm Overview"}</CardTitle>
                <CardDescription className="flex items-center mt-1">
                  <MapPin className="h-3 w-3 mr-1" />
                  {farm.location || "Location not specified"}
                </CardDescription>
              </div>
              <Badge variant="outline" className={`px-3 py-1 ${getRiskColor(riskAssessment.level)}`}>
                {riskAssessment.level} RISK
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Crop Type</p>
                <p className="text-sm font-semibold text-slate-900">{farm.cropType || "N/A"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Area</p>
                <p className="text-sm font-semibold text-slate-900">{farm.area ? `${farm.area} ha` : "N/A"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Farmer</p>
                <p className="text-sm font-semibold text-slate-900">{farmer.firstName} {farmer.lastName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Status</p>
                <div className="flex items-center gap-1.5">
                  {getStatusIcon(assessment.status)}
                  <p className="text-sm font-semibold text-slate-900 capitalize">{assessment.status?.toLowerCase().replace("_", " ")}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-100">
              <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-emerald-600" />
                Assessment Summary
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 italic">
                "{notes.summary || "No summary notes provided yet. Head to the Notes tab to add your professional observations."}"
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Risk Score Widget */}
        <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-600 to-teal-700 text-white">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-white/90">
              <TrendingUp className="h-5 w-5" />
              Composite Risk
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="relative h-32 w-32 flex items-center justify-center">
              <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
                <circle
                  className="text-white/20"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="transparent"
                  r="38"
                  cx="50"
                  cy="50"
                />
                <circle
                  className="text-white transition-all duration-1000 ease-in-out"
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 38}
                  strokeDashoffset={2 * Math.PI * 38 * (1 - riskAssessment.score / 100)}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="38"
                  cx="50"
                  cy="50"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black">{riskAssessment.score}</span>
                <span className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Score</span>
              </div>
            </div>
            <div className="mt-6 text-center space-y-2">
              <p className="text-sm font-medium text-white/80">
                Current assessment shows a <span className="font-bold text-white uppercase">{riskAssessment.level}</span> risk level.
              </p>
              <div className="pt-4 flex flex-wrap justify-center gap-2">
                <Button 
                  size="sm" 
                  variant="secondary" 
                  className="bg-white text-emerald-700 hover:bg-emerald-50 rounded-full font-bold h-9 px-4"
                  onClick={handleDownloadReport}
                  disabled={isGenerating}
                >
                  {isGenerating ? <Clock className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                  PDF Dossier
                </Button>
                {assessment.status !== 'COMPLETED' && (
                  <Button 
                    size="sm" 
                    className="bg-emerald-950/30 hover:bg-emerald-950/40 text-white border border-white/20 rounded-full font-bold h-9 px-4"
                    onClick={() => setShowConfirmSubmit(true)}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Submit
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Quick Stats */}
        {[
          { label: "Crop Health", value: formatRiskPercent(100 - riskAssessment.components.cropHealth), icon: Droplets, color: "text-blue-600 bg-blue-50" },
          { label: "Weather Risk", value: `${riskAssessment.components.weather}/100`, icon: Wind, color: "text-amber-600 bg-amber-50" },
          { label: "Growth Risk", value: `${riskAssessment.components.growthStage}/100`, icon: Calendar, color: "text-emerald-600 bg-emerald-50" },
          { label: "Field Status", value: riskAssessment.fieldStatus, icon: ShieldAlert, color: "text-rose-600 bg-rose-50" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                <p className="text-lg font-black text-slate-900">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recommendations */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Agronomic Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {riskAssessment.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-700">
                <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                {rec}
              </div>
            ))}
            {riskAssessment.recommendations.length === 0 && (
              <div className="text-center py-6 text-slate-500 italic text-sm">
                No specific recommendations based on current data.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmSubmit} onOpenChange={setShowConfirmSubmit}>
        <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Submit Final Assessment?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              This will mark the assessment for <strong>{farm.name}</strong> as completed and notify the insurer. You won't be able to edit your notes after submission.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-slate-200">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleSubmitAssessment();
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Yes, Submit Report"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OverviewTab;
