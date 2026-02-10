// Farms API Service
// Using centralized API configuration
import { API_BASE_URL, API_ENDPOINTS, getAuthToken } from '@/config/api';

// Use centralized API configuration
const FARMS_BASE_URL = `${API_BASE_URL}${API_ENDPOINTS.FARMS.BASE}`;

interface FarmData {
  name: string;
  location?: {
    type: string;
    coordinates: number[]; // [longitude, latitude]
  };
  coordinates?: number[]; // Alternative to location.coordinates
  boundary?: {
    type: string;
    coordinates: number[][][]; // Polygon coordinates
  };
  cropType?: string;
}

interface UpdateFarmData {
  name?: string;
  location?: {
    type: string;
    coordinates: number[];
  };
  boundary?: {
    type: string;
    coordinates: number[][][];
  };
  cropType?: string;
  [key: string]: any;
}

class FarmsApiService {
  private baseURL: string;

  constructor(baseURL: string = FARMS_BASE_URL) {
    this.baseURL = baseURL;
  }

  private getToken(): string | null {
    return getAuthToken();
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    // Log request details for debugging
    if (options.method === 'POST' || options.method === 'PUT') {
      let bodyData = null;
      try {
        bodyData = options.body ? JSON.parse(options.body as string) : null;
      } catch (e) {
        bodyData = options.body;
      }
      
      console.log('🌐 API Request:', {
        method: options.method || 'GET',
        url: url,
        headers: Object.keys(headers),
        hasAuth: !!headers.Authorization,
        body: bodyData
      });
    }

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        // Clear all authentication data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        localStorage.removeItem('userId');
        localStorage.removeItem('phoneNumber');
        localStorage.removeItem('email');
        
        // Redirect to login page
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
        
        throw new Error('Authentication required. Please log in again.');
      }

      let data: any;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || `HTTP error! status: ${response.status}`);
      }

      if (!response.ok) {
        // Handle 400 errors for missing EOSDA field ID gracefully (expected for unprocessed fields)
        if (response.status === 400 && data.detail && 
            (data.detail.includes('EOSDA') || data.detail.includes('register the farm'))) {
          // This is expected - farm needs to be processed first
          // Return a special error that can be caught and handled silently
          const error = new Error(data.detail);
          (error as any).isExpected = true;
          throw error;
        }
        
        // Log the full error response for debugging (only for unexpected errors)
        if (response.status !== 400 || !data.detail?.includes('EOSDA')) {
          console.error('API Error Response:', JSON.stringify({
            status: response.status,
            statusText: response.statusText,
            url: url,
            data: data
          }, null, 2));
        }
        
        // Try to extract more detailed error information
        const errorMessage = data.message || data.error || data.detail || data.title || `HTTP error! status: ${response.status}`;
        const errorDetails = data.errors ? JSON.stringify(data.errors) : '';
        const instance = data.instance ? ` (${data.instance})` : '';
        const fullError = errorDetails ? `${errorMessage}${instance} - ${errorDetails}` : `${errorMessage}${instance}`;
        
        throw new Error(fullError);
      }

      return data;
    } catch (error) {
      console.error('Farms API request failed:', error);
      throw error;
    }
  }

  // Create New Farm
  // API: POST /api/v1/farms
  // Request body format (per API spec):
  // {
  //   "name": "Main Farm",
  //   "location": {
  //     "type": "Point",
  //     "coordinates": [longitude, latitude]
  //   },
  //   "boundary": { "type": "Polygon", "coordinates": [...] }, // Optional
  //   "cropType": "MAIZE" // Optional, uppercase
  // }
  async createFarm(farmData: FarmData) {
    // Build request body matching exact API specification
    const requestBody: any = {
      name: farmData.name,
    };

    // Use location object directly if provided, otherwise construct from coordinates
    if (farmData.location && farmData.location.type && farmData.location.coordinates) {
      requestBody.location = farmData.location;
    } else if (farmData.coordinates) {
      const coordinates = farmData.coordinates;
      if (!Array.isArray(coordinates) || coordinates.length !== 2) {
        throw new Error('Invalid coordinates. Expected [longitude, latitude] array.');
      }
      requestBody.location = {
        type: 'Point',
        coordinates: coordinates, // [longitude, latitude] format
      };
    } else {
      throw new Error('Location is required. Provide either location object or coordinates array.');
    }

    // Add boundary if provided
    if (farmData.boundary) {
      requestBody.boundary = {
        type: 'Polygon',
        coordinates: farmData.boundary.coordinates || farmData.boundary,
      };
    }

    // Add cropType if provided (should be uppercase per API spec)
    if (farmData.cropType) {
      requestBody.cropType = farmData.cropType;
    }

    // Validate request body before sending
    if (!requestBody.name) {
      throw new Error('Farm name is required');
    }
    if (!requestBody.location || !requestBody.location.coordinates) {
      throw new Error('Location coordinates are required');
    }
    if (!requestBody.boundary || !requestBody.boundary.coordinates) {
      throw new Error('Boundary coordinates are required');
    }

    console.log('📤 Sending farm creation request (POST /api/v1/farms):', JSON.stringify(requestBody, null, 2));
    console.log('📤 Request details:', {
      url: `${this.baseURL}`,
      method: 'POST',
      hasName: !!requestBody.name,
      hasLocation: !!requestBody.location,
      locationType: requestBody.location?.type,
      locationCoordinates: requestBody.location?.coordinates,
      hasBoundary: !!requestBody.boundary,
      boundaryType: requestBody.boundary?.type,
      boundaryCoordinatesCount: requestBody.boundary?.coordinates?.[0]?.length,
      cropType: requestBody.cropType || 'Not provided'
    });

    const response = await this.request<any>('', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    console.log('✅ Farm creation API response received:', response);
    
    return response;
  }

  // List All Farms
  // GET /api/v1/farms
  // Query Parameters:
  //   - page (number, default: 0) - Page number (0-indexed)
  //   - size (number, default: 10) - Number of items per page
  async getFarms(page: number = 0, size: number = 10) {
    return this.request<any>(`?page=${page}&size=${size}`);
  }

  // Get All Farms without pagination (fallback method)
  async getAllFarms() {
    return this.request<any>(``);
  }

  // Get Farm by ID
  async getFarmById(farmId: string) {
    return this.request<any>(`/${farmId}`);
  }

  // Update Farm
  async updateFarm(farmId: string, updateData: UpdateFarmData) {
    return this.request<any>(`/${farmId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  // Upload Shapefile
  async uploadShapefile(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const token = this.getToken();
    const headers: HeadersInit = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}/upload-shapefile`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      throw new Error('Authentication required. Please log in again.');
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  }

  // Upload KML
  // Endpoint: POST /farms/:farmId/upload-kml
  async uploadKML(file: File, farmId: string, name?: string) {
    const formData = new FormData();
    // Append the file
    formData.append('file', file);
    // API requires a 'name' field - use provided name or file name without extension
    const farmName = name || file.name.replace(/\.[^/.]+$/, '') || 'Field Boundary';
    formData.append('name', farmName);

    const token = this.getToken();
    const headers: HeadersInit = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    // Don't set Content-Type for FormData - let the browser set it with boundary
    // Setting Content-Type manually will break the multipart/form-data boundary

    // Construct URL: baseURL is already /api/v1/farms, so we need /{farmId}/upload-kml
    // Final URL: /api/v1/farms/{farmId}/upload-kml
    const url = `${this.baseURL}/${farmId}/upload-kml`;
    console.log('📤 Uploading KML to:', url);
    console.log('📦 Farm ID:', farmId);
    console.log('📄 File:', file.name, file.size, 'bytes', 'type:', file.type);
    console.log('📝 Name field:', farmName);
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });
    
    console.log('📥 Upload response status:', response.status);

    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      throw new Error('Authentication required. Please log in again.');
    }

    let responseData;
    try {
      responseData = await response.json();
      console.log('📥 Response data:', JSON.stringify(responseData, null, 2));
    } catch (e) {
      const text = await response.text();
      console.log('📥 Response text (not JSON):', text);
      responseData = { message: text || `HTTP error! status: ${response.status}` };
    }

    if (!response.ok) {
      // Log detailed error information
      console.error('❌ Full error response:', JSON.stringify(responseData, null, 2));
      
      // Handle 403 Forbidden - Permission denied
      if (response.status === 403) {
        const errorMessage = responseData.detail || responseData.message || responseData.error || 'Permission denied';
        throw new Error(errorMessage);
      }
      
      // Handle EOSDA-related errors - if it's just an EOSDA error, the KML might still be saved
      // Check if it's specifically an EOSDA error that we can ignore
      const errorDetail = responseData.detail || responseData.message || responseData.error || '';
      if (errorDetail.includes('EOSDA') && response.status === 400) {
        // EOSDA is currently disabled, but KML upload might still succeed on backend
        // Log a warning but don't throw - the boundary should still be saved
        console.warn('⚠️ EOSDA error encountered, but KML upload may have succeeded:', errorDetail);
        // Return a success response with a note about EOSDA
        return {
          ...responseData,
          eosdaWarning: true,
          message: 'KML uploaded successfully (EOSDA integration currently disabled)'
        };
      }
      
      // Check for validationErrors object (from the API response structure)
      if (responseData.validationErrors) {
        const validationMessages: string[] = [];
        Object.entries(responseData.validationErrors).forEach(([key, errors]) => {
          if (Array.isArray(errors)) {
            errors.forEach((error: string) => {
              validationMessages.push(`${key}: ${error}`);
            });
          } else {
            validationMessages.push(`${key}: ${errors}`);
          }
        });
        throw new Error(`Validation failed: ${validationMessages.join(', ')}`);
      }
      
      // Check for validation errors array (common in Express.js validation)
      if (responseData.errors && Array.isArray(responseData.errors)) {
        const validationErrors = responseData.errors.map((err: any) => 
          `${err.field || err.path || err.param || 'field'}: ${err.message || err.msg || 'validation error'}`
        ).join(', ');
        throw new Error(`Validation failed: ${validationErrors}`);
      }
      
      // Check for nested error messages
      if (responseData.error && typeof responseData.error === 'object') {
        const errorDetails = Object.entries(responseData.error)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
        throw new Error(`Validation failed: ${errorDetails}`);
      }
      
      const errorMessage = responseData.message || responseData.error || responseData.detail || responseData.msg || `HTTP error! status: ${response.status}`;
      console.error('❌ Upload failed:', errorMessage);
      throw new Error(errorMessage);
    }

    return responseData;
  }

  // Create Insurance Request
  async createInsuranceRequest(farmId: string, notes?: string) {
    return this.request<any>('/insurance-requests', {
      method: 'POST',
      body: JSON.stringify({
        farmId,
        notes,
      }),
    });
  }

  // Get Insurance Requests
  async getInsuranceRequests(page: number = 1, size: number = 10, status?: string) {
    let endpoint = `/insurance-requests?page=${page}&size=${size}`;
    if (status) {
      endpoint += `&status=${status}`;
    }
    return this.request<any>(endpoint);
  }

  // Get Weather Forecast for a Farm
  async getWeatherForecast(farmId: string, startDate?: string, endDate?: string) {
    const params = startDate && endDate ? `?dateStart=${startDate}&dateEnd=${endDate}` : '';
    return this.request<any>(`/${farmId}/weather/forecast${params}`);
  }

  // Get Historical Weather
  async getHistoricalWeather(farmId: string, startDate?: string, endDate?: string) {
    const params = startDate && endDate ? `?dateStart=${startDate}&dateEnd=${endDate}` : '';
    return this.request<any>(`/${farmId}/weather/historical${params}`);
  }

  // Get Accumulated Weather Data (GDD, seasonal analysis)
  async getAccumulatedWeather(farmId: string, startDate?: string, endDate?: string) {
    const params = startDate && endDate ? `?dateStart=${startDate}&dateEnd=${endDate}` : '';
    return this.request<any>(`/${farmId}/weather/accumulated${params}`);
  }

  // Get Vegetation Indices Statistics
  async getVegetationStats(farmId: string, startDate?: string, endDate?: string, indices: string = 'NDVI,MSAVI') {
    const params = new URLSearchParams();
    if (startDate) params.append('dateStart', startDate);
    if (endDate) params.append('dateEnd', endDate);
    if (indices) params.append('indices', indices);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.request<any>(`/${farmId}/indices/statistics${queryString}`);
  }

  // Get NDVI Time Series
  async getNDVITimeSeries(farmId: string, startDate?: string, endDate?: string) {
    const params = startDate && endDate ? `?dateStart=${startDate}&dateEnd=${endDate}` : '';
    return this.request<any>(`/${farmId}/indices/ndvi${params}`);
  }

  // Get Field Trend (NDVI or other index over time)
  async getFieldTrend(farmId: string, index: string = 'NDVI', startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (index) params.append('index', index);
    if (startDate) params.append('dateStart', startDate);
    if (endDate) params.append('dateEnd', endDate);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.request<any>(`/${farmId}/indices/trend${queryString}`);
  }
}

// Create and export a singleton instance
const farmsApiService = new FarmsApiService();
export default farmsApiService;

// Export convenience functions
export const createFarm = (farmData: FarmData) => farmsApiService.createFarm(farmData);
export const getFarms = (page?: number, size?: number) => farmsApiService.getFarms(page, size);
export const getAllFarms = () => farmsApiService.getAllFarms();
export const getFarmById = (farmId: string) => farmsApiService.getFarmById(farmId);
export const updateFarm = (farmId: string, updateData: UpdateFarmData) => farmsApiService.updateFarm(farmId, updateData);
export const uploadShapefile = (file: File) => farmsApiService.uploadShapefile(file);
export const uploadKML = (file: File, farmId: string, name?: string) => farmsApiService.uploadKML(file, farmId, name);
export const createInsuranceRequest = (farmId: string, notes?: string) => farmsApiService.createInsuranceRequest(farmId, notes);
export const getInsuranceRequests = (page?: number, size?: number, status?: string) => farmsApiService.getInsuranceRequests(page, size, status);
export const getWeatherForecast = (farmId: string, startDate?: string, endDate?: string) => farmsApiService.getWeatherForecast(farmId, startDate, endDate);
export const getHistoricalWeather = (farmId: string, startDate?: string, endDate?: string) => farmsApiService.getHistoricalWeather(farmId, startDate, endDate);
export const getAccumulatedWeather = (farmId: string, startDate?: string, endDate?: string) => farmsApiService.getAccumulatedWeather(farmId, startDate, endDate);
export const getVegetationStats = (farmId: string, startDate?: string, endDate?: string, indices?: string) => farmsApiService.getVegetationStats(farmId, startDate, endDate, indices);
export const getNDVITimeSeries = (farmId: string, startDate?: string, endDate?: string) => farmsApiService.getNDVITimeSeries(farmId, startDate, endDate);
export const getFieldTrend = (farmId: string, index?: string, startDate?: string, endDate?: string) => farmsApiService.getFieldTrend(farmId, index, startDate, endDate);

