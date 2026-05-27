import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  Upload,
  FileText,
  Loader2,
  Check,
  Satellite,
  AlertCircle,
  Trash2,
  Download, Cpu, Clock, Play,
} from "lucide-react";
import { generateDroneDataPDF } from "@/utils/dronePdfGenerator";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import {
  cropMonitoringService,
  CropMonitoringRecord,
} from "@/lib/api/services/cropMonitoring";
import { useQueryClient } from "@tanstack/react-query";
import { formatReportTypeLabel } from "@/lib/crops";
import { DroneAnalysisView } from "../DroneAnalysisView";

interface MonitoringDroneReportTabProps {
  monitoringId: string;
  activeCycle?: CropMonitoringRecord;
  cycles?: CropMonitoringRecord[];
  fieldName: string;
  farmerName: string;
  location: string;
  cropType: string;
  area: number;
  readOnly?: boolean;
  onRefresh?: () => void;
}

export const MonitoringDroneReportTab = ({
  monitoringId,
  activeCycle,
  cycles = [],
  fieldName,
  farmerName,
  location,
  cropType,
  area,
  readOnly = false,
  onRefresh,
}: MonitoringDroneReportTabProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [processingTypes, setProcessingTypes] = useState<Record<string, boolean>>({});

  const handleProcess = async (cycleId: string, pdfType: string) => {
    setProcessingTypes(prev => ({ ...prev, [pdfType]: true }));
    try {
      await cropMonitoringService.processDronePdf(cycleId, pdfType);
      toast({ title: "Success", description: "Drone report processed successfully" });
      onRefresh?.();
    } catch (err: any) {
      toast({ title: "Processing Failed", description: err.response?.data?.message || err.message || "Failed to process report", variant: "destructive" });
    } finally {
      setProcessingTypes(prev => ({ ...prev, [pdfType]: false }));
    }
  };
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCompleted = activeCycle?.status === "COMPLETED";

  // Flatten all PDFs from all cycles and include the cycle number for each
  const dronePdfs = (cycles || [])
    .flatMap((cycle) =>
      (cycle.droneAnalysisPdfs || []).map((pdf) => ({
        ...pdf,
        cycleNumber: cycle.monitoringNumber,
        cycleId: cycle._id,
      }))
    )
    .sort((a, b) => {
      const dateA = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
      const dateB = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
      return dateB - dateA; // Newest first
    });

  // Derive pdfType from file name (without extension)
  const getPdfTypeFromFile = (file: File): string => {
    const name = file.name
      .replace(/\.pdf$/i, "")
      .replace(/\s+/g, "_")
      .toLowerCase();
    return name;
  };

  const getDisplayType = (pdf: any): string => {
    if (pdf.pdfType && pdf.pdfType.toLowerCase() !== "unknown") {
      return formatReportTypeLabel(pdf.pdfType);
    }
    
    // Infer from extracted data if available
    if (pdf.droneAnalysisData) {
      const data = pdf.droneAnalysisData;
      
      const hasZonation = data.zonation_analysis && 
        ((data.zonation_analysis.zones && data.zonation_analysis.zones.length > 0) || 
         data.zonation_analysis.num_zones != null || data.zonation_analysis.tile_size != null);
         
      const hasStandCount = data.stand_count_analysis && 
        (data.stand_count_analysis.plants_counted != null || data.stand_count_analysis.average_plant_density != null ||
         data.stand_count_analysis.planned_plants != null);
         
      const hasRxSpraying = data.rx_spraying_analysis &&
        ((data.rx_spraying_analysis.rates && data.rx_spraying_analysis.rates.length > 0) ||
         data.rx_spraying_analysis.total_pesticide_amount != null);

      if (hasStandCount) return "Stand Count Analysis";
      if (hasRxSpraying) return "RX Spraying Analysis";
      if (hasZonation) return "Zonation Analysis";
      if (data.plant_health_analysis || data.analysis?.levels?.length > 0) return "Plant Health Analysis";
    }
    
    return "Unknown Analysis";
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast({
        title: "Invalid file",
        description: "Please upload a PDF file.",
        variant: "destructive",
      });
      return;
    }

    const pdfType = getPdfTypeFromFile(file);

    setIsUploading(true);
    try {
      await cropMonitoringService.uploadDronePdf(monitoringId, pdfType, file);

      toast({
        title: "Upload Successful",
        description: `"${file.name}" uploaded. Analysis is in progress.`,
      });

      queryClient.invalidateQueries({ queryKey: ["crop-monitoring-policy"] });
      queryClient.invalidateQueries({ queryKey: ["crop-monitoring"] });
      onRefresh?.();
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload PDF report.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeletePdf = async (cycleId: string, pdfType: string) => {
    try {
      await cropMonitoringService.deletePdf(cycleId, pdfType);
      toast({
        title: "Delete Successful",
        description: "The PDF report has been deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["crop-monitoring-policy"] });
      queryClient.invalidateQueries({ queryKey: ["crop-monitoring"] });
      onRefresh?.();
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete PDF report.",
        variant: "destructive",
      });
    }
  };

  if (dronePdfs.length === 0 && !activeCycle) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Satellite className="h-12 w-12 mx-auto mb-4 opacity-20 text-primary" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Waiting for Drone Analytics
          </h3>
          <p className="text-sm max-w-sm mx-auto leading-relaxed">
            No drone analysis reports have been uploaded for this field yet.
            {activeCycle
              ? " Please upload an Agremo PDF to view health insights for the current cycle."
              : " The assessor needs to start a monitoring cycle to begin uploading reports."}
          </p>
          {!readOnly && !activeCycle && (
            <p className="mt-4 text-xs font-medium text-primary uppercase tracking-wider">
              Assessor Action Required
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      {!readOnly && activeCycle && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Satellite className="h-5 w-5 text-primary" />
                Drone Analysis Reports
              </div>
              <Badge variant="outline" className="text-xs">
                {dronePdfs.length} report{dronePdfs.length !== 1 ? "s" : ""}{" "}
                uploaded
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer bg-muted/10 group mb-6"
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <Loader2 className="h-10 w-10 mx-auto mb-3 text-primary animate-spin" />
              ) : (
                <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground group-hover:text-primary transition-colors" />
              )}
              <p className="text-base font-semibold mb-1">
                {isUploading
                  ? "Uploading to server..."
                  : "Upload Drone Analysis PDF"}
              </p>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                Upload any Agremo analysis report PDF. The file name will be used
                as the report identifier.
              </p>
              {isCompleted && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-700 text-sm flex items-center gap-2 max-w-sm mx-auto">
                  <AlertCircle className="h-4 w-4" />
                  This cycle is completed. No further uploads allowed.
                </div>
              )}
              <Input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handlePdfUpload}
                disabled={isCompleted}
              />
              <Button
                variant="outline"
                disabled={isUploading || isCompleted}
                className="group-hover:bg-primary group-hover:text-primary-foreground transition-all"
              >
                Select PDF File
              </Button>
            </div>
            {dronePdfs.length === 0 && activeCycle && (
              <div className="p-4 rounded-lg border border-amber-200 bg-amber-50/50 text-center">
                <p className="text-sm font-medium text-amber-800">
                  At least 1 drone report is required to proceed to the Overview
                  tab.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Render each uploaded PDF's data inline using Assessor's preferred style */}
      {dronePdfs.length > 0 && (
        <div className="space-y-8 mt-6">
          {dronePdfs.map((pdf, idx) => (
            <Card key={pdf._id || idx}>
              <CardHeader className={`pb-3 bg-muted/10 ${(pdf.droneAnalysisData || processingTypes[pdf.pdfType]) ? "border-b border-border/50" : ""}`}>
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="capitalize">
                        {getDisplayType(pdf)}
                      </span>
                      {pdf.droneAnalysisData ? (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 ml-2">
                          <Check className="h-3 w-3 mr-1" />
                          Processed
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 ml-2">
                          <Clock className="h-3 w-3 mr-1" />
                          Uploaded
                        </Badge>
                      )}
                      <Badge variant="secondary" className="font-normal text-xs ml-1">
                        Cycle #{pdf.cycleNumber || "?"}
                      </Badge>
                    </CardTitle>
                    {pdf.uploadedAt && (
                      <p className="text-xs text-muted-foreground font-normal ml-6">
                        {new Date(pdf.uploadedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                  
                   <div className="flex items-center gap-2">
                    {pdf.droneAnalysisData ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isDownloading === (pdf._id || idx.toString())}
                        className="gap-2"
                        title="Download PDF report"
                        onClick={async () => {
                          setIsDownloading(pdf._id || idx.toString());
                          try {
                            await generateDroneDataPDF(
                              pdf.droneAnalysisData as any,
                              getDisplayType(pdf),
                              "Monitoring Audit System",
                              {
                                summary: activeCycle?.notes || "Monitoring data log",
                                weather: "Monthly monitoring cycle context.",
                                farmName: fieldName,
                                farmerName: farmerName,
                                location: location,
                                area: area,
                                cropType: cropType
                              },
                              true, // showContext: true - Now that we have context, show it
                            );
                            toast({ title: "Success", description: "PDF report downloaded successfully" });
                          } catch (error) {
                            toast({ title: "Error", description: "Failed to generate PDF", variant: "destructive" });
                          } finally {
                            setIsDownloading(null);
                          }
                        }}
                      >
                        {isDownloading === (pdf._id || idx.toString()) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        <span className="hidden sm:inline">Download PDF report</span>
                      </Button>
                    ) : (
                      !isCompleted && pdf.cycleId === activeCycle?._id && (
                        <Button
                          size="sm"
                          className="gap-2 shrink-0 rounded-full px-5 font-bold shadow-sm transition-all duration-300 hover:scale-105 active:scale-95 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 text-white border-0"
                          onClick={() => handleProcess(pdf.cycleId!, pdf.pdfType)}
                          disabled={processingTypes[pdf.pdfType]}
                        >
                          {processingTypes[pdf.pdfType] ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4 fill-white" />
                          )}
                          <span className="hidden sm:inline">
                            {processingTypes[pdf.pdfType] ? "Processing..." : "Process Crop Intelligence"}
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
                            title="Delete Report"
                            disabled={pdf.cycleId !== activeCycle?._id || isCompleted}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="hidden sm:inline">Delete</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the "{getDisplayType(pdf)}" PDF report from the server.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive hover:bg-destructive/90 text-white"
                              onClick={() => handleDeletePdf(pdf.cycleId!, pdf.pdfType)}
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
                {(pdf.droneAnalysisData || processingTypes[pdf.pdfType]) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <CardContent className="pt-6">
                      {pdf.droneAnalysisData ? (
                        <DroneAnalysisView
                          data={pdf.droneAnalysisData}
                          pdfType={pdf.pdfType}
                        />
                      ) : (
                        <div className="space-y-6 animate-pulse">
                          <div className="flex flex-col items-center justify-center mb-2">
                            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                            <p className="text-sm font-medium">Analysis in progress...</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Our system is extracting data from your PDF. This may take a few moments.
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
                      )}
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
