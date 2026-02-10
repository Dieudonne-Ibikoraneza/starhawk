import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "@/components/upload/FileUpload";
import { MapPicker } from "@/components/maps/MapPicker";
import { 
  AlertTriangle, 
  FileText, 
  MapPin, 
  Calendar, 
  Upload, 
  CheckCircle, 
  Clock, 
  Shield,
  Camera,
  DollarSign,
  Crop,
  CloudRain
} from "lucide-react";
import { ClaimRequest } from "@/types/enhanced-api";

interface ClaimFilingSystemProps {
  farmerId: string;
  onClaimSubmit: (claim: ClaimRequest) => void;
  onCancel: () => void;
}

export function ClaimFilingSystem({ farmerId, onClaimSubmit, onCancel }: ClaimFilingSystemProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [claim, setClaim] = useState<Partial<ClaimRequest>>({
    farmerId,
    requestType: 'web',
    status: 'pending_assignment',
    priority: 'medium'
  });

  const [activePolicies, setActivePolicies] = useState([
    {
      id: "POL001",
      cropType: "Maize",
      coverageAmount: 1200000,
      premium: 120000,
      status: "active",
      expiryDate: "2024-12-15",
      field: "Field A",
      hectares: 2.5
    },
    {
      id: "POL002", 
      cropType: "Rice",
      coverageAmount: 1800000,
      premium: 180000,
      status: "active",
      expiryDate: "2024-11-20",
      field: "Field B",
      hectares: 1.8
    }
  ]);

  const disasterTypes = [
    { value: 'DROUGHT', label: 'Drought', icon: CloudRain, description: 'Lack of rainfall affecting crop growth' },
    { value: 'FLOOD', label: 'Flood', icon: CloudRain, description: 'Excessive rainfall causing water damage' },
    { value: 'PEST_ATTACK', label: 'Pest Attack', icon: Crop, description: 'Insect or pest damage to crops' },
    { value: 'DISEASE_OUTBREAK', label: 'Disease Outbreak', icon: AlertTriangle, description: 'Plant disease affecting crop health' },
    { value: 'HAIL', label: 'Hail Damage', icon: CloudRain, description: 'Hail storm damage to crops' },
    { value: 'FIRE', label: 'Fire', icon: AlertTriangle, description: 'Fire damage to crops or fields' },
    { value: 'THEFT', label: 'Theft', icon: Shield, description: 'Crop theft or vandalism' },
    { value: 'STORM', label: 'Storm', icon: CloudRain, description: 'Storm damage to crops' },
    { value: 'FROST', label: 'Frost', icon: CloudRain, description: 'Frost damage to crops' }
  ];

  const totalSteps = 4;

  const handleInputChange = (field: string, value: any) => {
    setClaim(prev => ({ ...prev, [field]: value }));
  };

  const handleCoordinatesChange = (coordinates: [number, number]) => {
    handleInputChange('coordinates', coordinates);
  };

  const handleFileUpload = (files: File[]) => {
    // Handle evidence upload
    const newFiles = files.map(file => ({
      id: `file_${Date.now()}_${Math.random()}`,
      name: file.name,
      url: URL.createObjectURL(file),
      type: file.type,
      size: file.size
    }));
    
    setClaim(prev => ({
      ...prev,
      evidence: [...(prev.evidence || []), ...newFiles]
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(claim.policyId && claim.disasterType);
      case 2:
        return !!(claim.incidentDate && claim.description && claim.estimatedLoss);
      case 3:
        return !!(claim.coordinates && claim.affectedArea);
      case 4:
        return true; // Evidence is optional
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
      // Extract photo URLs from evidence files
      const damagePhotos = claim.evidence?.map((file: any) => file.url).filter((url: string) => url) || [];
      
      // Format according to API spec: { policyId, lossEventType, lossDescription, damagePhotos }
      const apiClaimData = {
        policyId: claim.policyId!,
        lossEventType: claim.disasterType?.toUpperCase() || '', // Map disasterType to lossEventType
        lossDescription: claim.description || '', // Map description to lossDescription
        damagePhotos: damagePhotos, // Extract URLs from evidence
      };
      
      // Also create full ClaimRequest for backward compatibility
      const finalClaim: ClaimRequest = {
        id: `claim_${Date.now()}`,
        farmerId,
        policyId: claim.policyId!,
        requestType: 'web',
        disasterType: claim.disasterType!,
        incidentDate: claim.incidentDate!,
        description: claim.description!,
        estimatedLoss: parseFloat(claim.estimatedLoss?.toString() || '0'),
        affectedArea: parseFloat(claim.affectedArea?.toString() || '0'),
        coordinates: claim.coordinates!,
        priority: claim.priority || 'medium',
        status: 'pending_assignment',
        assignedTeam: {
          leadAssessor: '',
          droneOperator: '',
          satelliteAnalyst: ''
        },
        trackingId: `TRK${Date.now()}`,
        submissionDate: new Date().toISOString(),
        // Add API-formatted data
        ...apiClaimData
      };
      
      onClaimSubmit(finalClaim);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div key={i} className="flex items-center">
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
            ${i + 1 <= currentStep 
              ? 'bg-red-600 text-white' 
              : 'bg-gray-200 text-gray-500'
            }
          `}>
            {i + 1}
          </div>
          {i < totalSteps - 1 && (
            <div className={`
              w-16 h-1 mx-2
              ${i + 1 < currentStep ? 'bg-red-600' : 'bg-gray-200'}
            `} />
          )}
        </div>
      ))}
    </div>
  );

  const renderPolicySelection = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Shield className="h-12 w-12 mx-auto text-red-600 mb-4" />
        <h3 className="text-xl font-semibold">Select Policy for Claim</h3>
        <p className="text-gray-600">Choose the active policy you want to file a claim against</p>
      </div>

      <div className="space-y-4">
        {activePolicies.map((policy) => (
          <Card
            key={policy.id}
            className={`cursor-pointer transition-all ${
              claim.policyId === policy.id
                ? 'ring-2 ring-red-500 bg-red-50'
                : 'hover:shadow-md'
            }`}
            onClick={() => {
              handleInputChange('policyId', policy.id);
              handleInputChange('cropType', policy.cropType);
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Shield className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Policy {policy.id}</h3>
                    <p className="text-gray-600">{policy.cropType} - {policy.field}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                      <span>{policy.hectares} hectares</span>
                      <span>Coverage: RWF {policy.coverageAmount.toLocaleString()}</span>
                      <span>Expires: {policy.expiryDate}</span>
                    </div>
                  </div>
                </div>
                <Badge variant="default" className="bg-green-600">
                  {policy.status.toUpperCase()}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {claim.policyId && (
        <Card className="bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-900">Policy Selected</span>
            </div>
            <p className="text-sm text-green-700">
              You have selected an active policy. You can now proceed to describe the loss event.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderDisasterSelection = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <AlertTriangle className="h-12 w-12 mx-auto text-red-600 mb-4" />
        <h3 className="text-xl font-semibold">Describe the Loss Event</h3>
        <p className="text-gray-600">Select the type of disaster that affected your crops</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {disasterTypes.map((disaster) => {
          const Icon = disaster.icon;
          return (
            <Card
              key={disaster.value}
              className={`cursor-pointer transition-all ${
                claim.disasterType === disaster.value
                  ? 'ring-2 ring-red-500 bg-red-50'
                  : 'hover:shadow-md'
              }`}
              onClick={() => handleInputChange('disasterType', disaster.value)}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <Icon className="h-6 w-6 text-red-600" />
                  <h3 className="font-semibold">{disaster.label}</h3>
                </div>
                <p className="text-sm text-gray-600">{disaster.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {claim.disasterType && (
        <Card className="bg-blue-50">
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="incidentDate">Incident Date *</Label>
                <Input
                  id="incidentDate"
                  type="date"
                  value={claim.incidentDate || ''}
                  onChange={(e) => handleInputChange('incidentDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description of Loss *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what happened to your crops..."
                  value={claim.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedLoss">Estimated Loss (RWF) *</Label>
                <Input
                  id="estimatedLoss"
                  type="number"
                  placeholder="Enter estimated financial loss"
                  value={claim.estimatedLoss || ''}
                  onChange={(e) => handleInputChange('estimatedLoss', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderLocationDetails = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <MapPin className="h-12 w-12 mx-auto text-blue-600 mb-4" />
        <h3 className="text-xl font-semibold">Location & Extent of Damage</h3>
        <p className="text-gray-600">Specify where the damage occurred and its extent</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label>Damage Location *</Label>
          <MapPicker
            coordinates={claim.coordinates || [30.1234, -1.9456]}
            onCoordinatesChange={handleCoordinatesChange}
            height="300px"
          />
          <p className="text-sm text-gray-500">
            Click on the map to mark the exact location of the damage
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="affectedArea">Affected Area (Hectares) *</Label>
          <Input
            id="affectedArea"
            type="number"
            step="0.1"
            placeholder="Enter affected area in hectares"
            value={claim.affectedArea || ''}
            onChange={(e) => handleInputChange('affectedArea', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Claim Priority</Label>
          <Select
            value={claim.priority || 'medium'}
            onValueChange={(value) => handleInputChange('priority', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select priority level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low Priority</SelectItem>
              <SelectItem value="medium">Medium Priority</SelectItem>
              <SelectItem value="high">High Priority</SelectItem>
              <SelectItem value="critical">Critical Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderEvidenceUpload = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Camera className="h-12 w-12 mx-auto text-purple-600 mb-4" />
        <h3 className="text-xl font-semibold">Upload Evidence (Optional)</h3>
        <p className="text-gray-600">Provide photos or documents to support your claim</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Supporting Evidence</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FileUpload
              onUpload={handleFileUpload}
              accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
              maxSize={10 * 1024 * 1024} // 10MB
              multiple={true}
            />
            
            {claim.evidence && claim.evidence.length > 0 && (
              <div className="space-y-2">
                <Label>Uploaded Files ({claim.evidence.length})</Label>
                <div className="space-y-2">
                  {claim.evidence.map((file, index) => (
                    <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium flex-1">{file.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {(file.size / 1024 / 1024).toFixed(1)}MB
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>What Happens Next?</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                <div>
                  <p className="font-medium">Automatic Assessor Assignment</p>
                  <p className="text-sm text-gray-600">The system will assign the nearest assessor to your location</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                <div>
                  <p className="font-medium">Field Assessment</p>
                  <p className="text-sm text-gray-600">An assessor will visit your farm to verify the damage</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                <div>
                  <p className="font-medium">Insurer Review</p>
                  <p className="text-sm text-gray-600">The insurer will review your claim and make a decision</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
                <div>
                  <p className="font-medium">Payout Processing</p>
                  <p className="text-sm text-gray-600">If approved, you'll receive payment according to policy terms</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderPolicySelection();
      case 2:
        return renderDisasterSelection();
      case 3:
        return renderLocationDetails();
      case 4:
        return renderEvidenceUpload();
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">File Insurance Claim</CardTitle>
          <p className="text-center text-gray-600">
            Report crop damage and request compensation
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
                className="bg-red-600 hover:bg-red-700"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!validateStep(currentStep)}
                className="bg-red-600 hover:bg-red-700"
              >
                Submit Claim
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
