import { API_BASE_URL } from '@/config/api';

/**
 * Get AI suggestions for a farmer based on their farm data
 */
export async function getFarmerSuggestions(farmData: any, weatherData: any, ndviData: any) {
  try {
    const response = await fetch(`${API_BASE_URL}/ai-insights/farmer-suggestions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        farmData,
        weatherData,
        ndviData,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch AI insights');
    }

    const result = await response.json();
    return result.data; // The insights text
  } catch (error) {
    console.error('AI Insights API Error:', error);
    return null;
  }
}

/**
 * Get AI risk analysis for a claim
 */
export async function getRiskAnalysis(claimData: any, farmData: any, satelliteData: any) {
  try {
    const response = await fetch(`${API_BASE_URL}/ai-insights/risk-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        claimData,
        farmData,
        satelliteData,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch risk analysis');
    }

    const result = await response.json();
    return result.data; // The structured JSON
  } catch (error) {
    console.error('AI Risk Analysis Error:', error);
    return null;
  }
}

/**
 * Get AI monitoring cycle analysis
 */
export async function getMonitoringCycle(farmData: any, historicalNdvi: any[], historicalWeather: any[]) {
  try {
    const response = await fetch(`${API_BASE_URL}/ai-insights/monitoring-cycle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        farmData,
        historicalNdvi,
        historicalWeather,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch monitoring cycle analysis');
    }

    const result = await response.json();
    return result.data; // The structured JSON with cycle info
  } catch (error) {
    console.error('AI Monitoring Cycle Error:', error);
    return null;
  }
}
