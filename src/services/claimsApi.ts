// Claims API Service
// Using centralized API configuration
import { API_BASE_URL, API_ENDPOINTS, getAuthToken } from '@/config/api';

const CLAIMS_BASE_URL = `${API_BASE_URL}${API_ENDPOINTS.CLAIMS.BASE}`;

interface ClaimData {
  policyId: string;
  lossEventType?: string; // e.g., "DROUGHT", "FLOOD", "PEST_ATTACK", etc. (backward compatibility)
  eventType?: string; // e.g., "DROUGHT", "FLOOD", "PEST_ATTACK", etc. (new format)
  lossDescription?: string; // backward compatibility
  description?: string; // new format
  eventDate?: string; // ISO date string
  estimatedLoss?: number; // Estimated loss amount
  damagePhotos?: string[]; // Array of photo URLs
  [key: string]: any; // Allow additional fields for backward compatibility
}

interface UpdateClaimData {
  status?: string;
  amount?: number;
  description?: string;
  notes?: string;
  approvedAmount?: number;
  [key: string]: any;
}

class ClaimsApiService {
  private baseURL: string;

  constructor(baseURL: string = CLAIMS_BASE_URL) {
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
      // Log request details for debugging
      console.log('🌐 Claims API Request:', {
        method: options.method || 'GET',
        url: url,
        hasToken: !!token,
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'No token',
        body: options.body ? JSON.parse(options.body as string) : null
      });

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

      if (response.status === 403) {
        // Get error details from response
        let errorMessage = 'Forbidden: You do not have permission to perform this action.';
        try {
          const errorData = await response.clone().json();
          errorMessage = errorData.message || errorData.error || errorData.detail || errorMessage;
          console.error('🚫 403 Forbidden Error Details:', errorData);
        } catch (e) {
          const errorText = await response.clone().text();
          console.error('🚫 403 Forbidden Error Text:', errorText);
        }
        
        throw new Error(errorMessage);
      }

      let data: any;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
        
        // Log response details with parsed data
        console.log('📥 Claims API Response:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          url: response.url,
          data: data
        });
      } else {
        const text = await response.text();
        console.error('📥 Claims API Response (non-JSON):', {
          status: response.status,
          statusText: response.statusText,
          contentType: contentType,
          text: text.substring(0, 200)
        });
        throw new Error(text || `HTTP error! status: ${response.status}`);
      }

      if (!response.ok) {
        console.error('❌ Claims API Error:', {
          status: response.status,
          statusText: response.statusText,
          data: data
        });
        throw new Error(data.message || data.error || data.detail || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Claims API request failed:', error);
      throw error;
    }
  }

  // Create Claim
  // POST /claims
  // Request: { policyId, eventType, eventDate, description, estimatedLoss, damagePhotos }
  async createClaim(claimData: ClaimData) {
    // Validate required fields
    if (!claimData.policyId) {
      throw new Error('Policy ID is required');
    }
    
    // Support both old format (lossEventType, lossDescription) and new format (eventType, description)
    const eventType = claimData.eventType || claimData.lossEventType;
    const description = claimData.description || claimData.lossDescription;
    
    if (!eventType) {
      throw new Error('Event type is required');
    }
    if (!description) {
      throw new Error('Description is required');
    }

    // Format according to API spec (prefer new format)
    const requestBody: any = {
      policyId: claimData.policyId,
      eventType: eventType.toUpperCase(), // Ensure uppercase
      description: description,
    };
    
    // Add optional fields if provided
    if (claimData.eventDate) {
      requestBody.eventDate = claimData.eventDate;
    }
    
    if (claimData.estimatedLoss !== undefined && claimData.estimatedLoss !== null) {
      requestBody.estimatedLoss = claimData.estimatedLoss;
    }
    
    if (claimData.damagePhotos && claimData.damagePhotos.length > 0) {
      requestBody.damagePhotos = claimData.damagePhotos;
    }
    
    console.log('📤 Creating claim with data:', JSON.stringify(requestBody, null, 2));
    
    return this.request<any>('', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
  }

  // Get All Claims
  async getClaims(page: number = 1, size: number = 10, status?: string) {
    let endpoint = `?page=${page}&size=${size}`;
    if (status) {
      endpoint += `&status=${status}`;
    }
    return this.request<any>(endpoint);
  }

  // Get Claim by ID
  async getClaimById(id: string) {
    return this.request<any>(`/${id}`);
  }

  // Update Claim
  async updateClaim(id: string, updateData: UpdateClaimData) {
    return this.request<any>(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  // Delete Claim
  async deleteClaim(id: string) {
    return this.request<any>(`/${id}`, {
      method: 'DELETE',
    });
  }

  // Approve Claim (Insurer Only)
  // Supports both payoutAmount (new format) and approvedAmount (backward compatibility)
  async approveClaim(id: string, payoutAmount?: number, approvedAmount?: number, notes?: string) {
    const amount = payoutAmount !== undefined ? payoutAmount : approvedAmount;
    const requestBody: any = {
      payoutAmount: amount, // Use payoutAmount as per flow spec
      notes,
    };
    // Keep approvedAmount for backward compatibility if provided
    if (approvedAmount !== undefined) {
      requestBody.approvedAmount = approvedAmount;
    }
    return this.request<any>(`/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify(requestBody),
    });
  }

  // Reject Claim (Insurer Only)
  // Supports both rejectionReason (new format) and reason (backward compatibility)
  async rejectClaim(id: string, rejectionReason?: string, reason?: string) {
    const rejectReason = rejectionReason || reason;
    if (!rejectReason) {
      throw new Error('Rejection reason is required');
    }
    const requestBody: any = {
      rejectionReason: rejectReason, // Use rejectionReason as per flow spec
    };
    // Keep reason for backward compatibility
    requestBody.reason = rejectReason;
    return this.request<any>(`/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify(requestBody),
    });
  }

  // Assign Assessor to Claim (Insurer Only)
  async assignAssessor(id: string, assessorId: string) {
    return this.request<any>(`/${id}/assign`, {
      method: 'PUT',
      body: JSON.stringify({
        assessorId,
      }),
    });
  }

  // Update Claim Assessment (Assessor Only)
  async updateClaimAssessment(id: string, assessmentData: any) {
    return this.request<any>(`/${id}/assessment`, {
      method: 'PUT',
      body: JSON.stringify(assessmentData),
    });
  }

  // Submit Assessment for Claim (Assessor Only)
  async submitAssessment(id: string, assessmentData?: any) {
    // If assessmentData is provided, update first then submit
    if (assessmentData && Object.keys(assessmentData).length > 0) {
      await this.updateClaimAssessment(id, assessmentData);
    }
    return this.request<any>(`/${id}/submit-assessment`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }
}

// Create and export a singleton instance
const claimsApiService = new ClaimsApiService();
export default claimsApiService;

// Export convenience functions
export const createClaim = (claimData: ClaimData) => claimsApiService.createClaim(claimData);
export const getClaims = (page?: number, size?: number, status?: string) => claimsApiService.getClaims(page, size, status);
export const getClaimById = (id: string) => claimsApiService.getClaimById(id);
export const updateClaim = (id: string, updateData: UpdateClaimData) => claimsApiService.updateClaim(id, updateData);
export const deleteClaim = (id: string) => claimsApiService.deleteClaim(id);
export const approveClaim = (id: string, approvedAmount?: number, notes?: string) => claimsApiService.approveClaim(id, approvedAmount, notes);
export const rejectClaim = (id: string, reason: string) => claimsApiService.rejectClaim(id, reason);
export const assignAssessor = (id: string, assessorId: string) => claimsApiService.assignAssessor(id, assessorId);
export const updateClaimAssessment = (id: string, assessmentData: any) => claimsApiService.updateClaimAssessment(id, assessmentData);
export const submitAssessment = (id: string, assessmentData?: any) => claimsApiService.submitAssessment(id, assessmentData);

