import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dashboardTheme } from "@/utils/dashboardTheme";
import CombinedWeatherForecast from "../common/CombinedWeatherForecast";

const WeatherPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Weather Forecast</h1>
          <p className="text-white/70 mt-1">
            Real-time weather data and forecasts for Kigali, Rwanda
          </p>
        </div>
      </div>

      {/* Weather Forecast Card */}
      <CombinedWeatherForecast 
        className={`${dashboardTheme.card} rounded-2xl shadow-lg shadow-blue-900/20`}
      />

      {/* Additional Weather Information */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Weather Alerts */}
        <Card className={`${dashboardTheme.card} rounded-2xl shadow-lg shadow-blue-900/20`}>
          <CardHeader>
            <CardTitle className="text-white">Weather Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-yellow-400 text-sm font-medium">Rain Advisory</span>
                </div>
                <p className="text-white/70 text-xs mt-1">
                  Light rain expected tomorrow afternoon. Consider adjusting field activities.
                </p>
              </div>
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-blue-400 text-sm font-medium">Temperature Alert</span>
                </div>
                <p className="text-white/70 text-xs mt-1">
                  Cooler temperatures expected this week. Monitor crop conditions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agricultural Weather Tips */}
        <Card className={`${dashboardTheme.card} rounded-2xl shadow-lg shadow-blue-900/20`}>
          <CardHeader>
            <CardTitle className="text-white">Agricultural Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <h4 className="text-green-400 text-sm font-medium mb-1">Ideal Planting Conditions</h4>
                <p className="text-white/70 text-xs">
                  Current weather is suitable for planting. Soil moisture levels are optimal.
                </p>
              </div>
              <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                <h4 className="text-orange-400 text-sm font-medium mb-1">Harvest Timing</h4>
                <p className="text-white/70 text-xs">
                  Consider harvesting before the expected rain on Wednesday to avoid crop damage.
                </p>
              </div>
              <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <h4 className="text-purple-400 text-sm font-medium mb-1">Pest Management</h4>
                <p className="text-white/70 text-xs">
                  High humidity conditions may increase pest activity. Monitor crops closely.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weather Data Source */}
      <Card className={`${dashboardTheme.card} rounded-2xl shadow-lg shadow-blue-900/20`}>
        <CardHeader>
          <CardTitle className="text-white">Data Source</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-white/70 space-y-2">
            <p>
              Weather data provided by <span className="text-white font-medium">Meteosource</span> - 
              Professional weather forecasting service.
            </p>
            <p>
              Location: <span className="text-white font-medium">Kigali, Rwanda</span> 
              (1.94995S, 30.05885E) at 1,542m elevation
            </p>
            <p>
              Data updates every 10 minutes automatically. Last updated: Real-time
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WeatherPage;
