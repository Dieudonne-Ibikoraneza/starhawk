import { farmerProfileView } from "../src/components/government/pages/governmentFarmer";
import {
  normalizeHistoricalWeather,
  claimWeatherView,
} from "../src/components/government/pages/governmentClaimWeather";
import {
  comparisonValues,
  concepts,
  pctChange,
} from "../src/components/government/pages/governmentComparison";
import { invoiceBreakdown } from "../src/components/government/pages/governmentInvoice";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../src/contexts/AuthContext";
import { NotificationProvider } from "../src/contexts/NotificationContext";
import { GovernmentDashboard } from "../src/components/dashboards/GovernmentDashboard";
import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GovernmentApiService } from "../src/services/governmentApi";
import { GovDashboardPage } from "../src/components/government/pages/GovDashboardPage";
import {
  farmerTableColumns,
  farmerTableCsv,
  filterRegionRows,
  regionHref,
  regionBreadcrumbItems,
} from "../src/components/government/pages/governmentLeaderboard";
import { GovLeaderboardPage } from "../src/components/government/pages/GovLeaderboardPage";
import { GovSectorPage } from "../src/components/government/pages/GovSectorPage";
import { GovCellPage } from "../src/components/government/pages/GovCellPage";
import { GovVillagePage } from "../src/components/government/pages/GovVillagePage";
import { GovBreadcrumb } from "../src/components/government/pages/GovBreadcrumb";
import { GovFarmerPage } from "../src/components/government/pages/GovFarmerPage";
import { GovPoliciesPage } from "../src/components/government/pages/GovPoliciesPage";
import { GovClaimsPage } from "../src/components/government/pages/GovClaimsPage";
import { GovClaimDetailsPage } from "../src/components/government/pages/GovClaimDetailsPage";
import { GovSubsidiesPage } from "../src/components/government/pages/GovSubsidiesPage";
import { GovInvoicePage } from "../src/components/government/pages/GovInvoicePage";
import {
  GovSeasonComparePage,
  ComparisonMatrix,
} from "../src/components/government/pages/GovSeasonComparePage";
import { GovNdviStatus } from "../src/components/government/pages/GovNdviStatus";
import { GovPageState } from "../src/components/government/pages/GovPageState";
import {
  ndviRefreshMessage,
  ndviDeltaPercent,
  normalizeNdvi,
  normalizeForecast,
} from "../src/components/government/pages/governmentMonitoring";
import { downloadCsv } from "../src/components/government/pages/governmentFormat";

const storage = new Map([["token", "test-token"]]);
Object.assign(globalThis, {
  localStorage: {
    getItem: (key: string) => storage.get(key) ?? null,
    removeItem: (key: string) => storage.delete(key),
  },
});
const api = new GovernmentApiService("http://localhost:3000/api/v1/government");
const realFetch = globalThis.fetch;
function response(data: unknown, wrapped = true, status = 200) {
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify(
        wrapped
          ? { success: status < 400, message: "Test response", data }
          : data,
      ),
      { status, headers: { "Content-Type": "application/json" } },
    );
}
function render(
  element: React.ReactNode,
  key?: unknown[],
  value?: unknown,
  seeds: [unknown[], unknown][] = [],
) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { staleTime: Infinity, retry: false, gcTime: Infinity },
    },
  });
  if (key) client.setQueryData(key, value);
  for (const [queryKey, queryData] of seeds)
    client.setQueryData(queryKey, queryData);
  try {
    return renderToStaticMarkup(
      <QueryClientProvider client={client}>{element}</QueryClientProvider>,
    );
  } finally {
    client.clear();
  }
}
const region = {
  regionId: "rwanda",
  name: "Test Jurisdiction",
  level: "COUNTRY",
};
const leaderboard = {
  region,
  snapshot: {
    totalFarmers: 1,
    activePolicies: 1,
    insurancePercent: 100,
    activeClaims: 0,
    totalCultivatedHa: 2,
    riskLevel: "LOW",
    ndvi: { current: null, change7d: null, change30d: null },
    dominantCrop: null,
    leastCrop: null,
  },
  cropBreakdown: [{ crop: "MAIZE", totalHa: 2, farmCount: 1 }],
  farmers: [
    {
      id: "farmer-1",
      name: "Test Farmer",
      email: "test@example.invalid",
      phone: "",
    },
  ],
  subRegions: [
    {
      regionId: "actual-region-id",
      name: "Test Child Region",
      level: "PROVINCE",
      farmerCount: 1,
      insuredCount: 1,
      insuredPercent: 100,
      cultivatedHa: 2,
      ndvi: null,
      subRegionCount: 1,
    },
  ],
};
const subsidy = {
  region,
  totalSubsidisedPolicies: 1,
  totalPremiumPool: 1000,
  subsidyUtilised: 500,
  subsidyUtilisationRate: 50,
  cropBreakdown: [],
  subRegionBreakdown: [],
};
const legacyStatement = {
  id: "statement-1",
  insurerName: "Test Insurer",
  season: "Season A 2026",
  policyCount: 1,
  totalPremium: 1000,
  policies: [
    {
      id: "policy-1",
      policyNumber: "REAL-POLICY-001",
      holder: "Test Farmer",
      crop: "MAIZE",
      premiumAmount: 1000,
    },
  ],
};
const invoice = {
  id: "invoice-1",
  regionId: "rwanda",
  insurerId: "insurer-1",
  insurerName: "Test Insurer",
  season: "Season A 2026",
  status: "PENDING" as const,
  subsidyRate: 0.4,
  premiumTotal: 1000,
  subsidyAmount: 400,
  farmsCovered: 1,
  issuedAt: "2026-01-01",
  dueAt: "2026-01-31",
  lines: [
    {
      policyId: "policy-1",
      policyNumber: "REAL-POLICY-001",
      farmerId: "farmer-1",
      farmerName: "Test Farmer",
      farmId: "farm-1",
      crop: "MAIZE",
      premium: 1000,
      subsidy: 400,
    },
  ],
};
const billing = {
  invoices: [invoice],
  subsidyRate: 0.4,
  budgetAllocated: null,
  subsidyUtilized: 0,
  remaining: null,
  utilizationPercent: null,
  pendingInvoices: 1,
  farmsCovered: 1,
  activeInsurers: 1,
  cropBreakdown: [],
};
const farmer = {
  farmer: {
    id: "farmer-1",
    name: "Test Farmer",
    email: "",
    phone: "",
    district: "Test District",
  },
  farms: [],
  policies: [],
  claims: [],
  totals: {
    totalFarms: 0,
    insuredFarms: 0,
    totalAreaHa: 0,
    openClaims: 0,
    totalPayout: 0,
  },
};
const policyAnalytics = {
  region,
  totals: {
    total: 0,
    active: 0,
    pending: 0,
    expired: 0,
    cancelled: 0,
    declined: 0,
    needsCorrection: 0,
  },
  premium: { total: 0, average: 0 },
  insuredFarmers: 0,
  insurancePenetration: 0,
  monthlyTrend: [],
  cropBreakdown: [],
  genderBreakdown: [],
};
const claimsAnalytics = {
  region,
  totals: {
    total: 0,
    filed: 0,
    assigned: 0,
    inProgress: 0,
    submitted: 0,
    approved: 0,
    rejected: 0,
    needsCorrection: 0,
  },
  byLossEvent: [],
  payouts: { totalClaimed: 0, totalPaidOut: 0, approvalRate: 0 },
  monthlyTrend: [],
  mostAffectedCrops: [],
};
const registry = { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
const noop = () => {};

await test("wrapped registry responses preserve pagination", async () => {
  response(registry);
  assert.deepEqual(await api.getPolicyRegistry("rwanda"), registry);
});
await test("unwrapped registry responses preserve pagination", async () => {
  response(registry, false);
  assert.deepEqual(await api.getClaimsRegistry("rwanda"), registry);
});
await test("region and entity IDs are encoded and auth header is present", async () => {
  globalThis.fetch = async (url, config) => {
    assert.match(String(url), /leaderboard\/region%2Fone$/);
    assert.equal(
      new Headers(config?.headers).get("Authorization"),
      "Bearer test-token",
    );
    return Response.json(leaderboard);
  };
  assert.deepEqual(await api.getRegionLeaderboard("region/one"), leaderboard);
});
const refreshResult = {
  checkedFarms: 3,
  updatedFarms: 3,
  storedReadings: 36,
  emptyFarms: 0,
  unavailableFarms: 0,
  cachedFarms: 0,
  unlinkedFarms: 0,
  remainingFarms: 0,
};
await test("NDVI history refresh uses an authenticated scoped POST and unwraps the result", async () => {
  globalThis.fetch = async (url, config) => {
    assert.match(String(url), /ndvi\/refresh\/region%2Fone$/);
    assert.equal(config?.method, "POST");
    assert.equal(
      new Headers(config?.headers).get("Authorization"),
      "Bearer test-token",
    );
    return Response.json({ success: true, data: refreshResult });
  };
  assert.deepEqual(await api.refreshRegionNdvi("region/one"), refreshResult);
});
await test("NDVI percentage change uses the baseline and retains a zero current reading", () => {
  assert.equal(
    ndviDeltaPercent({ current: 0.5, change7d: 0.1, baseline7d: 0.4 }),
    25,
  );
  assert.equal(
    ndviDeltaPercent({ current: 0, change7d: -0.4, baseline7d: 0.4 }),
    -100,
  );
  assert.equal(ndviDeltaPercent({ current: 0.5, change7d: 0.1 }), 25);
  assert.equal(
    ndviDeltaPercent({ current: 0.5, change7d: 0.5, baseline7d: 0 }),
    undefined,
  );
  assert.equal(
    ndviDeltaPercent({ current: 0, change7d: 0, baseline7d: 0 }),
    undefined,
  );
  assert.equal(ndviDeltaPercent({ current: null, change7d: null }), undefined);
  assert.equal(
    ndviDeltaPercent({ current: 0.1, change7d: 0.2, baseline7d: -0.1 }),
    undefined,
  );
});
await test("NDVI status shows the actual observation date, stale warning and matched-farm counts", () => {
  const html = render(
    <GovNdviStatus
      regionId="village-one"
      metrics={{
        current: 0.5,
        change7d: 0.1,
        change30d: 0.2,
        observedAt: "2026-09-28",
        stale: true,
        source: "FARM_OBSERVATIONS",
        comparison7dFarmCount: 3,
        comparison30dFarmCount: 2,
      }}
    />,
  );
  assert.match(html, /Latest NDVI observation/);
  assert.match(html, /2026/);
  assert.match(html, /older than 14 days/);
  assert.match(html, /Compared farms: 7D · 3, 30D · 2/);
  assert.match(html, /Refresh NDVI history/);
  assert.match(html, /role="status" aria-live="polite"/);
});
await test("NDVI status explains genuinely missing history without claiming measurements exist", () => {
  const html = render(
    <GovNdviStatus
      regionId="village-one"
      metrics={{
        current: null,
        change7d: null,
        change30d: null,
        observedAt: null,
      }}
    />,
  );
  assert.match(html, /No NDVI readings recorded/);
  assert.match(html, /Missing history appears as —/);
  assert.doesNotMatch(html, /Latest NDVI observation/);
});
await test("NDVI refresh reports provider failure, empty data, cache and remaining batches honestly", () => {
  assert.match(
    ndviRefreshMessage({ ...refreshResult, unavailableFarms: 1 }),
    /could not be retrieved/,
  );
  assert.match(
    ndviRefreshMessage({ ...refreshResult, updatedFarms: 0, emptyFarms: 3 }),
    /No satellite readings/,
  );
  assert.match(
    ndviRefreshMessage({ ...refreshResult, updatedFarms: 0, cachedFarms: 3 }),
    /checked recently/,
  );
  assert.match(
    ndviRefreshMessage({
      ...refreshResult,
      updatedFarms: 2,
      remainingFarms: 4,
    }),
    /4 farms still need history/,
  );
  assert.match(
    ndviRefreshMessage({ ...refreshResult, updatedFarms: 0, unlinkedFarms: 3 }),
    /No fields linked/,
  );
});
await test("overview uses the recovered NDVI baseline for its percentage change", () => {
  const html = render(
    <GovDashboardPage regionId="rwanda" onSectorSelect={noop} />,
    ["government", "overview", "rwanda"],
    {
      leaderboard: {
        ...leaderboard,
        snapshot: {
          ...leaderboard.snapshot,
          ndvi: {
            current: 0.5,
            change7d: 0.1,
            change30d: 0.2,
            baseline7d: 0.4,
            observedAt: "2026-09-28",
          },
        },
      },
      trajectory: { points: [] },
      alerts: [],
      billing,
    },
  );
  assert.match(html, /25%/);
  assert.match(html, /Latest observation/);
});
await test("query parameters encode seasons and filters correctly", async () => {
  globalThis.fetch = async (url) => {
    const parsed = new URL(String(url));
    assert.equal(
      parsed.searchParams.get("seasons"),
      "Season A 2026,Season B 2026",
    );
    return Response.json({ seasons: [] });
  };
  await api.compareSeasons("rwanda", ["Season A 2026", "Season B 2026"]);
});
await test("forbidden errors preserve the session and report backend message", async () => {
  response({ message: "Outside jurisdiction" }, false, 403);
  const original = console.error;
  console.error = noop;
  try {
    await assert.rejects(api.getFarmerDetail("other"), /Outside jurisdiction/);
    assert.equal(storage.get("token"), "test-token");
  } finally {
    console.error = original;
  }
});
await test("expired session clears credentials and returns a useful error", async () => {
  response({}, false, 401);
  const original = console.error;
  console.error = noop;
  try {
    await assert.rejects(api.getMyRegion(), /Authentication required/);
    assert.equal(storage.has("token"), false);
  } finally {
    console.error = original;
    storage.set("token", "test-token");
  }
});
await test("non-JSON errors are surfaced", async () => {
  globalThis.fetch = async () =>
    new Response("Service unavailable", { status: 503 });
  const original = console.error;
  console.error = noop;
  try {
    await assert.rejects(api.getMyRegion(), /Service unavailable/);
  } finally {
    console.error = original;
  }
});
await test("overview renders missing NDVI without false critical alerts or crashing", () => {
  const html = render(
    <GovDashboardPage regionId="rwanda" onSectorSelect={noop} />,
    ["government", "overview", "rwanda"],
    { leaderboard, trajectory: { points: [] }, alerts: [], billing },
  );
  assert.match(html, /No reading/);
  assert.match(html, /Test Child Region/);
  assert.doesNotMatch(html, /flagged at-risk/);
});
await test("leaderboard renders actual farmer and region records", () => {
  const html = render(
    <GovLeaderboardPage regionId="rwanda" />,
    ["government", "leaderboard", "rwanda"],
    leaderboard,
  );
  assert.match(html, /Test Farmer/);
  assert.match(html, /Test Child Region/);
  assert.match(html, /No reading/);
});
const hierarchy = [
  { regionId: "rwanda", name: "Rwanda", level: "COUNTRY" },
  {
    regionId: "prov-east",
    name: "Eastern",
    level: "PROVINCE",
    parentId: "rwanda",
  },
  {
    regionId: "dist-one",
    name: "District One",
    level: "DISTRICT",
    parentId: "prov-east",
  },
  {
    regionId: "sector/one",
    name: "Sector One",
    level: "SECTOR",
    parentId: "dist-one",
  },
  {
    regionId: "cell-one",
    name: "Cell One",
    level: "CELL",
    parentId: "sector/one",
  },
  {
    regionId: "village-one",
    name: "Village One",
    level: "VILLAGE",
    parentId: "cell-one",
  },
];
const fullRegionRow = {
  ...leaderboard.subRegions[0],
  dominantCrop: "MAIZE",
  ndvi: 0.235,
  change7d: -0.125,
  change30d: 0.025,
  activePolicies: 12,
  activeClaims: 3,
  riskLevel: "HIGH",
};
const provinceRows = [
  "Eastern",
  "Western",
  "Northern",
  "Southern",
  "Kigali",
].map((name, index) => ({
  ...fullRegionRow,
  regionId: index === 0 ? "prov-east" : `prov-${index}`,
  name,
  farmerCount: index === 0 ? 10 : 0,
  dominantCrop: index === 0 ? "MAIZE" : null,
  ndvi: index === 0 ? 0.235 : null,
  riskLevel: index === 0 ? "HIGH" : "UNKNOWN",
}));
await test("country leaderboard lists all five provinces before overview panels with full metrics", () => {
  const html = render(
    <GovLeaderboardPage regionId="rwanda" rootRegionId="rwanda" />,
    ["government", "leaderboard", "rwanda"],
    { ...leaderboard, region: hierarchy[0], subRegions: provinceRows },
  );
  const table = html.slice(html.indexOf("<table"), html.indexOf("</table>"));
  assert.equal((table.match(/<tr/g) ?? []).length, 6);
  for (const province of provinceRows) {
    assert.ok(table.includes(province.name));
    assert.ok(table.includes(`href="${regionHref(province.regionId)}"`));
  }
  for (const metric of [
    "Cultivated",
    "Dominant Crop",
    "Avg NDVI",
    "7D",
    "30D",
    "Insurance",
    "Claims",
    "Risk",
    "0.23",
    "-0.13",
    "+0.03",
    "Maize",
    "High",
  ])
    assert.ok(table.includes(metric), metric);
  assert.ok(
    html.indexOf('aria-label="Provinces leaderboard"') <
      html.indexOf("Registered farmers"),
  );

  assert.ok(!table.includes("District One"));
});
for (let level = 1; level < hierarchy.length; level++) {
  const current = hierarchy[level];
  await test(`${current.level} shows only immediate children and persistent ancestor links`, () => {
    const child = hierarchy[level + 1];
    const html = render(
      <GovLeaderboardPage
        regionId={current.regionId}
        rootRegionId="rwanda"
        onBack={noop}
      />,
      ["government", "leaderboard", current.regionId],
      {
        ...leaderboard,
        region: current,
        ancestors: hierarchy.slice(0, level),
        subRegions: child ? [{ ...fullRegionRow, ...child }] : [],
      },
    );
    assert.match(html, />Back<|Back to parent/);
    for (const ancestor of hierarchy.slice(0, level))
      assert.ok(html.includes(`href="${regionHref(ancestor.regionId)}"`));
    if (child) {
      const table = html.slice(
        html.indexOf("<table"),
        html.indexOf("</table>"),
      );
      assert.ok(table.includes(child.name));
      assert.ok(table.includes(`href="${regionHref(child.regionId)}"`));
      assert.equal((table.match(/<tr/g) ?? []).length, 2);
    } else {
      assert.ok(!html.includes("This region has no child regions."));
      assert.ok(
        html.includes(
          `href="${regionHref(current.regionId, "farmer-1").replaceAll("&", "&amp;")}"`,
        ),
      );
    }
    assert.match(html, /Registered farmers/);
  });
}
await test("breadcrumbs start at the official jurisdiction without linking to forbidden parents", () => {
  const html = render(
    <GovLeaderboardPage regionId="cell-one" rootRegionId="dist-one" />,
    ["government", "leaderboard", "cell-one"],
    {
      ...leaderboard,
      region: hierarchy[4],
      ancestors: hierarchy.slice(0, 4),
      subRegions: [],
    },
  );
  const breadcrumbs = html.slice(html.indexOf("<nav"), html.indexOf("</nav>"));
  assert.ok(breadcrumbs.includes("District One"));
  assert.ok(breadcrumbs.includes("Sector One"));
  assert.ok(!breadcrumbs.includes("Eastern"));
  assert.ok(!breadcrumbs.includes("Rwanda"));
});
await test("ranking filters combine risk, crop and case-insensitive region search without losing empty regions by default", () => {
  const options = {
    search: "",
    crop: "all",
    ranking: "all" as const,
    sort: { key: "farmerCount" as const, desc: true },
  };
  assert.equal(filterRegionRows(provinceRows, options).length, 5);
  assert.deepEqual(
    filterRegionRows(provinceRows, {
      ...options,
      ranking: "attention",
      search: "eAsT",
      crop: "MAIZE",
    }).map((r) => r.name),
    ["Eastern"],
  );
  assert.equal(
    filterRegionRows(provinceRows, { ...options, ranking: "performers" })
      .length,
    0,
  );
  assert.equal(
    filterRegionRows(provinceRows, { ...options, crop: "BEANS" }).length,
    0,
  );
  const mixed = [
    ...provinceRows,
    { ...fullRegionRow, name: "Healthy", riskLevel: "LOW", ndvi: 0.8 },
  ];
  assert.deepEqual(
    filterRegionRows(mixed, { ...options, ranking: "performers" }).map(
      (r) => r.name,
    ),
    ["Healthy"],
  );
});
await test("NDVI sorting retains zero as a value and keeps absent readings last in both directions", () => {
  const rows = [
    { ...fullRegionRow, name: "Zero", ndvi: 0 },
    { ...fullRegionRow, name: "Missing", ndvi: null },
    { ...fullRegionRow, name: "Healthy", ndvi: 0.8 },
  ];
  for (const desc of [false, true])
    assert.deepEqual(
      filterRegionRows(rows, {
        search: "",
        crop: "all",
        ranking: "all",
        sort: { key: "ndvi", desc },
      }).map((r) => r.name),
      desc ? ["Healthy", "Zero", "Missing"] : ["Zero", "Healthy", "Missing"],
    );
});
await test("empty intermediate region keeps its hierarchy table and a clear empty message", () => {
  const html = render(
    <GovLeaderboardPage regionId="prov-east" />,
    ["government", "leaderboard", "prov-east"],
    { ...leaderboard, region: hierarchy[1], subRegions: [], farmers: [] },
  );
  assert.match(html, /aria-label="Districts leaderboard"/);
  assert.match(html, /This region has no child regions/);
  assert.match(html, /No farmers match|No farmers found|No registered farmers/);
});
await test("village farmer table restores portfolio columns, actual measurements and an encoded detail link", () => {
  const html = render(
    <GovLeaderboardPage regionId="village-one" />,
    ["government", "leaderboard", "village-one"],
    {
      ...leaderboard,
      region: hierarchy[5],
      subRegions: [],
      farmers: [
        {
          ...leaderboard.farmers[0],
          id: "farmer/1",
          cell: "Cell One",
          village: "Village One",
          crops: ["MAIZE", "BEANS"],
          farmCount: 3,
          cultivatedHa: 2.5,
          ndvi: 0,
          insured: true,
          activeClaims: 2,
          riskLevel: "HIGH",
        },
      ],
    },
  );
  const table = html.slice(html.indexOf("<table"), html.indexOf("</table>"));
  for (const text of [
    "Cell",
    "Village",
    "Crops",
    "Farms",
    "Cultivated (ha)",
    "NDVI",
    "Insured",
    "Open claims",
    "Risk",
    "Cell One",
    "Village One",
    "Maize, Beans",
    "2.5",
    "0.000",
    "Yes",
    "High",
  ])
    assert.ok(table.includes(text), text);
  assert.ok(
    table.includes(
      'href="/government/leaderboard?region=village-one&amp;farmer=farmer%2F1"',
    ),
  );
  assert.match(html, /Filter farmers by insurance/);
  assert.match(html, /Export farmers/);
});
await test("deep breadcrumb has a dots menu trigger, accessible current location, and links to every parent", () => {
  const items = regionBreadcrumbItems(
    { region: hierarchy[5], ancestors: hierarchy.slice(0, 5) },
    "rwanda",
  );
  const html = render(<GovBreadcrumb items={items} />);
  assert.match(html, /aria-label="Show parent regions"/);
  assert.match(html, /gov-breadcrumb-collapsed/);
  assert.match(html, /gov-breadcrumb-expanded/);
  assert.equal((html.match(/aria-current="page"/g) ?? []).length, 1);
  for (const item of hierarchy.slice(0, 5))
    assert.ok(html.includes(`href="${regionHref(item.regionId)}"`));
  assert.match(html, /title="Village One"/);
});
await test("root breadcrumb is a current page with no self-link or redundant ellipsis", () => {
  const html = render(
    <GovBreadcrumb
      items={regionBreadcrumbItems(
        { region: hierarchy[0], ancestors: [] },
        "rwanda",
      )}
    />,
  );
  assert.match(html, /aria-current="page"/);
  assert.ok(!html.includes("href="));
  assert.ok(!html.includes("Show parent regions"));
});
await test("farmer details retain the complete jurisdiction-scoped breadcrumb path", () => {
  const html = render(
    <GovFarmerPage
      farmerId="farmer-1"
      onBack={noop}
      rootRegionId="dist-one"
      regionContext={{
        ...leaderboard,
        region: hierarchy[5],
        ancestors: hierarchy.slice(0, 5),
      }}
    />,
    ["government", "farmer", "farmer-1"],
    farmer,
  );
  const breadcrumbs = html.slice(html.indexOf("<nav"), html.indexOf("</nav>"));
  for (const item of hierarchy.slice(2))
    assert.ok(breadcrumbs.includes(`href="${regionHref(item.regionId)}"`));
  assert.match(breadcrumbs, /Test Farmer/);
  assert.ok(!breadcrumbs.includes("Rwanda"));
  assert.ok(!breadcrumbs.includes("Eastern"));
});
await test("district-only farmers remain visible with their known location and an actionable missing-sector notice", () => {
  const html = render(
    <GovLeaderboardPage regionId="dist-one" />,
    ["government", "leaderboard", "dist-one"],
    {
      ...leaderboard,
      region: hierarchy[2],
      unassignedFarmerIds: ["farmer-1"],
      subRegions: [],
      farmers: [
        {
          ...leaderboard.farmers[0],
          district: "District One",
          sector: null,
          registeredLevel: "DISTRICT",
        },
      ],
    },
  );
  assert.match(html, /1 farmer has no confirmed sector assignment/);
  assert.match(html, /View these farmers/);
  assert.match(html, /href="#registered-farmers"/);
  assert.match(html, /ID registration location/);
  assert.match(html, /District One/);
  assert.match(html, /Not recorded/);
  assert.match(html, /Test Farmer/);
});
const fullyLocatedFarmer = {
  id: "farmer-1",
  name: "Gad KALISA",
  province: "Iburasirazuba",
  district: "Kayonza",
  sector: "Rukara",
  cell: "Kawangire",
  village: "Nyabubare",
  crops: ["BEANS", "MAIZE", "WHEAT"],
  farmCount: 3,
  cultivatedHa: 7.27,
  ndvi: 0.305,
  insured: true,
  activeClaims: 0,
  riskLevel: "MEDIUM",
  phone: "0791998365",
  email: "kalisagad05@gmail.com",
};
function farmerTableMarkup(farmers: any[]) {
  const html = render(
    <GovLeaderboardPage regionId="rwanda" />,
    ["government", "leaderboard", "rwanda"],
    { ...leaderboard, farmers },
  );
  const start = html.indexOf('<table class="w-full min-w-[1700px]');
  assert.ok(start >= 0, "full-width farmer table exists");
  return { html, table: html.slice(start, html.indexOf("</table>", start)) };
}
function cellText(html: string, tag: "th" | "td") {
  return [
    ...html.matchAll(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, "g")),
  ].map((match) => match[1].replace(/<[^>]*>/g, "").trim());
}
await test("farmer table aligns all fifteen headers with registered location and portfolio cells", () => {
  const { table } = farmerTableMarkup([fullyLocatedFarmer]);
  const headers = cellText(table, "th"),
    cells = cellText(table, "td");
  assert.deepEqual(
    headers,
    farmerTableColumns.map(([, title]) => title),
  );
  assert.equal(cells.length, headers.length);
  assert.deepEqual(cells, [
    "Gad KALISA",
    "Iburasirazuba",
    "Kayonza",
    "Rukara",
    "Kawangire",
    "Nyabubare",
    "Beans, Maize, Wheat",
    "3",
    "7.27",
    "0.305",
    "Yes",
    "0",
    "Medium",
    "0791998365",
    "kalisagad05@gmail.com",
  ]);
});
await test("country farmer table includes accounts without farms and preserves zero values", () => {
  const { table } = farmerTableMarkup([
    fullyLocatedFarmer,
    {
      ...fullyLocatedFarmer,
      id: "farmer-2",
      name: "New Farmer",
      crops: [],
      farmCount: 0,
      cultivatedHa: 0,
      ndvi: 0,
      insured: false,
      activeClaims: 0,
    },
  ]);
  assert.equal(cellText(table, "td").length, 30);
  assert.deepEqual(cellText(table, "td").slice(15, 27), [
    "New Farmer",
    "Iburasirazuba",
    "Kayonza",
    "Rukara",
    "Kawangire",
    "Nyabubare",
    "—",
    "0",
    "0",
    "0.000",
    "No",
    "0",
  ]);
});
await test("farmer table contains horizontal overflow without splitting location and contact values", () => {
  const { html, table } = farmerTableMarkup([fullyLocatedFarmer]);
  assert.match(html, /overflow-x-auto overscroll-x-contain/);
  assert.match(html, /aria-label="Farmer table, horizontally scrollable"/);
  assert.match(
    html,
    /aria-describedby="farmer-table-scroll-hint" tabindex="0"/,
  );
  assert.match(table, /min-w-\[1700px\] whitespace-nowrap/);
  assert.doesNotMatch(table, /break-all|break-words/);
  assert.match(html, /flex flex-col gap-2 sm:flex-row/);
  assert.match(table, /kalisagad05@gmail.com/);
});
await test("farmer CSV shares the table's location and portfolio column order", () => {
  const rows = farmerTableCsv([fullyLocatedFarmer] as any);
  assert.deepEqual(
    rows[0],
    farmerTableColumns.map(([, title]) => title),
  );
  assert.equal(rows[1].length, 15);
  assert.deepEqual(rows[1], [
    "Gad KALISA",
    "Iburasirazuba",
    "Kayonza",
    "Rukara",
    "Kawangire",
    "Nyabubare",
    "BEANS, MAIZE, WHEAT",
    3,
    7.27,
    0.305,
    "Yes",
    0,
    "MEDIUM",
    "0791998365",
    "kalisagad05@gmail.com",
  ]);
  const empty = farmerTableCsv([
    { ...fullyLocatedFarmer, sector: null, farmCount: 0, insured: false },
  ] as any);
  assert.equal(empty[1][3], null);
  assert.equal(empty[1][7], 0);
  assert.equal(empty[1][10], "No");
});
for (const [Component, prop] of [
  [GovSectorPage, "sectorId"],
  [GovCellPage, "cellId"],
  [GovVillagePage, "villageId"],
] as const) {
  await test(`${prop} drill-down uses the supplied real region ID`, () => {
    const html = render(
      <Component {...({ [prop]: "actual-region-id" } as any)} onBack={noop} />,
      ["government", "leaderboard", "actual-region-id"],
      { ...leaderboard, region: { ...region, regionId: "actual-region-id" } },
    );
    assert.match(html, /Test Jurisdiction/);
    assert.match(html, /Test Farmer/);
  });
}
await test("farmer page renders an empty portfolio and absent contact details", () => {
  const html = render(
    <GovFarmerPage farmerId="farmer-1" onBack={noop} />,
    ["government", "farmer", "farmer-1"],
    farmer,
  );
  assert.match(html, /Test Farmer/);
  assert.match(html, /No registered farms/);
  assert.match(html, /No policies recorded/);
});
await test("farmer plantings use coverage of the exact farm rather than another policy with the same crop", () => {
  const result = farmerProfileView({
    ...farmer,
    farms: [
      { id: "farm-one", cropType: "MAIZE", insured: false },
      { id: "farm-two", cropType: "MAIZE", insured: true },
      { id: "farm-three", cropType: "MAIZE" },
    ],
    policies: [
      {
        id: "policy-two",
        policyNumber: "POL-CURRENT",
        crop: "MAIZE",
        status: "ACTIVE",
        premiumAmount: 100,
      },
    ],
    totals: { ...farmer.totals, totalFarms: 3, insuredFarms: 1 },
  } as any);
  assert.deepEqual(
    result.plantings.map((farm) => farm.insured),
    [false, true, false],
  );
  assert.equal(result.totals.insuredPlantings, 1);
});
await test("policy registry renders zero-result analytics", () => {
  const html = render(
    <GovPoliciesPage regionId="rwanda" />,
    [
      "government",
      "policies",
      "rwanda",
      1,
      "",
      undefined,
      undefined,
      undefined,
    ],
    { analytics: policyAnalytics, registry },
  );
  assert.match(html, /Policy Registry/);
  assert.doesNotMatch(html, /Loading government records/);
});
await test("claims registry renders zero-result analytics", () => {
  const html = render(
    <GovClaimsPage regionId="rwanda" />,
    [
      "government",
      "claims",
      "rwanda",
      1,
      "All Statuses",
      "All Causes",
      "All Crops",
      "All Insurers",
      undefined,
      null,
      "asc",
    ],
    { analytics: claimsAnalytics, registry },
  );
  assert.match(html, /Claim Tracking/);
});
await test("claim details render immediately without waiting for optional satellite or weather data", () => {
  const detail = {
    claim: {
      id: "claim-1",
      cause: "FLOOD",
      claimType: "FARMER_REPORTED_LOSS",
      status: "FILED",
      filedAt: "2026-01-01",
      lossDescription: "Test flood evidence",
      damagePhotos: [],
    },
    farm: null,
    farmer: null,
    policy: null,
    insurer: null,
    assessment: null,
  };
  const html = render(
    <GovClaimDetailsPage claimId="claim-1" onBack={noop} />,
    ["government", "claim", "claim-1"],
    detail,
  );
  assert.match(html, /Flood/);
  assert.match(html, /Test flood evidence/);
  assert.match(html, /Reports/);
  assert.match(html, /Area Lost/);
  assert.match(html, /Verified Loss/);
});
await test("subsidies render actual financial metrics and premium statements", () => {
  const html = render(
    <GovSubsidiesPage regionId="rwanda" />,
    ["government", "subsidy-invoices", "rwanda", undefined],
    billing,
  );
  assert.match(html, /Test Insurer/);
  assert.match(html, /1,000/);
  assert.doesNotMatch(html, /Process Payment/);
});
await test("statement details contain actual policy lines and export action", () => {
  const html = render(
    <GovInvoicePage invoice={invoice} regionId="rwanda" onBack={noop} />,
  );
  assert.match(html, /REAL-POLICY-001/);
  assert.match(html, /Download invoice PDF/);
  assert.doesNotMatch(html, /Payment Processed/);
});
await test("season comparison renders scoped reference selectors", () => {
  const html = render(
    <GovSeasonComparePage regionId="district-1" />,
    ["government", "comparison-reference", "district-1"],
    {
      regions: [{ id: "district-1", name: "Test District" }],
      seasons: ["Season A 2026"],
    },
  );
  assert.match(html, /Region\.\.\./);
  assert.match(html, /Choose a region and a season/);
  assert.match(html, /Side A/);
});
await test("a selected comparison renders season metrics with zero NDVI intact", () => {
  const sides = [
    { scope: "rwanda", season: "Season A 2026" },
    { scope: "rwanda", season: "Season B 2026" },
  ];
  const values = [
    {
      cultivated: 2,
      ndvi: 0,
      yield: null,
      insurance: 50,
      claims: 2,
      subsidy: 0.4,
    },
    {
      cultivated: 3,
      ndvi: 0.2,
      yield: null,
      insurance: 100,
      claims: 1,
      subsidy: 0.8,
    },
  ];
  const html = render(<ComparisonMatrix sides={sides} values={values} />);
  assert.match(html, /0.00/);
  assert.match(html, /Cultivated Area/);
  assert.match(html, /Avg Yield/);
  assert.match(html, /50%/);
  assert.match(html, /100%/);
  assert.match(html, /Concept Breakdown/);
  assert.doesNotMatch(html, /NaN|Infinity/);
});
await test("comparison keeps the loaded side visible and skeletons only pending metrics and the dependent chart", () => {
  const html = render(
    <ComparisonMatrix
      sides={[
        { scope: "ngoma", season: "Season B 2026" },
        { scope: "kayonza", season: "Season B 2026" },
      ]}
      values={[
        {
          cultivated: 7.27,
          ndvi: 0.25,
          yield: null,
          insurance: 100,
          claims: 0,
          subsidy: 0,
        },
        null,
      ]}
      loading={[false, true]}
    />,
  );
  assert.match(html, /7.27 ha/);
  assert.match(html, /0.25/);
  assert.match(html, /Side B Cultivated Area loading/);
  assert.match(html, /Loading comparison chart/);
  assert.doesNotMatch(html, /Side A .* loading|Loading government records/);
  assert.equal((html.match(/aria-busy="true"/g) || []).length, 6);
});
await test("comparison reference loading preserves the page controls layout", () => {
  const html = render(<GovSeasonComparePage regionId="rwanda" />);
  assert.match(html, /Side A is the base reference/);
  assert.match(html, /Loading regions/);
  assert.match(html, /Loading seasons/);
  assert.doesNotMatch(html, /Loading government records/);
});
await test("cultivated area retains fractional hectares including plots smaller than one hectare", () => {
  const area = concepts.find((concept) => concept.key === "cultivated")!;
  assert.equal(area.format(7.266481289873429), "7.27 ha");
  assert.equal(area.format(0.24), "0.24 ha");
  assert.equal(area.format(0), "0 ha");
});
await test("comparison metrics use measured seasons and the paid subsidy ledger without inventing yield", () => {
  const metrics = {
    cultivatedHa: 7.27,
    avgYield: null,
    ndvi: { avg: 0, min: 0, max: 0 },
    insurancePenetration: 50,
    claims: { active: 2 },
    subsidyUtilized: 1500000,
  };
  assert.deepEqual(comparisonValues(metrics as any), {
    cultivated: 7.27,
    ndvi: 0,
    yield: null,
    insurance: 50,
    claims: 2,
    subsidy: 1.5,
  });
  assert.equal(pctChange(0, 0.5), null);
  assert.equal(pctChange(-0.2, 0), 100);
  assert.equal(pctChange(100, 50), -50);
});
await test("invoice crop breakdown sums actual line contributions and counts each farm once", () => {
  const duplicate = {
    ...invoice,
    lines: [
      ...invoice.lines,
      { ...invoice.lines[0], policyId: "policy-2", subsidy: 200 },
      { ...invoice.lines[0], farmId: "farm-2", crop: "BEANS", subsidy: 100 },
    ],
  };
  assert.deepEqual(invoiceBreakdown(duplicate), [
    { crop: "MAIZE", farms: 1, amount: 600 },
    { crop: "BEANS", farms: 1, amount: 100 },
  ]);
});
await test("unissued invoice shows preparation and cannot be recorded as paid before it exists", () => {
  const html = render(
    <GovInvoicePage
      regionId="rwanda"
      invoice={{ ...invoice, status: "NOT_ISSUED" }}
      onBack={noop}
    />,
  );
  assert.match(html, /Prepare Invoice/);
  assert.doesNotMatch(html, /Process Payment|Already Paid/);
});
await test("new government financial and trajectory requests preserve scoped URLs, auth and audit payloads", async () => {
  const calls: any[] = [];
  globalThis.fetch = async (url, init) => {
    calls.push({
      url: new URL(String(url)),
      method: init?.method ?? "GET",
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
      auth: new Headers(init?.headers).get("Authorization"),
    });
    return Response.json({ success: true, data: { ok: true } });
  };
  await api.getSubsidyInvoices("district/one", "Season B 2026");
  await api.createSubsidyInvoice("district/one", "insurer-1", "Season B 2026");
  await api.recordSubsidyPayment(
    "district/one",
    "invoice/one",
    "BANK-001",
    "2026-11-01",
  );
  await api.rejectSubsidyInvoice(
    "district/one",
    "invoice/one",
    "Incorrect premium",
  );
  await api.getRegionTrajectory("district/one", "Season B 2026");
  assert.ok(
    calls.every(
      (c) =>
        c.url.pathname.includes("district%2Fone") &&
        c.auth === "Bearer test-token",
    ),
  );
  assert.equal(calls[0].url.searchParams.get("season"), "Season B 2026");
  assert.deepEqual(calls[1].body, {
    insurerId: "insurer-1",
    season: "Season B 2026",
  });
  assert.equal(calls[2].method, "POST");
  assert.ok(calls[2].url.pathname.endsWith("/invoice%2Fone/payment"));
  assert.deepEqual(calls[2].body, {
    paymentReference: "BANK-001",
    paidAt: "2026-11-01",
  });
  assert.deepEqual(calls[3].body, { reason: "Incorrect premium" });
});
await test("registry query forwards every filter and global sorting parameter", async () => {
  globalThis.fetch = async (url) => {
    const q = new URL(String(url)).searchParams;
    assert.equal(q.get("page"), "2");
    assert.equal(q.get("crop"), "MAIZE");
    assert.equal(q.get("insurer"), "insurer-1");
    assert.equal(q.get("season"), "Season B 2026");
    assert.equal(q.get("sort"), "areaLostHa");
    assert.equal(q.get("direction"), "desc");
    return Response.json(registry);
  };
  await api.getClaimsRegistry("rwanda", 2, 20, "APPROVED", "FLOOD", {
    crop: "MAIZE",
    insurer: "insurer-1",
    season: "Season B 2026",
    sort: "areaLostHa",
    direction: "desc",
  });
});
await test("errors and pending states provide clear status and retry controls", () => {
  assert.match(render(<GovPageState loading error={null} />), /role="status"/);
  const html = render(
    <GovPageState
      loading={false}
      error={new Error("Connection unavailable")}
      retry={noop}
    />,
  );
  assert.match(html, /role="alert"/);
  assert.match(html, /Try again/);
});
await test("NDVI normalization preserves zero and rejects malformed readings", () => {
  assert.deepEqual(
    normalizeNdvi({
      data: [
        { date: "2026-01-02", ndvi: 0 },
        { date: "2026-01-01", ndvi: 0.7 },
        { date: "bad", ndvi: NaN },
      ],
    }),
    [
      { date: "2026-01-01", ndvi: 0.7 },
      { date: "2026-01-02", ndvi: 0 },
    ],
  );
});
await test("weather normalization handles wrapped data, Celsius and Kelvin without invented temperatures", () => {
  const rows = normalizeForecast({
    data: {
      data: [
        {
          dt: 1767225600,
          main: { temp_min: 293.15, temp_max: 298.15 },
          rain: { "3h": 2 },
        },
        { dt: 1767229200, main: { temp: 22 }, rain: { "1h": 1 } },
        { dt: 1767312000 },
      ],
    },
  });
  assert.deepEqual(rows, [
    {
      date: "2026-01-01",
      minTempC: 20,
      maxTempC: 25,
      rainfallMm: 3,
      description: "",
    },
  ]);
});
await test("government weather panels exclude generated provider fallbacks", () => {
  const fake = {
    field_id: "mock_1_2",
    data: [{ dt: 1770000000, main: { temp: 298 } }],
  };
  assert.deepEqual(normalizeForecast(fake), []);
  assert.deepEqual(normalizeForecast({ data: fake }), []);
});
await test("claim historical weather keeps missing values unavailable and excludes generated fallbacks", () => {
  const raw = {
    field_id: "real-field",
    data: [
      {
        date: "2026-10-01",
        temp: 298.15,
        rain: 0,
        humidity: 75,
        wind_speed: 2,
      },
      { date: "2026-10-02", temp: 299.15 },
    ],
  };
  const days = normalizeHistoricalWeather({ data: raw });
  assert.equal(days[0].tempC, 25);
  assert.equal(days[0].windKph, 7.2);
  assert.equal(days[0].rainfallMm, 0);
  assert.equal(days[1].rainfallMm, null);
  assert.deepEqual(
    normalizeHistoricalWeather({ ...raw, field_id: "mock_1_2" }),
    [],
  );
  const view = claimWeatherView(days, "2026-10-02", []);
  assert.equal(view.current.tempC, 26);
  assert.equal(view.accumulated.rainfall30dMm, null);
  assert.equal(view.accumulated.normalSeasonMm, null);
});
await test("claim accumulated rain uses complete recorded periods including valid zero rainfall", () => {
  const days = Array.from({ length: 30 }, (_, i) => ({
    date: `2026-09-${String(i + 1).padStart(2, "0")}`,
    tempC: 20,
    humidity: 70,
    rainfallMm: 0,
    windKph: 2,
  }));
  const view = claimWeatherView(days, "2026-09-30", []);
  assert.equal(view.accumulated.rainfall30dMm, 0);
  assert.equal(view.accumulated.dryDays30d, 30);
  assert.equal(view.accumulated.rainfallSeasonMm, null);
});
await test("CSV export escapes quotes, protects spreadsheet formulas and preserves Unicode", async () => {
  let blob: Blob | undefined;
  const create = URL.createObjectURL,
    revoke = URL.revokeObjectURL;
  URL.createObjectURL = (value) => {
    blob = value as Blob;
    return "blob:test";
  };
  URL.revokeObjectURL = noop;
  Object.assign(globalThis, {
    document: { createElement: () => ({ click: noop }) },
  });
  try {
    downloadCsv("test.csv", [["=SUM(A1)", 'A "quoted", name', "Ibigori"]]);
    const text = await blob!.text();
    assert.match(text, /'=SUM\(A1\)/);
    assert.match(text, /A ""quoted"", name/);
    assert.match(text, /Ibigori/);
  } finally {
    URL.createObjectURL = create;
    URL.revokeObjectURL = revoke;
    delete (globalThis as any).document;
  }
});
for (const [path, expected] of [
  ["/government/dashboard", "Jurisdiction Heat Map"],
  ["/government/leaderboard", "Test Child Region"],
  ["/government/leaderboard?region=actual-region-id", "Test Child Region"],
  ["/government/leaderboard?region=rwanda&farmer=farmer-1", "Crop Portfolio"],
  ["/government/policies", "Policy Registry"],
  ["/government/claims", "Claim Tracking"],
  ["/government/invoicing", "Aggregated Invoices"],
  ["/government/compare", "Side A"],
]) {
  await test(`government shell renders ${path}`, () => {
    const original = console.error;
    // React Router uses layout effects in browsers; server rendering warns about them.
    console.error = (...args) => {
      if (!String(args[0]).includes("useLayoutEffect")) original(...args);
    };
    try {
      const html = render(
        <MemoryRouter initialEntries={[path]}>
          <AuthProvider>
            <NotificationProvider>
              <GovernmentDashboard />
            </NotificationProvider>
          </AuthProvider>
        </MemoryRouter>,
        ["government", "jurisdiction"],
        region,
        [
          [["government", "leaderboard", "rwanda"], leaderboard],
          [["government", "leaderboard", "actual-region-id"], leaderboard],
          [["government", "farmer", "farmer-1"], farmer],
          [
            ["government", "overview", "rwanda"],
            { leaderboard, trajectory: { points: [] }, alerts: [], billing },
          ],
          [
            [
              "government",
              "policies",
              "rwanda",
              1,
              "",
              undefined,
              undefined,
              undefined,
            ],
            { analytics: policyAnalytics, registry },
          ],
          [
            [
              "government",
              "claims",
              "rwanda",
              1,
              "All Statuses",
              "All Causes",
              "All Crops",
              "All Insurers",
              undefined,
              null,
              "asc",
            ],
            { analytics: claimsAnalytics, registry },
          ],
          [["government", "subsidy-invoices", "rwanda", undefined], billing],
          [
            ["government", "comparison-reference", "rwanda"],
            {
              regions: [{ id: "rwanda", name: "Rwanda" }],
              seasons: ["Season A 2026"],
            },
          ],
        ],
      );
      assert.ok(html.includes(expected), `Expected route content: ${expected}`);
      assert.match(html, /Gov Command/);
    } finally {
      console.error = original;
    }
  });
}
globalThis.fetch = realFetch;
