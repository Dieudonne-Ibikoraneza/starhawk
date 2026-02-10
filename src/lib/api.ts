const API_BASE_URL = 'https://starhawk-backend-agriplatform-a39f.onrender.com/api/v1';

export class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      if (response.status === 401) {
        // Token expired or invalid
        this.clearToken();
        localStorage.removeItem('user');
        window.location.href = '/';
        throw new Error('Authentication required');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(email: string, password: string, role: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    });
  }

  async register(userData: any) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async verifyToken() {
    return this.request('/auth/verify');
  }

  // Farmer endpoints
  async getFarmerDashboard() {
    return this.request('/farmer/dashboard');
  }

  async getFarmerPolicies() {
    return this.request('/farmer/policies');
  }

  async createFarmerClaim(claimData: any) {
    return this.request('/farmer/claims', {
      method: 'POST',
      body: JSON.stringify(claimData),
    });
  }

  async getFarmerClaims() {
    return this.request('/farmer/claims');
  }

  async getFarmerFields() {
    return this.request('/farmer/fields');
  }

  async updateFarmerProfile(profileData: any) {
    return this.request('/farmer/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Insurer endpoints
  async getInsurerDashboard() {
    return this.request('/insurer/dashboard');
  }

  async getInsurerPolicies() {
    return this.request('/insurer/policies');
  }

  async updatePolicy(policyId: string, updateData: any) {
    return this.request(`/insurer/policies/${policyId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async getInsurerClaims() {
    return this.request('/insurer/claims');
  }

  async updateClaim(claimId: string, updateData: any) {
    return this.request(`/insurer/claims/${claimId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  // Assessor endpoints
  async getAssessorDashboard() {
    return this.request('/assessor/dashboard');
  }

  async getPendingAssessments() {
    return this.request('/assessor/assessments/pending');
  }

  async createAssessment(assessmentData: any) {
    return this.request('/assessor/assessments', {
      method: 'POST',
      body: JSON.stringify(assessmentData),
    });
  }

  async updateAssessment(assessmentId: string, updateData: any) {
    return this.request(`/assessor/assessments/${assessmentId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async getAssessments() {
    return this.request('/assessor/assessments');
  }

  // Government endpoints
  async getGovernmentDashboard() {
    return this.request('/government/dashboard');
  }

  async getGovernmentReports() {
    return this.request('/government/reports');
  }

  async generateReport(reportData: any) {
    return this.request('/government/reports/generate', {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
  }

  async getRegionalAnalytics() {
    return this.request('/government/analytics/regional');
  }

  // Admin endpoints
  async getAdminDashboard() {
    return this.request('/admin/dashboard');
  }

  async getUsers() {
    return this.request('/admin/users');
  }

  async updateUser(userId: string, updateData: any) {
    return this.request(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async getSystemLogs() {
    return this.request('/admin/logs');
  }

  async getSystemSettings() {
    return this.request('/admin/settings');
  }

  async updateSystemSettings(settings: any) {
    return this.request('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }
}

export const apiClient = new ApiClient();
