import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Wheat,
  Building2,
  BarChart3,
  MapPin,
  Settings,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Eye as PreviewIcon,
  Play
} from "lucide-react";

interface LoginPageProps {
  role: string;
}

export const LoginPage = ({ role }: LoginPageProps) => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [registerData, setRegisterData] = useState({
    name: "",
    phone: "",
    company: "",
    position: "",
    farmName: "",
    location: "",
    farmSize: ""
  });

  const roleConfig = {
    farmer: {
      title: "Farmer Portal",
      icon: Wheat,
      color: "bg-gray-600",
      canRegister: true,
      registerFields: ["name", "phone", "farmName", "location", "farmSize"]
    },
    insurer: {
      title: "Insurer Dashboard",
      icon: Building2,
      color: "bg-gray-600",
      canRegister: true,
      registerFields: ["name", "phone", "company", "position"]
    },
    government: {
      title: "Government Analytics",
      icon: BarChart3,
      color: "bg-gray-600",
      canRegister: false,
      registerFields: []
    },
    assessor: {
      title: "Assessor Portal",
      icon: MapPin,
      color: "bg-gray-600",
      canRegister: true,
      registerFields: ["name", "phone", "company", "position"]
    },
    admin: {
      title: "Admin Panel",
      icon: Settings,
      color: "bg-gray-600",
      canRegister: false,
      registerFields: []
    }
  };

  const config = roleConfig[role as keyof typeof roleConfig];
  const Icon = config.icon;

  const handlePreview = () => {
    // Navigate to dashboard for preview
    if (role === "farmer") {
      navigate("/farmer-dashboard");
    } else if (role === "insurer") {
      navigate("/insurer-dashboard");
    } else if (role === "government") {
      navigate("/government-dashboard");
    } else if (role === "assessor") {
      navigate("/assessor-dashboard");
    } else if (role === "admin") {
      navigate("/admin-dashboard");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    // Simulate loading for demo purposes
    setTimeout(() => {
      // Navigate directly to dashboard (no authentication required)
      if (role === "farmer") {
        navigate("/farmer-dashboard");
      } else if (role === "insurer") {
        navigate("/insurer-dashboard");
      } else if (role === "government") {
        navigate("/government-dashboard");
      } else if (role === "assessor") {
        navigate("/assessor-dashboard");
      } else if (role === "admin") {
        navigate("/admin-dashboard");
      }
      setIsLoading(false);
    }, 1000);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    // Simulate loading for demo purposes
    setTimeout(() => {
      // Navigate directly to dashboard (no authentication required)
      if (role === "farmer") {
        navigate("/farmer-dashboard");
      } else if (role === "insurer") {
        navigate("/insurer-dashboard");
      } else if (role === "assessor") {
        navigate("/assessor-dashboard");
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Role-specific header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${config.color} text-white shadow-lg`}>
              <Icon className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{config.title}</h1>
            </div>
          </div>

          {/* Preview Button */}
          <Button
            onClick={handlePreview}
            variant="outline"
            className="w-full mb-6 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <PreviewIcon className="h-4 w-4 mr-2" />
            Preview Dashboard
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Login/Register Form */}
        <Card className="bg-white shadow-lg border border-gray-200">
          <CardContent className="p-8">
            {/* Toggle between Login and Register */}
            {config.canRegister && (
              <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(false)}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    !isRegisterMode 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(true)}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    isRegisterMode 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Create Account
                </button>
              </div>
            )}

            <form onSubmit={isRegisterMode ? handleRegister : handleLogin} className="space-y-6">
              <div className="space-y-4">
                {/* Registration Fields */}
                {isRegisterMode && (
                  <>
                    <div>
                      <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        value={registerData.name}
                        onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                        placeholder="Enter your full name"
                        className="bg-gray-50 border-gray-200 focus:bg-white"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={registerData.phone}
                        onChange={(e) => setRegisterData({...registerData, phone: e.target.value})}
                        placeholder="Enter your phone number"
                        className="bg-gray-50 border-gray-200 focus:bg-white"
                        required
                      />
                    </div>

                    {/* Role-specific fields */}
                    {role === "farmer" && (
                      <>
                        <div>
                          <Label htmlFor="farmName" className="text-sm font-medium text-gray-700">
                            Farm Name
                          </Label>
                          <Input
                            id="farmName"
                            type="text"
                            value={registerData.farmName}
                            onChange={(e) => setRegisterData({...registerData, farmName: e.target.value})}
                            placeholder="Enter your farm name"
                            className="bg-gray-50 border-gray-200 focus:bg-white"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="location" className="text-sm font-medium text-gray-700">
                            Location
                          </Label>
                          <Input
                            id="location"
                            type="text"
                            value={registerData.location}
                            onChange={(e) => setRegisterData({...registerData, location: e.target.value})}
                            placeholder="Enter your location"
                            className="bg-gray-50 border-gray-200 focus:bg-white"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="farmSize" className="text-sm font-medium text-gray-700">
                            Farm Size (hectares)
                          </Label>
                          <Input
                            id="farmSize"
                            type="number"
                            step="0.1"
                            value={registerData.farmSize}
                            onChange={(e) => setRegisterData({...registerData, farmSize: e.target.value})}
                            placeholder="Enter farm size in hectares"
                            className="bg-gray-50 border-gray-200 focus:bg-white"
                            required
                          />
                        </div>
                      </>
                    )}

                    {(role === "insurer" || role === "assessor") && (
                      <>
                        <div>
                          <Label htmlFor="company" className="text-sm font-medium text-gray-700">
                            Company/Organization
                          </Label>
                          <Input
                            id="company"
                            type="text"
                            value={registerData.company}
                            onChange={(e) => setRegisterData({...registerData, company: e.target.value})}
                            placeholder="Enter your company name"
                            className="bg-gray-50 border-gray-200 focus:bg-white"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="position" className="text-sm font-medium text-gray-700">
                            Position/Title
                          </Label>
                          <Input
                            id="position"
                            type="text"
                            value={registerData.position}
                            onChange={(e) => setRegisterData({...registerData, position: e.target.value})}
                            placeholder="Enter your position"
                            className="bg-gray-50 border-gray-200 focus:bg-white"
                            required
                          />
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* Email and Password Fields */}
                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address
                  </Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="pl-10 bg-gray-50 border-gray-200 focus:bg-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="pl-10 pr-10 bg-gray-50 border-gray-200 focus:bg-white"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {!isRegisterMode && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember"
                      type="checkbox"
                      className="h-4 w-4 text-gray-900 focus:ring-gray-900 border-gray-300 rounded"
                    />
                    <Label htmlFor="remember" className="ml-2 text-sm text-gray-600">
                      Remember me
                    </Label>
                  </div>
                  <button
                    type="button"
                    className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <Button
                type="submit"
                className="w-full rounded-full py-3 font-medium bg-gray-600 hover:bg-gray-700 text-white shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {isRegisterMode ? "Creating Account..." : "Signing in..."}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    {isRegisterMode ? "Create Account" : "Sign In"}
                  </div>
                )}
              </Button>
            </form>

            {!config.canRegister && (
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  Government access is provided by system administrators.{" "}
                  <button className="text-gray-900 hover:text-gray-700 font-medium">
                    Contact administrator
                  </button>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate("/")}
            className="text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center gap-2 mx-auto bg-gray-100 px-4 py-2 rounded-full hover:bg-gray-200 transition-colors"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};
