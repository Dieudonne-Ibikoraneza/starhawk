import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { dashboardTheme } from "@/utils/dashboardTheme";
import { Download } from "lucide-react";

export function GovLeaderboardPage() {
  const regionsData = [
    { id: "R001", name: "Northern Province", farmers: 1250, registeredFarmers: 1450, policies: 890, activeClaims: 12, totalClaims: 45, coverage: 72.5, totalPremium: 890000000, claimsPaid: 156000000, status: "stable", riskLevel: "low", insurers: 3 },
    { id: "R002", name: "Southern Province", farmers: 2100, registeredFarmers: 2450, policies: 1650, activeClaims: 18, totalClaims: 78, coverage: 78.6, totalPremium: 1650000000, claimsPaid: 312000000, status: "stable", riskLevel: "medium", insurers: 4 },
    { id: "R003", name: "Eastern Province", farmers: 1800, registeredFarmers: 2100, policies: 1200, activeClaims: 25, totalClaims: 92, coverage: 66.7, totalPremium: 1200000000, claimsPaid: 445000000, status: "high-risk", riskLevel: "high", insurers: 3 },
    { id: "R004", name: "Western Province", farmers: 1950, registeredFarmers: 2300, policies: 1420, activeClaims: 15, totalClaims: 65, coverage: 72.8, totalPremium: 1420000000, claimsPaid: 267000000, status: "stable", riskLevel: "medium", insurers: 3 },
    { id: "R005", name: "Kigali City", farmers: 850, registeredFarmers: 1000, policies: 680, activeClaims: 5, totalClaims: 25, coverage: 80.0, totalPremium: 680000000, claimsPaid: 98000000, status: "excellent", riskLevel: "low", insurers: 5 },
  ];

  const farmerDemographics = [
    { category: "Farm Size", ranges: [
      { range: "< 1 hectare", count: 1850, percentage: 23.2 },
      { range: "1-3 hectares", count: 3420, percentage: 43.0 },
      { range: "3-5 hectares", count: 1680, percentage: 21.1 },
      { range: "> 5 hectares", count: 1000, percentage: 12.7 },
    ]},
    { category: "Gender", ranges: [
      { range: "Male", count: 4890, percentage: 61.5 },
      { range: "Female", count: 3060, percentage: 38.5 },
    ]},
    { category: "Age Group", ranges: [
      { range: "18-30", count: 1200, percentage: 15.1 },
      { range: "31-45", count: 3580, percentage: 45.0 },
      { range: "46-60", count: 2450, percentage: 30.8 },
      { range: "> 60", count: 720, percentage: 9.1 },
    ]},
  ];

  return (
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
}
