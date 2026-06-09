import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { dashboardTheme } from "@/utils/dashboardTheme";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Download } from "lucide-react";

export function GovPoliciesPage() {
  const cropsData = [
    { crop: "Maize", farmers: 3200, hectares: 15600, policies: 2400, claims: 120, avgPremium: 350000, totalPremium: 840000000, claimsPaid: 156000000, coverage: 75.0, yield: 4.2, targetYield: 4.5 },
    { crop: "Rice", farmers: 1800, hectares: 8400, policies: 1350, claims: 85, avgPremium: 420000, totalPremium: 567000000, claimsPaid: 198000000, coverage: 75.0, yield: 5.1, targetYield: 5.3 },
    { crop: "Beans", farmers: 2100, hectares: 9800, policies: 1680, claims: 95, avgPremium: 280000, totalPremium: 470400000, claimsPaid: 142000000, coverage: 80.0, yield: 1.8, targetYield: 2.0 },
    { crop: "Coffee", farmers: 950, hectares: 5200, policies: 760, claims: 35, avgPremium: 650000, totalPremium: 494000000, claimsPaid: 89000000, coverage: 80.0, yield: 1.2, targetYield: 1.4 },
    { crop: "Tea", farmers: 750, hectares: 4100, policies: 600, claims: 28, avgPremium: 580000, totalPremium: 348000000, claimsPaid: 67000000, coverage: 80.0, yield: 2.3, targetYield: 2.5 },
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
                <RechartsTooltip
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
}
