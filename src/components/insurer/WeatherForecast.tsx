import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dashboardTheme } from "@/utils/dashboardTheme";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Cloud,
  CloudRain,
  CloudSnow,
  Sun,
  Wind,
  Droplets,
  Thermometer,
  Eye,
  Gauge,
  RefreshCw,
  AlertCircle,
  Loader2,
  MapPin,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from "recharts";

// Use environment variable for easy deployment across different environments
const API_BASE_URL = `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/v1/satellite`;

interface WeatherData {
  dt: number;
  dt_txt: string;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  clouds: {
    all: number;
  };
  wind: {
    speed: number;
    deg: number;
  };
  visibility: number;
  pop: number; // Probability of precipitation
  rain?: {
    "3h": number;
  };
  snow?: {
    "3h": number;
  };
}

interface WeatherResponse {
  list: WeatherData[];
  city: {
    name: string;
    country: string;
    coord: {
      lat: number;
      lon: number;
    };
  };
}

// Sample Rwanda coordinates (Nyagatare District)
const DEFAULT_LAT = -1.3;
const DEFAULT_LON = 30.32;

export default function WeatherForecast() {
  const [loading, setLoading] = useState(false);
  const [weather, setWeather] = useState<WeatherData[]>([]);
  const [cityInfo, setCityInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [latitude, setLatitude] = useState(DEFAULT_LAT.toString());
  const [longitude, setLongitude] = useState(DEFAULT_LON.toString());

  // Fetch weather forecast
  const fetchWeather = async () => {
    setLoading(true);
    setError(null);

    try {
      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);

      // Create a small polygon around the point (approximately 0.01 degree buffer)
      const buffer = 0.01;
      const requestBody = {
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [lon - buffer, lat + buffer],
              [lon + buffer, lat + buffer],
              [lon + buffer, lat - buffer],
              [lon - buffer, lat - buffer],
              [lon - buffer, lat + buffer],
            ],
          ],
        },
      };

      const response = await fetch(`${API_BASE_URL}/weather`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API Error: ${response.statusText}`);
      }

      const data = await response.json();

      // Transform EOS API response to our format
      if (Array.isArray(data) && data.length > 0) {
        const transformedData = data.flatMap((dayData: any) => {
          const date = dayData.Date;
          const times = [
            "02h",
            "05h",
            "08h",
            "11h",
            "14h",
            "17h",
            "20h",
            "23h",
          ];

          return times.map((time, index) => ({
            dt:
              new Date(`${date}T${time.replace("h", ":00:00")}`).getTime() /
              1000,
            dt_txt: `${date} ${time}`,
            main: {
              temp: (dayData.Temp_air_max + dayData.Temp_air_min) / 2,
              feels_like: (dayData.Temp_air_max + dayData.Temp_air_min) / 2 - 2,
              temp_min: dayData.Temp_land_min,
              temp_max: dayData.Temp_land_max,
              pressure: 1013, // Default value
              humidity: dayData.Rel_humidity,
            },
            weather: [
              {
                id: 800,
                main:
                  dayData.Snow_depth > 0
                    ? "Snow"
                    : dayData.Rain[time] > 0.5
                      ? "Rain"
                      : "Clear",
                description:
                  dayData.Snow_depth > 0
                    ? "snow"
                    : dayData.Rain[time] > 0.5
                      ? "rain"
                      : "clear sky",
                icon: "01d",
              },
            ],
            clouds: {
              all: dayData.Rain[time] > 0 ? 75 : 20,
            },
            wind: {
              speed: dayData.Windspeed[time],
              deg: 0,
            },
            visibility: 10000,
            pop:
              dayData.Rain[time] > 0 ? Math.min(dayData.Rain[time] / 10, 1) : 0,
            rain:
              dayData.Rain[time] > 0 ? { "3h": dayData.Rain[time] } : undefined,
          }));
        });

        setWeather(transformedData);
        setCityInfo({
          name: "AOI",
          country: "RW",
          coord: { lat, lon },
        });
      } else {
        throw new Error("Invalid response format from API");
      }

      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Failed to fetch weather data");
      setLoading(false);
    }
  };

  // Get weather icon
  const getWeatherIcon = (weatherMain: string) => {
    switch (weatherMain.toLowerCase()) {
      case "clear":
        return <Sun className="h-8 w-8 text-yellow-400" />;
      case "clouds":
        return <Cloud className="h-8 w-8 text-gray-400" />;
      case "rain":
      case "drizzle":
        return <CloudRain className="h-8 w-8 text-blue-400" />;
      case "snow":
        return <CloudSnow className="h-8 w-8 text-blue-200" />;
      default:
        return <Cloud className="h-8 w-8 text-gray-400" />;
    }
  };

  // Format chart data
  const chartData = weather.slice(0, 16).map((item) => ({
    time: new Date(item.dt * 1000).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
    }),
    temperature: Math.round(item.main.temp),
    feelsLike: Math.round(item.main.feels_like),
    humidity: item.main.humidity,
    windSpeed: Math.round(item.wind.speed * 3.6), // Convert m/s to km/h
    precipitation: Math.round((item.pop || 0) * 100),
    clouds: item.clouds.all,
  }));

  // Get current weather (first item)
  const currentWeather = weather[0];

  // Calculate daily averages
  const dailyData = weather.reduce((acc: any, item) => {
    const date = new Date(item.dt * 1000).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = {
        temps: [],
        humidity: [],
        wind: [],
        rain: 0,
      };
    }
    acc[date].temps.push(item.main.temp);
    acc[date].humidity.push(item.main.humidity);
    acc[date].wind.push(item.wind.speed);
    if (item.rain) acc[date].rain += item.rain["3h"] || 0;
    return acc;
  }, {});

  const dailySummary = Object.entries(dailyData)
    .slice(0, 5)
    .map(([date, data]: [string, any]) => ({
      date: new Date(date).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
      avgTemp: Math.round(
        data.temps.reduce((a: number, b: number) => a + b, 0) /
          data.temps.length,
      ),
      maxTemp: Math.round(Math.max(...data.temps)),
      minTemp: Math.round(Math.min(...data.temps)),
      avgHumidity: Math.round(
        data.humidity.reduce((a: number, b: number) => a + b, 0) /
          data.humidity.length,
      ),
      maxWind: Math.round(Math.max(...data.wind) * 3.6),
      totalRain: Math.round(data.rain * 10) / 10,
    }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border border-blue-700/30 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2 text-white flex items-center gap-3">
              <CloudRain className="h-7 w-7 text-blue-400" />
              Weather Forecast
            </h1>
            <p className="text-blue-400">
              5-day weather forecast for agricultural risk assessment
            </p>
          </div>
          <Badge className="bg-blue-400/20 text-blue-400 border-blue-400/30 px-4 py-2">
            <Wind className="h-4 w-4 mr-2" />
            Live Data
          </Badge>
        </div>
      </div>

      {/* Controls */}
      <Card className={dashboardTheme.card}>
        <CardHeader>
          <CardTitle className="text-white">Location Coordinates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="latitude" className="text-white/80">
                Latitude
              </Label>
              <Input
                id="latitude"
                type="number"
                step="0.01"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className={dashboardTheme.input}
                placeholder="-1.30"
              />
            </div>

            <div>
              <Label htmlFor="longitude" className="text-white/80">
                Longitude
              </Label>
              <Input
                id="longitude"
                type="number"
                step="0.01"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className={dashboardTheme.input}
                placeholder="30.32"
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={fetchWeather}
                disabled={loading}
                className={`${dashboardTheme.buttonPrimary} w-full`}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Get Forecast
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

          {cityInfo && (
            <div className="mt-4 flex items-center gap-2 text-white/70">
              <MapPin className="h-4 w-4" />
              <span>
                {cityInfo.name}, {cityInfo.country} (
                {cityInfo.coord.lat.toFixed(2)}, {cityInfo.coord.lon.toFixed(2)}
                )
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Weather */}
      {currentWeather && (
        <div className="grid gap-6 md:grid-cols-4">
          <Card className={`${dashboardTheme.card} border-blue-700/30`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/70">
                    Temperature
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {Math.round(currentWeather.main.temp)}°C
                  </p>
                  <p className="text-sm text-white/60 mt-1">
                    Feels like {Math.round(currentWeather.main.feels_like)}°C
                  </p>
                </div>
                <Thermometer className="h-12 w-12 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className={`${dashboardTheme.card} border-cyan-700/30`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/70">Humidity</p>
                  <p className="text-3xl font-bold text-white">
                    {currentWeather.main.humidity}%
                  </p>
                  <p className="text-sm text-white/60 mt-1">
                    {currentWeather.clouds.all}% Cloud Cover
                  </p>
                </div>
                <Droplets className="h-12 w-12 text-cyan-400" />
              </div>
            </CardContent>
          </Card>

          <Card className={`${dashboardTheme.card} border-green-700/30`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/70">
                    Wind Speed
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {Math.round(currentWeather.wind.speed * 3.6)} km/h
                  </p>
                  <p className="text-sm text-white/60 mt-1">
                    Direction {currentWeather.wind.deg}°
                  </p>
                </div>
                <Wind className="h-12 w-12 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className={`${dashboardTheme.card} border-purple-700/30`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/70">Condition</p>
                  <div className="flex items-center gap-2 mt-2">
                    {getWeatherIcon(currentWeather.weather[0].main)}
                    <p className="text-lg font-bold text-white capitalize">
                      {currentWeather.weather[0].description}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white/60">Visibility</p>
                  <p className="text-lg font-semibold text-white">
                    {(currentWeather.visibility / 1000).toFixed(1)} km
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      {weather.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Temperature Trend */}
          <Card className={dashboardTheme.card}>
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Thermometer className="h-5 w-5 text-red-400" />
                Temperature Forecast (48h)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient
                        id="tempGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#EF4444"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="95%"
                          stopColor="#EF4444"
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
                      dataKey="time"
                      stroke="#9CA3AF"
                      fontSize={10}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#9CA3AF"
                      fontSize={11}
                      tickLine={false}
                      label={{
                        value: "°C",
                        angle: -90,
                        position: "insideLeft",
                        fill: "#9CA3AF",
                      }}
                    />
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
                      dataKey="temperature"
                      stroke="#EF4444"
                      fill="url(#tempGradient)"
                      strokeWidth={2}
                      name="Temperature (°C)"
                    />
                    <Line
                      type="monotone"
                      dataKey="feelsLike"
                      stroke="#F59E0B"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                      name="Feels Like (°C)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Precipitation & Humidity */}
          <Card className={dashboardTheme.card}>
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CloudRain className="h-5 w-5 text-blue-400" />
                Precipitation & Humidity (48h)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#374151"
                      opacity={0.3}
                    />
                    <XAxis
                      dataKey="time"
                      stroke="#9CA3AF"
                      fontSize={10}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#9CA3AF"
                      fontSize={11}
                      tickLine={false}
                      label={{
                        value: "%",
                        angle: -90,
                        position: "insideLeft",
                        fill: "#9CA3AF",
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(31, 41, 55, 0.95)",
                        border: "1px solid rgba(75, 85, 99, 0.3)",
                        borderRadius: "12px",
                        color: "#fff",
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="precipitation"
                      fill="#3B82F6"
                      radius={[8, 8, 0, 0]}
                      name="Precipitation Probability (%)"
                    />
                    <Bar
                      dataKey="humidity"
                      fill="#06B6D4"
                      radius={[8, 8, 0, 0]}
                      name="Humidity (%)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 5-Day Summary */}
      {dailySummary.length > 0 && (
        <Card className={dashboardTheme.card}>
          <CardHeader>
            <CardTitle className="text-white">5-Day Forecast Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700/30">
                    <th className="text-left py-3 px-4 text-white/80 font-medium">
                      Date
                    </th>
                    <th className="text-center py-3 px-4 text-white/80 font-medium">
                      Avg Temp
                    </th>
                    <th className="text-center py-3 px-4 text-white/80 font-medium">
                      Min/Max
                    </th>
                    <th className="text-center py-3 px-4 text-white/80 font-medium">
                      Humidity
                    </th>
                    <th className="text-center py-3 px-4 text-white/80 font-medium">
                      Max Wind
                    </th>
                    <th className="text-center py-3 px-4 text-white/80 font-medium">
                      Rain
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dailySummary.map((day, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-gray-800/30 hover:bg-gray-800/20"
                    >
                      <td className="py-3 px-4 text-white font-medium">
                        {day.date}
                      </td>
                      <td className="py-3 px-4 text-center text-white">
                        {day.avgTemp}°C
                      </td>
                      <td className="py-3 px-4 text-center text-white/70">
                        {day.minTemp}° / {day.maxTemp}°
                      </td>
                      <td className="py-3 px-4 text-center text-cyan-400">
                        {day.avgHumidity}%
                      </td>
                      <td className="py-3 px-4 text-center text-green-400">
                        {day.maxWind} km/h
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          className={
                            day.totalRain > 5
                              ? "bg-blue-400/20 text-blue-400"
                              : day.totalRain > 0
                                ? "bg-blue-400/10 text-blue-300"
                                : "bg-gray-400/10 text-gray-400"
                          }
                        >
                          {day.totalRain} mm
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
      {weather.length === 0 && !loading && (
        <Card className={dashboardTheme.card}>
          <CardContent className="py-16">
            <div className="text-center">
              <CloudRain className="h-16 w-16 text-white/20 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No Weather Data
              </h3>
              <p className="text-white/60 mb-6">
                Enter coordinates and click "Get Forecast" to load weather data
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-white/50">
                <MapPin className="h-4 w-4" />
                <span>Default Location: Nyagatare District, Rwanda</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
