import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cloud, Sun, CloudRain, CloudSnow, Zap, Wind, Droplets, Thermometer } from "lucide-react";
import meteosourceApiService from '@/services/meteosourceApi';

interface CurrentWeatherWidgetProps {
  className?: string;
}

interface CurrentWeatherData {
  temperature: number;
  summary: string;
  humidity: number;
  windSpeed: number;
  windDir: string;
  pressure: number;
  cloudCover: number;
  precipitation: number;
  precipitationType: string;
  icon: string;
  iconNum: number;
  date: Date;
}

const CurrentWeatherWidget: React.FC<CurrentWeatherWidgetProps> = ({ className }) => {
  const [weatherData, setWeatherData] = useState<CurrentWeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    loadWeatherData();
  }, []);

  // Auto-refresh weather data every 10 minutes (silent refresh)
  useEffect(() => {
    const weatherTimer = setInterval(() => {
      loadWeatherData(false); // Silent refresh without loading state
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(weatherTimer);
  }, []);

  const loadWeatherData = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    setError(null);
    
    try {
      const data = await meteosourceApiService.getCompleteWeatherData('kigali');
      setWeatherData(data.current);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load weather data:', err);
      setError(`Failed to load weather: ${err.message || 'Unknown error'}`);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const getWeatherIcon = (summary: string) => {
    const summaryLower = summary.toLowerCase();
    if (summaryLower.includes('clear') || summaryLower.includes('sunny')) {
      return <Sun className="h-8 w-8 text-yellow-500" />;
    } else if (summaryLower.includes('cloudy') || summaryLower.includes('overcast')) {
      return <Cloud className="h-8 w-8 text-gray-500" />;
    } else if (summaryLower.includes('rain') || summaryLower.includes('drizzle')) {
      return <CloudRain className="h-8 w-8 text-blue-500" />;
    } else if (summaryLower.includes('storm') || summaryLower.includes('thunder')) {
      return <Zap className="h-8 w-8 text-purple-500" />;
    } else if (summaryLower.includes('snow')) {
      return <CloudSnow className="h-8 w-8 text-blue-200" />;
    } else {
      return <Cloud className="h-8 w-8 text-gray-400" />;
    }
  };

  const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (loading) {
    return (
      <Card className={`${className} animate-pulse`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-white/70">Loading Weather...</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-white/70 text-sm">Fetching weather data...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`${className} border-red-500`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-red-500">Weather Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-400 text-sm">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!weatherData) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-white">No Weather Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-white/70 text-sm">Could not retrieve weather information.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm font-medium text-white/70">
          <div className="flex items-center">
            <Cloud className="h-4 w-4 mr-2" />
            Current Weather
          </div>
          {lastUpdated && (
            <span className="text-xs text-white/50">
              {formatTime(lastUpdated)}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Main Weather Display */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getWeatherIcon(weatherData.summary)}
              <div>
                <div className="text-2xl font-bold text-white">
                  {weatherData.temperature}°C
                </div>
                <div className="text-sm text-white/70 capitalize">
                  {weatherData.summary}
                </div>
              </div>
            </div>
          </div>

          {/* Weather Details */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center text-white/80">
              <Wind className="h-3 w-3 mr-1" />
              <span>{weatherData.windSpeed} km/h {weatherData.windDir}</span>
            </div>
            <div className="flex items-center text-white/80">
              <Droplets className="h-3 w-3 mr-1" />
              <span>{weatherData.precipitation}mm</span>
            </div>
            <div className="flex items-center text-white/80">
              <Cloud className="h-3 w-3 mr-1" />
              <span>{weatherData.cloudCover}%</span>
            </div>
            <div className="flex items-center text-white/80">
              <Thermometer className="h-3 w-3 mr-1" />
              <span>{weatherData.pressure} hPa</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CurrentWeatherWidget;
