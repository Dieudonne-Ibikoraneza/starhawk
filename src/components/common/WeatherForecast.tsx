import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Cloud, Sun, CloudRain, CloudSnow, Zap, Eye, Wind, Droplets, Thermometer } from "lucide-react";
import weatherApiService from '@/services/weatherApi';

interface WeatherForecastProps {
  className?: string;
  days?: number;
  showDetails?: boolean;
}

interface WeatherData {
  city: {
    name: string;
    country: string;
  };
  forecast: Array<{
    date: Date;
    temperature: {
      day: number;
      min: number;
      max: number;
      night: number;
      morning: number;
      evening: number;
    };
    feelsLike: {
      day: number;
      night: number;
      morning: number;
      evening: number;
    };
    weather: {
      main: string;
      description: string;
      icon: string;
    };
    pressure: number;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    clouds: number;
    rain: number;
    snow: number;
    sunrise: Date;
    sunset: Date;
  }>;
}

export default function WeatherForecast({ 
  className = '', 
  days = 7, 
  showDetails = false 
}: WeatherForecastProps) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(0);

  useEffect(() => {
    loadWeatherData();
  }, [days]);

  const loadWeatherData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await weatherApiService.getRwandaWeatherForecast(days);
      const formattedData = weatherApiService.formatWeatherData(data);
      setWeatherData(formattedData);
    } catch (err) {
      console.error('Failed to load weather data:', err);
      setError('Failed to load weather forecast');
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (weatherMain: string) => {
    switch (weatherMain) {
      case 'Clear': return <Sun className="h-6 w-6 text-yellow-500" />;
      case 'Clouds': return <Cloud className="h-6 w-6 text-gray-500" />;
      case 'Rain': return <CloudRain className="h-6 w-6 text-blue-500" />;
      case 'Snow': return <CloudSnow className="h-6 w-6 text-blue-200" />;
      case 'Thunderstorm': return <Zap className="h-6 w-6 text-purple-500" />;
      default: return <Cloud className="h-6 w-6 text-gray-400" />;
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

  const currentDay = weatherData.forecast[selectedDay];

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center">
            <Cloud className="h-5 w-5 mr-2" />
            Weather Forecast
          </div>
          <Badge variant="outline" className="text-white/70">
            {weatherData.city.name}, {weatherData.city.country}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Current Day Weather */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">
                {formatDate(currentDay.date)}
              </h3>
              <p className="text-white/70 text-sm">
                {weatherApiService.getWeatherDescription(currentDay.weather)}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {getWeatherIcon(currentDay.weather.main)}
              <div className="text-right">
                <div className="text-2xl font-bold text-white">
                  {currentDay.temperature.day}°C
                </div>
                <div className="text-sm text-white/70">
                  Feels like {currentDay.feelsLike.day}°C
                </div>
              </div>
            </div>
          </div>

          {/* Temperature Range */}
          <div className="flex items-center justify-between text-sm text-white/80 mb-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Thermometer className="h-4 w-4 mr-1" />
                <span>High: {currentDay.temperature.max}°C</span>
              </div>
              <div className="flex items-center">
                <Thermometer className="h-4 w-4 mr-1" />
                <span>Low: {currentDay.temperature.min}°C</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Droplets className="h-4 w-4 mr-1" />
                <span>{currentDay.humidity}%</span>
              </div>
              <div className="flex items-center">
                <Wind className="h-4 w-4 mr-1" />
                <span>{currentDay.windSpeed} m/s {getWindDirection(currentDay.windDirection)}</span>
              </div>
            </div>
          </div>

          {/* Sun Times */}
          <div className="flex items-center justify-between text-sm text-white/70">
            <div className="flex items-center">
              <Sun className="h-4 w-4 mr-1" />
              <span>Sunrise: {formatTime(currentDay.sunrise)}</span>
            </div>
            <div className="flex items-center">
              <Sun className="h-4 w-4 mr-1" />
              <span>Sunset: {formatTime(currentDay.sunset)}</span>
            </div>
          </div>
        </div>

        {/* Weather Details (if enabled) */}
        {showDetails && (
          <div className="mb-6 p-4 bg-white/5 rounded-lg">
            <h4 className="text-sm font-semibold text-white mb-3">Weather Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-white/70">Pressure:</span>
                <span className="text-white">{currentDay.pressure} hPa</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Cloudiness:</span>
                <span className="text-white">{currentDay.clouds}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Rain:</span>
                <span className="text-white">{currentDay.rain} mm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Snow:</span>
                <span className="text-white">{currentDay.snow} mm</span>
              </div>
            </div>
          </div>
        )}

        {/* 7-Day Forecast */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-white mb-3">7-Day Forecast</h4>
          <div className="space-y-2">
            {weatherData.forecast.slice(0, 7).map((day, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                  selectedDay === index 
                    ? 'bg-white/10 border border-white/20' 
                    : 'hover:bg-white/5'
                }`}
                onClick={() => setSelectedDay(index)}
              >
                <div className="flex items-center space-x-3">
                  <div className="text-sm text-white/70 w-16">
                    {formatDate(day.date)}
                  </div>
                  {getWeatherIcon(day.weather.main)}
                  <div className="text-sm text-white/80">
                    {day.weather.description}
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-sm text-white/70">
                  <span>{day.temperature.max}°</span>
                  <span>{day.temperature.min}°</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Refresh Button */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <Button 
            onClick={loadWeatherData} 
            variant="outline" 
            size="sm" 
            className="w-full"
          >
            Refresh Weather Data
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
