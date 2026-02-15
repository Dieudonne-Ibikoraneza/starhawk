// Auth API Service
// Use environment variable for easy deployment across different environments
const AUTH_BASE_URL = `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/v1/auth`;

interface LoginResponse {
  token: string;
  role: string;
  userId: string;
  phoneNumber: string;
  email: string;
}

class AuthApiService {
  private baseURL: string;

  constructor(baseURL: string = AUTH_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    // Create AbortController for timeout (pass a reason when supported)
    const controller = new AbortController();
    const timeoutAbort = () => {
      try {
        // AbortController.abort(reason) is supported in modern browsers
        (controller as any).abort("timeout");
      } catch (_) {
        controller.abort();
      }
    };
    const timeoutId = setTimeout(timeoutAbort, 30000); // 30 second timeout

    // Determine signal to use, carefully handling an already-aborted external signal
    let signal = controller.signal;
    const externalSignal = options.signal;
    if (externalSignal) {
      if ((externalSignal as AbortSignal).aborted) {
        // If caller's signal is already aborted, respect it immediately
        // and avoid starting the request at all.
        clearTimeout(timeoutId);
        throw new Error("Request was cancelled.");
      }
      // If AbortSignal.any is available, use it to combine signals; otherwise mirror external aborts
      if (typeof (AbortSignal as any).any === "function") {
        signal = (AbortSignal as any).any([controller.signal, externalSignal]);
      } else {
        externalSignal.addEventListener("abort", () => timeoutAbort(), {
          once: true,
        });
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
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        try {
          data = await response.json();
        } catch (jsonError) {
          // If JSON parsing fails, try to get text
          const text = await response.text();
          throw new Error(`Invalid JSON response: ${text.substring(0, 200)}`);
        }
      } else {
        // For non-JSON responses (like HTML error pages), read as text
        const text = await response.text();
        // If response is not OK, throw error with status
        if (!response.ok) {
          // Provide user-friendly error messages for common server errors
          if (response.status === 502) {
            throw new Error(
              "Bad Gateway (502): The server is temporarily unavailable. Please try again in a few moments.",
            );
          } else if (response.status === 503) {
            throw new Error(
              "Service Unavailable (503): The server is currently down for maintenance. Please try again later.",
            );
          } else if (response.status === 504) {
            throw new Error(
              "Gateway Timeout (504): The server took too long to respond. Please try again.",
            );
          } else if (response.status >= 500) {
            throw new Error(
              `Server Error (${response.status}): The server encountered an error. Please try again later.`,
            );
          } else {
            // For other non-JSON errors, show a truncated message
            const errorPreview = text
              .substring(0, 100)
              .replace(/\s+/g, " ")
              .trim();
            throw new Error(
              `Server error (${response.status}): ${errorPreview || "Unknown error"}`,
            );
          }
        }
        // If response is OK but not JSON, this is unexpected
        throw new Error(
          `Unexpected response format: ${text.substring(0, 100)}`,
        );
      }

      if (!response.ok) {
        // Provide better error messages for common status codes
        if (response.status === 401) {
          // Extract error message from various possible response formats
          const errorMessage =
            data.message ||
            data.error ||
            data.detail ||
            "Invalid credentials. Please check your phone number and password.";
          throw new Error(errorMessage);
        } else if (response.status === 400) {
          // Extract validation errors if they exist
          let errorMessage =
            data.message ||
            data.error ||
            data.detail ||
            "Bad request. Please check your input.";

          if (data.validationErrors) {
            const validationMessages: string[] = [];

            // Handle validationErrors object structure
            if (typeof data.validationErrors === "object") {
              // Check for general errors
              if (
                data.validationErrors.general &&
                Array.isArray(data.validationErrors.general)
              ) {
                validationMessages.push(...data.validationErrors.general);
              }

              // Check for field-specific errors
              Object.keys(data.validationErrors).forEach((key) => {
                if (
                  key !== "general" &&
                  Array.isArray(data.validationErrors[key])
                ) {
                  data.validationErrors[key].forEach((msg: string) => {
                    validationMessages.push(`${key}: ${msg}`);
                  });
                }
              });
            }

            // Use validation messages if available, otherwise use the default
            if (validationMessages.length > 0) {
              errorMessage = validationMessages.join(". ");
            }
          }

          throw new Error(errorMessage);
        } else if (response.status === 404) {
          throw new Error(data.message || data.error || "Endpoint not found.");
        } else if (response.status >= 500) {
          throw new Error(
            data.message ||
              data.error ||
              `Server error (${response.status}). Please try again later.`,
          );
        }
        throw new Error(
          data.message ||
            data.error ||
            `HTTP error! status: ${response.status}`,
        );
      }

      return data;
    } catch (error: any) {
      // Handle timeout/abort errors
      if (error.name === "AbortError" || error.name === "TimeoutError") {
        throw new Error(
          "Request timeout. The server is taking too long to respond. Please check your connection and try again.",
        );
      }

      // Re-throw with better error message if it's already an Error
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(
        "Network error. Please check your connection and try again.",
      );
    } finally {
      // Always clear the timeout to prevent memory leaks
      clearTimeout(timeoutId);
    }
  }

  // Admin Login
  async adminLogin(
    phoneNumber: string,
    password: string,
  ): Promise<LoginResponse> {
    try {
      const response = await this.request<any>("/login", {
        method: "POST",
        body: JSON.stringify({ phoneNumber, password }),
      });

      // Handle both response structures: { data: {...} } or direct {...}
      const data = response.data || response;

      if (!data || !data.token) {
        throw new Error("Invalid response from server");
      }

      if (data.role !== "ADMIN") {
        throw new Error("Access denied. Only admins can log in here.");
      }

      // Save token & user info in localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("userId", data.userId || data._id || "");
      localStorage.setItem("phoneNumber", data.phoneNumber || "");
      localStorage.setItem("email", data.email || "");

      return data;
    } catch (error: any) {
      // Re-throw with a more user-friendly message if possible
      if (error.message) {
        throw error;
      }
      throw new Error(
        "Login failed. Please check your credentials and try again.",
      );
    }
  }

  // Assessor Login
  async assessorLogin(
    phoneNumber: string,
    password: string,
  ): Promise<LoginResponse> {
    try {
      const requestBody = { phoneNumber, password };

      const response = await this.request<any>("/login", {
        method: "POST",
        body: JSON.stringify(requestBody),
      });

      // Handle both response structures: { data: {...} } or direct {...}
      const data = response.data || response;

      if (!data || !data.token) {
        throw new Error("Invalid response from server");
      }

      if (data.role !== "ASSESSOR") {
        throw new Error("Access denied. Only assessors can log in here.");
      }

      // Save token & user info in localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("userId", data.userId || data._id || "");
      localStorage.setItem("phoneNumber", data.phoneNumber || "");
      localStorage.setItem("email", data.email || "");

      return data;
    } catch (error: any) {
      // Re-throw with a more user-friendly message if possible
      if (error.message) {
        throw error;
      }
      throw new Error(
        "Login failed. Please check your credentials and try again.",
      );
    }
  }

  // Farmer Login
  async farmerLogin(
    phoneNumber: string,
    password: string,
  ): Promise<LoginResponse> {
    try {
      const requestBody = { phoneNumber, password };

      const response = await this.request<any>("/login", {
        method: "POST",
        body: JSON.stringify(requestBody),
      });

      // Handle both response structures: { data: {...} } or direct {...}
      const data = response.data || response;

      if (!data || !data.token) {
        throw new Error("Invalid response from server");
      }

      if (data.role !== "FARMER") {
        throw new Error("Access denied. Only farmers can log in here.");
      }

      // Save token & user info in localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("userId", data.userId || data._id || "");
      localStorage.setItem("phoneNumber", data.phoneNumber || "");
      localStorage.setItem("email", data.email || "");

      return data;
    } catch (error: any) {
      // Re-throw with a more user-friendly message if possible
      if (error.message) {
        throw error;
      }
      throw new Error(
        "Login failed. Please check your credentials and try again.",
      );
    }
  }

  // Insurer Login
  async insurerLogin(
    phoneNumber: string,
    password: string,
  ): Promise<LoginResponse> {
    try {
      const requestBody = { phoneNumber, password };

      const response = await this.request<any>("/login", {
        method: "POST",
        body: JSON.stringify(requestBody),
      });

      // Handle both response structures: { data: {...} } or direct {...}
      const data = response.data || response;

      if (!data || !data.token) {
        throw new Error("Invalid response from server");
      }

      if (data.role !== "INSURER") {
        throw new Error("Access denied. Only insurers can log in here.");
      }

      // Save token & user info in localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("userId", data.userId || data._id || "");
      localStorage.setItem("phoneNumber", data.phoneNumber || "");
      localStorage.setItem("email", data.email || "");

      return data;
    } catch (error: any) {
      // Re-throw with a more user-friendly message if possible
      if (error.message) {
        throw error;
      }
      throw new Error(
        "Login failed. Please check your credentials and try again.",
      );
    }
  }

  // Logout (clear storage)
  logout(): void {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    localStorage.removeItem("phoneNumber");
    localStorage.removeItem("email");
    localStorage.removeItem("user"); // Also remove user object if it exists
    console.log("🚪 Logged out successfully");
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = localStorage.getItem("token");
    return !!token;
  }

  // Check if current user is Admin
  isAdmin(): boolean {
    const role = localStorage.getItem("role");
    return role === "ADMIN";
  }

  // Get current user token
  getToken(): string | null {
    return localStorage.getItem("token");
  }

  // Get current user role
  getRole(): string | null {
    return localStorage.getItem("role");
  }

  // Get current user ID
  getUserId(): string | null {
    return localStorage.getItem("userId");
  }

  // Get current user phone number
  getPhoneNumber(): string | null {
    return localStorage.getItem("phoneNumber");
  }

  // Get current user email
  getEmail(): string | null {
    return localStorage.getItem("email");
  }
}

// Create and export a singleton instance
const authApiService = new AuthApiService();

// Export convenience functions
export const adminLogin = (phoneNumber: string, password: string) =>
  authApiService.adminLogin(phoneNumber, password);

export const assessorLogin = (phoneNumber: string, password: string) =>
  authApiService.assessorLogin(phoneNumber, password);

export const farmerLogin = (phoneNumber: string, password: string) =>
  authApiService.farmerLogin(phoneNumber, password);

export const insurerLogin = (phoneNumber: string, password: string) =>
  authApiService.insurerLogin(phoneNumber, password);

export const logout = () => authApiService.logout();

export const isAuthenticated = () => authApiService.isAuthenticated();

export const isAdmin = () => authApiService.isAdmin();

export const getToken = () => authApiService.getToken();

export const getRole = () => authApiService.getRole();

export const getUserId = () => authApiService.getUserId();

export const getPhoneNumber = () => authApiService.getPhoneNumber();

export const getEmail = () => authApiService.getEmail();

export default authApiService;
