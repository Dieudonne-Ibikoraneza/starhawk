import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { dashboardTheme } from "@/utils/dashboardTheme";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Filter,
  Download,
  Eye,
  Map as MapIcon,
} from "lucide-react";

export function GovClaimsPage() {
  const regionsData = [
    { id: "R001", name: "Northern Province", farmers: 1250, registeredFarmers: 1450, policies: 890, activeClaims: 12, totalClaims: 45, coverage: 72.5, totalPremium: 890000000, claimsPaid: 156000000, status: "stable", riskLevel: "low", insurers: 3 },
    { id: "R002", name: "Southern Province", farmers: 2100, registeredFarmers: 2450, policies: 1650, activeClaims: 18, totalClaims: 78, coverage: 78.6, totalPremium: 1650000000, claimsPaid: 312000000, status: "stable", riskLevel: "medium", insurers: 4 },
    { id: "R003", name: "Eastern Province", farmers: 1800, registeredFarmers: 2100, policies: 1200, activeClaims: 25, totalClaims: 92, coverage: 66.7, totalPremium: 1200000000, claimsPaid: 445000000, status: "high-risk", riskLevel: "high", insurers: 3 },
    { id: "R004", name: "Western Province", farmers: 1950, registeredFarmers: 2300, policies: 1420, activeClaims: 15, totalClaims: 65, coverage: 72.8, totalPremium: 1420000000, claimsPaid: 267000000, status: "stable", riskLevel: "medium", insurers: 3 },
    { id: "R005", name: "Kigali City", farmers: 850, registeredFarmers: 1000, policies: 680, activeClaims: 5, totalClaims: 25, coverage: 80.0, totalPremium: 680000000, claimsPaid: 98000000, status: "excellent", riskLevel: "low", insurers: 5 },
  ];

  const monthlyTrends = [
    { month: "Jan", policies: 1200, claims: 85, premium: 1800000000, claimsPaid: 156000000, farmers: 7200 },
    { month: "Feb", policies: 1350, claims: 92, premium: 2025000000, claimsPaid: 178000000, farmers: 7450 },
    { month: "Mar", policies: 1480, claims: 78, premium: 2220000000, claimsPaid: 145000000, farmers: 7680 },
    { month: "Apr", policies: 1620, claims: 105, premium: 2430000000, claimsPaid: 198000000, farmers: 7850 },
    { month: "May", policies: 1750, claims: 88, premium: 2625000000, claimsPaid: 167000000, farmers: 7920 },
    { month: "Jun", policies: 1890, claims: 95, premium: 2835000000, claimsPaid: 182000000, farmers: 7950 },
  ];

  return (
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
                <RechartsTooltip
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
}
