import { API_BASE_URL } from '@/config/api';

/**
 * Helper to unwrap nested data from backend
 */
function unwrap(result: any) {
  if (result.data && typeof result.data === 'object') {
    // If we have result.data.data, unwrap it
    if (result.data.data) {
      return result.data.data;
    }
    // If result.data is the actual object (like in GET), return it
    return result.data;
  }
  return result;
}

/**
 * Get AI suggestions for a farmer based on their farm data
 */
export async function getFarmerSuggestions(farmData: any, weatherData: any, ndviData: any) {
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
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to connect to AI engine');
  }

  const result = await response.json();
  return unwrap(result);
}

/**
 * Get AI risk analysis for a claim
 */
export async function getRiskAnalysis(claimData: any, farmData: any, satelliteData: any) {
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
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to connect to AI engine');
  }

  const result = await response.json();
  return unwrap(result);
}

/**
 * Get AI monitoring cycle analysis
 */
export async function getMonitoringCycle(farmData: any, historicalNdvi: any[], historicalWeather: any[]) {
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
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to connect to AI engine');
  }

  const result = await response.json();
  return unwrap(result);
}

/**
 * Send a follow-up message in an AI conversation
 */
export async function followUpChat(insightId: string, message: string) {
  const response = await fetch(`${API_BASE_URL}/ai-insights/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      insightId,
      message,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to send message to AI');
  }

  const result = await response.json();
  return unwrap(result);
}

/**
 * Fetch an existing AI insight if it exists
 */
export async function getInsight(contextId: string, type: 'FARMER_ADVICE' | 'RISK_ANALYSIS' | 'MONITORING_CYCLE') {
  try {
    const response = await fetch(`${API_BASE_URL}/ai-insights/${contextId}/${type}`);
    if (!response.ok) return null;
    const result = await response.json();
    return unwrap(result);
  } catch (error) {
    console.error(`Failed to fetch AI insight for ${contextId}:`, error);
    return null;
  }
}
