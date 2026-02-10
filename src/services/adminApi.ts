// Admin API Service
// Using centralized API configuration
import { API_BASE_URL, API_ENDPOINTS, getAuthToken } from '@/config/api';

const ADMIN_BASE_URL = `${API_BASE_URL}/admin`;

class AdminApiService {
  private baseURL: string;

  constructor(baseURL: string = ADMIN_BASE_URL) {
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
        throw new Error(data.message || data.error || data.detail || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Admin API request failed:', error);
      throw error;
    }
  }

  // Get System Statistics
  async getSystemStatistics() {
    return this.request<any>('/statistics');
  }

  // Get Policy Overview
  async getPolicyOverview() {
    return this.request<any>('/policies/overview');
  }

  // Get Claim Statistics
  async getClaimStatistics() {
    return this.request<any>('/claims/statistics');
  }

  // Get Health Status
  async getHealthStatus() {
    // Health endpoint is at /health, not /admin/health
    const url = `${API_BASE_URL}/health`;
    const token = this.getToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'accept': 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Health check request failed:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const adminApiService = new AdminApiService();
export default adminApiService;

// Export convenience functions
export const getSystemStatistics = () => adminApiService.getSystemStatistics();
export const getPolicyOverview = () => adminApiService.getPolicyOverview();
export const getClaimStatistics = () => adminApiService.getClaimStatistics();
export const getHealthStatus = () => adminApiService.getHealthStatus();

