import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { MapPicker } from "@/components/maps/MapPicker";
import { FileUpload } from "@/components/upload/FileUpload";
import { 
  User, 
  MapPin, 
  CreditCard, 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  Upload,
  Eye,
  EyeOff,
  Phone,
  Mail,
  Home,
  Shield,
  Camera,
  MapIcon
} from "lucide-react";
import { FarmerProfile } from "@/types/enhanced-api";

interface FarmerRegistrationProps {
  onComplete: (profile: FarmerProfile) => void;
  onCancel: () => void;
}

export function FarmerRegistration({ onComplete, onCancel }: FarmerRegistrationProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [showUpiPassword, setShowUpiPassword] = useState(false);
  const [profile, setProfile] = useState<Partial<FarmerProfile>>({
    personalInfo: {
      name: "",
      email: "",
      phone: "",
      upiCredentials: {
        upiId: "",
        bankAccount: "",
        ifscCode: ""
      }
    },
    farmDetails: {
      location: {
        coordinates: [30.1234, -1.9456], // Default to Rwanda coordinates
        address: "",
        district: "",
        province: ""
      },
      totalFarmSize: 0,
      landOwnership: {
        verified: false,
        documentType: 'title_deed'
      }
    }
  });

  const totalSteps = 4;

  const handleInputChange = (section: string, field: string, value: any) => {
    setProfile(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const handleNestedInputChange = (section: string, subsection: string, field: string, value: any) => {
    setProfile(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [subsection]: {
          ...(prev[section as keyof typeof prev] as any)?.[subsection],
          [field]: value
        }
      }
    }));
  };

  const handleCoordinatesChange = (coordinates: [number, number]) => {
    handleNestedInputChange('farmDetails', 'location', 'coordinates', coordinates);
  };

  const handleFileUpload = (files: File[]) => {
    // Handle land ownership document upload
    if (files.length > 0) {
      const file = files[0];
      // In real implementation, upload to server and get URL
      handleNestedInputChange('farmDetails', 'landOwnership', 'documentUrl', URL.createObjectURL(file));
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(profile.personalInfo?.name && profile.personalInfo?.email && profile.personalInfo?.phone);
      case 2:
        return !!(profile.farmDetails?.location?.address && profile.farmDetails?.district && profile.farmDetails?.province);
      case 3:
        return !!(profile.personalInfo?.upiCredentials?.upiId && profile.personalInfo?.upiCredentials?.bankAccount && profile.personalInfo?.upiCredentials?.ifscCode);
      case 4:
        return !!(profile.farmDetails?.totalFarmSize && profile.farmDetails?.totalFarmSize > 0);
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    if (validateStep(currentStep)) {
      const completeProfile: FarmerProfile = {
        id: `farmer_${Date.now()}`,
        ...profile,
        personalInfo: profile.personalInfo!,
        farmDetails: profile.farmDetails!,
        registrationDate: new Date().toISOString(),
        status: 'pending_verification'
      } as FarmerProfile;
      
      onComplete(completeProfile);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div key={i} className="flex items-center">
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
            ${i + 1 <= currentStep 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-500'
            }
          `}>
            {i + 1}
          </div>
          {i < totalSteps - 1 && (
            <div className={`
              w-16 h-1 mx-2
              ${i + 1 < currentStep ? 'bg-blue-600' : 'bg-gray-200'}
            `} />
          )}
        </div>
      ))}
    </div>
  );

  const renderPersonalInfo = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <User className="h-12 w-12 mx-auto text-blue-600 mb-4" />
        <h3 className="text-xl font-semibold">Personal Information</h3>
        <p className="text-gray-600">Please provide your basic personal details</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            placeholder="Enter your full name"
            value={profile.personalInfo?.name || ''}
            onChange={(e) => handleInputChange('personalInfo', 'name', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number *</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="phone"
              placeholder="+250 XXX XXX XXX"
              className="pl-10"
              value={profile.personalInfo?.phone || ''}
              onChange={(e) => handleInputChange('personalInfo', 'phone', e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="email">Email Address *</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              className="pl-10"
              value={profile.personalInfo?.email || ''}
              onChange={(e) => handleInputChange('personalInfo', 'email', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderFarmDetails = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Home className="h-12 w-12 mx-auto text-green-600 mb-4" />
        <h3 className="text-xl font-semibold">Farm Location Details</h3>
        <p className="text-gray-600">Provide your farm location and size information</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label>Farm Location *</Label>
          <MapPicker
            coordinates={profile.farmDetails?.location?.coordinates || [30.1234, -1.9456]}
            onCoordinatesChange={handleCoordinatesChange}
            height="300px"
          />
          <p className="text-sm text-gray-500">
            Click on the map to set your farm location
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="address">Address *</Label>
            <Textarea
              id="address"
              placeholder="Enter your farm address"
              value={profile.farmDetails?.location?.address || ''}
              onChange={(e) => handleNestedInputChange('farmDetails', 'location', 'address', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="district">District *</Label>
            <Select
              value={profile.farmDetails?.location?.district || ''}
              onValueChange={(value) => handleNestedInputChange('farmDetails', 'location', 'district', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select district" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="musanze">Musanze</SelectItem>
                <SelectItem value="rubavu">Rubavu</SelectItem>
                <SelectItem value="burera">Burera</SelectItem>
                <SelectItem value="rwamagana">Rwamagana</SelectItem>
                <SelectItem value="kayonza">Kayonza</SelectItem>
                <SelectItem value="ngoma">Ngoma</SelectItem>
                <SelectItem value="huye">Huye</SelectItem>
                <SelectItem value="nyanza">Nyanza</SelectItem>
                <SelectItem value="gisagara">Gisagara</SelectItem>
                <SelectItem value="nyaruguru">Nyaruguru</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="province">Province *</Label>
            <Select
              value={profile.farmDetails?.location?.province || ''}
              onValueChange={(value) => handleNestedInputChange('farmDetails', 'location', 'province', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select province" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="northern">Northern Province</SelectItem>
                <SelectItem value="eastern">Eastern Province</SelectItem>
                <SelectItem value="southern">Southern Province</SelectItem>
                <SelectItem value="western">Western Province</SelectItem>
                <SelectItem value="kigali">Kigali City</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="farmSize">Total Farm Size (Hectares) *</Label>
            <Input
              id="farmSize"
              type="number"
              placeholder="Enter farm size in hectares"
              value={profile.farmDetails?.totalFarmSize || ''}
              onChange={(e) => handleInputChange('farmDetails', 'totalFarmSize', parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        <div className="space-y-4">
          <Label>Land Ownership Verification</Label>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="ownershipVerified"
                checked={profile.farmDetails?.landOwnership?.verified || false}
                onCheckedChange={(checked) => 
                  handleNestedInputChange('farmDetails', 'landOwnership', 'verified', checked)
                }
              />
              <Label htmlFor="ownershipVerified">
                I confirm that I have legal ownership/rights to this land
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentType">Ownership Document Type</Label>
              <Select
                value={profile.farmDetails?.landOwnership?.documentType || 'title_deed'}
                onValueChange={(value) => 
                  handleNestedInputChange('farmDetails', 'landOwnership', 'documentType', value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="title_deed">Title Deed</SelectItem>
                  <SelectItem value="lease_agreement">Lease Agreement</SelectItem>
                  <SelectItem value="customary_rights">Customary Rights</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Upload Ownership Document</Label>
              <FileUpload
                onUpload={handleFileUpload}
                accept=".pdf,.jpg,.jpeg,.png"
                maxSize={5 * 1024 * 1024} // 5MB
                multiple={false}
              />
              {profile.farmDetails?.landOwnership?.documentUrl && (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Document uploaded successfully</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUpiCredentials = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <CreditCard className="h-12 w-12 mx-auto text-purple-600 mb-4" />
        <h3 className="text-xl font-semibold">UPI Payment Credentials</h3>
        <p className="text-gray-600">Set up your UPI details for seamless premium payments</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="upiId">UPI ID *</Label>
          <Input
            id="upiId"
            placeholder="yourname@bank"
            value={profile.personalInfo?.upiCredentials?.upiId || ''}
            onChange={(e) => handleNestedInputChange('personalInfo', 'upiCredentials', 'upiId', e.target.value)}
          />
          <p className="text-sm text-gray-500">Example: john.doe@mtn or 0781234567@airtel</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bankAccount">Bank Account Number *</Label>
          <Input
            id="bankAccount"
            placeholder="Enter your bank account number"
            value={profile.personalInfo?.upiCredentials?.bankAccount || ''}
            onChange={(e) => handleNestedInputChange('personalInfo', 'upiCredentials', 'bankAccount', e.target.value)}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="ifscCode">IFSC Code *</Label>
          <Input
            id="ifscCode"
            placeholder="Enter your bank's IFSC code"
            value={profile.personalInfo?.upiCredentials?.ifscCode || ''}
            onChange={(e) => handleNestedInputChange('personalInfo', 'upiCredentials', 'ifscCode', e.target.value)}
          />
          <p className="text-sm text-gray-500">
            Find your IFSC code on your bank passbook or online banking
          </p>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-start space-x-3">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">Secure Payment Processing</h4>
            <p className="text-sm text-blue-700 mt-1">
              Your UPI credentials are encrypted and securely stored. We use industry-standard 
              security measures to protect your financial information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderReview = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <CheckCircle className="h-12 w-12 mx-auto text-green-600 mb-4" />
        <h3 className="text-xl font-semibold">Review Your Information</h3>
        <p className="text-gray-600">Please review all details before submitting</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Personal Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Name</Label>
                <p>{profile.personalInfo?.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Phone</Label>
                <p>{profile.personalInfo?.phone}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Email</Label>
                <p>{profile.personalInfo?.email}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">UPI ID</Label>
                <p>{profile.personalInfo?.upiCredentials?.upiId}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Farm Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Address</Label>
                <p>{profile.farmDetails?.location?.address}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">District</Label>
                <p>{profile.farmDetails?.location?.district}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Province</Label>
                <p>{profile.farmDetails?.location?.province}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Farm Size</Label>
                <p>{profile.farmDetails?.totalFarmSize} hectares</p>
              </div>
            </div>
            <div className="mt-4">
              <Label className="text-sm font-medium text-gray-500">Coordinates</Label>
              <p className="text-sm font-mono">
                {profile.farmDetails?.location?.coordinates?.join(', ')}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-900">Verification Required</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Your registration will be reviewed by our team. You'll receive a notification 
                once your account is verified and ready to use.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderPersonalInfo();
      case 2:
        return renderFarmDetails();
      case 3:
        return renderUpiCredentials();
      case 4:
        return renderReview();
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">Farmer Registration</CardTitle>
          <p className="text-center text-gray-600">
            Join Rwanda's AI Agricultural Insurance Platform
          </p>
        </CardHeader>
        <CardContent>
          {renderStepIndicator()}
          
          <div className="mb-8">
            {renderCurrentStep()}
          </div>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={currentStep === 1 ? onCancel : prevStep}
            >
              {currentStep === 1 ? 'Cancel' : 'Previous'}
            </Button>

            {currentStep < totalSteps ? (
              <Button
                onClick={nextStep}
                disabled={!validateStep(currentStep)}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!validateStep(currentStep)}
                className="bg-green-600 hover:bg-green-700"
              >
                Submit Registration
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
