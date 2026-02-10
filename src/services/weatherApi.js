// OpenWeatherMap API Service
const WEATHER_API_KEY = '57597fe905d9cf20935ebb3140ba7783';
const WEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

class WeatherApiService {
  constructor() {
    this.apiKey = WEATHER_API_KEY;
  }

  async makeRequest(endpoint, params = {}) {
    try {
      const url = new URL(`${WEATHER_BASE_URL}${endpoint}`);
      url.searchParams.append('appid', this.apiKey);
      
      // Add additional parameters
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value);
        }
      });

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Weather API request failed:', error);
      throw error;
    }
  }

  // Get 5-day weather forecast by coordinates (free API)
  async getWeatherForecast(latitude, longitude, days = 7) {
    const params = {
      lat: latitude,
      lon: longitude,
      units: 'metric', // Use Celsius
      lang: 'en'
    };

    // Use the free 5-day forecast endpoint
    return this.makeRequest('/forecast', params);
  }

  // Get weather forecast by city name
  async getWeatherForecastByCity(cityName, countryCode = '', days = 7) {
    const params = {
      q: countryCode ? `${cityName},${countryCode}` : cityName,
      cnt: Math.min(days, 30),
      units: 'metric',
      lang: 'en'
    };

    return this.makeRequest('/forecast/climate', params);
  }

  // Get current weather by coordinates
  async getCurrentWeather(latitude, longitude) {
    const params = {
      lat: latitude,
      lon: longitude,
      units: 'metric',
      lang: 'en'
    };

    return this.makeRequest('/weather', params);
  }

  // Get current weather by city name
  async getCurrentWeatherByCity(cityName, countryCode = '') {
    const params = {
      q: countryCode ? `${cityName},${countryCode}` : cityName,
      units: 'metric',
      lang: 'en'
    };

    return this.makeRequest('/weather', params);
  }

  // Get weather forecast for Rwanda (using Kigali coordinates as default)
  async getRwandaWeatherForecast(days = 7) {
    try {
      // Kigali, Rwanda coordinates
      const kigaliLat = -1.9441;
      const kigaliLon = 30.0619;
      
      // Try the free API first
      const data = await this.getWeatherForecast(kigaliLat, kigaliLon, days);
      return data;
    } catch (error) {
      console.warn('Weather API not available, using mock data:', error);
      // Return mock weather data if API fails
      return this.getMockWeatherData(days);
    }
  }

  // Mock weather data for development
  getMockWeatherData(days = 7) {
    const mockData = {
      cod: "200",
      city: {
        id: 1835848,
        name: "Kigali",
        coord: {
          lon: 30.0619,
          lat: -1.9441
        },
        country: "RW"
      },
      message: 0.353472054,
      list: []
    };

    // Generate mock data for the specified number of days
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      mockData.list.push({
        dt: Math.floor(date.getTime() / 1000),
        sunrise: Math.floor((date.getTime() + 6 * 60 * 60 * 1000) / 1000), // 6 AM
        sunset: Math.floor((date.getTime() + 18 * 60 * 60 * 1000) / 1000), // 6 PM
        temp: {
          day: 25 + Math.random() * 5,
          min: 18 + Math.random() * 3,
          max: 28 + Math.random() * 4,
          night: 20 + Math.random() * 3,
          eve: 26 + Math.random() * 3,
          morn: 22 + Math.random() * 3
        },
        feels_like: {
          day: 27 + Math.random() * 3,
          night: 22 + Math.random() * 2,
          eve: 28 + Math.random() * 2,
          morn: 24 + Math.random() * 2
        },
        pressure: 1013 + Math.random() * 10,
        humidity: 60 + Math.random() * 20,
        weather: [
          {
            id: 800,
            main: "Clear",
            description: "clear sky",
            icon: "01d"
          }
        ],
        speed: 2 + Math.random() * 3,
        deg: Math.random() * 360,
        clouds: Math.random() * 30,
        rain: Math.random() * 5,
        snow: 0
      });
    }

    return mockData;
  }

  // Format weather data for display
  formatWeatherData(weatherData) {
    if (!weatherData || !weatherData.list) {
      return null;
    }

    // Group 3-hourly forecasts by day
    const dailyForecasts = {};
    
    weatherData.list.forEach(item => {
      const date = new Date(item.dt * 1000);
      const dayKey = date.toDateString();
      
      if (!dailyForecasts[dayKey]) {
        dailyForecasts[dayKey] = {
          date: date,
          temperatures: [],
          weather: item.weather[0],
          pressures: [],
          humidities: [],
          windSpeeds: [],
          clouds: [],
          rain: 0,
          snow: 0
        };
      }
      
      dailyForecasts[dayKey].temperatures.push(item.main.temp);
      dailyForecasts[dayKey].pressures.push(item.main.pressure);
      dailyForecasts[dayKey].humidities.push(item.main.humidity);
      dailyForecasts[dayKey].windSpeeds.push(item.wind.speed);
      dailyForecasts[dayKey].clouds.push(item.clouds.all);
      
      if (item.rain && item.rain['3h']) {
        dailyForecasts[dayKey].rain += item.rain['3h'];
      }
      if (item.snow && item.snow['3h']) {
        dailyForecasts[dayKey].snow += item.snow['3h'];
      }
    });

    // Convert to array and calculate daily averages
    const forecast = Object.values(dailyForecasts).map(day => {
      const temps = day.temperatures;
      const pressures = day.pressures;
      const humidities = day.humidities;
      const windSpeeds = day.windSpeeds;
      const clouds = day.clouds;
      
      return {
        date: day.date,
        temperature: {
          day: Math.round(temps.reduce((a, b) => a + b, 0) / temps.length),
          min: Math.round(Math.min(...temps)),
          max: Math.round(Math.max(...temps)),
          night: Math.round(temps[temps.length - 1] || temps[0]),
          morning: Math.round(temps[0]),
          evening: Math.round(temps[Math.floor(temps.length / 2)])
        },
        feelsLike: {
          day: Math.round(temps.reduce((a, b) => a + b, 0) / temps.length),
          night: Math.round(temps[temps.length - 1] || temps[0]),
          morning: Math.round(temps[0]),
          evening: Math.round(temps[Math.floor(temps.length / 2)])
        },
        weather: {
          main: day.weather.main,
          description: day.weather.description,
          icon: day.weather.icon
        },
        pressure: Math.round(pressures.reduce((a, b) => a + b, 0) / pressures.length),
        humidity: Math.round(humidities.reduce((a, b) => a + b, 0) / humidities.length),
        windSpeed: Math.round((windSpeeds.reduce((a, b) => a + b, 0) / windSpeeds.length) * 10) / 10,
        windDirection: 0, // Not available in 5-day forecast
        clouds: Math.round(clouds.reduce((a, b) => a + b, 0) / clouds.length),
        rain: Math.round(day.rain * 10) / 10,
        snow: Math.round(day.snow * 10) / 10,
        sunrise: new Date(day.date.getTime() + 6 * 60 * 60 * 1000), // Mock sunrise
        sunset: new Date(day.date.getTime() + 18 * 60 * 60 * 1000)  // Mock sunset
      };
    });

    return {
      city: weatherData.city,
      forecast: forecast.slice(0, 7) // Limit to 7 days
    };
  }

  // Get weather icon URL
  getWeatherIconUrl(iconCode) {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  }

  // Get weather description with emoji
  getWeatherDescription(weather) {
    const descriptions = {
      'Clear': '☀️ Clear',
      'Clouds': '☁️ Cloudy',
      'Rain': '🌧️ Rainy',
      'Snow': '❄️ Snowy',
      'Thunderstorm': '⛈️ Thunderstorm',
      'Drizzle': '🌦️ Drizzle',
      'Mist': '🌫️ Misty',
      'Fog': '🌫️ Foggy',
      'Haze': '🌫️ Hazy',
      'Dust': '🌪️ Dusty',
      'Sand': '🌪️ Sandy',
      'Ash': '🌋 Ash',
      'Squall': '💨 Squall',
      'Tornado': '🌪️ Tornado'
    };

    return descriptions[weather.main] || `🌤️ ${weather.description}`;
  }
}

// Create and export a singleton instance
const weatherApiService = new WeatherApiService();
export default weatherApiService;
