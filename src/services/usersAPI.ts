// Users API Service
// Use proxy in development to avoid CORS issues, full URL in production
const USERS_BASE_URL = import.meta.env.DEV
  ? '/api/v1/users'
  : 'https://starhawk-backend-agriplatform-a39f.onrender.com/api/v1/users';

interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  role?: string;
  active?: boolean;
  [key: string]: any; // Allow flexible update data
}

class UsersApiService {
  private baseURL: string;

  constructor(baseURL: string = USERS_BASE_URL) {
    this.baseURL = baseURL;
  }

  private getToken(): string | null {
    return localStorage.getItem('token');
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

      // Handle non-JSON responses
      let data: any;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || `HTTP error! status: ${response.status}`);
      }

      if (!response.ok) {
        // Provide better error messages for common status codes
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
        } else if (response.status === 403) {
          throw new Error('Forbidden. Admin access required.');
        } else if (response.status === 400) {
          // Handle validation errors - show detailed message
          console.error('Validation error - Full response:', data);
          console.error('Validation error - JSON:', JSON.stringify(data, null, 2));
          
          // Build comprehensive error message
          const errorParts: string[] = [];
          
          // Add main error message
          if (data.message) errorParts.push(data.message);
          if (data.error) errorParts.push(data.error);
          
          // Extract validation errors from various possible structures
          const extractErrors = (errors: any): string[] => {
            const errorList: string[] = [];
            if (errors && typeof errors === 'object') {
              Object.entries(errors).forEach(([key, value]: [string, any]) => {
                if (Array.isArray(value)) {
                  value.forEach((msg: string) => errorList.push(`${key}: ${msg}`));
                } else if (value) {
                  errorList.push(`${key}: ${value}`);
                }
              });
            }
            return errorList;
          };
          
          // Try different error property names
          if (data.errors) {
            const extracted = extractErrors(data.errors);
            if (extracted.length > 0) {
              errorParts.push(...extracted);
            }
          }
          
          if (data.validationErrors) {
            const extracted = extractErrors(data.validationErrors);
            if (extracted.length > 0) {
              errorParts.push(...extracted);
            }
          }
          
          if (data.details) {
            const extracted = extractErrors(data.details);
            if (extracted.length > 0) {
              errorParts.push(...extracted);
            }
          }
          
          // If no specific errors found, use the whole data object
          if (errorParts.length === 0) {
            errorParts.push('Validation error. Please check your input.');
            errorParts.push(`Response: ${JSON.stringify(data)}`);
          }
          
          const errorMessage = errorParts.join('\n');
          console.error('Final error message:', errorMessage);
          throw new Error(errorMessage);
        } else if (response.status === 404) {
          throw new Error(data.message || 'User not found.');
        } else if (response.status === 409) {
          // Conflict - user already exists (duplicate email, phone, or nationalId)
          const conflictMessage = data.message || data.error || 'User already exists.';
          const conflictDetails = data.detail ? ` ${data.detail}` : '';
          throw new Error(`${conflictMessage}${conflictDetails}`);
        } else if (response.status >= 500) {
          throw new Error(data.message || 'Server error. Please try again later.');
        }
        throw new Error(data.message || data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error: any) {
      console.error('Users API request failed:', error);
      // Re-throw with better error message if it's already an Error
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error. Please check your connection and try again.');
    }
  }

  // ========================================================
  // USER PROFILE MANAGEMENT
  // ========================================================

  // Get Current User Profile
  async getUserProfile() {
    return this.request<any>('/profile');
  }

  // Update Own Profile
  async updateUserProfile(profileData: UpdateUserData) {
    return this.request<any>('/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // ========================================================
  // ADMIN ENDPOINTS
  // ========================================================

  // Get All Users (Admin only)
  async getAllUsers() {
    return this.request<any>('');
  }

  // Get User by ID (Admin only)
  async getUserById(userId: string) {
    return this.request<any>(`/${userId}`);
  }

  // Update User (Admin only)
  async updateUser(userId: string, updateData: UpdateUserData) {
    return this.request<any>(`/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  // Deactivate User (Admin only)
  async deactivateUser(userId: string) {
    return this.request<any>(`/${userId}/deactivate`, {
      method: 'PUT',
      body: JSON.stringify({}),
    });
  }

  // Create User (Admin only)
  async createUser(userData: {
    nationalId: string;
    email: string;
    phoneNumber: string;
    role: string;
    firstName?: string;
    lastName?: string;
    province?: string;
    district?: string;
    sector?: string;
    cell?: string;
    village?: string;
    sex?: string;
    farmerProfile?: {
      farmProvince?: string;
      farmDistrict?: string;
      farmSector?: string;
      farmCell?: string;
      farmVillage?: string;
    };
    assessorProfile?: {
      specialization?: string;
      experienceYears?: number;
      profilePhotoUrl?: string;
      bio?: string;
      address?: string;
    };
    insurerProfile?: {
      companyName?: string;
      contactPerson?: string;
      website?: string;
      address?: string;
      companyDescription?: string;
      licenseNumber?: string;
      registrationDate?: string;
      companyLogoUrl?: string;
    };
    [key: string]: any;
  }) {
    return this.request<any>('', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // Get All Assessors
  // Get Assessors (Admin/Insurer only)
  // Endpoint: GET /users/assessors with pagination
  async getAssessors(page: number = 0, size: number = 100) {
    return this.request<any>(`/assessors?page=${page}&size=${size}`);
  }

  // Get All Insurers
  // Get Insurers (Admin only)
  // Endpoint: GET /users/insurers with pagination
  async getInsurers(page: number = 0, size: number = 100) {
    return this.request<any>(`/insurers?page=${page}&size=${size}`);
  }
}

// Create and export a singleton instance
const usersApiService = new UsersApiService();

// Export convenience functions
export const getUserProfile = () => usersApiService.getUserProfile();
export const updateUserProfile = (profileData: UpdateUserData) => 
  usersApiService.updateUserProfile(profileData);
export const getAllUsers = () => usersApiService.getAllUsers();
export const getUserById = (userId: string) => usersApiService.getUserById(userId);
export const updateUser = (userId: string, updateData: UpdateUserData) => 
  usersApiService.updateUser(userId, updateData);
export const deactivateUser = (userId: string) => usersApiService.deactivateUser(userId);
export const createUser = (userData: {
  nationalId: string;
  email: string;
  phoneNumber: string;
  role: string;
  firstName?: string;
  lastName?: string;
  province?: string;
  district?: string;
  sector?: string;
  cell?: string;
  village?: string;
  sex?: string;
  farmerProfile?: {
    farmProvince?: string;
    farmDistrict?: string;
    farmSector?: string;
    farmCell?: string;
    farmVillage?: string;
  };
  assessorProfile?: {
    specialization?: string;
    experienceYears?: number;
    profilePhotoUrl?: string;
    bio?: string;
    address?: string;
  };
  insurerProfile?: {
    companyName?: string;
    contactPerson?: string;
    website?: string;
    address?: string;
    companyDescription?: string;
    licenseNumber?: string;
    registrationDate?: string;
    companyLogoUrl?: string;
  };
  [key: string]: any;
}) => usersApiService.createUser(userData);

export const getAssessors = (page: number = 0, size: number = 100) => usersApiService.getAssessors(page, size);
export const getInsurers = (page: number = 0, size: number = 100) => usersApiService.getInsurers(page, size);

export default usersApiService;

