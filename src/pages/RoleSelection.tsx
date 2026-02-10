import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import CustomScrollbar from "@/components/ui/CustomScrollbar";
import { motion } from "framer-motion";
import { 
  LogIn,
  Eye,
  EyeOff,
  ArrowLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { farmerLogin, assessorLogin, insurerLogin, adminLogin } from "@/services/authAPI";

export default function RoleSelection() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    phoneNumber: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Validate and format Rwandan phone number
  const validatePhoneNumber = (phone: string): { valid: boolean; formatted: string; error?: string } => {
    // Remove spaces, dashes, and other non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Check if it's exactly 10 digits and starts with valid prefix
    const validPrefixes = ['072', '073', '078', '079'];
    const prefix = cleaned.substring(0, 3);
    
    if (cleaned.length === 0) {
      return { valid: false, formatted: cleaned, error: "Phone number is required" };
    }
    
    if (cleaned.length !== 10) {
      return { 
        valid: false, 
        formatted: cleaned, 
        error: "Phone number must be 10 digits (e.g., 0781234567)" 
      };
    }
    
    if (!validPrefixes.includes(prefix)) {
      return { 
        valid: false, 
        formatted: cleaned, 
        error: "Phone number must start with 072, 073, 078, or 079" 
      };
    }
    
    return { valid: true, formatted: cleaned };
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'phoneNumber') {
      // Only allow digits and limit to 10 digits
      const cleaned = value.replace(/\D/g, '').substring(0, 10);
      setFormData(prev => ({ ...prev, [field]: cleaned }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    setError("");
  };

  const getDashboardRoute = (role: string): string => {
    const roleMap: { [key: string]: string } = {
      'FARMER': '/farmer-dashboard',
      'ASSESSOR': '/assessor-dashboard',
      'INSURER': '/insurer-dashboard',
      'GOVERNMENT': '/government-dashboard',
      'ADMIN': '/admin-dashboard'
    };
    return roleMap[role.toUpperCase()] || '/role-selection';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Login validation
      if (!formData.phoneNumber || !formData.password) {
        setError("Please enter both phone number and password.");
        setIsLoading(false);
        return;
      }

      // Validate and format phone number
      const phoneValidation = validatePhoneNumber(formData.phoneNumber);
      if (!phoneValidation.valid) {
        setError(phoneValidation.error || "Invalid phone number format.");
        setIsLoading(false);
        return;
      }

      const formattedPhone = phoneValidation.formatted;

      // Try to authenticate and determine role
      // We'll try different login methods to find the correct role
      const loginMethods = [
        () => farmerLogin(formattedPhone, formData.password),
        () => assessorLogin(formattedPhone, formData.password),
        () => insurerLogin(formattedPhone, formData.password),
        () => adminLogin(formattedPhone, formData.password),
      ];

      let loginResponse = null;
      let lastError = null;

      // Try each login method until one succeeds
      for (const loginMethod of loginMethods) {
        try {
          loginResponse = await loginMethod();
          break; // Success, exit loop
        } catch (err: any) {
          lastError = err;
          // Continue to next method if this one fails
          continue;
        }
      }

      // Also try government login (if it exists)
      if (!loginResponse) {
        try {
          // Government login might use a different endpoint
          const response = await fetch('/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              phoneNumber: formattedPhone, 
              password: formData.password 
            }),
          });
          const data = await response.json();
          if (response.ok && data.data?.role === 'GOVERNMENT') {
            loginResponse = data.data;
            localStorage.setItem('token', loginResponse.token);
            localStorage.setItem('role', loginResponse.role);
            localStorage.setItem('userId', loginResponse.userId || '');
            localStorage.setItem('phoneNumber', formattedPhone);
          }
        } catch (err) {
          // Ignore government login error
        }
      }

      if (!loginResponse) {
        throw lastError || new Error("Invalid credentials. Please check your phone number and password.");
      }

      // Get the role from the response
      const role = loginResponse.role || localStorage.getItem('role');
      if (!role) {
        throw new Error("Unable to determine user role.");
      }

      // Navigate to the appropriate dashboard
      const dashboardRoute = getDashboardRoute(role);
      navigate(dashboardRoute);

      toast({
        title: "Login successful",
        description: `Welcome! Redirecting to ${role} dashboard...`,
      });
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err.message || "Invalid credentials. Please check your phone number and password.";
      setError(errorMessage);
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CustomScrollbar>
      <div className="min-h-screen flex">
        {/* Left Side - Farmer Image */}
        <div className="hidden lg:block lg:w-1/2 relative">
          <img
            src="/farmer.jpg"
            alt="Farmer"
            className="w-full h-full object-cover"
          />
          {/* Back to Home Button - Absolute positioned on image */}
          <div className="absolute top-6 left-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-white hover:text-white hover:bg-white/20 backdrop-blur-sm rounded-none border border-white/30"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 bg-gradient-to-br from-gray-50 via-white to-gray-50 min-h-screen flex items-center justify-center p-4 lg:p-8 xl:p-12 relative">
          {/* Top Border Decoration */}
          <div className="absolute top-0 left-0 right-0 h-8 md:h-12 overflow-hidden">
            <img 
              src="/title.png" 
              alt="Top border decoration" 
              className="w-full h-full object-cover object-top"
            />
          </div>
          
          {/* Bottom Border Decoration */}
          <div className="absolute bottom-0 left-0 right-0 h-8 md:h-12 overflow-hidden">
            <img 
              src="/title.png" 
              alt="Bottom border decoration" 
              className="w-full h-full object-cover object-top"
            />
          </div>
          
          <div className="w-full max-w-md lg:max-w-lg xl:max-w-xl">
            {/* Back to Home Button - For mobile */}
            <div className="mb-6 lg:hidden">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-none"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="bg-white !border-0 !rounded-none !shadow-none w-full">
              <CardHeader>
                <CardTitle className="text-left text-xl text-gray-900">
                  Welcome Back
                </CardTitle>
                <p className="text-left text-gray-600 text-sm mt-2">
                  Enter your credentials to access your dashboard
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive" className="!rounded-none">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="text-gray-700">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      placeholder="0781234567 (10 digits)"
                      maxLength={10}
                      required
                      className="bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500 !rounded-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-700">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder="Enter your password"
                        required
                        className="bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500 !rounded-none"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button 
                    type="submit"
                    className="w-full bg-[rgba(20,40,75,1)] hover:bg-[rgba(15,30,56,1)] text-white !rounded-none"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      "Signing In..."
                    ) : (
                      <>
                        <LogIn className="h-4 w-4 mr-2" />
                        Sign In
                      </>
                    )}
                  </Button>
                </form>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
      </div>
    </CustomScrollbar>
  );
}
