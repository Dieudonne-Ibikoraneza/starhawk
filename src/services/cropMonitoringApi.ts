// Crop Monitoring API Service
import { API_BASE_URL, API_ENDPOINTS, getAuthToken } from '@/config/api';

const CROP_MONITORING_BASE_URL = `${API_BASE_URL}${API_ENDPOINTS.CROP_MONITORING.BASE}`;

interface StartMonitoringRequest {
  policyId: string;
}

interface UpdateMonitoringRequest {
  observations?: string[];
  photoUrls?: string[];
  notes?: string;
}

interface MonitoringResponse {
  _id: string;
  policyId: string;
  farmId: string;
  assessorId: string;
  monitoringNumber: number;
  monitoringDate: string;
  weatherData?: any;
  ndviData?: any;
  status: 'IN_PROGRESS' | 'COMPLETED';
  observations?: string[];
  photoUrls?: string[];
  notes?: string;
  reportGenerated?: boolean;
  reportGeneratedAt?: string;
}

class CropMonitoringApiService {
  private baseURL: string;

  constructor(baseURL: string = CROP_MONITORING_BASE_URL) {
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

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        localStorage.removeItem('userId');
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
        const errorMessage = data.message || data.error || data.detail || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      console.error('Crop Monitoring API request failed:', error);
      throw error;
    }
  }

  // Start Crop Monitoring
  // POST /crop-monitoring/start
  async startMonitoring(policyId: string): Promise<MonitoringResponse> {
    const url = `${API_BASE_URL}${API_ENDPOINTS.CROP_MONITORING.START}`;
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ policyId }),
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      localStorage.removeItem('userId');
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
      throw new Error('Authentication required. Please log in again.');
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || data.error || data.detail || `HTTP error! status: ${response.status}`);
    }

    return data;
  }

  // Get Monitoring History
  // GET /crop-monitoring
  async getMonitoringHistory(): Promise<MonitoringResponse[]> {
    return this.request<MonitoringResponse[]>('');
  }

  // Get Monitoring by ID
  // GET /crop-monitoring/:id
  async getMonitoringById(id: string): Promise<MonitoringResponse> {
    return this.request<MonitoringResponse>(`/${id}`);
  }

  // Update Monitoring Data
  // PUT /crop-monitoring/:id
  async updateMonitoring(id: string, updateData: UpdateMonitoringRequest): Promise<MonitoringResponse> {
    return this.request<MonitoringResponse>(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  // Generate Monitoring Report
  // POST /crop-monitoring/:id/generate-report
  async generateReport(id: string): Promise<MonitoringResponse> {
    return this.request<MonitoringResponse>(`/${id}/generate-report`, {
      method: 'POST',
    });
  }
}

// Create and export a singleton instance
const cropMonitoringApiService = new CropMonitoringApiService();
export default cropMonitoringApiService;

// Export convenience functions
export const startCropMonitoring = (policyId: string) => cropMonitoringApiService.startMonitoring(policyId);
export const getMonitoringHistory = () => cropMonitoringApiService.getMonitoringHistory();
export const getMonitoringById = (id: string) => cropMonitoringApiService.getMonitoringById(id);
export const updateMonitoring = (id: string, updateData: UpdateMonitoringRequest) => 
  cropMonitoringApiService.updateMonitoring(id, updateData);
export const generateMonitoringReport = (id: string) => cropMonitoringApiService.generateReport(id);

