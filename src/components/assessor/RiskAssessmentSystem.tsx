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
  droneAnalysisPdfUrl: string | null;
  droneAnalysisData: any;
  droneAnalysisPdfs?: {
    pdfType: "plant_health" | "flowering";
    pdfUrl: string;
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
  >(null);

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

  // Helper function to get full PDF URL
  const getFullPdfUrl = useCallback((pdfUrl: string | null): string => {
    if (!pdfUrl) return "";
    // If URL is already absolute, return as is
    if (pdfUrl.startsWith("http://") || pdfUrl.startsWith("https://")) {
      return pdfUrl;
    }
    // If relative, prepend base URL from environment
    const cleanUrl = pdfUrl.startsWith("/") ? pdfUrl : `/${pdfUrl}`;
    return `${FILE_SERVER_URL}${cleanUrl}`;
  }, []);

  // Helper function to get current PDF data based on selected type
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

      // Return PDF with droneAnalysisData directly
      if (pdf && pdf.droneAnalysisData) {
        return pdf;
      }
      return null;
    }

    // Fallback to legacy single PDF structure
    if (assessment.droneAnalysisPdfUrl && assessment.droneAnalysisData) {
      // For legacy structure, check if analysis type matches the selected PDF type
      const analysisType =
        assessment.droneAnalysisData.report?.detected_analysis_type;
      const matchesSelectedType =
        (selectedPdfType === "plant_health" &&
          analysisType === "plant_stress") ||
        (selectedPdfType === "flowering" && analysisType !== "plant_stress");

      // Only return data if analysis type matches the selected PDF type
      if (matchesSelectedType) {
        return {
          pdfType: selectedPdfType,
          pdfUrl: assessment.droneAnalysisPdfUrl,
          droneAnalysisData: assessment.droneAnalysisData,
          uploadedAt: new Date(),
        };
      } else {
        // Don't return data if types don't match
        return null;
      }
    }

    return null;
  }, [assessment, selectedPdfType]);

  // Helper: does assessment have any drone PDFs (new or legacy)?
  const hasAnyDronePdfs = useCallback(() => {
    if (!assessment) return false;
    if (assessment.droneAnalysisPdfs && assessment.droneAnalysisPdfs.length > 0) return true;
    return !!assessment.droneAnalysisPdfUrl;
  }, [assessment]);

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
          if (pdf.droneAnalysisData) {
            // Only add if data exists
            types.push(pdf.pdfType);
          }
        }
      });
    }

    // Fallback to legacy structure - check analysis type
    if (assessment.droneAnalysisPdfUrl && assessment.droneAnalysisData) {
      const analysisType =
        assessment.droneAnalysisData.report?.detected_analysis_type;

      if (analysisType === "plant_stress") {
        if (!types.includes("plant_health")) types.push("plant_health");
      } else {
        // If it's not plant_stress, assume it's flowering
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
      } else if (availableTypes.length === 0) {
        setSelectedPdfType(null);
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
    // Don't start polling if data already exists
    if (assessment?.droneAnalysisData) {
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
    const POLL_INTERVAL = 15000; // Poll every 15 seconds (reduced frequency)

    console.log("🔄 Starting to poll for drone analysis data...");

    pollingIntervalRef.current = setInterval(async () => {
      // Check if polling should continue
      if (!pollingIntervalRef.current) {
        return; // Polling was stopped
      }

      const elapsed = Date.now() - (pollingStartTimeRef.current || 0);

      // Stop polling if timeout reached
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

        // Check if drone analysis data is now available (supports report, field, weed_analysis.levels structure)
        const d = updatedData?.droneAnalysisData;
        const hasStructuredData =
          d?.report ||
          d?.field ||
          (d?.weed_analysis &&
            (getWeedAnalysisLevels(d.weed_analysis).length > 0 ||
              d.weed_analysis.total_area_hectares != null));
        if (
          updatedData?.droneAnalysisData &&
          (hasStructuredData ||
            d?.cropHealth ||
            d?.coverage !== undefined ||
            (d?.anomalies &&
              Array.isArray(d.anomalies) &&
              d.anomalies.length > 0) ||
            Object.keys(d).length > 0)
        ) {
          console.log(
            "✅ Drone analysis data found!",
            updatedData.droneAnalysisData,
          );
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
        // Don't stop polling on error, just log it
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

  // Cleanup polling on unmount or when assessment/viewMode changes
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

  // Auto-load map image if data is available (supports droneAnalysisPdfs and legacy)
  useEffect(() => {
    const currentData = getCurrentPdfData()?.droneAnalysisData;
    const mapImage = currentData?.map_image ?? assessment?.droneAnalysisData?.map_image;
    if (mapImage) {
      // Auto-load if we have embedded data or URL
      if (mapImage.data || mapImage.url) {
        if (mapImage.data) {
          setMapImageUrl(
            `data:image/${mapImage.format || "png"};base64,${mapImage.data}`,
          );
        } else if (mapImage.url) {
          setMapImageUrl(mapImage.url);
        }
      }
    } else {
      setMapImageUrl(null);
    }
  }, [assessment, selectedPdfType]);

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

    // Validate file type
    if (!file.name.toLowerCase().endsWith(".kml")) {
      toast({
        title: "Invalid File Type",
        description: "Please select a .kml file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (1MB max)
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

      // Reset form
      setSelectedKMLFile(null);
      setFarmName("");
      setShowKMLUpload(null);

      // Reload farmers to get updated status
      await loadFarmers();

      // Navigate to assessment if farm is now REGISTERED
      if (result.status === "REGISTERED") {
        // Find or create assessment for this farm
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
      // First, try to get existing assessment
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

        // Safely set risk score - ensure it's a number or null
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

        // Load field data
        await loadFieldData(farmId);
      } else {
        // Create new assessment or show message
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
      startDate.setFullYear(today.getFullYear() - 3); // 3 years of data

      const startDateStr = startDate.toISOString().split("T")[0];
      const endDateStr = today.toISOString().split("T")[0];

      // Load field statistics
      try {
        const stats = await getVegetationStats(
          farmId,
          startDateStr,
          endDateStr,
          "NDVI,MSAVI,NDMI,EVI",
        );
        setFieldStatistics(stats.data || stats);
      } catch (err: any) {
        // Handle EOSDA-specific errors gracefully
        const errorMessage = err?.message || "";
        if (
          errorMessage.includes("EOSDA") ||
          errorMessage.includes("requests limit exceeded")
        ) {
          // Silently handle EOSDA errors - these are expected when limits are exceeded or farm not registered
          console.log(
            "EOSDA data not available (limit exceeded or farm not registered)",
          );
        } else if (
          errorMessage.includes("EOSDA field ID") ||
          errorMessage.includes("register the farm")
        ) {
          // Farm not registered with EOSDA yet
          console.log("Farm not registered with EOSDA yet");
        } else {
          console.warn("Failed to load field statistics:", err);
        }
        // Don't set fieldStatistics to null, keep it as is or set to empty
        setFieldStatistics(null);
      }

      // Load weather data
      try {
        const weather = await getHistoricalWeather(
          farmId,
          startDateStr,
          endDateStr,
        );
        setWeatherData(weather.data || weather);
      } catch (err: any) {
        // Handle EOSDA-specific errors gracefully
        const errorMessage = err?.message || "";
        if (
          errorMessage.includes("EOSDA") ||
          errorMessage.includes("requests limit exceeded")
        ) {
          // Silently handle EOSDA errors
          console.log(
            "EOSDA weather data not available (limit exceeded or farm not registered)",
          );
        } else if (
          errorMessage.includes("EOSDA field ID") ||
          errorMessage.includes("register the farm")
        ) {
          // Farm not registered with EOSDA yet
          console.log(
            "Farm not registered with EOSDA yet - weather data unavailable",
          );
        } else {
          console.warn("Failed to load weather data:", err);
        }
        // Don't set weatherData to null, keep it as is or set to empty
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

    // Prevent multiple simultaneous calls
    if (calculatingRisk) {
      console.log(
        "⚠️ Risk calculation already in progress, ignoring duplicate call",
      );
      return;
    }

    setCalculatingRisk(true);
    try {
      console.log(
        "🔄 Starting risk score calculation for assessment:",
        assessment._id,
      );
      const score = await assessmentsApiService.calculateRiskScore(
        assessment._id,
      );
      const scoreValue =
        typeof score === "number"
          ? score
          : score?.data || score?.riskScore || score;

      console.log("📊 Risk score response:", { score, scoreValue });

      // Ensure scoreValue is a valid number
      if (
        scoreValue !== null &&
        scoreValue !== undefined &&
        typeof scoreValue === "number"
      ) {
        setRiskScore(scoreValue);

        // Reload assessment
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
          // Continue even if reload fails
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

      // Handle 404 specifically - endpoint might not be implemented yet
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
      // Always reset the loading state, even if there was an error
      console.log("✅ Resetting calculatingRisk state");
      setCalculatingRisk(false);

      // Extra safeguard: force reset after a short delay if somehow it didn't reset
      setTimeout(() => {
        setCalculatingRisk(false);
      }, 100);
    }
  };

  // Delete drone PDF
  const handleDeletePDF = async () => {
    if (!assessment?._id) {
      toast({
        title: "Error",
        description: "No assessment selected",
        variant: "destructive",
      });
      return;
    }

    // Confirm deletion
    if (
      !window.confirm(
        "Are you sure you want to delete the uploaded PDF? This action cannot be undone.",
      )
    ) {
      return;
    }

    setDeletingPDF(true);
    try {
      // Try to delete using the delete endpoint
      try {
        await assessmentsApiService.deleteDronePDF(assessment._id);

        // Reload assessment to get updated data
        const updated = await assessmentsApiService.getAssessmentById(
          assessment._id,
        );
        const updatedData = updated.data || updated;
        setAssessment(updatedData);

        // Stop polling if active
        stopPollingForDroneData();

        toast({
          title: "PDF Deleted",
          description:
            "The drone PDF has been deleted successfully. You can now upload a new one.",
        });
      } catch (deleteError: any) {
        // If delete endpoint doesn't exist (404), the API doesn't support deletion
        if (
          deleteError.message?.includes("404") ||
          deleteError.message?.includes("not found")
        ) {
          // Since the API doesn't support deletion, we'll clear it from the UI state
          // but warn the user that it may still exist on the server
          setAssessment({
            ...assessment,
            droneAnalysisPdfUrl: null,
            droneAnalysisData: null,
          });

          // Stop polling if active
          stopPollingForDroneData();

          toast({
            title: "PDF Removed from View",
            description:
              "The PDF has been removed from this assessment view. Note: The file may still exist on the server. You can upload a new PDF to replace it.",
            variant: "default",
          });
        } else {
          // Other errors (validation, etc.)
          throw deleteError;
        }
      }
    } catch (err: any) {
      console.error("Failed to delete PDF:", err);

      // Check if it's a validation error about fields not being allowed
      if (
        err.message?.includes("should not exist") ||
        err.message?.includes("Validation failed")
      ) {
        // API doesn't support deleting these fields via update
        // Clear from UI state only
        setAssessment({
          ...assessment,
          droneAnalysisPdfUrl: null,
          droneAnalysisData: null,
        });

        stopPollingForDroneData();

        toast({
          title: "PDF Removed from View",
          description:
            "The PDF has been removed from this assessment view. Note: The API doesn't support permanent deletion. You can upload a new PDF to replace it.",
          variant: "default",
        });
      } else {
        toast({
          title: "Delete Failed",
          description: err.message || "Failed to delete PDF. Please try again.",
          variant: "destructive",
        });
      }
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
      console.log("📤 Uploading drone PDF...", {
        assessmentId: assessment._id,
        fileName: selectedPDFFile.name,
        fileSize: selectedPDFFile.size,
      });

      const result = await assessmentsApiService.uploadDronePDF(
        assessment._id,
        selectedPDFFile,
      );

      // Log the complete raw response
      console.log("📥 RAW PDF upload API response:", result);
      console.log(
        "📥 RAW PDF upload API response (JSON):",
        JSON.stringify(result, null, 2),
      );
      console.log("📥 Response type:", typeof result);
      console.log("📥 Response keys:", Object.keys(result || {}));

      // Extract data from response - handle different response structures
      // Try multiple possible response structures
      let responseData = result;
      if (result?.data) {
        responseData = result.data;
        console.log("✅ Using result.data");
      } else if (result?.response) {
        responseData = result.response;
        console.log("✅ Using result.response");
      } else {
        responseData = result;
        console.log("✅ Using result directly");
      }

      // Extract drone analysis data - try multiple paths
      let extractedData = null;
      if (responseData?.droneAnalysisData) {
        extractedData = responseData.droneAnalysisData;
        console.log("✅ Found droneAnalysisData in responseData");
      } else if (result?.droneAnalysisData) {
        extractedData = result.droneAnalysisData;
        console.log("✅ Found droneAnalysisData in result");
      } else if (result?.data?.droneAnalysisData) {
        extractedData = result.data.droneAnalysisData;
        console.log("✅ Found droneAnalysisData in result.data");
      }

      // Extract PDF URL - try multiple paths
      let pdfUrl = null;
      if (responseData?.droneAnalysisPdfUrl) {
        pdfUrl = responseData.droneAnalysisPdfUrl;
        console.log("✅ Found droneAnalysisPdfUrl in responseData");
      } else if (result?.droneAnalysisPdfUrl) {
        pdfUrl = result.droneAnalysisPdfUrl;
        console.log("✅ Found droneAnalysisPdfUrl in result");
      } else if (result?.data?.droneAnalysisPdfUrl) {
        pdfUrl = result.data.droneAnalysisPdfUrl;
        console.log("✅ Found droneAnalysisPdfUrl in result.data");
      }

      console.log(
        "✅ Extracted drone analysis data:",
        JSON.stringify(extractedData, null, 2),
      );
      console.log("✅ Extracted PDF URL:", pdfUrl);
      console.log(
        "📊 Full responseData object:",
        JSON.stringify(responseData, null, 2),
      );

      // Update assessment immediately with extracted data
      if (extractedData || pdfUrl) {
        setAssessment({
          ...assessment,
          droneAnalysisPdfUrl: pdfUrl || assessment.droneAnalysisPdfUrl,
          droneAnalysisData: extractedData || assessment.droneAnalysisData,
        });
      }

      // Reload assessment to get the latest data from the API (ensures consistency)
      try {
        const updated = await assessmentsApiService.getAssessmentById(
          assessment._id,
        );
        const updatedData = updated.data || updated;

        // Use the latest data from API, but prefer extracted data if it's more complete
        const latestDroneData = updatedData?.droneAnalysisData || extractedData;

        setAssessment({
          ...updatedData,
          droneAnalysisData: latestDroneData || updatedData?.droneAnalysisData,
        });

        console.log("✅ Assessment reloaded with drone data:", {
          hasDroneAnalysisData: !!latestDroneData,
          hasPdfUrl: !!updatedData?.droneAnalysisPdfUrl,
          droneAnalysisData: latestDroneData,
        });
      } catch (reloadErr) {
        console.warn(
          "⚠️ Failed to reload assessment, using upload result:",
          reloadErr,
        );
        // Continue with the data we extracted from the upload response
      }

      // Show success message based on whether data was extracted (supports report, field, weed_analysis.levels)
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

      // If data is not available, start polling
      if (!hasExtractedData && assessment._id) {
        console.log("📊 No immediate analysis data, starting polling...");
        startPollingForDroneData(assessment._id);
      } else {
        // Stop polling if we have data
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

      // Reload assessment
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

    // Validation
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

      // Reload assessment
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

  // Generate PDF from drone analysis data
  const generateDroneDataPDF = async () => {
    const currentPdf = getCurrentPdfData();
    const droneData = currentPdf?.droneAnalysisData ?? assessment?.droneAnalysisData;
    if (!droneData) {
      toast({
        title: "No Data",
        description: "No drone analysis data available to generate PDF",
        variant: "destructive",
      });
      return;
    }

    setGeneratingPDF(true);
    try {
      // Dynamic import to avoid bundling issues
      const { default: jsPDF } = await import("jspdf");

      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;
      const margin = 18;
      const lineHeight = 6;
      const colGap = 8;

      const analysisType =
        droneData.report?.detected_analysis_type;
      const rightBannerText =
        analysisType === "plant_stress"
          ? "PLANT STRESS ANALYSIS"
          : "FLOWERING ESTIMATOR";

      // Header - Dual Banner (full width, matching reference PDFs)
      doc.setFillColor(220, 252, 231); // Light green
      doc.rect(0, 0, pageWidth / 2, 18, "F");
      doc.setFillColor(15, 118, 110); // Dark teal
      doc.rect(pageWidth / 2, 0, pageWidth / 2, 18, "F");

      doc.setTextColor(22, 101, 52);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("PLANT HEALTH MONITORING", pageWidth / 4, 12, {
        align: "center",
      });

      doc.setTextColor(255, 255, 255);
      doc.text(rightBannerText, (pageWidth / 4) * 3, 12, { align: "center" });

      yPosition = 28;

      // Crop and Field Information (2 columns)
      if (droneData.field) {
        const field = droneData.field;
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");

        doc.text(`Crop: ${field.crop || "N/A"}`, margin, yPosition);
        doc.text(
          `Field area: ${field.area_hectares ? field.area_hectares.toFixed(2) + " Hectare" : "N/A"}`,
          pageWidth / 2 + margin,
          yPosition,
        );
        yPosition += lineHeight;

        doc.text(
          `Growing stage: ${field.growing_stage || "N/A"}`,
          margin,
          yPosition,
        );
        const analysisName =
          droneData.report?.analysis_name ||
          droneData.report?.type ||
          "N/A";
        doc.text(
          `Analysis name: ${analysisName}`,
          pageWidth / 2 + margin,
          yPosition,
        );
        yPosition += lineHeight;

        const surveyDate = droneData.report?.survey_date;
        if (surveyDate) {
          doc.text(`Survey date: ${surveyDate}`, margin, yPosition);
          yPosition += lineHeight;
        }

        yPosition += 6;
        doc.setDrawColor(34, 197, 94);
        doc.setLineWidth(0.8);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 10;
      }

      const weedAnalysisLevels = getWeedAnalysisLevels(
        droneData.weed_analysis,
      );

      if (weedAnalysisLevels.length > 0) {
        const tableTitle =
          analysisType === "plant_stress"
            ? "STRESS LEVEL TABLE"
            : "FLOWERING LEVEL TABLE";
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(22, 101, 52);
        doc.text(tableTitle, margin, yPosition);
        yPosition += lineHeight + 4;
        const stressLevels = weedAnalysisLevels;
        const leftColEnd = pageWidth / 2 - colGap / 2;
        const rightColStart = pageWidth / 2 + colGap / 2;

        // Left: Pie chart
        const pieDataUrl = drawPieChartToDataUrl(
          stressLevels,
          LEVEL_COLORS,
          100,
        );
        if (pieDataUrl) {
          const pieSize = 55;
          const pieX = margin + (leftColEnd - margin) / 2 - pieSize / 2;
          doc.addImage(pieDataUrl, "PNG", pieX, yPosition, pieSize, pieSize);
        }

        // Right: Table
        const tableX = rightColStart;
        const tableWidth = pageWidth - margin - rightColStart;

        doc.setFillColor(15, 118, 110);
        doc.rect(tableX, yPosition - 5, tableWidth, 7, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text(
          analysisType === "plant_stress" ? "Stress level" : "Level",
          tableX + 2,
          yPosition,
        );
        doc.text("%", tableX + tableWidth * 0.5, yPosition);
        doc.text("Hectare", tableX + tableWidth * 0.75, yPosition);
        yPosition += 7;

        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
        const tableStartY = yPosition;
        stressLevels.forEach(
          (
            level: {
              level?: string;
              percentage?: number;
              area_hectares?: number;
            },
            index: number,
          ) => {
            const [r, g, b] = hexToRgb(getLevelColor(index));
            doc.setFillColor(r, g, b);
            doc.circle(tableX + 3, yPosition, 1.2, "F");
            doc.text(level.level || "N/A", tableX + 7, yPosition);
            doc.text(
              `${(level.percentage ?? 0).toFixed(2)}%`,
              tableX + tableWidth * 0.5,
              yPosition,
            );
            doc.text(
              (level.area_hectares ?? 0).toFixed(2),
              tableX + tableWidth * 0.75,
              yPosition,
            );
            yPosition += lineHeight;
          },
        );

        yPosition = Math.max(yPosition, tableStartY + 55) + 8;
      }

      // Summary Banner
      if (droneData.weed_analysis) {
        const wa = droneData.weed_analysis;
        const totalStressArea = getTotalStressArea(wa);
        const totalStressPercent = getTotalStressPercent(wa);

        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
        }

        yPosition += 4;
        doc.setFillColor(34, 197, 94);
        doc.rect(0, yPosition - 4, pageWidth, 14, "F");
        doc.setFillColor(22, 101, 52);
        doc.rect(0, yPosition - 4, 10, 14, "F");

        const totalAreaLabel =
          analysisType === "plant_stress"
            ? "Total area PLANT STRESS:"
            : "Total area FLOWERING:";
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(totalAreaLabel, margin + 12, yPosition + 4);
        doc.text(
          `${totalStressArea.toFixed(2)} ha =`,
          margin + 80,
          yPosition + 4,
        );
        doc.setFillColor(15, 118, 110);
        doc.rect(margin + 100, yPosition, 30, 8, "F");
        doc.text(
          `${totalStressPercent.toFixed(0)}% field`,
          margin + 115,
          yPosition + 5,
          { align: "center" },
        );
        yPosition += 20;
      }

      // Map Image - new page for prominent display (matching reference PDFs)
      const mapImage = droneData.map_image;
      if (mapImage) {
        let imageDataUrl: string | null = null;
        if (mapImage.data) {
          imageDataUrl = `data:image/${mapImage.format || "png"};base64,${mapImage.data}`;
        } else if (mapImage.url) {
          try {
            const resp = await fetch(mapImage.url, { mode: "cors" });
            const blob = await resp.blob();
            imageDataUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          } catch (e) {
            console.warn("Could not fetch map image for PDF:", e);
          }
        }
        if (imageDataUrl) {
          doc.addPage();
          yPosition = 15;
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(22, 101, 52);
          doc.text("Field Map", margin, yPosition);
          yPosition += 10;
          const imgWidth = pageWidth - margin * 2;
          const imgHeight = pageHeight - margin - yPosition - 20;
          const imgFormat =
            imageDataUrl.startsWith("data:image/jpeg") ||
            imageDataUrl.startsWith("data:image/jpg")
              ? "JPEG"
              : "PNG";
          doc.addImage(
            imageDataUrl,
            imgFormat,
            margin,
            yPosition,
            imgWidth,
            imgHeight,
          );
          yPosition += imgHeight + 15;
        }
      }

      // Additional Information (on current page or new if needed)
      if (droneData.additional_info) {
        yPosition += 15;
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = 20;
        }
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Additional Information:", margin, yPosition);
        yPosition += lineHeight;
        doc.setFont("helvetica", "normal");
        const splitText = doc.splitTextToSize(
          droneData.additional_info,
          pageWidth - margin * 2,
        );
        doc.text(splitText, margin, yPosition);
        yPosition += splitText.length * lineHeight;
      }

      // Report Information (compact, matching reference style)
      if (droneData.report) {
        yPosition += 8;
        if (yPosition > pageHeight - 35) {
          doc.addPage();
          yPosition = 20;
        }
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(22, 101, 52);
        doc.text("Report Information", margin, yPosition);
        yPosition += 6;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        const report = droneData.report;
        const reportLines: string[] = [];
        if (report.provider) reportLines.push(`Provider: ${report.provider}`);
        if (report.type) reportLines.push(`Type: ${report.type}`);
        if (report.survey_date && !droneData.field)
          reportLines.push(`Survey date: ${report.survey_date}`);
        reportLines.forEach((line) => {
          doc.setFontSize(9);
          doc.text(line, margin, yPosition);
          yPosition += 5;
        });
      }

      // Generate filename
      const dateStr = new Date().toISOString().split("T")[0];
      const filename = `drone-analysis-report-${dateStr}.pdf`;

      // Save PDF
      doc.save(filename);

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
    const currentData = getCurrentPdfData()?.droneAnalysisData;
    const mapImage = currentData?.map_image ?? assessment?.droneAnalysisData?.map_image;
    if (!assessment?._id || !mapImage) {
      toast({
        title: "No Image Data",
        description: "Map image data is not available",
        variant: "default",
      });
      return;
    }

    setLoadingMapImage(true);
    try {

      // First, check if we have base64 data embedded
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

      // Check if we have a URL
      if (mapImage.url) {
        setMapImageUrl(mapImage.url);
        toast({
          title: "Success",
          description: "Map image loaded from URL",
        });
        setLoadingMapImage(false);
        return;
      }

      // Try to fetch from API endpoint if available
      const ASSESSMENTS_BASE_URL = import.meta.env.DEV
        ? `/api/v1${API_ENDPOINTS.ASSESSMENTS.BASE}`
        : `${API_BASE_URL}${API_ENDPOINTS.ASSESSMENTS.BASE}`;

      const imageEndpoint = `${ASSESSMENTS_BASE_URL}/${assessment._id}/map-image`;
      const token = getAuthToken();
      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(imageEndpoint, { headers });

      if (
        response.ok &&
        response.headers.get("content-type")?.startsWith("image/")
      ) {
        // If API returns the image directly, create blob URL
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        setMapImageUrl(imageUrl);
        toast({
          title: "Success",
          description: "Map image loaded from server",
        });
      } else if (response.status === 404) {
        // Endpoint doesn't exist, try to use PDF as fallback
        if (hasAnyDronePdfs()) {
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

      // Final fallback: Check if image data exists
      const fallbackMapImage = getCurrentPdfData()?.droneAnalysisData?.map_image ?? assessment?.droneAnalysisData?.map_image;
      if (fallbackMapImage?.data) {
        setMapImageUrl(
          `data:image/${fallbackMapImage.format || "png"};base64,${fallbackMapImage.data}`,
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
      farmer.firstName?.toLowerCase().includes(query) ||
      farmer.lastName?.toLowerCase().includes(query) ||
      farmer.email?.toLowerCase().includes(query) ||
      farmer.phoneNumber?.includes(query) ||
      farmer.farmerProfile?.farmProvince?.toLowerCase().includes(query) ||
      farmer.farmerProfile?.farmDistrict?.toLowerCase().includes(query)
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
            className={`bg-gradient-to-br ${hasAnyDronePdfs() ? "from-purple-50 to-purple-100 border-purple-200" : "from-gray-50 to-gray-100 border-gray-200"} shadow-md`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium mb-1">Drone PDF</p>
                  <p className="text-lg font-bold">
                    {hasAnyDronePdfs()
                      ? "Uploaded"
                      : "Not Uploaded"}
                  </p>
                </div>
                <Upload
                  className={`h-5 w-5 ${hasAnyDronePdfs() ? "text-purple-600" : "text-gray-400"}`}
                />
              </div>
            </CardContent>
          </Card>

          <Card
            className={`bg-gradient-to-br ${assessment.reportGenerated ? "from-emerald-50 to-emerald-100 border-emerald-200" : "from-gray-50 to-gray-100 border-gray-200"} shadow-md`}
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

            {/* Drone PDF Upload */}
            <Card className="bg-white border border-gray-200 shadow-lg rounded-xl">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-gray-200 px-6 py-5">
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Upload className="h-5 w-5 text-purple-600" />
                  </div>
                  Drone Analysis PDF
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {hasAnyDronePdfs() ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <p className="text-sm font-medium text-green-900">
                          PDF uploaded successfully
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          onClick={() => setPdfModalOpen(true)}
                          className="text-sm text-green-700 hover:text-green-900 flex items-center gap-1 px-3 py-1.5 bg-white rounded border border-green-300 hover:bg-green-100 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                          View PDF
                        </Button>
                        <a
                          href={getFullPdfUrl(getCurrentPdfData()?.pdfUrl ?? assessment.droneAnalysisPdfUrl ?? "")}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="text-sm text-green-700 hover:text-green-900 hover:underline flex items-center gap-1 px-3 py-1.5 bg-white rounded border border-green-300 hover:bg-green-100 transition-colors"
                        >
                          <Download className="h-4 w-4" />
                          Download PDF
                        </a>
                        <a
                          href={getFullPdfUrl(getCurrentPdfData()?.pdfUrl ?? assessment.droneAnalysisPdfUrl ?? "")}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-green-700 hover:text-green-900 hover:underline flex items-center gap-1 px-3 py-1.5 bg-white rounded border border-green-300 hover:bg-green-100 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                          Open in New Tab
                        </a>
                        <Button
                          onClick={handleDeletePDF}
                          disabled={deletingPDF}
                          variant="outline"
                          className="text-sm text-red-700 hover:text-red-900 flex items-center gap-1 px-3 py-1.5 bg-white rounded border border-red-300 hover:bg-red-50 transition-colors"
                        >
                          {deletingPDF ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-700"></div>
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4" />
                              Delete PDF
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Input
                      type="file"
                      accept=".pdf"
                      onChange={(e) =>
                        setSelectedPDFFile(e.target.files?.[0] || null)
                      }
                    />
                    {selectedPDFFile && (
                      <p className="text-sm text-gray-600">
                        Selected: {selectedPDFFile.name}
                      </p>
                    )}
                    <Button
                      onClick={handleUploadPDF}
                      disabled={!selectedPDFFile || uploadingPDF}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {uploadingPDF ? "Uploading..." : "Upload PDF"}
                    </Button>
                  </div>
                )}

                {/* PDF Type Tabs - Always show both tabs */}
                <div className="mt-6">
                  <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                      <button
                        onClick={() => setSelectedPdfType("plant_health")}
                        className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                          selectedPdfType === "plant_health"
                            ? "border-green-500 text-green-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        🌿 Plant Health
                      </button>
                      <button
                        onClick={() => setSelectedPdfType("flowering")}
                        className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                          selectedPdfType === "flowering"
                            ? "border-green-500 text-green-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        🌸 Flowering
                      </button>
                    </nav>
                  </div>

                  {/* Tab Content */}
                  <div className="mt-4">
                    {selectedPdfType === "plant_health" && (
                      <div className="space-y-4">
                        {getCurrentPdfData()?.droneAnalysisData ? (
                          /* Plant Health Data Display */
                          <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl animate-in fade-in duration-300 shadow-md">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-200 rounded-full">
                                  <CheckCircle className="h-5 w-5 text-green-700" />
                                </div>
                                <p className="text-base font-bold text-gray-900">
                                  🌿 Plant Health Analysis Data
                                </p>
                                <Badge
                                  variant="outline"
                                  className="bg-green-100 text-green-700 border-green-400 font-semibold"
                                >
                                  Auto-extracted
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <a
                                  href={getFullPdfUrl(
                                    getCurrentPdfData()?.pdfUrl,
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download
                                  className="text-sm text-green-700 hover:text-green-900 hover:underline flex items-center gap-1 px-3 py-1.5 bg-white rounded border border-green-300 hover:bg-green-100 transition-colors"
                                >
                                  <Download className="h-4 w-4" />
                                  Download PDF
                                </a>
                              </div>
                            </div>

                            {/* Display structured drone data */}
                            {getCurrentPdfData()?.droneAnalysisData && (
                              <div className="mt-4 bg-white rounded-lg border border-gray-300 shadow-lg overflow-hidden">
                                {/* Header with Download Button */}
                                <div className="flex items-center justify-between bg-gray-50 px-6 py-3 border-b border-gray-200">
                                  <div className="flex-1"></div>
                                  <Button
                                    onClick={generateDroneDataPDF}
                                    disabled={generatingPDF}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    {generatingPDF ? (
                                      <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Generating PDF...
                                      </>
                                    ) : (
                                      <>
                                        <Download className="h-4 w-4 mr-2" />
                                        Download PDF Report
                                      </>
                                    )}
                                  </Button>
                                </div>

                                {/* Dual Header Banner */}
                                <div className="flex">
                                  <div className="flex-1 bg-green-100 px-6 py-4">
                                    <h2 className="text-lg font-bold text-green-700 uppercase tracking-wide">
                                      PLANT HEALTH MONITORING
                                    </h2>
                                  </div>
                                  <div className="flex-1 bg-teal-700 px-6 py-4">
                                    <h2 className="text-lg font-bold text-white uppercase tracking-wide">
                                      PLANT STRESS ANALYSIS
                                    </h2>
                                  </div>
                                </div>

                                {/* Report Information */}
                                {getCurrentPdfData()?.droneAnalysisData
                                  ?.report && (
                                  <div className="px-6 py-4 border-b-2 border-green-500">
                                    <div className="grid grid-cols-2 gap-8">
                                      <div className="space-y-3">
                                        <div>
                                          <span className="text-sm text-gray-600">
                                            Provider:
                                          </span>
                                          <span className="ml-2 text-base font-bold text-gray-900">
                                            {
                                              getCurrentPdfData()
                                                ?.droneAnalysisData?.report
                                                .provider
                                            }
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-sm text-gray-600">
                                            Type:
                                          </span>
                                          <span className="ml-2 text-base font-bold text-gray-900">
                                            {
                                              getCurrentPdfData()
                                                ?.droneAnalysisData?.report.type
                                            }
                                          </span>
                                        </div>
                                      </div>
                                      <div className="space-y-3">
                                        <div>
                                          <span className="text-sm text-gray-600">
                                            Survey Date:
                                          </span>
                                          <span className="ml-2 text-base font-bold text-gray-900">
                                            {
                                              getCurrentPdfData()
                                                ?.droneAnalysisData?.report
                                                .survey_date
                                            }
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-sm text-gray-600">
                                            Analysis:
                                          </span>
                                          <span className="ml-2 text-base font-bold text-gray-900">
                                            {
                                              getCurrentPdfData()
                                                ?.droneAnalysisData?.report
                                                .analysis_name
                                            }
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Crop and Field Information */}
                                {getCurrentPdfData()?.droneAnalysisData
                                  ?.field && (
                                  <div className="px-6 py-4 border-b-2 border-green-500">
                                    <div className="grid grid-cols-2 gap-8">
                                      <div className="space-y-3">
                                        <div>
                                          <span className="text-sm text-gray-600">
                                            Crop:
                                          </span>
                                          <span className="ml-2 text-base font-bold text-gray-900">
                                            {getCurrentPdfData()
                                              ?.droneAnalysisData?.field?.crop ||
                                              "N/A"}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-sm text-gray-600">
                                            Growing stage:
                                          </span>
                                          <span className="ml-2 text-base font-bold text-gray-900">
                                            {getCurrentPdfData()
                                              ?.droneAnalysisData?.field
                                              ?.growing_stage || "N/A"}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="space-y-3">
                                        <div>
                                          <span className="text-sm text-gray-600">
                                            Field area:
                                          </span>
                                          <span className="ml-2 text-base font-bold text-gray-900">
                                            {getCurrentPdfData()
                                              ?.droneAnalysisData?.field
                                              ?.area_hectares
                                              ? `${(getCurrentPdfData()?.droneAnalysisData?.field?.area_hectares ?? 0).toFixed(2)} Hectare`
                                              : "N/A"}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Additional Info */}
                                {getCurrentPdfData()?.droneAnalysisData
                                  ?.additional_info && (
                                  <div className="px-6 py-4 border-b-2 border-green-500">
                                    <div>
                                      <span className="text-sm text-gray-600">
                                        Additional Info:
                                      </span>
                                      <span className="ml-2 text-base font-bold text-gray-900">
                                        {
                                          getCurrentPdfData()?.droneAnalysisData
                                            .additional_info
                                        }
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          /* Plant Health Upload */
                          <div className="p-6 bg-gray-50 border-2 border-gray-200 rounded-xl">
                            <div className="text-center">
                              <div className="p-3 bg-gray-200 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                                <Upload className="h-6 w-6 text-gray-500" />
                              </div>
                              <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Upload Plant Health/Stress PDF
                              </h3>
                              <p className="text-sm text-gray-600 mb-4">
                                Upload a PDF containing plant health or stress
                                analysis data
                              </p>
                              <div className="space-y-3">
                                <div className="flex items-center justify-center w-full">
                                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                      <Upload className="w-8 h-8 mb-3 text-gray-400" />
                                      <p className="mb-2 text-sm text-gray-500">
                                        <span className="font-semibold">
                                          Click to upload
                                        </span>{" "}
                                        or drag and drop
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        PDF files only
                                      </p>
                                    </div>
                                    <input
                                      type="file"
                                      className="hidden"
                                      accept=".pdf"
                                      onChange={(e) =>
                                        setSelectedPDFFile(
                                          e.target.files?.[0] || null,
                                        )
                                      }
                                    />
                                  </label>
                                </div>
                                {selectedPDFFile && (
                                  <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-4 w-4 text-gray-500" />
                                      <span className="text-sm text-gray-700">
                                        {selectedPDFFile.name}
                                      </span>
                                    </div>
                                    <Button
                                      onClick={uploadDronePDF}
                                      disabled={
                                        !selectedPDFFile || uploadingPDF
                                      }
                                      className="bg-purple-600 hover:bg-purple-700 text-white"
                                    >
                                      {uploadingPDF
                                        ? "Uploading..."
                                        : "Upload PDF"}
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedPdfType === "flowering" && (
                      <div className="space-y-4">
                        {getCurrentPdfData()?.droneAnalysisData ? (
                          /* Flowering Data Display */
                          <div className="p-5 bg-gradient-to-r from-pink-50 to-rose-50 border-2 border-pink-300 rounded-xl animate-in fade-in duration-300 shadow-md">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-pink-200 rounded-full">
                                  <CheckCircle className="h-5 w-5 text-pink-700" />
                                </div>
                                <p className="text-base font-bold text-gray-900">
                                  🌸 Flowering Analysis Data
                                </p>
                                <Badge
                                  variant="outline"
                                  className="bg-pink-100 text-pink-700 border-pink-400 font-semibold"
                                >
                                  Auto-extracted
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <a
                                  href={getFullPdfUrl(
                                    getCurrentPdfData()?.pdfUrl,
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download
                                  className="text-sm text-pink-700 hover:text-pink-900 hover:underline flex items-center gap-1 px-3 py-1.5 bg-white rounded border border-pink-300 hover:bg-pink-100 transition-colors"
                                >
                                  <Download className="h-4 w-4" />
                                  Download PDF
                                </a>
                              </div>
                            </div>

                            {/* Display structured drone data */}
                            {getCurrentPdfData()?.droneAnalysisData && (
                              <div className="mt-4 bg-white rounded-lg border border-gray-300 shadow-lg overflow-hidden">
                                {/* Header with Download Button */}
                                <div className="flex items-center justify-between bg-gray-50 px-6 py-3 border-b border-gray-200">
                                  <div className="flex-1"></div>
                                  <Button
                                    onClick={generateDroneDataPDF}
                                    disabled={generatingPDF}
                                    className="bg-pink-600 hover:bg-pink-700 text-white"
                                  >
                                    {generatingPDF ? (
                                      <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Generating PDF...
                                      </>
                                    ) : (
                                      <>
                                        <Download className="h-4 w-4 mr-2" />
                                        Download PDF Report
                                      </>
                                    )}
                                  </Button>
                                </div>

                                {/* Dual Header Banner */}
                                <div className="flex">
                                  <div className="flex-1 bg-pink-100 px-6 py-4">
                                    <h2 className="text-lg font-bold text-pink-700 uppercase tracking-wide">
                                      FLOWERING MONITORING
                                    </h2>
                                  </div>
                                  <div className="flex-1 bg-rose-700 px-6 py-4">
                                    <h2 className="text-lg font-bold text-white uppercase tracking-wide">
                                      FLOWERING ESTIMATOR
                                    </h2>
                                  </div>
                                </div>

                                {/* Report Information */}
                                {getCurrentPdfData()?.droneAnalysisData
                                  ?.report && (
                                  <div className="px-6 py-4 border-b-2 border-pink-500">
                                    <div className="grid grid-cols-2 gap-8">
                                      <div className="space-y-3">
                                        <div>
                                          <span className="text-sm text-gray-600">
                                            Provider:
                                          </span>
                                          <span className="ml-2 text-base font-bold text-gray-900">
                                            {
                                              getCurrentPdfData()
                                                ?.droneAnalysisData?.report
                                                .provider
                                            }
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-sm text-gray-600">
                                            Type:
                                          </span>
                                          <span className="ml-2 text-base font-bold text-gray-900">
                                            {
                                              getCurrentPdfData()
                                                ?.droneAnalysisData?.report.type
                                            }
                                          </span>
                                        </div>
                                      </div>
                                      <div className="space-y-3">
                                        <div>
                                          <span className="text-sm text-gray-600">
                                            Survey Date:
                                          </span>
                                          <span className="ml-2 text-base font-bold text-gray-900">
                                            {
                                              getCurrentPdfData()
                                                ?.droneAnalysisData?.report
                                                .survey_date
                                            }
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-sm text-gray-600">
                                            Analysis:
                                          </span>
                                          <span className="ml-2 text-base font-bold text-gray-900">
                                            {
                                              getCurrentPdfData()
                                                ?.droneAnalysisData?.report
                                                .analysis_name
                                            }
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Crop and Field Information */}
                                {getCurrentPdfData()?.droneAnalysisData
                                  ?.field && (
                                  <div className="px-6 py-4 border-b-2 border-pink-500">
                                    <div className="grid grid-cols-2 gap-8">
                                      <div className="space-y-3">
                                        <div>
                                          <span className="text-sm text-gray-600">
                                            Crop:
                                          </span>
                                          <span className="ml-2 text-base font-bold text-gray-900">
                                            {getCurrentPdfData()
                                              ?.droneAnalysisData?.field?.crop ||
                                              "N/A"}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-sm text-gray-600">
                                            Growing stage:
                                          </span>
                                          <span className="ml-2 text-base font-bold text-gray-900">
                                            {getCurrentPdfData()
                                              ?.droneAnalysisData?.field
                                              ?.growing_stage || "N/A"}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="space-y-3">
                                        <div>
                                          <span className="text-sm text-gray-600">
                                            Field area:
                                          </span>
                                          <span className="ml-2 text-base font-bold text-gray-900">
                                            {getCurrentPdfData()
                                              ?.droneAnalysisData?.field
                                              ?.area_hectares
                                              ? `${(getCurrentPdfData()?.droneAnalysisData?.field?.area_hectares ?? 0).toFixed(2)} Hectare`
                                              : "N/A"}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Additional Info */}
                                {getCurrentPdfData()?.droneAnalysisData
                                  ?.additional_info && (
                                  <div className="px-6 py-4 border-b-2 border-pink-500">
                                    <div>
                                      <span className="text-sm text-gray-600">
                                        Additional Info:
                                      </span>
                                      <span className="ml-2 text-base font-bold text-gray-900">
                                        {
                                          getCurrentPdfData()?.droneAnalysisData
                                            .additional_info
                                        }
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          /* Flowering Upload */
                          <div className="p-6 bg-gray-50 border-2 border-gray-200 rounded-xl">
                            <div className="text-center">
                              <div className="p-3 bg-gray-200 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                                <Upload className="h-6 w-6 text-gray-500" />
                              </div>
                              <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Upload Flowering PDF
                              </h3>
                              <p className="text-sm text-gray-600 mb-4">
                                Upload a PDF containing flowering analysis data
                              </p>
                              <div className="space-y-3">
                                <div className="flex items-center justify-center w-full">
                                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                      <Upload className="w-8 h-8 mb-3 text-gray-400" />
                                      <p className="mb-2 text-sm text-gray-500">
                                        <span className="font-semibold">
                                          Click to upload
                                        </span>{" "}
                                        or drag and drop
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        PDF files only
                                      </p>
                                    </div>
                                    <input
                                      type="file"
                                      className="hidden"
                                      accept=".pdf"
                                      onChange={(e) =>
                                        setSelectedPDFFile(
                                          e.target.files?.[0] || null,
                                        )
                                      }
                                    />
                                  </label>
                                </div>
                                {selectedPDFFile && (
                                  <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-4 w-4 text-gray-500" />
                                      <span className="text-sm text-gray-700">
                                        {selectedPDFFile.name}
                                      </span>
                                    </div>
                                    <Button
                                      onClick={uploadDronePDF}
                                      disabled={
                                        !selectedPDFFile || uploadingPDF
                                      }
                                      className="bg-purple-600 hover:bg-purple-700 text-white"
                                    >
                                      {uploadingPDF
                                        ? "Uploading..."
                                        : "Upload PDF"}
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Show message if PDF uploaded but analysis data is still processing */}
                {hasAnyDronePdfs() &&
                  !getCurrentPdfData()?.droneAnalysisData &&
                  !assessment?.droneAnalysisData &&
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
                    </div>
                  )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* PDF Viewer Modal */}
      <Dialog open={pdfModalOpen} onOpenChange={setPdfModalOpen}>
        <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-600" />
              Drone Analysis PDF
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden bg-gray-100">
            {getCurrentPdfData()?.pdfUrl && (
              <iframe
                src={`${getFullPdfUrl(getCurrentPdfData()?.pdfUrl)}#toolbar=0`}
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
