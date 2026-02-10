// Assessments API Service
// Using centralized API configuration
import { API_BASE_URL, API_ENDPOINTS, getAuthToken } from '@/config/api';

// Use proxy in development to avoid CORS issues, full URL in production
const ASSESSMENTS_BASE_URL = import.meta.env.DEV 
  ? `/api/v1${API_ENDPOINTS.ASSESSMENTS.BASE}` // Use proxy: /api/v1/assessments -> proxied to backend
  : `${API_BASE_URL}${API_ENDPOINTS.ASSESSMENTS.BASE}`; // Production: full URL

interface CreateAssessmentRequest {
  farmId: string;
  assessorId: string;
}

interface UpdateAssessmentRequest {
  [key: string]: any; // Allow flexible update data
}

class AssessmentsApiService {
  private baseURL: string;

  constructor(baseURL: string = ASSESSMENTS_BASE_URL) {
    this.baseURL = baseURL;
  }

  private getToken(): string | null {
    return getAuthToken();
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    timeoutMs: number = 30000 // Default 30 second timeout
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

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    // Merge existing signal with our timeout signal if it exists
    let signal = controller.signal;
    if (options.signal) {
      if (typeof AbortSignal.any === 'function') {
        signal = AbortSignal.any([controller.signal, options.signal]);
      } else {
        options.signal.addEventListener('abort', () => controller.abort());
        signal = controller.signal;
      }
    }

    const config: RequestInit = {
      ...options,
      headers,
      signal,
    };

    try {
      const response = await fetch(url, config);

      // Handle non-JSON responses (like HTML error pages)
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (jsonError) {
          const text = await response.text();
          throw new Error(`Invalid JSON response: ${text.substring(0, 200)}`);
        }
      } else {
        const text = await response.text();
        if (!response.ok) {
          if (response.status === 502) {
            throw new Error('Bad Gateway (502): The server is temporarily unavailable. Please try again in a few moments.');
          } else if (response.status === 503) {
            throw new Error('Service Unavailable (503): The server is currently down for maintenance. Please try again later.');
          } else if (response.status === 504) {
            throw new Error('Gateway Timeout (504): The server took too long to respond. Please try again.');
          } else if (response.status >= 500) {
            throw new Error(`Server Error (${response.status}): The server encountered an error. Please try again later.`);
          } else {
            const errorPreview = text.substring(0, 100).replace(/\s+/g, ' ').trim();
            throw new Error(`Server error (${response.status}): ${errorPreview || 'Unknown error'}`);
          }
        }
        throw new Error(`Unexpected response format: ${text.substring(0, 100)}`);
      }

      // Handle 500 errors with better messaging
      if (response.status === 500) {
        const errorDetail = data?.detail || data?.message || 'Internal server error';
        console.error('❌ 500 Internal Server Error');
        console.error('Request URL:', url);
        console.error('Error detail:', errorDetail);
        console.error('Full response:', data);
        
        // Provide more helpful error message
        if (errorDetail.includes('Cannot read properties of null')) {
          throw new Error('Server error: Missing data in database. Please contact support or try again later.');
        }
        throw new Error(`Server error: ${errorDetail}`);
      }

      if (response.status === 401) {
        // Token expired or invalid
        console.error('❌ 401 Unauthorized - Token expired or invalid');
        console.error('Request URL:', url);
        console.error('Response:', data);
        
        // Clear all auth-related localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        localStorage.removeItem('userId');
        localStorage.removeItem('phoneNumber');
        localStorage.removeItem('email');
        
        // Show user-friendly error
        const errorMessage = data?.detail || data?.message || 'Your session has expired. Please log in again.';
        throw new Error(errorMessage);
      }

      if (!response.ok) {
        // Log full error response for debugging
        console.error('Assessments API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          data: data,
          url: url,
          fullResponse: JSON.stringify(data, null, 2)
        });
        
        // Provide better error messages for common status codes
        if (response.status === 400) {
          let errorMessage = data.message || data.error || data.detail || data.title || 'Bad request. Please check your input.';
          
          // Try to extract detailed validation errors from various formats
          const validationMessages: string[] = [];
          
          // Format 1: errors array
          if (data.errors && Array.isArray(data.errors)) {
            data.errors.forEach((err: any) => {
              if (err.field && err.message) {
                validationMessages.push(`${err.field}: ${err.message}`);
              } else if (err.path && err.message) {
                validationMessages.push(`${err.path}: ${err.message}`);
              } else if (typeof err === 'string') {
                validationMessages.push(err);
              }
            });
          }
          // Format 2: errors object
          else if (data.errors && typeof data.errors === 'object' && !Array.isArray(data.errors)) {
            Object.entries(data.errors).forEach(([field, messages]: [string, any]) => {
              if (Array.isArray(messages)) {
                messages.forEach((msg: any) => {
                  validationMessages.push(`${field}: ${msg.message || msg.msg || msg}`);
                });
              } else if (typeof messages === 'object' && messages !== null) {
                validationMessages.push(`${field}: ${(messages as any).message || JSON.stringify(messages)}`);
              } else {
                validationMessages.push(`${field}: ${messages}`);
              }
            });
          }
          // Format 3: validationErrors
          else if (data.validationErrors) {
            if (typeof data.validationErrors === 'object') {
              if (data.validationErrors.general && Array.isArray(data.validationErrors.general)) {
                validationMessages.push(...data.validationErrors.general);
              }
              
              Object.keys(data.validationErrors).forEach((key) => {
                if (key !== 'general' && Array.isArray(data.validationErrors[key])) {
                  data.validationErrors[key].forEach((msg: string) => {
                    validationMessages.push(`${key}: ${msg}`);
                  });
                }
              });
            }
          }
          
          if (validationMessages.length > 0) {
            errorMessage += `\n\nValidation Errors:\n${validationMessages.join('\n')}`;
          } else {
            // If no specific errors found, show the full data for debugging
            errorMessage += `\n\nFull error response: ${JSON.stringify(data, null, 2)}`;
          }
          
          throw new Error(errorMessage);
        } else if (response.status === 403) {
          throw new Error(data.message || data.error || data.detail || 'Forbidden. You do not have permission to perform this action.');
        } else if (response.status === 404) {
          throw new Error(data.message || data.error || data.detail || 'Assessment not found.');
        } else if (response.status >= 500) {
          throw new Error(data.message || data.error || data.detail || `Server error (${response.status}). Please try again later.`);
        }
        throw new Error(data.message || data.error || data.detail || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error: any) {
      console.error('Assessments API request failed:', error);
      console.error('Request URL:', url);
      console.error('Request method:', config.method || 'GET');
      console.error('Timeout was:', timeoutMs, 'ms');
      
      // Handle timeout/abort errors
      if (error.name === 'AbortError' || error.name === 'TimeoutError' || error.message?.includes('aborted')) {
        const timeoutSeconds = Math.round(timeoutMs / 1000);
        throw new Error(`Request timed out after ${timeoutSeconds} seconds. The server may be processing your request (e.g., sending notifications). Please wait a moment and check if the operation completed, or try again.`);
      }
      
      // Re-throw with better error message if it's already an Error
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error. Please check your connection and try again.');
    } finally {
      // Always clear the timeout to prevent memory leaks
      clearTimeout(timeoutId);
    }
  }

  // Create Assessment (Insurer Only)
  async createAssessment(data: CreateAssessmentRequest) {
    console.log('Creating assessment with data:', JSON.stringify(data, null, 2));
    try {
      const response = await this.request('', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      console.log('Assessment created successfully:', response);
      return response;
    } catch (error: any) {
      console.error('Assessment creation failed:', error);
      throw error;
    }
  }

  // Get All Assessments (Role-Based)
  async getAllAssessments() {
    return this.request('');
  }

  // Get Assessments with Pagination
  // Query Parameters:
  //   - page (number, default: 0) - Page number (0-indexed)
  //   - size (number, default: 10) - Number of items per page
  async getAssessments(page: number = 0, size: number = 10) {
    return this.request<any>(`?page=${page}&size=${size}`);
  }

  // Get All Assessments without pagination (fallback method)
  async getAllAssessmentsNoPagination() {
    return this.request('');
  }

  // Get Assessment by ID
  async getAssessmentById(id: string) {
    return this.request(`/${id}`);
  }

  // Get Assigned Farmers (Assessor only)
  // Endpoint: GET /assessments/farmers/list
  async getAssignedFarmers() {
    return this.request('/farmers/list');
  }

  // Update Assessment (Assessor Only)
  async updateAssessment(id: string, updateData: UpdateAssessmentRequest) {
    return this.request(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  // Calculate Risk Score (Assessor Only)
  // Endpoint: /api/v1/assessments/{id}/calculate-risk
  async calculateRiskScore(id: string) {
    return this.request(`/${id}/calculate-risk`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  // Submit Assessment (Assessor Only)
  async submitAssessment(id: string) {
    return this.request(`/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  // Get Pending Farms (Admin Only)
  async getPendingFarms() {
    const token = this.getToken();
    if (!token) {
      console.error('❌ No authentication token found');
      throw new Error('Authentication required. Please log in again.');
    }
    console.log('🔑 Token found, making request to /pending-farms');
    return this.request('/pending-farms');
  }

  // Assign Assessor to Farm (Admin Only)
  // Endpoint: POST /api/v1/assessments/assign
  async assignAssessor(farmId: string, assessorId: string, insurerId?: string | null) {
    console.log('🔄 Assigning assessor:', { farmId, assessorId, insurerId });
    const requestBody: {
      farmId: string;
      assessorId: string;
      insurerId: string | null;
    } = {
      farmId,
      assessorId,
      insurerId: insurerId || null, // Always include insurerId, even if null
    };
    
    try {
      // Use longer timeout (60 seconds) for assignment as it may involve sending emails/notifications
      const result = await this.request('/assign', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      }, 60000);
      console.log('✅ Assessor assigned successfully:', result);
      return result;
    } catch (error: any) {
      console.error('❌ Failed to assign assessor:', error);
      throw error;
    }
  }

  // Upload Drone PDF (Assessor Only)
  // Endpoint: POST /assessments/:id/upload-drone-pdf
  async uploadDronePDF(assessmentId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = this.getToken();
    const headers: HeadersInit = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    // Don't set Content-Type for FormData - let the browser set it with boundary
    
    const url = `${this.baseURL}/${assessmentId}/upload-drone-pdf`;
    console.log('📤 Uploading drone PDF to:', url);
    console.log('📤 Environment:', import.meta.env.DEV ? 'Development (using Vite proxy - no CORS!)' : 'Production');
    console.log('📤 Full URL breakdown:', {
      baseURL: this.baseURL,
      assessmentId: assessmentId,
      finalUrl: url,
      isDev: import.meta.env.DEV,
      usingProxy: import.meta.env.DEV
    });
    console.log('📄 File:', file.name, file.size, 'bytes', 'type:', file.type);
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });
    
    console.log('📥 Drone PDF upload response status:', response.status);
    
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      localStorage.removeItem('userId');
      localStorage.removeItem('phoneNumber');
      localStorage.removeItem('email');
      throw new Error('Authentication required. Please log in again.');
    }
    
    if (!response.ok) {
      let errorData;
      try {
        const text = await response.text();
        try {
          errorData = JSON.parse(text);
        } catch {
          errorData = { message: text || `HTTP error! status: ${response.status}` };
        }
      } catch {
        errorData = { message: `HTTP error! status: ${response.status}` };
      }
      
      console.error('❌ Drone PDF upload failed:', {
        status: response.status,
        statusText: response.statusText,
        url: url,
        error: errorData,
        is404: response.status === 404,
        is500: response.status === 500,
        is401: response.status === 401,
        is403: response.status === 403
      });
      
      // Provide specific error messages to help diagnose
      if (response.status === 404) {
        throw new Error(`API endpoint not found (404). The endpoint ${url} may not be implemented on the server. This is likely an API issue.`);
      } else if (response.status === 500) {
        throw new Error(`Server error (500). The API endpoint exists but encountered an error: ${errorData.message || 'Internal server error'}. This is an API issue.`);
      } else if (response.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      } else if (response.status === 403) {
        throw new Error('Permission denied. You may not have access to upload drone PDFs.');
      } else {
        throw new Error(errorData.message || errorData.error || `Failed to upload drone PDF: ${response.status} ${response.statusText}`);
      }
    }
    
    let responseData;
    try {
      responseData = await response.json();
    } catch (e) {
      const text = await response.text();
      console.error('❌ Failed to parse JSON response:', text);
      throw new Error(`Invalid JSON response: ${text}`);
    }
    
    // Log full response structure for debugging
    console.log('✅ Drone PDF upload successful - Full Response:', JSON.stringify(responseData, null, 2));
    console.log('📊 Response Structure Analysis:', {
      responseType: typeof responseData,
      isArray: Array.isArray(responseData),
      keys: Object.keys(responseData || {}),
      hasData: !!responseData?.data,
      hasDroneAnalysisData: !!responseData?.droneAnalysisData,
      hasDroneAnalysisDataInData: !!responseData?.data?.droneAnalysisData,
      hasPdfUrl: !!responseData?.droneAnalysisPdfUrl,
      hasPdfUrlInData: !!responseData?.data?.droneAnalysisPdfUrl,
      droneAnalysisDataType: typeof responseData?.droneAnalysisData,
      droneAnalysisDataKeys: responseData?.droneAnalysisData ? Object.keys(responseData.droneAnalysisData) : [],
      fullResponse: responseData
    });
    
    return responseData;
  }

  // Delete Drone PDF (Assessor Only)
  // Endpoint: DELETE /assessments/:id/drone-pdf
  async deleteDronePDF(assessmentId: string) {
    const url = `${this.baseURL}/${assessmentId}/drone-pdf`;
    const token = this.getToken();
    const headers: HeadersInit = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers,
    });
    
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      localStorage.removeItem('userId');
      localStorage.removeItem('phoneNumber');
      localStorage.removeItem('email');
      throw new Error('Authentication required. Please log in again.');
    }
    
    if (!response.ok) {
      let errorData;
      try {
        const text = await response.text();
        try {
          errorData = JSON.parse(text);
        } catch {
          errorData = { message: text || `HTTP error! status: ${response.status}` };
        }
      } catch {
        errorData = { message: `HTTP error! status: ${response.status}` };
      }
      
      if (response.status === 404) {
        // If delete endpoint doesn't exist, try updating assessment to remove PDF URL
        return this.updateAssessment(assessmentId, {
          droneAnalysisPdfUrl: null,
          droneAnalysisData: null
        });
      }
      
      throw new Error(errorData.message || errorData.error || `Failed to delete drone PDF: ${response.status} ${response.statusText}`);
    }
    
    let responseData;
    try {
      const text = await response.text();
      if (text) {
        responseData = JSON.parse(text);
      } else {
        responseData = {};
      }
    } catch (e) {
      responseData = {};
    }
    
    return responseData;
  }

  // Generate Full Report (Assessor Only)
  async generateReport(assessmentId: string) {
    return this.request(`/${assessmentId}/generate-report`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  // Approve Assessment (Insurer Only)
  async approveAssessment(assessmentId: string) {
    return this.request(`/${assessmentId}/approve`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  // Reject Assessment (Insurer Only)
  async rejectAssessment(assessmentId: string, rejectionReason: string) {
    return this.request(`/${assessmentId}/reject`, {
      method: 'POST',
      body: JSON.stringify({
        rejectionReason,
      }),
    });
  }
}

// Create and export a singleton instance
const assessmentsApiService = new AssessmentsApiService();
export default assessmentsApiService;

