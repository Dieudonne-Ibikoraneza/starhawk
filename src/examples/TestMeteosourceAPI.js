// Test script to verify Meteosource API integration
import meteosourceApiService from '../services/meteosourceApi';

async function testMeteosourceAPI() {
  console.log('=== Testing Meteosource API Integration ===');
  
  try {
    // Test complete weather data
    const data = await meteosourceApiService.getCompleteWeatherData('kigali');
    
    console.log('✅ API Response Structure:');
    console.log('Current Weather:', data.current);
    console.log('Hourly Forecast (first 3):', data.hourly.slice(0, 3));
    console.log('Daily Forecast (first 3):', data.daily.slice(0, 3));
    console.log('Location Info:', data.location);
    
    // Verify data structure
    console.log('\n✅ Data Validation:');
    console.log('Current temperature:', data.current.temperature, '°C');
    console.log('Current summary:', data.current.summary);
    console.log('Wind speed:', data.current.windSpeed, 'km/h');
    console.log('Wind direction:', data.current.windDir);
    console.log('Cloud cover:', data.current.cloudCover, '%');
    console.log('Precipitation:', data.current.precipitation, 'mm');
    console.log('Location coordinates:', data.location.lat, data.location.lon);
    console.log('Elevation:', data.location.elevation, 'm');
    
    return data;
  } catch (error) {
    console.error('❌ API Test Failed:', error);
    return null;
  }
}

// Run the test
export default testMeteosourceAPI;
