import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Upload,
  FileText,
  Loader2,
  Check,
  Satellite,
  AlertCircle,
  Trash2,
  Download,
  Cpu,
  Clock,
  Play,
  RefreshCw,
  AlertTriangle,
  Image,
  Map,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { assessorService } from "@/lib/api/services/assessor";
import { formatReportTypeLabel } from "@/lib/crops";
import { generateDroneDataPDF } from "@/utils/dronePdfGenerator";
import { usePdfValidator } from "@/hooks/usePdfValidator";

interface DroneTabProps {
  assessment: any;
  farm?: any;
  farmer?: any;
  onRefresh?: () => void;
  readOnly?: boolean;
}

function pdfRowLabel(pdfs: any[], idx: number): string {
  const pdf = pdfs[idx];
  if (!pdf) return "";
  const label = formatReportTypeLabel(pdf.pdfType);
  const sameType = pdfs.filter((p) => p.pdfType === pdf.pdfType).length;
  if (sameType > 1) {
    const nth = pdfs.slice(0, idx + 1).filter((p) => p.pdfType === pdf.pdfType).length;
    return `${label} (${nth}/${sameType})`;
  }
  return label;
}

export default function DroneTab({
  assessment,
  farm,
  farmer,
  onRefresh,
  readOnly = false,
}: DroneTabProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [rejectionMessage, setRejectionMessage] = useState<string | null>(null);
  const { validating, validate } = usePdfValidator();

  const [processingTypes, setProcessingTypes] = useState<Record<string, boolean>>({});
  const [failedTypes, setFailedTypes] = useState<Record<string, string>>({});
  const [currentProgressPhase, setCurrentProgressPhase] = useState<string>("");
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  const isCompleted =
    assessment?.status === "SUBMITTED" ||
    assessment?.status === "APPROVED" ||
    assessment?.status === "COMPLETED";

  // 1. Sort reports: Newest uploaded file goes to the top
  const uploadedPdfs = useMemo(() => {
    const pdfs = [...(assessment?.droneAnalysisPdfs || [])];
    return pdfs.sort((a, b) => {
      const dateA = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
      const dateB = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
      return dateB - dateA; // Newest first
    });
  }, [assessment?.droneAnalysisPdfs]);

  const firstDroneMapUrl = useMemo(() => {
    for (const pdf of uploadedPdfs) {
      const d = pdf.droneAnalysisData || pdf.extractedData;
      if (d && typeof d === "object" && d.map_image?.url) {
        return d.map_image.url;
      }
    }
    return null;
  }, [uploadedPdfs]);

  const [showExtractedMap, setShowExtractedMap] = useState(true);

  // Derive pdfType from file name (without extension)
  const getPdfTypeFromFile = (file: File): string => {
    const name = file.name
      .replace(/\.pdf$/i, "")
      .replace(/\s+/g, "_")
      .toLowerCase();
    return name;
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (fileInputRef.current) fileInputRef.current.value = "";

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast({
        title: "Invalid file",
        description: "Please upload a PDF file.",
        variant: "destructive",
      });
      return;
    }

    if (!assessment?._id) {
      toast({
        title: "Error",
        description: "No assessment found. Please select a valid assessment.",
        variant: "destructive",
      });
      return;
    }

    // AI Relevance Check - Rejects unreadable / non-agricultural PDF reports
    setRejectionMessage(null);
    const validation = await validate(file, "drone_analysis");
    if (!validation.relevant) {
      setRejectionMessage(
        `"${file.name}" appears to be a ${validation.documentType}. ${validation.reason}`
      );
      toast({
        title: "Incompatible PDF",
        description: "Please upload a valid drone analysis report.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      await assessorService.uploadDronePdf(assessment._id, file);
      if (validation.warning) {
        toast({
          title: "Uploaded with Warning",
          description: `"${file.name}" was uploaded, but: ${validation.reason}`,
        });
      } else {
        toast({
          title: "Upload Successful",
          description: `"${file.name}" uploaded. Ready for crop intelligence extraction.`,
        });
      }
      onRefresh?.();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload PDF report.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleProcessPdf = async (pdfType: string) => {
    if (!assessment?._id) return;

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
      "Compiling final agricultural data matrix...",
    ];

    let phaseIndex = 0;
    setCurrentProgressPhase(phases[0]);
    const phaseInterval = setInterval(() => {
      phaseIndex = (phaseIndex + 1) % phases.length;
      setCurrentProgressPhase(phases[phaseIndex]);
    }, 4500);

    try {
      await assessorService.processPdf(assessment._id, pdfType);
      toast({
        title: "Success",
        description: "Crop intelligence extracted successfully!",
      });
      onRefresh?.();
    } catch (error: any) {
      console.error("Processing error:", error);
      const errorMsg =
        error.message || "Extraction failed. Microservice might be offline.";
      setFailedTypes((prev) => ({ ...prev, [pdfType]: errorMsg }));
      toast({
        title: "Extraction Failed",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      clearInterval(phaseInterval);
      setProcessingTypes((prev) => ({ ...prev, [pdfType]: false }));
    }
  };

  const handleDeletePdf = async (pdfType: string) => {
    if (!assessment?._id || !pdfType) return;

    try {
      await assessorService.deletePdf(assessment._id, pdfType);
      toast({
        title: "Delete Successful",
        description: "The PDF report has been deleted.",
      });
      onRefresh?.();
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete PDF report.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadReport = async (pdf: any, index: number) => {
    const downloadId = pdf._id || index.toString();
    setIsDownloading(downloadId);
    try {
      const data = pdf.droneAnalysisData || pdf.extractedData;
      if (!data) {
        toast({
          title: "Error",
          description: "No analysis data available to generate PDF.",
          variant: "destructive",
        });
        return;
      }

      await generateDroneDataPDF(
        data,
        pdfRowLabel(uploadedPdfs, index),
        "Risk Assessment System",
        {
          summary: assessment?.comprehensiveNotes || "No summary provided.",
          weather: "Risk Assessment - Manual Weather check available in Weather tab.",
          farmName: farm?.name || "Farm",
          farmerName:
            `${farmer?.firstName || ""} ${farmer?.lastName || ""}`.trim() ||
            farm?.farmerName ||
            "Farmer",
          location: farm?.locationName || "N/A",
          area: farm?.area || 0,
          cropType: farm?.cropType || "",
        },
        true, // showContext: true
      );
      toast({
        title: "Success",
        description: "Technical report generated successfully.",
      });
    } catch (err) {
      console.error("Failed to generate report:", err);
      toast({
        title: "Error",
        description: "Failed to generate PDF report.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(null);
    }
  };

  if (uploadedPdfs.length === 0 && readOnly) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Satellite className="h-12 w-12 mx-auto mb-4 opacity-20 text-primary" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            No Drone Analytics
          </h3>
          <p className="text-sm max-w-sm mx-auto leading-relaxed">
            No drone analysis reports have been uploaded for this risk assessment yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      {!readOnly && (
        <Card className="border border-border/80 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Satellite className="h-5 w-5 text-primary animate-pulse" />
                Drone Analysis Reports
              </div>
              <Badge variant="outline" className="text-xs bg-slate-50 border-slate-200">
                {uploadedPdfs.length} report{uploadedPdfs.length !== 1 ? "s" : ""} uploaded
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer bg-muted/10 group mb-6"
              onClick={() => {
                if (!validating && !isUploading) fileInputRef.current?.click();
              }}
            >
              {validating ? (
                <div className="flex flex-col items-center gap-3 py-2">
                  <div className="relative">
                    <Loader2 className="h-10 w-10 text-violet-500 animate-spin mx-auto" />
                  </div>
                  <p className="text-base font-semibold text-violet-700 animate-pulse">
                    AI is verifying your document…
                  </p>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Checking if this PDF is a valid precision agriculture report
                  </p>
                </div>
              ) : isUploading ? (
                <div className="py-2">
                  <Loader2 className="h-10 w-10 mx-auto mb-3 text-primary animate-spin" />
                  <p className="text-base font-semibold mb-1">Uploading to server...</p>
                </div>
              ) : (
                <div className="py-2">
                  <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                  <p className="text-base font-semibold mb-1">Upload Drone Analysis PDF</p>
                  <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                    Upload any Agremo analysis report PDF. It will be verified by AI instantly.
                  </p>
                </div>
              )}

              {rejectionMessage && (
                <div className="mb-4 p-4 bg-red-50/80 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2.5 text-left max-w-lg mx-auto shadow-sm">
                  <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0 text-red-600 animate-bounce" />
                  <div>
                    <p className="font-semibold text-red-950">AI Validation Rejected</p>
                    <p className="text-red-700/90 leading-relaxed mt-0.5">{rejectionMessage}</p>
                  </div>
                </div>
              )}

              {isCompleted && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm flex items-center gap-2 max-w-sm mx-auto">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                  Assessment is finalized. No further uploads allowed.
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={handlePdfUpload}
                disabled={isCompleted || validating || isUploading}
              />
              {!validating && !isUploading && (
                <Button
                  variant="outline"
                  disabled={isCompleted}
                  onClick={(e) => {
                    e.stopPropagation();
                    setRejectionMessage(null);
                    fileInputRef.current?.click();
                  }}
                  className="group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300 rounded-lg px-6"
                >
                  Select PDF File
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Render each uploaded PDF's data inline with Crop Monitoring's beautiful style */}
      {uploadedPdfs.length > 0 && (
        <div className="space-y-6 mt-6">
          {uploadedPdfs.map((pdf, idx) => {
            const isProcessing = !!processingTypes[pdf.pdfType];
            const hasFailed = !!failedTypes[pdf.pdfType];
            const hasData = !!(pdf.droneAnalysisData || pdf.extractedData);
            const dataPayload = pdf.droneAnalysisData || pdf.extractedData;
            const downloadId = pdf._id || idx.toString();

            return (
              <Card key={pdf._id || `${pdf.pdfType}-${idx}`} className="overflow-hidden border border-border/80 shadow-md">
                <CardHeader
                  className={`pb-3 bg-muted/10 ${
                    hasData || isProcessing || hasFailed ? "border-b border-border/50" : ""
                  }`}
                >
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <span className="capitalize">{pdfRowLabel(uploadedPdfs, idx)}</span>
                        {hasData ? (
                          <Badge
                            variant="outline"
                            className="text-xs bg-green-50 text-green-700 border-green-200 ml-2"
                          >
                            <Check className="h-3 w-3 mr-1" /> Processed
                          </Badge>
                        ) : hasFailed ? (
                          <Badge
                            variant="outline"
                            className="text-xs bg-red-50 text-red-700 border-red-200 ml-2"
                          >
                            <AlertCircle className="h-3 w-3 mr-1" /> Failed
                          </Badge>
                        ) : isProcessing ? (
                          <Badge
                            variant="outline"
                            className="text-xs bg-blue-50 text-blue-700 border-blue-200 ml-2 animate-pulse"
                          >
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Processing...
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-xs bg-blue-50 text-blue-700 border-blue-200 ml-2"
                          >
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
                          disabled={isDownloading === downloadId}
                          className="gap-2 rounded-lg"
                          title="Download PDF report"
                          onClick={() => handleDownloadReport(pdf, idx)}
                        >
                          {isDownloading === downloadId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
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
                              {isProcessing
                                ? "Processing..."
                                : hasFailed
                                ? "Retry Extraction"
                                : "Process Crop Intelligence"}
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
                              className="gap-2 shrink-0 rounded-lg"
                              title="Delete Report"
                              disabled={isCompleted || isProcessing}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="hidden sm:inline">Delete</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the "{pdfRowLabel(uploadedPdfs, idx)}"
                                PDF report from the server.
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
                                {currentProgressPhase ||
                                  "Our system is extracting data from your PDF. This may take a few moments."}
                              </p>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <Skeleton className="h-20 w-full rounded-lg" />
                              <Skeleton className="h-20 w-full rounded-lg" />
                              <Skeleton className="h-20 w-full rounded-lg" />
                              <Skeleton className="h-20 w-full rounded-lg" />
                            </div>
                            <Skeleton className="h-[250px] w-full rounded-lg" />
                            <Skeleton className="h-32 w-full rounded-lg" />
                          </div>
                        ) : hasData ? (
                          <DroneAnalysisView data={dataPayload} pdfType={pdf.pdfType} />
                        ) : hasFailed ? (
                          <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-left flex items-start gap-3 shadow-sm">
                            <AlertCircle className="h-5 w-5 text-rose-600 mt-0.5 shrink-0" />
                            <div className="space-y-1">
                              <p className="font-semibold text-rose-950">
                                Crop Intelligence Extraction Failed
                              </p>
                              <p className="text-sm text-rose-700/90 leading-relaxed">
                                {failedTypes[pdf.pdfType] ||
                                  "An unexpected error occurred during extraction."}
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
      )}

      {/* Field Visualization Card with Map Image and Interactive Map toggle */}
      <Card className="border border-border/80 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-lg">
              <Map className="h-5 w-5 text-primary" />
              Field Visualization
            </span>
            {firstDroneMapUrl ? (
              <div className="flex gap-2">
                <Button
                  variant={showExtractedMap ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowExtractedMap(true)}
                  className="rounded-lg text-xs"
                >
                  <Image className="h-3.5 w-3.5 mr-1" />
                  Drone Image
                </Button>
                <Button
                  variant={!showExtractedMap ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowExtractedMap(false)}
                  className="rounded-lg text-xs"
                >
                  <Map className="h-3.5 w-3.5 mr-1" />
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
                Preview from the first report that includes an extracted map image. Each report
                above has its own full map and legend.
              </p>
              <img
                src={firstDroneMapUrl}
                alt="Extracted map preview from drone report"
                className="w-full rounded-xl border border-border/60 shadow-sm"
              />
            </div>
          ) : farm?.boundary ? (
            <div className="relative h-[420px] w-full rounded-xl overflow-hidden border border-border/60 shadow-sm">
              <FieldMapWithLayers fieldId={farm._id || farm.id} boundary={farm.boundary} />
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground bg-muted/20 border border-dashed rounded-xl">
              <Map className="h-10 w-10 mx-auto mb-2 opacity-40 text-slate-500" />
              <p className="font-semibold text-slate-700">No field boundary available</p>
              <p className="text-xs text-slate-500 mt-1">
                Field boundary data is required for interactive map visualization.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
