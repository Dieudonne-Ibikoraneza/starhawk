// Government API Service
// Using centralized API configuration
import { API_BASE_URL, getAuthToken } from "@/config/api";

const GOVERNMENT_BASE_URL = `${API_BASE_URL}/government`;

export class GovernmentApiService {
  private baseURL: string;

  constructor(baseURL: string = GOVERNMENT_BASE_URL) {
    this.baseURL = baseURL;
  }

  private getToken(): string | null {
    return getAuthToken();
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const headers = new Headers(options.headers);
    headers.set("Content-Type", "application/json");
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        localStorage.removeItem("userId");
        localStorage.removeItem("phoneNumber");
        localStorage.removeItem("email");

        if (typeof window !== "undefined") {
          window.location.href = "/";
        }

        throw new Error("Authentication required. Please log in again.");
      }

      let data: any;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || `HTTP error! status: ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            data.detail ||
            `HTTP error! status: ${response.status}`,
        );
      }

      // Backend responses are wrapped as { message, data, success }; unwrap
      // so callers deal with the actual payload shape.
      return (
        data &&
        typeof data === "object" &&
        "data" in data &&
        ("success" in data || "message" in data)
          ? data.data
          : data
      ) as T;
    } catch (error) {
      console.error("Government API request failed:", error);
      throw error;
    }
  }

  private qs(params: Record<string, string | number | undefined>): string {
    const entries = Object.entries(params).filter(
      ([, v]) => v !== undefined && v !== "",
    );
    if (!entries.length) return "";
    return (
      "?" +
      entries
        .map(
          ([k, v]) =>
            `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`,
        )
        .join("&")
    );
  }

  // ─── Current user's own region ───────────────────────────────────────────

  getMyRegion(): Promise<{
    regionId: string;
    name: string;
    level: string;
    parentId?: string;
    hierarchyPath: string;
  }> {
    return this.request("/me/region");
  }

  // ─── Region overview & leaderboard ───────────────────────────────────────

  getRegionAnalytics(regionId: string) {
    return this.request(`/analytics/region/${encodeURIComponent(regionId)}`);
  }

  getSubRegionsLeaderboard(regionId: string) {
    return this.request(`/regions/${encodeURIComponent(regionId)}/sub-regions`);
  }

  getRegionLeaderboard(
    regionId: string,
    options: { level?: string; season?: string } = {},
  ) {
    return this.request<RegionLeaderboard>(
      `/leaderboard/${encodeURIComponent(regionId)}${this.qs(options)}`,
    );
  }

  refreshRegionNdvi(regionId: string) {
    return this.request<NdviRefreshResult>(
      `/ndvi/refresh/${encodeURIComponent(regionId)}`,
      { method: "POST" },
    );
  }

  getRegionAlerts(regionId: string) {
    return this.request<GovernmentAlert[]>(
      `/analytics/alerts/${encodeURIComponent(regionId)}`,
    );
  }
  getRegionTrajectory(regionId: string, season?: string) {
    return this.request<GovernmentTrajectory>(
      `/analytics/trajectory/${encodeURIComponent(regionId)}${this.qs({ season })}`,
    );
  }
  getRegionTrends(regionId: string) {
    return this.request(`/analytics/trends/${encodeURIComponent(regionId)}`);
  }

  // ─── Farmers ─────────────────────────────────────────────────────────────

  getRegionFarmers(regionId: string, page = 1, limit = 10) {
    return this.request(
      `/farmers/${encodeURIComponent(regionId)}${this.qs({ page, limit })}`,
    );
  }

  // ─── Claims epicenters (legacy) ───────────────────────────────────────────

  getClaimsEpicenters(regionId: string) {
    return this.request(`/claims/epicenters/${encodeURIComponent(regionId)}`);
  }

  // ─── Policies analytics ───────────────────────────────────────────────────

  getPoliciesAnalytics(regionId: string, season?: string) {
    return this.request<GovernmentPolicyAnalytics>(
      `/policies/${encodeURIComponent(regionId)}${this.qs({ season })}`,
    );
  }

  // ─── Claims & losses analytics ────────────────────────────────────────────

  getClaimsAndLosses(regionId: string, season?: string) {
    return this.request<GovernmentClaimsAnalytics>(
      `/claims/${encodeURIComponent(regionId)}${this.qs({ season })}`,
    );
  }

  // ─── Subsidies analytics ──────────────────────────────────────────────────

  getSubsidiesAnalytics(regionId: string) {
    return this.request<SubsidiesAnalytics>(
      `/subsidies/${encodeURIComponent(regionId)}`,
    );
  }

  // ─── Season comparison ────────────────────────────────────────────────────

  compareSeasons(regionId: string, seasons?: string[]) {
    const seasonsParam =
      seasons && seasons.length ? seasons.join(",") : undefined;
    return this.request<{ region: GovernmentRegion; seasons: SeasonMetrics[] }>(
      `/seasons/${encodeURIComponent(regionId)}/compare${this.qs({ seasons: seasonsParam })}`,
    );
  }

  // ─── Reference data ───────────────────────────────────────────────────────

  getReferenceCrops(): Promise<string[]> {
    return this.request("/reference/crops");
  }

  getReferenceSeasons(): Promise<string[]> {
    return this.request("/reference/seasons");
  }

  getReferenceLossCauses(): Promise<string[]> {
    return this.request("/reference/loss-causes");
  }

  getReferenceClaimStatuses(): Promise<string[]> {
    return this.request("/reference/claim-statuses");
  }

  getAdministrativeRegionsTree() {
    return this.request<AdministrativeRegion[]>(
      "/reference/administrative-regions",
    );
  }

  // ─── Registry endpoints (paginated lists) ────────────────────────────────

  getPolicyRegistry(
    regionId: string,
    page = 1,
    limit = 20,
    status?: string,
    options: RegistryOptions = {},
  ) {
    return this.request<RegistryResult<PolicyRegistryRow>>(
      `/policy-registry/${encodeURIComponent(regionId)}${this.qs({ page, limit, status, ...options })}`,
    );
  }

  getClaimsRegistry(
    regionId: string,
    page = 1,
    limit = 20,
    status?: string,
    cause?: string,
    options: RegistryOptions = {},
  ) {
    return this.request<RegistryResult<ClaimRegistryRow>>(
      `/claims-registry/${encodeURIComponent(regionId)}${this.qs({ page, limit, status, cause, ...options })}`,
    );
  }

  getSubsidyInvoices(regionId: string, season?: string) {
    return this.request<SubsidyInvoiceSummary>(
      `/subsidy-invoices/${encodeURIComponent(regionId)}${this.qs({ season })}`,
    );
  }
  getSubsidyInvoice(regionId: string, id: string) {
    return this.request<SubsidyInvoice>(
      `/subsidy-invoices/${encodeURIComponent(regionId)}/${encodeURIComponent(id)}`,
    );
  }
  createSubsidyInvoice(regionId: string, insurerId: string, season: string) {
    return this.request<SubsidyInvoice>(
      `/subsidy-invoices/${encodeURIComponent(regionId)}`,
      { method: "POST", body: JSON.stringify({ insurerId, season }) },
    );
  }
  recordSubsidyPayment(
    regionId: string,
    id: string,
    paymentReference: string,
    paidAt: string,
  ) {
    return this.request<SubsidyInvoice>(
      `/subsidy-invoices/${encodeURIComponent(regionId)}/${encodeURIComponent(id)}/payment`,
      { method: "POST", body: JSON.stringify({ paymentReference, paidAt }) },
    );
  }
  rejectSubsidyInvoice(regionId: string, id: string, reason: string) {
    return this.request<SubsidyInvoice>(
      `/subsidy-invoices/${encodeURIComponent(regionId)}/${encodeURIComponent(id)}/reject`,
      { method: "POST", body: JSON.stringify({ reason }) },
    );
  }

  getSubsidyStatements(regionId: string) {
    return this.request<SubsidyStatement[]>(
      `/subsidy-statements/${encodeURIComponent(regionId)}`,
    );
  }

  // ─── Detail pages ──────────────────────────────────────────────────────────

  getClaimDetail(claimId: string) {
    return this.request(`/claim-detail/${encodeURIComponent(claimId)}`);
  }

  getFarmerDetail(farmerId: string) {
    return this.request<FarmerDetail>(
      `/farmer-detail/${encodeURIComponent(farmerId)}`,
    );
  }
}

const governmentApiService = new GovernmentApiService();

export const getMyRegion = () => governmentApiService.getMyRegion();

export const getRegionAnalytics = (regionId: string) =>
  governmentApiService.getRegionAnalytics(regionId);

export const getSubRegionsLeaderboard = (regionId: string) =>
  governmentApiService.getSubRegionsLeaderboard(regionId);

export const getRegionLeaderboard = (
  regionId: string,
  options: { level?: string; season?: string } = {},
) => governmentApiService.getRegionLeaderboard(regionId, options);

export const getRegionTrends = (regionId: string) =>
  governmentApiService.getRegionTrends(regionId);

export const getRegionFarmers = (
  regionId: string,
  page?: number,
  limit?: number,
) => governmentApiService.getRegionFarmers(regionId, page, limit);

export const getClaimsEpicenters = (regionId: string) =>
  governmentApiService.getClaimsEpicenters(regionId);

export const getPoliciesAnalytics = (regionId: string, season?: string) =>
  governmentApiService.getPoliciesAnalytics(regionId, season);

export const getClaimsAndLosses = (regionId: string, season?: string) =>
  governmentApiService.getClaimsAndLosses(regionId, season);

export const getSubsidiesAnalytics = (regionId: string) =>
  governmentApiService.getSubsidiesAnalytics(regionId);

export const compareSeasons = (regionId: string, seasons?: string[]) =>
  governmentApiService.compareSeasons(regionId, seasons);

export const getReferenceCrops = () => governmentApiService.getReferenceCrops();

export const getReferenceSeasons = () =>
  governmentApiService.getReferenceSeasons();

export const getReferenceLossCauses = () =>
  governmentApiService.getReferenceLossCauses();

export const getReferenceClaimStatuses = () =>
  governmentApiService.getReferenceClaimStatuses();

export const getAdministrativeRegionsTree = () =>
  governmentApiService.getAdministrativeRegionsTree();

export const getPolicyRegistry = (
  regionId: string,
  page?: number,
  limit?: number,
  status?: string,
  options: RegistryOptions = {},
) =>
  governmentApiService.getPolicyRegistry(
    regionId,
    page,
    limit,
    status,
    options,
  );

export const getClaimsRegistry = (
  regionId: string,
  page?: number,
  limit?: number,
  status?: string,
  cause?: string,
  options: RegistryOptions = {},
) =>
  governmentApiService.getClaimsRegistry(
    regionId,
    page,
    limit,
    status,
    cause,
    options,
  );

export const getClaimDetail = (claimId: string) =>
  governmentApiService.getClaimDetail(claimId);

export const getFarmerDetail = (farmerId: string) =>
  governmentApiService.getFarmerDetail(farmerId);

export default governmentApiService;

export const getSubsidyStatements = (regionId: string) =>
  governmentApiService.getSubsidyStatements(regionId);

export interface SubsidyStatement {
  id: string;
  insurerName: string;
  season: string;
  policyCount: number;
  totalPremium: number;
  policies: {
    id: string;
    policyNumber: string;
    holder: string;
    crop: string | null;
    premiumAmount: number;
  }[];
}
export interface GovernmentRegion {
  regionId: string;
  name: string;
  level: string;
  parentId?: string;
}
export interface NdviMetrics {
  current: number | null;
  change7d: number | null;
  change30d: number | null;
  baseline7d?: number | null;
  baseline30d?: number | null;
  observedAt?: string | null;
  farmCount?: number;
  comparison7dFarmCount?: number;
  comparison30dFarmCount?: number;
  stale?: boolean;
  source?: "FARM_OBSERVATIONS" | "REGIONAL_SNAPSHOT" | "NONE";
}
export interface NdviRefreshResult {
  checkedFarms: number;
  updatedFarms: number;
  storedReadings: number;
  emptyFarms: number;
  unavailableFarms: number;
  cachedFarms: number;
  unlinkedFarms: number;
  remainingFarms: number;
}
export const refreshRegionNdvi = (regionId: string) =>
  governmentApiService.refreshRegionNdvi(regionId);

export interface RegionLeaderboard {
  region: GovernmentRegion;
  ancestors?: GovernmentRegion[];
  unassignedFarmerIds?: string[];
  snapshot: {
    totalFarmers: number;
    activePolicies: number;
    insurancePercent: number;
    insuredFarmers?: number;
    activeClaims: number;
    totalCultivatedHa: number;
    riskLevel: string;
    ndvi: NdviMetrics;
    dominantCrop: { crop: string; totalHa: number } | null;
    leastCrop: { crop: string; totalHa: number } | null;
  };
  cropBreakdown: { crop: string; totalHa: number; farmCount: number }[];
  farmers: {
    id: string;
    name: string;
    email: string;
    phone: string;
    province?: string | null;
    district?: string | null;
    sector?: string | null;
    registeredLevel?: string;
    cell?: string | null;
    village?: string | null;
    crops?: string[];
    farmCount?: number;
    cultivatedHa?: number;
    insured?: boolean;
    ndvi?: number | null;
    activeClaims?: number;
    riskLevel?: string;
  }[];
  subRegions: {
    regionId: string;
    name: string;
    level: string;
    farmerCount: number;
    insuredCount: number;
    insuredPercent: number;
    cultivatedHa: number;
    ndvi: number | null;
    subRegionCount: number;
    subRegions?: { regionId: string; name: string; farmerCount: number }[];
    dominantCrop?: string | null;
    leastCrop?: string | null;
    change7d?: number | null;
    change30d?: number | null;
    ndviObservedAt?: string | null;
    ndviStale?: boolean;
    comparison7dFarmCount?: number;
    comparison30dFarmCount?: number;
    activePolicies?: number;
    activeClaims?: number;
    riskLevel?: string;
  }[];
}
export interface SeasonMetrics {
  season: string;
  cultivatedHa?: number;
  avgYield?: number | null;
  subsidyUtilized?: number | null;
  ndvi: { avg: number | null; min: number | null; max: number | null };
  policies: { total: number; active: number; totalPremium: number };
  claims: {
    total: number;
    approved: number;
    totalPayout: number;
    active?: number;
  };
  farmers: number;
  insuredFarmers: number;
  insurancePenetration: number;
}
export interface AdministrativeRegion {
  id: string;
  name: string;
  level: string;
  districts: { id: string; name: string; level?: string }[];
}
export interface SubsidiesAnalytics {
  region: GovernmentRegion;
  totalSubsidisedPolicies: number;
  totalPremiumPool: number;
  subsidyUtilised: number;
  subsidyUtilisationRate: number;
  cropBreakdown: {
    crop: string;
    policies: number;
    premiumTotal: number;
    sharePercent: number;
  }[];
  subRegionBreakdown: {
    regionId: string;
    name: string;
    policies: number;
    premiumTotal: number;
  }[];
}
export interface FarmerDetail {
  regionPath?: GovernmentRegion[];
  subsidyRate?: number;
  ndviSeries?: {
    date: string;
    farmer: number | null;
    sectorAvg: number | null;
  }[];
  alerts?: GovernmentAlert[];
  farmer: {
    id: string;
    name: string;
    email: string;
    phone: string;
    nationalId?: string | null;
    registeredAt?: string | null;
    riskLevel?: string;
    province: string | null;
    district: string | null;
    sector: string | null;
    cell: string | null;
    village: string | null;
  };
  farms: {
    id: string;
    name: string | null;
    cropType: string;
    areaHa: number | null;
    status: string;
    sowingDate: string | null;
    expectedHarvestDate?: string | null;
    insured?: boolean;
    location: { coordinates: [number, number] } | null;
    boundary?: { coordinates: number[][][] } | null;
  }[];
  policies: {
    id: string;
    policyNumber: string;
    crop: string | null;
    insurerName: string | null;
    coverageAmount: number | null;
    premiumAmount: number;
    govShare?: number;
    startDate: string;
    endDate: string;
    status: string;
  }[];
  claims: {
    id: string;
    crop: string | null;
    cause: string;
    filedAt: string;
    payoutAmount: number | null;
    areaLostHa?: number | null;
    insurerName?: string | null;
    status: string;
  }[];
  totals: {
    totalFarms: number;
    totalSumInsured?: number;
    insuredFarms: number;
    totalAreaHa: number;
    openClaims: number;
    totalPayout: number;
  };
}

export interface RegistryOptions {
  crop?: string;
  insurer?: string;
  sort?: string;
  direction?: string;
  season?: string;
}
export interface RegistryResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
export interface PolicyRegistryRow {
  id: string;
  policyNumber: string;
  holder: string;
  sector: string | null;
  crop: string | null;
  sumInsured: number | null;
  premiumAmount: number;
  startDate: string;
  endDate: string;
  status: string;
}
export interface ClaimRegistryRow {
  id: string;
  farmer: string;
  sector: string | null;
  crop: string | null;
  cause: string;
  areaLostHa: number | null;
  insurerId: string | null;
  insurerName: string | null;
  status: string;
  paid: boolean;
  filedAt: string;
  payoutAmount: number | null;
}
export interface GovernmentPolicyAnalytics {
  region: GovernmentRegion;
  totals: {
    total: number;
    active: number;
    pending: number;
    expired: number;
    cancelled: number;
    declined: number;
    needsCorrection: number;
  };
  premium: { total: number; average: number };
  insuredFarmers: number;
  insurancePenetration: number;
  totalSumInsured: number;
  coverageGaps: number;
  unknownAgeCount: number;
  genderBreakdown: { gender: string; count: number }[];
  ageBreakdown: { age: string; count: number; rate: number }[];
  cropBreakdown: { crop: string; count: number; totalPremium: number }[];
}
export interface GovernmentClaimsAnalytics {
  region: GovernmentRegion;
  totals: {
    total: number;
    filed: number;
    assigned: number;
    inProgress: number;
    submitted: number;
    approved: number;
    rejected: number;
    needsCorrection: number;
  };
  payouts: { totalClaimed: number; totalPaidOut: number; approvalRate: number };
  byLossEvent: {
    type: string;
    count: number;
    totalAmount: number;
    areaLostHa: number | null;
  }[];
  totalAreaLostHa: number | null;
  measuredClaims: number;
  insurers: { id: string; name: string }[];
}

export interface GovernmentAlert {
  id: string;
  farmerId: string;
  farmId: string;
  region: string;
  severity: "critical" | "warning" | "info";
  title: string;
  summary: string;
  time: string | null;
  metrics: {
    affectedFarms: number;
    affectedAreaHa: number | null;
    insuredShare: number;
  };
  recommendation: string;
}
export interface GovernmentTrajectory {
  season: string;
  previousSeason: string;
  points: {
    week: string;
    date?: string;
    current: number | null;
    lastYear: number | null;
  }[];
}

export const getRegionAlerts = (regionId: string) =>
  governmentApiService.getRegionAlerts(regionId);
export const getRegionTrajectory = (regionId: string, season?: string) =>
  governmentApiService.getRegionTrajectory(regionId, season);

export interface SubsidyInvoiceLine {
  policyId: string;
  policyNumber: string;
  farmerId: string;
  farmerName: string;
  farmId: string;
  crop: string | null;
  premium: number;
  subsidy: number;
}
export interface SubsidyInvoice {
  overdue?: boolean;
  id: string;
  regionId: string;
  season: string;
  insurerId: string;
  insurerName: string;
  status: "NOT_ISSUED" | "PENDING" | "PAID" | "REJECTED";
  subsidyRate: number;
  premiumTotal: number;
  subsidyAmount: number;
  farmsCovered: number;
  lines: SubsidyInvoiceLine[];
  issuedAt?: string;
  dueAt?: string;
  paidAt?: string;
  paymentReference?: string;
  rejectionReason?: string;
}
export interface SubsidyInvoiceSummary {
  invoices: SubsidyInvoice[];
  subsidyRate: number;
  budgetAllocated: number | null;
  subsidyUtilized: number;
  remaining: number | null;
  utilizationPercent: number | null;
  pendingInvoices: number;
  farmsCovered: number;
  activeInsurers: number;
  cropBreakdown: { crop: string; amount: number }[];
}
export const getSubsidyInvoices = (regionId: string, season?: string) =>
  governmentApiService.getSubsidyInvoices(regionId, season);
export const createSubsidyInvoice = (
  regionId: string,
  insurerId: string,
  season: string,
) => governmentApiService.createSubsidyInvoice(regionId, insurerId, season);
export const recordSubsidyPayment = (
  regionId: string,
  id: string,
  paymentReference: string,
  paidAt: string,
) =>
  governmentApiService.recordSubsidyPayment(
    regionId,
    id,
    paymentReference,
    paidAt,
  );
export const rejectSubsidyInvoice = (
  regionId: string,
  id: string,
  reason: string,
) => governmentApiService.rejectSubsidyInvoice(regionId, id, reason);

export const getSubsidyInvoice = (regionId: string, id: string) =>
  governmentApiService.getSubsidyInvoice(regionId, id);
