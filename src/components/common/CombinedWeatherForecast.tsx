import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Cloud, Sun, CloudRain, CloudSnow, Zap, Wind, Droplets, Thermometer, Clock } from "lucide-react";
import meteosourceApiService from '@/services/meteosourceApi';

interface CombinedWeatherForecastProps {
  className?: string;
}

interface WeatherData {
  current: {
    temperature: number;
    summary: string;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    windDir: string;
    pressure: number;
    cloudCover: number;
    precipitation: number;
    precipitationType: string;
    icon: string;
    iconNum: number;
    date: Date;
  };
  daily: Array<{
    date: Date;
    temperature: {
      max: number;
      min: number;
      day: number;
    };
    summary: string;
    weather: string;
    icon: number;
    windSpeed: number;
    windDir: string;
    windAngle: number;
    precipitation: number;
    precipitationType: string;
    cloudCover: number;
    sunrise: Date;
    sunset: Date;
  }>;
  hourly: Array<{
    time: Date;
    temperature: number;
    summary: string;
    weather: string;
    icon: number;
    windSpeed: number;
    windDir: string;
    windAngle: number;
    precipitation: number;
    precipitationType: string;
    cloudCover: number;
  }>;
  location: {
    name: string;
    country: string;
    lat: string;
    lon: string;
    elevation: number;
    timezone: string;
  };
}

export default function CombinedWeatherForecast({ 
  className = ''
}: CombinedWeatherForecastProps) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isUsingRealData, setIsUsingRealData] = useState<boolean | null>(null);

  useEffect(() => {
    loadWeatherData();
  }, []);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
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
      setWeatherData(data);
      setLastUpdated(new Date());
      setIsUsingRealData(true); // API call succeeded
    } catch (err) {
      console.error('Failed to load weather data:', err);
      setError(`Failed to load weather forecast: ${err.message || 'Unknown error'}`);
      setIsUsingRealData(false); // API failed
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

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatCurrentDateTime = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatCurrentTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: true 
    });
  };

  const getWindDirection = (degrees: number) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return directions[Math.round(degrees / 22.5) % 16];
  };

  if (loading) {
    return (
      <Card className={`${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <Cloud className="h-5 w-5 mr-2" />
            Weather Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <span className="ml-2 text-white/70">Loading weather data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !weatherData) {
    return (
      <Card className={`${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <Cloud className="h-5 w-5 mr-2" />
            Weather Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-white/70 mb-4">{error || 'No weather data available'}</p>
            <Button onClick={loadWeatherData} variant="outline" size="sm">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentDay = weatherData?.current;

  if (!weatherData) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-white">No Weather Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-white/70">Could not retrieve weather information.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center">
            <Cloud className="h-5 w-5 mr-2" />
            Weather Forecast
          </div>
          <div className="text-sm text-white/70">
            {weatherData.location?.name || 'Kigali'}, {weatherData.location?.country || 'Rwanda'}
          </div>
        </CardTitle>
        
        {/* Current Time and Date */}
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="text-sm text-white/80">
              {formatCurrentDateTime(currentTime)}
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-white/70" />
              <div className="text-lg font-mono font-semibold text-white">
                {formatCurrentTime(currentTime)}
              </div>
            </div>
          </div>
          {lastUpdated && (
            <div className="mt-2 text-xs text-white/60 text-center">
              Weather data updated: {formatTime(lastUpdated)}
              {isUsingRealData !== null && (
                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  isUsingRealData 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {isUsingRealData ? '🌐 Live Data' : '📊 Demo Data'}
                </span>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Current Day Weather - Left Side */}
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-2">
                {formatDate(currentDay.date)}
              </h3>
              <div className="flex items-center justify-center space-x-3 mb-4">
                {getWeatherIcon(currentDay.summary)}
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">
                    {currentDay.temperature}°C
                  </div>
                  <div className="text-sm text-white/70">
                    {currentDay.summary}
                  </div>
                </div>
              </div>
            </div>

            {/* Temperature Details */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-white/80">
                <span>Wind</span>
                <span className="text-white">{currentDay.windSpeed} km/h {currentDay.windDir}</span>
              </div>
              <div className="flex justify-between text-white/80">
                <span>Cloud Cover</span>
                <span className="text-white">{currentDay.cloudCover}%</span>
              </div>
              <div className="flex justify-between text-white/80">
                <span>Precipitation</span>
                <span className="text-white">{currentDay.precipitation}mm ({currentDay.precipitationType})</span>
              </div>
              <div className="flex justify-between text-white/80">
                <span>Pressure</span>
                <span className="text-white">{currentDay.pressure} hPa</span>
              </div>
              <div className="flex justify-between text-white/80">
                <span>Location</span>
                <span className="text-white">{weatherData.location?.lat || '1.94995S'}, {weatherData.location?.lon || '30.05885E'}</span>
              </div>
              <div className="flex justify-between text-white/80">
                <span>Elevation</span>
                <span className="text-white">{weatherData.location?.elevation || 1542}m</span>
              </div>
            </div>

            {/* Next 4 Hours */}
            {weatherData.hourly && weatherData.hourly.length > 0 && (
              <div className="pt-4 border-t border-white/10">
                <h5 className="text-xs font-semibold text-white mb-2">Next 4 Hours</h5>
                <div className="grid grid-cols-4 gap-2">
                  {weatherData.hourly.slice(0, 4).map((hour, index) => (
                    <div key={index} className="text-center">
                      <div className="text-xs text-white/70 mb-1">
                        {formatTime(hour.time)}
                      </div>
                      <div className="text-sm text-white font-semibold">
                        {hour.temperature}°
                      </div>
                      <div className="text-xs text-white/60">
                        {hour.precipitation > 0 ? `🌧️ ${hour.precipitation}mm` : '☀️'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 7-Day Forecast - Right Side */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-white mb-3">7-Day Forecast</h4>
            <div className="space-y-2">
              {weatherData.daily?.slice(0, 7).map((day, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg hover:bg-white/5 transition-colors border border-white/10"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-white">
                      {formatDate(day.date)}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-white font-semibold">{day.temperature.max}°</span>
                      <span className="text-xs text-white/70">{day.temperature.min}°</span>
                    </div>
                  </div>
                  <div className="text-xs text-white/80 mb-1">
                    {day.summary}
                  </div>
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>🌧️ {day.precipitation}mm</span>
                    <span>☁️ {day.cloudCover}%</span>
                    <span>💨 {day.windSpeed} km/h {day.windDir}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
