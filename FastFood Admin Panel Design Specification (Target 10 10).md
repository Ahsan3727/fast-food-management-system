# FastFood Admin Panel: Design Specification

**Version 2.0 · 22 October 2026 · `apps/admin` in `Ahsan3727/fast-food-management-system` (uploaded `main` snapshot)**

**Goal:** a design that earns **10/10 on all eight dimensions** of the rubric in §1, once it is built and the checks in §12 pass.

**Tags:** **\[Verified\]** read in the uploaded code · **\[New\]** proposed design · **\[Verify\]** depends on API code or runtime behaviour that could not be seen.

## 0. Read this first

- **This is a specification, not a score.** A document cannot be rated 10/10; a running app can. So §1 defines each 10/10 as a pass test, and §12 turns those tests into automated gates.
- **It supersedes §11 of `FASTFOOD_NEW_DESIGN_SYSTEM.md`.** The Ember language is kept. Where the code disagrees with that document, the code wins and the difference is listed in §2.
- **Scope:** the admin web app on desktop, tablet and phone. The customer and rider apps appear only where they share the status vocabulary.
- **What was read:** every file in `apps/admin/src`, both stylesheets, `index.html`, the Vite and Vercel config, `packages/shared-types`, `packages/utils`, and the API's order service and state machine. The app was not run, so anything about how it looks on screen is deduced from code and tagged.

## 1. The rubric: what 10/10 means

| # | Dimension | 10/10 means (pass test) | Now |
| --- | --- | --- | --- |
| 1 | Workflow and information architecture | Every order action is reachable in two taps from the board. Only legal transitions are offered, per role. One primary action per ticket. | 8 |
| 2 | Visual system and theming | One token source. Zero undefined or hard-coded colours. Light and dark pass the same visual snapshots. | 4 |
| 3 | Real-time operations | A new order is seen and heard within 2 s on a wall tablet. The app says when it is offline. No alert is silently lost. | 7 |
| 4 | Data trust | Every number comes from a server aggregate or a complete paged query. Freshness is shown. | 3 |
| 5 | States and feedback | Every data view has loading, empty, error and offline states. Every destructive action has a themed confirm with a reason. | 4 |
| 6 | Accessibility | WCAG 2.2 AA. axe reports 0 violations at 3 widths × 2 themes. Full keyboard path. Lighthouse accessibility ≥ 95. | 4 |
| 7 | Responsive and mobile | Usable at 320 px with no horizontal page scroll. Phone, tablet and desktop each have a purpose-built layout. | 2 |
| 8 | Performance and maintainability | No layout in inline styles. Tokens only. Route-level code splitting. First load ≤ 200 KB gzip (target). | 4 |
|  | **Overall (average)** |  | **4.5** |

These scores are for the code as uploaded. They are lower than a quick read suggests because the stylesheets show the theme wiring is broken (§2, F1 to F3) and there is no phone layout at all (F4).

## 2. What the code shows

| ID | Finding | Where | Effect |
| --- | --- | --- | --- |
| F1 | **Two token systems collide.** `tokens.css` (Ember, correct) is imported first. `globals.css` then re-declares `--border`, `--text`, `--text-muted`, `--success`, `--danger`, `--warning` on `:root` with the old navy values, and adds `--bg #0a0f1e`, `--surface #111827`, `--primary #f97316`. | `main.tsx` import order, both CSS files | The old values win. Ember warm-stone surfaces and old navy surfaces sit side by side. **\[Verified\]** |
| F2 | **About 65 uses of colours that are defined nowhere:** `--action`, `--muted`, `--subtle`, `--sunken`, `--ok`, `--bad`, `--ok-bg`, `--bad-bg`, `--strong`, `--raised`, `--tone-teal-fg`. | MenuPage.tsx (42), App.tsx shell (12), Sidebar.tsx (10), OrderDrawer.tsx (1). Dashboard, Orders, Riders, Customers and Analytics use defined tokens. | The declaration is dropped. The logo tile, active nav highlight, LIVE pill, avatar and the new-order toast background get no colour. **\[Verified\]** |
| F3 | **Light theme cannot work.** Only `[data-theme='dark']` has overrides. In light mode `globals.css` keeps `--text: #f9fafb` and navy surfaces, while components that use `--bg-surface` turn white. | `tokens.css`, `globals.css` | Expect near-white text on white cards. **\[Verify in a browser\]** |
| F4 | **No phone layout.** One media query in the whole app (`max-width: 1024px`, sidebar 240 to 200 px, stat grid 4 to 2 columns). `.admin-layout` is `height: 100vh; overflow: hidden` and the sidebar never hides, so a 375 px screen leaves about 175 px for content. `100vh` ignores mobile browser bars. The viewport meta lacks `viewport-fit=cover`. | `globals.css`, `index.html` | The app is unusable on a phone. **\[Verified\]** |
| F5 | **368 inline `style={{…}}` objects.** They cannot hold media queries, `:hover`, `:focus-visible` or theme variants. | All pages | This is why F3 and F4 are hard to fix today. **\[Verified\]** |
| F6 | **Cache collision.** Sidebar (`/orders`), Dashboard (`limit=100`) and Orders (`limit=200`) all use query key `['orders']`. | `Sidebar.tsx`, `DashboardPage.tsx`, `OrdersPage.tsx` | Whichever response lands first fills the cache for all three; the sidebar badge can be wrong. **\[Verified\]** |
| F7 | **Silent page-size cap.** The API clamps page size (`Math.min(limit, 100)`), so `limit=200` and `limit=300` both return at most 100 orders. | `orders.service.ts` `listAll` | Orders and Analytics see a 100-order slice and say nothing. **\[Verified\]** |
| F8 | **Analytics computed in the browser** from that slice. The server call `/orders/analytics?days=30` is fetched into `serverAnalytics` and never read. | `AnalyticsPage.tsx` | '30-Day Revenue' is really 'revenue in the latest ≤100 orders'. **\[Verified\]** |
| F9 | **No error state anywhere** (`isError` has 0 hits). | All pages | A failed Customers or Riders request reads as 'No customers found'. **\[Verified\]** |
| F10 | **Native `confirm()`** for menu delete. The order drawer has a themed cancel/reject modal; it is the only one. | `MenuPage.tsx` L420 | Inconsistent, not themeable, not accessible to style. **\[Verified\]** |
| F11 | **Accessibility basics missing.** Nav items are `<button>` plus `navigate()` (no links, no `aria-current`). 0 `:focus-visible` rules. 3 `aria-label`s and 0 `role`s in the whole app. No skip link, no live region for new orders, charts have no text alternative. | `Sidebar.tsx`, all pages | Keyboard and screen-reader use is poor. **\[Verified\]** |
| F12 | **Smaller issues.** Login still shows a 64 px 🍔 and `.btn-primary` is white on `#F97316` (2.80:1, fails AA). Components put `color: '#fff'` on `--action`, which in dark theme is the same orange. The drawer scrim uses a `fadeIn` animation that is never defined. `Toaster` hard-codes `#1f2937`. Legacy `.badge-*` classes are dead code. The drawer has no status history or rider card although the API stores `statusHistory`. Recharts loads up front (no `React.lazy`). | `LoginPage.tsx`, `OrderDrawer.tsx`, `main.tsx`, `globals.css` | **\[Verified\]** |

**Already right, keep it:** the Ember palette in `tokens.css` (passes AA in both themes, §4.2); the order workflow and role rules from the server state machine; `StatusBadge` with icon plus text driven by one shared `STATUS_META`; the drawer's reject/cancel reason modal; theme and sound persisted; socket plus chime plus toast; the token-refresh interceptor with a request queue; the drawer's `min(480px, 100%)` width; the `Private` route guard with an admin/staff role check at login; the login screen no longer prints default credentials.

## 3. Principles, people, roles

### 3.1 Principles

1. **Glanceable.** The state of the kitchen is readable from two metres.
2. **One obvious next action** per order.
3. **Honest data.** No number without a source and a freshness time.
4. **Thumb first.** Designed for the phone, then enhanced for tablet and desktop.
5. **Calm under pressure.** Colour and sound are signals, not decoration. Nothing flashes.
6. **Accessible by default.** If a control cannot be used by keyboard and screen reader, it is not done.

### 3.2 People and devices (assumptions to confirm with the owner)

| Person | Device | Needs |
| --- | --- | --- |
| Owner | Phone, plus laptop at home | See today at a glance, mark an item sold out, check rider cash, get alerted when something is stuck |
| Manager | Desktop at the counter | Run the whole day: orders, menu, riders, customers |
| Kitchen staff | Wall or counter tablet, greasy hands | Accept, prepare, mark ready. Large targets. Loud, clear new-order signal |

### 3.3 Roles **\[Verified\]** from `order.state-machine.ts`; UI gating is **\[New\]** and the server stays the authority

| Action | Staff | Admin |
| --- | --- | --- |
| Accept or reject a new order | Yes | Yes |
| Start preparing, mark ready | Yes | Yes |
| Cancel after accepting (ACCEPTED, PREPARING) | No | Yes |
| Move READY to RIDER\_ASSIGNED | No | Yes (rider normally claims it) |
| Toggle item availability | Yes **\[New\]** | Yes |
| Edit price, delete item | No **\[New\]** | Yes |
| Settle rider cash, suspend users | No **\[New, Verify API guard\]** | Yes |
| Analytics | Today's counts only **\[New\]** | Full |

## 4. Foundations

### 4.1 One source of truth for tokens

- `src/styles/tokens.css` is the **only** file allowed to contain a colour value. `globals.css` keeps layout constants only (`--sidebar-w`, `--header-h`).
- Components use CSS classes and tokens. Inline `style` is allowed only for values computed at runtime (a progress width, a chart series index).
- Themes: `data-theme='light' | 'dark'` on `<html>`. A third choice, **System**, resolves through `prefers-color-scheme` on load. Kitchen devices default to Dark. Stored as `ember_theme`.
- Tokens to add: `--info`, `--info-bg`, `--bg-hover`, `--bg-pressed`, `--ring` (focus), `--chart-1` to `--chart-6`, `--z-*`.
- Legacy to Ember rename table: Appendix A.
- Text placed on the action colour always uses `--action-fg`, never `#fff` (in dark theme the action colour is orange and white on it is 2.80:1).

### 4.2 Colour verification (WCAG 2.x, computed)

| Pair | Ratio | Needs | Result |
| --- | --- | --- | --- |
| Light: white on action `#C2410C` | 5.18 | 4.5 | Pass |
| Light: text-muted `#57534E` on white | 7.63 | 4.5 | Pass |
| Light: text-subtle `#78716C` on white | 4.80 | 4.5 | Pass |
| Light: success `#15803D` on `#F0FDF4` | 4.79 | 4.5 | Pass |
| Light: warning `#B45309` on `#FFFBEB` | 4.84 | 4.5 | Pass |
| Light: danger `#B91C1C` on `#FEF2F2` | 5.91 | 4.5 | Pass |
| Light: focus ring `#1D4ED8` on white | 6.70 | 3.0 | Pass |
| Dark: text `#FAFAF9` on `#1C1917` | 16.74 | 4.5 | Pass |
| Dark: text-subtle `#A8A29E` on `#1C1917` | 6.93 | 4.5 | Pass |
| Dark: `#1C1917` on action `#F97316` | 6.24 | 4.5 | Pass |
| Dark: border-strong `#78716C` on `#1C1917` | 3.65 | 3.0 | Pass |
| Dark: danger `#F87171` on `#1C1917` | 6.32 | 4.5 | Pass |
| **Today:** white on `#F97316` (`.btn-primary`, white text on `--action` in dark) | **2.80** | 4.5 | **Fail** |

The `tokens.css` values are sound. The problem is wiring, not palette. The ten status tones (blue, indigo, amber, teal, purple, orange, green, stone, red, rose) are kept; spot checks of amber, teal, blue and purple on their badge backgrounds are 5.25 to 6.51.

### 4.3 Typography

Inter (400, 500, 600, 700, 800, already loaded with `display=swap`), system fallback.

| Role | Size / weight | Use |
| --- | --- | --- |
| Stat value | 28 / 800 | KPI numbers |
| Page title (h1) | 24 / 800 | One per page |
| Section title (h2) | 18 / 700 | Cards, drawer sections |
| Body | 14 / 500 | Default text, table cells |
| Label | 12 / 600 | Column headers, form labels, badges |
| Caption | 12 / 500 | Timestamps, helper text |

Rules: minimum 12 px. Money, order numbers and timers use `font-variant-numeric: tabular-nums`. **All form inputs are 16 px on phones** (14 px inputs make iOS Safari zoom the page on focus; the current search boxes are 14 px).

### 4.4 Space, shape, motion

- **Space:** 4 px grid, tokens `--space-1` to `--space-8` exist; add `--space-10` (40) and `--space-12` (48).
- **Radius:** keep `--r-xs` to `--r-xl` and `--r-pill`. Cards `--r-md`, buttons `--r-sm`, sheets `--r-xl` on top corners.
- **Elevation:** keep `--shadow-1` to `--shadow-3`. On dark, cards use a 1 px border instead of a shadow (already in the tokens).
- **Motion:** durations `--dur-press` 100 ms, `--dur-fast` 160, `--dur-base` 240, `--dur-slow` 400. Add the missing keyframes: `fadeIn`, `sheetUp`, `ticketIn` (8 px rise plus a 2 s highlight ring). Under `prefers-reduced-motion: reduce` all durations become 0.01 ms and the live dot stops pulsing. Nothing loops except that dot.

### 4.5 Breakpoints and layout modes

| Mode | Width | Shell | Live board | Lists | Overlays |
| --- | --- | --- | --- | --- | --- |
| Phone | under 768 | App bar plus bottom tabs | One column, tabs with counts, swipe | Cards | Full-height bottom sheet |
| Tablet | 768 to 1023 | 72 px icon rail | Two columns, swipe for the rest | Reduced-column table or cards | Right drawer, 440 px |
| Desktop | 1024 to 1439 | 240 px sidebar, collapsible | Four columns | Full tables | Right drawer, 480 px |
| Wide | 1440 and up | Same, content max 1440 px centred | Four wider columns | Full tables | Right drawer, 480 px |

Global rules: content reflows to 320 px with no horizontal page scroll (WCAG 1.4.10). Use `100dvh`, never `100vh`. Use `env(safe-area-inset-*)` on bars and sheets. Set `viewport-fit=cover`. Tables may scroll sideways inside their own container only on tablet.

### 4.6 Layering

| Layer | z-index |
| --- | --- |
| Base | 0 |
| Sticky headers | 10 |
| Nav (rail, bottom tabs) | 20 |
| Dropdowns, menus | 30 |
| Scrim | 40 |
| Drawer, bottom sheet | 41 |
| Dialog | 50 |
| Toast | 60 |

### 4.7 Icons

The 33 SVG icons in `Icon.tsx` stay. Add: `x`, `more`, `alert`, `refresh`, `filter`, `arrow-up-right`, `wifi-off`, `download`, `settings`, `camera`, `chevron-down`, `grip`. Replace the literal ✕ in the drawer and the 🍔 on Login. Icons are decorative (`aria-hidden`) next to text and carry an `aria-label` when alone. Food emoji stay only as menu data.

## 5. App shell

### 5.1 Desktop (1024 and up)

```
┌──────────────┬──────────────────────────────────────────────────────────────┐
│ ◆ FastFood   │ Live board            🔍 Search (/)   ● LIVE  🔔  🔊  (A) ▾   │
│   Admin      ├──────────────────────────────────────────────────────────────┤
│ ⌂ Live board │ Today Rs. 48,200 ▲12%  │ Active 6 (2 need action) │ Riders 4/7 │
│ ▤ Orders  ②  │ ┌ New (2) ────┬ Kitchen (3) ┬ Ready (1) ───┬ On the way (2) ┐│
│ ☰ Menu       │ │ #1042   2m  │ #1039  11m ●│ #1037 Finding│ #1035 Bilal    ││
│ ⛟ Riders     │ │ [ Accept ]  │ [Mark ready]│ rider 3m     │ Picked up      ││
│ ☺ Customers  │ └─────────────┴─────────────┴──────────────┴────────────────┘│
│ ▦ Analytics  │                                                              │
└──────────────┴──────────────────────────────────────────────────────────────┘
```

### 5.2 Phone (under 768)

```
┌───────────────────────────┐
│ FastFood    ● LIVE   🔔 ⋯ │  56 px app bar
├───────────────────────────┤
│ New 2 │ Kitchen 3 │ Ready 1 │ Way 2   tabs, swipeable
│ ┌───────────────────────┐ │
│ │ #1042           ⏱ 2m │ │
│ │ Hira · 3 items        │ │
│ │ Rs. 1,350 · COD       │ │
│ │ [    Accept order   ] │ │  48 px button
│ └───────────────────────┘ │
├───────────────────────────┤
│ Live  Orders  Menu  Riders  More │  56 px + safe area
└───────────────────────────┘
```

### 5.3 Shell rules

- **Navigation items are real links** (`NavLink`) with `aria-current='page'`. A skip link ('Skip to content') and the landmarks `header`, `nav`, `main` are present.
- **The Orders badge counts PLACED orders only** (orders that need action). Today it counts every active order, which is a different number from the Dashboard's.
- **Top bar (desktop, tablet):** page title (h1); global search, focus with `/`; connection pill with text (LIVE, RECONNECTING, OFFLINE); sound toggle that shows 'Tap to enable sound' until the browser has unlocked audio; bell listing the last 10 new orders; avatar menu with name, role, theme (Light, Dark, System) and Sign out.
- **Phone app bar:** logo, connection dot plus label, bell, overflow. **Bottom tabs:** Live, Orders (badge), Menu, Riders, More. More holds Customers, Analytics, Settings, theme, Sign out.
- **Offline banner** under the bar: 'Offline. Showing data from 14:32. Reconnecting…' (amber, `role='status'`).
- **Document title and favicon** show the count of orders needing action: `(2) FastFood Admin`.
- **Sign out** disconnects the socket, clears tokens and calls `queryClient.clear()` so cached customer data does not stay in memory.

## 6. Page specifications

Every page has: a header (one h1, a one-line subtitle, page actions), a data-freshness stamp ('Updated 12 s ago'), all five states from §8, tokens only, and no layout in inline styles.

### 6.1 Login (`/login`)

- **Layout:** centred card, max 400 px, on `--bg-page`. The flame logo (SVG) replaces the 🍔, with 'FastFood' and an 'Admin' chip.
- **Fields:** Phone or email (`autocomplete='username'`, `autocapitalize='none'`); Password with a Show/Hide button (`aria-pressed`); **Sign in**, full width, `--action-bg` on `--action-fg`.
- **Errors** appear inline above the button with `role='alert'`: 'Wrong phone, email or password.' / 'This account cannot sign in here. Admin or staff only.' / 'Too many attempts. Try again in 5 minutes.' A toast may repeat them but is never the only channel.
- **Keep:** no default credentials printed on screen **\[Verified\]** (the current code does not print them). Use a neutral placeholder, not a real number.
- **Loading:** the button reads 'Signing in…' and is disabled.
- **Accept:** Enter submits; usable at 320 px; axe 0 violations; a password manager fills both fields.

### 6.2 Live board (`/`)

**Purpose:** run the kitchen. A KPI strip on top, the board below.

**KPI strip (4 StatCards):** Revenue today (delivered orders) with an arrow and percentage against the same time yesterday; **Needs action** (PLACED count, red when above 0); Orders today; Riders online (n of total). Data comes from `GET /admin/stats` **\[New\]**, not from a 100-order slice.

| Column | Statuses | Primary action | Overflow |
| --- | --- | --- | --- |
| New | PLACED | Accept order | Reject… |
| Kitchen | ACCEPTED, PREPARING | Start preparing, then Mark ready | Cancel… (admin only) |
| Ready | READY | None while finding a rider. 'Re-send to riders' after the no-accept threshold **\[Verify API\]** | None (the state machine allows no cancel here) |
| On the way | RIDER\_ASSIGNED, PICKED\_UP | View | None |

**Ticket anatomy:** order number (tabular), age timer (icon plus text: neutral under 10 min, amber from 10, red from 20; thresholds configurable, §6.9), customer first name, summary (first two items then '+2 more'), total and payment ('Rs. 1,350 · COD'), status badge, one primary button (44 px; 48 px on phone). The whole ticket opens the order sheet; buttons do not.

**Behaviour:**

- Oldest first within a column. The column header shows the count and a red dot if any ticket is red.
- Actions are optimistic. The ticket moves at once; on a 409 or network error it springs back and a toast names the reason.
- A new ticket enters with `ticketIn`, the chime and a 2 s ring.
- READY tickets read 'Finding rider · 3m' and turn red with 'No rider yet' at 5 min. The server already queues a 60-second no-accept job **\[Verified\]**; the event that tells the admin is **\[Verify, §10\]**.
- **Do not offer a raw 'Dispatch' button** that PATCHes READY to RIDER\_ASSIGNED until the server's behaviour for an admin call without a rider is confirmed **\[Verify\]**. Riders claim orders first-come.
- Empty column: 'Nothing here. New orders appear as they arrive.'

**Phone:** a tab bar of the four columns with counts, swipe between them, full-width tickets. **Tablet:** two columns.

**Accept:** oldest first; colour thresholds correct at 9, 10, 19 and 20 minutes; accept in two taps or fewer; a failing action reverts and explains; the board updates from the socket within 2 s; Tab reaches each ticket and its button; a screen reader announces 'Order 1042, 2 minutes, new, Rs. 1,350'.

### 6.3 Orders (`/orders`)

**Purpose:** find and audit any order.

- **Toolbar:** search (order number, customer, phone; **server-side**, debounced 300 ms); status chips: All plus **all ten statuses, Delivery failed included**, with counts from the server; date range (Today default, 7 days, 30 days, custom); view switch Board / Table (Board is the default on tablet and for staff).
- **Table columns:** Order #, Customer, Items, Total, Payment, Status, Placed (relative, absolute time in the title), Rider, Actions. Sortable by placed time and total; sticky header; row click opens the sheet.
- **Paging:** cursor-based, 50 per page, 'Load more', 'Showing 50 of 312'. Never a silent cap (F7).
- **Phone:** card list (number, badge, customer, total, age) and a Filter button that opens a sheet for status and date.
- **Query key:** `['orders', { status, q, from, to }]`.
- **Accept:** search and filters hit the server; counts stay correct beyond 100 orders; the Delivery failed filter exists; row actions match the board.

### 6.4 Order detail (drawer from 768 px, bottom sheet below)

Top to bottom:

1. **Header:** order number, status badge, placed time, close.
2. **Sticky action bar:** primary action and overflow.
3. **Customer:** name, tap-to-call link.
4. **Items:** name, size, add-ons, quantity, line total from `lineTotalPaisa`.
5. **Totals:** subtotal, delivery fee, total, **read from the order**. Today the drawer recomputes the fee with a hard-coded Rs. 1,000 threshold; remove that.
6. **Delivery:** address, landmark, 'Open in Maps' link.
7. **Payment:** Cash on delivery, collected yes or no.
8. **Rider:** name, phone, state; 'Finding rider · 3m' while READY.
9. **Timeline** from `statusHistory`: status, who, when, note. Actor names need the API to populate `by` **\[Verify\]**.
10. **Reason** when cancelled or rejected.

**Cancel or reject dialog:** reason chips (Out of stock, Kitchen too busy, Customer request, Other plus a text field). The reason is not pre-filled (today 'Kitchen too busy' is). The danger button names the action: 'Reject order #1042'.

**Behaviour:** focus moves into the drawer, is trapped, Esc closes, focus returns to the ticket. The phone sheet closes on swipe down and on the Back gesture.

### 6.5 Menu manager (`/menu`)

Segmented control: Items / Categories.

**Items.** Toolbar: search, category chips, **Add item**. Columns: thumbnail or emoji tile, name plus one-line description, category, price (Rs.), **Available switch with the words 'Available' or 'Sold out'**, Edit, ⋯ (Delete). Phone: cards with a large switch, so 'sold out' is one tap. Bulk: select rows, then Mark sold out or Mark available. The switch is optimistic with an Undo toast.

**Add or edit form** (drawer; full-screen sheet on phone): Name (required), Description, Category, Base price in Rs. (converted with `toP()`), Sizes repeater, Add-ons repeater (label plus price) **\[Verify API field names\]**, Emoji picker, Image upload (preview, camera capture with `accept='image/*' capture='environment'`, size limit, progress, error), Available. Inline validation with zod; errors tied to fields with `aria-describedby`; focus moves to the first error on submit. The image field name must match the API: the admin writes `imageUrl`, the earlier design document says the API field is `image` **\[Verify\]**.

**Delete:** a themed ConfirmDialog: 'Delete Zinger Burger? Past orders keep their name and price.' It replaces `confirm()` (F10). A failed delete shows a toast (the mutation has no `onError` today).

**Categories:** reorderable cards with a grip handle plus Move up and Move down buttons (keyboard and touch), emoji icon, active toggle, writes `sortOrder`.

**Accept:** marking sold out takes one tap on a phone; no native dialogs; the form is usable at 320 px.

### 6.6 Riders (`/riders`)

StatCards: Online now, Total riders, Cash to settle. List: avatar, name, phone (tap to call), status (● Online or ○ Offline, text always), deliveries today and total, cash in hand (amber text plus an icon above zero), actions **Settle cash…** and **Suspend… / Restore**. Settle opens a dialog with the amount, the last settlement date and a confirm button. Suspend asks for a reason. A rider drawer shows delivery history and the cash ledger. Phone: cards, actions in a ⋯ menu; the three stat cards become a horizontal strip (today the row does not wrap).

A failed fetch shows the error state with Retry, never an empty table (F9). Earlier audit notes say the cash ledger may not increment on delivery and the `/users` routes may be unexposed **\[Verify\]**.

**Accept:** the Online count equals the rows marked Online; settling needs explicit confirmation and records an entry.

### 6.7 Customers (`/customers`)

Search (name, phone, email; server-side). List: avatar initial, name, phone, email, saved address, joined date (`en-PK`), status (Active or Suspended, each with its own tone), **Suspend… / Restore** with a reason dialog. Drawer: order history (needs `GET /orders?customerId=`) **\[New\]**. Phone: cards.

**Accept:** suspend is reversible and logged; empty and error states are distinct.

### 6.8 Analytics (`/analytics`, lazy-loaded)

Range control 7 / 30 / 90 days (default 30). KPI cards: Revenue, Orders, Average order value, Cancellation rate, each with the change against the previous period. Charts: revenue area; status donut; **busiest hours** (bar, renamed from 'heatmap'); top selling items (quantity and revenue from `lineTotalPaisa`).

Every chart has a title, a one-sentence text summary ('Busiest hour: 8 to 9 pm, 41 orders'), a **View as table** toggle, series colours from `--chart-*` tokens, tooltips reachable by keyboard (Recharts `accessibilityLayer`), and no meaning carried by colour alone. All data comes from one server aggregate, with an 'Updated 2 min ago' stamp and a Refresh button. Phone: one column, KPIs in a 2×2 grid, 200 px charts, 90-day data shown as weekly points.

**Accept:** every figure equals a direct database count for the same range; the browser aggregates no orders.

### 6.9 Store controls (new, optional) **\[New, needs API\]**

A Settings page and an **Accepting orders** switch in the top bar: pause and resume ordering with a reason customers see; delivery fee and free-delivery threshold; order-age thresholds (default amber 10, red 20 minutes); new-order alert repeat interval. Stored through `/app-config` **\[Verify\]**.

## 7. Component library

All components live in `src/components/ui/`, are styled by class and tokens, and implement default, hover, pressed, focus-visible, disabled and (where relevant) loading states.

| Component | Purpose | Key props | Notes |
| --- | --- | --- | --- |
| Button | Actions | variant (primary, secondary, ghost, danger), size (md 40, lg 48), loading, icon | Primary is `--action-bg` on `--action-fg`. 44 px hit area on touch. |
| IconButton | Icon-only action | label (required) | `aria-label` is mandatory |
| SegmentedControl | Board / Table, Items / Categories, date ranges | options, value | Radiogroup semantics |
| FilterChip | Status filters | selected, count | 44 px on touch |
| Switch | Available, Sound, Accepting orders | checked, label | Visible text label, `role='switch'` |
| StatusBadge | Order status | status, size | Exists; keep (icon, text, tone) |
| StatCard | KPI | label, value, delta, tone | Delta shows arrow, sign and text |
| OrderTicket | Board card | order, onAction | Age timer, one primary action |
| DataTable | Desktop lists | columns, rows, sort | Sticky header; sortable headers are buttons with `aria-sort` |
| ResponsiveList | Table on desktop, cards on phone | renderRow, renderCard | One data source, two renderings |
| Drawer, BottomSheet | Detail views | open, onClose | Focus trap, Esc, swipe down on sheet |
| Dialog, ConfirmDialog | Destructive confirms | title, body, reasons | The danger button names the action |
| Toast | Feedback | tone, action | Max 3 visible, repeats merge, `role='status'` |
| EmptyState | No data | icon, text, action | Never used for a failed request |
| ErrorState | Failed load | message, onRetry | Retry button, details toggle |
| Skeleton | Loading | shape | Matches the final layout |
| LiveIndicator | Connection | state | Text always shown |
| Banner | Offline, paused | tone | `role='status'` |
| ChartCard | Charts | title, summary, table | View as table; `--chart-*` colours |
| Field, Input, Select, Textarea | Forms | label, error, hint | Label always visible; 16 px on phone |
| Avatar | People | name | Initial on `--chip-bg` |
| PageHeader | Page top | title, subtitle, actions | Exactly one h1 |

## 8. States and real time

### 8.1 State matrix (every data view ships all five)

| State | What shows | Rule |
| --- | --- | --- |
| Loading | Skeleton in the final layout | No spinner flash under 300 ms |
| Empty | Icon, one sentence, one action | Only when the request succeeded and returned nothing |
| Error | Plain-words message, Retry, optional details | Never rendered as empty |
| Offline | Banner plus last-updated time; data stays visible; actions disabled with a stated reason | Socket down or browser offline |
| Stale | 'Updated 3 min ago', amber after 60 s without a successful update | Applies to all live views |

### 8.2 Data layer rules

1. One query key per distinct request, filters included: `['orders', { status, q, from, to }]`, `['stats', range]`, `['riders']`, `['customers', q]`, `['menu']`. No two screens share a key unless they share a request (fixes F6).
2. The socket is the primary live channel. `order:new` and `order:status_update` patch the cache with `setQueryData` and invalidate only the affected keys.
3. Polling is a fallback: 10 s only while the socket is disconnected, otherwise a 60 s safety refetch.
4. On reconnect, refetch active queries once.
5. Status moves and availability toggles are optimistic, with rollback and a toast on failure.
6. Statistics come from the server; the browser never aggregates orders (F7, F8).

### 8.3 New-order alerting

1. Chime and toast on arrival; the ticket enters with `ticketIn`.
2. Browsers block autoplay audio, so the first tap anywhere unlocks it. Until then the sound button reads 'Tap to enable sound'.
3. If a PLACED order stays unopened for 60 s, the chime repeats every 30 s until someone opens or accepts it (interval configurable, §6.9).
4. Title and favicon show the count of orders needing action.
5. A polite live region announces 'New order 1042, Rs. 1,350'.
6. At most 3 toasts are visible; extra arrivals merge into 'N new orders'.
7. When the server's no-accept job fires (60 s after READY) the ticket turns red, 'No rider yet' **\[Verify the socket event, §10\]**.
8. Optional: Web Push for background tabs, reusing the Firebase setup already in the API **\[Verified: `firebase-admin` is an API dependency\]**.
9. Kitchen tablets request a Screen Wake Lock so the screen does not sleep.

## 9. Accessibility (WCAG 2.2 AA)

| Criterion | Requirement | Proven by |
| --- | --- | --- |
| 1.4.3, 1.4.11 Contrast | Text 4.5:1, large text and UI components 3:1, both themes, including chart series and badge tones | G2, axe |
| 1.4.10 Reflow | 320 px with no horizontal page scroll | G5 |
| 1.4.4 Resize | Usable at 200% zoom | G3 at zoom, manual check |
| 1.4.1 Colour only | Badges, age timers and charts always carry an icon, text or label as well as colour | Review checklist |
| 2.1.1 Keyboard | Every function works without a mouse: board, drawer, dialogs, charts, menus | G4 |
| 2.4.1, 2.4.3 | Skip link; logical focus order; focus returns to the opener after a drawer or dialog closes | G4 |
| 2.4.7, 2.4.11 Focus | 2 px `--ring` with offset on every control; sticky bars never hide the focused element (`scroll-padding`) | G4, G7 |
| 2.5.7 Dragging | Reordering categories has a non-drag alternative (Move up and Move down) | G4 |
| 2.5.8 Target size | 24 px AA minimum; house rule 44 px on touch | G6 |
| 3.3.1 to 3.3.3 Forms | Visible labels, errors named and tied to fields, suggestions given | G4 |
| 4.1.2 Name, role, value | Nav links with `aria-current`, switches with `role='switch'`, dialogs with `role='dialog'`, `aria-modal`, `aria-labelledby` | G3 |
| 4.1.3 Status messages | Toasts and the new-order announcement use `role='status'`; errors use `role='alert'` | G11 |
| 1.3.1 Structure | One h1 per page, landmarks `header`, `nav`, `main` | G3 |
| Motion | `prefers-reduced-motion` honoured; no looping animation except the live dot | G7 |
| Language | `lang='en'` is set **\[Verified\]**; layout must survive `dir='rtl'` for a later Urdu version | Manual |

## 10. What the design needs from the API

The admin can be fixed in the browser up to a point. Real data trust and real-time alerting need these server changes.

| # | Need | Used by | Status |
| --- | --- | --- | --- |
| 1 | `GET /orders` with `status`, `q`, `from`, `to`, `customerId` and cursor paging, returning `{ items, nextCursor, total }`, with no silent page-size clamp | §6.3, §6.7, F7 | Needs build. Today `listAll` clamps to 100 **\[Verified\]** |
| 2 | `GET /admin/stats?range=7d\|30d\|90d&compare=1` aggregates | §6.2, §6.8 | The admin already calls `/orders/analytics?days=30` **\[Verify route and response shape\]** |
| 3 | Socket event to the admin room when nobody accepts a READY order | §6.2, §8.3 | The 60 s job exists **\[Verified\]**; the emit **\[Verify\]** |
| 4 | `statusHistory[].by` populated with a name, not an id | §6.4 | **\[Verify\]** |
| 5 | `PATCH /orders/:id/status` with `note` | All | **\[Verified\]** |
| 6 | `GET /users?role=` and `PATCH /users/:id` (suspend, with reason) | §6.6, §6.7 | Called by the admin; controller exposure **\[Verify\]** |
| 7 | `POST /riders/:id/settle` with an amount, and cash ledger incremented on delivery | §6.6 | **\[Verify\]** (an earlier audit says the ledger stays at 0) |
| 8 | `/app-config` read and write: delivery fee, thresholds, accepting orders | §6.9 | **\[Verify\]** |
| 9 | Admin push-token registration | §8.3 | `firebase-admin` present **\[Verified\]**; endpoint **\[New\]** |
| 10 | 'Re-send to riders' action for a READY order | §6.2 | **\[New\]** |
| 11 | Order carries `subtotalPaisa`, `deliveryFeePaisa`, `totalPaisa` | §6.4 | **\[Verify\]** |

## 11. Roadmap

Effort figures are rough single-developer estimates, not commitments.

### Phase 0: make what exists true (about 1 day)

- Delete the colour block in `globals.css`'s `:root`; keep `--sidebar-w` and `--header-h`.
- Apply the Appendix A renames across `src` in one pass.
- Style `Toaster` from tokens. Replace `#fff` on action backgrounds with `--action-fg`.
- Define `fadeIn`; change `100vh` to `100dvh`; add `viewport-fit=cover`.
- Give every query its own key (§8.2). Until API item 1 exists, stop asking for more than 100 orders and label the UI 'Latest 100 orders' so it does not overstate.
- Use `serverAnalytics` or delete the call.
- Replace `confirm()` with a ConfirmDialog; add `onError` to the delete mutation.
- Add `scripts/check-tokens.mjs` to CI (§12).

**Done when:** G1 passes and light theme renders with no unreadable text.

### Phase 1: foundation and shell (3 to 4 days)

Move inline layout into CSS classes (`.page`, `.stack`, `.cluster`, `.card`, `.table`). Add the breakpoints (§4.5), the `NavLink` shell with rail and bottom tabs, the top bar, skip link, System theme, connection banner, and the Skeleton, EmptyState and ErrorState components.

**Done when:** the shell passes G3 and G5 at 320, 768 and 1280 px in both themes.

### Phase 2: operations (about 1 week)

OrderTicket and the board (phone tabs), the order drawer and sheet with timeline, reason dialogs, optimistic updates, socket cache patching, alerting (§8.3). API items 1, 3, 4.

**Done when:** accepting an order takes two taps or fewer, alert latency is 2 s or less, and G4 and G11 pass.

### Phase 3: lists and menu (3 to 4 days)

ResponsiveList for Orders, Riders and Customers; the Menu manager with the availability switch and form sheet; stat strips; settle and suspend dialogs. API items 6, 7.

### Phase 4: analytics (2 to 3 days)

Server aggregates (API item 2), ChartCard with summary and table, series tokens, lazy-loaded route.

### Phase 5: gates and polish (2 to 3 days)

The full Playwright and axe matrix, visual snapshots, Lighthouse, bundle budget. Store controls (§6.9) if wanted.

## 12. Quality gates: how a 10 is proven

| Gate | Check | Pass |
| --- | --- | --- |
| G1 Token integrity | `scripts/check-tokens.mjs` (below) | 0 undefined tokens, 0 redefined outside `tokens.css`, 0 raw hex outside `tokens.css` |
| G2 Contrast | Every pair in §4.2 plus chart series and badge tones, both themes | All at or above their required ratio |
| G3 axe | Playwright with axe-core on every route at 375, 768, 1280 px in light and dark | 0 violations |
| G4 Keyboard | End-to-end: sign in, accept an order, open the drawer, reject with a reason, toggle sold out, reorder a category, with no mouse | Passes |
| G5 Reflow | At 320 px, `scrollWidth <= innerWidth` on every route | Passes |
| G6 Touch targets | Bounding boxes of buttons, switches and chips at 375 px | All at least 44 × 44 |
| G7 Visual snapshots | Board, Orders, drawer, Menu, Riders, Analytics at 3 widths × 2 themes | No unexpected diffs |
| G8 Lighthouse | Mobile profile, each route | Accessibility ≥ 95, Best Practices ≥ 95, Performance ≥ 85 (targets) |
| G9 Bundle | Initial JavaScript, gzip | ≤ 200 KB; Recharts only in the analytics chunk |
| G10 Data truth | API test against a seeded database | Stats equal a direct count; Orders count is correct beyond 100 orders |
| G11 Real time | End-to-end with a fake socket | New order visible in 2 s; offline banner appears and clears |
| G12 No inline layout | Lint ban on `style={{` for layout properties (display, flex, grid, padding, margin, width, height, position) | 0 hits |

```js
// scripts/check-tokens.mjs (run from apps/admin)
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const p = join(dir, name);
  return statSync(p).isDirectory() ? walk(p) : [p];
});
const files = walk('src').filter((f) => ['.ts', '.tsx', '.css'].includes(extname(f)));
const names = (src) => [...src.matchAll(/(--[a-z0-9-]+)[ ]*:/gi)].map((m) => m[1]);

const tokenFile = files.find((f) => f.endsWith('tokens.css'));
const owned = new Set(names(readFileSync(tokenFile, 'utf8')));
const defined = new Set(owned);
let failures = 0;

for (const f of files.filter((f) => f.endsWith('.css') && f !== tokenFile)) {
  for (const n of names(readFileSync(f, 'utf8'))) {
    defined.add(n);
    if (owned.has(n)) { console.error(`${f}: redefines ${n} (owned by tokens.css)`); failures++; }
  }
}
for (const f of files) {
  const src = readFileSync(f, 'utf8');
  for (const m of src.matchAll(/var[(](--[a-z0-9-]+)/gi)) {
    if (!defined.has(m[1])) { console.error(`${f}: undefined token ${m[1]}`); failures++; }
  }
  if (f !== tokenFile && /#[0-9a-fA-F]{6}/.test(src)) {
    console.error(`${f}: raw hex colour, use a token`); failures++;
  }
}
process.exit(failures ? 1 : 0);
```

Run against the uploaded code, this script reports 75 failures: 65 uses of undefined tokens (`MenuPage.tsx` 42, `App.tsx` 12, `Sidebar.tsx` 10, `OrderDrawer.tsx` 1), 6 colours redefined in `globals.css`, and raw hex in `globals.css`, `AnalyticsPage.tsx`, `main.tsx` and `OrderDrawer.tsx`. That is the point: it turns the biggest finding into a permanent guard.

## 13. Scorecard

| Dimension | Now | After | Proven by |
| --- | --- | --- | --- |
| 1 Workflow and IA | 8 | 10 | G4, board and drawer acceptance in §6 |
| 2 Visual system and theming | 4 | 10 | G1, G2, G7 |
| 3 Real-time operations | 7 | 10 | G11, needs API items 3, 4 |
| 4 Data trust | 3 | 10 | G10, needs API items 1, 2 |
| 5 States and feedback | 4 | 10 | §8.1 matrix, G4 |
| 6 Accessibility | 4 | 10 | G3, G4, G6, G8 |
| 7 Responsive and mobile | 2 | 10 | G3, G5, G6, G7 |
| 8 Performance and maintainability | 4 | 10 | G9, G12 |
| **Overall** | **4.5** | **10** | All gates green |

**The 'After' column is projected, not earned.** A dimension scores 10 only when its gates pass on the built app. Two caps are outside the browser: data trust cannot pass G10 until API items 1 and 2 exist, and real-time cannot pass G11's no-rider alert until item 3 exists. Without those, expect about 6 for dimension 4 and about 8 for dimension 3.

## 14. Decisions needed from the owner

| # | Decision | Recommendation |
| --- | --- | --- |
| 1 | Default theme | Dark for kitchen devices, System available |
| 2 | Staff versus admin gating (§3.3): price edit, delete, settle, suspend, analytics | Admin only for those; staff keep the sold-out toggle |
| 3 | Repeating new-order chime until accepted | On by default with a visible switch |
| 4 | Store controls (§6.9) in the first release | Later; only the top-bar 'Accepting orders' switch is high value |
| 5 | Phone scope | Full function for board, menu and riders; Analytics read-only |
| 6 | Build the missing API items (§10) alongside Phase 2 | Yes; two dimensions cannot reach 10 without them |

## Appendix A: legacy token to Ember token

| Used in code today | Replace with | Note |
| --- | --- | --- |
| `--bg` | `--bg-page` |  |
| `--surface` | `--bg-surface` |  |
| `--surface2` | `--bg-raised` for hover and ghost buttons; `--bg-sunken` for input backgrounds |  |
| `--muted` | `--text-muted` |  |
| `--subtle` | `--text-subtle` |  |
| `--sunken` | `--bg-sunken` |  |
| `--raised` | `--bg-raised` |  |
| `--strong` | `--border-strong` |  |
| `--action` | `--action-bg` for fills | Text on it is `--action-fg`, not `#fff`. For accent text or icons on neutral surfaces use `--link` |
| `--primary`, `--primary-dark` | `--action-bg`, `--action-bg-hover` |  |
| `--ok`, `--ok-bg` | `--success`, `--success-bg` |  |
| `--bad`, `--bad-bg` | `--danger`, `--danger-bg` |  |
| `--radius` | `--r-md` |  |
| `--info` | Keep; move into `tokens.css` with a dark variant |  |
| `--tone-teal-fg` | `--b-fg` inside an element with `data-tone='teal'` |  |

## Appendix B: what was not verified

- **How the app looks when rendered.** Nothing was run; visual claims are deduced from code and tagged.
- **API controllers** other than the order service and state machine: users, riders, uploads, app-config.
- **Whether `/orders/analytics` is routed** and what it returns.
- **What an admin `READY` to `RIDER_ASSIGNED` PATCH does** when no rider is supplied.
- **Contrast of the chart series and the dark badge tones.** Add them to G2.
- **The customer and rider apps.** Out of scope here.