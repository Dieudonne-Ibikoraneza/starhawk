import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { FileUpload } from "@/components/upload/FileUpload";
import { MapPicker } from "@/components/maps/MapPicker";
import { 
  Shield, 
  Camera, 
  Satellite, 
  FileText, 
  MapPin, 
  Calendar, 
  Crop, 
  Droplets, 
  Bug, 
  AlertTriangle,
  CheckCircle,
  Upload,
  Eye,
  Download,
  BarChart3,
  TrendingUp,
  Brain
} from "lucide-react";
import { RiskAssessment, AssessmentImage, AssessmentVideo, AssessmentReport } from "@/types/enhanced-api";

interface RiskAssessmentModuleProps {
  policyRequestId: string;
  farmerId: string;
  assessorId: string;
  onSubmit: (assessment: RiskAssessment) => void;
  onCancel: () => void;
}

export function RiskAssessmentModule({ 
  policyRequestId, 
  farmerId, 
  assessorId, 
  onSubmit, 
  onCancel 
}: RiskAssessmentModuleProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [assessment, setAssessment] = useState<Partial<RiskAssessment>>({
    policyRequestId,
    farmerId,
    assessorId,
    assessmentDate: new Date().toISOString(),
    seasonInfo: {
      seasonType: 'A',
      plantingDate: '',
      expectedHarvest: '',
      cropVariety: '',
      seedSpecifications: {
        type: '',
        supplier: '',
        germinationRate: 0
      },
      tillingMethods: []
    },
    agriculturalPractices: {
      fertilizers: {
        type: '',
        applicationSchedule: [],
        lastApplied: ''
      },
      irrigation: {
        systemType: 'manual',
        waterAvailability: 'moderate',
        frequency: ''
      },
      pestControl: {
        measures: [],
        lastTreatment: '',
        effectiveness: 'medium'
      }
    },
    riskFactors: {
      soilQuality: 'moderate',
      weatherExposure: 'medium',
      pestHistory: 'none',
      diseaseSusceptibility: 'medium',
      marketAccess: 'good'
    },
    documentation: {
      satelliteImages: [],
      droneFootage: [],
      fieldPhotos: [],
      reports: []
    },
    comments: '',
    riskScore: 0,
    riskCategory: 'medium',
    qaStatus: 'draft'
  });

  const [aiAnalysisResults, setAiAnalysisResults] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const totalSteps = 5;

  const handleInputChange = (section: string, field: string, value: any) => {
    setAssessment(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const handleNestedInputChange = (section: string, subsection: string, field: string, value: any) => {
    setAssessment(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [subsection]: {
          ...(prev[section as keyof typeof prev] as any)?.[subsection],
          [field]: value
        }
      }
    }));
  };

  const handleArrayChange = (section: string, subsection: string, field: string, value: string, checked: boolean) => {
    const currentArray = (assessment as any)[section][subsection][field] || [];
    let newArray;
    if (checked) {
      newArray = [...currentArray, value];
    } else {
      newArray = currentArray.filter((item: string) => item !== value);
    }
    handleNestedInputChange(section, subsection, field, newArray);
  };

  const handleFileUpload = (type: 'satellite' | 'drone' | 'field' | 'report', files: File[]) => {
    const newFiles = files.map(file => ({
      id: `file_${Date.now()}_${Math.random()}`,
      url: URL.createObjectURL(file),
      caption: file.name,
      coordinates: assessment.seasonInfo?.coords || [30.1234, -1.9456],
      timestamp: new Date().toISOString()
    }));

    const currentDocs = assessment.documentation || { satelliteImages: [], droneFootage: [], fieldPhotos: [], reports: [] };
    
    switch (type) {
      case 'satellite':
        setAssessment(prev => ({
          ...prev,
          documentation: {
            ...currentDocs,
            satelliteImages: [...currentDocs.satelliteImages, ...newFiles]
          }
        }));
        break;
      case 'drone':
        setAssessment(prev => ({
          ...prev,
          documentation: {
            ...currentDocs,
            droneFootage: [...currentDocs.droneFootage, ...newFiles]
          }
        }));
        break;
      case 'field':
        setAssessment(prev => ({
          ...prev,
          documentation: {
            ...currentDocs,
            fieldPhotos: [...currentDocs.fieldPhotos, ...newFiles]
          }
        }));
        break;
      case 'report':
        const newReports = files.map(file => ({
          id: `report_${Date.now()}_${Math.random()}`,
          title: file.name,
          content: '',
          fileUrl: URL.createObjectURL(file),
          reportType: 'field_inspection' as const,
          generatedDate: new Date().toISOString()
        }));
        setAssessment(prev => ({
          ...prev,
          documentation: {
            ...currentDocs,
            reports: [...currentDocs.reports, ...newReports]
          }
        }));
        break;
    }
  };

  const calculateRiskScore = () => {
    let score = 50; // Base score

    // Soil quality impact
    const soilScores = { excellent: -20, good: -10, moderate: 0, poor: 15 };
    score += soilScores[assessment.riskFactors?.soilQuality || 'moderate'];

    // Weather exposure impact
    const weatherScores = { low: -15, medium: 0, high: 20 };
    score += weatherScores[assessment.riskFactors?.weatherExposure || 'medium'];

    // Pest history impact
    const pestScores = { none: -10, minor: 0, moderate: 10, severe: 25 };
    score += pestScores[assessment.riskFactors?.pestHistory || 'none'];

    // Disease susceptibility impact
    const diseaseScores = { low: -10, medium: 0, high: 15 };
    score += diseaseScores[assessment.riskFactors?.diseaseSusceptibility || 'medium'];

    // Market access impact
    const marketScores = { excellent: -5, good: -2, moderate: 5, poor: 10 };
    score += marketScores[assessment.riskFactors?.marketAccess || 'good'];

    // Irrigation system impact
    const irrigationScores = { excellent: -10, good: -5, moderate: 5, poor: 15 };
    score += irrigationScores[assessment.agriculturalPractices?.irrigation?.waterAvailability || 'moderate'];

    return Math.max(0, Math.min(100, score));
  };

  const getRiskCategory = (score: number): 'low' | 'medium' | 'high' => {
    if (score < 30) return 'low';
    if (score < 70) return 'medium';
    return 'high';
  };

  const runAIAnalysis = async () => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const riskScore = calculateRiskScore();
    const riskCategory = getRiskCategory(riskScore);
    
    setAiAnalysisResults({
      riskScore,
      riskCategory,
      confidence: 85,
      recommendations: [
        'Consider implementing drip irrigation for better water efficiency',
        'Apply organic fertilizers to improve soil quality',
        'Schedule regular pest monitoring visits',
        'Install weather monitoring sensors'
      ],
      threats: [
        { type: 'Weed Infestation', probability: 65, severity: 'medium' },
        { type: 'Drought Risk', probability: 40, severity: 'low' },
        { type: 'Pest Attack', probability: 30, severity: 'low' }
      ]
    });

    setAssessment(prev => ({
      ...prev,
      riskScore,
      riskCategory
    }));

    setIsAnalyzing(false);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(assessment.seasonInfo?.plantingDate && assessment.seasonInfo?.expectedHarvest && assessment.seasonInfo?.cropVariety);
      case 2:
        return !!(assessment.agriculturalPractices?.fertilizers?.type && assessment.agriculturalPractices?.irrigation?.systemType);
      case 3:
        return true; // Risk factors always have defaults
      case 4:
        return assessment.documentation && (
          assessment.documentation.satelliteImages.length > 0 ||
          assessment.documentation.droneFootage.length > 0 ||
          assessment.documentation.fieldPhotos.length > 0
        );
      case 5:
        return !!(assessment.comments && assessment.comments.trim().length > 0);
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    if (validateStep(currentStep)) {
      const finalAssessment: RiskAssessment = {
        id: `assessment_${Date.now()}`,
        ...assessment,
        assessmentDate: new Date().toISOString(),
        riskScore: calculateRiskScore(),
        riskCategory: getRiskCategory(calculateRiskScore()),
        qaStatus: 'submitted',
        submissionDate: new Date().toISOString()
      } as RiskAssessment;
      
      onSubmit(finalAssessment);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div key={i} className="flex items-center">
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
            ${i + 1 <= currentStep 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-500'
            }
          `}>
            {i + 1}
          </div>
          {i < totalSteps - 1 && (
            <div className={`
              w-16 h-1 mx-2
              ${i + 1 < currentStep ? 'bg-blue-600' : 'bg-gray-200'}
            `} />
          )}
        </div>
      ))}
    </div>
  );

  const renderSeasonInfo = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Calendar className="h-12 w-12 mx-auto text-blue-600 mb-4" />
        <h3 className="text-xl font-semibold">Seasonal & Crop Information</h3>
        <p className="text-gray-600">Provide details about the farming season and crop specifications</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="seasonType">Season Type *</Label>
          <Select
            value={assessment.seasonInfo?.seasonType || 'A'}
            onValueChange={(value) => handleNestedInputChange('seasonInfo', 'seasonType', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select season type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="A">Season A (Sept - Jan)</SelectItem>
              <SelectItem value="B">Season B (Feb - Jun)</SelectItem>
              <SelectItem value="C">Season C (Jul - Aug)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="plantingDate">Planting Date *</Label>
          <Input
            id="plantingDate"
            type="date"
            value={assessment.seasonInfo?.plantingDate || ''}
            onChange={(e) => handleNestedInputChange('seasonInfo', 'plantingDate', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="expectedHarvest">Expected Harvest Date *</Label>
          <Input
            id="expectedHarvest"
            type="date"
            value={assessment.seasonInfo?.expectedHarvest || ''}
            onChange={(e) => handleNestedInputChange('seasonInfo', 'expectedHarvest', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cropVariety">Crop Variety *</Label>
          <Input
            id="cropVariety"
            placeholder="Enter crop variety"
            value={assessment.seasonInfo?.cropVariety || ''}
            onChange={(e) => handleNestedInputChange('seasonInfo', 'cropVariety', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="seedType">Seed Type</Label>
          <Input
            id="seedType"
            placeholder="Enter seed type"
            value={assessment.seasonInfo?.seedSpecifications?.type || ''}
            onChange={(e) => handleNestedInputChange('seasonInfo', 'seedSpecifications', 'type', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="germinationRate">Germination Rate (%)</Label>
          <Input
            id="germinationRate"
            type="number"
            min="0"
            max="100"
            placeholder="Enter germination rate"
            value={assessment.seasonInfo?.seedSpecifications?.germinationRate || ''}
            onChange={(e) => handleNestedInputChange('seasonInfo', 'seedSpecifications', 'germinationRate', parseInt(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="space-y-4">
        <Label>Tilling Methods</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['Conventional Tillage', 'Minimum Tillage', 'No-Till', 'Ridge Tillage', 'Strip Tillage', 'Mulch Tillage'].map((method) => (
            <div key={method} className="flex items-center space-x-2">
              <Checkbox
                checked={assessment.seasonInfo?.tillingMethods?.includes(method) || false}
                onCheckedChange={(checked) => handleArrayChange('seasonInfo', 'tillingMethods', method, checked as boolean)}
              />
              <Label className="text-sm">{method}</Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAgriculturalPractices = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Crop className="h-12 w-12 mx-auto text-green-600 mb-4" />
        <h3 className="text-xl font-semibold">Agricultural Practices</h3>
        <p className="text-gray-600">Document farming practices and inputs</p>
      </div>

      <div className="space-y-8">
        {/* Fertilizer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Droplets className="h-5 w-5" />
              <span>Fertilizer Management</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fertilizerType">Fertilizer Type *</Label>
                <Select
                  value={assessment.agriculturalPractices?.fertilizers?.type || ''}
                  onValueChange={(value) => handleNestedInputChange('agriculturalPractices', 'fertilizers', 'type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select fertilizer type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="organic">Organic Fertilizer</SelectItem>
                    <SelectItem value="inorganic">Inorganic Fertilizer</SelectItem>
                    <SelectItem value="mixed">Mixed (Organic + Inorganic)</SelectItem>
                    <SelectItem value="none">No Fertilizer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastApplied">Last Applied</Label>
                <Input
                  id="lastApplied"
                  type="date"
                  value={assessment.agriculturalPractices?.fertilizers?.lastApplied || ''}
                  onChange={(e) => handleNestedInputChange('agriculturalPractices', 'fertilizers', 'lastApplied', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Application Schedule</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['Pre-planting', 'At planting', 'Early growth', 'Mid-season', 'Pre-harvest'].map((schedule) => (
                  <div key={schedule} className="flex items-center space-x-2">
                    <Checkbox
                      checked={assessment.agriculturalPractices?.fertilizers?.applicationSchedule?.includes(schedule) || false}
                      onCheckedChange={(checked) => handleArrayChange('agriculturalPractices', 'fertilizers', 'applicationSchedule', schedule, checked as boolean)}
                    />
                    <Label className="text-sm">{schedule}</Label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Irrigation Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Droplets className="h-5 w-5" />
              <span>Irrigation System</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="irrigationType">System Type *</Label>
                <Select
                  value={assessment.agriculturalPractices?.irrigation?.systemType || ''}
                  onValueChange={(value) => handleNestedInputChange('agriculturalPractices', 'irrigation', 'systemType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select irrigation type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="drip">Drip Irrigation</SelectItem>
                    <SelectItem value="sprinkler">Sprinkler Irrigation</SelectItem>
                    <SelectItem value="flood">Flood Irrigation</SelectItem>
                    <SelectItem value="manual">Manual Watering</SelectItem>
                    <SelectItem value="rainfed">Rain-fed Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="waterAvailability">Water Availability</Label>
                <Select
                  value={assessment.agriculturalPractices?.irrigation?.waterAvailability || ''}
                  onValueChange={(value) => handleNestedInputChange('agriculturalPractices', 'irrigation', 'waterAvailability', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select water availability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="irrigationFrequency">Irrigation Frequency</Label>
              <Input
                id="irrigationFrequency"
                placeholder="e.g., Every 3 days, Weekly, etc."
                value={assessment.agriculturalPractices?.irrigation?.frequency || ''}
                onChange={(e) => handleNestedInputChange('agriculturalPractices', 'irrigation', 'frequency', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Pest Control Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bug className="h-5 w-5" />
              <span>Pest Control</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lastTreatment">Last Treatment</Label>
                <Input
                  id="lastTreatment"
                  type="date"
                  value={assessment.agriculturalPractices?.pestControl?.lastTreatment || ''}
                  onChange={(e) => handleNestedInputChange('agriculturalPractices', 'pestControl', 'lastTreatment', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="effectiveness">Treatment Effectiveness</Label>
                <Select
                  value={assessment.agriculturalPractices?.pestControl?.effectiveness || ''}
                  onValueChange={(value) => handleNestedInputChange('agriculturalPractices', 'pestControl', 'effectiveness', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select effectiveness" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Pest Control Measures</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {['Chemical Pesticides', 'Organic Pesticides', 'Biological Control', 'Cultural Practices', 'Physical Barriers', 'None'].map((measure) => (
                  <div key={measure} className="flex items-center space-x-2">
                    <Checkbox
                      checked={assessment.agriculturalPractices?.pestControl?.measures?.includes(measure) || false}
                      onCheckedChange={(checked) => handleArrayChange('agriculturalPractices', 'pestControl', 'measures', measure, checked as boolean)}
                    />
                    <Label className="text-sm">{measure}</Label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderRiskFactors = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <AlertTriangle className="h-12 w-12 mx-auto text-orange-600 mb-4" />
        <h3 className="text-xl font-semibold">Risk Factor Assessment</h3>
        <p className="text-gray-600">Evaluate various risk factors affecting crop production</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { key: 'soilQuality', label: 'Soil Quality', options: ['excellent', 'good', 'moderate', 'poor'] },
          { key: 'weatherExposure', label: 'Weather Exposure', options: ['low', 'medium', 'high'] },
          { key: 'pestHistory', label: 'Pest History', options: ['none', 'minor', 'moderate', 'severe'] },
          { key: 'diseaseSusceptibility', label: 'Disease Susceptibility', options: ['low', 'medium', 'high'] },
          { key: 'marketAccess', label: 'Market Access', options: ['excellent', 'good', 'moderate', 'poor'] }
        ].map((factor) => (
          <Card key={factor.key}>
            <CardHeader>
              <CardTitle className="text-lg">{factor.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={(assessment.riskFactors as any)?.[factor.key] || 'moderate'}
                onValueChange={(value) => handleNestedInputChange('riskFactors', factor.key, value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${factor.label.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  {factor.options.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Risk Score Preview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Calculated Risk Score</span>
              <Badge variant="outline" className="text-lg">
                {calculateRiskScore()}/100
              </Badge>
            </div>
            <Progress value={calculateRiskScore()} className="w-full" />
            <div className="flex justify-between text-sm text-gray-500">
              <span>Low Risk</span>
              <span>Medium Risk</span>
              <span>High Risk</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderDocumentation = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Upload className="h-12 w-12 mx-auto text-purple-600 mb-4" />
        <h3 className="text-xl font-semibold">Documentation Upload</h3>
        <p className="text-gray-600">Upload satellite images, drone footage, and field photos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Satellite Images */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Satellite className="h-5 w-5" />
              <span>Satellite Images</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FileUpload
              onUpload={(files) => handleFileUpload('satellite', files)}
              accept=".jpg,.jpeg,.png,.tiff"
              maxSize={10 * 1024 * 1024} // 10MB
              multiple={true}
            />
            {assessment.documentation?.satelliteImages && assessment.documentation.satelliteImages.length > 0 && (
              <div className="space-y-2">
                <Label>Uploaded Images ({assessment.documentation.satelliteImages.length})</Label>
                <div className="grid grid-cols-2 gap-2">
                  {assessment.documentation.satelliteImages.map((image, index) => (
                    <div key={image.id} className="relative">
                      <img src={image.url} alt={image.caption} className="w-full h-20 object-cover rounded" />
                      <Badge className="absolute top-1 right-1 text-xs">Satellite</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Drone Footage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Camera className="h-5 w-5" />
              <span>Drone Footage</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FileUpload
              onUpload={(files) => handleFileUpload('drone', files)}
              accept=".mp4,.avi,.mov,.mkv"
              maxSize={50 * 1024 * 1024} // 50MB
              multiple={true}
            />
            {assessment.documentation?.droneFootage && assessment.documentation.droneFootage.length > 0 && (
              <div className="space-y-2">
                <Label>Uploaded Videos ({assessment.documentation.droneFootage.length})</Label>
                <div className="space-y-2">
                  {assessment.documentation.droneFootage.map((video, index) => (
                    <div key={video.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                      <video src={video.url} className="w-16 h-12 object-cover rounded" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{video.caption}</p>
                        <p className="text-xs text-gray-500">Duration: {video.duration}s</p>
                      </div>
                      <Badge variant="outline">Drone</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Field Photos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Camera className="h-5 w-5" />
              <span>Field Photos</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FileUpload
              onUpload={(files) => handleFileUpload('field', files)}
              accept=".jpg,.jpeg,.png"
              maxSize={5 * 1024 * 1024} // 5MB
              multiple={true}
            />
            {assessment.documentation?.fieldPhotos && assessment.documentation.fieldPhotos.length > 0 && (
              <div className="space-y-2">
                <Label>Uploaded Photos ({assessment.documentation.fieldPhotos.length})</Label>
                <div className="grid grid-cols-3 gap-2">
                  {assessment.documentation.fieldPhotos.map((photo, index) => (
                    <div key={photo.id} className="relative">
                      <img src={photo.url} alt={photo.caption} className="w-full h-20 object-cover rounded" />
                      <Badge className="absolute top-1 right-1 text-xs">Field</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Assessment Reports</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FileUpload
              onUpload={(files) => handleFileUpload('report', files)}
              accept=".pdf,.doc,.docx"
              maxSize={10 * 1024 * 1024} // 10MB
              multiple={true}
            />
            {assessment.documentation?.reports && assessment.documentation.reports.length > 0 && (
              <div className="space-y-2">
                <Label>Uploaded Reports ({assessment.documentation.reports.length})</Label>
                <div className="space-y-2">
                  {assessment.documentation.reports.map((report, index) => (
                    <div key={report.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                      <FileText className="h-8 w-8 text-blue-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{report.title}</p>
                        <p className="text-xs text-gray-500">{report.reportType}</p>
                      </div>
                      <Button size="sm" variant="outline">
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderAIAnalysis = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Brain className="h-12 w-12 mx-auto text-indigo-600 mb-4" />
        <h3 className="text-xl font-semibold">AI Risk Analysis</h3>
        <p className="text-gray-600">AI-powered assessment and recommendations</p>
      </div>

      <div className="flex justify-center mb-6">
        <Button
          onClick={runAIAnalysis}
          disabled={isAnalyzing}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {isAnalyzing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Analyzing...
            </>
          ) : (
            <>
              <Brain className="h-4 w-4 mr-2" />
              Run AI Analysis
            </>
          )}
        </Button>
      </div>

      {aiAnalysisResults && (
        <div className="space-y-6">
          {/* Risk Score */}
          <Card className="bg-gradient-to-r from-indigo-50 to-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>AI Risk Assessment</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-600">
                    {aiAnalysisResults.riskScore}
                  </div>
                  <div className="text-sm text-gray-600">Risk Score</div>
                </div>
                <div className="text-center">
                  <Badge 
                    variant={aiAnalysisResults.riskCategory === 'low' ? 'default' : 
                            aiAnalysisResults.riskCategory === 'medium' ? 'secondary' : 'destructive'}
                    className="text-lg px-4 py-2"
                  >
                    {aiAnalysisResults.riskCategory.toUpperCase()} RISK
                  </Badge>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {aiAnalysisResults.confidence}%
                  </div>
                  <div className="text-sm text-gray-600">AI Confidence</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>AI Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {aiAnalysisResults.recommendations.map((recommendation: string, index: number) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{recommendation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Threat Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Threat Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {aiAnalysisResults.threats.map((threat: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div>
                      <p className="font-medium">{threat.type}</p>
                      <p className="text-sm text-gray-600">Severity: {threat.severity}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-orange-600">
                        {threat.probability}%
                      </div>
                      <div className="text-xs text-gray-500">Probability</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Comments */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment Comments</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Add your observations, recommendations, and any additional notes..."
            value={assessment.comments || ''}
            onChange={(e) => handleInputChange('comments', e.target.value)}
            rows={6}
          />
        </CardContent>
      </Card>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderSeasonInfo();
      case 2:
        return renderAgriculturalPractices();
      case 3:
        return renderRiskFactors();
      case 4:
        return renderDocumentation();
      case 5:
        return renderAIAnalysis();
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">Risk Assessment Module</CardTitle>
          <p className="text-center text-gray-600">
            Comprehensive field assessment and risk evaluation
          </p>
        </CardHeader>
        <CardContent>
          {renderStepIndicator()}
          
          <div className="mb-8">
            {renderCurrentStep()}
          </div>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={currentStep === 1 ? onCancel : prevStep}
            >
              {currentStep === 1 ? 'Cancel' : 'Previous'}
            </Button>

            {currentStep < totalSteps ? (
              <Button
                onClick={nextStep}
                disabled={!validateStep(currentStep)}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!validateStep(currentStep)}
                className="bg-green-600 hover:bg-green-700"
              >
                Submit Assessment
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
