import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../src/contexts/AuthContext";
import { NotificationProvider } from "../src/contexts/NotificationContext";
import { GovernmentDashboard } from "../src/components/dashboards/GovernmentDashboard";
import { GovInvoicePage } from "../src/components/government/pages/GovInvoicePage";
import { GovSeasonComparePage } from "../src/components/government/pages/GovSeasonComparePage";
const regions = [
  { regionId: "rwanda", name: "Rwanda", level: "COUNTRY" },
  { regionId: "east", name: "Eastern", level: "PROVINCE", parentId: "rwanda" },
  { regionId: "kayonza", name: "Kayonza", level: "DISTRICT", parentId: "east" },
  { regionId: "rukara", name: "Rukara", level: "SECTOR", parentId: "kayonza" },
  {
    regionId: "kawangire",
    name: "Kawangire",
    level: "CELL",
    parentId: "rukara",
  },
  {
    regionId: "nyabubare",
    name: "Nyabubare",
    level: "VILLAGE",
    parentId: "kawangire",
  },
];
const ndvi = {
  current: 0.61,
  change7d: 0.04,
  change30d: -0.02,
  baseline7d: 0.57,
  baseline30d: 0.63,
  observedAt: "2026-11-18",
  farmCount: 3,
  comparison7dFarmCount: 3,
  comparison30dFarmCount: 3,
  source: "FARM_OBSERVATIONS",
  stale: false,
};
const farmer = {
  id: "farmer-one",
  name: "Test Farmer",
  province: "Eastern",
  district: "Kayonza",
  sector: "Rukara",
  cell: "Kawangire",
  village: "Nyabubare",
  email: "farmer@example.invalid",
  phone: "0700000000",
  crops: ["BEANS", "MAIZE"],
  farmCount: 3,
  cultivatedHa: 7.27,
  ndvi: 0.61,
  insured: true,
  activeClaims: 1,
  riskLevel: "MEDIUM",
  registeredLevel: "VILLAGE",
  nationalId: "TEST-ID-0001",
  registeredAt: "2026-09-01",
};
const policy = {
  id: "policy-one",
  policyNumber: "RW-POLICY-2026-0001",
  holder: "Test Farmer",
  sector: "Rukara",
  crop: "MAIZE",
  sumInsured: 1500000,
  coverageAmount: 1500000,
  premiumAmount: 10000,
  startDate: "2026-09-01",
  endDate: "2027-03-01",
  status: "ACTIVE",
  insurerName: "Test Insurance",
  govShare: 4000,
};
const claim = {
  id: "claim-one",
  farmer: "Test Farmer",
  sector: "Rukara",
  crop: "MAIZE",
  cause: "FLOOD",
  status: "FILED",
  filedAt: "2026-10-01",
  areaLostHa: 0.5,
  insurerId: "insurer-one",
  insurerName: "Test Insurance",
  payoutAmount: null,
};
const invoice = {
  id: "invoice-one",
  regionId: "rwanda",
  season: "Season B 2026",
  insurerId: "insurer-one",
  insurerName: "Test Insurance",
  status: "PENDING",
  subsidyRate: 0.4,
  premiumTotal: 10000,
  subsidyAmount: 4000,
  farmsCovered: 1,
  issuedAt: "2026-09-01",
  dueAt: "2026-10-01",
  lines: [
    {
      policyId: "policy-one",
      policyNumber: policy.policyNumber,
      farmerId: farmer.id,
      farmerName: farmer.name,
      farmId: "farm-one",
      crop: "MAIZE",
      premium: 10000,
      subsidy: 4000,
    },
  ],
};
let currentInvoice = { ...invoice };
const billing = () => ({
  invoices: [
    currentInvoice,
    {
      ...invoice,
      id: "proposal-one",
      status: "NOT_ISSUED",
      insurerId: "insurer-two",
      insurerName: "Second Insurance",
    },
  ],
  subsidyRate: 0.4,
  budgetAllocated: 100000,
  subsidyUtilized: currentInvoice.status === "PAID" ? 4000 : 0,
  remaining: 96000,
  utilizationPercent: 4,
  pendingInvoices: 1,
  farmsCovered: 1,
  activeInsurers: 2,
  cropBreakdown: [{ crop: "MAIZE", amount: 4000 }],
});
const row = (r: any, i = 0) => ({
  ...r,
  farmerCount: 1,
  insuredCount: 1,
  insuredPercent: 100,
  cultivatedHa: 7.27,
  ndvi: 0.61 + i * 0.01,
  change7d: 0.04,
  change30d: -0.02,
  activeClaims: 1,
  activePolicies: 1,
  dominantCrop: "MAIZE",
  leastCrop: "BEANS",
  riskLevel: "MEDIUM",
  subRegionCount: 1,
  subRegions: [{ regionId: "next", name: "Next area", farmerCount: 1 }],
});
function board(id: string, level?: string) {
  const index = regions.findIndex((r) => r.regionId === id),
    current = regions[index] ?? regions[0];
  let children =
    index === 0
      ? ["Eastern", "Western", "Northern", "Southern", "Kigali"].map(
          (name, i) =>
            row(
              {
                ...regions[1],
                name,
                regionId: i === 0 ? "east" : name.toLowerCase(),
              },
              i,
            ),
        )
      : regions[index + 1]
        ? [row(regions[index + 1])]
        : [];
  if (level) children = regions.filter((r) => r.level === level).map(row);
  return {
    region: current,
    ancestors: regions.slice(0, index),
    snapshot: {
      totalFarmers: 1,
      insuredFarmers: 1,
      activePolicies: 1,
      insurancePercent: 100,
      activeClaims: 1,
      totalCultivatedHa: 7.27,
      riskLevel: "MEDIUM",
      ndvi,
      dominantCrop: { crop: "MAIZE", totalHa: 5 },
      leastCrop: { crop: "BEANS", totalHa: 2.27 },
    },
    cropBreakdown: [
      { crop: "MAIZE", totalHa: 5, farmCount: 2 },
      { crop: "BEANS", totalHa: 2.27, farmCount: 1 },
    ],
    farmers: [farmer],
    subRegions: children,
  };
}
const trajectory = {
  season: "Season B 2026",
  previousSeason: "Season B 2025",
  points: Array.from({ length: 12 }, (_, i) => ({
    week: `W${i + 1}`,
    date: `2026-09-${String(i + 1).padStart(2, "0")}`,
    current: 0.5 + i * 0.01,
    lastYear: 0.45 + i * 0.008,
  })),
};
const alerts = [
  {
    id: "alert-one",
    farmId: "farm-one",
    region: "Rukara",
    severity: "warning",
    title: "NDVI decline",
    summary: "Recorded vegetation decline on one monitored farm",
    time: "2026-11-18",
    metrics: { affectedFarms: 1, affectedAreaHa: 2.5, insuredShare: 100 },
    recommendation: "Review the latest observation and field assessment.",
  },
];
(window as any).__requests = [];
(window as any).__errors = [];
window.addEventListener("error", (e) =>
  (window as any).__errors.push(e.message),
);
window.addEventListener("unhandledrejection", (e) =>
  (window as any).__errors.push(String(e.reason)),
);
localStorage.setItem("token", "fixture-token");
localStorage.setItem("govSidebarCollapsed", "false");
window.fetch = async (url, config) => {
  const u = new URL(String(url), "http://localhost:3000"),
    path = u.pathname.replace("/api/v1/government/", ""),
    method = config?.method ?? "GET";
  (window as any).__requests.push({ path, query: u.search, method });
  let data: any;
  if (path === "me/region") data = regions[0];
  else if (path === "reference/seasons")
    data = ["Season B 2026", "Season A 2026", "Season B 2025"];
  else if (path === "reference/crops") data = ["MAIZE", "BEANS"];
  else if (path === "reference/loss-causes") data = ["FLOOD", "DROUGHT"];
  else if (path === "reference/claim-statuses")
    data = ["FILED", "APPROVED", "REJECTED"];
  else if (path === "reference/administrative-regions")
    data = [
      { id: "rwanda", name: "Rwanda", level: "COUNTRY", districts: [] },
      {
        id: "east",
        name: "Eastern",
        level: "PROVINCE",
        districts: [{ id: "kayonza", name: "Kayonza", level: "DISTRICT" }],
      },
    ];
  else if (path.startsWith("leaderboard/"))
    data = board(path.split("/")[1], u.searchParams.get("level") ?? undefined);
  else if (path.startsWith("analytics/trajectory/")) data = trajectory;
  else if (path.startsWith("analytics/alerts/")) data = alerts;
  else if (path.startsWith("seasons/")) {
    const isEast = path.includes("east");
    data = {
      region: regions[0],
      seasons: [
        {
          season: u.searchParams.get("seasons"),
          cultivatedHa: isEast ? 4488 : 2430,
          avgYield: null,
          ndvi: { avg: isEast ? 0.61 : 0.7, min: 0.3, max: 0.8 },
          policies: { total: 2, active: 1, totalPremium: 10000 },
          claims: {
            total: 2,
            active: isEast ? 55 : 34,
            approved: 1,
            totalPayout: 100,
          },
          farmers: 100,
          insuredFarmers: 71,
          insurancePenetration: isEast ? 47 : 71,
          subsidyUtilized: isEast ? 349000000 : 199000000,
        },
      ],
    };
  } else if (path.startsWith("policy-registry/"))
    data = {
      data: [policy],
      total: 21,
      page: Number(u.searchParams.get("page") ?? 1),
      limit: 20,
      totalPages: 2,
    };
  else if (path.startsWith("policies/"))
    data = {
      region: regions[0],
      totalSumInsured: 1500000,
      totals: { total: 21, active: 18, expired: 3 },
      premium: { total: 10000, average: 10000 },
      insuredFarmers: 1,
      insurancePenetration: 100,
      coverageGaps: 0,
      genderBreakdown: [{ gender: "Male", count: 1 }],
      ageBreakdown: [{ age: "18–30", count: 1, rate: 100 }],
      cropBreakdown: [{ crop: "MAIZE", count: 1, totalPremium: 10000 }],
      monthlyTrend: [],
    };
  else if (path.startsWith("claims-registry/"))
    data = { data: [claim], total: 1, page: 1, limit: 20, totalPages: 1 };
  else if (path.startsWith("claims/"))
    data = {
      region: regions[0],
      totals: { total: 1, filed: 1, approved: 0, rejected: 0 },
      totalAreaLostHa: 0.5,
      byLossEvent: [{ type: "FLOOD", count: 1, areaLostHa: 0.5 }],
      payouts: { totalClaimed: 0, totalPaidOut: 0, approvalRate: 0 },
      monthlyTrend: [],
      insurers: [{ id: "insurer-one", name: "Test Insurance" }],
      mostAffectedCrops: [{ crop: "MAIZE", count: 1, areaLostHa: 0.5 }],
    };
  else if (path.startsWith("subsidy-invoices/")) {
    if (method === "POST") {
      const body = JSON.parse(String(config?.body ?? "{}"));
      if (path.endsWith("/payment"))
        currentInvoice = { ...currentInvoice, status: "PAID", ...body };
      else if (path.endsWith("/reject"))
        currentInvoice = {
          ...currentInvoice,
          status: "REJECTED",
          rejectionReason: body.reason,
        };
      else currentInvoice = { ...invoice };
      data = currentInvoice;
    } else data = path.split("/").length > 2 ? currentInvoice : billing();
  } else if (path.startsWith("farmer-detail/"))
    data = {
      farmer,
      regionPath: regions.slice(0, 6),
      farms: [
        {
          id: "farm-one",
          name: "Test plot",
          cropType: "MAIZE",
          areaHa: 2.78,
          sowingDate: "2026-09-01",
          expectedHarvestDate: "2026-12-01",
          status: "HEALTHY",
          insured: true,
        },
        {
          id: "farm-two",
          name: "Second plot",
          cropType: "MAIZE",
          areaHa: 2.24,
          status: "HEALTHY",
          insured: false,
          sowingDate: "2026-06-01",
        },
        {
          id: "farm-three",
          name: "Third plot",
          cropType: "BEANS",
          areaHa: 2.25,
          status: "HEALTHY",
          insured: false,
          sowingDate: "2026-06-01",
        },
      ],
      policies: [
        policy,
        {
          ...policy,
          id: "policy-two",
          policyNumber: "RW-EXPIRED-002",
          status: "EXPIRED",
          endDate: "2026-11-20",
        },
        {
          ...policy,
          id: "policy-three",
          policyNumber: "RW-EXPIRED-003",
          status: "EXPIRED",
          endDate: "2026-09-16",
        },
      ],
      claims: [claim],
      totals: {
        totalFarms: 3,
        insuredFarms: 1,
        totalAreaHa: 7.27,
        totalSumInsured: 1500000,
        openClaims: 1,
        totalPayout: 0,
      },
      ndviSeries: trajectory.points.map((p) => ({
        date: p.date,
        farmer: p.current,
        sectorAvg: p.lastYear,
      })),
      alerts,
    };
  else if (path.startsWith("claim-detail/"))
    data = {
      claim: {
        ...claim,
        claimType: "FARMER_REPORTED_LOSS",
        lossDescription:
          "Field inspection requested after recorded flood damage.",
        damagePhotos: [],
      },
      farmer: {
        id: farmer.id,
        name: farmer.name,
        email: farmer.email,
        phone: farmer.phone,
        sector: farmer.sector,
      },
      farm: {
        id: "farm-one",
        name: "Test Plot",
        cropType: "MAIZE",
        areaHa: 7.27,
        status: "HEALTHY",
        sowingDate: "2026-09-01",
        location: { type: "Point", coordinates: [30.4, -1.9] },
        boundary: null,
      },
      policy,
      insurer: {
        id: "insurer-one",
        name: "Test Insurance",
        email: "insurer@example.invalid",
      },
      assessment: {
        status: "SUBMITTED",
        completedAt: "2026-10-02",
        damageArea: 0.5,
        assessorName: "Test Assessor",
        observations: ["Recorded crop loss"],
        reports: [
          { pdfType: "FIELD_REPORT", pdfUrl: "/uploads/test-report.pdf" },
        ],
      },
    };
  else if (path.startsWith("ndvi/refresh"))
    data = {
      checkedFarms: 3,
      updatedFarms: 3,
      storedReadings: 45,
      emptyFarms: 0,
      unavailableFarms: 0,
      cachedFarms: 0,
      unlinkedFarms: 0,
      remainingFarms: 0,
    };
  else if (u.pathname.includes("/users/profile"))
    data = {
      firstName: "Test",
      lastName: "Official",
      governmentProfile: { province: "Rwanda", level: "COUNTRY" },
    };
  else if (u.pathname.includes("/weather/historical"))
    data = {
      field_id: "recorded-field",
      data: Array.from({ length: 30 }, (_, i) => ({
        date: `2026-09-${String(i + 1).padStart(2, "0")}`,
        temp: 298.15,
        rain: 2,
        humidity: 70,
        wind_speed: 2,
      })),
    };
  else if (u.pathname.includes("/weather/forecast"))
    data = {
      field_id: "recorded-field",
      data: [
        {
          dt: Math.floor(Date.now() / 1000),
          main: { temp_min: 296, temp_max: 299 },
          rain: { "3h": 1 },
          weather: [{ description: "Light rain" }],
        },
      ],
    };
  else data = [];
  return Response.json({ success: true, data });
};
const root = createRoot(document.getElementById("root")!);
let mounted = 0;
(window as any).__mount = (path: string) => {
  if (path === "invoice" || path === "draft") currentInvoice = { ...invoice };
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
  });
  root.render(
    <QueryClientProvider client={client} key={++mounted}>
      {path === "invoice" ? (
        <main className="p-3 sm:p-6">
          <GovInvoicePage
            invoice={invoice as any}
            regionId="rwanda"
            onBack={() => {}}
          />
        </main>
      ) : path === "draft" ? (
        <main className="p-3 sm:p-6">
          <GovInvoicePage
            invoice={
              { ...invoice, id: "proposal-one", status: "NOT_ISSUED" } as any
            }
            regionId="rwanda"
            onBack={() => {}}
          />
        </main>
      ) : (
        <MemoryRouter initialEntries={[path]}>
          <AuthProvider>
            <NotificationProvider>
              <GovernmentDashboard />
            </NotificationProvider>
          </AuthProvider>
        </MemoryRouter>
      )}
    </QueryClientProvider>,
  );
};
(window as any).__mount("/government/compare");
