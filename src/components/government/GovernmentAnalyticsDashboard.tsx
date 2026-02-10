import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dashboardTheme } from "@/utils/dashboardTheme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Legend,
  ScatterChart,
  Scatter
} from 'recharts';
import { 
  BarChart3, 
  Users, 
  Shield, 
  TrendingUp, 
  TrendingDown, 
  MapPin, 
  AlertTriangle, 
  CheckCircle, 
  DollarSign, 
  Calendar, 
  Filter, 
  Download, 
  RefreshCw, 
  Globe, 
  Eye, 
  Brain, 
  Target, 
  Zap, 
  Activity,
  PieChart,
  LineChart
} from "lucide-react";
import { GovernmentAnalytics } from "@/types/enhanced-api";

interface GovernmentAnalyticsDashboardProps {
  region?: string;
}

export function GovernmentAnalyticsDashboard({ region }: GovernmentAnalyticsDashboardProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState("6months");
  const [selectedRegion, setSelectedRegion] = useState(region || "all");
  const [activeTab, setActiveTab] = useState("overview");

  // Mock data - in real implementation, this would come from API
  const analytics: GovernmentAnalytics = {
    userMetrics: {
      totalFarmers: 15420,
      activeFarmers: 12850,
      newRegistrations: 245,
      verificationPending: 89
    },
    policyMetrics: {
      totalRequests: 8750,
      pendingRequests: 156,
      approvedPolicies: 8234,
      rejectedPolicies: 360,
      activePolicies: 7890,
      policyUptakeRate: 94.1
    },
    geographicDistribution: [
      { region: "Northern Province", farmerCount: 3850, policyCount: 3620, coverageArea: 2450, riskLevel: "low" },
      { region: "Eastern Province", farmerCount: 4200, policyCount: 3950, coverageArea: 3200, riskLevel: "medium" },
      { region: "Southern Province", farmerCount: 3200, policyCount: 2980, coverageArea: 2100, riskLevel: "low" },
      { region: "Western Province", farmerCount: 2800, policyCount: 2650, coverageArea: 1800, riskLevel: "high" },
      { region: "Kigali City", farmerCount: 1370, policyCount: 1290, coverageArea: 450, riskLevel: "low" }
    ],
    riskIntelligence: {
      primaryThreats: [
        { threat: "Weed Infestation", frequency: 65, severity: 7, affectedArea: 1250, economicImpact: 450000000 },
        { threat: "Drought", frequency: 45, severity: 8, affectedArea: 2100, economicImpact: 780000000 },
        { threat: "Pest Attack", frequency: 55, severity: 6, affectedArea: 980, economicImpact: 320000000 },
        { threat: "Disease Outbreak", frequency: 35, severity: 7, affectedArea: 650, economicImpact: 280000000 },
        { threat: "Excess Rainfall", frequency: 40, severity: 6, affectedArea: 890, economicImpact: 210000000 }
      ],
      seasonalPatterns: [
        { season: "Season A", riskLevel: 6.5, commonThreats: ["Drought", "Weed Infestation"], averageLoss: 450000000 },
        { season: "Season B", riskLevel: 7.2, commonThreats: ["Excess Rainfall", "Disease Outbreak"], averageLoss: 520000000 },
        { season: "Season C", riskLevel: 4.8, commonThreats: ["Pest Attack"], averageLoss: 180000000 }
      ]
    },
    claimsAnalytics: {
      totalClaims: 1250,
      processedClaims: 1180,
      pendingClaims: 70,
      validationRate: 94.4,
      averageProcessingTime: 7.2,
      totalPayouts: 2450000000,
      averagePayout: 2076271
    },
    predictiveAnalytics: {
      riskForecast: [
        { timeframe: "Next 30 days", predictedRisk: 65, confidence: 85, recommendations: ["Increase irrigation monitoring", "Prepare pest control measures"] },
        { timeframe: "Next 90 days", predictedRisk: 72, confidence: 78, recommendations: ["Seasonal preparation", "Farmer training on new threats"] },
        { timeframe: "Next 6 months", predictedRisk: 68, confidence: 82, recommendations: ["Policy adjustment recommendations", "Regional risk mitigation strategies"] }
      ],
      seasonalPredictions: [
        { season: "Season A 2024", expectedLoss: 480000000, riskFactors: ["Drought conditions", "Soil degradation"], mitigationStrategies: ["Water conservation", "Drought-resistant crops"] },
        { season: "Season B 2024", expectedLoss: 550000000, riskFactors: ["Heavy rainfall", "Disease outbreaks"], mitigationStrategies: ["Drainage systems", "Disease-resistant varieties"] }
      ]
    }
  };

  const policyTrendData = [
    { month: "Jan", requests: 420, approved: 398, rejected: 22 },
    { month: "Feb", requests: 380, approved: 365, rejected: 15 },
    { month: "Mar", requests: 450, approved: 428, rejected: 22 },
    { month: "Apr", requests: 520, approved: 495, rejected: 25 },
    { month: "May", requests: 480, approved: 456, rejected: 24 },
    { month: "Jun", requests: 410, approved: 389, rejected: 21 }
  ];

  const claimsTrendData = [
    { month: "Jan", claims: 85, payouts: 125000000 },
    { month: "Feb", claims: 92, payouts: 142000000 },
    { month: "Mar", claims: 78, payouts: 118000000 },
    { month: "Apr", claims: 105, payouts: 168000000 },
    { month: "May", claims: 88, payouts: 135000000 },
    { month: "Jun", claims: 95, payouts: 152000000 }
  ];

  const cropDistributionData = [
    { name: "Maize", value: 35, area: 4200 },
    { name: "Rice", value: 25, area: 3000 },
    { name: "Beans", value: 20, area: 2400 },
    { name: "Coffee", value: 15, area: 1800 },
    { name: "Others", value: 5, area: 600 }
  ];

  const riskLevelColors = {
    low: "#10B981",
    medium: "#F59E0B", 
    high: "#EF4444"
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Farmers</p>
                <p className="text-2xl font-bold text-blue-600">{analytics.userMetrics.totalFarmers.toLocaleString()}</p>
                <p className="text-xs text-green-600 mt-1">
                  +{analytics.userMetrics.newRegistrations} new this month
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Policies</p>
                <p className="text-2xl font-bold text-green-600">{analytics.policyMetrics.activePolicies.toLocaleString()}</p>
                <p className="text-xs text-green-600 mt-1">
                  {analytics.policyMetrics.policyUptakeRate}% uptake rate
                </p>
              </div>
              <Shield className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Payouts</p>
                <p className="text-2xl font-bold text-purple-600">
                  RWF {(analytics.claimsAnalytics.totalPayouts / 1000000).toFixed(0)}M
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {analytics.claimsAnalytics.validationRate}% validation rate
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Processing Time</p>
                <p className="text-2xl font-bold text-orange-600">{analytics.claimsAnalytics.averageProcessingTime} days</p>
                <p className="text-xs text-green-600 mt-1">
                  <TrendingDown className="h-3 w-3 inline mr-1" />
                  -2.3 days vs last month
                </p>
              </div>
              <Activity className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <LineChart className="h-5 w-5" />
              <span>Policy Request Trends</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={policyTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="requests" stroke="#3B82F6" strokeWidth={2} name="Requests" />
                <Line type="monotone" dataKey="approved" stroke="#10B981" strokeWidth={2} name="Approved" />
                <Line type="monotone" dataKey="rejected" stroke="#EF4444" strokeWidth={2} name="Rejected" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="h-5 w-5" />
              <span>Crop Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={cropDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {cropDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`hsl(${index * 72}, 70%, 50%)`} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Geographic Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Geographic Distribution</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.geographicDistribution.map((region) => (
              <div key={region.region} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-4 h-4 rounded-full`} style={{ backgroundColor: riskLevelColors[region.riskLevel] }} />
                  <div>
                    <p className="font-medium">{region.region}</p>
                    <p className="text-sm text-gray-600">
                      {region.farmerCount} farmers • {region.coverageArea} hectares
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-medium">{region.policyCount}</p>
                    <p className="text-sm text-gray-600">Policies</p>
                  </div>
                  <Badge variant={
                    region.riskLevel === 'low' ? 'default' : 
                    region.riskLevel === 'medium' ? 'secondary' : 'destructive'
                  }>
                    {region.riskLevel.toUpperCase()} RISK
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderRiskIntelligence = () => (
    <div className="space-y-6">
      {/* Primary Threats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Primary Productivity Threats</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.riskIntelligence.primaryThreats.map((threat, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg">{threat.threat}</h3>
                  <Badge variant={threat.severity >= 7 ? 'destructive' : threat.severity >= 5 ? 'secondary' : 'default'}>
                    Severity: {threat.severity}/10
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <Label className="text-gray-500">Frequency</Label>
                    <p className="font-medium">{threat.frequency}%</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Affected Area</Label>
                    <p className="font-medium">{threat.affectedArea} hectares</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Economic Impact</Label>
                    <p className="font-medium">RWF {(threat.economicImpact / 1000000).toFixed(0)}M</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Risk Level</Label>
                    <Progress value={threat.severity * 10} className="mt-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Seasonal Patterns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Seasonal Risk Patterns</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.riskIntelligence.seasonalPatterns.map((season, index) => (
              <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg">{season.season}</h3>
                  <div className="flex items-center space-x-2">
                    <Progress value={season.riskLevel * 10} className="w-24" />
                    <span className="text-sm font-medium">{season.riskLevel}/10</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Common Threats</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {season.commonThreats.map((threat, idx) => (
                        <Badge key={idx} variant="outline">{threat}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Average Loss</Label>
                    <p className="font-medium">RWF {(season.averageLoss / 1000000).toFixed(0)}M</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderClaimsAnalytics = () => (
    <div className="space-y-6">
      {/* Claims Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Claims</p>
                <p className="text-2xl font-bold text-blue-600">{analytics.claimsAnalytics.totalClaims}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Validation Rate</p>
                <p className="text-2xl font-bold text-green-600">{analytics.claimsAnalytics.validationRate}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Processing Time</p>
                <p className="text-2xl font-bold text-orange-600">{analytics.claimsAnalytics.averageProcessingTime} days</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Payout</p>
                <p className="text-2xl font-bold text-purple-600">
                  RWF {(analytics.claimsAnalytics.averagePayout / 1000).toFixed(0)}K
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Claims Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Claims and Payouts Trend</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={claimsTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="claims" fill="#3B82F6" name="Claims Count" />
              <Bar yAxisId="right" dataKey="payouts" fill="#10B981" name="Payouts (RWF)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Claims by Region */}
      <Card>
        <CardHeader>
          <CardTitle>Claims Distribution by Region</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.geographicDistribution.map((region) => {
              const claimsInRegion = Math.floor(analytics.claimsAnalytics.totalClaims * (region.farmerCount / analytics.userMetrics.totalFarmers));
              const payoutsInRegion = Math.floor(analytics.claimsAnalytics.totalPayouts * (region.farmerCount / analytics.userMetrics.totalFarmers));
              
              return (
                <div key={region.region} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{region.region}</p>
                    <p className="text-sm text-gray-600">{region.farmerCount} farmers</p>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className="font-medium">{claimsInRegion}</p>
                      <p className="text-sm text-gray-600">Claims</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium">RWF {(payoutsInRegion / 1000000).toFixed(0)}M</p>
                      <p className="text-sm text-gray-600">Payouts</p>
                    </div>
                    <Badge variant={
                      region.riskLevel === 'low' ? 'default' : 
                      region.riskLevel === 'medium' ? 'secondary' : 'destructive'
                    }>
                      {region.riskLevel.toUpperCase()} RISK
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPredictiveAnalytics = () => (
    <div className="space-y-6">
      {/* Risk Forecast */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5" />
            <span>AI Risk Forecast</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.predictiveAnalytics.riskForecast.map((forecast, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg">{forecast.timeframe}</h3>
                  <div className="flex items-center space-x-2">
                    <Progress value={forecast.predictedRisk} className="w-32" />
                    <span className="text-sm font-medium">{forecast.predictedRisk}%</span>
                    <Badge variant="outline">{forecast.confidence}% confidence</Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Recommendations</Label>
                  <ul className="mt-2 space-y-1">
                    {forecast.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-center space-x-2 text-sm">
                        <Target className="h-3 w-3 text-blue-500" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Seasonal Predictions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Seasonal Loss Predictions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.predictiveAnalytics.seasonalPredictions.map((prediction, index) => (
              <div key={index} className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg">{prediction.season}</h3>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-red-600">
                      RWF {(prediction.expectedLoss / 1000000).toFixed(0)}M
                    </p>
                    <p className="text-sm text-gray-600">Expected Loss</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Risk Factors</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {prediction.riskFactors.map((factor, idx) => (
                        <Badge key={idx} variant="destructive">{factor}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Mitigation Strategies</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {prediction.mitigationStrategies.map((strategy, idx) => (
                        <Badge key={idx} variant="default">{strategy}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Economic Impact Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>Economic Impact Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">
                RWF {(analytics.claimsAnalytics.totalPayouts / 1000000000).toFixed(1)}B
              </div>
              <div className="text-sm text-gray-600">Total Payouts</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">
                {((analytics.claimsAnalytics.totalPayouts / analytics.policyMetrics.activePolicies) / 1000000).toFixed(1)}M
              </div>
              <div className="text-sm text-gray-600">Avg Payout per Policy</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">
                {((analytics.claimsAnalytics.totalPayouts / analytics.userMetrics.totalFarmers) / 1000).toFixed(0)}K
              </div>
              <div className="text-sm text-gray-600">Avg Payout per Farmer</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Government Analytics Dashboard</h1>
            <p className="text-gray-600">National agricultural insurance insights and policy monitoring</p>
          </div>
          <div className="flex space-x-2">
            <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1month">Last Month</SelectItem>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="1year">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="risk">Risk Intelligence</TabsTrigger>
          <TabsTrigger value="claims">Claims Analytics</TabsTrigger>
          <TabsTrigger value="predictive">Predictive Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          {renderOverview()}
        </TabsContent>

        <TabsContent value="risk" className="mt-6">
          {renderRiskIntelligence()}
        </TabsContent>

        <TabsContent value="claims" className="mt-6">
          {renderClaimsAnalytics()}
        </TabsContent>

        <TabsContent value="predictive" className="mt-6">
          {renderPredictiveAnalytics()}
        </TabsContent>
      </Tabs>
    </div>
  );
}
