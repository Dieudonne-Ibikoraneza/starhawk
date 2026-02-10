// Enhanced API types for AI Agricultural Insurance Platform

export interface FarmerProfile {
  id: string;
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    upiCredentials: {
      upiId: string;
      bankAccount: string;
      ifscCode: string;
    };
  };
  farmDetails: {
    location: {
      coordinates: [number, number]; // [longitude, latitude]
      address: string;
      district: string;
      province: string;
    };
    totalFarmSize: number; // in hectares
    landOwnership: {
      verified: boolean;
      documentType: 'title_deed' | 'lease_agreement' | 'customary_rights';
      documentUrl?: string;
    };
  };
  registrationDate: string;
  status: 'pending_verification' | 'verified' | 'suspended';
}

export interface InsurerProfile {
  id: string;
  companyInfo: {
    name: string;
    licenseNumber: string;
    registrationNumber: string;
    jurisdiction: string[];
  };
  systemIntegration: {
    apiCredentials: {
      clientId: string;
      clientSecret: string;
      webhookUrl: string;
    };
    paymentGateway: {
      provider: 'stripe' | 'razorpay' | 'paystack';
      credentials: Record<string, string>;
    };
  };
  users: InsurerUser[];
  verificationStatus: 'pending' | 'approved' | 'rejected';
}

export interface InsurerUser {
  id: string;
  name: string;
  email: string;
  role: 'underwriter' | 'assessor' | 'administrator' | 'analyst';
  permissions: string[];
  assignedRegions: string[];
}

export interface PolicyRequest {
  id: string;
  farmerId: string;
  requestType: 'web' | 'ussd';
  coverageType: 'crop_insurance' | 'livestock_insurance' | 'equipment_insurance';
  policyDuration: number; // months
  coverageAmount: number;
  selectedCrops: string[];
  requestDate: string;
  status: 'pending_assignment' | 'assigned' | 'assessment_in_progress' | 'under_review' | 'approved' | 'rejected';
  assignedSurveyors: {
    dronePilot: string;
    satelliteSurveyor: string;
    fieldAssessor: string;
  };
  trackingId: string;
}

export interface RiskAssessment {
  id: string;
  policyRequestId: string;
  farmerId: string;
  assessorId: string;
  assessmentDate: string;
  seasonInfo: {
    seasonType: 'A' | 'B' | 'C';
    plantingDate: string;
    expectedHarvest: string;
    cropVariety: string;
    seedSpecifications: {
      type: string;
      supplier: string;
      germinationRate: number;
    };
    tillingMethods: string[];
  };
  agriculturalPractices: {
    fertilizers: {
      type: string;
      applicationSchedule: string[];
      lastApplied: string;
    };
    irrigation: {
      systemType: 'drip' | 'sprinkler' | 'flood' | 'manual';
      waterAvailability: 'excellent' | 'good' | 'moderate' | 'poor';
      frequency: string;
    };
    pestControl: {
      measures: string[];
      lastTreatment: string;
      effectiveness: 'high' | 'medium' | 'low';
    };
  };
  riskFactors: {
    soilQuality: 'excellent' | 'good' | 'moderate' | 'poor';
    weatherExposure: 'low' | 'medium' | 'high';
    pestHistory: 'none' | 'minor' | 'moderate' | 'severe';
    diseaseSusceptibility: 'low' | 'medium' | 'high';
    marketAccess: 'excellent' | 'good' | 'moderate' | 'poor';
  };
  documentation: {
    satelliteImages: AssessmentImage[];
    droneFootage: AssessmentVideo[];
    fieldPhotos: AssessmentImage[];
    reports: AssessmentReport[];
  };
  comments: string;
  riskScore: number; // 0-100
  riskCategory: 'low' | 'medium' | 'high';
  qaStatus: 'draft' | 'submitted' | 'returned' | 'approved';
  submissionDate: string;
}

export interface AssessmentImage {
  id: string;
  url: string;
  caption: string;
  coordinates: [number, number];
  timestamp: string;
  analysisResults?: {
    cropHealth: number;
    weedDensity: number;
    diseasePresence: boolean;
    aiConfidence: number;
  };
}

export interface AssessmentVideo {
  id: string;
  url: string;
  duration: number; // seconds
  coordinates: [number, number];
  timestamp: string;
  analysisResults?: {
    cropGrowth: number;
    pestActivity: boolean;
    irrigationEfficiency: number;
    aiConfidence: number;
  };
}

export interface AssessmentReport {
  id: string;
  title: string;
  content: string;
  fileUrl: string;
  reportType: 'satellite_analysis' | 'drone_survey' | 'field_inspection' | 'weather_impact';
  generatedDate: string;
}

export interface ClaimRequest {
  id: string;
  farmerId: string;
  policyId: string;
  requestType: 'web' | 'ussd' | 'mobile_app';
  disasterType: 'drought' | 'flood' | 'pest_attack' | 'disease_outbreak' | 'hail' | 'fire' | 'theft';
  incidentDate: string;
  description: string;
  estimatedLoss: number;
  affectedArea: number; // hectares
  coordinates: [number, number];
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending_assignment' | 'assessment_in_progress' | 'under_review' | 'approved' | 'rejected' | 'paid';
  assignedTeam: {
    leadAssessor: string;
    droneOperator: string;
    satelliteAnalyst: string;
  };
  trackingId: string;
  submissionDate: string;
}

export interface LossAssessment {
  id: string;
  claimId: string;
  assessorId: string;
  assessmentDate: string;
  disasterCategory: {
    primary: string;
    secondary?: string;
    severity: 'minor' | 'moderate' | 'severe' | 'catastrophic';
  };
  damageMapping: {
    totalAffectedArea: number;
    completelyDamaged: number;
    partiallyDamaged: number;
    unaffected: number;
    damagePercentage: number;
  };
  financialLoss: {
    cropValue: number;
    lostYield: number;
    recoveryCost: number;
    totalLoss: number;
    recommendedPayout: number;
  };
  documentation: {
    beforeImages: AssessmentImage[];
    afterImages: AssessmentImage[];
    damageVideos: AssessmentVideo[];
    satelliteAnalysis: AssessmentReport[];
    droneSurvey: AssessmentReport[];
  };
  assessorComments: string;
  recommendations: string[];
  qaStatus: 'draft' | 'submitted' | 'returned' | 'approved';
  submissionDate: string;
}

export interface MonitoringData {
  id: string;
  policyId: string;
  farmerId: string;
  monitoringStage: 'planting' | 'germination' | 'vegetation' | 'flowering';
  stageDate: string;
  cropHealth: {
    overallHealth: number; // 0-100
    growthRate: number;
    colorIndex: number;
    moistureLevel: number;
  };
  threats: {
    weedInfestation: {
      detected: boolean;
      species: string[];
      density: number;
      coverage: number;
    };
    diseaseOutbreak: {
      detected: boolean;
      diseaseType: string[];
      severity: number;
      affectedArea: number;
    };
    pestActivity: {
      detected: boolean;
      pestType: string[];
      population: number;
      damage: number;
    };
    nutrientDeficiency: {
      detected: boolean;
      deficientNutrients: string[];
      severity: number;
    };
    irrigationIssues: {
      detected: boolean;
      issueType: string;
      severity: number;
    };
  };
  weatherImpact: {
    rainfall: number;
    temperature: number;
    humidity: number;
    windSpeed: number;
    riskLevel: 'low' | 'medium' | 'high';
  };
  dataSource: 'satellite' | 'drone' | 'field_sensor' | 'manual';
  confidence: number; // 0-100
  timestamp: string;
}

export interface UnderwritingDecision {
  id: string;
  assessmentId: string;
  underwriterId: string;
  decisionDate: string;
  decision: 'approve' | 'reject' | 'request_more_info' | 'conditional_approval';
  decisionFactors: {
    riskScore: number;
    historicalData: number;
    weatherPatterns: number;
    marketTrends: number;
    aiRecommendation: number;
  };
  aiInsights: {
    riskProbability: number;
    recommendedPremium: number;
    suggestedCoverage: number;
    fraudIndicators: string[];
    confidence: number;
  };
  conditions?: string[];
  notes: string;
  approvedAmount?: number;
  premium?: number;
  effectiveDate?: string;
}

export interface GovernmentAnalytics {
  userMetrics: {
    totalFarmers: number;
    activeFarmers: number;
    newRegistrations: number;
    verificationPending: number;
  };
  policyMetrics: {
    totalRequests: number;
    pendingRequests: number;
    approvedPolicies: number;
    rejectedPolicies: number;
    activePolicies: number;
    policyUptakeRate: number;
  };
  geographicDistribution: {
    region: string;
    farmerCount: number;
    policyCount: number;
    coverageArea: number;
    riskLevel: 'low' | 'medium' | 'high';
  }[];
  riskIntelligence: {
    primaryThreats: {
      threat: string;
      frequency: number;
      severity: number;
      affectedArea: number;
      economicImpact: number;
    }[];
    seasonalPatterns: {
      season: string;
      riskLevel: number;
      commonThreats: string[];
      averageLoss: number;
    }[];
  };
  claimsAnalytics: {
    totalClaims: number;
    processedClaims: number;
    pendingClaims: number;
    validationRate: number;
    averageProcessingTime: number;
    totalPayouts: number;
    averagePayout: number;
  };
  predictiveAnalytics: {
    riskForecast: {
      timeframe: string;
      predictedRisk: number;
      confidence: number;
      recommendations: string[];
    }[];
    seasonalPredictions: {
      season: string;
      expectedLoss: number;
      riskFactors: string[];
      mitigationStrategies: string[];
    }[];
  };
}

export interface NotificationConfig {
  id: string;
  userId: string;
  userType: 'farmer' | 'insurer' | 'assessor' | 'government';
  channels: {
    sms: boolean;
    email: boolean;
    whatsapp: boolean;
    push: boolean;
  };
  preferences: {
    claimUpdates: boolean;
    paymentReminders: boolean;
    disasterAlerts: boolean;
    policyRenewals: boolean;
    assessmentSchedules: boolean;
  };
  language: 'en' | 'rw' | 'fr';
  timezone: string;
}

export interface PaymentTransaction {
  id: string;
  farmerId: string;
  policyId?: string;
  claimId?: string;
  transactionType: 'premium_payment' | 'claim_payout' | 'refund';
  amount: number;
  currency: 'RWF' | 'USD';
  paymentMethod: 'mobile_money' | 'ussd' | 'bank_transfer' | 'card';
  paymentProvider: 'mtn' | 'airtel' | 'equity' | 'bk';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  transactionId: string;
  reference: string;
  initiatedDate: string;
  completedDate?: string;
  failureReason?: string;
}

export interface USSDRequest {
  id: string;
  farmerId: string;
  phoneNumber: string;
  requestType: 'policy_request' | 'claim_submission' | 'payment' | 'status_check';
  sessionId: string;
  menuLevel: number;
  inputData: Record<string, any>;
  status: 'active' | 'completed' | 'timeout' | 'error';
  startTime: string;
  endTime?: string;
  response: string[];
}
