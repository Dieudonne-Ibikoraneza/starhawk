import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import LeafletMap from "@/components/common/LeafletMap";
import assessmentsApiService from "@/services/assessmentsApi";
import {
  getFarms,
  uploadKML,
  getWeatherForecast,
  getHistoricalWeather,
  getAccumulatedWeather,
  getVegetationStats,
  getNDVITimeSeries,
} from "@/services/farmsApi";
import { useToast } from "@/hooks/use-toast";
import {
  API_BASE_URL,
  API_ENDPOINTS,
  getAuthToken,
  FILE_SERVER_URL,
} from "@/config/api";
import {
  MapPin,
  Search,
  Upload,
  FileText,
  Shield,
  CloudRain,
  Leaf,
  FileSpreadsheet,
  Activity,
  CheckCircle,
  AlertTriangle,
  Calendar,
  User,
  Users,
  ArrowLeft,
  Sprout,
  Save,
  BarChart3,
  TrendingUp,
  Download,
  Eye,
  Map,
  Clock,
  Trash2,
  Info,
  FileImage,
  Package,
  Layers,
  Percent,
  Trash,
} from "lucide-react";

interface Farmer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  farmerProfile: {
    farmProvince: string;
    farmDistrict: string;
    farmSector: string;
  };
  farms: Farm[];
}

interface Farm {
  id: string;
  cropType: string;
  sowingDate: string;
  status: "PENDING" | "REGISTERED";
  name: string | null;
}

interface Assessment {
  _id: string;
  farmId: {
    _id: string;
    name: string;
    cropType: string;
    eosdaFieldId: string;
  };
  assessorId: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  status: string;
  riskScore: number | null;
  observations: any[];
  photoUrls: string[];
  reportText: string | null;
  droneAnalysisPdfUrl: string | null; // Legacy field for backward compatibility
  droneAnalysisData: any; // Legacy field for backward compatibility
  droneAnalysisPdfs?: {
    pdfType: "plant_health" | "flowering";
    pdfUrl: string;
    extractedData?: object;
    droneAnalysisData?: object;
    uploadedAt: Date;
  }[];
  comprehensiveNotes: string | null;
  reportGenerated: boolean;
}

export default function RiskAssessmentSystem(): JSX.Element {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"farmers" | "assessment">("farmers");
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loadingAssessment, setLoadingAssessment] = useState(false);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);

  // PDF Type Selector State
  const [selectedPdfType, setSelectedPdfType] = useState<
    "plant_health" | "flowering" | null
  >("plant_health");

  // Helper to get stress/levels array from weed_analysis (supports API: levels or stress_levels)
  const getWeedAnalysisLevels = (weedAnalysis: any): any[] => {
    if (!weedAnalysis) return [];
    return weedAnalysis.levels ?? weedAnalysis.stress_levels ?? [];
  };

  // Helper to get total stress area (supports API: total_area_hectares or total_stress_area_hectares)
  const getTotalStressArea = (weedAnalysis: any, levels?: any[]): number => {
    if (!weedAnalysis) return 0;
    const stressLevel = (levels ?? getWeedAnalysisLevels(weedAnalysis)).find(
      (l: any) =>
        l.level?.toLowerCase().includes("stress") &&
        !l.level?.toLowerCase().includes("potential"),
    );
    return (
      stressLevel?.area_hectares ??
      weedAnalysis.total_area_hectares ??
      weedAnalysis.total_stress_area_hectares ??
      0
    );
  };

  // Helper to get total stress percent (supports API: total_area_percent or total_stress_percent)
  const getTotalStressPercent = (weedAnalysis: any, levels?: any[]): number => {
    if (!weedAnalysis) return 0;
    const stressLevel = (levels ?? getWeedAnalysisLevels(weedAnalysis)).find(
      (l: any) =>
        l.level?.toLowerCase().includes("stress") &&
        !l.level?.toLowerCase().includes("potential"),
    );
    return (
      stressLevel?.percentage ??
      weedAnalysis.total_area_percent ??
      weedAnalysis.total_stress_percent ??
      0
    );
  };

  // Fixed colors for level table/chart: row 0=green, row 1=yellow, row 2=red
  const LEVEL_COLORS = ["#00b159", "#f2b11c", "#ef495f"] as const;
  const getLevelColor = (index: number): string =>
    LEVEL_COLORS[index] ?? LEVEL_COLORS[0];
  const hexToRgb = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
          parseInt(result[1], 16),
          parseInt(result[2], 16),
          parseInt(result[3], 16),
        ]
      : [0, 177, 89];
  };

  // Draw pie chart on canvas and return data URL for PDF embedding
  const drawPieChartToDataUrl = (
    levels: { level: string; percentage?: number }[],
    colors: readonly string[] | string[],
    sizePx: number = 120,
  ): string => {
    const canvas = document.createElement("canvas");
    const dpr = 2;
    canvas.width = sizePx * dpr;
    canvas.height = sizePx * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";
    ctx.scale(dpr, dpr);
    const centerX = sizePx / 2;
    const centerY = sizePx / 2;
    const radius = sizePx / 2 - 8;
    const total = levels.reduce((sum, l) => sum + (l.percentage ?? 0), 0) || 1;
    let startAngle = -Math.PI / 2;
    levels.forEach((level, i) => {
      const value = level.percentage ?? 0;
      const sliceAngle = (value / total) * 2 * Math.PI;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = colors[i] ?? "#888";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1;
      ctx.stroke();
      startAngle += sliceAngle;
    });
    return canvas.toDataURL("image/png");
  };

  // Helper function to get full PDF URL - uses FILE_SERVER_URL from config
  const getFullPdfUrl = useCallback(
    (pdfUrl: string | null | undefined): string => {
      if (!pdfUrl) return "";
      // If URL is already absolute, return as is
      if (pdfUrl.startsWith("http://") || pdfUrl.startsWith("https://")) {
        return pdfUrl;
      }
      // If relative, prepend FILE_SERVER_URL from config
      const cleanUrl = pdfUrl.startsWith("/") ? pdfUrl : `/${pdfUrl}`;
      return `${FILE_SERVER_URL}${cleanUrl}`;
    },
    [],
  );

  // Helper function to get current PDF data based on selected type
  // Supports both new droneAnalysisPdfs array (with extractedData) and legacy droneAnalysisData
  const getCurrentPdfData = useCallback(() => {
    if (!assessment || !selectedPdfType) return null;

    // Try new droneAnalysisPdfs array first
    if (
      assessment.droneAnalysisPdfs &&
      assessment.droneAnalysisPdfs.length > 0
    ) {
      const pdf = assessment.droneAnalysisPdfs.find(
        (p) => p.pdfType === selectedPdfType,
      );

      if (pdf) {
        // Support both extractedData (new API) and droneAnalysisData (legacy inside PDF object)
        const data =
          (pdf as any).extractedData ?? pdf.droneAnalysisData ?? null;
        if (data) {
          return {
            pdfType: pdf.pdfType,
            pdfUrl: pdf.pdfUrl,
            droneAnalysisData: data,
            uploadedAt: pdf.uploadedAt,
          };
        }
        // PDF exists but no data yet
        return {
          pdfType: pdf.pdfType,
          pdfUrl: pdf.pdfUrl,
          droneAnalysisData: null,
          uploadedAt: pdf.uploadedAt,
        };
      }
      return null;
    }

    // Fallback to legacy single PDF structure
    if (assessment.droneAnalysisPdfUrl && assessment.droneAnalysisData) {
      const analysisType =
        assessment.droneAnalysisData.report?.detected_analysis_type;
      const matchesSelectedType =
        (selectedPdfType === "plant_health" &&
          analysisType === "plant_stress") ||
        (selectedPdfType === "flowering" && analysisType !== "plant_stress");

      if (matchesSelectedType) {
        return {
          pdfType: selectedPdfType,
          pdfUrl: assessment.droneAnalysisPdfUrl,
          droneAnalysisData: assessment.droneAnalysisData,
          uploadedAt: new Date(),
        };
      }
      return null;
    }

    return null;
  }, [assessment, selectedPdfType]);

  // Helper function to get all available PDF types
  const getAvailablePdfTypes = useCallback((): (
    | "plant_health"
    | "flowering"
  )[] => {
    if (!assessment) return [];

    const types: ("plant_health" | "flowering")[] = [];

    // Check new droneAnalysisPdfs array
    if (assessment.droneAnalysisPdfs) {
      assessment.droneAnalysisPdfs.forEach((pdf) => {
        if (pdf.pdfType === "plant_health" || pdf.pdfType === "flowering") {
          // Include if there's any data (extractedData or droneAnalysisData)
          const hasData = (pdf as any).extractedData ?? pdf.droneAnalysisData;
          if (hasData) {
            types.push(pdf.pdfType);
          }
        }
      });
    }

    // Fallback to legacy structure
    if (assessment.droneAnalysisPdfUrl && assessment.droneAnalysisData) {
      const analysisType =
        assessment.droneAnalysisData.report?.detected_analysis_type;

      if (analysisType === "plant_stress") {
        if (!types.includes("plant_health")) types.push("plant_health");
      } else {
        if (!types.includes("flowering")) types.push("flowering");
      }
    }

    return types;
  }, [assessment]);

  // Auto-select first available PDF type when assessment loads
  useEffect(() => {
    if (assessment) {
      const availableTypes = getAvailablePdfTypes();
      if (availableTypes.length > 0 && !selectedPdfType) {
        setSelectedPdfType(availableTypes[0]);
      } else if (availableTypes.length === 0 && !selectedPdfType) {
        // Always select plant_health by default when no PDFs are available yet
        setSelectedPdfType("plant_health");
      }
    }
  }, [assessment, selectedPdfType, getAvailablePdfTypes]);

  // KML Upload State
  const [uploadingKML, setUploadingKML] = useState(false);
  const [selectedKMLFile, setSelectedKMLFile] = useState<File | null>(null);
  const [farmName, setFarmName] = useState("");
  const [showKMLUpload, setShowKMLUpload] = useState<string | null>(null);

  // Assessment State
  const [riskScore, setRiskScore] = useState<number | null>(null);
  const [calculatingRisk, setCalculatingRisk] = useState(false);
  const [comprehensiveNotes, setComprehensiveNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [selectedPDFFile, setSelectedPDFFile] = useState<File | null>(null);
  const [uploadingPDF, setUploadingPDF] = useState(false);
  const [deletingPDF, setDeletingPDF] = useState(false);

  // Data State
  const [fieldStatistics, setFieldStatistics] = useState<any>(null);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(false);

  // Polling state for drone analysis data
  const [pollingForDroneData, setPollingForDroneData] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingStartTimeRef = useRef<number | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [mapImageUrl, setMapImageUrl] = useState<string | null>(null);
  const [loadingMapImage, setLoadingMapImage] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  // Polling function to check for drone analysis data
  const startPollingForDroneData = (assessmentId: string) => {
    // Don't start polling if data already exists for any PDF type
    const hasData =
      assessment?.droneAnalysisPdfs?.some(
        (pdf) => (pdf as any).extractedData ?? pdf.droneAnalysisData,
      ) || assessment?.droneAnalysisData;
    if (hasData) {
      console.log("✅ Drone analysis data already exists, skipping polling");
      return;
    }

    // Clear any existing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    setPollingForDroneData(true);
    pollingStartTimeRef.current = Date.now();
    const MAX_POLLING_TIME = 3 * 60 * 1000; // 3 minutes max
    const POLL_INTERVAL = 15000; // Poll every 15 seconds

    console.log("🔄 Starting to poll for drone analysis data...");

    pollingIntervalRef.current = setInterval(async () => {
      if (!pollingIntervalRef.current) return;

      const elapsed = Date.now() - (pollingStartTimeRef.current || 0);

      if (elapsed > MAX_POLLING_TIME) {
        console.log("⏱️ Polling timeout reached, stopping...");
        stopPollingForDroneData();
        toast({
          title: "Processing Timeout",
          description:
            "Drone analysis data is taking longer than expected. Please refresh the page or contact support.",
          variant: "destructive",
        });
        return;
      }

      try {
        console.log(
          "🔍 Polling for drone analysis data... (elapsed:",
          Math.round(elapsed / 1000),
          "s)",
        );
        const updated =
          await assessmentsApiService.getAssessmentById(assessmentId);
        const updatedData = updated.data || updated;

        // Check new droneAnalysisPdfs array
        const hasNewData = updatedData?.droneAnalysisPdfs?.some(
          (pdf: any) => pdf.extractedData ?? pdf.droneAnalysisData,
        );

        // Check legacy structure
        const d = updatedData?.droneAnalysisData;
        const hasStructuredData =
          d?.report ||
          d?.field ||
          (d?.weed_analysis &&
            (getWeedAnalysisLevels(d.weed_analysis).length > 0 ||
              d.weed_analysis.total_area_hectares != null));

        if (
          hasNewData ||
          (d &&
            (hasStructuredData ||
              d?.cropHealth ||
              d?.coverage !== undefined ||
              (d?.anomalies &&
                Array.isArray(d.anomalies) &&
                d.anomalies.length > 0) ||
              Object.keys(d).length > 0))
        ) {
          console.log("✅ Drone analysis data found!");
          setAssessment(updatedData);
          stopPollingForDroneData();
          toast({
            title: "Analysis Complete",
            description:
              "Drone analysis data has been processed and is now available.",
          });
        } else {
          console.log(
            "⏳ Drone analysis data not yet available, continuing to poll...",
          );
        }
      } catch (err: any) {
        console.error("❌ Error while polling for drone data:", err);
      }
    }, POLL_INTERVAL);
  };

  // Stop polling function
  const stopPollingForDroneData = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setPollingForDroneData(false);
    pollingStartTimeRef.current = null;
    console.log("🛑 Stopped polling for drone analysis data");
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      stopPollingForDroneData();
    };
  }, []);

  // Stop polling when viewMode changes or assessment is cleared
  useEffect(() => {
    if (viewMode === "farmers" || !assessment) {
      stopPollingForDroneData();
    }
  }, [viewMode, assessment]);

  // Auto-load map image if data is available for selected PDF type
  useEffect(() => {
    const currentPdfData = getCurrentPdfData();
    if (currentPdfData?.droneAnalysisData?.map_image) {
      const mapImage = currentPdfData.droneAnalysisData.map_image;
      if (mapImage.data) {
        setMapImageUrl(
          `data:image/${mapImage.format || "png"};base64,${mapImage.data}`,
        );
      } else if (mapImage.url) {
        setMapImageUrl(mapImage.url);
      }
    } else {
      setMapImageUrl(null);
    }
  }, [getCurrentPdfData]);

  // Cleanup: revoke blob URLs when component unmounts or image changes
  useEffect(() => {
    return () => {
      if (mapImageUrl && mapImageUrl.startsWith("blob:")) {
        URL.revokeObjectURL(mapImageUrl);
      }
    };
  }, [mapImageUrl]);

  // Load assigned farmers
  useEffect(() => {
    loadFarmers();
  }, []);

  const loadFarmers = async () => {
    setLoading(true);
    try {
      const response = await assessmentsApiService.getAssignedFarmers();
      const farmersData = response.data || response || [];
      setFarmers(Array.isArray(farmersData) ? farmersData : []);
    } catch (err: any) {
      console.error("Failed to load farmers:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to load assigned farmers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle KML file selection
  const handleKMLFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".kml")) {
      toast({
        title: "Invalid File Type",
        description: "Please select a .kml file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "File size must be less than 1MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedKMLFile(file);
  };

  // Handle KML upload
  const handleUploadKML = async (farmId: string) => {
    if (!selectedKMLFile || !farmName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please select a KML file and enter a farm name",
        variant: "destructive",
      });
      return;
    }

    setUploadingKML(true);
    try {
      const result = await uploadKML(selectedKMLFile, farmId, farmName.trim());

      toast({
        title: "Success",
        description: "KML uploaded successfully. EOSDA field created.",
      });

      setSelectedKMLFile(null);
      setFarmName("");
      setShowKMLUpload(null);

      await loadFarmers();

      if (result.status === "REGISTERED") {
        await loadAssessmentForFarm(farmId);
      }
    } catch (err: any) {
      console.error("Failed to upload KML:", err);
      toast({
        title: "Upload Failed",
        description: err.message || "Failed to upload KML file",
        variant: "destructive",
      });
    } finally {
      setUploadingKML(false);
    }
  };

  // Load assessment for a farm
  const loadAssessmentForFarm = async (farmId: string) => {
    setLoadingAssessment(true);
    try {
      const assessments = await assessmentsApiService.getAssessments();
      const assessmentsData =
        assessments.data || assessments.items || assessments || [];
      const existingAssessment = Array.isArray(assessmentsData)
        ? assessmentsData.find(
            (a: any) => a.farmId?._id === farmId || a.farmId === farmId,
          )
        : null;

      if (existingAssessment) {
        const assessmentDetails = await assessmentsApiService.getAssessmentById(
          existingAssessment._id || existingAssessment.id,
        );
        const assessmentData = assessmentDetails.data || assessmentDetails;
        setAssessment(assessmentData);

        const riskScoreValue = assessmentData.riskScore;
        if (
          riskScoreValue !== null &&
          riskScoreValue !== undefined &&
          typeof riskScoreValue === "number"
        ) {
          setRiskScore(riskScoreValue);
        } else {
          setRiskScore(null);
        }

        setComprehensiveNotes(assessmentData.comprehensiveNotes || "");
        setViewMode("assessment");

        await loadFieldData(farmId);
      } else {
        toast({
          title: "No Assessment Found",
          description: "Please create an assessment for this farm first",
        });
      }
    } catch (err: any) {
      console.error("Failed to load assessment:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to load assessment",
        variant: "destructive",
      });
    } finally {
      setLoadingAssessment(false);
    }
  };

  // Load field statistics and weather data
  const loadFieldData = async (farmId: string) => {
    if (!farmId) return;

    setLoadingData(true);
    try {
      const today = new Date();
      const startDate = new Date();
      startDate.setFullYear(today.getFullYear() - 3);

      const startDateStr = startDate.toISOString().split("T")[0];
      const endDateStr = today.toISOString().split("T")[0];

      try {
        const stats = await getVegetationStats(
          farmId,
          startDateStr,
          endDateStr,
          "NDVI,MSAVI,NDMI,EVI",
        );
        setFieldStatistics(stats.data || stats);
      } catch (err: any) {
        const errorMessage = err?.message || "";
        if (
          errorMessage.includes("EOSDA") ||
          errorMessage.includes("requests limit exceeded") ||
          errorMessage.includes("EOSDA field ID") ||
          errorMessage.includes("register the farm")
        ) {
          console.log("EOSDA data not available");
        } else {
          console.warn("Failed to load field statistics:", err);
        }
        setFieldStatistics(null);
      }

      try {
        const weather = await getHistoricalWeather(
          farmId,
          startDateStr,
          endDateStr,
        );
        setWeatherData(weather.data || weather);
      } catch (err: any) {
        const errorMessage = err?.message || "";
        if (
          errorMessage.includes("EOSDA") ||
          errorMessage.includes("requests limit exceeded") ||
          errorMessage.includes("EOSDA field ID") ||
          errorMessage.includes("register the farm")
        ) {
          console.log("EOSDA weather data not available");
        } else {
          console.warn("Failed to load weather data:", err);
        }
        setWeatherData(null);
      }
    } catch (err: any) {
      console.error("Failed to load field data:", err);
    } finally {
      setLoadingData(false);
    }
  };

  // Calculate risk score
  const handleCalculateRiskScore = async () => {
    if (!assessment?._id) {
      toast({
        title: "Error",
        description: "Assessment not loaded",
        variant: "destructive",
      });
      return;
    }

    if (calculatingRisk) {
      console.log(
        "⚠️ Risk calculation already in progress, ignoring duplicate call",
      );
      return;
    }

    setCalculatingRisk(true);
    try {
      const score = await assessmentsApiService.calculateRiskScore(
        assessment._id,
      );
      const scoreValue =
        typeof score === "number"
          ? score
          : score?.data || score?.riskScore || score;

      if (
        scoreValue !== null &&
        scoreValue !== undefined &&
        typeof scoreValue === "number"
      ) {
        setRiskScore(scoreValue);

        try {
          const updated = await assessmentsApiService.getAssessmentById(
            assessment._id,
          );
          const updatedData = updated.data || updated;
          setAssessment(updatedData);
        } catch (reloadErr) {
          console.warn(
            "⚠️ Failed to reload assessment after risk calculation:",
            reloadErr,
          );
        }

        toast({
          title: "Success",
          description: `Risk score calculated: ${scoreValue.toFixed(1)}`,
        });
      } else {
        throw new Error("Invalid risk score returned from API");
      }
    } catch (err: any) {
      console.error("❌ Failed to calculate risk score:", err);
      const errorMessage = err.message || "";
      if (
        errorMessage.includes("404") ||
        errorMessage.includes("not found") ||
        errorMessage.includes("Cannot POST")
      ) {
        toast({
          title: "Feature Not Available",
          description:
            "Risk score calculation endpoint is not yet available on the server. Please contact support or try again later.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Calculation Failed",
          description:
            err.message ||
            "Failed to calculate risk score. Please try again later.",
          variant: "destructive",
        });
      }
    } finally {
      setCalculatingRisk(false);
      setTimeout(() => {
        setCalculatingRisk(false);
      }, 100);
    }
  };

  const handleDeletePDF = async () => {
    if (!assessment?._id || !selectedPdfType) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this PDF? This action cannot be undone.",
    );

    if (!confirmed) return;

    setDeletingPDF(true);

    try {
      await assessmentsApiService.deleteAssessmentPdf(
        assessment._id,
        selectedPdfType,
      );

      // Stop any ongoing polling for this assessment
      stopPollingForDroneData();

      // Optimistic update - remove PDF from droneAnalysisPdfs array
      setAssessment((prev: any) => {
        if (!prev) return prev;

        const updated = { ...prev };

        // Handle new droneAnalysisPdfs array structure
        if (
          updated.droneAnalysisPdfs &&
          Array.isArray(updated.droneAnalysisPdfs)
        ) {
          updated.droneAnalysisPdfs = updated.droneAnalysisPdfs.filter(
            (pdf: any) => pdf.pdfType !== selectedPdfType,
          );
        }

        // Handle legacy structure
        if (selectedPdfType === "plant_health") {
          updated.plantHealthPdfUrl = null;
          updated.plantHealthData = null;
          // Also clear legacy single PDF if it was plant health
          if (
            updated.droneAnalysisData?.report?.detected_analysis_type ===
            "plant_stress"
          ) {
            updated.droneAnalysisPdfUrl = null;
            updated.droneAnalysisData = null;
          }
        }

        if (selectedPdfType === "flowering") {
          updated.floweringPdfUrl = null;
          updated.floweringData = null;
          // Also clear legacy single PDF if it was flowering
          if (
            updated.droneAnalysisData?.report?.detected_analysis_type !==
            "plant_stress"
          ) {
            updated.droneAnalysisPdfUrl = null;
            updated.droneAnalysisData = null;
          }
        }

        return updated;
      });

      toast({
        title: "PDF Deleted",
        description: "The PDF has been deleted successfully.",
      });
    } catch (err: any) {
      toast({
        title: "Delete Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setDeletingPDF(false);
    }
  };

  // Upload drone PDF
  const handleUploadPDF = async () => {
    if (!selectedPDFFile || !assessment?._id) {
      toast({
        title: "Validation Error",
        description: "Please select a PDF file",
        variant: "destructive",
      });
      return;
    }

    setUploadingPDF(true);
    try {
      const result = await assessmentsApiService.uploadDronePDF(
        assessment._id,
        selectedPDFFile,
        selectedPdfType,
      );

      let responseData = result?.data ?? result?.response ?? result;

      let extractedData = null;
      if (responseData?.droneAnalysisData) {
        extractedData = responseData.droneAnalysisData;
      } else if (result?.droneAnalysisData) {
        extractedData = result.droneAnalysisData;
      } else if (result?.data?.droneAnalysisData) {
        extractedData = result.data.droneAnalysisData;
      }

      let pdfUrl = null;
      if (responseData?.droneAnalysisPdfUrl) {
        pdfUrl = responseData.droneAnalysisPdfUrl;
      } else if (result?.droneAnalysisPdfUrl) {
        pdfUrl = result.droneAnalysisPdfUrl;
      } else if (result?.data?.droneAnalysisPdfUrl) {
        pdfUrl = result.data.droneAnalysisPdfUrl;
      }

      if (extractedData || pdfUrl) {
        setAssessment({
          ...assessment,
          droneAnalysisPdfUrl: pdfUrl || assessment.droneAnalysisPdfUrl,
          droneAnalysisData: extractedData || assessment.droneAnalysisData,
        });
      }

      // Reload assessment
      try {
        const updated = await assessmentsApiService.getAssessmentById(
          assessment._id,
        );
        const updatedData = updated.data || updated;
        const latestDroneData = updatedData?.droneAnalysisData || extractedData;
        setAssessment({
          ...updatedData,
          droneAnalysisData: latestDroneData || updatedData?.droneAnalysisData,
        });
      } catch (reloadErr) {
        console.warn(
          "⚠️ Failed to reload assessment, using upload result:",
          reloadErr,
        );
      }

      const hasStructured =
        extractedData?.report ||
        extractedData?.field ||
        (extractedData?.weed_analysis &&
          (getWeedAnalysisLevels(extractedData.weed_analysis).length > 0 ||
            extractedData.weed_analysis.total_area_hectares != null));
      const hasExtractedData =
        extractedData &&
        (hasStructured ||
          extractedData.cropHealth ||
          extractedData.coverage !== undefined ||
          (extractedData.anomalies &&
            Array.isArray(extractedData.anomalies) &&
            extractedData.anomalies.length > 0) ||
          Object.keys(extractedData).length > 0);

      if (!hasExtractedData && assessment._id) {
        startPollingForDroneData(assessment._id);
      } else {
        stopPollingForDroneData();
      }

      toast({
        title: "Upload Successful",
        description: hasExtractedData
          ? "Drone PDF uploaded and analyzed successfully. Extracted data is displayed below."
          : "Drone PDF uploaded successfully. Analysis data is being processed...",
      });

      setSelectedPDFFile(null);
    } catch (err: any) {
      console.error("❌ Failed to upload PDF:", err);
      toast({
        title: "Upload Failed",
        description: err.message || "Failed to upload drone PDF",
        variant: "destructive",
      });
    } finally {
      setUploadingPDF(false);
    }
  };

  // Save comprehensive notes
  const handleSaveNotes = async () => {
    if (!assessment?._id) {
      toast({
        title: "Error",
        description: "Assessment not loaded",
        variant: "destructive",
      });
      return;
    }

    setSavingNotes(true);
    try {
      await assessmentsApiService.updateAssessment(assessment._id, {
        comprehensiveNotes: comprehensiveNotes,
      });

      const updated = await assessmentsApiService.getAssessmentById(
        assessment._id,
      );
      setAssessment(updated.data || updated);

      toast({
        title: "Success",
        description: "Comprehensive notes saved successfully",
      });
    } catch (err: any) {
      console.error("Failed to save notes:", err);
      toast({
        title: "Save Failed",
        description: err.message || "Failed to save notes",
        variant: "destructive",
      });
    } finally {
      setSavingNotes(false);
    }
  };

  // Generate report
  const handleGenerateReport = async () => {
    if (!assessment?._id) {
      toast({
        title: "Error",
        description: "Assessment not loaded",
        variant: "destructive",
      });
      return;
    }

    if (
      riskScore === null ||
      riskScore === undefined ||
      typeof riskScore !== "number"
    ) {
      toast({
        title: "Validation Error",
        description: "Please calculate risk score before generating report",
        variant: "destructive",
      });
      return;
    }

    if (!comprehensiveNotes || comprehensiveNotes.trim().length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add comprehensive notes before generating report",
        variant: "destructive",
      });
      return;
    }

    setGeneratingReport(true);
    try {
      await assessmentsApiService.generateReport(assessment._id);

      const updated = await assessmentsApiService.getAssessmentById(
        assessment._id,
      );
      setAssessment(updated.data || updated);

      toast({
        title: "Success",
        description: "Report generated. Insurer has been notified.",
      });
    } catch (err: any) {
      console.error("Failed to generate report:", err);
      toast({
        title: "Generation Failed",
        description: err.message || "Failed to generate report",
        variant: "destructive",
      });
    } finally {
      setGeneratingReport(false);
    }
  };

  // Get risk score color
  const getRiskScoreColor = (score: number | null | undefined) => {
    if (score === null || score === undefined || typeof score !== "number")
      return "bg-gray-500";
    if (score <= 30) return "bg-green-600";
    if (score <= 70) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Get risk score label
  const getRiskScoreLabel = (score: number | null | undefined) => {
    if (score === null || score === undefined || typeof score !== "number")
      return "Not Calculated";
    if (score <= 30) return "Low Risk";
    if (score <= 70) return "Medium Risk";
    return "High Risk";
  };

  const generateDroneDataPDF = async () => {
    const currentPdfData = getCurrentPdfData();
    if (!currentPdfData?.droneAnalysisData) {
      toast({
        title: "No Data Available",
        description:
          "No drone analysis data available for the selected PDF type",
        variant: "destructive",
      });
      return;
    }

    setGeneratingPDF(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const d = currentPdfData.droneAnalysisData;
      const report = d.report ?? {};
      const field = d.field ?? {};
      const analysisType = report.detected_analysis_type;
      const isPlantStress = analysisType === "plant_stress";
      const rightLabel = isPlantStress
        ? "PLANT STRESS ANALYSIS"
        : "FLOWERING ESTIMATOR";
      const totalLabel = isPlantStress ? "PLANT STRESS" : "FLOWERING";
      const tableLabel = isPlantStress ? "Stress level" : "Stress level";
      const tableSectionTitle = isPlantStress
        ? "STRESS LEVEL TABLE"
        : "STRESS LEVEL TABLE";

      const doc = new jsPDF("p", "mm", "a4");
      const W = doc.internal.pageSize.getWidth(); // 210
      const H = doc.internal.pageSize.getHeight(); // 297
      const M = 14; // margin
      const cropName = (field.crop ?? "N/A").toString();
      const headerCropText = `Crop Monitoring - ${cropName}`;

      // Helper: draw page header (provider, Crop Monitoring - crop, survey date — all right-aligned)
      const drawPageHeader = (startY: number, rowH: number = 20) => {
        doc.setFillColor(248, 250, 252);
        doc.rect(0, startY, W, rowH, "F");
        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(0.3);
        doc.line(0, startY + rowH, W, startY + rowH);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(22, 101, 52);
        doc.text(report.provider ?? "STARHAWK", W - M, startY + 7, {
          align: "right",
        });
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(8);
        doc.text(headerCropText, W - M, startY + 12, { align: "right" });
        doc.setFont("helvetica", "normal");
        if (report.survey_date) {
          doc.text(`Survey date: ${report.survey_date}`, W - M, startY + 17, {
            align: "right",
          });
        }
        return startY + rowH;
      };

      // ─── PAGE 1 ────────────────────────────────────────────────────────────

      // ── HEADER first (Crop Monitoring - crop, provider, survey date) ──────
      const headerBottom = drawPageHeader(0, 20);

      // ── DUAL TITLE STRIP below header (page 1 only) ────────────────────────
      doc.setFillColor(220, 252, 231);
      doc.rect(0, headerBottom, W / 2, 14, "F");
      doc.setTextColor(22, 101, 52);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("PLANT HEALTH MONITORING", W / 4, headerBottom + 9, {
        align: "center",
      });
      doc.setFillColor(13, 110, 97);
      doc.rect(W / 2, headerBottom, W / 2, 14, "F");
      doc.setTextColor(255, 255, 255);
      doc.text(rightLabel, (W / 4) * 3, headerBottom + 9, { align: "center" });

      let y = headerBottom + 14 + 8; // below dual strip

      // ─── FIELD INFO BLOCK (margin-x 8, green-600 borders) ─────────────────
      const infoMarginX = 8; // 8mm horizontal margin (≈ mx-8)
      const infoLeft = M + infoMarginX;
      const infoRight = W - M - infoMarginX;
      const infoW = infoRight - infoLeft;
      const infoH = 22;
      const green600 = { r: 22, g: 163, b: 74 };
      const col1Right = infoLeft + infoW / 2;
      const col2Left = col1Right;

      doc.setFillColor(255, 255, 255);
      doc.rect(infoLeft, y, infoW, infoH, "F");
      doc.setDrawColor(green600.r, green600.g, green600.b);
      doc.setLineWidth(0.53); // ~2px
      doc.line(infoLeft, y + infoH, infoRight, y + infoH); // border-bottom
      doc.line(col1Right, y, col1Right, y + infoH); // border-right between columns

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text("Crop:", infoLeft + 4, y + 8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text(field.crop ?? "N/A", infoLeft + 18, y + 8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text("Growing stage:", infoLeft + 4, y + 17);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text(field.growing_stage ?? "N/A", infoLeft + 32, y + 17);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text("Field area:", col2Left + 4, y + 8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text(
        field.area_hectares != null
          ? `${Number(field.area_hectares).toFixed(2)} Hectare`
          : "N/A",
        col2Left + 24,
        y + 8,
      );
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text("Analysis name:", col2Left + 4, y + 17);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text(
        report.analysis_name ?? report.type ?? "N/A",
        col2Left + 32,
        y + 17,
      );

      y += infoH + 8;

      // ─── STRESS LEVEL TABLE (section title) ──────────────────────────────
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(34, 197, 94);
      doc.text(tableSectionTitle, W / 2 + M, y + 5, { align: "left" });
      y += 12;

      const levels = getWeedAnalysisLevels(d.weed_analysis);
      const pieAreaEnd = W / 2 - 5;
      const tableX = W / 2 + M;
      const tableW = W - tableX - M;
      const rowH = 9;

      // ─── PIE CHART (left side) ────────────────────────────────────────────
      const pieSize = 58;
      const pieX = M + (pieAreaEnd - M) / 2 - pieSize / 2;
      const pieY = y;

      if (levels.length > 0) {
        const pieDataUrl = drawPieChartToDataUrl(levels, LEVEL_COLORS, 160);
        const pieCenterX = pieX + pieSize / 2;
        const pieCenterY = pieY + pieSize / 2;
        const pieRadius = pieSize / 2 - 3;
        const blockH = 6;
        const blockW = 14;
        const blockGap = 2;
        const blockY = pieY + pieSize + 4;
        const total = levels.reduce((s, l) => s + (l.percentage ?? 0), 0) || 1;
        let blockX = pieX;
        const blockCenters: { x: number; y: number; midAngle: number }[] = [];

        if (pieDataUrl) {
          doc.addImage(pieDataUrl, "PNG", pieX, pieY, pieSize, pieSize);
        }
        // Compute slice mid-angles and block positions
        let startAngle = -Math.PI / 2;
        levels.forEach((lv: { level?: string; percentage?: number }) => {
          const sliceAngle = ((lv.percentage ?? 0) / total) * 2 * Math.PI;
          const midAngle = startAngle + sliceAngle / 2;
          blockCenters.push({
            x: blockX + blockW / 2,
            y: blockY + blockH / 2,
            midAngle,
          });
          blockX += blockW + blockGap;
          startAngle += sliceAngle;
        });

        // Connector lines from pie edge to each block (drawn first, behind percentages)
        doc.setDrawColor(120, 120, 120);
        doc.setLineWidth(0.25);
        blockCenters.forEach((bc) => {
          const edgeX = pieCenterX + pieRadius * Math.cos(bc.midAngle);
          const edgeY = pieCenterY + pieRadius * Math.sin(bc.midAngle);
          doc.line(edgeX, edgeY, bc.x, bc.y);
        });

        // Percentage blocks (rendered on top of lines)
        blockX = pieX;
        levels.forEach((lv: { level?: string; percentage?: number }, i: number) => {
          const [r, g, b] = hexToRgb(getLevelColor(i));
          doc.setFillColor(r, g, b);
          doc.rect(blockX, blockY, blockW, blockH, "F");
          doc.setFontSize(6);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(255, 255, 255);
          doc.text(
            `${(lv.percentage ?? 0).toFixed(1)}%`,
            blockX + blockW / 2,
            blockY + blockH - 1.5,
            { align: "center" },
          );
          blockX += blockW + blockGap;
        });
      }

      // ─── TABLE (right side) ───────────────────────────────────────────────
      if (levels.length > 0) {
        // Header row
        doc.setFillColor(13, 110, 97);
        doc.rect(tableX, y, tableW, rowH, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "bold");
        doc.text(tableLabel, tableX + 2, y + 6);
        doc.text("%", tableX + tableW * 0.58, y + 6);
        doc.text("Hectare", tableX + tableW * 0.78, y + 6);
        y += rowH;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);

        levels.forEach((lv: any, i: number) => {
          const bg = i % 2 === 0 ? [255, 255, 255] : [245, 247, 245];
          doc.setFillColor(bg[0], bg[1], bg[2]);
          doc.rect(tableX, y, tableW, rowH, "F");

          // Colored circle dot
          const [r, g, b] = hexToRgb(getLevelColor(i));
          doc.setFillColor(r, g, b);
          doc.circle(tableX + 3, y + 5, 2, "F");

          doc.setTextColor(30, 30, 30);
          doc.text(lv.level ?? "N/A", tableX + 7, y + 6);
          doc.text(
            `${(lv.percentage ?? 0).toFixed(2)}%`,
            tableX + tableW * 0.58,
            y + 6,
          );
          doc.text(
            `${(lv.area_hectares ?? 0).toFixed(2)}`,
            tableX + tableW * 0.78,
            y + 6,
          );

          // Bottom border
          doc.setDrawColor(220, 220, 220);
          doc.setLineWidth(0.3);
          doc.line(tableX, y + rowH, tableX + tableW, y + rowH);
          y += rowH;
        });
      }

      // ─── TOTAL AREA BLOCK (two-line layout like browser) ────────────────────
      const wa = d.weed_analysis;
      if (wa) {
        const lvs = getWeedAnalysisLevels(wa);
        const totalHa = getTotalStressArea(wa, lvs);
        const totalPct = getTotalStressPercent(wa, lvs);
        const displayHa = isPlantStress
          ? totalHa
          : (wa.total_area_hectares ?? totalHa);
        const displayPct = isPlantStress
          ? totalPct
          : (wa.total_area_percent ?? totalPct);

        const bannerY =
          Math.max(y, pieAreaEnd > 0 ? pieY + pieSize + 18 : y) + 8;
        const line1H = 6;
        const line2H = 8;
        const bannerH = 20;

        doc.setFillColor(34, 197, 94);
        doc.rect(0, bannerY, W, bannerH, "F");
        doc.setFillColor(22, 101, 52);
        doc.triangle(0, bannerY, 10, bannerY, 0, bannerY + 10, "F");

        // Line 1: title
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text(`Total area ${totalLabel}:`, W / 2, bannerY + line1H, {
          align: "center",
        });

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        const dimText = `${displayHa.toFixed(2)} ha =`;
        const boxW = 32;
        const boxH = 10;
        const gap = 6;
        const dimWidth = doc.getTextWidth(dimText) ?? 22;
        const totalStatsW = dimWidth + gap + boxW;
        const statsLeft = (W - totalStatsW) / 2;
        const boxX = statsLeft + dimWidth + gap;
        const boxY = bannerY + line1H + 2;
        const statsY = bannerY + line1H + line2H + 1;
        doc.text(dimText, statsLeft, statsY);
        doc.setFillColor(13, 110, 97);
        doc.rect(boxX, boxY, boxW, boxH, "F");
        doc.setFontSize(9);
        doc.text(`${Math.round(displayPct)}% field`, boxX + boxW / 2, statsY, {
          align: "center",
        });

        y = bannerY + bannerH + 12;
      }

      // ─── ADDITIONAL INFO ──────────────────────────────────────────────────
      if (d.additional_info) {
        if (y > H - 40) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text("Additional information: (or recommendation)", M, y);
        y += 5;
        // Box
        doc.setFillColor(250, 250, 250);
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.4);
        const infoBoxH = 22;
        doc.rect(M, y, W - M * 2, infoBoxH, "FD");
        doc.setTextColor(120, 120, 120);
        doc.setFontSize(9);
        const splitInfo = doc.splitTextToSize(d.additional_info, W - M * 2 - 6);
        doc.text(splitInfo, M + 3, y + 7);
        y += infoBoxH + 8;
      }

      // ─── FOOTER (justify-between: powered by left, walk through right) ─────
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(160, 160, 160);
      doc.text("Powered by:", M, H - 8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(34, 197, 94);
      doc.text(report.provider ?? "STARHAWK", M + 20, H - 8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(160, 160, 160);
      doc.text("Walk through field maps on starhawk.rw", W - M, H - 8, {
        align: "right",
      });

      // ─── PAGE 2: MAP IMAGE ────────────────────────────────────────────────
      const mapImage = d.map_image;
      if (mapImage) {
        let imgDataUrl: string | null = null;
        if (mapImage.data) {
          imgDataUrl = `data:image/${mapImage.format || "png"};base64,${mapImage.data}`;
        } else if (mapImage.url) {
          try {
            const resp = await fetch(mapImage.url, { mode: "cors" });
            const blob = await resp.blob();
            imgDataUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          } catch (e) {
            console.warn("Could not fetch map image for PDF:", e);
          }
        }

        if (imgDataUrl) {
          doc.addPage();

          // Page 2 header — same as page 1 (Crop Monitoring - crop, provider, survey date), NO dual title strip
          const page2HeaderBottom = drawPageHeader(0, 20);

          // Map image taking up most of the page
          const imgY = page2HeaderBottom + 6;
          const imgW = W - M * 2;
          const imgH = H - imgY - 30;
          const fmt =
            imgDataUrl.startsWith("data:image/jpeg") ||
            imgDataUrl.startsWith("data:image/jpg")
              ? "JPEG"
              : "PNG";
          doc.addImage(imgDataUrl, fmt, M, imgY, imgW, imgH);

          // Legend strip below map — colored blocks
          const lvs2 = getWeedAnalysisLevels(d.weed_analysis);
          if (lvs2.length > 0) {
            const legendY = imgY + imgH + 4;
            const blockW = (W - M * 2) / lvs2.length;
            lvs2.forEach((lv: any, i: number) => {
              const [r, g, b] = hexToRgb(getLevelColor(i));
              doc.setFillColor(r, g, b);
              doc.rect(M + i * blockW, legendY, blockW - 2, 5, "F");
              doc.setTextColor(60, 60, 60);
              doc.setFontSize(7);
              doc.setFont("helvetica", "normal");
              doc.text(
                lv.level ?? "",
                M + i * blockW + blockW / 2,
                legendY + 11,
                { align: "center" },
              );
            });
          }

          // Footer on page 2 (justify-between)
          doc.setFontSize(7);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(160, 160, 160);
          doc.text("Powered by:", M, H - 5);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(34, 197, 94);
          doc.text(report.provider ?? "STARHAWK", M + 20, H - 5);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(160, 160, 160);
          doc.text("Walk through field maps on starhawk.rw", W - M, H - 5, {
            align: "right",
          });
        }
      }

      const dateStr = new Date().toISOString().split("T")[0];
      doc.save(`drone-analysis-${selectedPdfType}-${dateStr}.pdf`);

      toast({
        title: "PDF Generated",
        description:
          "Drone analysis report PDF has been downloaded successfully",
      });
    } catch (err: any) {
      console.error("Failed to generate PDF:", err);
      toast({
        title: "PDF Generation Failed",
        description: err.message || "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingPDF(false);
    }
  };

  // Fetch map image from API or use embedded data
  const fetchMapImage = async () => {
    const currentPdfData = getCurrentPdfData();
    if (!assessment?._id || !currentPdfData?.droneAnalysisData?.map_image) {
      toast({
        title: "No Image Data",
        description: "Map image data is not available",
        variant: "default",
      });
      return;
    }

    setLoadingMapImage(true);
    try {
      const mapImage = currentPdfData.droneAnalysisData.map_image;

      if (mapImage.data) {
        setMapImageUrl(
          `data:image/${mapImage.format || "png"};base64,${mapImage.data}`,
        );
        toast({
          title: "Success",
          description: "Map image displayed from embedded data",
        });
        setLoadingMapImage(false);
        return;
      }

      if (mapImage.url) {
        setMapImageUrl(mapImage.url);
        toast({ title: "Success", description: "Map image loaded from URL" });
        setLoadingMapImage(false);
        return;
      }

      const ASSESSMENTS_BASE_URL = import.meta.env.DEV
        ? `/api/v1${API_ENDPOINTS.ASSESSMENTS.BASE}`
        : `${API_BASE_URL}${API_ENDPOINTS.ASSESSMENTS.BASE}`;

      const imageEndpoint = `${ASSESSMENTS_BASE_URL}/${assessment._id}/map-image`;
      const token = getAuthToken();
      const headers: HeadersInit = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(imageEndpoint, { headers });

      if (
        response.ok &&
        response.headers.get("content-type")?.startsWith("image/")
      ) {
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        setMapImageUrl(imageUrl);
        toast({
          title: "Success",
          description: "Map image loaded from server",
        });
      } else if (response.status === 404) {
        if (assessment.droneAnalysisPdfUrl) {
          toast({
            title: "Image in PDF",
            description:
              "Map image is embedded in the PDF. Please view the PDF to see it.",
            variant: "default",
          });
        } else {
          throw new Error("Map image endpoint not available");
        }
      } else {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
    } catch (err: any) {
      console.error("Failed to fetch map image:", err);
      const currentPdfData = getCurrentPdfData();
      const mapImage = currentPdfData?.droneAnalysisData?.map_image;
      if (mapImage?.data) {
        setMapImageUrl(
          `data:image/${mapImage.format || "png"};base64,${mapImage.data}`,
        );
      } else {
        toast({
          title: "Image Not Available",
          description:
            err.message ||
            "Could not load map image. It may be embedded in the PDF.",
          variant: "default",
        });
      }
    } finally {
      setLoadingMapImage(false);
    }
  };

  // Filter farmers
  const filteredFarmers = farmers.filter((farmer) => {
    const query = searchQuery.toLowerCase();
    return (
      farmer.firstName.toLowerCase().includes(query) ||
      farmer.lastName.toLowerCase().includes(query) ||
      farmer.email.toLowerCase().includes(query) ||
      farmer.phoneNumber.includes(query) ||
      farmer.farmerProfile.farmProvince.toLowerCase().includes(query) ||
      farmer.farmerProfile.farmDistrict.toLowerCase().includes(query)
    );
  });

  // Calculate dashboard stats
  const dashboardStats = {
    totalFarmers: farmers.length,
    totalFarms: farmers.reduce((sum, f) => sum + f.farms.length, 0),
    pendingFarms: farmers.reduce(
      (sum, f) =>
        sum + f.farms.filter((farm) => farm.status === "PENDING").length,
      0,
    ),
    registeredFarms: farmers.reduce(
      (sum, f) =>
        sum + f.farms.filter((farm) => farm.status === "REGISTERED").length,
      0,
    ),
  };

  // Render Farmers List View
  if (viewMode === "farmers") {
    return (
      <div className="min-h-screen bg-gray-50 pt-6 pb-8">
        {/* Dashboard Header */}
        <div className="px-6 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-3">
                  <Shield className="h-6 w-6 text-green-600" />
                  Risk Assessment Dashboard
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Manage assigned farms and assessments
                </p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search farmers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64 bg-white border-gray-300"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="px-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-md">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600 mb-1">
                      Total Farmers
                    </p>
                    <p className="text-3xl font-bold text-blue-900">
                      {dashboardStats.totalFarmers}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-200 rounded-full">
                    <Users className="h-6 w-6 text-blue-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-md">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600 mb-1">
                      Total Farms
                    </p>
                    <p className="text-3xl font-bold text-green-900">
                      {dashboardStats.totalFarms}
                    </p>
                  </div>
                  <div className="p-3 bg-green-200 rounded-full">
                    <Sprout className="h-6 w-6 text-green-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 shadow-md">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-600 mb-1">
                      Pending KML
                    </p>
                    <p className="text-3xl font-bold text-yellow-900">
                      {dashboardStats.pendingFarms}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-200 rounded-full">
                    <Clock className="h-6 w-6 text-yellow-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 shadow-md">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-emerald-600 mb-1">
                      Registered
                    </p>
                    <p className="text-3xl font-bold text-emerald-900">
                      {dashboardStats.registeredFarms}
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-200 rounded-full">
                    <CheckCircle className="h-6 w-6 text-emerald-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6">
          {loading ? (
            <Card className="bg-white border border-gray-200 shadow-lg rounded-xl">
              <CardContent className="p-16">
                <div className="flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
                  <p className="text-sm text-gray-600">Loading farmers...</p>
                </div>
              </CardContent>
            </Card>
          ) : filteredFarmers.length === 0 ? (
            <Card className="bg-white border border-gray-200 shadow-lg rounded-xl">
              <CardContent className="p-16 text-center">
                <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-base font-semibold text-gray-900 mb-1">
                  No farmers found
                </p>
                <p className="text-sm text-gray-500">
                  Try adjusting your search criteria
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white border border-gray-200 shadow-lg rounded-xl overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b-2 border-gray-200">
                        <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase">
                          Farmer
                        </th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase">
                          Contact
                        </th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase">
                          Location
                        </th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase">
                          Farms
                        </th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase">
                          Status
                        </th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredFarmers.map((farmer) => (
                        <tr
                          key={farmer.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-green-100 rounded-full">
                                <User className="h-5 w-5 text-green-600" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {farmer.firstName} {farmer.lastName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  ID: {farmer.id.slice(-8)}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="text-sm text-gray-900">
                              <p className="font-medium">{farmer.email}</p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {farmer.phoneNumber}
                              </p>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-1.5 text-sm text-gray-600">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <span className="text-xs">
                                {farmer.farmerProfile.farmProvince},{" "}
                                {farmer.farmerProfile.farmDistrict}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="space-y-2">
                              {farmer.farms.length === 0 ? (
                                <span className="text-xs text-gray-400">
                                  No farms
                                </span>
                              ) : (
                                farmer.farms.map((farm) => (
                                  <div
                                    key={farm.id}
                                    className="flex items-center gap-2"
                                  >
                                    <Sprout className="h-3.5 w-3.5 text-green-600" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium text-gray-900 truncate">
                                        {farm.name || farm.cropType}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {farm.cropType} •{" "}
                                        {new Date(
                                          farm.sowingDate,
                                        ).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="space-y-2">
                              {farmer.farms.map((farm) => (
                                <Badge
                                  key={farm.id}
                                  className={
                                    farm.status === "PENDING"
                                      ? "bg-yellow-100 text-yellow-800 border-yellow-300 text-xs"
                                      : "bg-green-100 text-green-800 border-green-300 text-xs"
                                  }
                                >
                                  {farm.status}
                                </Badge>
                              ))}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="space-y-2">
                              {farmer.farms.map((farm) => (
                                <div key={farm.id}>
                                  {farm.status === "PENDING" ? (
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        setSelectedFarm(farm);
                                        setSelectedFarmer(farmer);
                                        setShowKMLUpload(farm.id);
                                      }}
                                      className="bg-green-600 hover:bg-green-700 text-white text-xs"
                                    >
                                      <Upload className="h-3 w-3 mr-1.5" />
                                      Upload KML
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedFarm(farm);
                                        setSelectedFarmer(farmer);
                                        loadAssessmentForFarm(farm.id);
                                      }}
                                      className="border-green-600 text-green-600 hover:bg-green-50 text-xs"
                                    >
                                      <Eye className="h-3 w-3 mr-1.5" />
                                      View
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* KML Upload Dialog */}
        {showKMLUpload && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="bg-white w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle>Upload KML File</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Farm Name</Label>
                  <Input
                    value={farmName}
                    onChange={(e) => setFarmName(e.target.value)}
                    placeholder="Enter farm name"
                  />
                </div>
                <div>
                  <Label>KML File (.kml, max 1MB)</Label>
                  <Input
                    type="file"
                    accept=".kml"
                    onChange={handleKMLFileChange}
                  />
                  {selectedKMLFile && (
                    <p className="text-sm text-gray-600 mt-2">
                      Selected: {selectedKMLFile.name} (
                      {(selectedKMLFile.size / 1024).toFixed(2)} KB)
                    </p>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleUploadKML(showKMLUpload)}
                    disabled={
                      !selectedKMLFile || !farmName.trim() || uploadingKML
                    }
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    {uploadingKML ? "Uploading..." : "Upload"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowKMLUpload(null);
                      setSelectedKMLFile(null);
                      setFarmName("");
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  }

  // Render Assessment View
  if (!assessment || !selectedFarm) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-6 pb-8">
      {/* Dashboard Header */}
      <div className="px-6 mb-6">
        <div className="px-6 py-5">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setViewMode("farmers");
                setAssessment(null);
                setSelectedFarm(null);
                setSelectedFarmer(null);
              }}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-3">
              <Shield className="h-6 w-6 text-green-600" />
              Assessment Details
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {selectedFarmer?.firstName} {selectedFarmer?.lastName} •{" "}
              {selectedFarm.cropType} • {selectedFarm.name || "Farm"}
            </p>
          </div>
        </div>
      </div>

      {/* Assessment Stats */}
      <div className="px-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-green-600 mb-1">
                    Risk Score
                  </p>
                  <p className="text-2xl font-bold text-green-900">
                    {riskScore !== null &&
                    riskScore !== undefined &&
                    typeof riskScore === "number"
                      ? riskScore.toFixed(1)
                      : "N/A"}
                  </p>
                </div>
                <Activity className="h-5 w-5 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-600 mb-1">
                    Status
                  </p>
                  <p className="text-lg font-bold text-blue-900">
                    {assessment.status || "N/A"}
                  </p>
                </div>
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card
            className={`bg-gradient-to-br ${
              (assessment.droneAnalysisPdfs?.length ?? 0) > 0 ||
              assessment.droneAnalysisPdfUrl
                ? "from-purple-50 to-purple-100 border-purple-200"
                : "from-gray-50 to-gray-100 border-gray-200"
            } shadow-md`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium mb-1">Drone PDF</p>
                  <p className="text-lg font-bold">
                    {(assessment.droneAnalysisPdfs?.length ?? 0) > 0 ||
                    assessment.droneAnalysisPdfUrl
                      ? `${assessment.droneAnalysisPdfs?.length ?? 1} Uploaded`
                      : "Not Uploaded"}
                  </p>
                </div>
                <Upload
                  className={`h-5 w-5 ${
                    (assessment.droneAnalysisPdfs?.length ?? 0) > 0 ||
                    assessment.droneAnalysisPdfUrl
                      ? "text-purple-600"
                      : "text-gray-400"
                  }`}
                />
              </div>
            </CardContent>
          </Card>

          <Card
            className={`bg-gradient-to-br ${
              assessment.reportGenerated
                ? "from-emerald-50 to-emerald-100 border-emerald-200"
                : "from-gray-50 to-gray-100 border-gray-200"
            } shadow-md`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium mb-1">Report</p>
                  <p className="text-lg font-bold">
                    {assessment.reportGenerated ? "Generated" : "Pending"}
                  </p>
                </div>
                <FileText
                  className={`h-5 w-5 ${assessment.reportGenerated ? "text-emerald-600" : "text-gray-400"}`}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="bg-white border border-gray-200 shadow-md inline-flex h-12 items-center justify-center rounded-xl p-1.5 gap-1">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-green-600 data-[state=active]:text-white data-[state=active]:shadow-md px-5 py-2.5 rounded-lg text-sm font-medium transition-all"
            >
              <FileText className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="field-data"
              className="data-[state=active]:bg-green-600 data-[state=active]:text-white data-[state=active]:shadow-md px-5 py-2.5 rounded-lg text-sm font-medium transition-all"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Field Data
            </TabsTrigger>
            <TabsTrigger
              value="weather"
              className="data-[state=active]:bg-green-600 data-[state=active]:text-white data-[state=active]:shadow-md px-5 py-2.5 rounded-lg text-sm font-medium transition-all"
            >
              <CloudRain className="h-4 w-4 mr-2" />
              Weather
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            {/* Risk Score Card */}
            <Card className="bg-gradient-to-br from-white to-green-50/30 border-2 border-green-200 shadow-lg rounded-xl">
              <CardHeader className="bg-gradient-to-r from-green-50 to-white border-b border-green-200 px-6 py-5">
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Activity className="h-5 w-5 text-green-600" />
                    </div>
                    <span>Risk Assessment Score</span>
                  </div>
                  {riskScore !== null &&
                    riskScore !== undefined &&
                    typeof riskScore === "number" && (
                      <Badge
                        className={`${getRiskScoreColor(riskScore)} text-white`}
                      >
                        {getRiskScoreLabel(riskScore)}
                      </Badge>
                    )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {riskScore !== null &&
                riskScore !== undefined &&
                typeof riskScore === "number" ? (
                  <div className="text-center py-6">
                    <div
                      className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${getRiskScoreColor(riskScore)} text-white text-4xl font-bold mb-4`}
                    >
                      {riskScore.toFixed(1)}
                    </div>
                    <p className="text-gray-600">
                      {getRiskScoreLabel(riskScore)}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-600 mb-4">
                      Risk score has not been calculated yet.
                    </p>
                    <Button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!calculatingRisk && assessment?._id) {
                          handleCalculateRiskScore();
                        }
                      }}
                      disabled={calculatingRisk || !assessment?._id}
                      className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {calculatingRisk ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Calculating...
                        </>
                      ) : (
                        <>
                          <Activity className="h-4 w-4 mr-2" />
                          Calculate Risk Score
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-gray-500 mt-3">
                      Note: If calculation fails, the endpoint may not be
                      available yet on the server.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Drone Analysis PDF Card — Tab-first layout */}
            <Card className="bg-white border border-gray-200 shadow-lg rounded-xl overflow-hidden">
              {/* Card Header */}
              <div className="border-b border-gray-200 bg-gradient-to-r from-green-50 to-white">
                {/* Title row */}
                <div className="px-6 pt-5 pb-4 flex items-center gap-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Leaf className="h-5 w-5 text-green-600" />
                  </div>
                  <span className="text-xl font-bold text-gray-900">
                    Drone Analysis
                  </span>
                </div>

                {/* Tab navigation — styled like Overview / Field Data / Weather tabs */}
                <div className="px-4 pb-4">
                  <div className="bg-white border border-gray-200 shadow-sm inline-flex h-11 items-center justify-center rounded-xl p-1 gap-1">
                    {(["plant_health", "flowering"] as const).map((pdfType) => {
                      const active = selectedPdfType === pdfType;

                      return (
                        <button
                          key={pdfType}
                          onClick={() => {
                            setSelectedPdfType(pdfType);
                            // Clear selected file when switching tabs to prevent cross-tab file state
                            setSelectedPDFFile(null);
                            // Stop polling when switching tabs to prevent processing state persisting
                            stopPollingForDroneData();
                          }}
                          className={[
                            "px-5 py-2 rounded-lg text-sm font-medium transition-all focus:outline-none flex items-center gap-1.5",
                            active
                              ? "bg-green-600 text-white shadow-md"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                          ].join(" ")}
                        >
                          {pdfType === "plant_health" ? (
                            <>
                              <Leaf className="h-4 w-4" />
                              Plant Health
                            </>
                          ) : (
                            <>
                              <Sprout className="h-4 w-4" />
                              Flowering
                            </>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sub-row: View PDF + Download (left) | Provider info (right) — only when data exists */}
                {getCurrentPdfData()?.droneAnalysisData &&
                  (() => {
                    const rpt =
                      getCurrentPdfData()!.droneAnalysisData.report ?? {};
                    return (
                      <div className="flex items-center justify-between px-6 py-4 gap-4 flex-wrap border-t border-gray-200 bg-white">
                        {/* Left: action buttons */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {getCurrentPdfData()?.pdfUrl && (
                            <a
                              href={getFullPdfUrl(getCurrentPdfData()?.pdfUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 px-3 py-1.5 bg-white border border-gray-300 h-[38px] rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View PDF
                            </a>
                          )}
                          {getCurrentPdfData()?.pdfUrl && (
                            <button
                              type="button"
                              onClick={handleDeletePDF}
                              disabled={deletingPDF}
                              className="inline-flex items-center gap-1.5 text-sm font-medium text-white h-[38px] px-3 bg-red-500 rounded-lg hover:bg-red-500/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Trash className="h-3.5 w-3.5" />
                              {deletingPDF ? "Deleting..." : "Delete PDF"}
                            </button>
                          )}
                          <Button
                            onClick={generateDroneDataPDF}
                            disabled={generatingPDF}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white h-[38px]"
                          >
                            {generatingPDF ? (
                              <>
                                <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white mr-1.5"></div>
                                Generating...
                              </>
                            ) : (
                              <>
                                <Download className="h-3.5 w-3.5 mr-1.5" />
                                Download Report
                              </>
                            )}
                          </Button>
                        </div>
                        {/* Right: provider / type / survey date */}
                        <div className="text-right">
                          <p className="text-base font-bold text-green-600">
                            {rpt.provider ?? "STARHAWK"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {rpt.type ?? "Crop Monitoring"}
                          </p>
                          {rpt.survey_date && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              Survey date:{" "}
                              <span className="font-semibold text-green-700">
                                {rpt.survey_date}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })()}
              </div>

              <CardContent className="p-0">
                {/* ── Upload section: shown when selected tab has NO PDF ── */}
                {!getCurrentPdfData()?.pdfUrl && (
                  <div className="p-6 space-y-3">
                    <p className="text-sm text-gray-500">
                      No{" "}
                      {selectedPdfType === "plant_health"
                        ? "Plant Health"
                        : "Flowering"}{" "}
                      PDF uploaded yet. Upload a PDF to begin analysis.
                    </p>

                    <div className="flex items-center gap-3 flex-wrap">
                      <Input
                        type="file"
                        accept=".pdf"
                        onChange={(e) =>
                          setSelectedPDFFile(e.target.files?.[0] || null)
                        }
                        className="max-w-xs"
                      />

                      <Button
                        onClick={handleUploadPDF}
                        disabled={!selectedPDFFile || uploadingPDF}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        {uploadingPDF ? (
                          "Uploading..."
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload{" "}
                            {selectedPdfType === "plant_health"
                              ? "Plant Health"
                              : "Flowering"}{" "}
                            PDF
                          </>
                        )}
                      </Button>
                    </div>

                    {selectedPDFFile && (
                      <p className="text-xs text-gray-500">
                        Selected: {selectedPDFFile.name}
                      </p>
                    )}
                  </div>
                )}

                {/* ── Processing state: PDF uploaded but data not yet ready ── */}
                {getCurrentPdfData()?.pdfUrl &&
                  !getCurrentPdfData()?.droneAnalysisData &&
                  !uploadingPDF &&
                  pollingForDroneData && (
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Activity
                          className={`h-5 w-5 text-blue-600 ${pollingForDroneData ? "animate-spin" : ""}`}
                        />
                        <p className="text-sm font-medium text-blue-900">
                          {pollingForDroneData
                            ? "Analysing — checking for updates..."
                            : "PDF uploaded. Analysis data is being processed..."}
                        </p>
                      </div>
                      {pollingForDroneData && (
                        <div className="flex items-center gap-2 text-xs text-blue-700 mb-3">
                          <div className="flex-1 bg-blue-200 rounded-full h-1.5">
                            <div
                              className="bg-blue-600 h-1.5 rounded-full transition-all duration-1000"
                              style={{
                                width: `${Math.min(100, ((Date.now() - (pollingStartTimeRef.current || Date.now())) / (3 * 60 * 1000)) * 100)}%`,
                              }}
                            />
                          </div>
                          <span>Checking for updates...</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        {!pollingForDroneData ? (
                          <Button
                            onClick={() => {
                              if (assessment._id) {
                                startPollingForDroneData(assessment._id);
                                toast({
                                  title: "Processing Started",
                                  description:
                                    "Checking for drone analysis data...",
                                });
                              }
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
                          >
                            <Activity className="h-4 w-4 mr-2" />
                            Process
                          </Button>
                        ) : (
                          <Button
                            onClick={() => {
                              stopPollingForDroneData();
                              if (assessment._id) {
                                assessmentsApiService
                                  .getAssessmentById(assessment._id)
                                  .then((updated) => {
                                    const updatedData = updated.data || updated;
                                    setAssessment(updatedData);
                                    const hasData =
                                      updatedData?.droneAnalysisPdfs?.some(
                                        (pdf: any) =>
                                          pdf.extractedData ??
                                          pdf.droneAnalysisData,
                                      ) || updatedData?.droneAnalysisData;
                                    toast({
                                      title: hasData
                                        ? "Data Found"
                                        : "Processing Cancelled",
                                      description: hasData
                                        ? "Drone analysis data is now available."
                                        : "Processing stopped.",
                                    });
                                  })
                                  .catch(() =>
                                    toast({
                                      title: "Refresh Failed",
                                      description:
                                        "Could not check for updates.",
                                      variant: "destructive",
                                    }),
                                  );
                              }
                            }}
                            variant="outline"
                            className="border-red-300 text-red-700 hover:bg-red-50 text-sm"
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                {getCurrentPdfData()?.droneAnalysisData &&
                  (() => {
                    const d = getCurrentPdfData()!.droneAnalysisData;
                    const report = d.report ?? {};
                    const field = d.field ?? {};
                    const analysisType = report.detected_analysis_type;
                    const isPlantStress = analysisType === "plant_stress";
                    const rightTitle = isPlantStress
                      ? "PLANT STRESS ANALYSIS"
                      : "FLOWERING ESTIMATOR";
                    const totalLabel = isPlantStress
                      ? "PLANT STRESS"
                      : "FLOWERING";
                    const levels = getWeedAnalysisLevels(d.weed_analysis);
                    const wa = d.weed_analysis;
                    const totalHa = getTotalStressArea(wa, levels);
                    const totalPct = getTotalStressPercent(wa, levels);
                    const displayHa = isPlantStress
                      ? totalHa
                      : (wa?.total_area_hectares ?? totalHa);
                    const displayPct = isPlantStress
                      ? totalPct
                      : (wa?.total_area_percent ?? totalPct);
                    const mapImage = d.map_image;

                    return (
                      <div className="font-sans mt-2 border-t-2 border-gray-100">
                        <div className="flex">
                          <div className="flex-1 bg-[#4eb857] px-5 py-3">
                            <p className="text-lg font-bold text-center text-white uppercase">
                              Plant Health Monitoring
                            </p>
                          </div>
                          <div className="flex-1 bg-[#003a4b] px-5 py-3">
                            <p className="text-lg font-bold text-center text-white uppercase tracking-widest">
                              {rightTitle}
                            </p>
                          </div>
                        </div>

                        {/* ── FIELD INFO 2-COLUMN GRID ── */}
                        <div className="grid grid-cols-2 border-b-2 border-l-2 mt-4 border-green-600 mx-8">
                          {/* Left col */}
                          <div className="px-6 pb-4 space-y-3 border-green-600 border-r-2">
                            <div>
                              <span className="text-sm text-gray-600">
                                Crop:
                              </span>
                              <span className="ml-2 text-base font-bold text-gray-900">
                                {field.crop ?? "N/A"}
                              </span>
                            </div>
                            <div>
                              <span className="text-sm text-gray-600">
                                Growing stage:
                              </span>
                              <span className="ml-2 text-base font-bold text-gray-900">
                                {field.growing_stage ?? "N/A"}
                              </span>
                            </div>
                          </div>
                          {/* Right col */}
                          <div className="px-6 pb-4 space-y-3">
                            <div>
                              <span className="text-sm text-gray-600">
                                Field area:
                              </span>
                              <span className="ml-2 text-base font-bold text-gray-900">
                                {field.area_hectares != null
                                  ? `${Number(field.area_hectares).toFixed(2)} Hectare`
                                  : "N/A"}
                              </span>
                            </div>
                            <div>
                              <span className="text-sm text-gray-600">
                                Analysis name:
                              </span>
                              <span className="ml-2 text-base font-bold text-gray-900">
                                {report.analysis_name ?? report.type ?? "N/A"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* ── PIE CHART + STRESS LEVEL TABLE ── */}
                        {levels.length > 0 && (
                          <div className="px-6 pb-6 pt-10">
                            <div className="grid grid-cols-2 gap-6 items-start">
                              {/* Pie chart */}
                              <div className="flex justify-center">
                                <ResponsiveContainer width="100%" height={220}>
                                  <PieChart>
                                    <Pie
                                      data={levels.map((lv: any) => ({
                                        name: lv.level,
                                        value: lv.percentage ?? 0,
                                      }))}
                                      cx="50%"
                                      cy="50%"
                                      labelLine={false}
                                      label={({ value }) =>
                                        `${Number(value).toFixed(2)}%`
                                      }
                                      outerRadius={85}
                                      dataKey="value"
                                    >
                                      {levels.map((_: any, i: number) => (
                                        <Cell key={i} fill={getLevelColor(i)} />
                                      ))}
                                    </Pie>
                                    <Tooltip
                                      formatter={(v: any) =>
                                        `${Number(v).toFixed(2)}%`
                                      }
                                    />
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>

                              {/* Table */}
                              <div>
                                <h3 className="text-lg font-bold text-[#4eb857] uppercase mb-2 text-center">
                                  Stress Level Table
                                </h3>
                                <div className="overflow-hidden border border-gray-200 shadow-sm">
                                  <table className="w-full text-sm border-collapse">
                                    <thead>
                                      <tr className="bg-[#003a4b] text-white">
                                        <th className="px-4 py-2.5 text-left font-normal tracking-wide">
                                          Stress level
                                        </th>
                                        <th className="px-4 py-2.5 text-left font-normal tracking-wide">
                                          %
                                        </th>
                                        <th className="px-4 py-2.5 text-left font-normal tracking-wide">
                                          Hectare
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {levels.map((lv: any, i: number) => (
                                        <tr
                                          key={i}
                                          className={
                                            i % 2 === 0
                                              ? "bg-white"
                                              : "bg-gray-50"
                                          }
                                        >
                                          <td className="px-4 py-2.5">
                                            <div className="flex items-center gap-2">
                                              <span
                                                className="w-3 h-3 rounded-full flex-shrink-0 inline-block"
                                                style={{
                                                  backgroundColor:
                                                    getLevelColor(i),
                                                }}
                                              />
                                              <span className="font-medium text-gray-900">
                                                {lv.level ?? "N/A"}
                                              </span>
                                            </div>
                                          </td>
                                          <td className="px-4 py-2.5 font-semibold text-gray-900">
                                            {(lv.percentage ?? 0).toFixed(2)}%
                                          </td>
                                          <td className="px-4 py-2.5 text-gray-700">
                                            {(lv.area_hectares ?? 0).toFixed(2)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {wa && (
                          <div className="relative bg-green-500 overflow-hidden">
                            {/* Dark wedge decoration top-left */}
                            <div className="absolute top-0 left-0 w-0 h-0 border-t-[48px] border-t-green-800 border-r-[32px] border-r-transparent" />
                            <div className="pl-10 pr-6 py-5">
                              <p className="text-white text-base font-semibold mb-1">
                                Total area{" "}
                                <span className="font-extrabold">
                                  {totalLabel}:
                                </span>
                              </p>
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className="text-white text-2xl font-extrabold">
                                  {displayHa.toFixed(2)} ha =
                                </span>
                                <span className="bg-teal-800 text-white text-2xl font-extrabold px-4 py-1 rounded">
                                  {Math.round(displayPct)}% field
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* ── ADDITIONAL INFO ── */}
                        {d.additional_info && (
                          <div className="px-6 pt-5 pb-2">
                            <p className="text-xs text-gray-500 mb-2">
                              Additional information: (or recommendation)
                            </p>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-600 italic">
                              {d.additional_info}
                            </div>
                          </div>
                        )}

                        {/* ── MAP IMAGE ── */}
                        {mapImage && (
                          <div className="px-6 py-5 border-t border-gray-100">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-sm font-semibold text-gray-700">
                                Field Map
                              </h3>
                              {!mapImageUrl && (
                                <Button
                                  onClick={fetchMapImage}
                                  disabled={loadingMapImage}
                                  size="sm"
                                  variant="outline"
                                  className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                                >
                                  {loadingMapImage ? (
                                    <>
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-700 mr-1.5"></div>
                                      Loading...
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                                      Load Map
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                            {(mapImageUrl || mapImage.data || mapImage.url) && (
                              <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                                <img
                                  src={
                                    mapImageUrl ||
                                    (mapImage.data
                                      ? `data:image/${mapImage.format || "png"};base64,${mapImage.data}`
                                      : mapImage.url)
                                  }
                                  alt="Field Map"
                                  className="w-full object-contain max-h-[480px] bg-white"
                                  onError={(e) => {
                                    (
                                      e.target as HTMLImageElement
                                    ).style.display = "none";
                                    toast({
                                      title: "Image Load Error",
                                      description:
                                        "Failed to display the map image",
                                      variant: "destructive",
                                    });
                                  }}
                                />
                                {/* Legend strip — with spacing above */}
                                {levels.length > 0 && (
                                  <div className="mt-3 mx-4 mb-3 rounded-lg overflow-hidden border border-gray-200">
                                    <div
                                      className="grid"
                                      style={{
                                        gridTemplateColumns: `repeat(${levels.length}, 1fr)`,
                                      }}
                                    >
                                      {levels.map((lv: any, i: number) => (
                                        <div
                                          key={i}
                                          className="flex flex-col items-center border-r last:border-r-0 border-gray-200"
                                        >
                                          <div
                                            className="h-5 w-full"
                                            style={{
                                              backgroundColor: getLevelColor(i),
                                            }}
                                          />
                                          <span className="text-xs text-gray-700 font-medium px-1 py-1.5 text-center">
                                            {lv.level}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* ── FOOTER ── */}
                        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-400">
                          <span>
                            Powered by:{" "}
                            <span className="font-bold text-green-600">
                              {report.provider ?? "STARHAWK"}
                            </span>
                          </span>
                          <span>Walk through field maps on starhawk.rw</span>
                        </div>
                      </div>
                    );
                  })()}

                {/* ── No data selected / empty state ── */}
                {!getCurrentPdfData()?.droneAnalysisData &&
                  !(
                    assessment.droneAnalysisPdfUrl ||
                    (assessment.droneAnalysisPdfs?.length ?? 0) > 0
                  ) &&
                  !uploadingPDF && (
                    <div className="p-10 text-center text-gray-400">
                      <FileImage className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm">No drone analysis data yet.</p>
                      <p className="text-xs mt-1">
                        Upload a PDF to get started.
                      </p>
                    </div>
                  )}

                {/* Processing/polling state — shown when PDF uploaded but type tab selected has no data */}
                {(assessment.droneAnalysisPdfUrl ||
                  (assessment.droneAnalysisPdfs?.length ?? 0) > 0) &&
                  !getCurrentPdfData()?.droneAnalysisData &&
                  !uploadingPDF && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <Activity
                          className={`h-5 w-5 text-blue-600 ${pollingForDroneData ? "animate-spin" : ""}`}
                        />
                        <p className="text-sm font-medium text-blue-900">
                          {pollingForDroneData
                            ? "Drone PDF uploaded. Analysis data is being processed (checking for updates)..."
                            : "Drone PDF uploaded. Analysis data is being processed..."}
                        </p>
                      </div>
                      {pollingForDroneData && (
                        <div className="mt-2 mb-3">
                          <div className="flex items-center gap-2 text-xs text-blue-700 mb-2">
                            <div className="flex-1 bg-blue-200 rounded-full h-1.5">
                              <div
                                className="bg-blue-600 h-1.5 rounded-full transition-all duration-1000"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    ((Date.now() -
                                      (pollingStartTimeRef.current ||
                                        Date.now())) /
                                      (3 * 60 * 1000)) *
                                      100,
                                  )}%`,
                                }}
                              />
                            </div>
                            <span>Checking for updates...</span>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        {!pollingForDroneData ? (
                          <Button
                            onClick={() => {
                              if (assessment._id) {
                                startPollingForDroneData(assessment._id);
                                toast({
                                  title: "Processing Started",
                                  description:
                                    "Checking for drone analysis data...",
                                });
                              }
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
                          >
                            <Activity className="h-4 w-4 mr-2" />
                            Process
                          </Button>
                        ) : (
                          <Button
                            onClick={() => {
                              stopPollingForDroneData();
                              if (assessment._id) {
                                assessmentsApiService
                                  .getAssessmentById(assessment._id)
                                  .then((updated) => {
                                    const updatedData = updated.data || updated;
                                    setAssessment(updatedData);
                                    const hasData =
                                      updatedData?.droneAnalysisPdfs?.some(
                                        (pdf: any) =>
                                          pdf.extractedData ??
                                          pdf.droneAnalysisData,
                                      ) || updatedData?.droneAnalysisData;
                                    if (hasData) {
                                      toast({
                                        title: "Data Found",
                                        description:
                                          "Drone analysis data is now available.",
                                      });
                                    } else {
                                      toast({
                                        title: "Processing Cancelled",
                                        description:
                                          "Processing stopped. You can start it again when ready.",
                                      });
                                    }
                                  })
                                  .catch((err) => {
                                    console.error("Failed to refresh:", err);
                                    toast({
                                      title: "Refresh Failed",
                                      description:
                                        "Could not check for updates. Please try again later.",
                                      variant: "destructive",
                                    });
                                  });
                              }
                            }}
                            variant="outline"
                            className="border-red-300 text-red-700 hover:bg-red-50 text-sm"
                          >
                            Cancel Process
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>

            {/* Comprehensive Notes */}
            <Card className="bg-white border border-gray-200 shadow-lg rounded-xl">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-gray-200 px-6 py-5">
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  Comprehensive Assessment Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <Textarea
                  value={comprehensiveNotes}
                  onChange={(e) => setComprehensiveNotes(e.target.value)}
                  placeholder="Enter comprehensive assessment notes here..."
                  className="min-h-[200px] border-gray-300"
                />
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    {comprehensiveNotes.length} characters
                  </p>
                  <Button
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {savingNotes ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Notes
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Generate Report */}
            <Card className="bg-gradient-to-br from-amber-50 to-orange-50/30 border-2 border-amber-200 shadow-lg rounded-xl">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-white border-b border-amber-200 px-6 py-5">
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <FileText className="h-5 w-5 text-amber-600" />
                  </div>
                  Generate Full Assessment Report
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <div
                    className={`flex items-center gap-2 p-2 rounded ${
                      riskScore !== null &&
                      riskScore !== undefined &&
                      typeof riskScore === "number"
                        ? "bg-green-50"
                        : "bg-gray-50"
                    }`}
                  >
                    {riskScore !== null &&
                    riskScore !== undefined &&
                    typeof riskScore === "number" ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-gray-400" />
                    )}
                    <span
                      className={`text-sm ${
                        riskScore !== null &&
                        riskScore !== undefined &&
                        typeof riskScore === "number"
                          ? "text-green-900"
                          : "text-gray-600"
                      }`}
                    >
                      Risk score calculated{" "}
                      {riskScore !== null &&
                      riskScore !== undefined &&
                      typeof riskScore === "number"
                        ? "✓"
                        : "✗"}
                    </span>
                  </div>
                  <div
                    className={`flex items-center gap-2 p-2 rounded ${
                      comprehensiveNotes.trim().length > 0
                        ? "bg-green-50"
                        : "bg-gray-50"
                    }`}
                  >
                    {comprehensiveNotes.trim().length > 0 ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-gray-400" />
                    )}
                    <span
                      className={`text-sm ${
                        comprehensiveNotes.trim().length > 0
                          ? "text-green-900"
                          : "text-gray-600"
                      }`}
                    >
                      Comprehensive notes added{" "}
                      {comprehensiveNotes.trim().length > 0 ? "✓" : "✗"}
                    </span>
                  </div>
                </div>
                <Button
                  onClick={handleGenerateReport}
                  disabled={
                    generatingReport ||
                    riskScore === null ||
                    riskScore === undefined ||
                    typeof riskScore !== "number" ||
                    comprehensiveNotes.trim().length === 0
                  }
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white h-12 font-semibold"
                >
                  {generatingReport ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Generating Report...
                    </>
                  ) : (
                    <>
                      <FileText className="h-5 w-5 mr-2" />
                      Generate & Send Report to Insurer
                    </>
                  )}
                </Button>
                {assessment.reportGenerated && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-700" />
                      <p className="text-sm font-semibold text-green-900">
                        Report generated successfully
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Field Data Tab */}
          <TabsContent value="field-data" className="mt-6">
            <Card className="bg-white border border-gray-200 shadow-lg rounded-xl">
              <CardHeader className="bg-gradient-to-r from-green-50 to-white border-b border-gray-200 px-6 py-5">
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-green-600" />
                  </div>
                  Field Statistics (NDVI, MSAVI, NDMI, EVI)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {loadingData ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading field statistics...</p>
                  </div>
                ) : fieldStatistics ? (
                  <div className="space-y-4">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={fieldStatistics}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="ndvi"
                          stroke="#8884d8"
                          name="NDVI"
                        />
                        <Line
                          type="monotone"
                          dataKey="msavi"
                          stroke="#82ca9d"
                          name="MSAVI"
                        />
                        <Line
                          type="monotone"
                          dataKey="ndmi"
                          stroke="#ffc658"
                          name="NDMI"
                        />
                        <Line
                          type="monotone"
                          dataKey="evi"
                          stroke="#ff7300"
                          name="EVI"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      Field Statistics Not Available
                    </p>
                    <p className="text-xs text-gray-500 mb-3">
                      EOSDA data is currently unavailable. This may be due to:
                    </p>
                    <ul className="text-xs text-gray-500 text-left max-w-md mx-auto space-y-1 mb-4">
                      <li>• API request limit exceeded</li>
                      <li>• Farm not yet registered with EOSDA</li>
                      <li>• Data processing in progress</li>
                    </ul>
                    <p className="text-xs text-gray-600">
                      Field statistics will be available once the farm is fully
                      registered with EOSDA.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Weather Tab */}
          <TabsContent value="weather" className="mt-6">
            <Card className="bg-white border border-gray-200 shadow-lg rounded-xl">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-gray-200 px-6 py-5">
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <CloudRain className="h-5 w-5 text-blue-600" />
                  </div>
                  Historical Weather Data
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {loadingData ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading weather data...</p>
                  </div>
                ) : weatherData ? (
                  <div className="space-y-4">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={weatherData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="temperature"
                          stroke="#8884d8"
                          name="Temperature (°C)"
                        />
                        <Line
                          type="monotone"
                          dataKey="precipitation"
                          stroke="#82ca9d"
                          name="Precipitation (mm)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CloudRain className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      Weather Data Not Available
                    </p>
                    <p className="text-xs text-gray-500 mb-3">
                      Historical weather data requires the farm to be registered
                      with EOSDA.
                    </p>
                    <ul className="text-xs text-gray-500 text-left max-w-md mx-auto space-y-1 mb-4">
                      <li>• Farm must have EOSDA field ID</li>
                      <li>• KML file must be uploaded and processed</li>
                      <li>• EOSDA registration must be completed</li>
                    </ul>
                    <p className="text-xs text-gray-600">
                      Weather data will be available once the farm is fully
                      registered with EOSDA.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* PDF Viewer Modal - shows the currently selected PDF type */}
      <Dialog open={pdfModalOpen} onOpenChange={setPdfModalOpen}>
        <DialogContent className="max-w-5xl w-full h-[90vh] p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-600" />
              Drone Analysis PDF
              {selectedPdfType && (
                <Badge className="ml-2 bg-blue-100 text-blue-700 border-blue-300">
                  {selectedPdfType === "plant_health"
                    ? "🌿 Plant Health"
                    : "🌸 Flowering"}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden bg-gray-100">
            {(getCurrentPdfData()?.pdfUrl ||
              assessment.droneAnalysisPdfUrl) && (
              <iframe
                src={`${getFullPdfUrl(getCurrentPdfData()?.pdfUrl || assessment.droneAnalysisPdfUrl)}#toolbar=0`}
                className="w-full h-full border-0"
                title="Drone Analysis PDF Viewer"
                style={{ minHeight: "calc(90vh - 100px)" }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
