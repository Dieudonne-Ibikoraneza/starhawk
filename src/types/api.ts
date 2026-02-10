export type Role = "insurer" | "government" | "assessor" | "admin";

export interface PolicyRequest {
  id: string;
  farmerId: string;
  farmerName: string;
  coverageType: "drought" | "flood" | "pest" | "comprehensive";
  coverageAmount: number;
  durationMonths: number;
  status: "pending" | "assigned" | "assessing" | "underwriting" | "approved" | "rejected";
  assignedSurveyors: { id: string; name: string }[];
  coords: [number, number];
  createdAt: string;
  farmSize?: number;
  season?: "A" | "B" | "C";
}

export interface Assessment {
  id: string;
  requestId: string;
  farmerId: string;
  farmerName: string;
  season: "A" | "B" | "C";
  plantingDate: string;
  harvestEta: string;
  cropVariety: string;
  practices: {
    tilling: string;
    fertilizer: { type: string; schedule: string };
    irrigation: string;
    pestControl: string;
  };
  files: { name: string; url: string }[];
  comments: string;
  qaStatus: "draft" | "submitted" | "returned" | "final";
  riskScore?: number;
  flags?: string[];
  coords: [number, number];
  createdAt: string;
  updatedAt: string;
}

export interface Claim {
  id: string;
  farmerId: string;
  farmerName: string;
  requestId: string;
  disaster: "drought" | "flood" | "pest" | "disease";
  severity: "low" | "medium" | "high";
  files: { name: string; url: string }[];
  status: "pending" | "assessing" | "approved" | "rejected" | "paid";
  amount: number;
  description: string;
  coords: [number, number];
  createdAt: string;
  updatedAt: string;
}

export interface GovMetrics {
  totals: {
    farmers: number;
    active: number;
    requests: { pending: number; approved: number; rejected: number };
  };
  geography: {
    region: string;
    farmerCount: number;
    riskLevel: "low" | "medium" | "high";
  }[];
  claims: {
    submitted: number;
    processed: number;
    approved: number;
    rejected: number;
    avgProcessingDays: number;
    payoutsUSD: number;
  };
}

export interface FarmerProfile {
  id: string;
  name: string;
  phone: string;
  upi: string;
  farm: {
    coords: [number, number];
    sizeHa: number;
    ownershipDocUrl?: string;
  };
  createdAt: string;
}

export interface InsurerProfile {
  id: string;
  companyName: string;
  licenseNumber: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
}

export interface MonitoringStage {
  name: string;
  kpis: { label: string; value: string }[];
  lastUpdated: string;
  status: "completed" | "in_progress" | "pending";
  images?: { name: string; url: string }[];
  notes?: string;
}
