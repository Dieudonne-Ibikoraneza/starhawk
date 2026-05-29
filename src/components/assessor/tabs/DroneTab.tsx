import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { usePdfValidator } from "@/hooks/usePdfValidator";

interface DroneTabProps {
  assessment: any;
  onRefresh?: () => void;
  readOnly?: boolean;
}

const AgremoLoadingSkeleton = ({ pdfType, progressMessage }: { pdfType: string; progressMessage: string }) => {
  return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Satellite className="h-12 w-12 mx-auto mb-4 opacity-20 text-primary" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Waiting for Drone Analytics
          </h3>
          <p className="text-sm max-w-sm mx-auto leading-relaxed">
            No drone analysis pdfs have been uploaded for this field yet.
            {activeCycle
              ? " Please upload an Agremo PDF to view health insights for the current cycle."
              : " The assessor needs to start a monitoring cycle to begin uploading pdfs."}
          </p>
          
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      {!readOnly && !isCompleted && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Satellite className="h-5 w-5 text-primary" />
                Drone Analysis Reports
              </div>
              <Badge variant="outline" className="text-xs">
                {dronePdfs.length} pdf{dronePdfs.length !== 1 ? "s" : ""}{" "}
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
                Upload any Agremo analysis pdf PDF. The file name will be used
                as the pdf identifier.
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
                        title="Download PDF pdf"
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
                            toast({ title: "Success", description: "PDF pdf downloaded successfully" });
                          } catch (error) {
                            toast({ title: "Error", description: "Failed to generate PDF", variant: "destructive" });
                          } finally {
                            setIsDownloading(null);
                          }
                        }}
                      >
                        {isDownloading === (pdf._id || idx.toString()) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        <span className="hidden sm:inline">Download PDF pdf</span>
                      </Button>
                    ) : (
                      !isCompleted && (
                        <Button
                          size="sm"
                          className="gap-2 shrink-0 rounded-full px-5 font-bold shadow-sm transition-all duration-300 hover:scale-105 active:scale-95 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 text-white border-0"
                          onClick={() => handleProcessPdf(pdf.cycleId!, pdf.pdfType)}
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
                            disabled={isCompleted}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="hidden sm:inline">Delete</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the "{getDisplayType(pdf)}" PDF pdf from the server.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive hover:bg-destructive/90 text-white"
                              onClick={() => handleDeletePdfPdf(pdf.cycleId!, pdf.pdfType)}
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

export default DroneTab;
