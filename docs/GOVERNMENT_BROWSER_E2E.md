# Government dashboard: interactive browser verification

Verified on November 22, 2026 through the ChatGPT in-app @Browser. These checks used the actual application UI, HTTP authentication, NestJS controllers/services and MongoDB. They are separate from the existing browser component suite, which uses API fixtures.

## Environments and data

- The existing app at `http://localhost:1111` was checked using the government session supplied by the user. Dashboard, policy registry, season selection, subsidy drafts and invoice PDF download were read-only checks.
- Mutating invoice checks used a second frontend at `http://localhost:2118`, the complete backend AppModule at `http://localhost:3118/api/v1`, and a disposable MongoDB 7 database named `starhawk_browser_e2e` on port 27118. No frontend API responses were mocked. Accounts, policy lines, claims, budgets and transfer references were synthetic and marked TEST ONLY.
- Email delivery, scheduled jobs and NDVI bootstrap recovery were disabled in the isolated server. External provider credentials were not used. The isolated server's configuration points provider clients at an unavailable loopback address.
- No subsidy invoice was prepared, rejected or marked paid in the configured application database. Payment recording does not initiate a bank transfer.

## Browser results

| Flow | Observed result |
| --- | --- |
| Government login and session | Actual login/JWT/profile load worked; reload preserved the session. Logout and login as a district official worked. |
| Dashboard | Jurisdiction KPIs, stored NDVI trajectory, missing-alert state and child-region heat map loaded. Mobile layout settled within its viewport. |
| Country leaderboard | All five provinces appeared, including empty regions. Registered farmers appeared at country level. |
| Regional navigation | Country → province → district → sector → cell → village → farmer worked with real region IDs. Each child page showed its own snapshot and descendants. |
| Farmer location/table | All five registration-address fields appeared in correctly aligned columns. At 375 px, the farmer table had 339 px available for 1,700 px of content; scrolling changed its horizontal offset to 678 px without expanding the page. |
| Breadcrumbs | Full path appeared on desktop. Mobile collapsed parents into the dots menu, which listed all four intermediate ancestors. |
| Farmer export | Browser download produced a CSV with 15 headers, 15 matching fields and the complete synthetic address. |
| NDVI | Seeded stored observations produced latest regional NDVI 0.59, 7D +0.10 and 30D +0.20 at each regional level. Empty provinces showed No reading. |
| Coverage/policies | The synthetic farmer was insured; two of three plantings were insured (67%). Registry showed two active policies and one date-expired policy, even though its stored status was ACTIVE. Expired filtering returned exactly that policy. The original app also displayed one active and two expired policies correctly. |
| Claims | The synthetic filed claim appeared in the registry and detail page. Field Info, Weather, Reports and Overview tabs loaded. Missing geometry, assessment, photos, reports and weather were explicit; unknown assessed area remained unavailable. |
| Compare Seasons | Independent region/season selectors loaded actual seasonal metrics. Historical missing NDVI/yield stayed unavailable. Moving Side B left changed the baseline and preserved each selection. A third comparison could be added; the 320 px layout stayed within the viewport. |
| Subsidy drafts | Actual policy premiums grouped by insurer and policy-start season. Insurer company names resolved from profiles. Original-app Season A draft and PDF loaded without issuing an invoice. |
| Prepare/persistence | Alpha draft became a pending, persisted invoice and disappeared from unissued drafts. Full reload retained the invoice. |
| Reject/re-prepare | Empty rejection reason was blocked. A reason persisted with Rejected status; released policy reservations allowed a new pending invoice while retaining the rejected audit row. |
| Payment validation | Empty transfer reference and future payment date were blocked. A synthetic completed-transfer record persisted as Paid. Reusing its reference on another pending invoice was rejected without changing totals or paying the second invoice. |
| Budget calculation | From a 500,000 RWF allocation, the paid Alpha invoice used 120,000 RWF: 24% utilized, 380,000 RWF remaining. One Beta invoice remained pending; its earlier rejected invoice remained visible. Full reload preserved these results. |
| Jurisdiction protection | District official saw its own sectors and a breadcrumb rooted at its district. Opening the country URL directly showed an access-denied error. |
| Shared navigation/notifications | Mobile navigation and command-menu navigation worked. Empty notifications loaded, with disabled actions when there was nothing to read or clear. The panel fit a 320 px screen after the width correction. |

Main pages were checked on desktop and at 375 px; three-way comparison and the notifications panel were additionally checked at 320 px. The initial resize of a chart can momentarily retain the previous dimensions; settled page dimensions and screenshots showed no page overflow.

## Issues found and corrected

1. Government and insurer profiles use a Mixed `userId` field. Querying only its string representation missed profiles stored with BSON ObjectId references, blocking jurisdiction resolution and insurer company labels. Profile reads now match both representations; the isolated browser accounts deliberately use BSON references.
2. Closing the payment dialog could briefly change its title to Reject invoice during its exit animation. Dialog mode now persists independently of whether the dialog is open.
3. The government sidebar selected the deepest saved address instead of the assigned jurisdiction. It now uses the resolved jurisdiction name, with a level-specific profile fallback.
4. The shared notifications panel was 360 px wide on a 320 px screen. Its width is now constrained to the viewport and its trigger has an accessible name.

## Remaining limits

- The shared desktop **AI Insights** button is still a prototype control without an action handler. It is not a completed government feature and was not counted as a passing flow.
- Government command search currently provides page navigation, not entity search across farmers/policies/claims.
- The built-in government demo credentials were rejected by the configured database. The user supplied a valid session; the synthetic accounts authenticated against the isolated backend.
- Live satellite refresh, weather-provider availability, remote map tiles and populated document/photo viewers were not verified in the isolated seed, which intentionally has no external credentials, GPS boundaries or attachments. Stored NDVI calculations and the relevant empty states were verified.
- Budget allocation remains an administrator API operation; there is no government budget-editing UI. Recorded payments are accounting records, not bank settlement.
- Existing repository-wide frontend TypeScript errors outside this integration and the production bundle-size warnings remain. No deployment was performed.

## Regression checks and artifacts

- Backend government suite: **184 tests passed across 7 suites**. Backend production build passed after the profile-reference fix.
- Frontend government suite: **66 tests passed**. Production build and targeted ESLint checks passed.
- Both repository diffs passed `git diff --check`.
- Synthetic subsidy result screenshot: `/tmp/starhawk-government-subsidy-e2e.jpg`.
- Mobile village screenshot: `/tmp/starhawk-government-mobile-e2e.jpg`.

The disposable frontend/backend/container were stopped after testing. The original app was restored, left authenticated, and retained as the browser deliverable. Viewport overrides were reset.

## Repeating the real-backend test environment

The backend harness is `backend/test/government-browser-e2e.cjs`. It refuses to seed any database other than its fixed local test database and only seeds an empty test database. Start with a fresh disposable container:

```sh
docker run --detach --rm --name starhawk-government-browser-e2e \
  --publish 127.0.0.1:27118:27017 mongo:7.0 --bind_ip_all
```

Build the backend before starting either backend process, then run from `backend`:

```sh
npm run build
node test/government-browser-e2e.cjs
```

In another terminal, from `frontend`:

```sh
VITE_API_URL=http://localhost:3118 npm run dev -- --host 127.0.0.1 --port 2118 --strictPort
```

Sign in at `http://localhost:2118/role-selection`. The synthetic country official is `0781000003` / `gov@123`; the district official is `0781000006` / `district@123`. These credentials are fixtures in the harness, not existing-account credentials. Use only references prefixed `E2E-TEST-ONLY` when testing payment recording.

Stop the two test servers and `docker stop starhawk-government-browser-e2e` when finished. Do not change the harness database URI to a configured or deployed database.
