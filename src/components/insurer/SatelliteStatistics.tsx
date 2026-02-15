import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dashboardTheme } from "@/utils/dashboardTheme";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Satellite,
  TrendingUp,
  TrendingDown,
  Activity,
  CloudRain,
  Leaf,
  MapPin,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// Use environment variable for easy deployment across different environments
const API_BASE_URL = `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/v1/satellite`;

interface StatisticsResult {
  scene_id: string;
  view_id: string;
  date: string;
  cloud: number;
  notes: string[];
  q1: number;
  q3: number;
  max: number;
  min: number;
  p10: number;
  p90: number;
  std: number;
  median: number;
  average: number;
  variance: number;
}

interface TaskResponse {
  status: string;
  task_id: string;
  req_id: string;
  task_timeout: number;
}

interface TaskStatusResponse {
  errors?: Array<{
    scene_id: string;
    view_id: string;
    date: string;
    error: string;
    notes: string[];
  }>;
  result?: StatisticsResult[];
}

// Sample Rwanda farm coordinates (Nyagatare District - major agricultural area)
const DEFAULT_COORDINATES = [
  [30.32, -1.3],
  [30.35, -1.3],
  [30.35, -1.28],
  [30.32, -1.28],
  [30.32, -1.3],
];

export default function SatelliteStatistics() {
  const [loading, setLoading] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<StatisticsResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState("NDVI");
  const [dateStart, setDateStart] = useState("2024-09-01");
  const [dateEnd, setDateEnd] = useState("2024-10-08");

  // Available indices
  const indices = [
    { value: "NDVI", label: "NDVI (Vegetation Health)" },
    { value: "RECI", label: "RECI (Red-Edge Chlorophyll)" },
    { value: "MSAVI", label: "MSAVI (Soil Adjusted)" },
    { value: "EVI", label: "EVI (Enhanced Vegetation)" },
    { value: "NDMI", label: "NDMI (Moisture)" },
    { value: "SAVI", label: "SAVI (Soil Adjusted)" },
  ];

  // Create statistics task
  const createTask = async () => {
    setLoading(true);
    setError(null);

    try {
      const requestBody = {
        type: "mt_stats",
        params: {
          bm_type: [selectedIndex],
          date_start: dateStart,
          date_end: dateEnd,
          geometry: {
            type: "Polygon",
            coordinates: [DEFAULT_COORDINATES],
          },
          reference: `insurer_${Date.now()}`,
          sensors: ["Sentinel-2"],
          max_cloud_cover_in_aoi: 30,
          exclude_cover_pixels: true,
          cloud_masking_level: 2,
          limit: 20,
        },
      };

      const response = await fetch(`${API_BASE_URL}/task`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data: TaskResponse = await response.json();
      setTaskId(data.task_id);

      // Start polling for results
      pollTaskStatus(data.task_id);
    } catch (err: any) {
      setError(err.message || "Failed to create task");
      setLoading(false);
    }
  };

  // Poll task status
  const pollTaskStatus = async (id: string) => {
    const maxAttempts = 30;
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/task/${id}`);

        if (!response.ok) {
          throw new Error(`API Error: ${response.statusText}`);
        }

        const data: TaskStatusResponse = await response.json();

        if (data.result && data.result.length > 0) {
          setStatistics(
            data.result.sort(
              (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
            ),
          );
          setLoading(false);
          return;
        }

        if (data.errors && data.errors.length > 0) {
          setError(data.errors[0].error);
          setLoading(false);
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 3000); // Poll every 3 seconds
        } else {
          setError("Task timeout - please try again");
          setLoading(false);
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch task status");
        setLoading(false);
      }
    };

    poll();
  };

  // Calculate summary statistics
  const getSummaryStats = () => {
    if (statistics.length === 0) return null;

    const latestData = statistics[statistics.length - 1];
    const previousData =
      statistics.length > 1 ? statistics[statistics.length - 2] : null;

    const avgChange = previousData
      ? ((latestData.average - previousData.average) / previousData.average) *
        100
      : 0;

    return {
      latest: latestData,
      avgChange,
      totalScenes: statistics.length,
      avgCloudCover:
        statistics.reduce((sum, s) => sum + s.cloud, 0) / statistics.length,
      overallAvg:
        statistics.reduce((sum, s) => sum + s.average, 0) / statistics.length,
      overallStd:
        statistics.reduce((sum, s) => sum + s.std, 0) / statistics.length,
    };
  };

  const summaryStats = getSummaryStats();

  // Format chart data
  const chartData = statistics.map((stat) => ({
    date: new Date(stat.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    average: parseFloat(stat.average.toFixed(4)),
    median: parseFloat(stat.median.toFixed(4)),
    max: parseFloat(stat.max.toFixed(4)),
    min: parseFloat(stat.min.toFixed(4)),
    std: parseFloat(stat.std.toFixed(4)),
    cloud: stat.cloud,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border border-blue-700/30 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2 text-white flex items-center gap-3">
              <Satellite className="h-7 w-7 text-blue-400" />
              Satellite-Based Crop Analytics
            </h1>
            <p className="text-blue-400">
              Real-time vegetation indices and soil moisture data from
              Sentinel-2 satellite imagery
            </p>
          </div>
          <Badge className="bg-green-400/20 text-green-400 border-green-400/30 px-4 py-2">
            <Activity className="h-4 w-4 mr-2" />
            Live Data
          </Badge>
        </div>
      </div>

      {/* Controls */}
      <Card className={dashboardTheme.card}>
        <CardHeader>
          <CardTitle className="text-white">Analysis Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <Label htmlFor="index" className="text-white/80">
                Vegetation Index
              </Label>
              <Select value={selectedIndex} onValueChange={setSelectedIndex}>
                <SelectTrigger className={dashboardTheme.select}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {indices.map((idx) => (
                    <SelectItem
                      key={idx.value}
                      value={idx.value}
                      className="text-white hover:bg-white/10"
                    >
                      {idx.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="start-date" className="text-white/80">
                Start Date
              </Label>
              <Input
                id="start-date"
                type="date"
                value={dateStart}
                onChange={(e) => setDateStart(e.target.value)}
                className={dashboardTheme.input}
              />
            </div>

            <div>
              <Label htmlFor="end-date" className="text-white/80">
                End Date
              </Label>
              <Input
                id="end-date"
                type="date"
                value={dateEnd}
                onChange={(e) => setDateEnd(e.target.value)}
                className={dashboardTheme.input}
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={createTask}
                disabled={loading}
                className={`${dashboardTheme.buttonPrimary} w-full`}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Fetch Data
                  </>
                )}
              </Button>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 font-medium">Error</p>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {summaryStats && (
        <div className="grid gap-6 md:grid-cols-4">
          <Card className={`${dashboardTheme.card} border-green-700/30`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/70">
                    Latest {selectedIndex}
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {summaryStats.latest.average.toFixed(4)}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {summaryStats.avgChange >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-400" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-400" />
                    )}
                    <span
                      className={`text-sm ${summaryStats.avgChange >= 0 ? "text-green-400" : "text-red-400"}`}
                    >
                      {Math.abs(summaryStats.avgChange).toFixed(2)}%
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-green-400/20 rounded-lg flex items-center justify-center">
                  <Leaf className="h-6 w-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${dashboardTheme.card} border-blue-700/30`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/70">
                    Total Scenes
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {summaryStats.totalScenes}
                  </p>
                  <p className="text-sm text-white/60 mt-1">Analyzed</p>
                </div>
                <div className="w-12 h-12 bg-blue-400/20 rounded-lg flex items-center justify-center">
                  <Satellite className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${dashboardTheme.card} border-cyan-700/30`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/70">
                    Avg Cloud Cover
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {summaryStats.avgCloudCover.toFixed(1)}%
                  </p>
                  <p className="text-sm text-white/60 mt-1">
                    {summaryStats.avgCloudCover < 20
                      ? "Excellent"
                      : summaryStats.avgCloudCover < 40
                        ? "Good"
                        : "Fair"}
                  </p>
                </div>
                <div className="w-12 h-12 bg-cyan-400/20 rounded-lg flex items-center justify-center">
                  <CloudRain className="h-6 w-6 text-cyan-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${dashboardTheme.card} border-purple-700/30`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/70">
                    Std Deviation
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {summaryStats.overallStd.toFixed(4)}
                  </p>
                  <p className="text-sm text-white/60 mt-1">Variability</p>
                </div>
                <div className="w-12 h-12 bg-purple-400/20 rounded-lg flex items-center justify-center">
                  <Activity className="h-6 w-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      {statistics.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Time Series Chart */}
          <Card className={dashboardTheme.card}>
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-400" />
                {selectedIndex} Trends Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient
                        id="avgGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10B981"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10B981"
                          stopOpacity={0.1}
                        />
                      </linearGradient>
                      <linearGradient
                        id="medianGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#3B82F6"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="95%"
                          stopColor="#3B82F6"
                          stopOpacity={0.1}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#374151"
                      opacity={0.3}
                    />
                    <XAxis
                      dataKey="date"
                      stroke="#9CA3AF"
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(31, 41, 55, 0.95)",
                        border: "1px solid rgba(75, 85, 99, 0.3)",
                        borderRadius: "12px",
                        color: "#fff",
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="average"
                      stroke="#10B981"
                      fill="url(#avgGradient)"
                      strokeWidth={2}
                      name="Average"
                    />
                    <Area
                      type="monotone"
                      dataKey="median"
                      stroke="#3B82F6"
                      fill="url(#medianGradient)"
                      strokeWidth={2}
                      name="Median"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Variability Chart */}
          <Card className={dashboardTheme.card}>
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-400" />
                Data Variability (Min/Max/Std Dev)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#374151"
                      opacity={0.3}
                    />
                    <XAxis
                      dataKey="date"
                      stroke="#9CA3AF"
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(31, 41, 55, 0.95)",
                        border: "1px solid rgba(75, 85, 99, 0.3)",
                        borderRadius: "12px",
                        color: "#fff",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="max"
                      stroke="#EF4444"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      name="Maximum"
                    />
                    <Line
                      type="monotone"
                      dataKey="min"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      name="Minimum"
                    />
                    <Line
                      type="monotone"
                      dataKey="std"
                      stroke="#8B5CF6"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      name="Std Deviation"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Statistics Table */}
      {statistics.length > 0 && (
        <Card className={dashboardTheme.card}>
          <CardHeader>
            <CardTitle className="text-white">
              Detailed Scene Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700/30">
                    <th className="text-left py-3 px-4 text-white/80 font-medium">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 text-white/80 font-medium">
                      Scene ID
                    </th>
                    <th className="text-right py-3 px-4 text-white/80 font-medium">
                      Average
                    </th>
                    <th className="text-right py-3 px-4 text-white/80 font-medium">
                      Median
                    </th>
                    <th className="text-right py-3 px-4 text-white/80 font-medium">
                      Min
                    </th>
                    <th className="text-right py-3 px-4 text-white/80 font-medium">
                      Max
                    </th>
                    <th className="text-right py-3 px-4 text-white/80 font-medium">
                      Std Dev
                    </th>
                    <th className="text-right py-3 px-4 text-white/80 font-medium">
                      Cloud %
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {statistics.map((stat, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-gray-800/30 hover:bg-gray-800/20"
                    >
                      <td className="py-3 px-4 text-white/70">
                        {new Date(stat.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-white/60 text-sm font-mono">
                        {stat.scene_id.substring(0, 20)}...
                      </td>
                      <td className="py-3 px-4 text-right text-white font-medium">
                        {stat.average.toFixed(4)}
                      </td>
                      <td className="py-3 px-4 text-right text-white/70">
                        {stat.median.toFixed(4)}
                      </td>
                      <td className="py-3 px-4 text-right text-blue-400">
                        {stat.min.toFixed(4)}
                      </td>
                      <td className="py-3 px-4 text-right text-red-400">
                        {stat.max.toFixed(4)}
                      </td>
                      <td className="py-3 px-4 text-right text-purple-400">
                        {stat.std.toFixed(4)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Badge
                          className={
                            stat.cloud < 20
                              ? "bg-green-400/20 text-green-400"
                              : stat.cloud < 40
                                ? "bg-yellow-400/20 text-yellow-400"
                                : "bg-red-400/20 text-red-400"
                          }
                        >
                          {stat.cloud.toFixed(1)}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {statistics.length === 0 && !loading && (
        <Card className={dashboardTheme.card}>
          <CardContent className="py-16">
            <div className="text-center">
              <Satellite className="h-16 w-16 text-white/20 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No Data Available
              </h3>
              <p className="text-white/60 mb-6">
                Select parameters and click "Fetch Data" to load satellite
                imagery statistics
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-white/50">
                <MapPin className="h-4 w-4" />
                <span>Monitoring: Nyagatare District, Rwanda</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
