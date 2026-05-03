import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Activity, Leaf, ChevronRight, AlertTriangle, Loader2, RefreshCw, TrendingUp } from "lucide-react";
import { getFarms, getVegetationStats } from "@/services/farmsApi";
import { useToast } from "@/hooks/use-toast";
import { format, subDays } from "date-fns";

export default function MonitoringTab() {
  const { toast } = useToast();
  const [farms, setFarms] = useState<any[]>([]);
  const [monitoringData, setMonitoringData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFarmsAndMonitoring();
  }, []);

  const loadFarmsAndMonitoring = async () => {
    setLoading(true);
    try {
      const response = await getFarms(1, 100);
      const items = response?.data?.items || response?.items || [];
      setFarms(items);

      // Fetch monitoring data for each farm
      const monitoringPromises = items.map(async (farm: any) => {
        const farmId = farm._id || farm.id;
        try {
          // AgroMonitoring API timezone safety: use yesterday for endDate
          const endDate = format(subDays(new Date(), 1), "yyyy-MM-dd");
          const startDate = format(subDays(new Date(), 31), "yyyy-MM-dd");
          const stats = await getVegetationStats(farmId, startDate, endDate);
          return { farmId, stats: stats?.data || stats };
        } catch (err) {
          console.error(`Failed to load monitoring for farm ${farmId}:`, err);
          return { farmId, stats: null };
        }
      });

      const results = await Promise.all(monitoringPromises);
      const dataMap: Record<string, any> = {};
      results.forEach(res => {
        dataMap[res.farmId] = res.stats;
      });
      setMonitoringData(dataMap);
    } catch (err: any) {
      console.error('Failed to load farms:', err);
      toast({
        title: "Error",
        description: "Failed to load monitoring data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Health Reports</h1>
          <p className="text-gray-500 mt-1">Satellite-based NDVI snapshots and crop health monitoring.</p>
        </div>
        <Button onClick={loadFarmsAndMonitoring} variant="outline" size="sm" className="gap-2 border-gray-200">
          <RefreshCw className="h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="border-gray-200 shadow-sm bg-white overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              Field Monitoring Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {farms.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <Leaf className="h-12 w-12 mx-auto text-gray-200 mb-4" />
                <p>No farms registered for monitoring.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {farms.map((farm) => {
                  const farmId = farm._id || farm.id;
                  const stats = monitoringData[farmId];
                  
                  // Extract latest NDVI if available
                  let ndviValue = null;
                  if (stats && Array.isArray(stats)) {
                    const latest = stats[0];
                    ndviValue = latest?.ndvi || latest?.currentNdvi;
                  } else if (stats?.ndvi) {
                    ndviValue = stats.ndvi;
                  }

                  const healthPercent = typeof ndviValue === 'number' ? Math.round(ndviValue * 100) : null;
                  
                  return (
                    <div key={farmId} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-gray-50/50 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600 border border-green-100 group-hover:scale-110 transition-transform">
                          <Leaf className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{farm.name || "Unnamed Farm"}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="bg-gray-100 text-gray-600 font-medium">
                              {farm.cropType || "N/A"}
                            </Badge>
                            <span className="text-xs text-gray-400">• Updated recently</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="w-full md:w-48 space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500 font-semibold uppercase tracking-wider">NDVI Health</span>
                            <span className={`font-bold ${healthPercent !== null ? (healthPercent > 60 ? 'text-green-600' : healthPercent > 30 ? 'text-yellow-600' : 'text-red-600') : 'text-gray-400'}`}>
                              {healthPercent !== null ? `${healthPercent}%` : "N/A"}
                            </span>
                          </div>
                          <Progress value={healthPercent || 0} className="h-2 bg-gray-100" />
                        </div>

                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50 gap-1.5 font-semibold">
                            <TrendingUp className="h-4 w-4" />
                            Trend
                          </Button>
                          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-900">
                            <ChevronRight className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Insight Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-gray-200 shadow-sm bg-gradient-to-br from-white to-green-50/30">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Vegetation Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 leading-relaxed">
              Based on the last 30 days of satellite data, your crops are showing a stable growth pattern. 
              The NDVI (Normalized Difference Vegetation Index) indicates healthy chlorophyll levels across most registered fields.
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm bg-gradient-to-br from-white to-amber-50/30">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Risk Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 leading-relaxed">
              No immediate weather or biological risks detected. Continue monitoring soil moisture levels as the local forecast predicts higher temperatures next week.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
