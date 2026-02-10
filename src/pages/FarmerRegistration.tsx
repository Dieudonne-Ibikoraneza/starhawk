import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { HomeNavbar } from "@/components/layout/HomeNavbar";
import { FooterSection } from "@/components/home/FooterSection";
import RwandaLocationSelector from "@/components/common/RwandaLocationSelector";
import { 
  User, 
  ArrowLeft, 
  CheckCircle, 
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Home
} from "lucide-react";

interface RegistrationData {
  fullName: string;
  gender: string;
  nationalId: string;
  phoneNumber: string;
  email: string;
  province: string;
  district: string;
  sector: string;
  cell: string;
  village: string;
}

export default function FarmerRegistration() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [farmerId, setFarmerId] = useState<string | null>(null);
  const [formData, setFormData] = useState<RegistrationData>({
    fullName: "",
    gender: "",
    nationalId: "",
    phoneNumber: "",
    email: "",
    province: "",
    district: "",
    sector: "",
    cell: "",
    village: ""
  });

  // Location state for Rwanda API integration
  const [selectedLocation, setSelectedLocation] = useState({
    province: null,
    district: null,
    sector: null,
    village: null,
    cell: null
  });

  const handleInputChange = (field: keyof RegistrationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateFarmerId = () => {
    const randomNum = Math.floor(Math.random() * 9000) + 1000;
    return `FMR-${randomNum}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newFarmerId = generateFarmerId();
    setFarmerId(newFarmerId);
    setStep(3);
    setIsSubmitting(false);
  };

  const isStep1Valid = formData.fullName && formData.gender && formData.nationalId && formData.phoneNumber;
  const isStep2Valid = selectedLocation.province && selectedLocation.district && selectedLocation.sector && selectedLocation.village && selectedLocation.cell;

  if (step === 3) {
    return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent"></div>
      </div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
      <div className="absolute top-40 right-20 w-32 h-32 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full blur-xl opacity-20 animate-pulse delay-1000"></div>
      <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-gradient-to-r from-orange-400 to-amber-500 rounded-full blur-xl opacity-20 animate-pulse delay-2000"></div>

      <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl relative z-10">
        <CardHeader className="text-center pb-8">
          <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <CheckCircle className="h-12 w-12 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold text-white mb-2">Registration Successful!</CardTitle>
          <p className="text-white/80">Welcome to the platform</p>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
            <p className="text-white/80 text-sm mb-3">Your Farmer ID is:</p>
            <p className="text-3xl font-bold text-white bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">{farmerId}</p>
          </div>
          <p className="text-white/70 text-lg">
            You can now log in using your National ID or Farmer ID to access your dashboard.
          </p>
          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/role-selection')}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Go to Login
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/role-selection')}
              className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
            >
              Back to Role Selection
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 via-white to-gray-50 min-h-screen">
      {/* Navigation */}
      <HomeNavbar />

      {/* Grid Pattern Background */}
      <div className="absolute inset-0 opacity-70 flex items-center justify-center">
        <img
          src="/lines.png"
          alt="Grid lines"
          className="w-3/4 h-3/4 object-contain"
        />
      </div>

      {/* Bottom Corner Lines */}
      <div className="absolute bottom-0 left-0 opacity-60">
        <img
          src="/lines2.png"
          alt="Bottom left lines"
          className="w-[32rem] h-[32rem]"
        />
      </div>
      <div className="absolute bottom-0 right-0 opacity-60">
        <img
          src="/lines2.png"
          alt="Bottom right lines"
          className="w-[32rem] h-[32rem]"
        />
      </div>

      {/* Header */}
      <div className="relative z-10 bg-white/10 backdrop-blur-md border-b border-white/20 pt-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl flex items-center justify-center">
                <User className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Farmer Registration</h1>
                <p className="text-green-200 text-sm">Create your farmer profile and get your unique ID</p>
              </div>
            </div>
            <Link 
              to="/role-selection" 
              className="text-white/80 hover:text-white transition-colors flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Role Selection</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center space-x-6">
            <div className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${step >= 1 ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg' : 'bg-white/20 text-white/60'}`}>
              <span className="font-semibold">1</span>
            </div>
            <div className={`w-20 h-1 rounded-full transition-all duration-300 ${step >= 2 ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-white/20'}`}></div>
            <div className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${step >= 2 ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg' : 'bg-white/20 text-white/60'}`}>
              <span className="font-semibold">2</span>
            </div>
          </div>
        </div>

        <Card className="max-w-2xl mx-auto bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-3xl font-bold text-white mb-2">
              {step === 1 ? "Personal Information" : "Location Details"}
            </CardTitle>
            <p className="text-white/80 text-lg">
              {step === 1 ? "Tell us about yourself" : "Where is your farm located?"}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {step === 1 && (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-white font-medium">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      placeholder="Enter your full name"
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-green-400 focus:ring-green-400"
                    />
                  </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender *</Label>
                      <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nationalId">National ID *</Label>
                    <Input
                      id="nationalId"
                      value={formData.nationalId}
                      onChange={(e) => handleInputChange('nationalId', e.target.value)}
                      placeholder="Enter your national ID number"
                      required
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">Phone Number *</Label>
                      <Input
                        id="phoneNumber"
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                        placeholder="+250 7XX XXX XXX"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email (Optional)</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="space-y-4">
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-semibold text-white mb-2">Select Your Location</h3>
                      <p className="text-white/70">Choose your province, district, sector, village, and cell</p>
                  </div>

                    <RwandaLocationSelector
                      onLocationChange={(location) => {
                        setSelectedLocation(location);
                        // Update form data with selected location
                        setFormData(prev => ({
                          ...prev,
                          province: location.province?.name || '',
                          district: location.district?.name || '',
                          sector: location.sector?.name || '',
                          village: location.village?.name || '',
                          cell: location.cell?.name || ''
                        }));
                      }}
                      levels={['province', 'district', 'sector', 'village', 'cell']}
                      className="space-y-4"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-between pt-8">
                {step === 2 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
                  >
                    Previous
                  </Button>
                )}
                <div className="flex-1"></div>
                {step === 1 ? (
                  <Button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={!isStep1Valid}
                    className="bg-white/10 hover:bg-white/20 border border-white/20 text-white backdrop-blur-sm px-8 py-3 text-lg font-semibold"
                  >
                    Next Step
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={!isStep2Valid || isSubmitting}
                    className="bg-white/10 hover:bg-white/20 border border-white/20 text-white backdrop-blur-sm px-8 py-3 text-lg font-semibold"
                  >
                    {isSubmitting ? "Creating Account..." : "Register Farmer"}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <FooterSection />
    </div>
  );
}
