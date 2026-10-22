# FastFood Admin: Implementation Plan to Reach 10/10

**Scope:** `apps/admin` only. **Target:** the eight-dimension rubric and twelve gates in the FastFood Admin Panel Design Specification v2.0. **Prepared:** 23 October 2026.

**Tags:** **\[Verified\]** read in code. **\[Verify\]** depends on API behaviour or on running the app (neither was possible). **\[New\]** proposed here. **WP** means work package; every WP ends at a check that CI can run.

## 1. Summary

- The admin app is 3,766 lines: 6 pages, 4 components, 1 store, 1 API client, 2 stylesheets. It has no tests, no lint script and no test dependencies **\[Verified\]**.
- Every spec finding F1 to F12 reproduces. The spec's own token script reports exactly 75 failures on this code: 65 undefined tokens, 6 redefinitions, 4 files with raw hex colours.
- The analysis found 15 more points the spec misses or states differently (section 3). Three matter before any design work: a role check that can be bypassed in the UI (C2), a refresh-token race on every page reload (C3), and a Reject action with no reason dialog (C1). WP1 fixes the first two and WP6 the third.
- 13 work packages, WP0 to WP12. Rough effort: about 35 developer-days for one person, about 4 calendar weeks for two. The spec's own roadmap adds up to about 18 days because it leaves out the test harness, building the UI kit, and the fixes in section 3.
- Two dimensions cannot reach 10 without API work: data trust (API items 1 and 2) and real-time (item 3 plus a socket event contract). Section 8 gives the contracts so the API team can start on day 1.

## 2. How the code was analysed

| Source | What it gave | What it could not give |
| --- | --- | --- |
| Graphify index (commit 9c0b9e8) | File and symbol inventory. Import edges (App to 6 pages, Sidebar and store; Orders page to drawer, StatusBadge, shared-types, utils). Bodies of AdminLayout, App, Private, playChime, api, useAdminStore, Sidebar, OrderDrawer, StatusBadge. Shared STATUS\_META, SocketEvents, OrderStatus. | CSS, config files, string literals (so socket event names, query keys and style counts), full bodies of long components |
| admin.zip | package.json, Vite, Vercel and TypeScript config, index.html, both stylesheets, every page in full, grep counts, the spec's G1 script run on the code | Runtime behaviour, the API |

Spot check: symbol line numbers in the graph (App L265, Sidebar L23, OrderDrawer L13, each page) match the zip, so both describe the same code.

## 3. Findings the spec missed or states differently

| ID | Finding | Evidence | Fixed in |
| --- | --- | --- | --- |
| C1 | **Reject has no reason dialog.** The drawer's Reject button sends REJECTED at once with the fixed note 'Kitchen unable to fulfill'. The reason modal exists only for Cancel, and it is a select box with a pre-chosen option. Spec section 2 lists the reject/cancel modal as 'already right'. | OrderDrawer.tsx, action footer | WP6 |
| C2 | **The role guard is not real.** LoginPage calls setTokens (which sets isAuthenticated true) before checking the role, then only shows a toast on denial. App redirects /login to / whenever isAuthenticated is true, and Private checks only isAuthenticated. A customer or rider login lands inside the admin shell (the API should still refuse their calls). The spec lists this guard as 'already right'. | LoginPage.tsx handleLogin; App.tsx Private and routes; admin.store.ts | WP1 |
| C3 | **Refresh race on every reload.** The store persists the refresh token and isAuthenticated true, not the access token. On reload the shell renders at once, queries fire with no token, each 401 starts the interceptor's refresh, and App's own effect posts /auth/refresh as well. Two refreshes use the same refresh token. If the API rotates tokens, one fails and calls logout. | App.tsx App() effect; api.ts interceptor; admin.store.ts partialize | WP1 **\[Verify rotation\]** |
| C4 | **Two shapes under one query key.** Sidebar saves the raw response under \['orders'\]; the pages save r.data.orders or r.data. If the API returns an object with an orders field, whichever lands first can hand an object to code that calls .filter. Worse than F6's wrong badge: it can throw. | Sidebar.tsx L28-33; Dashboard and Orders queryFn | WP4 **\[Verify response shape\]** |
| C5 | **Socket event name mismatch.** App listens for 'order:status\_update'. The shared SocketEvents has no such event (it has ORDER\_NEW, and ORDER\_STATUS for the customer room). Event names are hard-coded strings, not the shared constants. If the API never emits it to the admin room, status changes reach the screen only through 10 s polling. | App.tsx L89 and L110; enums.ts | WP4 **\[Verify emit\]** |
| C6 | Spec names the focus token `--ring`; tokens.css already has `--focus`. Keep `--focus`; add `--ring` as an alias only if the wording matters. | tokens.css | WP2 |
| C7 | The `pulse` keyframe is also undefined (the spec lists only fadeIn). The Dashboard 'Realtime' pill and the rider Online dot never pulse. The pill is static green and says 'Realtime' even when the socket is down. | DashboardPage L217; RidersPage L179; globals.css has only slideIn | WP2, WP6 |
| C8 | White text on a success button: 'Mark Ready' uses #fff on `--success`, which is #4ADE80 in dark theme (about 1.7:1). Extends F12. | OrderDrawer.tsx | WP2 |
| C9 | `base: './'` in vite.config.ts breaks any nested deep link under the SPA rewrite, because assets resolve relative to /orders/123. Harmless today (all routes are one level deep); must change before /orders/:id exists. | vite.config.ts; vercel.json | WP0 |
| C10 | One-click money and account actions. Settle posts the full settlement with no amount and no confirm. Suspend and Activate on riders and customers are one click with no reason. | RidersPage L206 and L223; CustomersPage L175 | WP9 |
| C11 | Time zone. 'Today', daily revenue and hourly buckets use the browser's local time (toDateString, getHours), so the same data gives different answers on a phone in another zone. | DashboardPage; AnalyticsPage | WP10 **\[decision\]** |
| C12 | Keyboard and labels. Kanban cards are div with onClick; order rows are tr with onClick and JS hover handlers. Neither can be reached by keyboard. 0 htmlFor, 0 tabIndex. zod is installed and never imported. playChime creates a new AudioContext on every call and never closes it. | DashboardPage; OrdersPage; LoginPage; App.tsx | WP5, WP6, WP7 |
| C13 | Menu form: no sizes or add-ons editor although orders carry sizeLabel and addOns. Edit sends the whole item (including \_id and timestamps) in the PATCH. Price conversion is inline x100 and /100. | MenuPage L45-70 | WP8 **\[Verify API whitelist\]** |
| C14 | Each page keeps selectedOrder as a snapshot copy, so socket updates never reach an open drawer; status is patched by hand after a transition. The same transition mutation is copied into Dashboard and Orders. | DashboardPage L31-41; OrdersPage L25-37 | WP4, WP6 |
| C15 | Spec gap: Orders chips need a count per status for the current search and date range, but API item 1 returns only a total for the current filter. Add a counts object to item 1. | spec sections 6.3 and 10 | API 1 |

## 4. Target structure and rules

```
apps/admin/src/
  app/             router.tsx (lazy routes, one layout route), providers.tsx, guards.tsx
  api/             client.ts (single-flight refresh), orders.ts, menu.ts, users.ts, stats.ts, schemas.ts (zod), queryKeys.ts
  realtime/        socket.ts, RealtimeProvider.tsx, alerts.ts (chime, wake lock, title, live region)
  state/           auth.store.ts (with role and boot status), ui.store.ts (theme, sound)
  styles/          tokens.css (only file with colours), layout.css, components.css, motion.css
  components/ui/   the 24 kit components of spec section 7
  features/        orders, menu, riders, customers, analytics, settings (page + parts + hooks)
  lib/             money.ts, time.ts (restaurant time zone), permissions.ts, ops.ts (thresholds)
  dev/             KitPage.tsx (development only)
scripts/           check-tokens.mjs, check-contrast.mjs, check-bundle.mjs
e2e/               Playwright specs: a11y, keyboard, reflow, targets, realtime, snapshots
```

Rules every pull request follows:

1. Colours live only in `tokens.css`. No raw hex, no redefined token, no undefined token (G1).
2. No layout in inline `style`. Inline style only for runtime values such as a progress width (G12).
3. One query key per distinct request; keys come from `queryKeys.ts` only.
4. The browser never aggregates orders. Server numbers only, each with a freshness stamp.
5. Every data view ships loading, empty, error, offline and stale states.
6. Every control is a real button, link or input with a visible label or `aria-label`.
7. Use logical CSS properties (margin-inline, padding-block) so a later right-to-left Urdu build needs no rework.
8. The server is the authority on roles; UI gating only hides what the server would refuse.

## 5. Work packages (WP0 to WP5: foundation)

### WP0 Guardrails and baseline (0.5 day)

- `vite.config.ts`: set `base: '/'` (C9). `index.html`: add `viewport-fit=cover`, a theme-color meta, and a tiny inline script that sets `data-theme` before first paint so there is no flash.
- `package.json` scripts: `lint`, `check:tokens`, `check:contrast`, `test`, `test:e2e`, `size`. Dev dependencies **\[New\]**: eslint, typescript-eslint, eslint-plugin-jsx-a11y, vitest, @testing-library/react, jsdom, @playwright/test, @axe-core/playwright, @lhci/cli.
- Add `scripts/check-tokens.mjs` from spec section 12 with a baseline file listing today's 75 violations, so CI fails only on new ones until WP2 empties the baseline.
- ESLint: jsx-a11y recommended, plus a no-restricted-syntax rule that bans layout keys (display, flex, grid, gap, padding, margin, width, height, position, top, left, right, bottom, overflow) inside `style={{ }}`. Warning now, error at WP3 (G12).
- CI on every pull request: typecheck, lint, check:tokens, unit tests, build with size check, and Playwright against a mocked API (route mocking or MSW) so the gates never need the live API.
- **Done when:** CI runs on a pull request; check:tokens shows 75 baselined and 0 new.

### WP1 Session and access correctness (1 day; C2, C3)

- Auth store: add `role` and `status` (booting or ready). Persist only the refresh token. Treat the user as authenticated only when an access token exists and the role is admin or staff.
- `api/client.ts`: one single-flight `refreshAccessToken()` promise shared by the interceptor and the boot step. Boot runs once, in one place, and the app shows a splash until it finishes. No query runs before the access token exists (gate with `enabled`).
- LoginPage: call login, then `/users/me`, check the role, and only then store tokens and user. On denial store nothing and show an inline `role='alert'` message.
- `Private`: requires role admin or staff; otherwise log out and redirect.
- Sign out disconnects the socket, clears tokens and calls `queryClient.clear()`.
- Tests: customer credentials stay on /login; a reload makes exactly one /auth/refresh call; ten simultaneous 401s make one refresh.
- **Done when:** those three tests pass. Ship WP0, WP1 and WP2 together as release 1: they fix live bugs and change no layout.

### WP2 Tokens and theming (1.5 days; F1, F2, F3, F12, C6 to C8)

- Delete the colour block in the `:root` of `globals.css`; keep `--sidebar-w` and `--header-h`. Replace the global `table`, `th`, `td`, `tr:hover` rules (they hold rgba colours) with token-based classes.
- Apply spec Appendix A in one codemod pass: 65 undefined-token sites, plus `--bg`, `--surface`, `--surface2`, `--primary`, `--radius` used by `.card`, `.input`, `.btn`, login and the HTML body.
- `tokens.css` additions: `--info`, `--info-bg`, `--bg-hover`, `--bg-pressed`, `--on-success`, `--chart-1` to `--chart-6` (light and dark), `--z-*`, `--space-10`, `--space-12`. New `motion.css`: slideIn, fadeIn, pulse, sheetUp, ticketIn, and the reduced-motion block.
- Replace every `#fff` with `--action-fg`, `--on-danger` or `--on-success`. Style the Toaster from tokens. Recharts hex colours become `var(--chart-n)`. Remove the dead `.badge-*` rules.
- ThemeProvider with Light, Dark and System, stored in the existing `ember_theme` key. Default Dark on kitchen devices.
- `check:contrast` script: reads both themes from tokens.css and checks every pair in spec section 4.2, the ten badge tones, chart series against the surface (3:1), and the on-colour pairs.
- **Done when:** G1 has 0 failures with an empty baseline; G2 passes; light-theme screenshots of all six pages show readable text.

### WP3 Layout primitives and shell (4 days; F4, F5 shell part, F11 shell part)

- `layout.css`: `.page`, `.stack`, `.cluster`, `.grid-auto`, `.card`, `.table`, `.sr-only`, `.skip-link`. Use `100dvh`, safe-area insets and `scroll-padding`.
- Router: one layout route with an Outlet instead of repeating Private and AdminLayout on every route. Every page is `React.lazy` with a skeleton fallback. Page titles come from route handles (replaces the pageTitles map).
- Shell by width (spec 4.5): under 768 an app bar plus bottom tabs (Live, Orders with badge, Menu, Riders, More holding Customers, Analytics, Settings, theme, sign out); 768 to 1023 a 72 px rail; 1024 and up a 240 px collapsible sidebar; 1440 and up content capped at 1440.
- Navigation uses NavLink with aria-current; skip link; header, nav and main landmarks; one h1 per page through PageHeader. Top bar: search (focus with /), connection pill, sound toggle, bell with the last 10 orders, avatar menu with theme and sign out. Offline banner. Document title shows `(n) FastFood Admin`.
- The Orders badge counts PLACED only and comes from the stats query, not the list.
- Login moves to layout classes; flame SVG replaces the burger emoji; inputs are 16 px on phones; labels linked with htmlFor; autocomplete attributes added.
- ESLint layout rule becomes an error.
- **Done when:** G3 and G5 pass on shell and login at 320, 375, 768 and 1280 px in both themes.

### WP4 Data and realtime layer (2 days; F6, F7 and F8 interim, C4, C5, C11, C14)

- `queryKeys.ts` factory: orders list (with filters), order by id, stats (with range), riders, customers (with query), menu, categories. No two screens share a key unless they share the request.
- `api/*` modules validate responses with zod `safeParse` at the boundary. One `unwrapList()` replaces every `r.data?.orders ?? r.data ?? []`.
- One `useOrderTransition()` hook for board, list and sheet: optimistic `setQueryData`, rollback on error, toast with the server's message, 409 handled. Replaces the two copies.
- Realtime: `socket.ts` exposes connecting, live, reconnecting, offline. Event names come from SocketEvents, with the admin status event and the no-rider event added there (C5). Handlers patch the cache with `setQueryData`, then invalidate only affected keys. Poll every 10 s only while disconnected; 60 s safety refetch; refetch active queries once on reconnect. Remove all per-page refetchInterval.
- `useFreshness(key)` gives 'Updated 12 s ago', amber after 60 s.
- `lib/time.ts`: one restaurant time-zone constant used wherever the UI formats 'today'. `lib/permissions.ts`: `can(role, action)` from spec section 3.3.
- Until API item 1 exists: request `limit=100` and label every list 'Latest 100 orders'.
- **Done when:** unit tests for patch, rollback and reconnect pass; a test fails if two different requests share a key; the G11 fake-socket harness exists.

### WP5 UI kit (3 days, in parallel with WP4; F5, F9, F10, F11, spec section 7)

- Build order, dependencies first: Button and IconButton; Field, Input, Select, Textarea, Switch; SegmentedControl, FilterChip, Avatar, StatCard; StatusBadge (keep STATUS\_META and data-tone, remove all inline style); Skeleton, EmptyState, ErrorState, Banner, Toast wrapper (max 3, repeats merge); Dialog, ConfirmDialog, Drawer, BottomSheet; DataTable, ResponsiveList, ChartCard, PageHeader, LiveIndicator.
- Overlays **\[New\]**: use native `dialog` with `showModal()`, which gives focus trap, Esc, inert background and focus return. Swipe-down on the phone sheet uses pointer events. Fall back to Radix Dialog only if Safari testing fails.
- Every component has default, hover, pressed, focus-visible, disabled and loading states; 44 px hit area on touch; 2 px focus ring from `--focus` with offset. IconButton makes `label` a required prop.
- Add the 12 icons in spec 4.7.
- A development-only `/dev/kit` route shows every component in every state. G3 and G7 run against it. It is excluded from the production build.
- **Done when:** the kit page passes axe in both themes at three widths, and G6 passes on it.

## 6. Work packages (WP6 to WP12: features and gates)

### WP6 Order operations (6 days; C1, C7, C12, C14; spec 6.2, 6.4, 8.3; API 3, 4, 11)

**Board**

- OrderTicket is a real control: an article with one primary button, and the whole ticket opens the sheet through a keyboard-reachable control (Enter and Space). The age timer reads one shared `useNow(15s)` clock; thresholds (amber 10, red 20 minutes) live in `lib/ops.ts`.
- Four columns per spec 6.2 (New, Kitchen, Ready, On the way), oldest first, with a count and a red dot in the header when any ticket is red. Phone: tabs with counts and swipe. Tablet: two columns.
- READY shows 'Finding rider, 3m' and turns red with 'No rider yet' at 5 minutes (needs API 3). No Dispatch button. 'Re-send to riders' appears only after API 10.
- KPI strip (revenue against yesterday at the same time, needs action, orders today, riders online) comes from the stats call. The static 'Realtime' pill is replaced by LiveIndicator showing the true socket state (C7).

**Sheet** (drawer from 768 px, bottom sheet below)

- The order is read from the cache by id, never from a copy (C14). Ten sections as in spec 6.4: header, sticky action bar, customer with tap-to-call, items from lineTotalPaisa, totals read from the order (delete the hard-coded 100000 and 10000 fee rule), delivery with Open in Maps, payment, rider, timeline from statusHistory, reason.
- Deep link `/orders/:id` opens the sheet (needs C9 fixed first).

**Reasons and roles**

- Reject and Cancel both open one ReasonDialog: chips (Out of stock, Kitchen too busy, Customer request, Other with a text field), nothing pre-selected, danger button named 'Reject order #1042'. The reason travels as the status note (C1).
- PLACED offers Reject only; remove the duplicate 'Cancel Order' there **\[Verify the state machine\]**. Cancel after accepting is admin only and staff never see it.

**Alerting** (spec 8.3)

- One shared AudioContext, unlocked by the first tap; the sound button reads 'Tap to enable sound' until then (fixes the per-call context in C12).
- A PLACED order left unopened for 60 s repeats the chime every 30 s until opened or accepted (constants now, settings in WP11).
- Screen Wake Lock on kitchen tablets; title and favicon count; polite live region ('New order 1042, Rs. 1,350'); at most 3 toasts, extras merge into 'N new orders'.

**Done when:** the first four steps of the G4 flow (sign in, accept, open sheet, reject with a reason) pass with the keyboard only; G11 shows a new order within 2 s on a fake socket and the offline banner appears and clears; age colours are right at 9, 10, 19 and 20 minutes; accepting takes two taps or fewer.

### WP7 Orders list (3 days; F7, F9, C12; spec 6.3; API 1)

- Toolbar: server-side search (debounce 300 ms); status chips for all ten statuses including Delivery failed, with server counts (API 1 counts); date range (Today default, 7 days, 30 days, custom); Board or Table switch (Board is the default on tablet and for staff).
- DataTable per spec: sortable by placed time and total through header buttons with aria-sort, sticky header, and a real button in each row that opens the sheet. On phones ResponsiveList shows cards and a Filter sheet.
- Cursor paging, 50 per page, 'Load more', 'Showing 50 of 312' (`useInfiniteQuery`). The query key carries status, q, from and to. Row actions match the board.
- **Done when:** counts stay right beyond 100 orders (G10); the Delivery failed filter exists; all five states are present; G3 and G5 pass.

### WP8 Menu manager (4 days; F2, F10, C13; spec 6.5)

- Split MenuPage (690 lines, 74 inline styles) into ItemsTab, CategoriesTab, ItemForm and ItemRow or ItemCard.
- The availability Switch shows the words Available or Sold out, is optimistic with an Undo toast, and is allowed for staff. Bulk select with Mark sold out and Mark available.
- ItemForm uses react-hook-form with a zod schema (add @hookform/resolvers). The payload picks only editable fields. Prices go through one shared money helper **\[Verify the utils export\]**. Sizes and add-ons repeaters **\[Verify API field names\]**. Image upload with progress, a size limit, `capture='environment'`, and a decision on `imageUrl` versus `image` **\[Verify\]**. Errors tied by aria-describedby; focus moves to the first error.
- Delete uses ConfirmDialog ('Past orders keep their name and price') and the delete mutation gets an onError.
- Categories (read-only today) become reorderable with Move up and Move down buttons plus a drag handle, writing sortOrder, with an active toggle **\[Verify API\]**.
- Role gating: price edit and delete are admin only.
- **Done when:** marking sold out is one tap on a phone; the form works at 320 px; a search for `confirm(` in src finds nothing; the reorder step of G4 passes.

### WP9 Riders and customers (3 days; F9, C10; spec 6.6 and 6.7; API 6, 7)

- Riders: a stat strip that scrolls sideways on phones, ResponsiveList, status always in words, cash in hand in amber with an icon, SettleDialog (amount, last settlement date, confirm; admin only), SuspendDialog with a reason, and a rider drawer with delivery history and cash ledger.
- Customers: server-side search and paging, Active or Suspended chips, the same SuspendDialog, and a drawer with order history from `GET /orders?customerId=`.
- A failed request shows ErrorState with Retry, never an empty table.
- **Done when:** the Online count equals the rows marked Online; settling needs an explicit confirm and records an entry (API 7); suspend is reversible and logged.

### WP10 Analytics (3 days; F8, C11; spec 6.8; API 2)

- Lazy route. Range control 7, 30, 90 days (default 30). KPI cards (revenue, orders, average order value, cancellation rate), each with the change against the previous period.
- Four charts in ChartCard: title, one-sentence summary, View as table, `accessibilityLayer`, series from `--chart-*` tokens, no meaning by colour alone. 'Heatmap' is renamed Busiest hours. Top items show quantity and revenue from the server.
- Delete the browser aggregation (revenueTrend, statusMap, itemMap, hourlyData), the 300-order query and the unused serverAnalytics call. Add 'Updated 2 min ago' and a Refresh button.
- Phone: KPIs in a 2 by 2 grid, 200 px charts, 90-day data as weekly points.
- **Done when:** every figure equals a direct database count for the same range (G10); Recharts is present only in the analytics chunk (G9).

### WP11 Store controls (2 days, optional; spec 6.9; API 8)

- 'Accepting orders' switch in the top bar with a reason customers see. Settings page: delivery fee and free-delivery threshold, order-age thresholds, new-order alert interval. The constants in `lib/ops.ts` become settings.
- **Done when:** pausing orders shows a paused Banner in the admin and the setting survives a reload.

### WP12 Hardening and gates (3 days)

- Playwright: axe on /login and the six routes at 375, 768 and 1280 px in light and dark (G3); keyboard-only flow (G4); scrollWidth not above innerWidth at 320 px on every route (G5); touch targets at least 44 by 44 at 375 px (G6); visual snapshots of Board, Orders, sheet, Menu, Riders, Analytics (G7); Lighthouse mobile on each route (G8); size check (G9); API test against a seeded database (G10); fake-socket test (G11); lint at error level (G12).
- Bundle: manualChunks for the vendor set; confirm Recharts, react-hook-form and zod load only in lazy chunks; measure initial JavaScript gzip against the 200 KB target. The initial chunk should hold React, the router, Query, axios and socket.io-client.
- Write `apps/admin/README.md`: token rules, the kit, how to run each gate.
- **Done when:** G1 to G12 are green in CI on main.

## 7. Sequence, team split and releases

**Order of work:** WP0 first. WP1 and WP2 follow (release 1). WP3, WP4 and WP5 start after WP2, with WP4 and WP5 in parallel. WP6 needs WP3 to WP5. WP7, WP8 and WP9 need WP4 and WP5 and run in parallel with each other. WP10 needs WP4, WP5 and API item 2. WP11 is optional. WP12 closes the work, but its gates run in CI from WP0 onward.

| Week | Developer A | Developer B |
| --- | --- | --- |
| 1 | WP0, WP1, WP2, start WP3 | Start WP4 and WP5 once WP2 lands (mock data until then) |
| 2 | Finish WP3 and WP5 | Finish WP4, start WP6 |
| 3 | WP8 (menu) | WP6, then WP7 |
| 4 | WP9, then WP12 snapshots and accessibility | WP10, WP11 if wanted, WP12 realtime and bundle |

One developer: about 7 weeks. These are rough estimates, not commitments.

**Releases**

1. WP0 to WP2: security and theme fixes, no layout change.
2. WP3 to WP6: new shell and board. Pilot on the kitchen tablet for two days before continuing.
3. WP7 to WP10: lists, menu, riders, customers, analytics.
4. WP11 and WP12: store controls (if wanted) and all gates green.

**Pull request rules:** one per WP (split WP6 into board, sheet and alerts). Each must pass typecheck, lint, check:tokens with no new baseline entries, and the e2e specs for the routes it touches. Review the Vercel preview at 375, 768 and 1280 px. No pull request adds inline layout styles or colours outside `tokens.css`.

## 8. API contracts the admin codes against

The API team can start these on day 1. Items 1 to 11 are the spec's list; items 3b, 12 and 13 are new from this analysis.

| # | Contract | Used by | Until it exists |
| --- | --- | --- | --- |
| 1 | `GET /orders` with status, q, from, to, customerId, cursor and limit (max 50). Response: items, nextCursor, total and counts (per status, for the same q, from and to, ignoring status). No silent clamp. | WP7, WP9 | Request 100 and label 'Latest 100 orders' |
| 2 | `GET /admin/stats` with range (today, 7d, 30d, 90d), compare and tz. Response: generatedAt, kpis, previous, series, byStatus, byHour, topItems. The today range also returns needsAction, ridersOnline and ridersTotal. | WP6 KPIs, WP10 | KPIs computed from the latest 100 and labelled; analytics blocked |
| 3 | Socket event when nobody accepts a READY order, added to SocketEvents. Payload: orderId, orderNumber, since. | WP6 | 5-minute client timer only; the G11 no-rider check stays red |
| 3b | Socket event for status changes to the admin room, named in SocketEvents (replaces the string 'order:status\_update'). Payload: the full updated order, or id, status, statusHistory, updatedAt. `order:new` carries the full order. | WP4, WP6 | 10 s polling (C5) |
| 4 | `statusHistory[].by` is an object with id, name and role, not a bare id. | WP6 | Show 'Staff' |
| 5 | `PATCH /orders/:id/status` with note. | All | Exists **\[Verified\]** |
| 6 | `GET /users?role=` with paging and q. `PATCH /users/:id` with isSuspended and reason. Server refuses non-admin. | WP9 | Today's calls, no reason |
| 7 | `POST /riders/:id/settle` with amountPaisa, returning settlementId and remainingPaisa. Cash ledger increments on delivery. `GET /riders/:id/ledger`. | WP9 | Settle dialog disabled with a stated reason |
| 8 | `/app-config` read and write: delivery fee, free-delivery threshold, accepting orders, age thresholds, alert interval. | WP11 | Constants in `lib/ops.ts` |
| 9 | Admin push-token registration. | WP6 (optional) | Skip |
| 10 | Re-send to riders for a READY order. | WP6 | Not shown |
| 11 | Order carries subtotalPaisa, deliveryFeePaisa, totalPaisa. | WP6 | Derive and label; remove the hard-coded fee rule anyway |
| 12 | State whether refresh tokens rotate and whether reuse revokes the session (C3). `/users/me` returns role admin or staff. | WP1 | Assume rotation; single-flight refresh is safe either way |
| 13 | `GET /orders` returns one shape only: an object with an items array (C4). | WP4 | unwrapList handles both |

## 9. Path to 10 on each dimension

| Dimension | Now | Work packages | Gates | Needs from API |
| --- | --- | --- | --- | --- |
| 1 Workflow and information architecture | 8 | WP6, WP7 | G4 | None |
| 2 Visual system and theming | 4 | WP2, WP5 | G1, G2, G7 | None |
| 3 Real-time operations | 7 | WP4, WP6 | G11 | Items 3 and 3b |
| 4 Data trust | 3 | WP4, WP7, WP10 | G10 | Items 1 and 2 |
| 5 States and feedback | 4 | WP5 and every page | State matrix, G4 | None |
| 6 Accessibility | 4 | WP3, WP5, WP6 | G3, G4, G6, G8 | None |
| 7 Responsive and mobile | 2 | WP3, WP5 | G3, G5, G6, G7 | None |
| 8 Performance and maintainability | 4 | WP0, WP3, WP12 | G9, G12 | None |

The 'Now' scores are the spec's. A dimension scores 10 only when its gates pass on the built app. Without the API items, expect about 6 for data trust and about 8 for real-time (the spec's own caps). Do not weaken G10 or G11 to get a green build; label interim numbers instead.

## 10. Decisions and risks

**Decisions.** Use the recommendations in spec section 14 unless the owner objects (Dark default with System available; admin-only price edit, delete, settle, suspend and full analytics; staff keep the sold-out toggle; repeating chime on; only the top-bar Accepting switch from store controls; build the missing API items alongside). This analysis adds four more:

1. **Restaurant time zone** for 'today' and hourly buckets (C11). Recommended: Asia/Karachi, since the code already formats dates as en-PK.
2. **Overlay approach:** native dialog first, Radix Dialog as the fallback (WP5).
3. **New dev dependencies** listed in WP0, plus @hookform/resolvers in WP8.
4. **Release plan** with a two-day kitchen-tablet pilot after release 2.

| Risk | Effect | Mitigation |
| --- | --- | --- |
| API items slip | G10 and G11 stay red; data trust and real-time stay near 6 and 8 | Do not weaken the gates; label interim numbers; agree the contracts in week 1 |
| iOS Safari audio unlock and wake lock | Missed alerts on a kitchen iPad | Visible 'Tap to enable sound' state and offline banner; test on the real tablet in the pilot |
| Native dialog gestures on older Safari | Sheet swipe or focus bugs | Radix Dialog fallback, decided in WP5 |
| Refresh-token rotation unknown | Logouts after reload could persist | Single-flight refresh in WP1; confirm with API item 12 |
| Charts and screen readers | Recharts is only partly accessible | The View as table toggle is the accessible path and is mandatory |
| Store controls creep | Delays the gates | WP11 stays optional; top-bar switch only |
