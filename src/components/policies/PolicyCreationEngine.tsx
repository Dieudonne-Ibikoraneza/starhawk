import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  Settings, 
  Calculator, 
  CheckCircle, 
  AlertTriangle, 
  DollarSign, 
  Calendar, 
  Crop, 
  MapPin,
  TrendingUp,
  Database,
  Zap
} from "lucide-react";

interface PolicyRule {
  id: string;
  name: string;
  description: string;
  conditions: {
    cropType: string[];
    riskLevel: string[];
    farmSize: {
      min: number;
      max: number;
    };
    location: string[];
  };
  calculations: {
    coverageRate: number; // RWF per hectare
    premiumRate: number; // Percentage of coverage
    duration: number; // Days
    deductible: number; // Percentage
  };
  status: 'active' | 'inactive';
}

interface PolicyTemplate {
  id: string;
  name: string;
  cropType: string;
  baseCoverageRate: number;
  basePremiumRate: number;
  standardDuration: number;
  description: string;
}

interface PolicyCreationEngineProps {
  assessmentId: string;
  farmerId: string;
  cropType: string;
  farmSize: number;
  riskLevel: 'low' | 'medium' | 'high';
  location: string;
  onPolicyCreated: (policy: any) => void;
  onCancel: () => void;
}

export function PolicyCreationEngine({ 
  assessmentId, 
  farmerId, 
  cropType, 
  farmSize, 
  riskLevel, 
  location,
  onPolicyCreated,
  onCancel 
}: PolicyCreationEngineProps) {
  const [activeTab, setActiveTab] = useState("rules");
  const [selectedRule, setSelectedRule] = useState<string>("");
  const [customCalculations, setCustomCalculations] = useState({
    coverageRate: 0,
    premiumRate: 0,
    duration: 0,
    deductible: 0
  });

  // Mock policy templates
  const policyTemplates: PolicyTemplate[] = [
    {
      id: "template_001",
      name: "Maize Standard Policy",
      cropType: "maize",
      baseCoverageRate: 480000, // RWF per hectare
      basePremiumRate: 10, // 10% of coverage
      standardDuration: 120, // 4 months
      description: "Standard maize insurance policy with 120-day coverage period"
    },
    {
      id: "template_002",
      name: "Rice Premium Policy",
      cropType: "rice",
      baseCoverageRate: 600000,
      basePremiumRate: 12,
      standardDuration: 150,
      description: "Premium rice insurance policy with extended coverage"
    },
    {
      id: "template_003",
      name: "Beans Basic Policy",
      cropType: "beans",
      baseCoverageRate: 360000,
      basePremiumRate: 8,
      standardDuration: 90,
      description: "Basic beans insurance policy with 90-day coverage"
    },
    {
      id: "template_004",
      name: "Coffee Premium Policy",
      cropType: "coffee",
      baseCoverageRate: 1200000,
      basePremiumRate: 15,
      standardDuration: 365,
      description: "Premium coffee insurance policy with annual coverage"
    }
  ];

  // Mock business rules
  const businessRules: PolicyRule[] = [
    {
      id: "rule_001",
      name: "Low Risk Maize Policy",
      description: "Standard policy for low-risk maize farms",
      conditions: {
        cropType: ["maize"],
        riskLevel: ["low"],
        farmSize: { min: 0.5, max: 10 },
        location: ["all"]
      },
      calculations: {
        coverageRate: 480000,
        premiumRate: 8,
        duration: 120,
        deductible: 5
      },
      status: 'active'
    },
    {
      id: "rule_002",
      name: "High Risk Adjustment",
      description: "Adjusted rates for high-risk farms",
      conditions: {
        cropType: ["maize", "rice", "beans"],
        riskLevel: ["high"],
        farmSize: { min: 0.5, max: 10 },
        location: ["all"]
      },
      calculations: {
        coverageRate: 400000,
        premiumRate: 15,
        duration: 120,
        deductible: 10
      },
      status: 'active'
    },
    {
      id: "rule_003",
      name: "Large Farm Policy",
      description: "Special rates for large farms (>5 hectares)",
      conditions: {
        cropType: ["all"],
        riskLevel: ["low", "medium"],
        farmSize: { min: 5, max: 50 },
        location: ["all"]
      },
      calculations: {
        coverageRate: 450000,
        premiumRate: 7,
        duration: 120,
        deductible: 3
      },
      status: 'active'
    }
  ];

  const calculatePolicy = () => {
    const template = policyTemplates.find(t => t.cropType === cropType.toLowerCase());
    const applicableRule = businessRules.find(rule => 
      rule.status === 'active' &&
      rule.conditions.cropType.includes(cropType.toLowerCase()) &&
      rule.conditions.riskLevel.includes(riskLevel) &&
      farmSize >= rule.conditions.farmSize.min &&
      farmSize <= rule.conditions.farmSize.max
    );

    let coverageRate = template?.baseCoverageRate || 400000;
    let premiumRate = template?.basePremiumRate || 10;
    let duration = template?.standardDuration || 120;
    let deductible = 5;

    // Apply rule adjustments
    if (applicableRule) {
      coverageRate = applicableRule.calculations.coverageRate;
      premiumRate = applicableRule.calculations.premiumRate;
      duration = applicableRule.calculations.duration;
      deductible = applicableRule.calculations.deductible;
    }

    // Risk level adjustments
    if (riskLevel === 'high') {
      coverageRate *= 0.9; // 10% reduction for high risk
      premiumRate *= 1.5; // 50% increase for high risk
    } else if (riskLevel === 'low') {
      premiumRate *= 0.8; // 20% reduction for low risk
    }

    const totalCoverage = coverageRate * farmSize;
    const premiumAmount = (totalCoverage * premiumRate) / 100;
    const deductibleAmount = (totalCoverage * deductible) / 100;

    return {
      coverageRate: Math.round(coverageRate),
      totalCoverage: Math.round(totalCoverage),
      premiumAmount: Math.round(premiumAmount),
      deductibleAmount: Math.round(deductibleAmount),
      premiumRate,
      deductible,
      duration,
      effectiveDate: new Date().toISOString(),
      expiryDate: new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString()
    };
  };

  const policyCalculation = calculatePolicy();

  const renderBusinessRules = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Business Rules Configuration</h3>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Settings className="h-4 w-4 mr-2" />
          Configure Rules
        </Button>
      </div>

      <div className="space-y-4">
        {businessRules.map((rule) => (
          <Card key={rule.id} className={selectedRule === rule.id ? 'ring-2 ring-blue-500' : ''}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold">{rule.name}</h4>
                  <p className="text-sm text-gray-600">{rule.description}</p>
                </div>
                <Badge variant={rule.status === 'active' ? 'default' : 'secondary'}>
                  {rule.status}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-500">Conditions</Label>
                  <div className="space-y-1">
                    <p><strong>Crops:</strong> {rule.conditions.cropType.join(', ')}</p>
                    <p><strong>Risk Levels:</strong> {rule.conditions.riskLevel.join(', ')}</p>
                    <p><strong>Farm Size:</strong> {rule.conditions.farmSize.min} - {rule.conditions.farmSize.max} ha</p>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-500">Calculations</Label>
                  <div className="space-y-1">
                    <p><strong>Coverage Rate:</strong> RWF {rule.calculations.coverageRate.toLocaleString()}/ha</p>
                    <p><strong>Premium Rate:</strong> {rule.calculations.premiumRate}%</p>
                    <p><strong>Duration:</strong> {rule.calculations.duration} days</p>
                    <p><strong>Deductible:</strong> {rule.calculations.deductible}%</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setSelectedRule(rule.id)}
                >
                  Apply Rule
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderPolicyTemplates = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Policy Templates</h3>
        <Button className="bg-green-600 hover:bg-green-700">
          <Database className="h-4 w-4 mr-2" />
          Manage Templates
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {policyTemplates.map((template) => (
          <Card key={template.id}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Crop className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold">{template.name}</h4>
                  <p className="text-sm text-gray-600 capitalize">{template.cropType}</p>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">{template.description}</p>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Coverage Rate:</span>
                  <span className="font-medium">RWF {template.baseCoverageRate.toLocaleString()}/ha</span>
                </div>
                <div className="flex justify-between">
                  <span>Premium Rate:</span>
                  <span className="font-medium">{template.basePremiumRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span className="font-medium">{template.standardDuration} days</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderPolicyCalculation = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Calculator className="h-6 w-6 text-blue-600" />
        <h3 className="text-lg font-semibold">Automated Policy Calculation</h3>
      </div>

      <Card className="bg-gradient-to-r from-blue-50 to-green-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Generated Policy Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Input Parameters */}
          <div>
            <h4 className="font-semibold mb-3">Input Parameters</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="p-3 bg-white rounded-lg">
                <Label className="text-gray-500">Crop Type</Label>
                <p className="font-medium capitalize">{cropType}</p>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <Label className="text-gray-500">Farm Size</Label>
                <p className="font-medium">{farmSize} hectares</p>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <Label className="text-gray-500">Risk Level</Label>
                <Badge variant={riskLevel === 'low' ? 'default' : riskLevel === 'medium' ? 'secondary' : 'destructive'}>
                  {riskLevel.toUpperCase()}
                </Badge>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <Label className="text-gray-500">Location</Label>
                <p className="font-medium">{location}</p>
              </div>
            </div>
          </div>

          {/* Policy Calculations */}
          <div>
            <h4 className="font-semibold mb-3">Policy Calculations</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <span className="text-gray-600">Coverage Rate per Hectare</span>
                  <span className="font-semibold text-lg">RWF {policyCalculation.coverageRate.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <span className="text-gray-600">Total Coverage Amount</span>
                  <span className="font-semibold text-lg text-green-600">RWF {policyCalculation.totalCoverage.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <span className="text-gray-600">Premium Rate</span>
                  <span className="font-semibold">{policyCalculation.premiumRate}%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <span className="text-gray-600">Premium Amount</span>
                  <span className="font-semibold text-lg text-blue-600">RWF {policyCalculation.premiumAmount.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <span className="text-gray-600">Deductible Rate</span>
                  <span className="font-semibold">{policyCalculation.deductible}%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <span className="text-gray-600">Deductible Amount</span>
                  <span className="font-semibold text-lg text-orange-600">RWF {policyCalculation.deductibleAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <span className="text-gray-600">Policy Duration</span>
                  <span className="font-semibold">{policyCalculation.duration} days</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <span className="text-gray-600">Expiry Date</span>
                  <span className="font-semibold">{new Date(policyCalculation.expiryDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Risk Adjustments */}
          <div>
            <h4 className="font-semibold mb-3">Risk Adjustments Applied</h4>
            <div className="space-y-2">
              {riskLevel === 'high' && (
                <div className="flex items-center space-x-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span>High Risk: Coverage reduced by 10%, Premium increased by 50%</span>
                </div>
              )}
              {riskLevel === 'low' && (
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Low Risk: Premium reduced by 20%</span>
                </div>
              )}
              {farmSize > 5 && (
                <div className="flex items-center space-x-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span>Large Farm: Special rates applied</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const handleCreatePolicy = () => {
    const newPolicy = {
      id: `POL${Date.now()}`,
      farmerId,
      assessmentId,
      cropType,
      farmSize,
      riskLevel,
      location,
      ...policyCalculation,
      status: 'pending_payment',
      createdAt: new Date().toISOString(),
      createdBy: 'system'
    };

    onPolicyCreated(newPolicy);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">Automated Policy Creation Engine</CardTitle>
          <p className="text-center text-gray-600">
            AI-powered policy generation with business rules and risk adjustments
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="rules">Business Rules</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="calculation">Policy Calculation</TabsTrigger>
            </TabsList>

            <TabsContent value="rules" className="mt-6">
              {renderBusinessRules()}
            </TabsContent>

            <TabsContent value="templates" className="mt-6">
              {renderPolicyTemplates()}
            </TabsContent>

            <TabsContent value="calculation" className="mt-6">
              {renderPolicyCalculation()}
            </TabsContent>
          </Tabs>

          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreatePolicy}
              className="bg-green-600 hover:bg-green-700"
            >
              <Zap className="h-4 w-4 mr-2" />
              Create Policy
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
