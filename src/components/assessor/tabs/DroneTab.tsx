import { useState, useRef, useEffect, useMemo } from "react";
import { FILE_SERVER_URL } from "@/config/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  FileDown,
  Layers,
  RefreshCw,
  Cpu,
  AlertCircle,
  Play,
  Clock
} from "lucide-react";
import { toast } from "sonner";
import assessmentsApiService from "@/services/assessmentsApi";
import { formatReportTypeLabel } from "@/lib/crops";
import { generateDroneDataPDF } from "@/utils/dronePdfGenerator";

interface DroneTabProps {
  assessment: any;
  onRefresh?: () => void;
  readOnly?: boolean;
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

function dronePayload(pdf: any) {
  return pdf.droneAnalysisData || pdf.extractedData;
}

function firstMapImageFromPdfs(pdfs: any[]): string | null {
  for (const pdf of pdfs) {
    const d = dronePayload(pdf);
    if (d && d.map_image?.url) {
      return d.map_image.url;
    }
  }
  return null;
}

export const DroneTab = ({
  assessment,
  onRefresh,
  readOnly = false,
}: DroneTabProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const isCompleted = assessment?.status === "COMPLETED" || assessment?.status === "SUBMITTED";

  const uploadedPdfs = useMemo(() => assessment?.droneAnalysisPdfs || assessment?.dronePdfs || [], [assessment]);
  
  const getFullPdfUrl = (url?: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `${FILE_SERVER_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const firstDroneMapUrl = useMemo(() => firstMapImageFromPdfs(uploadedPdfs), [uploadedPdfs]);

  const [showExtractedMap, setShowExtractedMap] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States for manual processing and error retry
  const [processingTypes, setProcessingTypes] = useState<Record<string, boolean>>({});
  const [failedTypes, setFailedTypes] = useState<Record<string, string>>({});
  const [currentProgressPhase, setCurrentProgressPhase] = useState<string>("");

  const handleProcessPdf = async (pdfType: string) => {
    if (!assessment?._id) return;
    
    // Set processing state and clear previous failure message
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
      await assessmentsApiService.processAssessmentPdf(assessment._id, pdfType);
      toast.success("Crop intelligence extracted successfully!");
      if (onRefresh) onRefresh();
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
    if (!file || !assessment?._id) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please upload a PDF file");
      return;
    }

    setIsUploading(true);
    try {
      // Format pdfType from filename: remove .pdf extension, replace spaces/special chars with underscores, lowercase
      const pdfType = file.name
        .replace(/\.pdf$/i, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
        .toLowerCase();
      await assessmentsApiService.uploadDronePDF(assessment._id, file, pdfType);
      toast.success(`Successfully uploaded ${file.name}. Pending manual extraction execution.`);
      if (onRefresh) onRefresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to upload PDF");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePdf = async (pdfType: string) => {
    if (!assessment?._id) return;
    try {
      await assessmentsApiService.deleteAssessmentPdf(assessment._id, pdfType);
      toast.success("Drone report removed.");
      if (onRefresh) onRefresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete PDF");
    }
  };

  const handleDownloadReport = async (pdf: any) => {
    try {
      const data = dronePayload(pdf);
      if (!data) {
        toast.error("No analysis data available.");
        return;
      }
      await generateDroneDataPDF(data, pdf.pdfType, "Starhawk Risk Assessment System");
      toast.success("Report generated.");
    } catch (err) {
      toast.error("Failed to generate PDF.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
        <div className="space-y-6">
          {!readOnly && !isCompleted && (
            <Card className="border-none shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Upload className="h-5 w-5 text-emerald-600" />
                  Upload Drone Intelligence
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div 
                  className={`w-full border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${isUploading ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 hover:border-emerald-400 hover:bg-slate-50'}`}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isUploading ? (
                    <Loader2 className="h-12 w-12 mx-auto mb-4 text-emerald-600 animate-spin" />
                  ) : (
                    <div className="bg-emerald-100 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-8 w-8 text-emerald-600" />
                    </div>
                  )}
                  <p className="text-sm font-bold mb-1">
                    {isUploading ? "Uploading & Analyzing..." : `Upload Drone Report`}
                  </p>
                  <p className="text-xs text-slate-500 mb-4">Drag and drop or click to select Agremo PDF report</p>
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handlePdfUpload}
                    disabled={isUploading}
                  />
                  <Button variant="outline" className="rounded-full font-bold px-6 border-slate-200" disabled={isUploading}>
                    Select File
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {uploadedPdfs.length > 0 ? (
            <div className="space-y-6">
              {uploadedPdfs.map((pdf: any, idx: number) => {
                const isProcessing = !!processingTypes[pdf.pdfType];
                const hasFailed = !!failedTypes[pdf.pdfType];
                const hasData = !!dronePayload(pdf);

                return (
                  <Card key={idx} className="border-none shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-sm ${hasFailed ? "bg-rose-600 shadow-rose-200" : isProcessing ? "bg-blue-600 shadow-blue-200 animate-pulse" : "bg-emerald-600 shadow-emerald-200"}`}>
                            {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Satellite className="h-5 w-5" />}
                          </div>
                          <div>
                            <CardTitle className="text-base font-bold flex flex-wrap items-center gap-2">
                              <span>{pdfRowLabel(uploadedPdfs, idx)}</span>
                              {hasData ? (
                                <Badge variant="outline" className="text-[10px] py-0 px-2.5 h-5 bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 rounded-full font-bold">
                                  <Check className="h-3 w-3" /> Processed
                                </Badge>
                              ) : hasFailed ? (
                                <Badge variant="outline" className="text-[10px] py-0 px-2.5 h-5 bg-rose-50 text-rose-700 border-rose-200 gap-1 rounded-full font-bold">
                                  <AlertCircle className="h-3 w-3" /> Failed
                                </Badge>
                              ) : isProcessing ? (
                                <Badge variant="outline" className="text-[10px] py-0 px-2.5 h-5 bg-blue-50 text-blue-700 border-blue-200 gap-1 rounded-full animate-pulse font-bold">
                                  <Loader2 className="h-3 w-3 animate-spin" /> Processing...
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] py-0 px-2.5 h-5 bg-amber-50 text-amber-700 border-amber-200 gap-1 rounded-full font-bold animate-pulse">
                                  <Clock className="h-3 w-3" /> Pending Process
                                </Badge>
                              )}
                            </CardTitle>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                              {hasData ? "Extracted" : "Uploaded"}: {new Date(pdf.uploadedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="rounded-full gap-2 h-9 px-4 border-slate-200" 
                            disabled={isProcessing}
                            onClick={() => {
                              const url = getFullPdfUrl(pdf.pdfUrl || pdf.fileUrl || pdf.url);
                              if (url) window.open(url, '_blank');
                            }}
                          >
                            <FileDown className="h-4 w-4" /> PDF
                          </Button>
                          {!readOnly && !isCompleted && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-9 w-9 rounded-full text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                                  disabled={isProcessing}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="rounded-2xl">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Drone Report?</AlertDialogTitle>
                                  <AlertDialogDescription>This will remove all extracted intelligence from the assessment.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeletePdf(pdf.pdfType)} className="bg-rose-600 hover:bg-rose-700 rounded-xl">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {isProcessing ? (
                        <AgremoLoadingSkeleton pdfType={pdf.pdfType} progressMessage={currentProgressPhase} />
                      ) : hasData ? (
                        <DroneAnalysisView data={dronePayload(pdf)} pdfType={pdfRowLabel([pdf], 0)} />
                      ) : (
                        <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-6 text-center animate-in fade-in zoom-in duration-300">
                          {hasFailed ? (
                            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-left flex items-start gap-3">
                              <AlertCircle className="h-5 w-5 text-rose-600 mt-0.5 shrink-0" />
                              <div className="space-y-1">
                                <p className="text-sm font-bold text-rose-950">Crop Intelligence Extraction Failed</p>
                                <p className="text-xs text-rose-700/90 leading-relaxed font-semibold">
                                  {failedTypes[pdf.pdfType] || "An unexpected error occurred during extraction."}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 bg-blue-50/50 border border-blue-100/50 rounded-xl text-left flex items-start gap-3">
                              <Cpu className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                              <div className="space-y-1">
                                <p className="text-sm font-bold text-blue-950">Pending Crop Intelligence Processing</p>
                                <p className="text-xs text-blue-700/90 leading-relaxed font-semibold">
                                  This report has been uploaded successfully. Click the button below to manually execute AI zonation extraction and crop stress analysis.
                                </p>
                              </div>
                            </div>
                          )}

                          <div className="flex flex-col items-center justify-center space-y-3 pt-2">
                            <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
                              <FileText className={`h-8 w-8 ${hasFailed ? "text-rose-500 animate-bounce" : "text-emerald-600"}`} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{pdfRowLabel(uploadedPdfs, idx)}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">File path: {pdf.pdfUrl}</p>
                            </div>
                          </div>

                          <div className="flex justify-center pt-2">
                            <Button 
                              onClick={() => handleProcessPdf(pdf.pdfType)}
                              className={`rounded-full px-8 py-6 font-bold shadow-lg flex items-center gap-2 text-sm transition-all duration-300 hover:scale-105 active:scale-95 ${
                                hasFailed 
                                  ? "bg-rose-600 hover:bg-rose-700 shadow-rose-200 text-white" 
                                  : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 text-white"
                              }`}
                            >
                              {hasFailed ? (
                                <>
                                  <RefreshCw className="h-4 w-4" />
                                  Retry Extraction
                                </>
                              ) : (
                                <>
                                  <Play className="h-4 w-4 fill-white" />
                                  Process Crop Intelligence
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="border-none shadow-sm bg-slate-50/50 border-dashed border-2 border-slate-200">
              <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <Satellite className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="font-bold text-slate-900">No Drone Data</h3>
                <p className="text-sm text-slate-500 max-w-xs mt-1">Upload a technical report to see high-resolution crop intelligence.</p>
              </CardContent>
            </Card>
          )}

          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-lg font-bold flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Map className="h-5 w-5 text-emerald-600" />
                  Field Visualization
                </div>
                {firstDroneMapUrl && (
                  <div className="flex gap-1 bg-white p-1 rounded-xl shadow-sm border border-slate-100">
                    <Button
                      variant={showExtractedMap ? "default" : "ghost"}
                      size="sm"
                      className={`h-8 rounded-lg text-xs gap-1.5 ${showExtractedMap ? 'bg-emerald-600 shadow-sm' : 'text-slate-600'}`}
                      onClick={() => setShowExtractedMap(true)}
                    >
                      <Image className="h-3 w-3" /> Drone
                    </Button>
                    <Button
                      variant={!showExtractedMap ? "default" : "ghost"}
                      size="sm"
                      className={`h-8 rounded-lg text-xs gap-1.5 ${!showExtractedMap ? 'bg-emerald-600 shadow-sm' : 'text-slate-600'}`}
                      onClick={() => setShowExtractedMap(false)}
                    >
                      <Layers className="h-3 w-3" /> Indices
                    </Button>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-[500px]">
              {showExtractedMap && firstDroneMapUrl ? (
                <div className="h-full w-full relative">
                  <img src={firstDroneMapUrl} alt="Drone Map" className="h-full w-full object-contain bg-slate-900" />
                  <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10">
                    High-Resolution Drone Overlay
                  </div>
                </div>
              ) : (
                <FieldMapWithLayers 
                  fieldId={assessment.farmId?._id} 
                  boundary={assessment.farmId?.boundary} 
                />
              )}
            </CardContent>
          </Card>
        </div>
    </div>
  );
};

export default DroneTab;
