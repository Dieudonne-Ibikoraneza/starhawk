# Government dashboard integration

The active government dashboard uses the NestJS `/api/v1/government` API. The UI was reconciled against frontend `origin/main` at `6259dbf` (July 13, 2026), including the comparison cards and grouped metric matrix. Existing authentication, registration-address, farm location and NDVI history work was preserved.

## Restored pages

- **Overview:** original four KPI cards, NDVI trajectory with an actual prior-year series, persisted alert feed and jurisdiction heat map. Alerts open their recorded impact details. Missing observations do not generate critical alerts.
- **Leaderboard:** original ranking tabs, hierarchy-level and crop selectors, search, sortable regional table and NDVI change indicators. Country starts with all five provinces. Lower areas retain the original snapshot, crop mix and child cards, followed by the complete farmer table. Jumping to a deeper level aggregates the seeded hierarchy in memory after bounded database reads, rather than issuing queries for every village.
- **Farmers:** original identity/location card, crop portfolio, farmer-versus-sector NDVI chart, alerts, planting records, policy table and claim history. Locations come from the five saved ID registration address fields on `User`; they are independent of farm GPS assignments. Accounts without a farm profile remain visible at country level. Missing descendant locations remain unassigned and are explained instead of guessed.
- **Policies:** original four KPIs, gender/age/crop adoption charts and policy registry. Filters and sorting apply before backend pagination. Ages use optional recorded birth dates; older records without dates have a clear empty state.
- **Claims:** original KPIs, disaster-cause chart with area/claim modes and four registry filters. Loss area comes from the latest claim assessment, never from the entire farm size. The detail page retains Field Info, Weather, Reports and Overview tabs, actual report links, boundaries and recorded photos. Weather panels use real provider data; generated provider fallbacks are excluded. Incomplete weather periods do not become zero-valued seasonal totals.
- **Subsidies and invoices:** original budget/utilization/crop chart and invoice registry, payment overview, cost breakdown and document viewer. The invoice document is generated from actual policy lines, supports zoom and print, and downloads as PDF. Preparation, rejection and recording a completed transfer are persisted backend actions.
- **Compare Seasons:** original draggable Side A/B/C cards, baseline explanation, grouped General/Agricultural/Financial rows and normalized Concept Breakdown chart. Cards support keyboard/touch dragging and explicit movement controls. Each side loads its selected region and season independently. Pending metric cells and the dependent chart use skeletons while loaded sides and selectors remain visible. Reference loading uses skeletons inside the selectors. Side A supplies the baseline; changing order updates relative changes. Unknown yield remains unavailable.

The dashboard season selector scopes applicable API queries and persists in URLs. Individual comparison cards can choose different seasons. Policy/claim filters reset with the global season. Region and farmer selections persist in `?region=...&farmer=...` URLs. The old `/government-analytics` route redirects to the integrated dashboard.

## Hierarchy and responsive behavior

Country → province → district → sector → cell → village uses real seeded region IDs, immediate children and jurisdiction-scoped breadcrumbs. Duplicate names are matched through their ancestors. Empty regions remain visible. Narrow breadcrumb containers collapse intermediate parents into a dots menu; all parents remain accessible. Parent links never extend beyond the official's jurisdiction.

Farmer tables and CSV exports share the same 15-column definition: identity, all five location fields, crops, farms, cultivated area, NDVI, insurance, claims, risk, phone and email. Cells stay on one line in a keyboard-focusable horizontal scroll container; controls stack on phones. Tables do not force the page beyond the viewport. Comparison cards adapt at 320 px and retain all three sides on small devices.

## Financial records and missing data

`GovernmentSubsidyInvoice` stores an audited, immutable snapshot of the actual policy lines and contribution rate. Preparing an invoice reserves its policies using a unique multikey index so concurrent requests or different jurisdictions cannot bill them twice. Rejection requires a reason and releases those reservations. Recorded payments require a positive invoice, a completed bank-transfer reference and a non-future payment date; references are unique and repeated identical reviews are idempotent. Invoice access requires every covered farmer to be within the viewer's jurisdiction.

**Recording a payment does not initiate a bank transfer.** The dialog explicitly records a transfer already completed through the bank. Automated bank settlement is not implemented by this dashboard.

The contribution rate is configured with `GOVERNMENT_SUBSIDY_RATE`; its fallback is the remote prototype's 0.4. `GovernmentBudget` stores real region/season allocations; only administrators can set them through `PUT /government/subsidy-budget/:regionId`. No allocation is invented when a budget has not been recorded. Utilization is the sum of recorded paid subsidy invoices, separate from insurance claim payouts. Legacy premium-proxy endpoints remain for compatibility but are not used by active government pages.

Seasons retain the existing backend convention: A is January–June and B is July–December, using UTC boundaries. Comparison land area sums registered plots established by the selected season's end, including earlier sowing dates; it does not count only newly planted plots within the season. This represents registered cultivated holdings, not harvested hectares or a historical land-use reconstruction. Hectares display up to two decimal places. Issued-policy counts use start dates, claims use filing dates, and NDVI uses observations within the selected period. The policy registry and its analytics include policies whose coverage overlaps the selected season, including carry-over policies. Farmer counts describe the registered population. Harvest yield and climatological normal rainfall have no recorded source in this application and remain unavailable.

Current insurance in the overview, regional hierarchy, farmer rows and profile requires a stored ACTIVE policy with `startDate <= now <= endDate`. It is independent of the issuance season. Each response uses a consistent timestamp for its coverage counts. Expired policies are displayed as Expired even if a background process has left their stored status ACTIVE; future policies display Scheduled, and invalid date intervals display Unverified. These derived display states do not mutate policy records. Policy filters, counts and pagination apply the same effective status. Farm flags are based on the exact farm ID, never another policy with the same crop. A farmer with one insured farm out of three counts as one insured farmer (100% in a one-farmer village), while the profile shows 33% insured plantings. Season comparison evaluates insurance at the season end, or today for an unfinished season; completed seasons can include policies that have since expired.

## NDVI and location sources

`FarmNdviObservation` stores dated measurements with idempotent per-farm/polygon/date upserts. Real observations take precedence over monitoring polls and regional snapshots. The 7D/30D comparisons match the same farms to readings on or before each target date, within a 14-day baseline gap. Valid zero/negative measurements are retained; missing comparisons are unavailable. Metadata includes observation dates, staleness, baselines and compared-farm counts. Seasonal queries can read archived periods rather than only the latest 120 days.

History recovery is independent of policy status, with bounded batches, shared requests, per-farm leases, six-hour success caching and 15-minute failure retries. `POST /government/ndvi/refresh/:regionId` refreshes a bounded batch within the official's jurisdiction. Active pages expose refresh, invalidate their queries after it succeeds and poll for updates.

Farm GPS assignments retain the separate existing reverse-geocoder repair flow. Government registration-address matching does not replace a saved NIDA address with a farm location. No live location migration or financial writes were performed for this UI restoration.

## Repeatable checks

From `frontend`:

```sh
npm run test:government
npm run build
npm run test:government:browser
npx eslint src/components/government/pages src/components/dashboards/GovernmentDashboard.tsx src/components/government/gov-widgets.tsx src/services/governmentApi.ts
```

The browser suite requires Chrome (`CHROME_BIN` can override `/usr/bin/google-chrome`) and a production build for CSS. It mounts the real page components with isolated API fixtures, checks viewport containment from 320 to 1920 px, exercises comparison ordering, registry filters/pagination, season changes, level selection, breadcrumb navigation, farmer-table scrolling, alerts, claim tabs, invoice preparation/rejection/payment recording, zoom and PDF download. Screenshots and results are saved under `frontend/node_modules/.cache/government-browser/`.

From `backend`:

```sh
npm run test:government
npm run build
```

The backend suite covers jurisdiction guards, request validation, filtering/sorting before pagination, full module dependency injection, hierarchy disambiguation, measured NDVI history, registration addresses, invoice reservations/reviews and budgets. Its HTTP tests use test authentication and stub persistence on an ephemeral localhost server. Browser invoice actions also use fixtures; neither suite changes production records or runs monitoring/email jobs.

## Verification and limits

On November 21, 2026, read-only checks against the configured database verified all six administrative levels, all five country-level provinces, a complete country-level village selection (14,643 rows), full farmer address fields, a six-level profile breadcrumb and actual NDVI history. The checked hierarchy returned current NDVI 0.261, 7D +0.143 and 30D −0.129. Seasonal registry, comparison, trajectory, alert and invoice reads also succeeded. The original Season B policy queries filtered by start date and incorrectly excluded carry-over coverage. On November 22, read-only validation after the coverage fix returned three overlapping policies: one in force and two expired. All six region levels, the farmer profile, policy registry/status filters, policy analytics, season comparison and the country-level village selector agreed. Stored policy records were unchanged.

Both production builds and government lint checks pass. The frontend API/rendering suite passes 69 tests, and the backend government suite passes 185 tests. The component browser run passes 68 layout checks with no page overflow or browser errors, plus the comparison, filter, navigation, claim and invoice interactions described above. Screenshots were inspected against the remote layout. Repository-wide frontend TypeScript still reports existing errors in other role dashboards, demonstration data/components and shared API files outside this integration. The production frontend build retains existing bundle-size/Browserslist warnings.

On November 22, a separate interactive @Browser run exercised the application with real authentication and a disposable MongoDB-backed full NestJS application, including persisted invoice preparation/rejection/payment records, duplicate-transfer protection, all regional levels, registration addresses, comparison ordering and mobile navigation. It uncovered and corrected Mixed string/BSON profile lookups, a payment-dialog exit flicker, the assigned-jurisdiction sidebar label and narrow notification-panel width. See [the browser E2E report](GOVERNMENT_BROWSER_E2E.md) for exact results, safe reproduction instructions and remaining gaps, including the shared AI Insights placeholder.

Deployed authentication, external weather availability, remote map tiles and bank-side settlement are not established by local browser fixtures. Weather and missing-data states remain explicit. No deployment was performed.

The November 22 comparison follow-up verified Ngoma Season B 2026 through @Browser: the three May plantings total 7.266481289873429 hectares and now display 7.27 ha. Switching the other side to Kayonza retained Ngoma while skeletons occupied only the pending side’s cells and the dependent chart. Settled comparison layout fit 375 px. Regression coverage checks carry-over plots, future plantings, decimal hectares, partial metric loading and reference-selector skeletons. The final backend type check, frontend production build and targeted lint checks also passed.
