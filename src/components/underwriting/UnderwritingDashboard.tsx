import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  LineChart as RechartsLineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  TrendingUp, 
  BarChart3, 
  Users, 
  MapPin, 
  Brain,
  Download,
  Eye,
  FileText,
  Camera,
  Satellite,
  Clock,
  DollarSign,
  Calendar,
  Filter,
  Search,
  RefreshCw,
  Settings,
  Bell,
  Star,
  Target,
  Zap
} from "lucide-react";
import { RiskAssessment, UnderwritingDecision, PolicyRequest } from "@/types/enhanced-api";

interface UnderwritingDashboardProps {
  underwriterId: string;
}

export function UnderwritingDashboard({ underwriterId }: UnderwritingDashboardProps) {
  const [selectedAssessment, setSelectedAssessment] = useState<RiskAssessment | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data - in real implementation, this would come from API
  const assessments: RiskAssessment[] = [
    {
      id: "assess_001",
      policyRequestId: "req_001",
      farmerId: "farmer_001",
      assessorId: "assessor_001",
      assessmentDate: "2024-03-15T10:00:00Z",
      seasonInfo: {
        seasonType: "A",
        plantingDate: "2024-02-15",
        expectedHarvest: "2024-07-15",
        cropVariety: "Hybrid Maize 614",
        seedSpecifications: {
          type: "Certified Hybrid",
          supplier: "Rwanda Seeds Co.",
          germinationRate: 95
        },
        tillingMethods: ["Minimum Tillage", "Ridge Tillage"]
      },
      agriculturalPractices: {
        fertilizers: {
          type: "mixed",
          applicationSchedule: ["Pre-planting", "At planting", "Mid-season"],
          lastApplied: "2024-02-20"
        },
        irrigation: {
          systemType: "drip",
          waterAvailability: "good",
          frequency: "Every 3 days"
        },
        pestControl: {
          measures: ["Organic Pesticides", "Biological Control"],
          lastTreatment: "2024-03-01",
          effectiveness: "high"
        }
      },
      riskFactors: {
        soilQuality: "good",
        weatherExposure: "medium",
        pestHistory: "minor",
        diseaseSusceptibility: "low",
        marketAccess: "excellent"
      },
      documentation: {
        satelliteImages: [],
        droneFootage: [],
        fieldPhotos: [],
        reports: []
      },
      comments: "Excellent farming practices observed. Strong irrigation system and good pest control measures in place.",
      riskScore: 25,
      riskCategory: "low",
      qaStatus: "submitted",
      submissionDate: "2024-03-15T15:30:00Z"
    },
    {
      id: "assess_002",
      policyRequestId: "req_002",
      farmerId: "farmer_002",
      assessorId: "assessor_002",
      assessmentDate: "2024-03-16T09:00:00Z",
      seasonInfo: {
        seasonType: "A",
        plantingDate: "2024-02-10",
        expectedHarvest: "2024-07-10",
        cropVariety: "Local Rice Variety",
        seedSpecifications: {
          type: "Traditional Seeds",
          supplier: "Local Market",
          germinationRate: 78
        },
        tillingMethods: ["Conventional Tillage"]
      },
      agriculturalPractices: {
        fertilizers: {
          type: "organic",
          applicationSchedule: ["Pre-planting"],
          lastApplied: "2024-02-15"
        },
        irrigation: {
          systemType: "flood",
          waterAvailability: "moderate",
          frequency: "Weekly"
        },
        pestControl: {
          measures: ["Cultural Practices"],
          lastTreatment: "2024-02-28",
          effectiveness: "medium"
        }
      },
      riskFactors: {
        soilQuality: "moderate",
        weatherExposure: "high",
        pestHistory: "moderate",
        diseaseSusceptibility: "medium",
        marketAccess: "good"
      },
      documentation: {
        satelliteImages: [],
        droneFootage: [],
        fieldPhotos: [],
        reports: []
      },
      comments: "Traditional farming methods with moderate risk factors. Water availability concerns noted.",
      riskScore: 65,
      riskCategory: "medium",
      qaStatus: "submitted",
      submissionDate: "2024-03-16T14:20:00Z"
    }
  ];

  const decisions: UnderwritingDecision[] = [
    {
      id: "decision_001",
      assessmentId: "assess_001",
      underwriterId: underwriterId,
      decisionDate: "2024-03-16T10:00:00Z",
      decision: "approve",
      decisionFactors: {
        riskScore: 25,
        historicalData: 85,
        weatherPatterns: 90,
        marketTrends: 80,
        aiRecommendation: 92
      },
      aiInsights: {
        riskProbability: 15,
        recommendedPremium: 120000,
        suggestedCoverage: 1200000,
        fraudIndicators: [],
        confidence: 95
      },
      notes: "Excellent risk profile. Strong farming practices and low risk factors.",
      approvedAmount: 1200000,
      premium: 120000,
      effectiveDate: "2024-03-20T00:00:00Z"
    }
  ];

  const monitoringData = [
    { stage: "Planting", health: 95, threats: 5, date: "2024-02-15" },
    { stage: "Germination", health: 88, threats: 12, date: "2024-03-01" },
    { stage: "Vegetation", health: 82, threats: 18, date: "2024-03-15" },
    { stage: "Flowering", health: 78, threats: 22, date: "2024-04-01" }
  ];

  const riskDistribution = [
    { name: "Low Risk", value: 45, color: "#10B981" },
    { name: "Medium Risk", value: 35, color: "#F59E0B" },
    { name: "High Risk", value: 20, color: "#EF4444" }
  ];

  const filteredAssessments = assessments.filter(assessment => {
    const matchesStatus = filterStatus === "all" || assessment.qaStatus === filterStatus;
    const matchesSearch = searchTerm === "" || 
      assessment.farmerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assessment.seasonInfo.cropVariety.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                <p className="text-2xl font-bold text-orange-600">12</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved Today</p>
                <p className="text-2xl font-bold text-green-600">8</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Premium</p>
                <p className="text-2xl font-bold text-blue-600">RWF 2.4M</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">AI Accuracy</p>
                <p className="text-2xl font-bold text-purple-600">94%</p>
              </div>
              <Brain className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={riskDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Crop Monitoring Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsLineChart data={monitoringData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="health" stroke="#10B981" strokeWidth={2} name="Crop Health %" />
                <Line type="monotone" dataKey="threats" stroke="#EF4444" strokeWidth={2} name="Threat Level %" />
              </RechartsLineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Decisions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Underwriting Decisions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {decisions.map((decision) => (
              <div key={decision.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${
                    decision.decision === 'approve' ? 'bg-green-500' : 
                    decision.decision === 'reject' ? 'bg-red-500' : 'bg-yellow-500'
                  }`} />
                  <div>
                    <p className="font-medium">Assessment #{decision.assessmentId}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(decision.decisionDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge variant={
                    decision.decision === 'approve' ? 'default' : 
                    decision.decision === 'reject' ? 'destructive' : 'secondary'
                  }>
                    {decision.decision.toUpperCase()}
                  </Badge>
                  <span className="text-sm font-medium">
                    RWF {decision.approvedAmount?.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderRiskAssessments = () => (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search assessments..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Assessment List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredAssessments.map((assessment) => (
          <Card 
            key={assessment.id} 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedAssessment(assessment)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Assessment #{assessment.id}</CardTitle>
                <Badge variant={
                  assessment.riskCategory === 'low' ? 'default' : 
                  assessment.riskCategory === 'medium' ? 'secondary' : 'destructive'
                }>
                  {assessment.riskCategory.toUpperCase()} RISK
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-500">Farmer ID</Label>
                  <p className="font-medium">{assessment.farmerId}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Crop Variety</Label>
                  <p className="font-medium">{assessment.seasonInfo.cropVariety}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Risk Score</Label>
                  <div className="flex items-center space-x-2">
                    <Progress value={assessment.riskScore} className="flex-1" />
                    <span className="font-medium">{assessment.riskScore}/100</span>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-500">Assessment Date</Label>
                  <p className="font-medium">
                    {new Date(assessment.assessmentDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Camera className="h-4 w-4" />
                  <span>{assessment.documentation.fieldPhotos.length} photos</span>
                  <Satellite className="h-4 w-4" />
                  <span>{assessment.documentation.satelliteImages.length} satellite</span>
                </div>
                <Button size="sm" variant="outline">
                  <Eye className="h-4 w-4 mr-1" />
                  Review
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderAssessmentDetail = () => {
    if (!selectedAssessment) return null;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Assessment #{selectedAssessment.id}</h2>
            <p className="text-gray-600">Farmer: {selectedAssessment.farmerId}</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button onClick={() => setSelectedAssessment(null)}>
              Back to List
            </Button>
          </div>
        </div>

        {/* Risk Score Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600">
                  {selectedAssessment.riskScore}
                </div>
                <div className="text-sm text-gray-600">Risk Score</div>
                <Progress value={selectedAssessment.riskScore} className="mt-2" />
              </div>
              <div className="text-center">
                <Badge 
                  variant={selectedAssessment.riskCategory === 'low' ? 'default' : 
                          selectedAssessment.riskCategory === 'medium' ? 'secondary' : 'destructive'}
                  className="text-xl px-6 py-2"
                >
                  {selectedAssessment.riskCategory.toUpperCase()} RISK
                </Badge>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600">
                  92%
                </div>
                <div className="text-sm text-gray-600">AI Confidence</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assessment Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Season Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Season Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-500">Season Type</Label>
                  <p className="font-medium">Season {selectedAssessment.seasonInfo.seasonType}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Crop Variety</Label>
                  <p className="font-medium">{selectedAssessment.seasonInfo.cropVariety}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Planting Date</Label>
                  <p className="font-medium">
                    {new Date(selectedAssessment.seasonInfo.plantingDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">Expected Harvest</Label>
                  <p className="font-medium">
                    {new Date(selectedAssessment.seasonInfo.expectedHarvest).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">Germination Rate</Label>
                  <p className="font-medium">{selectedAssessment.seasonInfo.seedSpecifications.germinationRate}%</p>
                </div>
                <div>
                  <Label className="text-gray-500">Seed Type</Label>
                  <p className="font-medium">{selectedAssessment.seasonInfo.seedSpecifications.type}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Factors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5" />
                <span>Risk Factors</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(selectedAssessment.riskFactors).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <Badge variant={
                    value === 'excellent' || value === 'low' || value === 'none' ? 'default' :
                    value === 'good' || value === 'medium' || value === 'minor' ? 'secondary' : 'destructive'
                  }>
                    {value}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Agricultural Practices */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Agricultural Practices</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Fertilizer Type</Label>
                <p className="font-medium">{selectedAssessment.agriculturalPractices.fertilizers.type}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Irrigation System</Label>
                <p className="font-medium capitalize">{selectedAssessment.agriculturalPractices.irrigation.systemType}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Water Availability</Label>
                <p className="font-medium capitalize">{selectedAssessment.agriculturalPractices.irrigation.waterAvailability}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Pest Control Effectiveness</Label>
                <p className="font-medium capitalize">{selectedAssessment.agriculturalPractices.pestControl.effectiveness}</p>
              </div>
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card className="bg-gradient-to-r from-purple-50 to-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-5 w-5" />
                <span>AI Insights</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Risk Probability</Label>
                  <p className="text-2xl font-bold text-purple-600">15%</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Recommended Premium</Label>
                  <p className="text-2xl font-bold text-blue-600">RWF 120,000</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Suggested Coverage</Label>
                  <p className="text-lg font-semibold text-green-600">RWF 1,200,000</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">AI Confidence</Label>
                  <p className="text-lg font-semibold text-indigo-600">95%</p>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <Label className="text-sm font-medium text-gray-500">Recommendations</Label>
                <ul className="mt-2 space-y-1 text-sm">
                  <li className="flex items-center space-x-2">
                    <Star className="h-3 w-3 text-yellow-500" />
                    <span>Excellent farming practices observed</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Star className="h-3 w-3 text-yellow-500" />
                    <span>Strong irrigation system in place</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Star className="h-3 w-3 text-yellow-500" />
                    <span>Good pest control measures</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comments */}
        <Card>
          <CardHeader>
            <CardTitle>Assessment Comments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{selectedAssessment.comments}</p>
          </CardContent>
        </Card>

        {/* Decision Actions */}
        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle>Underwriting Decision</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <Button className="bg-green-600 hover:bg-green-700 flex-1">
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve Policy
              </Button>
              <Button variant="outline" className="flex-1">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Request More Info
              </Button>
              <Button variant="destructive" className="flex-1">
                <XCircle className="h-4 w-4 mr-2" />
                Reject Policy
              </Button>
            </div>
            
            <div className="mt-4">
              <Label htmlFor="decisionNotes">Decision Notes</Label>
              <Textarea
                id="decisionNotes"
                placeholder="Add your decision rationale and any conditions..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Underwriting Dashboard</h1>
        <p className="text-gray-600">AI-powered risk assessment and policy underwriting</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assessments">Risk Assessments</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          {renderOverview()}
        </TabsContent>

        <TabsContent value="assessments" className="mt-6">
          {selectedAssessment ? renderAssessmentDetail() : renderRiskAssessments()}
        </TabsContent>

        <TabsContent value="monitoring" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Continuous Crop Monitoring</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Stage-based Monitoring */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Stage-Based Monitoring</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {monitoringData.map((stage, index) => (
                      <Card key={stage.stage} className="text-center">
                        <CardContent className="p-4">
                          <div className="text-sm font-medium text-gray-600">{stage.stage}</div>
                          <div className="text-2xl font-bold text-blue-600 mt-2">{stage.health}%</div>
                          <div className="text-xs text-gray-500">Health</div>
                          <Progress value={stage.health} className="mt-2" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Threat Analysis */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Threat Analysis</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-orange-50">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertTriangle className="h-5 w-5 text-orange-600" />
                          <span className="font-medium">Weed Infestation</span>
                        </div>
                        <div className="text-2xl font-bold text-orange-600">65%</div>
                        <div className="text-sm text-gray-600">Probability</div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-yellow-50">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertTriangle className="h-5 w-5 text-yellow-600" />
                          <span className="font-medium">Drought Risk</span>
                        </div>
                        <div className="text-2xl font-bold text-yellow-600">40%</div>
                        <div className="text-sm text-gray-600">Probability</div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-red-50">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                          <span className="font-medium">Pest Attack</span>
                        </div>
                        <div className="text-2xl font-bold text-red-600">30%</div>
                        <div className="text-sm text-gray-600">Probability</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
