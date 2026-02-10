// Example usage of Meteosource Weather API Service
import meteosourceApiService from '../services/meteosourceApi';

// Example: Get current weather for Kigali
async function getCurrentWeather() {
  try {
    const data = await meteosourceApiService.getCurrentWeather('kigali');
    console.log('Current Weather in Kigali:', data);
    return data;
  } catch (error) {
    console.error('Error fetching current weather:', error);
  }
}

// Example: Get 7-day forecast for Kigali
async function getDailyForecast() {
  try {
    const data = await meteosourceApiService.getDailyForecast('kigali', 7);
    console.log('7-Day Forecast for Kigali:', data);
    return data;
  } catch (error) {
    console.error('Error fetching daily forecast:', error);
  }
}

// Example: Get complete weather data
async function getCompleteWeather() {
  try {
    const data = await meteosourceApiService.getCompleteWeatherData('kigali');
    console.log('Complete Weather Data for Kigali:', data);
    return data;
  } catch (error) {
    console.error('Error fetching complete weather data:', error);
  }
}

// Example: Get weather for different cities
async function getWeatherForCity(cityName) {
  try {
    const data = await meteosourceApiService.getCompleteWeatherData(cityName);
    console.log(`Weather for ${cityName}:`, data);
    return data;
  } catch (error) {
    console.error(`Error fetching weather for ${cityName}:`, error);
  }
}

// Example usage
export async function runMeteosourceExamples() {
  console.log('=== Meteosource Weather API Examples ===');
  
  // Get current weather
  await getCurrentWeather();
  
  // Get 7-day forecast
  await getDailyForecast();
  
  // Get complete weather data
  await getCompleteWeather();
  
  // Get weather for different cities
  await getWeatherForCity('kigali');
  await getWeatherForCity('musanze');
  await getWeatherForCity('huye');
}

// Export individual functions for use in components
export {
  getCurrentWeather,
  getDailyForecast,
  getCompleteWeather,
  getWeatherForCity
};
