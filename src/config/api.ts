// API Configuration
// Base URL for all API endpoints
// In development, use relative path to go through Vite proxy (avoids CORS)
// In production, use full URL
export const API_BASE_URL = import.meta.env.DEV
  ? '/api/v1' // Use proxy in development
  : 'https://starhawk-backend-agriplatform-a39f.onrender.com/api/v1'; // Full URL in production

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
  },
  
  // Farms
  FARMS: {
    BASE: '/farms',
    BY_ID: (id: string) => `/farms/${id}`,
    UPLOAD_SHAPEFILE: '/farms/upload-shapefile',
    UPLOAD_KML: '/farms/upload-kml',
    INSURANCE_REQUESTS: '/farms/insurance-requests',
    WEATHER_FORECAST: (id: string) => `/farms/${id}/weather/forecast`,
    WEATHER_HISTORICAL: (id: string) => `/farms/${id}/weather/historical`,
    WEATHER_ACCUMULATED: (id: string) => `/farms/${id}/weather/accumulated`,
    INDICES_STATISTICS: (id: string) => `/farms/${id}/indices/statistics`,
    INDICES_NDVI: (id: string) => `/farms/${id}/indices/ndvi`,
    INDICES_TREND: (id: string) => `/farms/${id}/indices/trend`,
  },
  
  // Assessments
  ASSESSMENTS: {
    BASE: '/assessments',
    BY_ID: (id: string) => `/assessments/${id}`,
    CALCULATE_RISK: (id: string) => `/assessments/${id}/calculate-risk`,
    SUBMIT: (id: string) => `/assessments/${id}/submit`,
  },
  
  // Policies
  POLICIES: {
    BASE: '/policies',
    BY_ID: (id: string) => `/policies/${id}`,
  },
  
  // Claims
  CLAIMS: {
    BASE: '/claims',
    BY_ID: (id: string) => `/claims/${id}`,
    ASSIGN: (id: string) => `/claims/${id}/assign`,
    ASSESSMENT: (id: string) => `/claims/${id}/assessment`,
    SUBMIT_ASSESSMENT: (id: string) => `/claims/${id}/submit-assessment`,
    APPROVE: (id: string) => `/claims/${id}/approve`,
    REJECT: (id: string) => `/claims/${id}/reject`,
  },
  
  // Photos
  PHOTOS: {
    UPLOAD: '/photos/upload',
    BY_ID: (id: string) => `/photos/${id}`,
    BY_ENTITY: (entityId: string) => `/photos/entity/${entityId}`,
  },
  
  // Monitoring
  MONITORING: {
    FARM: (farmId: string) => `/monitoring/farms/${farmId}`,
    ALERTS: '/monitoring/alerts',
    ALERTS_BY_FARM: (farmId: string) => `/monitoring/alerts/${farmId}`,
    MARK_ALERT_READ: (alertId: string) => `/monitoring/alerts/${alertId}/read`,
  },
  
  // Crop Monitoring
  CROP_MONITORING: {
    BASE: '/crop-monitoring',
    START: '/crop-monitoring/start',
    BY_ID: (id: string) => `/crop-monitoring/${id}`,
    GENERATE_REPORT: (id: string) => `/crop-monitoring/${id}/generate-report`,
  },
  
  // Admin
  ADMIN: {
    STATISTICS: '/admin/statistics',
    POLICIES_OVERVIEW: '/admin/policies/overview',
    CLAIMS_STATISTICS: '/admin/claims/statistics',
  },
};

// Helper function to get full URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

// Helper function to get auth token
export const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

// Helper function to set auth headers
export const getAuthHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return headers;
};

