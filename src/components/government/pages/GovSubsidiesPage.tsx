import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { dashboardTheme } from "@/utils/dashboardTheme";
import {
  DollarSign,
  Building2,
  Users,
  AlertTriangle,
  FileText,
  Download,
} from "lucide-react";

export function GovSubsidiesPage() {
  const financialData = {
    totalPremiums: 4840000000,
    totalClaimsPaid: 1278000000,
    governmentSubsidy: 726000000,
    farmerContribution: 4114000000,
    lossRatio: 26.4,
    expenseRatio: 18.5,
    combinedRatio: 44.9,
  };

  const insurersData = [
    { id: "INS-001", name: "Rwanda Insurance Co.", policies: 2450, claims: 156, claimRatio: 12.5, avgProcessTime: 8.5, premium: 1850000000, paidClaims: 231250000, pendingClaims: 12, compliance: 98.5 },
    { id: "INS-002", name: "SONARWA", policies: 1850, claims: 98, claimRatio: 10.2, avgProcessTime: 7.2, premium: 1450000000, paidClaims: 147900000, pendingClaims: 8, compliance: 99.2 },
    { id: "INS-003", name: "SORAS Insurance", policies: 1340, claims: 87, claimRatio: 14.8, avgProcessTime: 9.1, premium: 980000000, paidClaims: 145040000, pendingClaims: 15, compliance: 96.8 },
    { id: "INS-004", name: "Radiant Insurance", policies: 950, claims: 62, claimRatio: 11.3, avgProcessTime: 8.0, premium: 760000000, paidClaims: 85880000, pendingClaims: 7, compliance: 97.5 },
  ];

  const monthlyTrends = [
    { month: "Jan", policies: 1200, claims: 85, premium: 1800000000, claimsPaid: 156000000, farmers: 7200 },
    { month: "Feb", policies: 1350, claims: 92, premium: 2025000000, claimsPaid: 178000000, farmers: 7450 },
    { month: "Mar", policies: 1480, claims: 78, premium: 2220000000, claimsPaid: 145000000, farmers: 7680 },
    { month: "Apr", policies: 1620, claims: 105, premium: 2430000000, claimsPaid: 198000000, farmers: 7850 },
    { month: "May", policies: 1750, claims: 88, premium: 2625000000, claimsPaid: 167000000, farmers: 7920 },
    { month: "Jun", policies: 1890, claims: 95, premium: 2835000000, claimsPaid: 182000000, farmers: 7950 },
  ];

  const regionsData = [
    { id: "R001", name: "Northern Province", farmers: 1250, registeredFarmers: 1450, policies: 890, activeClaims: 12, totalClaims: 45, coverage: 72.5, totalPremium: 890000000, claimsPaid: 156000000, status: "stable", riskLevel: "low", insurers: 3 },
    { id: "R002", name: "Southern Province", farmers: 2100, registeredFarmers: 2450, policies: 1650, activeClaims: 18, totalClaims: 78, coverage: 78.6, totalPremium: 1650000000, claimsPaid: 312000000, status: "stable", riskLevel: "medium", insurers: 4 },
    { id: "R003", name: "Eastern Province", farmers: 1800, registeredFarmers: 2100, policies: 1200, activeClaims: 25, totalClaims: 92, coverage: 66.7, totalPremium: 1200000000, claimsPaid: 445000000, status: "high-risk", riskLevel: "high", insurers: 3 },
    { id: "R004", name: "Western Province", farmers: 1950, registeredFarmers: 2300, policies: 1420, activeClaims: 15, totalClaims: 65, coverage: 72.8, totalPremium: 1420000000, claimsPaid: 267000000, status: "stable", riskLevel: "medium", insurers: 3 },
    { id: "R005", name: "Kigali City", farmers: 850, registeredFarmers: 1000, policies: 680, activeClaims: 5, totalClaims: 25, coverage: 80.0, totalPremium: 680000000, claimsPaid: 98000000, status: "excellent", riskLevel: "low", insurers: 5 },
  ];

  return (
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
                      <div className="text-xs text-gray-900/60">Administration &amp; assessments</div>
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
}
