import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Save,
  CheckCircle2,
  FileText,
  AlertCircle,
  X,
  Plus,
  CloudLightning,
  Send,
  Download,
  Activity,
} from "lucide-react";
import {
  Claim,
  ClaimAssessment,
  claimsService,
} from "@/lib/api/services/claims";
import { ClaimReportGenerator } from "@/utils/claimReportGenerator";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAssessmentById } from "@/lib/api/hooks/useClaims";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface LossOverviewTabProps {
  claim: Claim;
  fieldName: string;
  isInsurer?: boolean;
}

export const LossOverviewTab = ({
  claim,
  fieldName,
  isInsurer = false,
}: LossOverviewTabProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const assessmentFromClaim =
    typeof claim.assessmentReportId === "object"
      ? (claim.assessmentReportId as ClaimAssessment)
      : null;

  const assessmentId =
    typeof claim.assessmentReportId === "string"
      ? claim.assessmentReportId
      : assessmentFromClaim?._id;

  const { data: fetchedAssessment, isLoading: isAssessmentLoading } =
    useAssessmentById(assessmentId);

  const assessment = fetchedAssessment || assessmentFromClaim;

  const [observations, setObservations] = useState<string[]>([]);
  const [newObservation, setNewObservation] = useState("");
  const [reportText, setReportText] = useState("");
  const [weatherImpactAnalysis, setWeatherImpactAnalysis] = useState("");
  const [notes, setNotes] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (assessment) {
      setObservations(assessment.observations || []);
      setReportText(assessment.reportText || assessment.notes || "");
      setWeatherImpactAnalysis(assessment.weatherImpactAnalysis || "");
      setNotes(assessment.notes || "");
    }
  }, [assessment]);

  const isCompleted = [
    "SUBMITTED",
    "APPROVED",
    "REJECTED",
    "COMPLETED",
  ].includes(claim.status);

  const updateMutation = useMutation({
    mutationFn: (data: any) => claimsService.updateAssessment(claim._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["claims", "detail", claim._id],
      });
      queryClient.invalidateQueries({
        queryKey: ["assessments", "detail", assessmentId],
      });
      toast({
        title: "Progress Saved",
        description: "Assessment notes and observations updated.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.message || "Failed to save assessment notes.",
        variant: "destructive",
      });
    },
  });

  const submitMutation = useMutation({
    mutationFn: () => claimsService.submitAssessment(claim._id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["claims", "detail", claim._id],
      });
      queryClient.invalidateQueries({ queryKey: ["claims", "assessor"] });
      queryClient.invalidateQueries({
        queryKey: ["assessments", "detail", assessmentId],
      });
      toast({
        title: "Assessment Submitted",
        description: "The claim is now pending insurer approval.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Submission Failed",
        description: err?.message || "Could not submit assessment.",
        variant: "destructive",
      });
    },
  });

  const addObservation = () => {
    const trimmed = newObservation.trim();
    if (!trimmed) return;
    setObservations((prev) => [...prev, trimmed]);
    setNewObservation("");
  };

  const removeObservation = (index: number) => {
    setObservations((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    updateMutation.mutate({
      observations,
      reportText,
      weatherImpactAnalysis,
      notes: reportText, // Ensure both are sent for compatibility
    });
  };

  const canSubmit =
    observations.length > 0 &&
    reportText.trim().length > 0 &&
    (assessment?.droneAnalysisPdfs?.length || 0) > 0;

  const handleExport = async () => {
    if (!assessment) return;
    setIsExporting(true);
    try {
      const generator = new ClaimReportGenerator();

      // Ensure we use the latest state values in case the assessment object is stale
      const currentData = {
        ...assessment,
        reportText: reportText || assessment.reportText || assessment.notes,
        weatherImpactAnalysis:
          weatherImpactAnalysis || assessment.weatherImpactAnalysis,
        observations:
          observations.length > 0 ? observations : assessment.observations,
      };

      await generator.generate(
        claim,
        currentData,
        assessment.droneAnalysisPdfs || [],
      );
      toast({
        title: "Report Exported",
        description: "Your PDF assessment report is ready.",
      });
    } catch (error) {
      console.error("Export failed:", error);
      toast({
        title: "Export Failed",
        description: "Could not generate PDF report.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const renderParagraphs = (text: string) => {
    if (!text) return null;
    return text
      .split(/\n\s*\n/)
      .filter((p) => p.trim())
      .map((p, i) => (
        <p
          key={i}
          className={`mb-4 leading-relaxed text-base ${isInsurer ? "text-white/80" : "text-slate-700"}`}
        >
          {p.trim()}
        </p>
      ));
  };

  if (isInsurer) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-700">
        {/* Header / Finalization Banner - Ultra Compact */}
        <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-xl shadow-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Report Finalized & Verified
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={isExporting}
              className="h-8 px-4 text-xs font-semibold gap-1.5 border-gray-200 bg-white hover:bg-gray-50 text-gray-700 shadow-sm transition-all"
            >
              {isExporting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
              ) : (
                <Download className="h-3.5 w-3.5 text-emerald-600" />
              )}
              Export Report
            </Button>
            {claim.status === "SUBMITTED" && (
              <Badge
                variant="outline"
                className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs px-2.5 py-0.5 font-semibold"
              >
                Pending Approval
              </Badge>
            )}
          </div>
        </div>

        {/* Observations Section */}
        <Card className="overflow-hidden border border-gray-100 shadow-sm">
          <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex items-center gap-2.5">
            <FileText className="h-5 w-5 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Field Observations
            </h3>
          </div>
          <CardContent className="p-6">
            <div className="grid gap-3.5">
              {observations.length > 0 ? (
                observations.map((obs, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/50 border border-gray-100">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <p className="text-gray-700 leading-relaxed text-sm">
                      {obs}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 italic text-sm">
                  No specific field observations recorded.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Weather Impact Section */}
        <Card className="overflow-hidden border border-gray-100 shadow-sm">
          <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex items-center gap-2.5">
            <CloudLightning className="h-5 w-5 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Weather Impact Analysis
            </h3>
          </div>
          <CardContent className="p-6">
            {weatherImpactAnalysis ? (
              <div className="text-gray-700 leading-relaxed font-sans text-sm">
                {renderParagraphs(weatherImpactAnalysis)}
              </div>
            ) : (
              <p className="text-gray-400 italic text-sm">
                No weather impact analysis provided.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Final Summary Section */}
        <Card className="overflow-hidden border border-gray-100 shadow-sm">
          <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex items-center gap-2.5">
            <FileText className="h-5 w-5 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Assessment Executive Summary
            </h3>
          </div>
          <CardContent className="p-6 min-h-[150px]">
            {reportText ? (
              <div className="text-gray-700 leading-relaxed font-sans text-sm">
                {renderParagraphs(reportText)}
              </div>
            ) : (
              <p className="text-gray-400 italic text-sm">
                No formal summary has been provided for this assessment.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Assessor Action Bar */}
      <div className="flex items-center justify-between p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl shadow-sm">
        <div className="flex items-center gap-2.5">
          <Activity className="h-5 w-5 text-emerald-600 animate-pulse" />
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
            Assessment Export & Documentation
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={isExporting || !assessment}
          className="h-8 px-4 text-xs font-semibold gap-1.5 border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 shadow-sm transition-colors"
        >
          {isExporting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
          ) : (
            <Download className="h-3.5 w-3.5 text-emerald-600" />
          )}
          Export Report
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Observations Section */}
        <Card className="overflow-hidden border border-gray-100 shadow-sm flex flex-col">
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <FileText className="h-5 w-5 text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                Field Observations
              </h3>
            </div>
            <span className="text-xs text-gray-500 font-medium">Physical Inspection Results</span>
          </div>
          <CardContent className="p-6 space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {observations.map((obs, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100 group transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 shadow-lg shadow-emerald-500/50" />
                    <span className="text-sm text-gray-700 leading-relaxed">{obs}</span>
                  </div>
                  {!isCompleted && !isInsurer && (
                    <button
                      onClick={() => removeObservation(idx)}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              {observations.length === 0 && (
                <div className="text-center py-10 border border-dashed border-gray-200 rounded-lg bg-gray-50/50">
                  <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400 italic">No observations added yet.</p>
                </div>
              )}
            </div>

            {!isCompleted && !isInsurer && (
              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <Input
                  value={newObservation}
                  onChange={(e) => setNewObservation(e.target.value)}
                  placeholder="e.g. Waterlogging in the NW quadrant"
                  onKeyDown={(e) => e.key === "Enter" && addObservation()}
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={addObservation}
                  disabled={!newObservation.trim()}
                  className="border-gray-300 hover:bg-gray-50 text-gray-600 shrink-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes & Weather Analysis */}
        <div className="space-y-6 flex flex-col">
          {/* Weather Impact Section */}
          <Card className="overflow-hidden border border-gray-100 shadow-sm">
            <div className="bg-gray-50 px-6 py-4 flex items-center gap-2.5 border-b border-gray-100">
              <CloudLightning className="h-5 w-5 text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                Weather Impact Analysis
              </h3>
            </div>
            <CardContent className="p-6">
              <Textarea
                value={weatherImpactAnalysis}
                onChange={(e) => setWeatherImpactAnalysis(e.target.value)}
                placeholder="Analyze how weather events contributed to the observed damage..."
                className="min-h-[100px] resize-none bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                disabled={isCompleted}
              />
            </CardContent>
          </Card>

          {/* Assessment Executive Summary Section */}
          <Card className="overflow-hidden border border-gray-100 shadow-sm flex-1 flex flex-col">
            <div className="bg-gray-50 px-6 py-4 flex items-center gap-2.5 border-b border-gray-100">
              <FileText className="h-5 w-5 text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                Assessment Executive Summary
              </h3>
            </div>
            <CardContent className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <Textarea
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                placeholder="Provide a comprehensive summary of the loss evaluation..."
                className="min-h-[180px] flex-1 resize-none bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                disabled={isCompleted}
              />

              <div className="flex flex-col gap-3 pt-4 border-t border-gray-100 mt-auto">
                {!isCompleted && !isInsurer ? (
                  <>
                    <Button
                      onClick={handleSave}
                      disabled={updateMutation.isPending}
                      className="w-full bg-white hover:bg-gray-50 text-gray-700 font-medium tracking-wide transition-all border border-gray-300 shadow-sm"
                    >
                      {updateMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin text-emerald-600" />
                      ) : (
                        <Save className="h-4 w-4 mr-2 text-emerald-600" />
                      )}
                      Save Progress
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold tracking-wide transition-all border border-emerald-500 shadow-md shadow-emerald-600/10"
                          disabled={!canSubmit || submitMutation.isPending}
                        >
                          {submitMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4 mr-2" />
                          )}
                          Complete & Submit to Insurer
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-white border border-gray-200 text-gray-900 rounded-xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-xl font-bold text-gray-900">
                            Submit Loss Assessment?
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-gray-500 leading-relaxed text-sm">
                            This will finalize your evaluation for{" "}
                            <strong className="text-gray-900 font-semibold">{fieldName}</strong> and notify the insurer
                            for payout processing. You won't be able to edit
                            this assessment afterwards.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-700">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => submitMutation.mutate()}
                            className="bg-emerald-600 hover:bg-emerald-700 border border-emerald-500 text-white"
                          >
                            Submit Assessment
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    {!canSubmit && (
                      <p className="text-xs text-gray-400 text-center">
                        Add observations, notes, and at least one drone report to submit.
                      </p>
                    )}
                  </>
                ) : (
                  (isInsurer || isCompleted) && (
                    <div className="flex flex-col items-center gap-2 p-6 bg-emerald-50 border border-emerald-100 rounded-xl shadow-sm">
                      <CheckCircle2 className="h-10 w-10 text-emerald-600 mb-1 animate-bounce" />
                      <p className="text-sm font-bold text-emerald-800 uppercase tracking-widest">
                        Official Assessment Report Finalized
                      </p>
                      {claim.status === "SUBMITTED" && (
                        <p className="text-xs text-emerald-600/80 font-medium">
                          Pending Insurer Approval
                        </p>
                      )}
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
