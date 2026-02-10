// Policies API Service
// Using centralized API configuration
import { API_BASE_URL, API_ENDPOINTS, getAuthToken } from '@/config/api';

const POLICIES_BASE_URL = `${API_BASE_URL}${API_ENDPOINTS.POLICIES.BASE}`;

interface PolicyData {
  farmerId?: string;
  cropType?: string;
  coverageAmount?: number;
  premium?: number;
  startDate: string;
  endDate: string;
  status?: string;
  notes?: string;
  // Assessment-based policy creation (new format)
  assessmentId?: string;
  coverageLevel?: 'BASIC' | 'STANDARD' | 'PREMIUM';
  [key: string]: any;
}

interface UpdatePolicyData {
  status?: string;
  notes?: string;
  coverageAmount?: number;
  premium?: number;
  endDate?: string;
  [key: string]: any;
}

class PoliciesApiService {
  private baseURL: string;

  constructor(baseURL: string = POLICIES_BASE_URL) {
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
        // Log full error response for debugging
        console.error('Policies API Error Details:', {
          status: response.status,
          statusText: response.statusText,
          data: data,
          url: url,
          fullResponse: JSON.stringify(data, null, 2)
        });
        
        // Try to extract detailed validation errors from various possible formats
        let errorMessage = data.message || data.error || data.detail || data.title || `HTTP error! status: ${response.status}`;
        
        // Check for RFC 7807 Problem Details format with nested errors
        const validationErrors: string[] = [];
        
        // Format 1: Array of errors
        if (data.errors && Array.isArray(data.errors)) {
          data.errors.forEach((err: any) => {
            if (err.field && err.message) {
              validationErrors.push(`${err.field}: ${err.message}`);
            } else if (err.path && err.message) {
              validationErrors.push(`${err.path}: ${err.message}`);
            } else if (typeof err === 'string') {
              validationErrors.push(err);
            }
          });
        }
        // Format 2: Object with field keys
        else if (data.errors && typeof data.errors === 'object' && !Array.isArray(data.errors)) {
          Object.entries(data.errors).forEach(([field, messages]: [string, any]) => {
            if (Array.isArray(messages)) {
              messages.forEach((msg: any) => {
                validationErrors.push(`${field}: ${msg.message || msg.msg || msg}`);
              });
            } else if (typeof messages === 'object' && messages !== null) {
              validationErrors.push(`${field}: ${(messages as any).message || JSON.stringify(messages)}`);
            } else {
              validationErrors.push(`${field}: ${messages}`);
            }
          });
        }
        // Format 3: Validation errors in different fields (common in Spring Boot)
        else if (data.validationErrors) {
          if (Array.isArray(data.validationErrors)) {
            validationErrors.push(...data.validationErrors.map((e: any) => e.message || e));
          } else {
            Object.entries(data.validationErrors).forEach(([field, msg]: [string, any]) => {
              validationErrors.push(`${field}: ${msg}`);
            });
          }
        }
        // Format 4: Check for nested error details
        else if (data.details && typeof data.details === 'object') {
          Object.entries(data.details).forEach(([key, value]: [string, any]) => {
            if (typeof value === 'string') {
              validationErrors.push(`${key}: ${value}`);
            }
          });
        }
        
        // Append validation errors to main error message
        if (validationErrors.length > 0) {
          errorMessage += `\n\nValidation Errors:\n${validationErrors.join('\n')}`;
        } else {
          // If no specific errors found, show the full data for debugging
          errorMessage += `\n\nFull error response: ${JSON.stringify(data, null, 2)}`;
        }
        
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      console.error('Policies API request failed:', error);
      throw error;
    }
  }

  // Create Policy
  // Supports both old format (farmerId, cropType, etc.) and new format (assessmentId, coverageLevel)
  async createPolicy(policyData: PolicyData) {
    // If assessmentId is provided, use new format; otherwise use old format for backward compatibility
    if (policyData.assessmentId) {
      // New assessment-based format
      const assessmentPolicyData = {
        assessmentId: policyData.assessmentId,
        coverageLevel: policyData.coverageLevel || 'STANDARD',
        startDate: policyData.startDate,
        endDate: policyData.endDate,
      };
      return this.request<any>('', {
        method: 'POST',
        body: JSON.stringify(assessmentPolicyData),
      });
    } else {
      // Old format for backward compatibility
      return this.request<any>('', {
        method: 'POST',
        body: JSON.stringify(policyData),
      });
    }
  }

  // Create Policy from Assessment (explicit method)
  async createPolicyFromAssessment(assessmentId: string, coverageLevel: 'BASIC' | 'STANDARD' | 'PREMIUM', startDate: string, endDate: string) {
    return this.createPolicy({
      assessmentId,
      coverageLevel,
      startDate,
      endDate,
    });
  }

  // Get All Policies
  async getPolicies(page: number = 1, size: number = 10, status?: string) {
    let endpoint = `?page=${page}&size=${size}`;
    if (status) {
      endpoint += `&status=${status}`;
    }
    return this.request<any>(endpoint);
  }

  // Get Policy by ID
  async getPolicyById(id: string) {
    return this.request<any>(`/${id}`);
  }

  // Update Policy
  async updatePolicy(id: string, updateData: UpdatePolicyData) {
    return this.request<any>(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  // Delete Policy
  async deletePolicy(id: string) {
    return this.request<any>(`/${id}`, {
      method: 'DELETE',
    });
  }
}

// Create and export a singleton instance
const policiesApiService = new PoliciesApiService();
export default policiesApiService;

// Export convenience functions
export const createPolicy = (policyData: PolicyData) => policiesApiService.createPolicy(policyData);
export const createPolicyFromAssessment = (assessmentId: string, coverageLevel: 'BASIC' | 'STANDARD' | 'PREMIUM', startDate: string, endDate: string) => 
  policiesApiService.createPolicyFromAssessment(assessmentId, coverageLevel, startDate, endDate);
export const getPolicies = (page?: number, size?: number, status?: string) => policiesApiService.getPolicies(page, size, status);
export const getPolicyById = (id: string) => policiesApiService.getPolicyById(id);
export const updatePolicy = (id: string, updateData: UpdatePolicyData) => policiesApiService.updatePolicy(id, updateData);
export const deletePolicy = (id: string) => policiesApiService.deletePolicy(id);

