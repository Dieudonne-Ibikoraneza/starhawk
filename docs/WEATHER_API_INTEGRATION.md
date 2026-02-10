# Weather API Integration

This document describes the integration of the OpenWeatherMap API into the agricultural insurance dashboard system.

## Overview

The Weather API provides real-time weather data and 30-day forecasts for agricultural risk assessment. This integration helps assessors make informed decisions about crop conditions and weather-related risks.

## API Details

- **Base URL**: `https://pro.openweathermap.org/data/2.5`
- **API Key**: `57597fe905d9cf20935ebb3140ba7783`
- **Features**: 30-day weather forecast, current weather, weather icons

## Files Created

### 1. Weather API Service (`src/services/weatherApi.js`)
- Centralized service for all weather API calls
- Handles authentication and error management
- Provides methods for weather forecasts and current weather
- Includes data formatting and utility functions

### 2. Weather Forecast Component (`src/components/common/WeatherForecast.tsx`)
- React component for displaying weather data
- Shows 7-day forecast with detailed information
- Interactive day selection
- Weather icons and descriptions
- Responsive design with loading states

### 3. Updated Components
- **Assessor Dashboard**: Added weather forecast at the top of the dashboard

## API Methods

### `getWeatherForecast(latitude, longitude, days)`
Returns weather forecast for specific coordinates.

**Parameters:**
- `latitude` (number): Latitude coordinate
- `longitude` (number): Longitude coordinate
- `days` (number): Number of days (1-30, default: 7)

### `getWeatherForecastByCity(cityName, countryCode, days)`
Returns weather forecast for a specific city.

**Parameters:**
- `cityName` (string): Name of the city
- `countryCode` (string, optional): ISO country code
- `days` (number): Number of days (1-30, default: 7)

### `getRwandaWeatherForecast(days)`
Returns weather forecast for Rwanda (using Kigali coordinates).

**Parameters:**
- `days` (number): Number of days (1-30, default: 7)

### `getCurrentWeather(latitude, longitude)`
Returns current weather conditions for specific coordinates.

### `getCurrentWeatherByCity(cityName, countryCode)`
Returns current weather conditions for a specific city.

### `formatWeatherData(weatherData)`
Formats raw API response into a structured format for display.

### `getWeatherIconUrl(iconCode)`
Returns the URL for weather icons.

### `getWeatherDescription(weather)`
Returns formatted weather description with emojis.

## Usage Examples

### Basic Weather Forecast

```javascript
import weatherApiService from '@/services/weatherApi';

// Get 7-day forecast for Rwanda
const weatherData = await weatherApiService.getRwandaWeatherForecast(7);
const formattedData = weatherApiService.formatWeatherData(weatherData);
```

### Using Weather Forecast Component

```jsx
import WeatherForecast from '@/components/common/WeatherForecast';

function MyComponent() {
  return (
    <WeatherForecast 
      days={7}
      showDetails={true}
      className="my-weather-card"
    />
  );
}
```

### Get Weather by Coordinates

```javascript
// Get weather for specific coordinates
const weatherData = await weatherApiService.getWeatherForecast(
  -1.9441, // Kigali latitude
  30.0619, // Kigali longitude
  5        // 5 days
);
```

## Weather Data Structure

The formatted weather data includes:

```javascript
{
  city: {
    name: "Kigali",
    country: "RW"
  },
  forecast: [
    {
      date: Date,
      temperature: {
        day: 25,
        min: 18,
        max: 28,
        night: 20,
        morning: 22,
        evening: 26
      },
      feelsLike: {
        day: 27,
        night: 22,
        morning: 24,
        evening: 28
      },
      weather: {
        main: "Clear",
        description: "clear sky",
        icon: "01d"
      },
      pressure: 1013,
      humidity: 65,
      windSpeed: 3.2,
      windDirection: 180,
      clouds: 10,
      rain: 0,
      snow: 0,
      sunrise: Date,
      sunset: Date
    }
  ]
}
```

## Weather Icons

The component uses Lucide React icons for weather conditions:
- ☀️ Clear: `Sun` icon
- ☁️ Cloudy: `Cloud` icon
- 🌧️ Rainy: `CloudRain` icon
- ❄️ Snowy: `CloudSnow` icon
- ⛈️ Thunderstorm: `Zap` icon

## Features

### Weather Forecast Component
- **7-Day Forecast**: Shows upcoming weather conditions
- **Interactive Selection**: Click on any day to see details
- **Weather Icons**: Visual representation of weather conditions
- **Temperature Range**: High and low temperatures for each day
- **Weather Details**: Humidity, wind speed, pressure, etc.
- **Sun Times**: Sunrise and sunset information
- **Loading States**: Shows loading spinner while fetching data
- **Error Handling**: Graceful error handling with retry option

### Responsive Design
- Mobile-friendly layout
- Adaptive grid system
- Touch-friendly interactions

## Error Handling

All API methods include comprehensive error handling:
- Network errors are caught and logged
- API errors return meaningful messages
- Component shows error states with retry options
- Fallback data when API is unavailable

## Performance Considerations

- API calls are made only when needed
- Loading states prevent multiple simultaneous calls
- Data is cached in component state
- Efficient re-rendering with React hooks

## Agricultural Benefits

### Risk Assessment
- **Weather Patterns**: Identify weather trends for risk assessment
- **Crop Planning**: Plan planting and harvesting based on weather
- **Disease Prevention**: Monitor humidity and temperature for disease risks
- **Irrigation Planning**: Use rainfall data for irrigation decisions

### Insurance Applications
- **Weather Claims**: Verify weather conditions for insurance claims
- **Risk Evaluation**: Assess weather-related risks for policies
- **Seasonal Planning**: Plan for seasonal weather variations

## Future Enhancements

1. **Historical Data**: Add historical weather data for trend analysis
2. **Weather Alerts**: Implement weather alerts and notifications
3. **Multiple Locations**: Support weather for multiple farm locations
4. **Weather Maps**: Add interactive weather maps
5. **Crop-Specific Data**: Include crop-specific weather recommendations

## Testing

The integration includes example usage in `src/examples/WeatherApiExample.js` that demonstrates all API methods and component usage.

## Security Notes

- API key is stored in the service file (consider environment variables for production)
- All API calls are made over HTTPS
- No sensitive data is stored locally
- API key should be rotated regularly

## Troubleshooting

### Common Issues

1. **API Key Issues**: Ensure the OpenWeatherMap API key is valid and active
2. **Network Errors**: Check internet connection and API availability
3. **Component Not Loading**: Verify all imports are correct
4. **Weather Data Not Showing**: Check if the API service is properly initialized

### Debug Mode

Enable debug logging by setting `console.log` statements in the API service methods to track API calls and responses.

## API Rate Limits

- Free tier: 1,000 calls per day
- Pro tier: 1,000,000 calls per month
- Monitor usage to avoid rate limiting

## Weather Data Accuracy

- Data is provided by OpenWeatherMap
- Updates every 3 hours for forecasts
- Real-time data for current weather
- Accuracy may vary by location
