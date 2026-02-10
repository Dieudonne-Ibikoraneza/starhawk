// API route for weather data
import meteosourceApiService from '../../services/meteosourceApi';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { city = 'kigali' } = req.query;
    
    // Get complete weather data
    const weatherData = await meteosourceApiService.getCompleteWeatherData(city);
    
    res.status(200).json({
      success: true,
      data: weatherData
    });
  } catch (error) {
    console.error('Weather API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch weather data',
      message: error.message
    });
  }
}
