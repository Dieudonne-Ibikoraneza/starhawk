import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { 
  FileText, 
  Shield, 
  Calendar, 
  DollarSign, 
  MapPin, 
  CheckCircle, 
  AlertTriangle,
  Phone,
  Globe,
  Crop,
  Clock,
  Users,
  Satellite,
  Camera
} from "lucide-react";
import { PolicyRequest } from "@/types/enhanced-api";

interface PolicyRequestFormProps {
  farmerId: string;
  onSubmit: (request: PolicyRequest) => void;
  onCancel: () => void;
}

export function PolicyRequestForm({ farmerId, onSubmit, onCancel }: PolicyRequestFormProps) {
  const [requestType, setRequestType] = useState<'web' | 'ussd'>('web');
  const [request, setRequest] = useState<Partial<PolicyRequest>>({
    farmerId,
    requestType: 'web',
    coverageType: 'crop_insurance',
    policyDuration: 12,
    coverageAmount: 1000000,
    selectedCrops: [],
    status: 'pending_assignment'
  });

  const [showUSSDMenu, setShowUSSDMenu] = useState(false);
  const [ussdInput, setUssdInput] = useState('');

  const cropOptions = [
    { value: 'maize', label: 'Maize', premium: 120000, coverage: 1200000 },
    { value: 'rice', label: 'Rice', premium: 180000, coverage: 1800000 },
    { value: 'beans', label: 'Beans', premium: 90000, coverage: 900000 },
    { value: 'coffee', label: 'Coffee', premium: 350000, coverage: 3500000 },
    { value: 'bananas', label: 'Bananas', premium: 200000, coverage: 2000000 },
    { value: 'potatoes', label: 'Potatoes', premium: 150000, coverage: 1500000 },
    { value: 'sorghum', label: 'Sorghum', premium: 80000, coverage: 800000 },
    { value: 'wheat', label: 'Wheat', premium: 110000, coverage: 1100000 }
  ];

  const coverageTypes = [
    {
      value: 'crop_insurance',
      label: 'Crop Insurance',
      description: 'Protection against crop damage from natural disasters',
      icon: Crop
    },
    {
      value: 'livestock_insurance',
      label: 'Livestock Insurance',
      description: 'Coverage for livestock health and mortality',
      icon: Users
    },
    {
      value: 'equipment_insurance',
      label: 'Equipment Insurance',
      description: 'Protection for farming equipment and machinery',
      icon: Shield
    }
  ];

  const handleCropSelection = (cropValue: string, checked: boolean) => {
    const currentCrops = request.selectedCrops || [];
    if (checked) {
      setRequest(prev => ({
        ...prev,
        selectedCrops: [...currentCrops, cropValue]
      }));
    } else {
      setRequest(prev => ({
        ...prev,
        selectedCrops: currentCrops.filter(crop => crop !== cropValue)
      }));
    }
  };

  const calculateTotalPremium = () => {
    if (!request.selectedCrops) return 0;
    return request.selectedCrops.reduce((total, cropValue) => {
      const crop = cropOptions.find(c => c.value === cropValue);
      return total + (crop?.premium || 0);
    }, 0);
  };

  const calculateTotalCoverage = () => {
    if (!request.selectedCrops) return 0;
    return request.selectedCrops.reduce((total, cropValue) => {
      const crop = cropOptions.find(c => c.value === cropValue);
      return total + (crop?.coverage || 0);
    }, 0);
  };

  const handleUSSDRequest = () => {
    // Simulate USSD menu navigation
    const menuLevel = Math.floor(ussdInput.length / 2);
    
    switch (menuLevel) {
      case 0:
        setUssdInput(ussdInput + '1');
        break;
      case 1:
        if (ussdInput.includes('1')) {
          setUssdInput(ussdInput + '1'); // Select crop insurance
        }
        break;
      case 2:
        if (ussdInput.includes('11')) {
          setUssdInput(ussdInput + '1'); // Select maize
        }
        break;
      case 3:
        if (ussdInput.includes('111')) {
          setUssdInput(ussdInput + '12'); // 12 months duration
        }
        break;
      default:
        // Complete USSD request
        const ussdRequest: PolicyRequest = {
          id: `req_${Date.now()}`,
          farmerId,
          requestType: 'ussd',
          coverageType: 'crop_insurance',
          policyDuration: 12,
          coverageAmount: 1200000,
          selectedCrops: ['maize'],
          requestDate: new Date().toISOString(),
          status: 'pending_assignment',
          assignedSurveyors: {
            dronePilot: '',
            satelliteSurveyor: '',
            fieldAssessor: ''
          },
          trackingId: `TRK${Date.now()}`
        };
        onSubmit(ussdRequest);
        return;
    }
  };

  const handleWebSubmit = () => {
    if (!request.selectedCrops || request.selectedCrops.length === 0) {
      alert('Please select at least one crop');
      return;
    }

    const webRequest: PolicyRequest = {
      id: `req_${Date.now()}`,
      farmerId,
      requestType: 'web',
      coverageType: request.coverageType || 'crop_insurance',
      policyDuration: request.policyDuration || 12,
      coverageAmount: calculateTotalCoverage(),
      selectedCrops: request.selectedCrops,
      requestDate: new Date().toISOString(),
      status: 'pending_assignment',
      assignedSurveyors: {
        dronePilot: '',
        satelliteSurveyor: '',
        fieldAssessor: ''
      },
      trackingId: `TRK${Date.now()}`
    };

    onSubmit(webRequest);
  };

  const renderUSSDInterface = () => (
    <Card className="border-dashed border-2 border-gray-300">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Phone className="h-5 w-5" />
          <span>USSD Request Interface</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Dial *1828# on your mobile phone to access insurance services
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm">
          <div className="text-gray-600 mb-2">USSD Menu Navigation:</div>
          <div>1. Insurance Services</div>
          <div className="ml-4">1. Crop Insurance</div>
          <div className="ml-8">1. Maize (RWF 120,000 premium)</div>
          <div className="ml-8">2. Rice (RWF 180,000 premium)</div>
          <div className="ml-8">3. Beans (RWF 90,000 premium)</div>
          <div className="ml-4">2. Livestock Insurance</div>
          <div className="ml-4">3. Equipment Insurance</div>
          <div>2. Check Policy Status</div>
          <div>3. Make Payment</div>
          <div>4. Contact Support</div>
        </div>

        <div className="space-y-2">
          <Label>Simulate USSD Input</Label>
          <div className="flex space-x-2">
            <Input
              value={ussdInput}
              onChange={(e) => setUssdInput(e.target.value)}
              placeholder="Enter USSD input sequence"
              className="font-mono"
            />
            <Button onClick={handleUSSDRequest}>
              Send
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Example: Type "11112" for Maize crop insurance with 12 months duration
          </p>
        </div>

        <div className="flex space-x-2">
          <Button onClick={() => setShowUSSDMenu(false)} variant="outline">
            Back to Web Form
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderWebForm = () => (
    <div className="space-y-6">
      {/* Coverage Type Selection */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">Select Coverage Type</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {coverageTypes.map((type) => {
            const Icon = type.icon;
            return (
              <Card
                key={type.value}
                className={`cursor-pointer transition-all ${
                  request.coverageType === type.value
                    ? 'ring-2 ring-blue-500 bg-blue-50'
                    : 'hover:shadow-md'
                }`}
                onClick={() => setRequest(prev => ({ ...prev, coverageType: type.value as any }))}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <Icon className="h-6 w-6 text-blue-600" />
                    <h3 className="font-semibold">{type.label}</h3>
                  </div>
                  <p className="text-sm text-gray-600">{type.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Crop Selection */}
      {request.coverageType === 'crop_insurance' && (
        <div className="space-y-4">
          <Label className="text-lg font-semibold">Select Crops to Insure</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cropOptions.map((crop) => (
              <Card
                key={crop.value}
                className={`cursor-pointer transition-all ${
                  request.selectedCrops?.includes(crop.value)
                    ? 'ring-2 ring-green-500 bg-green-50'
                    : 'hover:shadow-md'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={request.selectedCrops?.includes(crop.value) || false}
                        onCheckedChange={(checked) => handleCropSelection(crop.value, checked as boolean)}
                      />
                      <div>
                        <h3 className="font-semibold">{crop.label}</h3>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>Premium: RWF {crop.premium.toLocaleString()}</div>
                          <div>Coverage: RWF {crop.coverage.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Policy Duration */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">Policy Duration</Label>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span>Duration: {request.policyDuration} months</span>
            <Badge variant="outline">{request.policyDuration} months</Badge>
          </div>
          <Slider
            value={[request.policyDuration || 12]}
            onValueChange={(value) => setRequest(prev => ({ ...prev, policyDuration: value[0] }))}
            max={24}
            min={3}
            step={3}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-500">
            <span>3 months</span>
            <span>24 months</span>
          </div>
        </div>
      </div>

      {/* Summary */}
      <Card className="bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>Policy Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-500">Selected Crops</Label>
              <p>{request.selectedCrops?.length || 0} crops selected</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Policy Duration</Label>
              <p>{request.policyDuration} months</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Total Premium</Label>
              <p className="font-semibold">RWF {calculateTotalPremium().toLocaleString()}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Total Coverage</Label>
              <p className="font-semibold">RWF {calculateTotalCoverage().toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignment Information */}
      <Card className="bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Automatic Assignment</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Satellite className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium">Satellite Surveyor</p>
                <p className="text-sm text-gray-600">Will be automatically assigned based on your location</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Camera className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">Drone Pilot</p>
                <p className="text-sm text-gray-600">Local drone operator will conduct aerial assessment</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Users className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium">Field Assessor</p>
                <p className="text-sm text-gray-600">Experienced assessor will visit your farm</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">Insurance Policy Request</CardTitle>
          <p className="text-center text-gray-600">
            Choose your preferred request method
          </p>
        </CardHeader>
        <CardContent>
          {/* Request Type Selection */}
          <div className="flex justify-center space-x-4 mb-8">
            <Button
              variant={requestType === 'web' ? 'default' : 'outline'}
              onClick={() => {
                setRequestType('web');
                setShowUSSDMenu(false);
              }}
              className="flex items-center space-x-2"
            >
              <Globe className="h-4 w-4" />
              <span>Web Portal</span>
            </Button>
            <Button
              variant={requestType === 'ussd' ? 'default' : 'outline'}
              onClick={() => {
                setRequestType('ussd');
                setShowUSSDMenu(true);
              }}
              className="flex items-center space-x-2"
            >
              <Phone className="h-4 w-4" />
              <span>USSD (*1828#)</span>
            </Button>
          </div>

          {/* Form Content */}
          {showUSSDMenu ? renderUSSDInterface() : renderWebForm()}

          {/* Action Buttons */}
          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            
            {!showUSSDMenu && (
              <Button
                onClick={handleWebSubmit}
                disabled={!request.selectedCrops || request.selectedCrops.length === 0}
                className="bg-green-600 hover:bg-green-700"
              >
                Submit Policy Request
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
