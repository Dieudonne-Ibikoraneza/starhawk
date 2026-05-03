import { useState, useRef, useEffect, useMemo } from "react";
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
  FileDown
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
  const [dataSource, setDataSource] = useState<"drone" | "manual">("drone");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState<'plant_health' | 'flowering'>('plant_health');
  
  // Manual metrics state
  const [manualStress, setManualStress] = useState([15]);
  const [manualMoisture, setManualMoisture] = useState([65]);
  const [manualWeed, setManualWeed] = useState([5]);
  const [manualPest, setManualPest] = useState([2]);

  const isCompleted = assessment?.status === "COMPLETED" || assessment?.status === "SUBMITTED";

  useEffect(() => {
    if (readOnly) setDataSource("drone");
  }, [readOnly]);

  const uploadedPdfs = useMemo(() => assessment?.dronePdfs || [], [assessment]);
  const firstDroneMapUrl = useMemo(() => firstMapImageFromPdfs(uploadedPdfs), [uploadedPdfs]);

  const [showExtractedMap, setShowExtractedMap] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingStartTimeRef = useRef<number | null>(null);

  const startPollingForData = (assessmentId: string) => {
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    pollingStartTimeRef.current = Date.now();
    const MAX_POLLING_TIME = 5 * 60 * 1000; // 5 minutes
    const POLL_INTERVAL = 10000; // 10 seconds

    pollingIntervalRef.current = setInterval(async () => {
      const elapsed = Date.now() - (pollingStartTimeRef.current || 0);
      if (elapsed > MAX_POLLING_TIME) {
        stopPollingForData();
        toast.error("Processing timeout. Data may still be processing.");
        return;
      }

      try {
        const updated = await assessmentsApiService.getAssessmentById(assessmentId);
        if (updated.dronePdfs?.length > 0) {
          const withData = updated.dronePdfs.find((p: any) => dronePayload(p));
          if (withData) {
            stopPollingForData();
            toast.success("Analysis complete!");
            if (onRefresh) onRefresh();
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, POLL_INTERVAL);
  };

  const stopPollingForData = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopPollingForData();
  }, []);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !assessment?._id) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please upload a PDF file");
      return;
    }

    setIsUploading(true);
    try {
      await assessmentsApiService.uploadDronePDF(assessment._id, file, uploadType);
      toast.success(`Uploading ${formatReportTypeLabel(uploadType)}...`);
      if (onRefresh) onRefresh();
      startPollingForData(assessment._id);
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
      {!readOnly && (
        <Tabs value={dataSource} onValueChange={(v) => setDataSource(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto h-12 bg-slate-100 rounded-xl p-1">
            <TabsTrigger value="drone" className="rounded-lg gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Satellite className="h-4 w-4" /> Drone Data
            </TabsTrigger>
            <TabsTrigger value="manual" className="rounded-lg gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <UserCheck className="h-4 w-4" /> Manual Check
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {dataSource === "drone" && (
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
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  <div className="w-full md:w-1/3 space-y-4">
                    <p className="text-sm font-medium text-slate-700">Analysis Type</p>
                    <div className="flex flex-col gap-2">
                      <Button 
                        variant={uploadType === 'plant_health' ? 'default' : 'outline'}
                        className={`justify-start gap-3 h-12 rounded-xl ${uploadType === 'plant_health' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                        onClick={() => setUploadType('plant_health')}
                      >
                        <Satellite className="h-4 w-4" />
                        Crop Health Analysis
                      </Button>
                      <Button 
                        variant={uploadType === 'flowering' ? 'default' : 'outline'}
                        className={`justify-start gap-3 h-12 rounded-xl ${uploadType === 'flowering' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                        onClick={() => setUploadType('flowering')}
                      >
                        <Calendar className="h-4 w-4" />
                        Flowering Detection
                      </Button>
                    </div>
                  </div>

                  <div className="flex-1 w-full">
                    <div 
                      className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${isUploading ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 hover:border-emerald-400 hover:bg-slate-50'}`}
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
                        {isUploading ? "Uploading & Analyzing..." : `Upload ${formatReportTypeLabel(uploadType)}`}
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
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {uploadedPdfs.length > 0 ? (
            <div className="space-y-6">
              {uploadedPdfs.map((pdf: any, idx: number) => (
                <Card key={idx} className="border-none shadow-sm overflow-hidden">
                  <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-200">
                          <Satellite className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base font-bold">{pdfRowLabel(uploadedPdfs, idx)}</CardTitle>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                            Extracted: {new Date(pdf.uploadedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="rounded-full gap-2 h-9 px-4 border-slate-200" onClick={() => handleDownloadReport(pdf)}>
                          <FileDown className="h-4 w-4" /> PDF
                        </Button>
                        {!readOnly && !isCompleted && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-rose-500 hover:text-rose-600 hover:bg-rose-50">
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
                    <DroneAnalysisView data={dronePayload(pdf)} pdfType={pdf.pdfType} />
                  </CardContent>
                </Card>
              ))}
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
      )}

      {dataSource === "manual" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-emerald-600" />
                Physical Observation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {[
                { label: "Observed Stress", value: manualStress, setter: setManualStress, color: "bg-emerald-500" },
                { label: "Soil Moisture", value: manualMoisture, setter: setManualMoisture, color: "bg-blue-500" },
                { label: "Weed Infestation", value: manualWeed, setter: setManualWeed, color: "bg-amber-500" },
                { label: "Pest Activity", value: manualPest, setter: setManualPest, color: "bg-rose-500" },
              ].map((metric, i) => (
                <div key={i} className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{metric.label}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Estimated Percentage</p>
                    </div>
                    <span className="text-xl font-black text-emerald-600">{metric.value[0]}%</span>
                  </div>
                  <Slider
                    value={metric.value}
                    onValueChange={metric.setter}
                    max={100}
                    step={1}
                    className="py-4"
                  />
                </div>
              ))}
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 rounded-xl font-bold shadow-lg shadow-emerald-200">
                Save Observations
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm overflow-hidden h-[540px]">
             <CardHeader>
               <CardTitle className="text-lg font-bold">Field Reference</CardTitle>
             </CardHeader>
             <CardContent className="p-0 h-[460px]">
                <FieldMapWithLayers 
                  fieldId={assessment.farmId?._id} 
                  boundary={assessment.farmId?.boundary} 
                  showLayerControls={false}
                />
             </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DroneTab;
