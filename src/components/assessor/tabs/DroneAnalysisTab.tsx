import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
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
import { FieldMapWithLayers } from "../FieldMapWithLayers";
import { DroneAnalysisView } from "../DroneAnalysisView";
import { useQuery } from "@tanstack/react-query";
import {
  Upload,
  Calendar,
  Satellite,
  UserCheck,
  FileText,
  Loader2,
  Image,
  Map,
  Trash2,
  X,
  Check,
  AlertTriangle,
  Play,
  RefreshCw,
  AlertCircle,
  Cpu,
  Clock,
  FileDown
} from "lucide-react";
import { toast } from "sonner";
import {
  assessorService,
  farmService,
  Assessment,
} from "@/lib/api/services/assessor";
import { Farm } from "@/lib/api/types";
import { formatReportTypeLabel, getAgremoTitle } from "@/lib/crops";
import { generateDroneDataPDF } from "@/utils/dronePdfGenerator";
import { usePdfValidator } from "@/hooks/usePdfValidator";

interface DroneAnalysisTabProps {
  fieldId: string;
  farmerName: string;
  cropType: string;
  area: number;
  assessmentId?: string;
  status?: string;
  initialNotes?: string;
  /** Admin view: hide uploads, manual checks, and destructive actions */
  readOnly?: boolean;
}

type AssessmentDronePdf = NonNullable<Assessment["droneAnalysisPdfs"]>[number];

function pdfRowLabel(pdfs: Array<{ pdfType: string }>, idx: number): string {
  const pdf = pdfs[idx];
  if (!pdf) return "";
  const label = formatReportTypeLabel(pdf.pdfType);
  const sameType = pdfs.filter((p) => p.pdfType === pdf.pdfType).length;
  if (sameType > 1) {
    const nth = pdfs.slice(0, idx + 1).filter((p) => p.pdfType === pdf.pdfType)
      .length;
    return `${label} (${nth}/${sameType})`;
  }
  return label;
}

function dronePayload(pdf: AssessmentDronePdf) {
  return (pdf as { extractedData?: unknown }).extractedData ?? pdf.droneAnalysisData;
}

function firstMapImageFromPdfs(pdfs: AssessmentDronePdf[]): string | null {
  for (const pdf of pdfs) {
    const d = dronePayload(pdf) as { map_image?: { url?: string } } | null;
    if (d && typeof d === "object" && d.map_image?.url) {
      return d.map_image.url;
    }
  }
  return null;
}

const AgremoLoadingSkeleton = ({ pdfType, progressMessage }: { pdfType: string; progressMessage: string }) => {
  return (
    <div className="space-y-6 p-6 bg-slate-50/50 rounded-2xl border border-slate-100 animate-pulse">
      {/* Processing Status Bar */}
      <div className="flex flex-col items-center justify-center py-6 bg-emerald-50/40 border border-emerald-100/50 rounded-2xl text-center space-y-3">
        <Loader2 className="h-10 w-10 text-emerald-600 animate-spin" />
        <div className="space-y-1">
          <p className="text-sm font-bold text-emerald-950 uppercase tracking-wider">Manual Extraction Active</p>
          <p className="text-xs text-emerald-700/80 font-semibold animate-bounce">{progressMessage || "Extracting crop intelligence..."}</p>
        </div>
      </div>

      {/* Structured Metric Blocks */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm space-y-2">
            <div className="h-3 w-16 bg-slate-200 rounded-full" />
            <div className="h-5 w-24 bg-slate-300 rounded-full" />
          </div>
        ))}
      </div>

      {/* Main Split Layout: Map Preview & Zonation Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mock Map Skeleton with glowing contour lines */}
        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div className="h-4 w-32 bg-slate-200 rounded-full" />
            <div className="h-4 w-12 bg-slate-200 rounded-full" />
          </div>
          <div className="h-64 w-full rounded-xl bg-slate-100 border border-slate-200/50 relative overflow-hidden flex items-center justify-center">
            {/* Glowing Map Contours */}
            <div className="absolute inset-0 flex items-center justify-center opacity-30">
              <svg viewBox="0 0 100 100" className="w-48 h-48 animate-pulse text-emerald-400">
                <path d="M30,20 Q50,10 70,25 T90,60 T60,90 T20,70 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="text-emerald-500 animate-spin duration-10000" />
                <path d="M40,35 Q55,25 68,38 T75,65 T50,80 T30,55 Z" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-yellow-500" />
                <path d="M50,45 Q58,35 63,48 T62,60 T48,70 T42,52 Z" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-rose-500" />
              </svg>
            </div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider relative bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full border border-slate-100 shadow-sm">
              Rendering High-Res Zonation Map...
            </span>
          </div>
        </div>

        {/* Mock Zonation Table */}
        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-5">
          <div className="h-4 w-40 bg-slate-200 rounded-full" />
          
          <div className="border border-slate-100 rounded-xl overflow-hidden">
            <div className="bg-slate-50/80 p-3 grid grid-cols-3 gap-4 border-b border-slate-100">
              <div className="h-3 w-12 bg-slate-200 rounded-full" />
              <div className="h-3 w-8 bg-slate-200 rounded-full ml-auto" />
              <div className="h-3 w-16 bg-slate-200 rounded-full ml-auto" />
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 grid grid-cols-3 gap-4 border-b border-slate-50 items-center">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${i === 1 ? "bg-emerald-300" : i === 2 ? "bg-yellow-300" : "bg-rose-300"}`} />
                  <div className="h-3 w-16 bg-slate-200 rounded-full" />
                </div>
                <div className="h-3 w-10 bg-slate-200 rounded-full ml-auto" />
                <div className="h-3 w-8 bg-slate-200 rounded-full ml-auto" />
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-slate-50/50 border border-slate-100/80 flex items-center justify-between">
            <div className="space-y-1">
              <div className="h-3 w-28 bg-slate-200 rounded-full" />
              <div className="h-5 w-40 bg-slate-300 rounded-full" />
            </div>
            <div className="h-8 w-8 rounded-full bg-slate-200" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const DroneAnalysisTab = ({
  fieldId,
  farmerName: _farmerName,
  cropType: _cropType,
  area: _area,
  assessmentId,
  status = "IN_PROGRESS",
  initialNotes: _initialNotes,
  readOnly = false,
}: DroneAnalysisTabProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [rejectionMessage, setRejectionMessage] = useState<string | null>(null);
  const { validating, validate } = usePdfValidator();
  const isCompleted = status === "SUBMITTED" || status === "APPROVED" || status === "COMPLETED";

  // Fetch assessment data to get uploaded PDFs
  const { data: assessmentData, refetch: refetchAssessment } =
    useQuery<Assessment>({
      queryKey: ["assessment", assessmentId],
      queryFn: () =>
        assessmentId
          ? assessorService.getAssessment(assessmentId)
          : Promise.resolve(null as any),
      enabled: !!assessmentId,
    });

  // Get the farmId from assessment
  const farmId = assessmentData?.farmId
    ? typeof assessmentData.farmId === "string"
      ? assessmentData.farmId
      : assessmentData.farmId._id
    : null;

  // Fetch farm data to get boundary
  const { data: farmData } = useQuery<Farm>({
    queryKey: ["farm", farmId],
    queryFn: () =>
      farmId ? farmService.getFarm(farmId) : Promise.resolve(null as any),
    enabled: !!farmId,
  });

  const uploadedPdfs = useMemo(
    () => {
      const pdfs = [...(assessmentData?.droneAnalysisPdfs || [])];
      return pdfs.sort((a, b) => {
        const dateA = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
        const dateB = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
        return dateB - dateA; // Newest first
      });
    },
    [assessmentData],
  );

  const firstDroneMapUrl = useMemo(
    () => firstMapImageFromPdfs(uploadedPdfs),
    [uploadedPdfs],
  );

  const [showExtractedMap, setShowExtractedMap] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States for manual processing and error retry
  const [processingTypes, setProcessingTypes] = useState<Record<string, boolean>>({});
  const [failedTypes, setFailedTypes] = useState<Record<string, string>>({});
  const [currentProgressPhase, setCurrentProgressPhase] = useState<string>("");

  const handleProcessPdf = async (pdfType: string) => {
    if (!assessmentId) return;
    
    setProcessingTypes((prev) => ({ ...prev, [pdfType]: true }));
    setFailedTypes((prev) => {
      const copy = { ...prev };
      delete copy[pdfType];
      return copy;
    });

    const phases = [
      "Parsing Agremo layout rules...",
      "Resolving crop stress indexes...",
      "Synthesizing field boundary geometries...",
      "Extracting spatial zonation layers...",
      "Compiling final agricultural data matrix..."
    ];
    
    let phaseIndex = 0;
    setCurrentProgressPhase(phases[0]);
    const phaseInterval = setInterval(() => {
      phaseIndex = (phaseIndex + 1) % phases.length;
      setCurrentProgressPhase(phases[phaseIndex]);
    }, 4500);

    try {
      await assessorService.processPdf(assessmentId, pdfType);
      toast.success("Crop intelligence extracted successfully!");
      void refetchAssessment();
    } catch (error: any) {
      console.error("Processing error:", error);
      const errorMsg = error.message || "Manual processing failed. Microservice might be offline.";
      setFailedTypes((prev) => ({ ...prev, [pdfType]: errorMsg }));
      toast.error(`Extraction failed: ${errorMsg}`);
    } finally {
      clearInterval(phaseInterval);
      setProcessingTypes((prev) => ({ ...prev, [pdfType]: false }));
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset file input so the same file can be retried after rejection
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please upload a PDF file");
      return;
    }

    if (!assessmentId) {
      toast.error(
        "No assessment found. Please select a field with an active assessment.",
      );
      return;
    }

    // ── AI Relevance Check ──────────────────────────────────────────────
    setRejectionMessage(null);
    const validation = await validate(file, 'drone_analysis');
    if (!validation.relevant) {
      setRejectionMessage(
        `"${file.name}" appears to be a ${validation.documentType}. ${validation.reason}`
      );
      toast.error("Incompatible PDF — please upload a drone analysis report.");
      return;
    }
    // ────────────────────────────────────────────────────────────────────

    setIsUploading(true);
    try {
      const result = await assessorService.uploadDronePdf(
        assessmentId,
        file,
      );
      toast.success(`Successfully uploaded ${file.name}. Pending manual extraction execution.`);
      console.log("Backend upload result:", result);
      await refetchAssessment();
    } catch (uploadError: any) {
      console.error("Backend upload error:", uploadError);
      toast.error(uploadError.message || "Failed to upload to backend");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePdf = async (pdfType: string) => {
    if (!assessmentId || !pdfType) return;

    try {
      await assessorService.deletePdf(assessmentId, pdfType);
      toast.success("Drone report removed.");
      await refetchAssessment();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete PDF");
    }
  };
  
  const handleDownloadReport = async (pdf: AssessmentDronePdf) => {
    try {
      const data = dronePayload(pdf);
      if (!data) {
        toast.error("No analysis data available to generate PDF.");
        return;
      }

      await generateDroneDataPDF(
        data,
        pdf.pdfType,
        "Risk Assessment System",
        {
          summary: assessmentData?.comprehensiveNotes || "No summary provided.",
          weather:
            "Risk Assessment - Manual Weather check available in Weather tab.",
        },
        false,
      );
      toast.success("Technical report generated successfully.");
    } catch (err) {
      console.error("Failed to generate report:", err);
      toast.error("Failed to generate PDF report.");
    }
  };

  const isCurrentPdfUploaded = uploadedPdfs.length > 0;

  return (
    <div className="space-y-6">
      <>
          {!readOnly && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Drone analysis report (PDF)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {isCurrentPdfUploaded ? (
                    <>
                      <Check className="h-5 w-5 text-green-500" />
                      <span className="text-sm font-medium text-green-600">
                        {uploadedPdfs.length} drone report
                        {uploadedPdfs.length !== 1 ? "s" : ""} uploaded
                      </span>
                    </>
                  ) : (
                    <>
                      <X className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        No drone report uploaded yet
                      </span>
                    </>
                  )}
                </div>
              </div>

                <div
                  className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer bg-muted/10 group mb-6"
                  onClick={() => { if (!validating && !isUploading) fileInputRef.current?.click(); }}
                >
                  {validating ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative">
                        <Loader2 className="h-10 w-10 text-violet-500 animate-spin mx-auto" />
                      </div>
                      <p className="text-base font-semibold text-violet-700">AI is verifying your document…</p>
                      <p className="text-sm text-muted-foreground max-w-sm mx-auto">Checking if this PDF is a valid drone analysis report</p>
                    </div>
                  ) : isUploading ? (
                    <Loader2 className="h-10 w-10 mx-auto mb-3 text-primary animate-spin" />
                  ) : (
                    <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground group-hover:text-primary transition-colors" />
                  )}
                  
                  {!validating && (
                    <>
                      <p className="text-base font-semibold mb-1">
                        {isUploading ? "Uploading to server..." : "Upload Drone Analysis PDF"}
                      </p>
                      <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                        Upload any Agremo analysis report PDF. Each file appears below.
                      </p>
                    </>
                  )}

                  {rejectionMessage && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm flex items-start gap-2 text-left max-w-md mx-auto">
                      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>{rejectionMessage}</span>
                    </div>
                  )}

                  {isCompleted && (
                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-700 text-sm flex items-center gap-2 max-w-sm mx-auto">
                      <AlertTriangle className="h-4 w-4" />
                      Assessment is finalized. No further uploads allowed.
                    </div>
                  )}

                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handlePdfUpload}
                    disabled={isCompleted || validating || isUploading}
                  />
                  <div className="flex items-center justify-center gap-4">
                    <Button
                      variant="outline"
                      onClick={(e) => { e.stopPropagation(); setRejectionMessage(null); fileInputRef.current?.click(); }}
                      disabled={isUploading || validating || isCompleted}
                      className="group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                    >
                      {validating ? "Verifying..." : isUploading ? "Uploading..." : "Select PDF File"}
                    </Button>
                  </div>
                </div>
            </CardContent>
          </Card>
          )}

          <div className="space-y-6">
            {uploadedPdfs.map((pdf, idx) => {
              const isProcessing = !!processingTypes[pdf.pdfType];
              const hasFailed = !!failedTypes[pdf.pdfType];
              const hasData = !!dronePayload(pdf);

              return (
                <Card key={pdf._id ?? `${pdf.pdfType}-${idx}`}>
                  <CardHeader className={`pb-3 bg-muted/10 ${(hasData || isProcessing || hasFailed) ? "border-b border-border/50" : ""}`}>
                    <div className="flex items-start justify-between flex-wrap gap-4">
                      <div className="space-y-1">
                        <CardTitle className="text-base flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary shrink-0" />
                          <span className="capitalize">{pdfRowLabel(uploadedPdfs, idx)}</span>
                          {hasData ? (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 ml-2">
                              <Check className="h-3 w-3 mr-1" /> Processed
                            </Badge>
                          ) : hasFailed ? (
                            <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200 ml-2">
                              <AlertCircle className="h-3 w-3 mr-1" /> Failed
                            </Badge>
                          ) : isProcessing ? (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 ml-2 animate-pulse">
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Processing...
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 ml-2">
                              <Clock className="h-3 w-3 mr-1" /> Uploaded
                            </Badge>
                          )}
                        </CardTitle>
                        {pdf.uploadedAt && (
                          <p className="text-xs text-muted-foreground font-normal ml-6">
                            {new Date(pdf.uploadedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {hasData ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            disabled={isProcessing}
                            onClick={() => handleDownloadReport(pdf)}
                          >
                            <FileText className="h-4 w-4" />
                            <span className="hidden sm:inline">Download PDF report</span>
                          </Button>
                        ) : (
                          !isCompleted && (
                            <Button
                              size="sm"
                              className={`gap-2 shrink-0 rounded-full px-5 font-bold shadow-sm transition-all duration-300 hover:scale-105 active:scale-95 border-0 ${
                                hasFailed
                                  ? "bg-rose-600 hover:bg-rose-700 shadow-rose-200 text-white"
                                  : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 text-white"
                              }`}
                              onClick={() => handleProcessPdf(pdf.pdfType)}
                              disabled={isProcessing}
                            >
                              {isProcessing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : hasFailed ? (
                                <RefreshCw className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4 fill-white" />
                              )}
                              <span className="hidden sm:inline">
                                {isProcessing ? "Processing..." : hasFailed ? "Retry Extraction" : "Process Crop Intelligence"}
                              </span>
                            </Button>
                          )
                        )}

                        {!readOnly && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="gap-2 shrink-0"
                                disabled={isCompleted || isProcessing}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="hidden sm:inline">Delete</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Are you absolutely sure?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This permanently deletes &quot;
                                  {formatReportTypeLabel(pdf.pdfType)}&quot; from
                                  this assessment.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive hover:bg-destructive/90 text-white"
                                  onClick={() => handleDeletePdf(pdf.pdfType)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <AnimatePresence initial={false}>
                    {(hasData || isProcessing || hasFailed) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <CardContent className="pt-6">
                          {isProcessing ? (
                            <div className="space-y-6 animate-pulse">
                              <div className="flex flex-col items-center justify-center mb-2">
                                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                                <p className="text-sm font-medium">Analysis in progress...</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {currentProgressPhase || "Our system is extracting data from your PDF. This may take a few moments."}
                                </p>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="h-20 w-full rounded-lg bg-slate-200/50" />
                                <div className="h-20 w-full rounded-lg bg-slate-200/50" />
                                <div className="h-20 w-full rounded-lg bg-slate-200/50" />
                                <div className="h-20 w-full rounded-lg bg-slate-200/50" />
                              </div>
                              <div className="h-[250px] w-full rounded-lg bg-slate-200/50" />
                              <div className="h-32 w-full rounded-lg bg-slate-200/50" />
                            </div>
                          ) : hasData ? (
                            <DroneAnalysisView
                              data={dronePayload(pdf)}
                              pdfType={String(pdf.pdfType)}
                            />
                          ) : hasFailed ? (
                            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-left flex items-start gap-3">
                              <AlertCircle className="h-5 w-5 text-rose-600 mt-0.5 shrink-0" />
                              <div className="space-y-1">
                                <p className="text-sm font-bold text-rose-950">Crop Intelligence Extraction Failed</p>
                                <p className="text-xs text-rose-700/90 leading-relaxed font-semibold">
                                  {failedTypes[pdf.pdfType] || "An unexpected error occurred during extraction."}
                                </p>
                              </div>
                            </div>
                          ) : null}
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              );
            })}
          </div>

          {uploadedPdfs.length === 0 && readOnly && (
            <div className="py-12 text-center text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
              <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No drone reports for this assessment</p>
            </div>
          )}

          {/* Visual Map with Layer Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Field Visualization</span>
                {firstDroneMapUrl ? (
                  <div className="flex gap-2">
                    <Button
                      variant={showExtractedMap ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowExtractedMap(true)}
                    >
                      <Image className="h-4 w-4 mr-1" />
                      Drone Image
                    </Button>
                    <Button
                      variant={!showExtractedMap ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowExtractedMap(false)}
                    >
                      <Map className="h-4 w-4 mr-1" />
                      Interactive Map
                    </Button>
                  </div>
                ) : null}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {showExtractedMap && firstDroneMapUrl ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Preview from the first report that includes an extracted map
                    image. Each report above has its own full map and legend.
                  </p>
                  <img
                    src={firstDroneMapUrl}
                    alt="Extracted map preview from drone report"
                    className="w-full rounded-lg border border-border"
                  />
                </div>
              ) : farmData?.boundary ? (
                <div className="relative h-[420px] w-full">
                  <FieldMapWithLayers
                    fieldId={fieldId}
                    boundary={farmData.boundary}
                  />
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Map className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No field boundary available</p>
                  <p className="text-xs">
                    Field boundary data is required for interactive map
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
    </div>
  );
};
