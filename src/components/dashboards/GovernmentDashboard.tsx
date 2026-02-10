import { useState, useEffect } from "react";
import DashboardLayout from "../layout/DashboardLayout";
import { getUserId, getPhoneNumber, getEmail } from "@/services/authAPI";
import { getUserProfile } from "@/services/usersAPI";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { dashboardTheme } from "@/utils/dashboardTheme";
import { 
  BarChart as RechartsBarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  AreaChart,
  Area,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Legend
} from "recharts";
import { 
  BarChart3,
  Users,
  FileText,
  TrendingUp,
  MapPin,
  Shield,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Activity,
  Globe,
  Cloud,
  Satellite,
  Download,
  Filter,
  Search,
  Calendar,
  Building2,
  Wheat,
  Target,
  Bell,
  Settings,
  Map as MapIcon,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Database,
  Lock,
  Eye,
  Zap
} from "lucide-react";

export const GovernmentDashboard = () => {
  const [activePage, setActivePage] = useState("dashboard");
  const governmentId = getUserId() || "GOV-001";
  const governmentEmail = getEmail() || "";
  const governmentPhone = getPhoneNumber() || "";
  const defaultGovernmentName = "Ministry of Agriculture";
  const governmentName = governmentEmail || governmentPhone || defaultGovernmentName;

  // State for Profile
  const [governmentProfile, setGovernmentProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Load profile when dashboard is shown
  useEffect(() => {
    if (activePage === "dashboard" && governmentId) {
      loadGovernmentProfile();
    }
  }, [activePage, governmentId]);

  const loadGovernmentProfile = async () => {
    if (profileLoading) return;
    setProfileLoading(true);
    try {
      const profile = await getUserProfile();
      setGovernmentProfile(profile.data || profile);
    } catch (err: any) {
      console.error('Failed to load government profile:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  // Comprehensive Government Data
  
  // Regional Data
  const regionsData = [
    { id: "R001", name: "Northern Province", farmers: 1250, registeredFarmers: 1450, policies: 890, activeClaims: 12, totalClaims: 45, coverage: 72.5, totalPremium: 890000000, claimsPaid: 156000000, status: "stable", riskLevel: "low", insurers: 3 },
    { id: "R002", name: "Southern Province", farmers: 2100, registeredFarmers: 2450, policies: 1650, activeClaims: 18, totalClaims: 78, coverage: 78.6, totalPremium: 1650000000, claimsPaid: 312000000, status: "stable", riskLevel: "medium", insurers: 4 },
    { id: "R003", name: "Eastern Province", farmers: 1800, registeredFarmers: 2100, policies: 1200, activeClaims: 25, totalClaims: 92, coverage: 66.7, totalPremium: 1200000000, claimsPaid: 445000000, status: "high-risk", riskLevel: "high", insurers: 3 },
    { id: "R004", name: "Western Province", farmers: 1950, registeredFarmers: 2300, policies: 1420, activeClaims: 15, totalClaims: 65, coverage: 72.8, totalPremium: 1420000000, claimsPaid: 267000000, status: "stable", riskLevel: "medium", insurers: 3 },
    { id: "R005", name: "Kigali City", farmers: 850, registeredFarmers: 1000, policies: 680, activeClaims: 5, totalClaims: 25, coverage: 80.0, totalPremium: 680000000, claimsPaid: 98000000, status: "excellent", riskLevel: "low", insurers: 5 }
  ];

  // Crop Insurance Data
  const cropsData = [
    { crop: "Maize", farmers: 3200, hectares: 15600, policies: 2400, claims: 120, avgPremium: 350000, totalPremium: 840000000, claimsPaid: 156000000, coverage: 75.0, yield: 4.2, targetYield: 4.5 },
    { crop: "Rice", farmers: 1800, hectares: 8400, policies: 1350, claims: 85, avgPremium: 420000, totalPremium: 567000000, claimsPaid: 198000000, coverage: 75.0, yield: 5.1, targetYield: 5.3 },
    { crop: "Beans", farmers: 2100, hectares: 9800, policies: 1680, claims: 95, avgPremium: 280000, totalPremium: 470400000, claimsPaid: 142000000, coverage: 80.0, yield: 1.8, targetYield: 2.0 },
    { crop: "Coffee", farmers: 950, hectares: 5200, policies: 760, claims: 35, avgPremium: 650000, totalPremium: 494000000, claimsPaid: 89000000, coverage: 80.0, yield: 1.2, targetYield: 1.4 },
    { crop: "Tea", farmers: 750, hectares: 4100, policies: 600, claims: 28, avgPremium: 580000, totalPremium: 348000000, claimsPaid: 67000000, coverage: 80.0, yield: 2.3, targetYield: 2.5 }
  ];

  // Insurer Performance Data
  const insurersData = [
    { id: "INS-001", name: "Rwanda Insurance Co.", policies: 2450, claims: 156, claimRatio: 12.5, avgProcessTime: 8.5, premium: 1850000000, paidClaims: 231250000, pendingClaims: 12, compliance: 98.5 },
    { id: "INS-002", name: "SONARWA", policies: 1850, claims: 98, claimRatio: 10.2, avgProcessTime: 7.2, premium: 1450000000, paidClaims: 147900000, pendingClaims: 8, compliance: 99.2 },
    { id: "INS-003", name: "SORAS Insurance", policies: 1340, claims: 87, claimRatio: 14.8, avgProcessTime: 9.1, premium: 980000000, paidClaims: 145040000, pendingClaims: 15, compliance: 96.8 },
    { id: "INS-004", name: "Radiant Insurance", policies: 950, claims: 62, claimRatio: 11.3, avgProcessTime: 8.0, premium: 760000000, paidClaims: 85880000, pendingClaims: 7, compliance: 97.5 }
  ];

  // Farmer Demographics
  const farmerDemographics = [
    { category: "Farm Size", ranges: [
      { range: "< 1 hectare", count: 1850, percentage: 23.2 },
      { range: "1-3 hectares", count: 3420, percentage: 43.0 },
      { range: "3-5 hectares", count: 1680, percentage: 21.1 },
      { range: "> 5 hectares", count: 1000, percentage: 12.7 }
    ]},
    { category: "Gender", ranges: [
      { range: "Male", count: 4890, percentage: 61.5 },
      { range: "Female", count: 3060, percentage: 38.5 }
    ]},
    { category: "Age Group", ranges: [
      { range: "18-30", count: 1200, percentage: 15.1 },
      { range: "31-45", count: 3580, percentage: 45.0 },
      { range: "46-60", count: 2450, percentage: 30.8 },
      { range: "> 60", count: 720, percentage: 9.1 }
    ]}
  ];

  // Financial Flow Data
  const financialData = {
    totalPremiums: 4840000000,
    totalClaimsPaid: 1278000000,
    governmentSubsidy: 726000000,
    farmerContribution: 4114000000,
    lossRatio: 26.4,
    expenseRatio: 18.5,
    combinedRatio: 44.9
  };

  // Monthly Trend Data
  const monthlyTrends = [
    { month: "Jan", policies: 1200, claims: 85, premium: 1800000000, claimsPaid: 156000000, farmers: 7200 },
    { month: "Feb", policies: 1350, claims: 92, premium: 2025000000, claimsPaid: 178000000, farmers: 7450 },
    { month: "Mar", policies: 1480, claims: 78, premium: 2220000000, claimsPaid: 145000000, farmers: 7680 },
    { month: "Apr", policies: 1620, claims: 105, premium: 2430000000, claimsPaid: 198000000, farmers: 7850 },
    { month: "May", policies: 1750, claims: 88, premium: 2625000000, claimsPaid: 167000000, farmers: 7920 },
    { month: "Jun", policies: 1890, claims: 95, premium: 2835000000, claimsPaid: 182000000, farmers: 7950 }
  ];

  // Risk Assessment Data
  const riskZones = [
    { zone: "High Risk", districts: 12, farmers: 1850, policies: 1240, claims: 156, mitigation: "Drought-resistant crops, Irrigation" },
    { zone: "Medium Risk", districts: 18, farmers: 3200, policies: 2450, claims: 142, mitigation: "Weather monitoring, Insurance awareness" },
    { zone: "Low Risk", districts: 15, farmers: 2900, policies: 2200, claims: 67, mitigation: "Standard practices" }
  ];

  // Assessor Performance
  const assessorMetrics = [
    { id: "ASS-001", name: "Richard Nkurunziza", region: "Northern", completed: 89, pending: 12, avgTime: 3.2, accuracy: 96.5 },
    { id: "ASS-002", name: "Marie Uwimana", region: "Southern", completed: 124, pending: 8, avgTime: 2.8, accuracy: 98.2 },
    { id: "ASS-003", name: "Paul Kagame", region: "Eastern", completed: 98, pending: 15, avgTime: 3.5, accuracy: 95.8 },
    { id: "ASS-004", name: "Grace Mukamana", region: "Western", completed: 112, pending: 10, avgTime: 3.0, accuracy: 97.1 }
  ];

  // Dashboard Overview
  const renderDashboard = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">National Overview</h1>
        <p className="text-sm text-gray-600 mt-1">Comprehensive view of agricultural insurance system</p>
      </div>
      {/* Header Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className={`${dashboardTheme.card} border-l-4 border-l-blue-500`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-900/80">Total Farmers</CardTitle>
            <Users className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">7,950</div>
            <p className="text-xs text-gray-900/60 mt-1">
              <span className="text-green-500">+245</span> this month
            </p>
          </CardContent>
        </Card>

        <Card className={`${dashboardTheme.card} border-l-4 border-l-green-500`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-900/80">Active Policies</CardTitle>
            <FileText className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">5,900</div>
            <p className="text-xs text-gray-900/60 mt-1">
              74.2% coverage rate
            </p>
          </CardContent>
        </Card>

        <Card className={`${dashboardTheme.card} border-l-4 border-l-purple-500`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-900/80">Total Premiums</CardTitle>
            <DollarSign className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">RWF 4.84B</div>
            <p className="text-xs text-gray-900/60 mt-1">
              <span className="text-green-500">+15.8%</span> YoY growth
            </p>
          </CardContent>
        </Card>

        <Card className={`${dashboardTheme.card} border-l-4 border-l-orange-500`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-900/80">Active Claims</CardTitle>
            <AlertTriangle className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">75</div>
            <p className="text-xs text-gray-900/60 mt-1">
              305 total this year
            </p>
          </CardContent>
        </Card>
      </div>

      {/* National Overview Tabs */}
      <Card className={dashboardTheme.card}>
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <Globe className="h-5 w-5" />
            National Agricultural Insurance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="regions" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-gray-800/50">
              <TabsTrigger value="regions" className="data-[state=active]:bg-indigo-600">
                <MapPin className="h-4 w-4 mr-2" />
                Regional
              </TabsTrigger>
              <TabsTrigger value="crops" className="data-[state=active]:bg-indigo-600">
                <Wheat className="h-4 w-4 mr-2" />
                Crops
              </TabsTrigger>
              <TabsTrigger value="financial" className="data-[state=active]:bg-indigo-600">
                <DollarSign className="h-4 w-4 mr-2" />
                Financial
              </TabsTrigger>
              <TabsTrigger value="trends" className="data-[state=active]:bg-indigo-600">
                <TrendingUp className="h-4 w-4 mr-2" />
                Trends
              </TabsTrigger>
            </TabsList>

            <TabsContent value="regions" className="mt-6 space-y-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={regionsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                      labelStyle={{ color: '#F9FAFB' }}
                    />
                    <Legend />
                    <Bar dataKey="farmers" fill="#3B82F6" name="Farmers" />
                    <Bar dataKey="policies" fill="#10B981" name="Policies" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="crops" className="mt-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={cropsData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ crop, policies }) => `${crop}: ${policies}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="policies"
                    >
                      {cropsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'][index % 5]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                      labelStyle={{ color: '#F9FAFB' }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="financial" className="mt-6">
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-gray-800/50 border-gray-300">
                  <CardHeader>
                    <CardTitle className="text-sm text-gray-900/80">Loss Ratio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">{financialData.lossRatio}%</div>
                    <div className="text-xs text-gray-900/60 mt-1">Claims / Premiums</div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-800/50 border-gray-300">
                  <CardHeader>
                    <CardTitle className="text-sm text-gray-900/80">Gov't Subsidy</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">RWF {(financialData.governmentSubsidy / 1000000).toFixed(0)}M</div>
                    <div className="text-xs text-gray-900/60 mt-1">15% of total premiums</div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-800/50 border-gray-300">
                  <CardHeader>
                    <CardTitle className="text-sm text-gray-900/80">Combined Ratio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">{financialData.combinedRatio}%</div>
                    <div className="text-xs text-green-400 mt-1">Healthy market</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="trends" className="mt-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#9CA3AF" />
                    <YAxis yAxisId="left" stroke="#9CA3AF" />
                    <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                      labelStyle={{ color: '#F9FAFB' }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="policies" fill="#3B82F6" name="Policies" />
                    <Line yAxisId="right" type="monotone" dataKey="farmers" stroke="#10B981" strokeWidth={3} name="Farmers" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Quick Stats Row */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className={dashboardTheme.card}>
          <CardHeader>
            <CardTitle className="text-sm text-gray-900/80 flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-500" />
              Coverage Rate by Region
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {regionsData.map((region) => (
              <div key={region.id} className="flex items-center justify-between">
                <span className="text-sm text-gray-900/80">{region.name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${region.coverage >= 75 ? 'bg-green-500' : region.coverage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${region.coverage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-12">{region.coverage}%</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className={dashboardTheme.card}>
          <CardHeader>
            <CardTitle className="text-sm text-gray-900/80 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Risk Zones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {riskZones.map((zone, idx) => (
              <div key={idx} className="p-3 bg-gray-800/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${
                    zone.zone === 'High Risk' ? 'text-red-400' :
                    zone.zone === 'Medium Risk' ? 'text-yellow-400' :
                    'text-green-400'
                  }`}>{zone.zone}</span>
                  <Badge variant="secondary" className="text-xs">{zone.districts} districts</Badge>
                </div>
                <div className="text-xs text-gray-900/60">{zone.farmers} farmers • {zone.claims} claims</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className={dashboardTheme.card}>
          <CardHeader>
            <CardTitle className="text-sm text-gray-900/80 flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-500" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-900/60">Policy Processing</span>
                <span className="text-green-400">98.5%</span>
              </div>
              <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: '98.5%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-900/60">Claims Processing</span>
                <span className="text-blue-400">94.2%</span>
              </div>
              <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: '94.2%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-900/60">Compliance Rate</span>
                <span className="text-purple-400">97.8%</span>
              </div>
              <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500" style={{ width: '97.8%' }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Farmer Registry Page
  const renderFarmerRegistry = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Farmer Registry</h1>
          <p className="text-sm text-gray-600 mt-1">Complete registry of all farmers in the system</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700">
          <Download className="h-4 w-4 mr-2" />
          Export Registry
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className={dashboardTheme.card}>
          <CardHeader>
            <CardTitle className="text-gray-900">Farmer Distribution by Farm Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {farmerDemographics[0].ranges.map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-900/80">{item.range}</span>
                    <span className="text-gray-900 font-medium">{item.count} ({item.percentage}%)</span>
                  </div>
                  <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500" style={{ width: `${item.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className={dashboardTheme.card}>
          <CardHeader>
            <CardTitle className="text-gray-900">Demographics Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900/80 mb-3">Gender Distribution</h4>
              <div className="space-y-2">
                {farmerDemographics[1].ranges.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="text-gray-900/80">{item.range}</span>
                    <Badge variant="secondary">{item.count} ({item.percentage}%)</Badge>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900/80 mb-3">Age Groups</h4>
              <div className="space-y-2">
                {farmerDemographics[2].ranges.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="text-gray-900/80">{item.range}</span>
                    <Badge variant="secondary">{item.count} ({item.percentage}%)</Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className={dashboardTheme.card}>
        <CardHeader>
          <CardTitle className="text-gray-900">Regional Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-3 px-4 text-gray-900/80 font-medium">Region</th>
                  <th className="text-left py-3 px-4 text-gray-900/80 font-medium">Registered</th>
                  <th className="text-left py-3 px-4 text-gray-900/80 font-medium">With Insurance</th>
                  <th className="text-left py-3 px-4 text-gray-900/80 font-medium">Coverage %</th>
                  <th className="text-left py-3 px-4 text-gray-900/80 font-medium">Total Hectares</th>
                </tr>
              </thead>
              <tbody>
                {regionsData.map((region) => (
                  <tr key={region.id} className="border-b border-gray-200 hover:bg-gray-800/50">
                    <td className="py-3 px-4 text-gray-900">{region.name}</td>
                    <td className="py-3 px-4 text-gray-900">{region.registeredFarmers.toLocaleString()}</td>
                    <td className="py-3 px-4 text-gray-900">{region.farmers.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <Badge className={`${
                        region.coverage >= 75 ? 'bg-green-600' :
                        region.coverage >= 50 ? 'bg-yellow-600' :
                        'bg-red-600'
                      }`}>
                        {region.coverage}%
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-900">{(region.farmers * 2.3).toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Policy Analytics Page
  const renderPolicyAnalytics = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Policy Analytics</h1>
          <p className="text-sm text-gray-600 mt-1">Comprehensive policy data across all insurers</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className={`${dashboardTheme.card} border-l-4 border-l-blue-500`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-900/80">Total Policies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">5,900</div>
            <p className="text-xs text-green-400 mt-1">+8.5% from last month</p>
          </CardContent>
        </Card>
        <Card className={`${dashboardTheme.card} border-l-4 border-l-green-500`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-900/80">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">5,340</div>
            <p className="text-xs text-gray-900/60 mt-1">90.5% of total</p>
          </CardContent>
        </Card>
        <Card className={`${dashboardTheme.card} border-l-4 border-l-yellow-500`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-900/80">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">420</div>
            <p className="text-xs text-gray-900/60 mt-1">7.1% of total</p>
          </CardContent>
        </Card>
        <Card className={`${dashboardTheme.card} border-l-4 border-l-purple-500`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-900/80">Avg Premium</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">RWF 820K</div>
            <p className="text-xs text-green-400 mt-1">+5.2% YoY</p>
          </CardContent>
        </Card>
      </div>

      <Card className={dashboardTheme.card}>
        <CardHeader>
          <CardTitle className="text-gray-900">Policy Distribution by Crop Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={cropsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="crop" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#F9FAFB' }}
                />
                <Legend />
                <Bar dataKey="policies" fill="#3B82F6" name="Policies" />
                <Bar dataKey="farmers" fill="#10B981" name="Farmers" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className={dashboardTheme.card}>
        <CardHeader>
          <CardTitle className="text-gray-900">Detailed Crop Insurance Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-3 px-4 text-gray-900/80 font-medium">Crop</th>
                  <th className="text-left py-3 px-4 text-gray-900/80 font-medium">Farmers</th>
                  <th className="text-left py-3 px-4 text-gray-900/80 font-medium">Policies</th>
                  <th className="text-left py-3 px-4 text-gray-900/80 font-medium">Coverage %</th>
                  <th className="text-left py-3 px-4 text-gray-900/80 font-medium">Total Premium</th>
                  <th className="text-left py-3 px-4 text-gray-900/80 font-medium">Claims Paid</th>
                  <th className="text-left py-3 px-4 text-gray-900/80 font-medium">Loss Ratio</th>
                </tr>
              </thead>
              <tbody>
                {cropsData.map((crop, idx) => (
                  <tr key={idx} className="border-b border-gray-200 hover:bg-gray-800/50">
                    <td className="py-3 px-4 text-gray-900 font-medium">{crop.crop}</td>
                    <td className="py-3 px-4 text-gray-900">{crop.farmers.toLocaleString()}</td>
                    <td className="py-3 px-4 text-gray-900">{crop.policies.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <Badge className="bg-indigo-600">{crop.coverage}%</Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-900">RWF {(crop.totalPremium / 1000000).toFixed(0)}M</td>
                    <td className="py-3 px-4 text-gray-900">RWF {(crop.claimsPaid / 1000000).toFixed(0)}M</td>
                    <td className="py-3 px-4">
                      <Badge className={`${
                        ((crop.claimsPaid / crop.totalPremium) * 100) < 30 ? 'bg-green-600' :
                        ((crop.claimsPaid / crop.totalPremium) * 100) < 50 ? 'bg-yellow-600' :
                        'bg-red-600'
                      }`}>
                        {((crop.claimsPaid / crop.totalPremium) * 100).toFixed(1)}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Claims Monitoring Page
  const renderClaimsMonitoring = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Claims Monitoring</h1>
          <p className="text-sm text-gray-600 mt-1">Track all claims and detect fraud patterns</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-gray-300 text-gray-900 hover:bg-gray-800">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className={`${dashboardTheme.card} border-l-4 border-l-orange-500`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-900/80">Total Claims</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">305</div>
            <p className="text-xs text-gray-900/60 mt-1">This year</p>
          </CardContent>
        </Card>
        <Card className={`${dashboardTheme.card} border-l-4 border-l-yellow-500`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-900/80">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">75</div>
            <p className="text-xs text-gray-900/60 mt-1">Under review</p>
          </CardContent>
        </Card>
        <Card className={`${dashboardTheme.card} border-l-4 border-l-green-500`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-900/80">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">198</div>
            <p className="text-xs text-gray-900/60 mt-1">64.9% approval rate</p>
          </CardContent>
        </Card>
        <Card className={`${dashboardTheme.card} border-l-4 border-l-red-500`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-900/80">Flagged</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">8</div>
            <p className="text-xs text-red-400 mt-1">Potential fraud</p>
          </CardContent>
        </Card>
      </div>

      <Card className={dashboardTheme.card}>
        <CardHeader>
          <CardTitle className="text-gray-900">Claims Trend Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrends}>
                <defs>
                  <linearGradient id="colorClaims" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#F9FAFB' }}
                />
                <Area type="monotone" dataKey="claims" stroke="#F59E0B" fillOpacity={1} fill="url(#colorClaims)" name="Claims Filed" />
                <Area type="monotone" dataKey="claimsPaid" stroke="#10B981" fillOpacity={1} fill="url(#colorPaid)" name="Claims Paid (RWF)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className={dashboardTheme.card}>
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <MapIcon className="h-5 w-5" />
              Claims by Region
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {regionsData.map((region) => (
                <div key={region.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{region.name}</div>
                    <div className="text-xs text-gray-900/60">
                      {region.activeClaims} active • {region.totalClaims} total
                    </div>
                  </div>
                  <Badge className={`${
                    region.riskLevel === 'high' ? 'bg-red-600' :
                    region.riskLevel === 'medium' ? 'bg-yellow-600' :
                    'bg-green-600'
                  }`}>
                    {region.riskLevel}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className={dashboardTheme.card}>
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Fraud Detection Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-red-400">High Priority</span>
                  <Badge variant="destructive">3 Cases</Badge>
                </div>
                <p className="text-xs text-gray-900/60">Multiple claims from same location</p>
              </div>
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-yellow-400">Medium Priority</span>
                  <Badge className="bg-yellow-600">5 Cases</Badge>
                </div>
                <p className="text-xs text-gray-900/60">Unusual claim patterns detected</p>
              </div>
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-400">Under Review</span>
                  <Badge className="bg-blue-600">12 Cases</Badge>
                </div>
                <p className="text-xs text-gray-900/60">Pending assessor verification</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Insurer Performance Page
  const renderInsurerPerformance = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Insurer Performance</h1>
          <p className="text-sm text-gray-600 mt-1">Monitor all insurance companies' performance</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700">
          <Download className="h-4 w-4 mr-2" />
          Compliance Report
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className={`${dashboardTheme.card} border-l-4 border-l-blue-500`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-900/80">Active Insurers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">4</div>
            <p className="text-xs text-gray-900/60 mt-1">All licensed</p>
          </CardContent>
        </Card>
        <Card className={`${dashboardTheme.card} border-l-4 border-l-green-500`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-900/80">Avg Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">98.0%</div>
            <p className="text-xs text-green-400 mt-1">Excellent</p>
          </CardContent>
        </Card>
        <Card className={`${dashboardTheme.card} border-l-4 border-l-purple-500`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-900/80">Avg Process Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">8.2 days</div>
            <p className="text-xs text-gray-900/60 mt-1">Claims processing</p>
          </CardContent>
        </Card>
        <Card className={`${dashboardTheme.card} border-l-4 border-l-orange-500`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-900/80">Market Share</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">Balanced</div>
            <p className="text-xs text-gray-900/60 mt-1">Healthy competition</p>
          </CardContent>
        </Card>
      </div>

      <Card className={dashboardTheme.card}>
        <CardHeader>
          <CardTitle className="text-gray-900">Insurer Performance Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-3 px-4 text-gray-900/80 font-medium">Insurer</th>
                  <th className="text-left py-3 px-4 text-gray-900/80 font-medium">Policies</th>
                  <th className="text-left py-3 px-4 text-gray-900/80 font-medium">Total Premium</th>
                  <th className="text-left py-3 px-4 text-gray-900/80 font-medium">Claims</th>
                  <th className="text-left py-3 px-4 text-gray-900/80 font-medium">Claim Ratio</th>
                  <th className="text-left py-3 px-4 text-gray-900/80 font-medium">Avg Process Time</th>
                  <th className="text-left py-3 px-4 text-gray-900/80 font-medium">Compliance</th>
                </tr>
              </thead>
              <tbody>
                {insurersData.map((insurer) => (
                  <tr key={insurer.id} className="border-b border-gray-200 hover:bg-gray-800/50">
                    <td className="py-3 px-4 text-gray-900 font-medium">{insurer.name}</td>
                    <td className="py-3 px-4 text-gray-900">{insurer.policies.toLocaleString()}</td>
                    <td className="py-3 px-4 text-gray-900">RWF {(insurer.premium / 1000000).toFixed(0)}M</td>
                    <td className="py-3 px-4 text-gray-900">{insurer.claims}</td>
                    <td className="py-3 px-4">
                      <Badge className={`${
                        insurer.claimRatio < 15 ? 'bg-green-600' :
                        insurer.claimRatio < 25 ? 'bg-yellow-600' :
                        'bg-red-600'
                      }`}>
                        {insurer.claimRatio}%
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-900">{insurer.avgProcessTime} days</td>
                    <td className="py-3 px-4">
                      <Badge className={`${
                        insurer.compliance >= 98 ? 'bg-green-600' :
                        insurer.compliance >= 95 ? 'bg-yellow-600' :
                        'bg-red-600'
                      }`}>
                        {insurer.compliance}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className={dashboardTheme.card}>
          <CardHeader>
            <CardTitle className="text-gray-900">Market Share by Policies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={insurersData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, policies }) => `${name.split(' ')[0]}: ${policies}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="policies"
                  >
                    {insurersData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'][index % 4]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#F9FAFB' }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className={dashboardTheme.card}>
          <CardHeader>
            <CardTitle className="text-gray-900">Compliance Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {insurersData.map((insurer) => (
              <div key={insurer.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-900/80">{insurer.name}</span>
                  <span className={`font-medium ${
                    insurer.compliance >= 98 ? 'text-green-400' :
                    insurer.compliance >= 95 ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {insurer.compliance}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      insurer.compliance >= 98 ? 'bg-green-500' :
                      insurer.compliance >= 95 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${insurer.compliance}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Assessor Performance Page
  const renderAssessorPerformance = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Assessor Performance</h1>
        <p className="text-sm text-gray-600 mt-1">Track field assessor productivity and quality</p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className={`${dashboardTheme.card} border-l-4 border-l-blue-500`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-900/80">Active Assessors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">24</div>
            <p className="text-xs text-gray-900/60 mt-1">Nationwide</p>
          </CardContent>
        </Card>
        <Card className={`${dashboardTheme.card} border-l-4 border-l-green-500`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-900/80">Avg Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">96.9%</div>
            <p className="text-xs text-green-400 mt-1">High quality</p>
          </CardContent>
        </Card>
        <Card className={`${dashboardTheme.card} border-l-4 border-l-purple-500`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-900/80">Avg Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">3.1 days</div>
            <p className="text-xs text-gray-900/60 mt-1">Per assessment</p>
          </CardContent>
        </Card>
        <Card className={`${dashboardTheme.card} border-l-4 border-l-orange-500`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-900/80">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">423</div>
            <p className="text-xs text-gray-900/60 mt-1">Completed</p>
          </CardContent>
        </Card>
      </div>

      <Card className={dashboardTheme.card}>
        <CardHeader>
          <CardTitle className="text-gray-900">Assessor Performance Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-3 px-4 text-gray-900/80 font-medium">Assessor</th>
                  <th className="text-left py-3 px-4 text-gray-900/80 font-medium">Region</th>
                  <th className="text-left py-3 px-4 text-gray-900/80 font-medium">Completed</th>
                  <th className="text-left py-3 px-4 text-gray-900/80 font-medium">Pending</th>
                  <th className="text-left py-3 px-4 text-gray-900/80 font-medium">Avg Time (days)</th>
                  <th className="text-left py-3 px-4 text-gray-900/80 font-medium">Accuracy</th>
                  <th className="text-left py-3 px-4 text-gray-900/80 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {assessorMetrics.map((assessor) => (
                  <tr key={assessor.id} className="border-b border-gray-200 hover:bg-gray-800/50">
                    <td className="py-3 px-4 text-gray-900 font-medium">{assessor.name}</td>
                    <td className="py-3 px-4 text-gray-900">{assessor.region}</td>
                    <td className="py-3 px-4 text-gray-900">{assessor.completed}</td>
                    <td className="py-3 px-4 text-gray-900">{assessor.pending}</td>
                    <td className="py-3 px-4 text-gray-900">{assessor.avgTime}</td>
                    <td className="py-3 px-4">
                      <Badge className={`${
                        assessor.accuracy >= 97 ? 'bg-green-600' :
                        assessor.accuracy >= 95 ? 'bg-yellow-600' :
                        'bg-red-600'
                      }`}>
                        {assessor.accuracy}%
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className="bg-green-600">Active</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Risk & Weather Page
  const renderRiskWeather = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Risk & Weather</h1>
          <p className="text-sm text-gray-600 mt-1">Climate risk analysis and weather forecasting</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-gray-300 text-gray-900 hover:bg-gray-800">
            <Satellite className="h-4 w-4 mr-2" />
            Satellite View
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Download className="h-4 w-4 mr-2" />
            Weather Report
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className={`${dashboardTheme.card} border-l-4 border-l-blue-500`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-900/80">Drought Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">Medium</div>
            <p className="text-xs text-gray-900/60 mt-1">3 provinces affected</p>
          </CardContent>
        </Card>
        <Card className={`${dashboardTheme.card} border-l-4 border-l-green-500`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-900/80">Flood Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">Low</div>
            <p className="text-xs text-gray-900/60 mt-1">Rainy season prep</p>
          </CardContent>
        </Card>
        <Card className={`${dashboardTheme.card} border-l-4 border-l-orange-500`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-900/80">Pest Alert</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-400">2 Active</div>
            <p className="text-xs text-gray-900/60 mt-1">Fall armyworm detected</p>
          </CardContent>
        </Card>
        <Card className={`${dashboardTheme.card} border-l-4 border-l-purple-500`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-900/80">Weather Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">5</div>
            <p className="text-xs text-gray-900/60 mt-1">Active warnings</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className={dashboardTheme.card}>
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              7-Day Weather Forecast
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { day: "Monday", temp: "24°C", condition: "Sunny", rainfall: "0mm", risk: "low" },
                { day: "Tuesday", temp: "23°C", condition: "Partly Cloudy", rainfall: "2mm", risk: "low" },
                { day: "Wednesday", temp: "22°C", condition: "Rainy", rainfall: "15mm", risk: "medium" },
                { day: "Thursday", temp: "21°C", condition: "Rainy", rainfall: "25mm", risk: "medium" },
                { day: "Friday", temp: "23°C", condition: "Cloudy", rainfall: "5mm", risk: "low" },
                { day: "Saturday", temp: "25°C", condition: "Sunny", rainfall: "0mm", risk: "low" },
                { day: "Sunday", temp: "26°C", condition: "Sunny", rainfall: "0mm", risk: "low" }
              ].map((forecast, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12">
                      <div className="text-sm font-medium text-gray-900">{forecast.day}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Cloud className={`h-5 w-5 ${
                        forecast.condition === 'Sunny' ? 'text-yellow-400' :
                        forecast.condition === 'Rainy' ? 'text-blue-400' :
                        'text-gray-400'
                      }`} />
                      <span className="text-sm text-gray-900/80">{forecast.condition}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-900">{forecast.temp}</span>
                    <span className="text-sm text-blue-400">{forecast.rainfall}</span>
                    <Badge className={`${
                      forecast.risk === 'low' ? 'bg-green-600' :
                      forecast.risk === 'medium' ? 'bg-yellow-600' :
                      'bg-red-600'
                    }`}>
                      {forecast.risk}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className={dashboardTheme.card}>
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Climate Risk Zones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {riskZones.map((zone, idx) => (
                <div key={idx} className="p-4 bg-gray-800/50 rounded-lg border-l-4" style={{
                  borderColor: zone.zone === 'High Risk' ? '#EF4444' :
                              zone.zone === 'Medium Risk' ? '#F59E0B' : '#10B981'
                }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-bold ${
                      zone.zone === 'High Risk' ? 'text-red-400' :
                      zone.zone === 'Medium Risk' ? 'text-yellow-400' :
                      'text-green-400'
                    }`}>{zone.zone}</span>
                    <Badge variant="secondary">{zone.districts} districts</Badge>
                  </div>
                  <div className="text-xs text-gray-900/60 mb-2">
                    {zone.farmers} farmers • {zone.policies} policies
                  </div>
                  <div className="text-xs text-gray-900/80">
                    <span className="font-medium">Mitigation:</span> {zone.mitigation}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className={dashboardTheme.card}>
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <Satellite className="h-5 w-5" />
            Satellite-Based Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900/80">Vegetation Health (NDVI)</h4>
              <div className="space-y-2">
                {regionsData.map((region) => (
                  <div key={region.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-900/70">{region.name}</span>
                      <span className={`font-medium ${
                        region.coverage >= 75 ? 'text-green-400' :
                        region.coverage >= 50 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {region.coverage >= 75 ? 'Healthy' : region.coverage >= 50 ? 'Fair' : 'Poor'}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${
                          region.coverage >= 75 ? 'bg-green-500' :
                          region.coverage >= 50 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${region.coverage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900/80">Soil Moisture Index</h4>
              <div className="space-y-2">
                {regionsData.map((region) => (
                  <div key={region.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-900/70">{region.name}</span>
                      <span className="font-medium text-blue-400">
                        {Math.floor(Math.random() * 40 + 40)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500"
                        style={{ width: `${Math.floor(Math.random() * 40 + 40)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900/80">Temperature Stress</h4>
              <div className="space-y-2">
                {regionsData.map((region) => (
                  <div key={region.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-900/70">{region.name}</span>
                      <span className={`font-medium ${
                        region.riskLevel === 'high' ? 'text-red-400' :
                        region.riskLevel === 'medium' ? 'text-yellow-400' :
                        'text-green-400'
                      }`}>
                        {region.riskLevel}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${
                          region.riskLevel === 'high' ? 'bg-red-500' :
                          region.riskLevel === 'medium' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${
                          region.riskLevel === 'high' ? 75 :
                          region.riskLevel === 'medium' ? 50 : 25
                        }%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Financial Flows Page
  const renderFinancialFlows = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Flows</h1>
          <p className="text-sm text-gray-600 mt-1">Track all financial transactions and government subsidies</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700">
          <Download className="h-4 w-4 mr-2" />
          Financial Report
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className={`${dashboardTheme.card} border-l-4 border-l-green-500`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-900/80">Total Premiums</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">RWF 4.84B</div>
            <p className="text-xs text-green-400 mt-1">+15.8% YoY</p>
          </CardContent>
        </Card>
        <Card className={`${dashboardTheme.card} border-l-4 border-l-blue-500`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-900/80">Gov't Subsidy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">RWF 726M</div>
            <p className="text-xs text-gray-900/60 mt-1">15% of premiums</p>
          </CardContent>
        </Card>
        <Card className={`${dashboardTheme.card} border-l-4 border-l-purple-500`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-900/80">Claims Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">RWF 1.28B</div>
            <p className="text-xs text-gray-900/60 mt-1">26.4% loss ratio</p>
          </CardContent>
        </Card>
        <Card className={`${dashboardTheme.card} border-l-4 border-l-orange-500`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-900/80">Farmer Share</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">RWF 4.11B</div>
            <p className="text-xs text-gray-900/60 mt-1">85% of premiums</p>
          </CardContent>
        </Card>
      </div>

      <Card className={dashboardTheme.card}>
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Financial Flow Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900/80 mb-4">Premium Collection Flow</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">Total Premium Collection</div>
                      <div className="text-xs text-gray-900/60">From all farmers nationwide</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">RWF 4.84B</div>
                    <div className="text-xs text-green-400">100%</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg ml-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">Government Subsidy</div>
                      <div className="text-xs text-gray-900/60">Public support for farmers</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">RWF 726M</div>
                    <div className="text-xs text-blue-400">15%</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg ml-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">Farmer Contribution</div>
                      <div className="text-xs text-gray-900/60">Direct farmer payments</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">RWF 4.11B</div>
                    <div className="text-xs text-purple-400">85%</div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900/80 mb-4">Claims Payment Flow</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-orange-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">Total Claims Paid</div>
                      <div className="text-xs text-gray-900/60">To affected farmers</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">RWF 1.28B</div>
                    <div className="text-xs text-orange-400">26.4% of premiums</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg ml-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                      <FileText className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">Operating Expenses</div>
                      <div className="text-xs text-gray-900/60">Administration & assessments</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">RWF 895M</div>
                    <div className="text-xs text-yellow-400">18.5% expense ratio</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className={dashboardTheme.card}>
          <CardHeader>
            <CardTitle className="text-gray-900">Subsidy Distribution by Region</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {regionsData.map((region) => {
                const subsidy = region.totalPremium * 0.15;
                return (
                  <div key={region.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{region.name}</div>
                      <div className="text-xs text-gray-900/60">{region.policies} policies</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-900">
                        RWF {(subsidy / 1000000).toFixed(1)}M
                      </div>
                      <div className="text-xs text-blue-400">15% subsidy</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className={dashboardTheme.card}>
          <CardHeader>
            <CardTitle className="text-gray-900">Financial Health Indicators</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-900/80">Loss Ratio</span>
                <span className="font-medium text-green-400">26.4%</span>
              </div>
              <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: '26.4%' }} />
              </div>
              <p className="text-xs text-gray-900/60 mt-1">Healthy - Below 40% threshold</p>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-900/80">Expense Ratio</span>
                <span className="font-medium text-blue-400">18.5%</span>
              </div>
              <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: '18.5%' }} />
              </div>
              <p className="text-xs text-gray-900/60 mt-1">Efficient - Below 25% threshold</p>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-900/80">Combined Ratio</span>
                <span className="font-medium text-purple-400">44.9%</span>
              </div>
              <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500" style={{ width: '44.9%' }} />
              </div>
              <p className="text-xs text-gray-900/60 mt-1">Excellent - Well below 100%</p>
            </div>
            <div className="pt-4 border-t border-gray-300">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-900/80">Market Sustainability</span>
                <Badge className="bg-green-600">Excellent</Badge>
              </div>
              <p className="text-xs text-gray-900/60 mt-1">
                Combined ratio under 50% indicates strong financial health
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Notifications Page
  const renderNotifications = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-600 mt-1">Important updates and system alerts</p>
        </div>
        <Button variant="outline" className="border-gray-300 text-gray-900 hover:bg-gray-800">
          <CheckCircle className="h-4 w-4 mr-2" />
          Mark All Read
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className={`${dashboardTheme.card} border-l-4 border-l-red-500`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-900/80">Critical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">3</div>
            <p className="text-xs text-gray-900/60 mt-1">Urgent attention</p>
          </CardContent>
        </Card>
        <Card className={`${dashboardTheme.card} border-l-4 border-l-yellow-500`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-900/80">Warning</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">8</div>
            <p className="text-xs text-gray-900/60 mt-1">Review soon</p>
          </CardContent>
        </Card>
        <Card className={`${dashboardTheme.card} border-l-4 border-l-blue-500`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-900/80">Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">15</div>
            <p className="text-xs text-gray-900/60 mt-1">General updates</p>
          </CardContent>
        </Card>
        <Card className={`${dashboardTheme.card} border-l-4 border-l-green-500`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-900/80">Success</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">22</div>
            <p className="text-xs text-gray-900/60 mt-1">Completed actions</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {[
          { type: 'critical', title: 'Fraud Alert: High-value claim flagged', message: 'Claim CLM-2845 in Eastern Province requires immediate review - potential fraud pattern detected', time: '5 min ago', region: 'Eastern Province' },
          { type: 'critical', title: 'Compliance Issue: Insurer license expiring', message: 'SORAS Insurance license expires in 15 days - renewal required', time: '1 hour ago', region: 'National' },
          { type: 'critical', title: 'Weather Alert: Severe drought warning', message: 'Drought conditions worsening in Northern Province - immediate action needed', time: '2 hours ago', region: 'Northern Province' },
          { type: 'warning', title: 'Low coverage rate in Western Province', message: 'Coverage rate dropped to 68% - below national target of 70%', time: '3 hours ago', region: 'Western Province' },
          { type: 'warning', title: 'Assessor performance declining', message: 'Assessor ASS-045 completion rate dropped by 15% this month', time: '5 hours ago', region: 'Southern Province' },
          { type: 'info', title: 'Monthly report available', message: 'Agricultural insurance report for March 2024 is now available for download', time: '1 day ago', region: 'National' },
          { type: 'info', title: 'New farmers registered', message: '245 new farmers registered this month across all provinces', time: '1 day ago', region: 'National' },
          { type: 'success', title: 'Subsidy disbursement complete', message: 'Q1 2024 government subsidies successfully distributed to all insurers', time: '2 days ago', region: 'National' },
          { type: 'success', title: 'Claims processing target met', message: '95% of claims processed within 10-day target period', time: '2 days ago', region: 'National' }
        ].map((notification, idx) => (
          <Card key={idx} className={`${dashboardTheme.card} border-l-4 ${
            notification.type === 'critical' ? 'border-l-red-500' :
            notification.type === 'warning' ? 'border-l-yellow-500' :
            notification.type === 'info' ? 'border-l-blue-500' :
            'border-l-green-500'
          }`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={`${
                      notification.type === 'critical' ? 'bg-red-600' :
                      notification.type === 'warning' ? 'bg-yellow-600' :
                      notification.type === 'info' ? 'bg-blue-600' :
                      'bg-green-600'
                    }`}>
                      {notification.type.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-gray-900/60">{notification.time}</span>
                    <Badge variant="outline" className="text-xs border-gray-600">
                      {notification.region}
                    </Badge>
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">{notification.title}</h4>
                  <p className="text-xs text-gray-900/70">{notification.message}</p>
                </div>
                <Button variant="ghost" size="sm" className="text-gray-900/60 hover:text-gray-900">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  // Settings Page
  const renderSettings = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-600 mt-1">Configure your preferences and system settings</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className={dashboardTheme.card}>
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-gray-900/80 block mb-2">Organization</label>
              <div className="p-3 bg-gray-800/50 rounded-lg text-gray-900">
                {governmentName}
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-900/80 block mb-2">User ID</label>
              <div className="p-3 bg-gray-800/50 rounded-lg text-gray-900">
                {governmentId}
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-900/80 block mb-2">Access Level</label>
              <Badge className="bg-indigo-600">Full Government Access</Badge>
            </div>
            <div>
              <label className="text-sm text-gray-900/80 block mb-2">Last Login</label>
              <div className="p-3 bg-gray-800/50 rounded-lg text-gray-900/70 text-sm">
                March 15, 2024 at 09:23 AM
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={dashboardTheme.card}>
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Critical Alerts', description: 'Fraud detection, compliance issues', enabled: true },
              { label: 'Weather Warnings', description: 'Severe weather and climate risks', enabled: true },
              { label: 'Performance Reports', description: 'Weekly and monthly reports', enabled: true },
              { label: 'System Updates', description: 'Platform updates and maintenance', enabled: false }
            ].map((pref, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-gray-900">{pref.label}</div>
                  <div className="text-xs text-gray-900/60">{pref.description}</div>
                </div>
                <div className={`w-12 h-6 rounded-full ${pref.enabled ? 'bg-indigo-600' : 'bg-gray-600'} relative cursor-pointer`}>
                  <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-all ${pref.enabled ? 'right-0.5' : 'left-0.5'}`} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className={dashboardTheme.card}>
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Export Format', value: 'Excel (.xlsx)' },
              { label: 'Date Range', value: 'Last 6 months' },
              { label: 'Include Charts', value: 'Yes' },
              { label: 'Include Raw Data', value: 'Yes' }
            ].map((setting, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <span className="text-sm text-gray-900/80">{setting.label}</span>
                <span className="text-sm font-medium text-gray-900">{setting.value}</span>
              </div>
            ))}
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 mt-4">
              Update Export Settings
            </Button>
          </CardContent>
        </Card>

        <Card className={dashboardTheme.card}>
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Security Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <div>
                <div className="text-sm font-medium text-gray-900">Two-Factor Authentication</div>
                <div className="text-xs text-gray-900/60">Enhanced security</div>
              </div>
              <Badge className="bg-green-600">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <div>
                <div className="text-sm font-medium text-gray-900">Session Timeout</div>
                <div className="text-xs text-gray-900/60">Auto-logout after inactivity</div>
              </div>
              <span className="text-sm font-medium text-gray-900">30 minutes</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <div>
                <div className="text-sm font-medium text-gray-900">IP Whitelisting</div>
                <div className="text-xs text-gray-900/60">Restricted access</div>
              </div>
              <Badge className="bg-blue-600">Active</Badge>
            </div>
            <Button variant="outline" className="w-full border-gray-300 text-gray-900 hover:bg-gray-800 mt-4">
              Change Password
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className={dashboardTheme.card}>
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Access & Permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { module: 'Farmer Registry', access: 'Full Access', permissions: ['View', 'Export', 'Analyze'] },
              { module: 'Policy Data', access: 'Full Access', permissions: ['View', 'Export', 'Analyze'] },
              { module: 'Claims Data', access: 'Full Access', permissions: ['View', 'Export', 'Monitor'] },
              { module: 'Financial Data', access: 'Full Access', permissions: ['View', 'Export', 'Audit'] },
              { module: 'Insurer Performance', access: 'Full Access', permissions: ['View', 'Export', 'Monitor'] },
              { module: 'Satellite & Weather', access: 'Full Access', permissions: ['View', 'Export', 'Analyze'] }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-gray-900">{item.module}</div>
                  <div className="flex gap-2 mt-1">
                    {item.permissions.map((perm, pIdx) => (
                      <Badge key={pIdx} variant="outline" className="text-xs border-gray-600">
                        {perm}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Badge className="bg-indigo-600">{item.access}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render page based on active selection
  const renderPage = () => {
    switch (activePage) {
      case "dashboard": return renderDashboard();
      case "farmer-registry": return renderFarmerRegistry();
      case "policy-analytics": return renderPolicyAnalytics();
      case "claims-monitoring": return renderClaimsMonitoring();
      case "insurer-performance": return renderInsurerPerformance();
      case "assessor-performance": return renderAssessorPerformance();
      case "risk-weather": return renderRiskWeather();
      case "financial-flows": return renderFinancialFlows();
      case "notifications": return renderNotifications();
      case "settings": return renderSettings();
      default: return renderDashboard();
    }
  };

  const navigationItems = [
    { id: "dashboard", label: "National Overview", icon: Globe },
    { id: "farmer-registry", label: "Farmer Registry", icon: Users },
    { id: "policy-analytics", label: "Policy Analytics", icon: FileText },
    { id: "claims-monitoring", label: "Claims Monitoring", icon: AlertTriangle },
    { id: "insurer-performance", label: "Insurer Performance", icon: Building2 },
    { id: "assessor-performance", label: "Assessor Performance", icon: Shield },
    { id: "risk-weather", label: "Risk & Weather", icon: Cloud },
    { id: "satellite-data", label: "Satellite Data", icon: Satellite },
    { id: "financial-flows", label: "Financial Flows", icon: DollarSign },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "settings", label: "Settings", icon: Settings }
  ];

  // Get display name from profile if available
  const displayName = governmentProfile 
    ? (governmentProfile.firstName && governmentProfile.lastName 
        ? `${governmentProfile.firstName} ${governmentProfile.lastName}`.trim()
        : governmentProfile.name || governmentProfile.firstName || governmentProfile.lastName || governmentName)
    : governmentName;

  return (
    <DashboardLayout
      userType="government"
      userId={governmentId}
      userName={displayName}
      navigationItems={navigationItems}
      activePage={activePage}
      onPageChange={setActivePage}
      onLogout={() => {}}
    >
      {renderPage()}
    </DashboardLayout>
  );
};
