// Example usage of Weather API Service
import weatherApiService from '../services/weatherApi';

// Example: Get weather forecast for Rwanda (Kigali)
async function getRwandaWeatherForecast() {
  try {
    const data = await weatherApiService.getRwandaWeatherForecast(7);
    const formattedData = weatherApiService.formatWeatherData(data);
    console.log('Rwanda Weather Forecast:', formattedData);
    return formattedData;
  } catch (error) {
    console.error('Error fetching Rwanda weather:', error);
  }
}

// Example: Get weather forecast by coordinates
async function getWeatherByCoordinates(lat, lon) {
  try {
    const data = await weatherApiService.getWeatherForecast(lat, lon, 5);
    const formattedData = weatherApiService.formatWeatherData(data);
    console.log('Weather by coordinates:', formattedData);
    return formattedData;
  } catch (error) {
    console.error('Error fetching weather by coordinates:', error);
  }
}

// Example: Get weather forecast by city name
async function getWeatherByCity(cityName, countryCode = '') {
  try {
    const data = await weatherApiService.getWeatherForecastByCity(cityName, countryCode, 5);
    const formattedData = weatherApiService.formatWeatherData(data);
    console.log('Weather by city:', formattedData);
    return formattedData;
  } catch (error) {
    console.error('Error fetching weather by city:', error);
  }
}

// Example: Get current weather
async function getCurrentWeather(lat, lon) {
  try {
    const data = await weatherApiService.getCurrentWeather(lat, lon);
    console.log('Current weather:', data);
    return data;
  } catch (error) {
    console.error('Error fetching current weather:', error);
  }
}

// Example: Get weather icon URL
function getWeatherIcon(iconCode) {
  const iconUrl = weatherApiService.getWeatherIconUrl(iconCode);
  console.log('Weather icon URL:', iconUrl);
  return iconUrl;
}

// Example: Get weather description with emoji
function getWeatherDescription(weather) {
  const description = weatherApiService.getWeatherDescription(weather);
  console.log('Weather description:', description);
  return description;
}

// Example usage
export async function runWeatherExamples() {
  console.log('=== Weather API Examples ===');
  
  // Get Rwanda weather forecast
  await getRwandaWeatherForecast();
  
  // Get weather for specific coordinates (Kigali, Rwanda)
  await getWeatherByCoordinates(-1.9441, 30.0619);
  
  // Get weather for a specific city
  await getWeatherByCity('Kigali', 'RW');
  
  // Get current weather
  await getCurrentWeather(-1.9441, 30.0619);
  
  // Get weather icon and description
  const sampleWeather = {
    main: 'Clear',
    description: 'clear sky',
    icon: '01d'
  };
  
  getWeatherIcon(sampleWeather.icon);
  getWeatherDescription(sampleWeather);
}

// Export individual functions for use in components
export {
  getRwandaWeatherForecast,
  getWeatherByCoordinates,
  getWeatherByCity,
  getCurrentWeather,
  getWeatherIcon,
  getWeatherDescription
};
