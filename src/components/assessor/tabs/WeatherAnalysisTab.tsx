import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Thermometer,
  Droplets,
  Wind,
  Cloud,
  RefreshCw,
  Loader2,
  CloudRain,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  agroTempToCelsius,
  extractAgroForecastRows,
} from "@/lib/weatherUnits";
import farmsApiService from "@/services/farmsApi";

interface WeatherData {
  date: string;
  tempHigh: number;
  tempLow: number;
  rain: number;
  humidity: number;
  clouds: number;
  wind: number;
}

interface ForecastResponse {
  success: boolean;
  message: string;
  data: any;
}

interface HistoricalResponse {
  success: boolean;
  message: string;
  data: any;
}

interface AccumulatedResponse {
  success: boolean;
  message: string;
  data: any;
}

interface WeatherAnalysisTabProps {
  fieldId: string;
  farmerName: string;
  cropType: string;
  location: string;
  readOnly?: boolean;
}

export const WeatherAnalysisTab = ({
  fieldId,
  farmerName,
  cropType,
  location,
  readOnly = false,
}: WeatherAnalysisTabProps) => {
  const [loading, setLoading] = useState(false);
  const [forecastData, setForecastData] = useState<ForecastResponse | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalResponse | null>(null);
  const [accumulatedData, setAccumulatedData] = useState<AccumulatedResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [farmData, setFarmData] = useState<any>(null);

  const calculateDroughtRisk = (totalRainfall: number, days: number) => {
    const avgDailyRainfall = totalRainfall / days;
    if (avgDailyRainfall < 1)
      return {
        level: "High",
        color: "text-rose-600",
        bgColor: "bg-rose-600",
      };
    if (avgDailyRainfall < 2)
      return {
        level: "Moderate",
        color: "text-amber-500",
        bgColor: "bg-amber-500",
      };
    return { level: "Low", color: "text-emerald-600", bgColor: "bg-emerald-600" };
  };

  const calculateHeatStress = (avgTemp: number, forecastData: any[]) => {
    const maxTemp =
      forecastData.length > 0
        ? Math.max(...forecastData.map((d) => d.tempHigh))
        : avgTemp;

    if (avgTemp > 30 || maxTemp > 35)
      return {
        level: "High",
        color: "text-rose-600",
        bgColor: "bg-rose-600",
      };
    if (avgTemp > 25 || maxTemp > 30)
      return {
        level: "Moderate",
        color: "text-amber-500",
        bgColor: "bg-amber-500",
      };
    return { level: "Low", color: "text-emerald-600", bgColor: "bg-emerald-600" };
  };

  const calculateFloodRisk = (totalRainfall: number, days: number) => {
    const avgDailyRainfall = totalRainfall / days;
    if (avgDailyRainfall > 5)
      return {
        level: "High",
        color: "text-rose-600",
        bgColor: "bg-rose-600",
      };
    if (avgDailyRainfall > 3)
      return {
        level: "Moderate",
        color: "text-amber-500",
        bgColor: "bg-amber-500",
      };
    return { level: "Low", color: "text-emerald-600", bgColor: "bg-emerald-600" };
  };

  const calculateHumidityRisk = (avgHumidity: number) => {
    if (avgHumidity > 85)
      return {
        level: "High",
        color: "text-rose-600",
        bgColor: "bg-rose-600",
      };
    if (avgHumidity > 75)
      return {
        level: "Moderate",
        color: "text-amber-500",
        bgColor: "bg-amber-500",
      };
    return { level: "Normal", color: "text-emerald-600", bgColor: "bg-emerald-600" };
  };

  const calculateOverallScore = (
    droughtRisk: any,
    floodRisk: any,
    heatStress: any,
    humidityRisk: any,
  ) => {
    const riskScores: Record<string, number> = {
      Low: 1,
      Normal: 1,
      Moderate: 2.5,
      High: 4,
    };

    const maxRisk = Math.max(
      riskScores[droughtRisk.level] || 0,
      riskScores[floodRisk.level] || 0,
      riskScores[heatStress.level] || 0,
      riskScores[humidityRisk.level] || 0,
    );

    const score = 5 - (maxRisk - 1) * 1.25; // Convert to 1-5 scale
    const level = maxRisk >= 4 ? "HIGH" : maxRisk >= 2.5 ? "MODERATE" : "LOW";

    return { score: score.toFixed(1), level };
  };

  const formatFieldId = (id: string) => {
    if (!id || id.length < 3) return id;
    return `FLD-${id.substring(id.length - 4).toUpperCase()}`;
  };

  const fetchWeatherData = useCallback(async () => {
    if (!fieldId) return;

    setLoading(true);
    setError(null);

    try {
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 7);
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 30);

      const todayStr = today.toISOString().split("T")[0];
      const endDateStr = endDate.toISOString().split("T")[0];
      const startDateStr = startDate.toISOString().split("T")[0];

      // Fetch farm details
      try {
        const farm = await farmsApiService.getFarmById(fieldId);
        setFarmData(farm.data || farm);
      } catch (e) {
        console.warn("Farm details fetch failed");
      }

      // Fetch forecast data
      try {
        const forecast = await farmsApiService.getWeatherForecast(fieldId, todayStr, endDateStr);
        setForecastData(forecast);
      } catch (e) {
        console.error("Forecast failed", e);
      }

      // Fetch historical data
      try {
        const historical = await farmsApiService.getHistoricalWeather(fieldId, startDateStr, todayStr);
        setHistoricalData(historical);
      } catch (e) {
        console.warn("Historical fetch failed");
      }

      // Fetch accumulated data
      try {
        const accumulated = await farmsApiService.getAccumulatedWeather(fieldId, startDateStr, todayStr);
        setAccumulatedData(accumulated);
      } catch (e) {
        console.warn("Accumulated fetch failed");
      }
    } catch (err) {
      setError("Failed to fetch weather data");
      console.error("Weather API Error:", err);
    } finally {
      setLoading(false);
    }
  }, [fieldId]);

  useEffect(() => {
    fetchWeatherData();
  }, [fieldId, fetchWeatherData]);

  const transformForecastData = (response: ForecastResponse | null): WeatherData[] => {
    const rows = extractAgroForecastRows(response) as any[];
    if (!rows.length) return [];

    const dailyData = new Map<string, any>();
    rows.forEach((item) => {
      const date = new Date(item.dt * 1000).toLocaleDateString();
      if (!dailyData.has(date)) dailyData.set(date, item);
    });

    return Array.from(dailyData.values())
      .slice(0, 7)
      .map((item) => ({
        date: new Date(item.dt * 1000).toLocaleDateString(),
        tempHigh: Math.round(agroTempToCelsius(item.main.temp_max)),
        tempLow: Math.round(agroTempToCelsius(item.main.temp_min)),
        rain: item.rain?.["3h"] || 0,
        humidity: item.main.humidity,
        clouds: item.clouds.all,
        wind: Math.round(item.wind.speed * 10) / 10,
      }));
  };

  const transformHistoricalData = (response: HistoricalResponse): WeatherData[] => {
    const dataArr = response?.data?.data || response?.data || [];
    if (!Array.isArray(dataArr)) return [];

    return dataArr.map((item: any) => ({
      date: item.date || new Date(item.dt * 1000).toLocaleDateString(),
      tempHigh: Math.round(item.temp_max || item.temp),
      tempLow: Math.round(item.temp_min || item.temp),
      rain: item.rain || 0,
      humidity: item.humidity,
      clouds: item.clouds,
      wind: Math.round((item.wind_speed || item.wind?.speed || 0) * 10) / 10,
    }));
  };

  if (loading && !forecastData && !historicalData && !accumulatedData) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  const currentForecast = extractAgroForecastRows(forecastData) as any[];
  const cur = currentForecast[0];
  const forecastList = transformForecastData(forecastData);
  const historicalList = historicalData ? transformHistoricalData(historicalData) : [];
  const acc = accumulatedData?.data || accumulatedData;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Thermometer className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-emerald-700 font-bold uppercase tracking-wider">Avg Temperature</p>
                <p className="text-2xl font-black text-emerald-900">
                  {acc?.avg_temperature ? `${Math.round(acc.avg_temperature)}°C` : "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Droplets className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-blue-700 font-bold uppercase tracking-wider">Total Rainfall (30d)</p>
                <p className="text-2xl font-black text-blue-900">
                  {acc?.total_rainfall ? `${acc.total_rainfall}mm` : "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-amber-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <CloudRain className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-amber-700 font-bold uppercase tracking-wider">Rainy Days</p>
                <p className="text-2xl font-black text-amber-900">
                  {acc?.days_with_rain ? `${acc.days_with_rain} Days` : "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-slate-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-200 rounded-lg">
                <Cloud className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-xs text-slate-700 font-bold uppercase tracking-wider">Avg Humidity</p>
                <p className="text-2xl font-black text-slate-900">
                  {acc?.avg_humidity ? `${Math.round(acc.avg_humidity)}%` : "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Forecast Table */}
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-lg font-bold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-emerald-600" />
                7-Day Forecast
              </div>
              {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/30">
                <TableRow>
                  <TableHead className="font-bold text-slate-700">Date</TableHead>
                  <TableHead className="font-bold text-slate-700">Temp High/Low</TableHead>
                  <TableHead className="font-bold text-slate-700">Rain</TableHead>
                  <TableHead className="font-bold text-slate-700">Humidity</TableHead>
                  <TableHead className="font-bold text-slate-700">Wind</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forecastList.length > 0 ? (
                  forecastList.map((day, i) => (
                    <TableRow key={i} className="hover:bg-slate-50/50">
                      <TableCell className="font-medium">{day.date}</TableCell>
                      <TableCell>
                        <span className="font-bold text-slate-900">{day.tempHigh}°C</span>
                        <span className="text-slate-400 mx-1">/</span>
                        <span className="text-slate-500">{day.tempLow}°C</span>
                      </TableCell>
                      <TableCell>
                        {day.rain > 0 ? (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-none font-bold">
                            {day.rain}mm
                          </Badge>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-600">{day.humidity}%</TableCell>
                      <TableCell className="text-slate-600">{day.wind} m/s</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                      No forecast data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Risk Assessment Card */}
        <Card className="border-none shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <CloudRain className="h-5 w-5 text-emerald-600" />
              Weather Risk Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {acc ? (
              <>
                {[
                  { label: "Drought Risk", risk: calculateDroughtRisk(acc.total_rainfall, 30) },
                  { label: "Flood Risk", risk: calculateFloodRisk(acc.total_rainfall, 30) },
                  { label: "Heat Stress", risk: calculateHeatStress(acc.avg_temperature, forecastList) },
                  { label: "Humidity Risk", risk: calculateHumidityRisk(acc.avg_humidity) },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                    <span className="text-sm font-bold text-slate-700">{item.label}</span>
                    <Badge className={`${item.risk.bgColor} text-white border-none px-3`}>
                      {item.risk.level}
                    </Badge>
                  </div>
                ))}
                
                <div className="pt-6 mt-6 border-t border-slate-100">
                  <div className="flex justify-between items-end mb-2">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Overall Score</p>
                    <p className="text-3xl font-black text-emerald-600">
                      {calculateOverallScore(
                        calculateDroughtRisk(acc.total_rainfall, 30),
                        calculateFloodRisk(acc.total_rainfall, 30),
                        calculateHeatStress(acc.avg_temperature, forecastList),
                        calculateHumidityRisk(acc.avg_humidity)
                      ).score}
                    </p>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-1000" 
                      style={{ width: `${(parseFloat(calculateOverallScore(
                        calculateDroughtRisk(acc.total_rainfall, 30),
                        calculateFloodRisk(acc.total_rainfall, 30),
                        calculateHeatStress(acc.avg_temperature, forecastList),
                        calculateHumidityRisk(acc.avg_humidity)
                      ).score) / 5) * 100}%` }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-slate-400">
                Calculated once data is loaded
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Historical Charts */}
      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-600" />
            Historical Trends (30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-[400px] w-full">
            <ChartContainer
              config={{
                maxTemp: { label: "Max Temp", color: "#ef4444" },
                minTemp: { label: "Min Temp", color: "#3b82f6" },
                precipitation: { label: "Rainfall", color: "#10b981" },
              }}
            >
              <LineChart data={historicalList} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  interval={4}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: "#64748b" }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend verticalAlign="top" align="right" iconType="circle" />
                <Line 
                  type="monotone" 
                  dataKey="tempHigh" 
                  name="Max Temp"
                  stroke="#ef4444" 
                  strokeWidth={3} 
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="tempLow" 
                  name="Min Temp"
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="rain" 
                  name="Rainfall"
                  stroke="#10b981" 
                  strokeWidth={3} 
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

import { Calendar, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
