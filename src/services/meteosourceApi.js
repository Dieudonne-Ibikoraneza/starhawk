// Meteosource Weather API Service
const METEOSOURCE_API_KEY = 'kd21d3jso0f85cirisa7hsryyhb0ru9hj2xntowo';
const METEOSOURCE_BASE_URL = 'https://www.meteosource.com/api/v1/free/point';

class MeteosourceApiService {
  constructor() {
    this.apiKey = METEOSOURCE_API_KEY;
  }

  async makeRequest(placeId = 'kigali', sections = 'all') {
    try {
      const url = new URL(METEOSOURCE_BASE_URL);
      url.searchParams.append('place_id', placeId);
      url.searchParams.append('sections', sections);
      url.searchParams.append('timezone', 'Africa/Kigali');
      url.searchParams.append('language', 'en');
      url.searchParams.append('units', 'metric');
      url.searchParams.append('key', this.apiKey);

      const response = await fetch(url.toString(), { 
        cache: 'no-store' // Avoid caching for real-time data
      });
      
      if (!response.ok) {
        throw new Error(`Meteosource API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Meteosource API request failed:', error);
      throw error;
    }
  }

  // Get current weather for Kigali
  async getCurrentWeather(placeId = 'kigali') {
    const data = await this.makeRequest(placeId, 'current');
    return this.formatCurrentWeather(data);
  }

  // Get hourly forecast for Kigali
  async getHourlyForecast(placeId = 'kigali', hours = 24) {
    const data = await this.makeRequest(placeId, 'hourly');
    return this.formatHourlyForecast(data, hours);
  }

  // Get daily forecast for Kigali
  async getDailyForecast(placeId = 'kigali', days = 7) {
    const data = await this.makeRequest(placeId, 'daily');
    return this.formatDailyForecast(data, days);
  }

  // Get complete weather data (current + hourly + daily)
  async getCompleteWeatherData(placeId = 'kigali') {
    // Request all sections: current, hourly, and daily
    const data = await this.makeRequest(placeId, 'current,hourly,daily');
    return this.formatCompleteWeatherData(data);
  }

  // Format current weather data
  formatCurrentWeather(data) {
    if (!data || !data.current) {
      throw new Error('Invalid weather data received from API');
    }

    const current = data.current;
    return {
      temperature: Math.round(current.temperature),
      summary: current.summary,
      humidity: current.humidity ? Math.round(current.humidity * 100) : 0,
      windSpeed: current.wind ? Math.round(current.wind.speed * 3.6) : 0, // Convert m/s to km/h
      windDirection: current.wind ? current.wind.angle : 0,
      windDir: current.wind ? current.wind.dir : 'N',
      pressure: current.pressure || 1013,
      cloudCover: Math.round(current.cloud_cover || 0),
      precipitation: current.precipitation ? current.precipitation.total : 0,
      precipitationType: current.precipitation ? current.precipitation.type : 'none',
      icon: current.icon,
      iconNum: current.icon_num,
      date: new Date()
    };
  }

  // Format hourly forecast data
  formatHourlyForecast(data, hours = 24) {
    if (!data || !data.hourly || !data.hourly.data) {
      throw new Error('Invalid hourly forecast data received from API');
    }

    return data.hourly.data.slice(0, hours).map(hour => ({
      time: new Date(hour.date),
      temperature: Math.round(hour.temperature),
      summary: hour.summary,
      weather: hour.weather,
      icon: hour.icon,
      windSpeed: Math.round(hour.wind.speed * 3.6), // Convert m/s to km/h
      windDir: hour.wind.dir,
      windAngle: hour.wind.angle,
      precipitation: hour.precipitation?.total || 0,
      precipitationType: hour.precipitation?.type || 'none',
      cloudCover: Math.round(hour.cloud_cover?.total || 0)
    }));
  }

  // Format daily forecast data
  formatDailyForecast(data, days = 7) {
    if (!data || !data.daily || !data.daily.data) {
      throw new Error('Invalid daily forecast data received from API');
    }

    return data.daily.data.slice(0, days).map(day => ({
      date: new Date(day.day),
      temperature: {
        max: Math.round(day.all_day.temperature_max),
        min: Math.round(day.all_day.temperature_min),
        day: Math.round(day.all_day.temperature)
      },
      summary: day.summary, // Use the main day summary
      weather: day.weather,
      icon: day.icon,
      windSpeed: Math.round(day.all_day.wind.speed * 3.6), // Convert m/s to km/h
      windDir: day.all_day.wind.dir,
      windAngle: day.all_day.wind.angle,
      precipitation: day.all_day.precipitation?.total || 0,
      precipitationType: day.all_day.precipitation?.type || 'none',
      cloudCover: Math.round(day.all_day.cloud_cover?.total || 0),
      // Note: sunrise/sunset not available in this API response
      sunrise: new Date(new Date(day.day).getTime() + 6 * 60 * 60 * 1000), // Mock sunrise
      sunset: new Date(new Date(day.day).getTime() + 18 * 60 * 60 * 1000)  // Mock sunset
    }));
  }

  // Format complete weather data
  formatCompleteWeatherData(data) {
    return {
      current: this.formatCurrentWeather(data),
      hourly: this.formatHourlyForecast(data, 8), // Next 8 hours
      daily: this.formatDailyForecast(data, 7), // Next 7 days
      location: {
        name: data.place?.name || 'Kigali',
        country: data.place?.country || 'Rwanda',
        lat: data.lat,
        lon: data.lon,
        elevation: data.elevation,
        timezone: data.timezone
      }
    };
  }


  // Get weather icon based on summary
  getWeatherIcon(summary) {
    const summaryLower = summary.toLowerCase();
    if (summaryLower.includes('clear') || summaryLower.includes('sunny')) {
      return '☀️';
    } else if (summaryLower.includes('cloudy') || summaryLower.includes('overcast')) {
      return '☁️';
    } else if (summaryLower.includes('rain') || summaryLower.includes('drizzle')) {
      return '🌧️';
    } else if (summaryLower.includes('storm') || summaryLower.includes('thunder')) {
      return '⛈️';
    } else if (summaryLower.includes('snow')) {
      return '❄️';
    } else if (summaryLower.includes('fog') || summaryLower.includes('mist')) {
      return '🌫️';
    } else {
      return '🌤️';
    }
  }
}

// Create and export a singleton instance
const meteosourceApiService = new MeteosourceApiService();
export default meteosourceApiService;
