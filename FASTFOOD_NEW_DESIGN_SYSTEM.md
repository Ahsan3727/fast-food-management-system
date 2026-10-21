# FastFood — New Design System & Redesign Specification

**Design language name:** *Ember*
**Version:** 1.0 (proposal) · **Written:** 21 October 2026
**Repository:** `Ahsan3727/fast-food-management-system` · **Analysed commit:** `51785e2` (Graphify index built 2026-10-20, 1,167 nodes / 1,780 edges)
**Replaces / merges:** `DESIGN_OVERVIEW.md` + `FASTFOOD_DESIGN_SYSTEM_AND_DEV_GUIDE.md`
**Audience:** the owner, designers, and any developer (or AI coding agent) who builds the UI

---

## 0. How to read this document

| Marker | Meaning |
|---|---|
| ✅ | **Verified.** Read directly in source code at commit `51785e2` (through Graphify or the two uploaded documents). |
| 🟡 | **Inferred.** Strongly implied by the code, but the defining file could not be read. |
| ❓ | **Unverifiable from the code graph.** Lives in CSS or config that Graphify does not index. Open the file named in Appendix B. |
| 🆕 | **New design.** A proposal, not the current state. Safe to change after discussion with the owner. |
| 🧮 | **Computed.** A contrast ratio calculated with the WCAG 2.x relative-luminance formula (script in Appendix C). |

**Two limits of the evidence** (they apply to everything below):

1. Graphify indexes TypeScript and TSX. It does **not** index `.css`, `index.html` or `capacitor.config.*`. So the *current* token values (`--bg`, `--surface`, font on customer/rider, status-badge colours) are ❓. The new design does not depend on them: it **defines every token from scratch** (§6) and replaces the old CSS rather than patching it.
2. The indexer cuts multi-line constants (`STATUS_STEPS`, `BottomNav` items, admin `NAV`) down to their first line. The rest of those lists stays ❓. The new design defines them explicitly (§7, §8–§11).

---

## 1. Executive summary

FastFood is a single-restaurant, cash-on-delivery ordering system with **three front-ends on one NestJS API**: a customer app (12 screens), a rider app (5 screens) and an admin panel (7 pages). The customer and rider apps are React + Vite wrapped by Capacitor for Android; the admin is a desktop web app.

**What is good today:** a clear orange brand, friendly copy, a sensible customer flow, solid real-time plumbing (Socket.IO + polling), and an order state machine that is already enforced on the server.

**What holds it back:**

- Three separate stylesheets with no shared tokens or components (design maturity ≈ 3–4 / 10 in the earlier review).
- **Emoji are the entire icon system**, so icons cannot follow colour, size or accessibility rules.
- White text on the brand orange `#f97316` fails contrast (**2.80 : 1** 🧮; AA needs 4.5 : 1).
- Native `confirm()` / `prompt()` dialogs for destructive actions.
- No error, offline or "live data" states anywhere.
- Several UI/data bugs that make screens lie to the user (§3.2).

**What the new design does:**

| Area | Before | After (Ember) |
|---|---|---|
| Tokens | 3 stylesheets, hex literals in TSX | One `@fastfood/tokens` package, light + dark sets, every colour AA-checked |
| Primary action colour | `#f97316` + white text (2.80 : 1) | **Ember `#C2410C`** + white text (5.18 : 1); `#F97316` stays as the bright brand accent |
| Icons | Emoji for everything | **SVG icon set** for UI chrome; emoji only for *food data* (menu item / category emoji from the API) |
| Components | File-local functions, two class contracts | One `@fastfood/ui` library, 41 documented components |
| Status colours | Two badge systems, copy-pasted maps | **One status map** driven by the shared enum (§7) |
| Dialogs | `confirm()` / `prompt()` | Themed dialog and bottom sheet with a reason field |
| Checkout location | Raw lat/long fields pre-filled with the restaurant | GPS + draggable map pin + saved addresses |
| Admin orders | Table only | **Live order board** (kanban) + table + order drawer |
| Rider app | Dashboard hub, no tab bar | 3-tab app, request sheet with countdown ring, safe delivery flow |
| States | Loading only | Loading · empty · error · offline · live, for every data view |
| Accessibility | ≈ 3 / 10 | WCAG 2.2 AA target, checklist in §14 |

---

## 2. What the analysis found

### 2.1 The two uploaded documents agree on almost everything

Both describe the same repo at the same commit. Where they differed, this table records how it was settled.

| Topic | Document A (Overview) | Document B (Design System & Dev Guide) | Settled as |
|---|---|---|---|
| Admin order filters | "omit `DELIVERY_FAILED`" | same | ✅ confirmed in `OrdersPage.tsx` (`STATUSES` has 9 statuses + ALL, no `DELIVERY_FAILED`) |
| Admin action map (`TRANSITIONS`) | ❓ | ❓ | ✅ now read (§2.2, N4) |
| Order-item revenue field | "probably wrong, verify" (D19) | ❓ | ✅ **confirmed bug** (§2.2, N1) |
| Chart palette `COLORS[]` | ❓ | lists 6 colours | 🟡 taken from B (not re-read) |
| Password minimum | not mentioned | login 6 vs signup 8 | 🟡 taken from B |
| Rider navigation | "no tab bar found" | "dashboard hub + back arrow" | ✅ same fact; new design adds a tab bar |
| Admin responsive behaviour | ❓ | ❓ | ❓ still unknown (CSS) |

### 2.2 New facts confirmed with Graphify

| ID | Finding | Evidence | Status |
|---|---|---|---|
| **N1** | Admin Analytics sums `it.totalPaisa ?? 0` for per-item revenue, but order items store **`lineTotalPaisa`**. "Top selling items" revenue is therefore always Rs. 0. Closes D19. | `AnalyticsPage.tsx` vs `order.schema.ts` | ✅ |
| **N2** | Home and Product detail read `item.color ?? '#fed7aa'`, but the `MenuItem` schema (API and shared Zod type) has **no `color` field**. Every food tile is the same peach. | `menu.schema.ts`, `schemas.ts` | ✅ |
| **N3** | Admin `MenuItem` type reads `imageUrl`; the API field is `image`. Uploaded photos may not show in the admin form. | `MenuPage.tsx` vs `menu.schema.ts` | 🟡 (form body not read) |
| **N4** | Admin `TRANSITIONS` offers only: PLACED → ACCEPTED / REJECTED, ACCEPTED → PREPARING, PREPARING → READY, READY → RIDER_ASSIGNED. The red "CANCELLED" branch is dead code. The server **does** let an admin cancel from ACCEPTED and PREPARING, so staff has no screen for it. | `OrdersPage.tsx`, `order.state-machine.ts` | ✅ |
| **N5** | Rider assignment is a **first-come claim**: `riderAccept` updates the order only if `status = READY` and `riderId = null`, otherwise returns 409 "Order already taken". Admin's "🏍️ Assign" button just PATCHes the status; there is no rider picker. The UI needs a "waiting for a rider" state. | `orders.service.ts` | ✅ claim logic · 🟡 what admin "Assign" does on the server |
| **N6** | Rider "Delivery failed" fires on **one tap** with the hard-coded note "Customer unavailable". No confirmation, no reason choice. | `OrderAssignedScreen.tsx` | ✅ |
| **N7** | Customer "Cancel Order" does `await api.post(…/cancel)` with **no try/catch**; a failed request shows nothing. The reason is collected with `prompt()`. | `OrderDetailScreen.tsx` | ✅ |
| **N8** | Rider map `TileLayer` has **no attribution** (customer map has it). | `OrderAssignedScreen.tsx` | ✅ |
| **N9** | `PaymentMethod` has a single value (`COD = 'cod'`). Checkout always sends `{ method: 'cod' }`. The payment UI is a one-option list today. | `enums.ts`, `CheckoutScreen.tsx` | ✅ |
| **N10** | Three admin pages share the React Query key `['orders']` with **different limits** (Dashboard 100, Orders 200, Analytics 500). Whichever loads first fills the cache, so Analytics can silently use the 100-order slice. Stats are also computed client-side from those slices. | `DashboardPage`, `OrdersPage`, `AnalyticsPage` | ✅ |
| **N11** | Rider Dashboard fetches `/riders/dashboard` but the readable half of the file never renders it. | `DashboardScreen.tsx` | ✅ fetched · ❓ rendered |
| **N12** | The "Orders by Hour" chart is commented as a *heatmap* but is a bar chart. | `AnalyticsPage.tsx` | ✅ |

### 2.3 Re-verified from the earlier documents

The earlier issue list (D1–D24) still holds. Confirmed again in code during this pass: **D2** (checkout defaults `lat: '31.5204'`, `lng: '74.3587'`, shown as number inputs), **D3** (cart adds a Rs. 100 fee under Rs. 1,000; checkout "Total (est.)" omits it), **D4** (cart row key is `menuItemId:sizeLabel`, add-ons ignored), **D7** (`confirm()`/`prompt()`), **D11** (`replace('_','-')` first underscore only), **D12** (`isOnline` starts `false`), **D13** (timer interval overwritten without clearing), **D18** (order detail shows generic 🍽️/🍔). The full register with severities is in §17.

---

## 3. Product, users and jobs

### 3.1 Who uses what

| Persona | Surface | Context | Primary job | Success looks like |
|---|---|---|---|---|
| **Customer** (Hira, 24, Lahore) | Android app | One hand, bright light, patchy data, often hungry and in a hurry | "Get my food, know when it's coming, don't get surprised by the price" | Order in under 2 minutes; never wonders where the order is |
| **Rider** (Bilal, 28) | Android app on a bike | One hand, gloves, sun glare, short glances | "Take jobs, reach the right door, collect the right cash" | Zero taps wasted; big targets; no ambiguity about cash and OTP |
| **Staff / owner** (Ahsan) | Desktop or tablet in the kitchen | Noisy, fast, many orders at once | "Never miss an order, keep the kitchen moving, know my day" | New order noticed in 1 second; every order advanced in 1 click |

### 3.2 Where the current UI misleads people (must fix, see §17)

- The customer can send a rider to the **restaurant's coordinates** without knowing (D2).
- The customer sees two different totals (D3).
- The owner sees "top item revenue" of Rs. 0 (N1).
- Staff cannot cancel an order or see failed deliveries in the filter (N4, D10).
- A rider can mark a delivery failed with one accidental tap (N6).

---

## 4. Design principles

1. **Glanceable first.** Rider and kitchen users glance, they do not read. Status, price and the next action must be readable in one second.
2. **Honest numbers.** Never show a total the server will not charge. Estimates are labelled "(est.)" and show delivery. Money is integer paisa, shown as `Rs. 1,250`.
3. **One status vocabulary.** An order status has one name, one colour, one icon and one meaning in all three apps (§7).
4. **Every state is designed.** Loading, empty, error, offline and "live" are part of every list and screen, not afterthoughts.
5. **Destructive means deliberate.** Cancel, reject, suspend, delete and "delivery failed" always go through a themed confirmation that says what happens next.
6. **Accessible by default.** AA contrast, 44 px touch targets, real labels, visible focus. Colour never carries meaning alone.
7. **Warm, not noisy.** Food is the hero. Neutrals are warm, the brand colour is used with purpose, and the interface gets out of the way of the photos.

---

## 5. Brand identity

### 5.1 Name, mark, voice

| Item | Current ✅ | New 🆕 |
|---|---|---|
| Name | FastFood | Keep **FastFood** (changing the name is a business decision, see §18) |
| Logo | 🍔 emoji (customer, admin), 🏍️ (rider) | A real vector mark: a **rounded-square app icon in Ember `#C2410C`** with a white flame-over-bowl glyph; wordmark "FastFood" in Inter 800. Three files to produce: `logo-mark.svg`, `logo-wordmark.svg`, `logo-mono.svg` |
| Sub-brands | "Admin Panel", "Rider Portal" | "FastFood **Rider**", "FastFood **Admin**" — same mark, a small label chip beside the wordmark |
| Tagline | "Fresh, fast, and delivered" | Keep it |
| Voice | Friendly, emoji-led | Friendly, short, **sentence case**, **no emoji in UI chrome** (emoji allowed only in food data and celebratory moments such as "Order delivered") |

### 5.2 Launcher icon and splash (Android, via Capacitor)

| Asset | Spec |
|---|---|
| Adaptive icon | Foreground = white glyph on transparent, 66 % safe zone; background = Ember `#C2410C` |
| Monochrome (Android 13+) | Glyph silhouette |
| Splash | Background `#FAFAF9` (light) / `#0C0A09` (dark), centred mark 96 px, no text |
| Status bar | Light theme: dark icons on `#FAFAF9`; dark theme: light icons on `#0C0A09` |

### 5.3 Imagery

- Menu photos: 4 : 3, `object-fit: cover`, lazy-loaded, delivered through Cloudinary with `c_fill,w_480,h_360,f_auto,q_auto` ✅ (uploads already go to `/uploads/image`).
- **Fallback is part of the design:** when an item has no `image`, show its `emoji` (or 🍽️) centred on a **category tint** (§6.1). This replaces the never-populated `item.color` (N2).
- Empty-state art: simple two-colour line illustrations (cart, orders, rider, map), `#FED7AA` + `#C2410C`, SVG, under 4 KB each.

---

## 6. Foundations 🆕

### 6.1 Colour

The palette is built on two standard scales (Tailwind *orange* and *stone*) so every value is easy to look up, and every text/background pair below was checked 🧮.

**Brand — Ember**

| Token | Hex | Use |
|---|---|---|
| `--ember-50` | `#FFF7ED` | Tinted backgrounds, selected rows |
| `--ember-100` | `#FFEDD5` | Soft chips, "on the way" badge background |
| `--ember-200` | `#FED7AA` | Default food tile, illustration fill |
| `--ember-400` | `#FB923C` | Brand text and icons **on dark surfaces** |
| `--flame` (`--ember-500`) | `#F97316` | The bright brand accent: fills, charts, big icons, progress. **Never carries white text.** |
| `--ember-700` | `#C2410C` | **Action colour in light theme** (buttons, links). White on it = 5.18 : 1 |
| `--ember-800` | `#9A3412` | Hover / pressed. White on it = 7.31 : 1 |
| `--ember-900` | `#7C2D12` | Pressed on dark text |

**Neutrals — Stone (warm)**

| Token | Hex | Token | Hex |
|---|---|---|---|
| `--stone-0` | `#FFFFFF` | `--stone-500` | `#78716C` |
| `--stone-50` | `#FAFAF9` | `--stone-600` | `#57534E` |
| `--stone-100` | `#F5F5F4` | `--stone-700` | `#44403C` |
| `--stone-200` | `#E7E5E4` | `--stone-800` | `#292524` |
| `--stone-300` | `#D6D3D1` | `--stone-900` | `#1C1917` |
| `--stone-400` | `#A8A29E` | `--stone-950` | `#0C0A09` |

**Semantic roles (what components actually use)**

| Role | Light theme | Dark theme |
|---|---|---|
| `--bg-page` | `#FAFAF9` | `#0C0A09` |
| `--bg-surface` (cards, inputs) | `#FFFFFF` | `#1C1917` |
| `--bg-raised` (menus, sheets, popovers) | `#FFFFFF` + shadow | `#292524` |
| `--bg-sunken` (table header, tracks) | `#F5F5F4` | `#141210` |
| `--text` | `#1C1917` | `#FAFAF9` |
| `--text-muted` | `#57534E` | `#D6D3D1` |
| `--text-subtle` | `#78716C` | `#A8A29E` |
| `--border` (dividers) | `#E7E5E4` | `#44403C` |
| `--border-strong` (inputs, outlined buttons) | `#78716C` | `#78716C` |
| `--action-bg` | `#C2410C` | `#F97316` |
| `--action-bg-hover` | `#9A3412` | `#FB923C` |
| `--action-fg` | `#FFFFFF` | `#1C1917` |
| `--link` | `#C2410C` | `#FB923C` |
| `--focus` | `#1D4ED8` | `#93C5FD` |
| `--success` / `--success-bg` | `#15803D` / `#F0FDF4` | `#4ADE80` / `rgba(34,197,94,.16)` |
| `--warning` / `--warning-bg` | `#B45309` / `#FFFBEB` | `#FBBF24` / `rgba(245,158,11,.16)` |
| `--danger` / `--danger-bg` | `#B91C1C` / `#FEF2F2` | `#F87171` / `rgba(239,68,68,.16)` |
| `--info` / `--info-bg` | `#1D4ED8` / `#EFF6FF` | `#60A5FA` / `rgba(59,130,246,.16)` |

**Contrast results** 🧮 (AA: 4.5 : 1 for text, 3 : 1 for UI boundaries and large text)

| Pair | Ratio | Result |
|---|---|---|
| **Old:** white on `#F97316` | **2.80** | ❌ fails |
| **Old:** input border `#A8A29E`-style grey on white | 2.52 | ❌ fails 3 : 1 |
| **New:** white on `--ember-700` `#C2410C` | 5.18 | ✅ |
| **New:** white on `--ember-800` `#9A3412` | 7.31 | ✅ |
| **New:** ink `#1C1917` on `--flame` `#F97316` (dark-theme button) | 6.24 | ✅ |
| `--text` on page / surface (light) | 16.74 / 17.49 | ✅ |
| `--text-muted` on surface / sunken (light) | 7.63 / 6.99 | ✅ |
| `--text-subtle` on surface (light) | 4.80 | ✅ (minimum; do not go lighter) |
| `--link` `#C2410C` on white / on `--ember-50` | 5.18 / 4.88 | ✅ |
| `--border-strong` `#78716C` on white (light) / on `#1C1917` (dark) | 4.80 / 3.65 | ✅ (3 : 1 for UI) |
| White on `--success` `#15803D` / on `--danger` `#B91C1C` | 5.02 / 6.47 | ✅ |
| `--text-muted` `#D6D3D1` on surface (dark) | 11.74 | ✅ |
| Ink `#1C1917` on `--danger-solid` `#F87171` (dark danger button) | 6.32 | ✅ |
| `--text-subtle` `#A8A29E` on surface / raised (dark) | 6.93 / 6.01 | ✅ |
| `#FB923C` text on surface / raised (dark) | 7.73 / 6.70 | ✅ |
| Focus ring `#1D4ED8` on white / `#93C5FD` on dark surface | 6.70 / 9.70 | ✅ |

> **Rule:** `#F97316` is a *fill* colour. If text sits on it, the text is dark ink (`--action-fg` in dark theme). If white text is needed on an orange button (light theme), use `--ember-700`.

**Order-status tones** (used by one `StatusBadge`, see §7). Light: text on 50/100 tint. Dark: 300-shade text on a 16 % tint of the 500 shade. All pairs ≥ 4.79 : 1 light, ≥ 7.46 : 1 dark 🧮.

| Status | Tone | Light text / bg | Dark text / tint |
|---|---|---|---|
| PLACED | Blue | `#1D4ED8` / `#EFF6FF` (6.16) | `#93C5FD` / blue 16 % (7.98) |
| ACCEPTED | Indigo | `#4338CA` / `#EEF2FF` (7.07) | `#A5B4FC` / indigo 16 % (7.46) |
| PREPARING | Amber | `#92400E` / `#FEF3C7` (6.37) | `#FCD34D` / amber 16 % (9.03) |
| READY | Teal | `#0F766E` / `#F0FDFA` (5.25) | `#5EEAD4` / teal 16 % (9.20) |
| RIDER_ASSIGNED | Purple | `#7E22CE` / `#FAF5FF` (6.51) | `#D8B4FE` / purple 16 % (8.25) |
| PICKED_UP | Orange | `#9A3412` / `#FFEDD5` (6.38) | `#FDBA74` / orange 16 % (8.23) |
| DELIVERED | Green | `#15803D` / `#F0FDF4` (4.79) | `#86EFAC` / green 16 % (9.44) |
| CANCELLED | Stone | `#44403C` / `#F5F5F4` (9.42) | `#D6D3D1` / stone 16 % (8.92) |
| REJECTED | Red | `#B91C1C` / `#FEF2F2` (5.91) | `#FCA5A5` / red 16 % (7.74) |
| DELIVERY_FAILED | Rose | `#9F1239` / `#FFF1F2` (7.30) | `#FDA4AF` / rose 16 % (7.76) |

**Food tiles (category tints).** Because menu items have no colour field (N2), the tile colour comes from the item's **category**: `tint = TILES[category.sortOrder % 8]`. Text on a tile is always `--stone-900`.

`#FED7AA` orange · `#FDE68A` amber · `#FCE7F3` pink · `#D9F99D` lime · `#BAE6FD` sky · `#FECDD3` rose · `#DDD6FE` violet · `#99F6E4` teal. The first three are the colours the app already uses ✅.

**Chart palette** (series order; on dark surface all ≥ 6.2 : 1, on light use the 600 shades): flame `#F97316` (light: `#EA580C`) · blue `#60A5FA` (`#2563EB`) · green `#4ADE80` (`#16A34A`) · amber `#FBBF24` (`#D97706`) · violet `#A78BFA` (`#7C3AED`) · pink `#F472B6` (`#DB2777`). Charts must also differ by **pattern or direct label**, not colour alone.

### 6.2 Typography

| Item | Spec |
|---|---|
| Family | **Inter** (variable, weights 400–800) — admin already uses it ✅. Fallback: `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`. |
| Loading | Self-host with `@fontsource-variable/inter` so it works offline inside the Capacitor WebView and never blocks first paint (`font-display: swap`). |
| Numbers | `font-variant-numeric: tabular-nums` on prices, totals, order numbers, tables and chart axes so columns line up. |
| Urdu readiness 🆕 | Add `"Noto Nastaliq Urdu"` / `"Noto Sans Arabic"` as the Urdu fallback and use logical CSS properties (`margin-inline-start`) everywhere so RTL is possible later (§12.4). |
| Minimum size | **12 px.** The current code uses 9–11 px in charts and tags ✅; that goes away. |

| Style | Size / line-height | Weight | Use |
|---|---|---|---|
| `display` | 32 / 40 | 800 | Splash, empty-state headline, big stat |
| `h1` | 24 / 32 | 700 | Screen title |
| `h2` | 20 / 28 | 700 | Section title, dialog title |
| `h3` | 17 / 24 | 600 | Card title, item name |
| `body` | 15 / 22 (mobile) · 14 / 20 (admin) | 400 | Default text |
| `body-strong` | same | 600 | Prices, labels |
| `small` | 13 / 18 | 400 / 600 | Meta, helper text, table secondary |
| `caption` | 12 / 16 | 500 | Timestamps, chart axes |
| `overline` | 12 / 16, +0.04 em, uppercase | 600 | Section eyebrow, table headers |

### 6.3 Spacing, radius, elevation

**Spacing** — strict 4-pt scale (replaces the current 6, 7, 10, 28 values ✅):
`--space-1: 4` · `-2: 8` · `-3: 12` · `-4: 16` · `-5: 20` · `-6: 24` · `-8: 32` · `-10: 40` · `-12: 48` · `-16: 64`. Screen gutter: **16 px** on mobile, **24 px** on admin. Card padding 16 (mobile) / 20 (admin).

**Radius**

| Token | px | Use |
|---|---|---|
| `--radius-xs` | 4 | Tags, tiny chips |
| `--radius-sm` | 8 | Inputs, small buttons, tooltips |
| `--radius-md` | 12 | Buttons, option tiles |
| `--radius-lg` | 16 | Cards, food tiles, dialogs |
| `--radius-xl` | 24 | Bottom sheets (top corners), hero |
| `--radius-pill` | 999 | Filter pills, badges, avatars, steppers |

**Elevation** — light theme uses soft warm shadows; dark theme uses a lighter surface plus a 1 px border (shadows disappear on dark).

| Level | Light | Use |
|---|---|---|
| `--shadow-1` | `0 1px 2px rgb(28 25 23 / .06), 0 1px 1px rgb(28 25 23 / .04)` | Cards |
| `--shadow-2` | `0 4px 12px rgb(28 25 23 / .08)` | Sticky bars, popovers |
| `--shadow-3` | `0 12px 32px rgb(28 25 23 / .16)` | Dialogs, sheets |

### 6.4 Motion

| Token | Value | Use |
|---|---|---|
| `--dur-press` | 100 ms | Button press scale (0.98) |
| `--dur-fast` | 160 ms | Hover, toggle, chip select |
| `--dur-base` | 240 ms | Sheets, dialogs, drawers, toast |
| `--dur-slow` | 400 ms | Tracker progress, chart draw |
| `--ease-standard` | `cubic-bezier(.2, 0, 0, 1)` | Default |
| `--ease-enter` | `cubic-bezier(0, 0, 0, 1)` | Things appearing |
| `--ease-exit` | `cubic-bezier(.3, 0, 1, 1)` | Things leaving |

Rules: motion explains change (a new order slides in, a sheet rises) and never decorates. **`prefers-reduced-motion: reduce`** turns off the skeleton shimmer, slides and scale effects (replace with an instant change or a 1-step fade). Haptics (Capacitor `haptics`, already installed ✅): light impact on add-to-cart, success on order placed, warning on rider request.

### 6.5 Layout, breakpoints, z-index

| App | Baseline | Rules |
|---|---|---|
| Customer / Rider | 360 × 800 (support down to 320) | Single column. In a browser, centre the app at `max-width: 480px`. Bottom bars add `padding-bottom: env(safe-area-inset-bottom)`; set `viewport-fit=cover` ❓ (check `index.html`). |
| Admin | 1440 × 900 | ≥ 1280: full sidebar 248 px · 1024–1279: icon rail 72 px · 768–1023: drawer sidebar (kitchen tablets) · < 768: show "Best on a larger screen" notice but keep working. Content max-width 1440. |

Z-index scale: `base 0 · sticky 10 · nav 20 · sheet 30 · dialog 40 · toast 50 · connection-banner 60`.

### 6.6 Iconography

**Policy:** UI chrome uses **SVG icons** (Lucide, `lucide-react`, ISC licence, tree-shakable). **Emoji are kept only where they are data**: a menu item's `emoji` and a category's `icon` come from the API and stay as they are ✅. Reason: emoji have no accessible names, look different on every Android version, and cannot follow colour or size tokens.

Sizes 16 / 20 / 24 px, stroke 1.75–2, `currentColor`. Icon-only controls are always ≥ 44 × 44 px with an `aria-label`. Check each name against the installed Lucide version before use (a few were renamed).

| Meaning | Old emoji ✅ | New Lucide icon 🆕 |
|---|---|---|
| Home tab | (label only) | `House` |
| Menu tab | (label only) | `UtensilsCrossed` |
| Orders tab / list | 📦 📋 | `ReceiptText` / `ClipboardList` |
| Profile tab | (label only) | `User` |
| Cart | 🛒 | `ShoppingBag` |
| Search | 🔍 | `Search` |
| Back | `←` | `ArrowLeft` (`ChevronLeft` on iOS-style headers) |
| Clear | `✕` | `X` |
| Add / minus | `+` `−` | `Plus` `Minus` |
| Disclosure | `›` | `ChevronRight` |
| Address / drop | 🏠 📍 | `MapPin` / `House` |
| Restaurant / pickup | 🏪 | `Store` |
| Rider | 🏍️ 🛵 | `Bike` |
| Track order | 🗺️ | `Navigation` |
| Accept / success | ✅ | `CircleCheck` |
| Reject / error | ❌ | `CircleX` |
| Preparing | 👨‍🍳 | `ChefHat` |
| Ready | 📦 | `PackageCheck` |
| Notification | 🔔 | `Bell` |
| Cash / settle | 💰 | `Banknote` |
| Suspend | 🚫 | `Ban` |
| Edit / delete | ✏️ 🗑️ | `Pencil` / `Trash2` |
| Settings / help | ⚙️ ❓ | `Settings` / `CircleHelp` |
| Sign out | 🚪 | `LogOut` |
| Admin nav | 📊 🧾 🍔 🏍️ 👥 📈 | `LayoutDashboard` · `Receipt` · `UtensilsCrossed` · `Bike` · `Users` · `ChartColumn` |
| Live / online dot | 🔴 🟢 | a 8 px pulsing dot **plus the word** "Live" / "Online" |

**Map markers** become SVG pins (store, home, rider) 40 px, white 2 px ring, `role="img"` + label, replacing the emoji `L.divIcon` HTML ✅ (`homeIcon`, `riderIcon`, `restaurantIcon`). Always show tile attribution (N8). Before real traffic, move off the public OpenStreetMap tile servers (D24) to a tile provider with a key.

---

## 7. Order status system (one vocabulary for all three apps)

Today the same ten statuses are re-declared in at least six places (`STATUS_LABEL`, `STATUS_STEPS`, `ACTIVE_STATUSES`, admin `STATUSES`, admin `TRANSITIONS`, ternaries on the Track screen) and styled by two parallel class sets (D10, D11). The new design has **one table**, defined once in `@fastfood/ui` and keyed by the shared `OrderStatus` enum.

### 7.1 Master table 🆕

| Status | Customer label | Admin label | Tone | Icon | Active? | Tracker step |
|---|---|---|---|---|---|---|
| `PLACED` | Order placed | **New** | Blue | `ClipboardList` | ✔ | 1 Placed |
| `ACCEPTED` | Accepted | Accepted | Indigo | `CircleCheck` | ✔ | 2 Accepted |
| `PREPARING` | Preparing | Preparing | Amber | `ChefHat` | ✔ | 3 Preparing |
| `READY` | Ready · finding a rider | Ready | Teal | `PackageCheck` | ✔ | 3 Preparing |
| `RIDER_ASSIGNED` | Rider on the way to restaurant | Rider assigned | Purple | `Bike` | ✔ | 4 On the way |
| `PICKED_UP` | On the way to you | Out for delivery | Orange | `Navigation` | ✔ | 4 On the way |
| `DELIVERED` | Delivered | Delivered | Green | `PackageCheck` | — | 5 Delivered |
| `CANCELLED` | Cancelled | Cancelled | Stone | `Ban` | — | — (banner) |
| `REJECTED` | Declined by the restaurant | Rejected | Red | `CircleX` | — | — (banner) |
| `DELIVERY_FAILED` | We couldn't deliver | Delivery failed | Rose | `TriangleAlert` | — | — (banner) |

*Current customer labels ✅ were: Order Placed, Accepted, Preparing, Ready, Rider Assigned, On the way, Delivered, Cancelled, Rejected, Delivery Failed.* The new wording is sentence case and tells the customer what is happening, not just a state name.

**Admin filter bar** shows **all ten** statuses (fixes D10: `DELIVERY_FAILED` was missing ✅), grouped: *Needs action* (New) · *In kitchen* (Accepted, Preparing, Ready) · *Delivery* (Rider assigned, Out for delivery) · *Done* (Delivered) · *Problems* (Cancelled, Rejected, Delivery failed).

### 7.2 Who can move an order, and the buttons that result

Transitions below are the server rules ✅ (`ORDER_TRANSITIONS` in `order.state-machine.ts`). The UI only shows a button when the signed-in role is allowed to take it.

| From | To | Allowed roles ✅ | Where the button lives 🆕 | Label |
|---|---|---|---|---|
| PLACED | ACCEPTED | admin, staff | Admin board card / drawer | **Accept** (primary) |
| PLACED | REJECTED | admin, staff | Admin overflow → dialog with reasons | Reject… |
| PLACED | CANCELLED | customer, admin | Customer order detail · admin overflow | Cancel order… |
| ACCEPTED | PREPARING | admin, staff | Admin | **Start preparing** |
| ACCEPTED, PREPARING | CANCELLED | admin | Admin overflow (**missing today**, N4) | Cancel order… |
| PREPARING | READY | admin, staff | Admin | **Mark ready** |
| READY | RIDER_ASSIGNED | rider, admin | Rider: request sheet **Accept**; admin: shows "Waiting for a rider" + **Dispatch** 🟡 (N5) | Accept / Dispatch |
| RIDER_ASSIGNED | PICKED_UP | rider | Rider active-delivery screen | **Picked up** |
| PICKED_UP | DELIVERED | rider (with OTP + cash) | Rider | **Complete delivery** |
| PICKED_UP | DELIVERY_FAILED | rider | Rider, behind a reason sheet (N6) | Can't deliver… |

### 7.3 Customer tracker 🆕

Five steps fit a 360 px screen as icon + one-word label: **Placed · Accepted · Preparing · On the way · Delivered**. The current step shows a live sub-line that changes with the exact status (e.g. READY → "Ready — finding a rider", RIDER_ASSIGNED → "Rider is heading to the restaurant", PICKED_UP → "Your rider is on the way"). Completed steps are filled `--flame`; the current step pulses once per 2 s (static under reduced motion); future steps are `--border`. Each dot has a text label and `aria-current="step"`, so it never relies on colour alone.

Negative outcomes replace the tracker with a **banner** (icon + title + reason + next step). Because the system is cash-on-delivery, every banner can say: *"You haven't been charged — payment is cash on delivery."*

### 7.4 Single source of truth (code) 🆕

```ts
// packages/ui/src/orderStatus.ts
import { OrderStatus } from '@fastfood/shared-types';

export type StatusTone =
  'blue' | 'indigo' | 'amber' | 'teal' | 'purple' | 'orange' | 'green' | 'stone' | 'red' | 'rose';

export interface StatusMeta {
  label: string;          // customer-facing
  adminLabel: string;
  tone: StatusTone;
  icon: string;           // Lucide icon name
  active: boolean;        // shows in "Active orders" and the live feed
  trackerStep: 1 | 2 | 3 | 4 | 5 | null;
}

export const STATUS: Record<OrderStatus, StatusMeta> = {
  PLACED:          { label: 'Order placed',                   adminLabel: 'New',              tone: 'blue',   icon: 'ClipboardList', active: true,  trackerStep: 1 },
  ACCEPTED:        { label: 'Accepted',                       adminLabel: 'Accepted',         tone: 'indigo', icon: 'CircleCheck',   active: true,  trackerStep: 2 },
  PREPARING:       { label: 'Preparing',                      adminLabel: 'Preparing',        tone: 'amber',  icon: 'ChefHat',       active: true,  trackerStep: 3 },
  READY:           { label: 'Ready · finding a rider',        adminLabel: 'Ready',            tone: 'teal',   icon: 'PackageCheck',  active: true,  trackerStep: 3 },
  RIDER_ASSIGNED:  { label: 'Rider on the way to restaurant', adminLabel: 'Rider assigned',   tone: 'purple', icon: 'Bike',          active: true,  trackerStep: 4 },
  PICKED_UP:       { label: 'On the way to you',              adminLabel: 'Out for delivery', tone: 'orange', icon: 'Navigation',    active: true,  trackerStep: 4 },
  DELIVERED:       { label: 'Delivered',                      adminLabel: 'Delivered',        tone: 'green',  icon: 'PackageCheck',  active: false, trackerStep: 5 },
  CANCELLED:       { label: 'Cancelled',                      adminLabel: 'Cancelled',        tone: 'stone',  icon: 'Ban',           active: false, trackerStep: null },
  REJECTED:        { label: 'Declined by the restaurant',     adminLabel: 'Rejected',         tone: 'red',    icon: 'CircleX',       active: false, trackerStep: null },
  DELIVERY_FAILED: { label: "We couldn't deliver",            adminLabel: 'Delivery failed',  tone: 'rose',   icon: 'TriangleAlert', active: false, trackerStep: null },
};

export const ACTIVE_STATUSES = (Object.keys(STATUS) as OrderStatus[]).filter(s => STATUS[s].active);
export const statusSlug = (s: OrderStatus) => s.toLowerCase().replace(/_/g, '-'); // regex: fixes D11
```

If a new status is added on the server, TypeScript fails to compile until this table has a row for it. That is the point.

---

## 8. Component library (`@fastfood/ui`) 🆕

All components read **only** semantic tokens (§6), have light + dark support, a visible focus state and a documented state set. They replace the file-local components and the two class contracts (D9). Class naming is **BEM-lite** (`.btn`, `.btn--primary`) with one global stylesheet from the package; app code never re-styles them inline.

### 8.1 Primitives (shared by all three apps)

| # | Component | Variants / sizes | States | Spec notes |
|---|---|---|---|---|
| 1 | **Button** | `primary` · `secondary` · `ghost` · `danger` · `danger-outline`; sizes `md` 44 px, `lg` 52 px (mobile CTA), `sm` 36 px (**desktop only**) | default · hover · pressed · `:focus-visible` · disabled · **loading** (spinner + progressive label, `aria-busy`) | Label is a verb ("Place order"). One `primary` per screen area. Replaces `btn-primary` (both contracts). |
| 2 | **IconButton** | `ghost` · `tonal` · `filled`; 44 × 44 | same | **Requires `aria-label`** (TypeScript prop is mandatory). Used for back, clear, cart. |
| 3 | **Input** | text · password (show/hide) · number · search | default · focus · filled · error · disabled | 48 px tall on mobile, 40 px admin. Border `--border-strong`. Text ≥ 16 px on iOS-like WebViews to stop zoom. |
| 4 | **Textarea** | auto-grow, 3 rows min | same | Counter when `maxLength` exists (e.g. notes 500 ✅). |
| 5 | **Field** | wraps label + control + hint + error | — | Uses real `<label for>`; error is `role="alert"` and referenced by `aria-describedby` (fixes the unlinked labels ✅). |
| 6 | **Select** | native `<select>` styled | default · focus · error | Native on mobile (best keyboard and a11y); custom listbox only in admin if needed. |
| 7 | **Switch** | 44 × 28 | on · off · disabled · loading | Always paired with a text label ("Available", "Online"). Replaces the 🟢/🔴 emoji toggle. |
| 8 | **OptionTile** | single-select (radio) and multi-select (checkbox) | selected · disabled | Product-detail size/add-on tiles: label left, price right (`+Rs. 50`). Min 56 px tall. |
| 9 | **Stepper** | `−  2  +` | min reached · max reached | Buttons 44 px, value `aria-live="polite"`. Min 1, max 50 ✅ (`CartItemSchema`). Cart rows: at 1, `−` becomes a trash icon. |
| 10 | **Chip / Pill** | filter · category · removable | default · selected · disabled | Height 36 (mobile) / 32 (admin), radius pill, selected = `--ember-100` bg + `--ember-800` text + check icon. |
| 11 | **SegmentedControl** | 2–4 options | selected | Admin menu tabs (Items / Categories), order view (Board / Table). Replaces inline-styled tabs. |
| 12 | **StatusBadge** | from §7 table; sizes `sm` 20, `md` 24 | — | Icon + label, tone from `data-tone`. One implementation for customer, rider, admin. |
| 13 | **Avatar** | 32 / 36 / 56; initial or photo | — | Colour from a hash of the name over 6 tones (not just primary). Decorative → `aria-hidden`. |
| 14 | **Card** | `flat` · `outlined` · `interactive` | hover · pressed · focus | Radius 16. If the whole card is clickable it is a real `<a>`/`<button>` (fixes clickable `div`s ✅); inner buttons stop propagation. |
| 15 | **Skeleton** | text · rect · circle · card | — | Shimmer 1.2 s; **static under reduced motion**. One shared component replaces "Loading…" text (D16). |
| 16 | **Toast** | success · error · info · brand-alert | auto-dismiss | Icon + text. Mobile: top-centre under the status bar; admin: top-right. Success 3 s, error 5 s, new-order alert 8 s with an **Open** action. `aria-live="polite"` (errors `role="alert"`). Max one visible on mobile. |
| 17 | **Dialog** | `confirm` · `reason` · `info` | open · closing | Focus trap, `Esc`, backdrop-click = cancel, focus returns to trigger. Centred on admin, **bottom sheet on mobile**. See contract below. |
| 18 | **BottomSheet** | content-height · full | drag handle, scrim | Used for dialogs, rider request, address picker, filters. Swipe down to close. |
| 19 | **EmptyState** | illustration + title + sentence + one CTA | — | Replaces the emoji + sentence pattern. Never a dead end: every empty state offers a next step. |
| 20 | **ErrorState** | inline (card) · full screen | retry | "Couldn't load orders" + **Try again** button + the server message if safe. Fixes D17 (failed request looked like an empty list). |
| 21 | **ConnectionBanner** | `offline` · `reconnecting` · `back online` | — | Sticky top strip, z-index 60: "You're offline — showing your last orders". Driven by the Capacitor `network` plugin ✅ (installed) and socket `connect_error`. |

**Button CSS (reference)**

```css
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: var(--space-2);
  min-height: 44px; padding: 0 var(--space-5);
  border: 1px solid transparent; border-radius: var(--radius-md);
  font: 600 15px/1 var(--font); cursor: pointer;
  transition: background var(--dur-fast) var(--ease-standard), transform var(--dur-press) var(--ease-standard);
}
.btn:active { transform: scale(.98); }
.btn:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }
.btn[disabled], .btn[aria-busy="true"] { opacity: .55; cursor: not-allowed; }
.btn--primary   { background: var(--action-bg); color: var(--action-fg); }
.btn--primary:hover { background: var(--action-bg-hover); }
.btn--secondary { background: var(--bg-surface); color: var(--text); border-color: var(--border-strong); }
.btn--ghost     { background: transparent; color: var(--link); }
.btn--danger    { background: var(--danger-solid); color: var(--on-danger-solid); }
.btn--lg { min-height: 52px; font-size: 16px; width: 100%; }
@media (prefers-reduced-motion: reduce) { .btn { transition: none; } .btn:active { transform: none; } }
```

**Dialog contract (replaces every `confirm()` / `prompt()`; D7, N7)**

```ts
type DialogProps = {
  open: boolean;
  title: string;                         // "Cancel this order?"
  message?: string;                      // what will happen
  consequence?: string;                  // "The customer will be notified."
  tone?: 'primary' | 'danger';
  confirmLabel: string;                  // the verb: "Cancel order" (never just "OK")
  cancelLabel?: string;                  // default "Keep order"
  reasons?: string[];                    // preset reasons; last one "Other" reveals a text field
  reasonRequired?: boolean;
  loading?: boolean;                     // keeps the dialog open until the request ends
  error?: string;                        // shown inside the dialog if the request fails
  onConfirm: (reason?: string) => void | Promise<void>;
  onCancel: () => void;
};
```

Preset reason lists (they map to the existing `reason` / `note` string fields ✅):

| Flow | Presets |
|---|---|
| Customer cancels order | Changed my mind · Ordered by mistake · Taking too long · Other |
| Admin rejects order | Item unavailable · Too busy right now · Closing soon · Outside delivery area · Other |
| Rider "Can't deliver" | Customer not reachable · Address wrong or incomplete · Customer refused · Other |
| Admin suspends rider/customer | Free text (required), shown to staff only |

### 8.2 Customer and rider components

| # | Component | Spec |
|---|---|---|
| 22 | **MenuItemCard** | 4 : 3 tile (photo or emoji on category tint), name (h3, 2 lines max), compact price, round **+** IconButton (44 px, `aria-label="Add {name}"`). Unavailable items show a "Sold out" overlay and a disabled **+**. Whole card = link to `/menu/:id`. |
| 23 | **MenuRow** | List variant for Menu and Search: 72 px tile, name, 2-line description, price, **+**. |
| 24 | **CategoryChip** | Icon (from the category's API `icon` ✅) + label, pill. |
| 25 | **BottomNav** | 4 tabs, 56 px + safe area: Home `House` · Menu `UtensilsCrossed` · Orders `ReceiptText` · Profile `User`. Active = `--ember-700` icon + label and a 3 px top indicator; **Orders tab shows a dot when an order is active**. Labels always visible. |
| 26 | **CartBar** | Sticky pill above the nav when the cart has items: `2 items · View cart · Rs. 1,250`. Appears with a 240 ms rise; haptic tick on update. |
| 27 | **PriceSummary** | Subtotal · Delivery fee · (Discount) · **Total (est.)**; the free-delivery progress bar ("Add Rs. 350 more for free delivery"); footnote "Final price confirmed by the restaurant". Same component in Cart and Checkout, so the two totals can never differ (D3). |
| 28 | **OrderCard** | `#FD-1042`, relative time, StatusBadge, item summary line ("2 × Zinger, 1 × Fries"), total, and for active orders a **Track** button. Active cards get a 2 px `--flame` left border. |
| 29 | **OrderTracker** | The 5-step tracker from §7.3 with a live sub-line and an "ETA" slot (shown only if the API sends one). |
| 30 | **OtpCard** | Large 4–6 digit code in monospace tabular numerals, letter-spaced, with the lines "Show this code to the rider at delivery" and "Don't share it with anyone else" ✅. Copy-free (no copy button, it is a one-time handover code). |
| 31 | **AddressPicker** | Bottom-sheet map with a draggable centre pin, "Use my location" (Capacitor `geolocation`), address text field, landmark field, saved-address list. Never shows raw latitude/longitude (D2). |
| 32 | **MapPin** | SVG markers: store, home, rider (rotates to heading when available). 40 px, white ring. |
| 33 | **RequestSheet** (rider) | Bottom sheet for a delivery request: pickup → drop with distances, earning/cash-to-collect, a **30 s countdown ring** ✅ (the existing timeout), **Accept** (primary, lg) and **Decline**. Warning haptic + sound on arrival. |
| 34 | **CountdownRing** | SVG ring that drains over `n` seconds; shows the number; `role="timer"`, not announced every second (announce at 20, 10, 5). |

### 8.3 Admin components

| # | Component | Spec |
|---|---|---|
| 35 | **AdminShell** | Sidebar (248 / 72 px) + top bar. Top bar: page title, global order search (`/`), **LiveIndicator**, new-order bell, avatar menu (theme, sign out). Page title comes from one route table (fixes D20: titles were defined twice). |
| 36 | **StatCard** | Label, value (display), delta/hint with icon + text (never colour alone), optional sparkline. Loading = skeleton. |
| 37 | **DataTable** | Sticky header, 48 px rows (40 dense), sortable columns, row hover, row action menu, skeleton rows, empty row, error row with retry, pagination footer. Horizontal scroll inside its own container on small screens. |
| 38 | **OrderBoard / OrderTicket** | Kanban columns *New · Preparing · Ready · With rider*. A ticket shows `#number`, age timer (turns amber at 10 min, red at 20 min 🆕 thresholds), items, total, payment, and the **single next action**. New tickets slide in with a short chime (sound toggle in the top bar). |
| 39 | **Drawer** | 480 px right panel for order detail, rider detail, menu-item form; replaces ad-hoc modals. Esc / scrim close; unsaved-changes guard on forms. |
| 40 | **ChartCard** | Card + title + range control + chart + accessible data-table fallback ("View as table"). Reads colours from `chartTheme` (§15.3). |
| 41 | **LiveIndicator** | `● Live` (pulsing 8 px dot + the word) when the socket is connected; `Reconnecting…` (amber) / `Offline` (red) otherwise; tooltip with the "last updated" time. |

**Total: 41 documented components** (21 primitives, 13 customer/rider, 7 admin).


---

## 9. Customer app (Android + browser) 🆕

### 9.1 Navigation

```
/login ◄──► /signup                              (public only)
   │
   ▼ signed in
Bottom tabs:  Home  ·  Menu  ·  Orders  ·  Profile
   Home ─► /search ─► /menu/:id ─► (Add) ─► CartBar ─► /cart ─► /checkout
   Menu ─► /menu/:id                                              │
   Orders ─► /orders/:id ─► /orders/:id/track                     ▼
   Profile ─► /profile/addresses · /profile/help · /profile/settings   /orders/:id/placed 🆕
```

Kept ✅: all 12 existing routes, `PrivateRoute` / `PublicRoute`, session restore from the refresh token. **New** 🆕: `/orders/:id/placed` (confirmation), `/profile/addresses`, `/profile/settings`, `/profile/help`, rating sheet after delivery, 404 and "session expired" screens (the wildcard currently just redirects ✅).

Bottom nav shows on the four tab screens (Home, Menu, Orders, Profile) and Search. It is hidden on Product, Cart, Checkout, Order detail and Track, as today ✅.

### 9.2 Screen designs

> In the wireframes below (and in §10–§11) an emoji such as 🔍 🛍 📍 🏪 stands in for the matching **Lucide icon** from §6.6. The real UI uses SVG icons for all chrome; emoji remain only for food data.

#### Home

```
┌──────────────────────────────┐
│ Hi, Hira                 [🛍 2]│  ← h1 + cart IconButton (badge)
│ What are you craving today?  │
│ ┌──────────────────────────┐ │
│ │ 🔍 Search burgers, pizza…│ │  ← real search input (not a fake button)
│ └──────────────────────────┘ │
│ ┌ Active order ─────────────┐│  ← only when an order is active
│ │ #FD-1042 · Preparing      ││     StatusBadge + "Track" button
│ └───────────────────────────┘│
│ ◀ promo card  promo card ▶   │  ← data-driven (see below)
│ Categories            See all│
│ (🍔)(🍕)(🥤)(🍰)(🥗)         │  ← CategoryChips, from API
│ Popular right now            │
│ ┌────────┐ ┌────────┐        │
│ │ tile   │ │ tile   │        │  ← 2-col MenuItemCards
│ │ Zinger │ │ Pizza  │        │
│ │ Rs.450 +│ │ Rs.900 +│      │
│ └────────┘ └────────┘        │
│ [ 2 items · View cart · Rs.1,250 ]  ← CartBar
│ Home  Menu  Orders●  Profile │
└──────────────────────────────┘
```

| Change | Why |
|---|---|
| Search is a **real input** that opens Search on focus | The current fake button (✅ `HomeScreen`) breaks keyboard and accessibility expectations. |
| **Active-order strip** at the top | Biggest anxiety for a customer is "where is my order"; today they must go to the Orders tab. |
| Promo cards come from data (`/promotions` 🆕 backend task), with a graceful hide when empty | Promos and "Up to 30 % off" are hard-coded today (D15) and can promise discounts that don't exist. |
| "Popular right now" needs a ranking from the API; until then label it **"Menu favourites"** or "Recommended" | The first 12 items are not "popular" (D15). |
| Fallback categories (Burgers, Pizza, Drinks, Desserts) stay only as a skeleton, not as fake tappable chips | Chips that go nowhere erode trust. |

States: skeleton (6 cards) · empty menu ("The kitchen is getting ready — check back soon") · error with retry · offline banner.

#### Menu

Header "Menu" with search icon. Sticky **category pills** (All + categories, synced to `?category=` ✅). Rows are `MenuRow`. Sold-out rows stay visible but dimmed with a "Sold out" tag (rather than disappearing). Pull-to-refresh. Skeleton rows (4).

#### Search

Autofocused input, clear button (`aria-label="Clear search"`), recent searches when empty, then results as `MenuRow`s. Messages: *"Type at least 2 characters"* ✅ → skeleton rows (not the word "Searching…") → *"No results for 'xyz' — try a shorter word"*. Debounce 250 ms.

#### Product detail

```
┌──────────────────────────────┐
│ [←]                          │
│        ( photo / emoji       │
│          on category tint )  │  ← hero 4:3, floating back button
├──────────────────────────────┤
│ Zinger Burger                │
│ Crispy chicken, mayo, lettuce│
│ Size                         │
│ [Regular  Rs.450][Large Rs.600]  ← OptionTiles (single-select)
│ Add-ons                      │
│ [Cheese +Rs.50][Egg +Rs.40]  │  ← OptionTiles (multi-select)
│ Notes for the kitchen (opt.) │
│ ┌──────────────────────────┐ │
│ └──────────────────────────┘ │
├──────────────────────────────┤  ← sticky footer
│ ( − 1 + )  [ Add · Rs. 500 ] │
└──────────────────────────────┘
```

Changes: the price on the button updates live; the **size section always shows** when sizes exist and "Regular" is the default ✅; a *notes* field uses the API's existing `notes` (max 200 ✅ `CartItemSchema`); on add → haptic + a snackbar **"Added to cart · View cart"** and the user stays on the item (today the screen jumps back ✅ `navigate(-1)`).

#### Cart

Rows: thumbnail, name, size, **add-ons as separate lines**, line price, Stepper. Rows are keyed by `menuItemId + size + sorted(addOns)` so the same item with different add-ons stays two lines (fixes D4). `PriceSummary` includes the delivery fee and the free-delivery progress bar (fee and threshold come from `/app-config` 🆕 instead of hard-coded Rs. 100 / Rs. 1,000, ✅ `CartScreen`). "Clear" opens a Dialog. Empty cart: illustration + **Browse menu**.

#### Checkout

```
┌──────────────────────────────┐
│ [←] Checkout                 │
│ Deliver to                   │
│ ┌ map with draggable pin ───┐│
│ │            📍              ││  ← AddressPicker (real map)
│ └───────────────────────────┘│
│ [ Use my location ]          │
│ Address  ┌──────────────────┐│
│          └──────────────────┘│  ← min 10 chars ✅
│ Landmark (optional)          │
│ Saved: (Home)(Work)(+ New)   │
│ Payment                      │
│ (●) Cash on delivery         │  ← single option, built as a list
│     Pay Rs. 1,350 to the rider│
│ Order summary  (PriceSummary)│
├──────────────────────────────┤
│ [ Place order · Rs. 1,350 ]  │
└──────────────────────────────┘
```

Fixes **D2**: the pin starts at the device GPS (Capacitor `geolocation`, already installed ✅). If permission is denied, the pin starts at the restaurant **but the Place-order button stays disabled until the customer moves the pin or taps "Confirm this location"**. Latitude/longitude fields are removed from the UI (the API still receives `lat`/`lng` ✅). Fixes **D3** with the shared `PriceSummary`. Keeps the idempotency key ✅. Button shows "Placing order…" and the dialog-level error shows the server message.

#### Order placed 🆕

Full-screen confirmation: success illustration, "Order #FD-1042 placed", "We'll tell you when the restaurant accepts it", estimated time if available, **Track order** (primary) and **Back to menu**. One celebratory emoji is allowed here. Replaces today's silent jump to order detail ✅.

#### Orders

Segmented control **Active · Past** (replaces the two stacked groups ✅), `OrderCard`s, skeleton (3), empty state with **Order now**. Pull-to-refresh and the existing 10 s poll ✅ with a "Live" indicator when the socket is connected.

#### Order detail

Header (`#number`, date) → **OrderTracker** (§7.3) or the negative banner → items with real thumbnails (fixes D18; the order item stores `image` ✅, not an emoji) → address card with landmark → `PriceSummary` (final: subtotal, delivery, total from the server `totalPaisa` ✅) → payment line ("Cash on delivery — Rs. 1,350") → actions: **Track order** (active) and **Cancel order…** (only while `PLACED` ✅) which opens the reason Dialog and handles errors (fixes N7). After delivery: **Rate your order** sheet 🆕 (1–5 stars + optional note; needs a backend task) and **Order again**.

#### Track order

```
┌──────────────────────────────┐
│ [←] Order #FD-1042           │
│ ● Live · Your rider is on the way │
│ ┌ full-width map ───────────┐│
│ │   (home pin)   (rider pin) ││
│ └───────────────────────────┘│
│ ┌ Delivery code ───────────┐ │
│ │        4  8  2  1        │ │  ← OtpCard (only when PICKED_UP ✅)
│ │ Show this to the rider    │ │
│ └───────────────────────────┘│
│ Bilal · Honda CD70   [ Call ]│  ← rider card 🆕 (needs rider name/phone from API)
└──────────────────────────────┘
```

Statuses show the proper sentences from §7.1 (never the raw enum, fixes the fallback that printed `order.status` ✅). Loading and error states are added (none exist today ✅). "Waiting for live location…" card when the rider is assigned but no GPS has arrived ✅. Map auto-fits both pins; a "Recentre" button appears if the user pans.

#### Profile

Avatar, name, phone/email → rows: My orders · **Saved addresses** · **Settings** (language, theme, notifications) · **Help & support** · Sign out (Dialog). The three rows that only show a "coming soon" toast today ✅ (D14) are either built or **hidden** until built.

#### Login / Signup

Hero with logo mark + "Fresh, fast, and delivered" ✅. One shared password rule: **minimum 8 characters** on both screens (login currently 6, signup 8, from the uploaded guide). Show/hide password. Phone field with a `+92` prefix hint; input mode `tel`. Errors under fields and a form-level error for wrong credentials. Button text "Signing in…" ✅ keeps.

---

## 10. Rider app (Android) 🆕

### 10.1 Navigation

Three-tab bottom bar (new): **Jobs** (`Bike`) · **Earnings** (`Wallet`) · **Profile** (`User`). Order flow is a full-screen route with the tab bar hidden. Existing routes ✅: `/login`, `/`, `/order/:id`, `/earnings`, `/profile`.

Design rules for the rider: bigger everything (min tap 56 px for primary actions), high-contrast text (`--text` on `--bg-surface`), no hover states, and **dark theme follows the OS** (night riding). Cash amounts and OTP use `display` size.

### 10.2 Screen designs

#### Jobs (dashboard)

```
┌──────────────────────────────┐
│ Hi, Bilal            [Offline]│
│ ┌ You are offline ──────────┐│
│ │ ○──────  Go online        ││  ← big Switch + word
│ └───────────────────────────┘│
│ Today                        │
│ 4 deliveries · Rs. 800 · Cash to hand in Rs. 3,200
│ ─────────────────────────────│
│ Waiting for orders…          │  ← when online, none pending
│   (pulsing radar graphic)    │
│ Jobs  Earnings  Profile      │
└──────────────────────────────┘
```

The **online state is read from the server on load** and written on toggle with an optimistic switch and rollback on error (fixes D12: `isOnline` starts `false` and is never synced ✅). The "Today" card uses the `/riders/dashboard` data the app already fetches ✅ (N11); if the response has no figures, hide the card. If an active order exists, the app opens it automatically ✅ and the Jobs tab shows an "Active delivery" card as the way back.

#### Delivery request (bottom sheet)

```
┌──────────────────────────────┐
│ New delivery request    (28) │  ← CountdownRing 30 s ✅
│ 🏪 Pickup  FastFood — 1.2 km │
│ 📍 Drop    Gulberg III — 3.4 km│
│ Cash to collect   Rs. 1,350  │
│ [        Accept         ]    │  ← primary, lg
│ [ Decline ]                  │
└──────────────────────────────┘
```

A warning haptic and a sound play on arrival ✅ (haptics installed). When the countdown ends the sheet closes with "Request expired". If the order is cancelled meanwhile ✅ it closes with "Order was cancelled". If another rider took it first, the 409 message reads **"Another rider took this order"** (✅ the server says "Order already taken or not available"). Fixes D13: one interval, cleared before a new one starts.

#### Active delivery (`/order/:id`)

```
┌──────────────────────────────┐
│ [←] #FD-1042   ● Picked up   │
│ ┌ map: store ─── route ─ home ┐
│ └──────────────────────────┘ │
│ [ Navigate in Google Maps ]  │  ← opens maps app (Capacitor Browser, installed ✅)
│ Drop address                 │
│ House 12, Street 4, Gulberg  │
│ Landmark: near the mosque    │
│ Customer  Hira   [ Call ]    │
│ Items  2 × Zinger, 1 × Fries │
│ Cash to collect  Rs. 1,350   │
├──────────────────────────────┤
│ [ Slide to confirm pickup ]  │  ← one primary action per status
└──────────────────────────────┘
```

Primary action changes with the status: `RIDER_ASSIGNED` → **Picked up**; `PICKED_UP` → **Complete delivery**. **Complete delivery** opens a sheet with the OTP field (numeric keypad, 4–6 digits) and **Cash collected** (Rs, pre-filled with the amount due, fixes D23's empty field), then converts with the shared `toP()` helper ✅ (`packages/utils`) instead of `parseFloat × 100` (D23). **Can't deliver…** is a secondary link that opens the reason sheet (§8.1) before anything is sent (fixes N6). A **slide-to-confirm** control guards the two irreversible actions (pickup and delivered) against accidental taps in a pocket.

GPS keeps streaming ≥ 4 s apart ✅; a small "Sharing location" chip with the `MapPin` icon is always visible so the rider knows it is on. Map attribution restored (N8).

#### Earnings

Replace the placeholder ✅ with: today / week / month tabs, a deliveries list, and a **"Cash to hand in"** card (the unsettled amount the admin sees on the Riders page ✅). Blocked on the backend cash ledger (noted in the earlier overview), so ship the layout with a clear "No deliveries yet" empty state first.

#### Profile

Avatar, name, phone, vehicle (if stored), Settings, Help, Sign out (Dialog). Hide rows that are not built.

#### Login

Same pattern as customer, logo with "Rider" chip ✅. A non-rider account gets a clear in-form message ("This account isn't a rider account") instead of only a toast ✅. Show a password error inline (today only the identifier shows one ✅).

---

## 11. Admin panel (desktop + tablet) 🆕

### 11.1 Shell

```
┌────────────┬─────────────────────────────────────────────────┐
│ [logo]     │ Orders            🔍 Search order # ( / )   ● Live  🔔 (A) ▾│
│ FastFood   ├─────────────────────────────────────────────────┤
│ Admin      │                                                 │
│            │                  page content                   │
│ ▣ Dashboard│                                                 │
│ ▣ Orders ③ │                                                 │
│ ▣ Menu     │                                                 │
│ ▣ Riders   │                                                 │
│ ▣ Customers│                                                 │
│ ▣ Analytics│                                                 │
│            │                                                 │
│ ⎋ Sign out │                                                 │
└────────────┴─────────────────────────────────────────────────┘
```

Sidebar items use Lucide icons (§6.6) with a **badge showing New orders** on Orders. The top bar has the live indicator, a sound toggle, a bell that lists the last 10 new orders, and an avatar menu with theme (Light / Dark / System) and Sign out. The existing `order:new` socket event ✅ now also plays a chime and slides a ticket into the board, in addition to the toast.

**Theme:** the admin keeps its **dark** look as the default ✅ and gains a light theme from the same tokens. The dark palette moves from cool grey (`#1f2937`) to warm stone (`#1C1917`) so it matches the apps (§6.1).

### 11.2 Pages

#### Dashboard

```
┌───────────┬───────────┬───────────┬───────────┐
│ Revenue   │ Active    │ Orders    │ Riders    │
│ Rs. 48,200│ 6         │ 31        │ 4 online  │
│ ▲ 12% vs  │ 2 need    │ 24 done   │ of 7      │
│ yesterday │ action    │           │           │
├───────────┴───────────┼───────────┴───────────┤
│ Revenue · 7 days      │ Live orders           │
│  (area chart)         │ #1042 New       [Accept] │
│                       │ #1041 Preparing [Ready]  │
├───────────────────────┴───────────────────────┤
│ Recent orders  (DataTable, 8 rows)            │
└───────────────────────────────────────────────┘
```

Changes: StatCards show a **comparison** to the previous period (needs a server aggregate, see below); "Active orders — N need attention" becomes "N need action" and counts only `PLACED` ✅ vs everything active today; the Live Orders list gets inline next-action buttons; every chart gets a "View as table" fallback. **Stats should come from a server aggregate endpoint 🆕**, not from `/orders?limit=100` computed in the browser, which silently truncates on busy days (N10 ✅).

#### Orders — board + table 🆕

SegmentedControl **Board | Table** (Board is the default on tablets and for staff role).

```
┌ New (2) ─────┬ Preparing (3) ┬ Ready (1) ────┬ With rider (2) ┐
│┌────────────┐│┌─────────────┐│┌─────────────┐│┌──────────────┐│
││#1042  ⏱ 2m ││││#1039  ⏱ 11m││││#1037        │││#1035 Bilal   ││
││2×Zinger    ││││1×Pizza      ││││Waiting for  │││Picked up     ││
││Rs.1,350 COD││││Rs. 900 COD  ││││a rider      │││Rs. 700 COD   ││
││[Accept][⋯] ││││[Mark ready] ││││[Dispatch]   │││[Track]       ││
│└────────────┘│└─────────────┘│└─────────────┘│└──────────────┘│
└──────────────┴───────────────┴───────────────┴────────────────┘
```

- The ticket's age timer turns **amber at 10 min and red at 20 min** (thresholds are a proposal, make them configurable).
- Each ticket offers **one** primary action from §7.2 and an overflow (`⋯`) with **Reject… / Cancel order…** (the missing admin cancel, N4) which opens the reason Dialog.
- **Table view** keeps today's columns ✅ (Order #, Customer, Items, Total, Payment, Status, Placed, Actions) with all ten status filters including *Delivery failed* (D10), sortable columns, and a row click that opens the **Order drawer**.
- **Order drawer** 🆕: status history from `statusHistory` ✅ (who and when), items with add-ons, delivery address with a mini map, payment, rider (name, phone), cancellation/rejection reason, and the same action buttons.
- Because assignment is first-come (N5), READY tickets say **"Waiting for a rider"** with how long they have waited. A **Dispatch** button re-sends the request and, after 5 minutes, the ticket turns red with "No rider accepted". *Confirm what the server's `READY → RIDER_ASSIGNED` admin call does before building this button* 🟡.

#### Menu manager

Segmented **Items | Categories** ✅. Items table: thumbnail (or emoji tile), name + one-line description, category, price, **availability Switch with the word "Available"**, Edit (opens Drawer), Delete (Dialog). Add-item **Drawer form**: name, description, category, base price in Rs (converted with `toP()` ✅), **sizes** and **add-ons** repeaters (label + price — the API supports both ✅), emoji picker, image upload with preview and crop (the field is `image`, not `imageUrl`, N3), availability. Bulk actions: mark selected sold out. Categories: reorderable cards (drag handle, writes `sortOrder` ✅), icon (emoji), active toggle ✅.

#### Riders

Mini StatCards (Online / Total / Cash to settle) → DataTable: avatar, name, phone, `● Online` badge **with text**, deliveries today, **unsettled cash** (amber text + icon when > 0 ✅), actions **Settle cash…** (Dialog showing the amount and a confirmation) and **Suspend… / Restore** (reason Dialog). A rider detail Drawer shows delivery history and cash ledger. *Known backend gaps from the earlier overview (users endpoint, unsettled-cash counter) still apply; the UI must show an error state, not an empty table, when the call fails (D17).*

#### Customers

Search (name or phone) → "n customers" → DataTable: avatar, name, phone, email, joined (`en-PK` ✅), status (**Active / Suspended** with their own tones — not borrowing `badge-delivered` / `badge-cancelled` ✅), action **Suspend… / Restore** with a reason Dialog. Row click opens a Drawer with order history (needs an orders-by-customer endpoint 🆕).

#### Analytics

Range control (7 / 30 / 90 days) → KPI cards (Revenue, Average order value, Orders, Cancellation rate ✅) → revenue area chart → status **donut** and orders-by-hour **bar** chart ✅ (renamed "Busiest hours", not "heatmap", N12) → **Top selling items** card with bars: quantity **and revenue computed from `lineTotalPaisa`** (fixes N1). All data from a server aggregate endpoint 🆕 (N10). Every chart: accessible title, "View as table", series labelled directly, no colour-only meaning.

#### Login

Logo + "Admin" chip, card on `--bg-page`, identifier, password with show/hide, **Sign in**. **Delete the line that prints the default admin phone and password (D1, High).** Rate-limit message on repeated failures. "Access denied — admin or staff only" ✅ stays as an inline error.

---

## 12. Content and voice 🆕

### 12.1 Principles

Short, warm, specific. Sentence case everywhere (buttons included; today buttons use Title Case ✅). Buttons are **verbs**. Errors say what happened and what to do next. No blame, no jargon, no raw enums or status codes.

### 12.2 One action, one name

An action keeps the same name through button → dialog → toast (today "Clear", "Delete" and "Suspend" are three names for the same destructive idea, and "Sign In" fails with "Login failed" ✅).

| Action | Button | Dialog title | Confirm button | Success toast |
|---|---|---|---|---|
| Cancel an order | Cancel order… | Cancel this order? | Cancel order | Order cancelled |
| Reject an order | Reject… | Reject order #1042? | Reject order | Order rejected |
| Remove a cart line | `Trash2` / Stepper at 1 | — (undo toast instead) | — | Removed · **Undo** |
| Clear the cart | Clear cart | Clear your cart? | Clear cart | Cart cleared |
| Delete a menu item | Delete | Delete "Zinger Burger"? This can't be undone. | Delete item | Item deleted |
| Suspend a user | Suspend… | Suspend Ahmed? | Suspend | Account suspended |
| Settle rider cash | Settle cash… | Settle Rs. 3,200 with Bilal? | Mark as settled | Cash settled |
| Sign out | Sign out | Sign out of FastFood? | Sign out | — |

### 12.3 Message patterns

| Situation | Today ✅ | New 🆕 |
|---|---|---|
| Wrong credentials | "Login failed" | "We couldn't sign you in. Check your phone or email and your password." |
| Generic mutation failure | "Failed" | "Couldn't update the order. Please try again." (+ server message if it is user-safe) |
| Cannot place order | "Failed to place order" | "We couldn't place your order. Your cart is safe — try again." |
| Rider took the job | "Could not accept order" | "Another rider took this order." |
| Rider not a rider | toast "Not a rider account" | Inline: "This account isn't a rider account." |
| Empty orders | "📦 No orders yet" | "No orders yet. Your first one is a few taps away." + **Order now** |
| Not built yet | toast "coming soon" | **Hide the row** until it works |
| Offline | (none) | "You're offline. Showing your last orders." |
| Raw status | `PICKED_UP` / `delivery failed` | The label from §7.1 |

### 12.4 Formats, locale and Urdu readiness

- **Money:** `Rs. 1,250` (no decimals, `formatMoneyCompact` ✅); two decimals only where paisa matter (cash reconciliation, `formatMoney`). Estimates carry "(est.)". Always integer paisa in code ✅; convert Rs ↔ paisa with `toP` / `toR` ✅ (`packages/utils`).
- **Dates:** `en-PK` ✅; "Today, 7:45 pm", "21 Oct 2026"; relative times with `timeAgo` ✅ for under a day.
- **Phone:** stored `+92…`, displayed `+92 300 1234567`.
- **Order numbers:** `#FD-1042` ✅ format from the schema comment.
- **Urdu (phase 2, decision in §18):** put every string in a catalogue (`react-i18next`), use logical CSS (`margin-inline-start`, `inset-inline-end`), mirror direction-implying icons (back arrow, chevrons, progress), keep Western digits by default, and test the Nastaliq font for line-height (it needs ≈ 1.8).

---

## 13. States and realtime 🆕

### 13.1 State matrix — every data view ships all of these

| View type | Loading | Empty | Error | Offline |
|---|---|---|---|---|
| **List** (menu, orders, tables) | Skeleton rows matching the final layout | EmptyState + one next step | ErrorState with **Try again** (never an empty list, D17) | Last cached data + ConnectionBanner |
| **Detail** (product, order) | Skeleton of the full layout | "Not found" EmptyState with a way back ✅ (today plain text) | ErrorState | Cached copy if present |
| **Form** | Disabled submit + "Saving…" | n/a | Field errors inline + form-level error in the Dialog/Sheet | Submit disabled with "Waiting for connection" |
| **Mutation** (accept, toggle) | Button `aria-busy`; switches update optimistically | n/a | Toast + rollback of the optimistic change | Queue is **not** attempted; show the offline reason |
| **Map** | Grey tile + spinner | "Waiting for live location…" ✅ | "Can't load the map" + list fallback with the address | Last known pin + "Last seen 2 min ago" |

### 13.2 Realtime and freshness

Current refresh behaviour ✅ stays; the design only makes it **visible**.

| Where | Mechanism ✅ | Interval / event |
|---|---|---|
| Customer Orders list | Polling | 10 s |
| Customer Order detail | Polling | 8 s |
| Customer Track | Polling + socket | 15 s; `join:order`, `rider:location:update` |
| Rider active order | Polling | 10 s |
| Rider order screen | Polling + GPS emit | 10 s; ≥ 4 s between emits |
| Rider requests | Socket | `delivery:request`, `delivery:request:cancelled` |
| Admin Orders / Dashboard / Riders | Polling | 10 s / 15 s / 15 s |
| Admin new orders | Socket | `order:new` → toast + chime + board slide-in |

Design rules: show **`● Live`** when the socket is connected and **"Updated 8 s ago"** in the page footer or tooltip; show `Reconnecting…` / `Offline` otherwise; pause polling when the app is backgrounded (the customer app already listens to `appStateChange` and `networkStatusChange` ✅ — reuse that in the other two apps); **do not add a third refresh mechanism** next to polling and sockets.

---

## 14. Accessibility specification 🆕 (WCAG 2.2 AA)

| # | Requirement | Rule in this system | How to check |
|---|---|---|---|
| 1 | Text contrast ≥ 4.5 : 1 (large ≥ 3 : 1) | Only token pairs from §6.1; white text only on `--ember-700` / semantic solids | Appendix C script in CI, axe |
| 2 | UI and focus contrast ≥ 3 : 1 | Inputs use `--border-strong`; focus ring `--focus` | Visual + axe |
| 3 | Target size | Mobile ≥ 44 × 44 px with ≥ 8 px gap; desktop ≥ 32 px (WCAG minimum is 24) | Storybook measure overlay |
| 4 | Focus visible and not hidden | `:focus-visible` outline 2 px + 2 px offset on everything interactive; sticky bars use `scroll-padding` so focus is never covered (2.4.11) | Keyboard walk-through on admin |
| 5 | Names for icon-only controls | `IconButton` requires `aria-label` (back, add {name}, clear search, open cart) | TypeScript + axe |
| 6 | Emoji | Decorative → `aria-hidden="true"`; meaningful → `role="img"` + `aria-label`; UI chrome has none | Lint + review |
| 7 | Labels and errors | Real `<label for>`; errors `role="alert"` linked with `aria-describedby`; `autocomplete` and `inputmode` set | axe |
| 8 | State is not colour-only | Status = icon + text; availability = Switch + "Available"; online = dot + "Online"; charts have patterns/labels | Grayscale screenshot review |
| 9 | Dialogs and sheets | Trap focus, `Esc` closes, return focus to the trigger, `aria-modal`, Android back button closes the top layer (Capacitor `app` back-button event ✅ plugin installed) | Manual |
| 10 | Live updates | New order / status change announced in an `aria-live="polite"` region; countdown announced only at 20 / 10 / 5 s | Screen reader |
| 11 | Motion | Respect `prefers-reduced-motion`; no auto-playing loops longer than 5 s except the skeleton and the "Live" dot | Manual |
| 12 | Reflow and zoom | Works at 320 px width and 200 % text size; no horizontal scroll except inside tables | Manual |
| 13 | Clickable non-buttons | Cards, rows and nav items are real `<a>` / `<button>` (today `onClick` on `div`s ✅) | Lint rule `jsx-a11y/click-events-have-key-events` |
| 14 | Language and direction | `<html lang>` set; `dir` ready for RTL (§12.4) | Manual |
| 15 | Charts | Title, text summary and "View as table" | Manual |

**Test devices:** one low-end Android phone (TalkBack on), Chrome desktop with keyboard only, and 200 % browser zoom. Target: **Lighthouse accessibility ≥ 95** on every screen and **zero axe "serious/critical"** issues.

---

## 15. Implementation guide 🆕

### 15.1 Packages (pnpm workspace ✅ already has `packages/shared-types` and `packages/utils`)

```
packages/
  tokens/
    tokens.css            ← every variable in §15.2 (the only place hex values live)
    chartTheme.ts         ← reads the CSS variables for Recharts
    theme.ts              ← ThemeProvider: "light" | "dark" | "system" → <html data-theme>
  ui/
    src/orderStatus.ts    ← §7.4
    src/components/*      ← the 41 components, one folder each (Button/Button.tsx, Button.css, Button.stories.tsx)
    src/icons.ts          ← re-exports only the Lucide icons we use (keeps the bundle small)
    styles.css            ← imports component CSS in layer order
apps/{customer,rider,admin}/src/main.tsx
  import '@fastfood/tokens/tokens.css';
  import '@fastfood/ui/styles.css';
```

Rule of dependency: `apps/*` → `@fastfood/ui` → `@fastfood/tokens` + `@fastfood/shared-types` + `@fastfood/utils`. Nothing in `ui` imports from an app, and nothing in `ui` calls the API (design PRs never touch business logic ✅ rule from the earlier guide).

### 15.2 `tokens.css` (complete baseline)

```css
:root {
  /* ── Type ─────────────────────────────────────────────── */
  --font: 'Inter Variable', Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --font-urdu: 'Noto Nastaliq Urdu', 'Noto Sans Arabic', serif;

  /* ── Space (4-pt) ─────────────────────────────────────── */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px; --space-5: 20px;
  --space-6: 24px; --space-8: 32px; --space-10: 40px; --space-12: 48px; --space-16: 64px;

  /* ── Radius ───────────────────────────────────────────── */
  --radius-xs: 4px; --radius-sm: 8px; --radius-md: 12px; --radius-lg: 16px; --radius-xl: 24px; --radius-pill: 999px;

  /* ── Motion ───────────────────────────────────────────── */
  --dur-press: 100ms; --dur-fast: 160ms; --dur-base: 240ms; --dur-slow: 400ms;
  --ease-standard: cubic-bezier(.2, 0, 0, 1);
  --ease-enter: cubic-bezier(0, 0, 0, 1);
  --ease-exit: cubic-bezier(.3, 0, 1, 1);

  /* ── Z-index ──────────────────────────────────────────── */
  --z-sticky: 10; --z-nav: 20; --z-sheet: 30; --z-dialog: 40; --z-toast: 50; --z-banner: 60;

  /* ── Brand + neutral scales ───────────────────────────── */
  --ember-50: #FFF7ED; --ember-100: #FFEDD5; --ember-200: #FED7AA; --ember-400: #FB923C;
  --flame: #F97316;    --ember-700: #C2410C; --ember-800: #9A3412; --ember-900: #7C2D12;
  --stone-0: #FFFFFF; --stone-50: #FAFAF9; --stone-100: #F5F5F4; --stone-200: #E7E5E4; --stone-300: #D6D3D1;
  --stone-400: #A8A29E; --stone-500: #78716C; --stone-600: #57534E; --stone-700: #44403C;
  --stone-800: #292524; --stone-900: #1C1917; --stone-950: #0C0A09;

  /* ── Light theme (default) ────────────────────────────── */
  color-scheme: light;
  --bg-page: var(--stone-50);   --bg-surface: var(--stone-0);  --bg-raised: var(--stone-0);  --bg-sunken: var(--stone-100);
  --bg-overlay: rgb(12 10 9 / .5);
  --text: var(--stone-900);     --text-muted: var(--stone-600); --text-subtle: var(--stone-500);
  --border: var(--stone-200);   --border-strong: var(--stone-500);
  --action-bg: var(--ember-700); --action-bg-hover: var(--ember-800); --action-fg: #FFFFFF;
  --link: var(--ember-700);     --focus: #1D4ED8;
  --success: #15803D; --success-bg: #F0FDF4; --success-solid: #15803D; --on-success-solid: #FFFFFF;
  --warning: #B45309; --warning-bg: #FFFBEB;
  --danger:  #B91C1C; --danger-bg:  #FEF2F2; --danger-solid:  #B91C1C; --on-danger-solid:  #FFFFFF;
  --info:    #1D4ED8; --info-bg:    #EFF6FF;
  --shadow-1: 0 1px 2px rgb(28 25 23 / .06), 0 1px 1px rgb(28 25 23 / .04);
  --shadow-2: 0 4px 12px rgb(28 25 23 / .08);
  --shadow-3: 0 12px 32px rgb(28 25 23 / .16);

  /* Order-status tones (text / background) */
  --tone-blue-fg:   #1D4ED8; --tone-blue-bg:   #EFF6FF;
  --tone-indigo-fg: #4338CA; --tone-indigo-bg: #EEF2FF;
  --tone-amber-fg:  #92400E; --tone-amber-bg:  #FEF3C7;
  --tone-teal-fg:   #0F766E; --tone-teal-bg:   #F0FDFA;
  --tone-purple-fg: #7E22CE; --tone-purple-bg: #FAF5FF;
  --tone-orange-fg: #9A3412; --tone-orange-bg: #FFEDD5;
  --tone-green-fg:  #15803D; --tone-green-bg:  #F0FDF4;
  --tone-stone-fg:  #44403C; --tone-stone-bg:  #F5F5F4;
  --tone-red-fg:    #B91C1C; --tone-red-bg:    #FEF2F2;
  --tone-rose-fg:   #9F1239; --tone-rose-bg:   #FFF1F2;

  /* Food tiles + chart series (light) */
  --tile-1: #FED7AA; --tile-2: #FDE68A; --tile-3: #FCE7F3; --tile-4: #D9F99D;
  --tile-5: #BAE6FD; --tile-6: #FECDD3; --tile-7: #DDD6FE; --tile-8: #99F6E4;
  --chart-1: #EA580C; --chart-2: #2563EB; --chart-3: #16A34A; --chart-4: #D97706; --chart-5: #7C3AED; --chart-6: #DB2777;
}

/* ── Dark theme: set by ThemeProvider (<html data-theme="dark">) ── */
[data-theme='dark'] {
  color-scheme: dark;
  --bg-page: var(--stone-950);  --bg-surface: var(--stone-900); --bg-raised: var(--stone-800); --bg-sunken: #141210;
  --bg-overlay: rgb(0 0 0 / .6);
  --text: var(--stone-50);      --text-muted: var(--stone-300); --text-subtle: var(--stone-400);
  --border: var(--stone-700);   --border-strong: var(--stone-500);
  --action-bg: var(--flame);    --action-bg-hover: var(--ember-400); --action-fg: var(--stone-900);
  --link: var(--ember-400);     --focus: #93C5FD;
  --success: #4ADE80; --success-bg: rgb(34 197 94 / .16);  --success-solid: #4ADE80; --on-success-solid: #1C1917;
  --warning: #FBBF24; --warning-bg: rgb(245 158 11 / .16);
  --danger:  #F87171; --danger-bg:  rgb(239 68 68 / .16);  --danger-solid:  #F87171; --on-danger-solid:  #1C1917;
  --info:    #60A5FA; --info-bg:    rgb(59 130 246 / .16);
  --shadow-1: none; --shadow-2: none; --shadow-3: 0 12px 32px rgb(0 0 0 / .5);

  --tone-blue-fg:   #93C5FD; --tone-blue-bg:   rgb(59 130 246 / .16);
  --tone-indigo-fg: #A5B4FC; --tone-indigo-bg: rgb(99 102 241 / .16);
  --tone-amber-fg:  #FCD34D; --tone-amber-bg:  rgb(245 158 11 / .16);
  --tone-teal-fg:   #5EEAD4; --tone-teal-bg:   rgb(20 184 166 / .16);
  --tone-purple-fg: #D8B4FE; --tone-purple-bg: rgb(168 85 247 / .16);
  --tone-orange-fg: #FDBA74; --tone-orange-bg: rgb(249 115 22 / .16);
  --tone-green-fg:  #86EFAC; --tone-green-bg:  rgb(34 197 94 / .16);
  --tone-stone-fg:  #D6D3D1; --tone-stone-bg:  rgb(168 162 158 / .16);
  --tone-red-fg:    #FCA5A5; --tone-red-bg:    rgb(239 68 68 / .16);
  --tone-rose-fg:   #FDA4AF; --tone-rose-bg:   rgb(244 63 94 / .16);

  --chart-1: #F97316; --chart-2: #60A5FA; --chart-3: #4ADE80; --chart-4: #FBBF24; --chart-5: #A78BFA; --chart-6: #F472B6;
}

/* ── Base ───────────────────────────────────────────────── */
html { font-family: var(--font); color: var(--text); background: var(--bg-page); -webkit-text-size-adjust: 100%; }
body { margin: 0; font-size: 15px; line-height: 22px; font-variant-numeric: tabular-nums; }
:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; } }

/* ── Temporary aliases for the old variable names (delete after migration) ── */
:root, [data-theme='dark'] {
  --bg: var(--bg-page);  --surface: var(--bg-surface);  --primary: var(--action-bg);
}
```

> **Alias caution.** `--primary` now equals `--action-bg`. In the dark admin that is `#F97316`, so any legacy rule that puts **white** text on `--primary` still fails contrast (2.80 : 1) until that component is migrated. Migrate admin buttons and pills first.

`StatusBadge` CSS (shows how the tone tokens are consumed):

```css
.status-badge { display: inline-flex; align-items: center; gap: 6px; height: 24px; padding: 0 10px;
  border-radius: var(--radius-pill); font: 600 12px/1 var(--font);
  background: var(--tone-bg); color: var(--tone-fg); }
.status-badge[data-tone='blue']   { --tone-bg: var(--tone-blue-bg);   --tone-fg: var(--tone-blue-fg); }
.status-badge[data-tone='indigo'] { --tone-bg: var(--tone-indigo-bg); --tone-fg: var(--tone-indigo-fg); }
/* …one line per tone: amber, teal, purple, orange, green, stone, red, rose */
```

### 15.3 Chart theme (replaces every hex literal in Recharts props)

```ts
// packages/tokens/chartTheme.ts
const v = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export const getChartTheme = () => ({
  grid: v('--border'),
  tick: v('--text-subtle'),
  tooltip: { background: v('--bg-raised'), border: `1px solid ${v('--border')}`, borderRadius: 8, color: v('--text'), fontSize: 13 },
  series: ['--chart-1','--chart-2','--chart-3','--chart-4','--chart-5','--chart-6'].map(v),
  brand: v('--chart-1'),
});
// hook: re-read when <html data-theme> changes, so charts follow the theme
export const useChartTheme = () => { /* useSyncExternalStore on a MutationObserver of data-theme */ };
```

Chart spec carried over from the current charts ✅ and corrected: dashed grid `3 3`; no axis or tick lines; area stroke width 2 with a gradient fill 30–40 % → 0; **axis text ≥ 12 px** (current 9–10 px is too small); donut inner 55 / outer 85 / padding 3°; legend `circle` icons; heights 200 (dashboard) / 220–240 (analytics); always inside `ResponsiveContainer`.

### 15.4 Migration map (old → new)

| Old (current ✅) | New 🆕 |
|---|---|
| `className="btn-primary"` (customer, rider) | `<Button variant="primary" size="lg">` |
| `btn btn-primary / ghost / success / danger / btn-sm` (admin) | `<Button variant="primary \| ghost \| danger" size="sm">` — the green `success` button is retired; "Accept" is primary |
| `input`, `label`, `error-text`, rider `styles.label` / `styles.error` | `<Field label error><Input/></Field>` |
| `status-badge status-*` (customer) and `badge badge-*` (admin) | `<StatusBadge status={…}/>` (one component, one class set) |
| `badge-online` / `badge-offline` | `<StatusBadge kind="presence" online/>` (dot + word) |
| `card`, `card-title`, `stat-card`, `stat-*` | `<Card>`, `<StatCard>` |
| `table-wrap` + hand-written `<table>` | `<DataTable>` |
| `skeleton`, "Loading…" text | `<Skeleton>` |
| `bottom-nav`, `bottom-nav-item` | `<BottomNav>` |
| `admin-layout`, `admin-*`, `sidebar-*`, `nav-item` | `<AdminShell>` |
| `text-primary / -success / -danger / -muted`, `font-bold`, `flex-between`, `flex-gap`, `mt-16` | `.u-*` utilities kept for one release, then removed |
| Inline `style={{ fontFamily: 'Inter, sans-serif' }}` (D8) | Delete — font is on `html` |
| Inline `style={{ background: … }}` for pills/avatars/segmented tabs | `Chip`, `Avatar`, `SegmentedControl` |
| Hex colours in Recharts props (D22) | `useChartTheme()` |
| `item.color ?? '#fed7aa'` (N2) | `tileTint(category)` from `--tile-1…8` |
| `confirm()`, `prompt()`, `alert()` (D7) | `useDialog().confirm({…})` |
| `toast('Settings coming soon')` (D14) | Remove the row |
| `status.toLowerCase().replace('_','-')` (D11) | `statusSlug(status)` |
| `status.replace('_',' ')` printed to users | `STATUS[status].label` |
| `--bg` · `--surface` · `--primary` | `--bg-page` · `--bg-surface` · `--action-bg` / `--link` / `--flame` **by role** (aliases bridge the gap) |

### 15.5 Android / Capacitor specifics

| Topic | Rule |
|---|---|
| Edge-to-edge | Recent Android versions draw behind the system bars by default for new target SDKs (check your `targetSdk`); always pad bottom bars with `env(safe-area-inset-bottom)` and the header with `env(safe-area-inset-top)`, and set `viewport-fit=cover` ❓ (confirm in `index.html`). |
| Status bar | `@capacitor/status-bar` ✅ installed: set style and background from the active theme (§5.2). |
| Splash | `@capacitor/splash-screen` ✅ installed: background = `--bg-page`, centred mark, hide after first render. |
| Back button | `@capacitor/app` ✅ installed: back closes the top-most dialog or sheet first, then navigates back, and exits only on a root tab. |
| Keyboard | No keyboard plugin is installed. Use `interactive-widget=resizes-content` in the viewport meta and test the checkout and OTP sheets so the sticky footer is never hidden. |
| Haptics | `@capacitor/haptics` ✅ installed: add-to-cart (light), order placed (success), rider request (warning), slide-to-confirm (medium). |
| Network | `@capacitor/network` ✅ installed → `ConnectionBanner` in all apps (today only the customer app listens ✅). |
| Geolocation | Customer: `@capacitor/geolocation` for the checkout pin (D2). Rider keeps the browser `watchPosition` stream ✅ for now; plan a native background-location approach if riders lock their phones. |
| Theme | `matchMedia('(prefers-color-scheme: dark)')` for "System"; persist the user's choice. |
| Performance targets | Cold start < 2.5 s on a mid-range Android; first screen < 150 KB of JS after gzip (route-level code splitting); images lazy + Cloudinary `f_auto,q_auto`; free-tier API cold starts need a friendly "Waking up the kitchen…" loading state ✅ (mentioned in the earlier guide). |

### 15.6 Guard rails so the system stays clean

| Rule | Tool |
|---|---|
| No hex colour in `.tsx` | ESLint `no-restricted-syntax` on `/#[0-9a-fA-F]{3,8}\b/` (allow in `packages/tokens`) |
| No `confirm(`, `prompt(`, `alert(` | ESLint `no-restricted-globals` |
| No new inline `style={{…}}` except dynamic values (width %, transform) | ESLint rule + review |
| Clickable `div`s forbidden | `eslint-plugin-jsx-a11y` |
| Colours in CSS must be `var(--…)` | Stylelint `declaration-property-value-allowed-list` |
| Every component has a story in light + dark | Storybook + a11y addon |
| Visual regression at 360 × 800 and 1440 × 900, both themes | Playwright screenshots |
| Contrast pairs from §6.1 never regress | Script from Appendix C in CI |
| The repo has **no tests and no CI today** (from the earlier guide) | Add a GitHub Action: `pnpm install` → `build` → `lint` → Storybook build → axe |

---

## 16. Roadmap 🆕

Effort: **S** ≤ 1 day · **M** 2–4 days · **L** ≥ 1 week (one developer). Order matters: each phase makes the next one cheaper. **Design PRs never change API or business logic**; backend items run as separate tasks.

| Phase | Goal | Work | Effort | Done when |
|---|---|---|---|---|
| **0 · Stop the lies** | Fix what misleads users, no redesign needed | Remove default credentials from admin login (D1) · use `lineTotalPaisa` in Analytics (N1) · add `DELIVERY_FAILED` to admin filters (D10) · `/_/g` in all slug and label code (D11) · `try/catch` and error toast on customer cancel (N7) · rider map attribution (N8) · clear the rider countdown before starting a new one (D13) · block Place-order until the pin is confirmed (interim D2) | S–M | Each item verified in the running app |
| **1 · Tokens** | One source of colour, type and space | Create `@fastfood/tokens` (§15.2) · self-host Inter · light + dark sets · legacy aliases · ThemeProvider · switch admin dark palette to warm stone | M | All three apps import the package; no new hex in TSX; contrast script green |
| **2 · Primitives** | The 21 shared primitives | Button, IconButton, Field/Input, Switch, Chip, StatusBadge + status map, Dialog/BottomSheet (kills `confirm`/`prompt`), Toast, Skeleton, EmptyState, ErrorState, ConnectionBanner, Lucide icons | L | Storybook shows each in light + dark with a11y addon green |
| **3 · Customer** | The experience that earns revenue | BottomNav, Home (active-order strip, real search), Menu/Search, Product (live price, notes), Cart (keying fix, shared PriceSummary), Checkout (AddressPicker), Order placed, Orders (Active/Past), Order detail + tracker, Track | L | A new user can order in under 2 minutes; totals match in cart, checkout and order |
| **4 · Rider** | Safe and fast on a bike | Tab bar, server-synced online switch, RequestSheet + ring, active-delivery flow with slide-to-confirm, OTP + cash sheet, reason sheet, earnings layout | M–L | No irreversible action is possible with one accidental tap |
| **5 · Admin** | Kitchen speed and trust in numbers | AdminShell, Dashboard with comparisons, Order board + drawer + cancel, Menu drawer form, Riders/Customers dialogs, Analytics with table fallbacks | L | New order is noticed within 1 s; every order advances in one click |
| **6 · Quality** | Keep it good | A11y pass (§14), i18n scaffolding, visual regression, CI, publish Storybook | M | Lighthouse a11y ≥ 95 everywhere |

**Backend tasks that unlock design work** (separate PRs, listed so nothing is blocked by surprise):

1. `GET /app-config` — delivery fee, free-delivery threshold, restaurant coordinates (replaces hard-coded Rs. 100 / Rs. 1,000 and `31.5204, 74.3587`).
2. Server aggregate endpoints for dashboard and analytics (revenue by day, status counts, hourly counts, top items with `lineTotalPaisa`), including previous-period comparison (N10).
3. Saved addresses (CRUD) · ratings/feedback · promotions · estimated delivery time.
4. Rider name, phone and vehicle in the customer order payload; customer name and phone in the rider payload.
5. `orders by customer` for the admin customer drawer.
6. Confirm and, if needed, fix: `GET /users?role=` and `PATCH /users/:id` (earlier overview says not exposed), the unsettled-cash counter, and the admin `READY → RIDER_ASSIGNED` call (N5).
7. Fix the `image` vs `imageUrl` field mismatch between API and admin form (N3).

---

## 17. Issue register (merged and updated)

Severity: **H** = fix before real users · **M** = fix soon · **L** = polish. "Fixed by" points to the section of this document.

| ID | Sev | App | Finding | Evidence | Fixed by |
|---|---|---|---|---|---|
| D1 | H | Admin | Login prints default admin credentials | ✅ | §11.2 Login, Phase 0 |
| D2 | H | Customer | Delivery pin defaults to restaurant coordinates; raw lat/lng inputs | ✅ re-verified | §9.2 Checkout, §8.2 AddressPicker |
| D3 | M | Customer | Cart total includes delivery, checkout "Total (est.)" does not | ✅ re-verified | `PriceSummary` |
| D4 | M | Customer | Cart key `menuItemId:size` ignores add-ons | ✅ re-verified | §9.2 Cart |
| D5 | M | All | White on `#F97316` = 2.80 : 1 | 🧮 | §6.1 |
| D6 | M | All | Emoji as the only icon system | ✅ | §6.6 |
| D7 | M | All | `confirm()` / `prompt()` for destructive actions | ✅ re-verified | §8.1 Dialog |
| D8 | M | Admin | Heavy inline styles, repeated font family | ✅ | §15.4, §15.6 |
| D9 | M | All | No shared tokens or components; `btn-primary` has two contracts | ✅ | §15.1 |
| D10 | M | All | Status knowledge copy-pasted; admin filters omit `DELIVERY_FAILED` | ✅ re-verified | §7 |
| D11 | M | Customer, Admin | `.replace('_','-')` first underscore only | ✅ re-verified | §7.4 |
| D12 | M | Rider | `isOnline` starts `false`, not synced with server | ✅ re-verified | §10.2 Jobs |
| D13 | L | Rider | Overlapping countdown intervals | ✅ re-verified | §10.2 Request |
| D14 | M | Customer, Rider | Dead-end rows ("coming soon"), empty Earnings | ✅ | §9.2 Profile, §10.2 |
| D15 | L | Customer | Hard-coded promos; "Popular" = first 12 items | ✅ | §9.2 Home |
| D16 | L | All | Inconsistent loading UI | ✅ | `Skeleton` |
| D17 | L | All | No query-error UI; failure looks like an empty list | ✅ | `ErrorState`, §13 |
| D18 | L | Customer | Order detail shows generic 🍽️ / 🍔 per line | ✅ re-verified | §9.2 Order detail |
| D19 | M | Admin | Per-item revenue reads a field that does not exist | ✅ **confirmed (N1)** | §11.2 Analytics, Phase 0 |
| D20 | L | Admin | Page titles defined twice | ✅ | `AdminShell` route table |
| D21 | L | Admin | No visible responsive behaviour | ❓ | §6.5 |
| D22 | L | Admin | Hex literals in chart props | ✅ | §15.3 |
| D23 | L | Rider | Cash field not pre-filled; hand-rolled Rs → paisa | ✅ | §10.2 Active delivery |
| D24 | L | Customer, Rider | Public OSM tiles used directly | ✅ | §6.6 |
| D25 | L | Customer | Password minimum differs (login 6, signup 8) | 🟡 from the earlier guide | §9.2 Login |
| D26 | L | Rider | Login uses different label/error classes; no password error | 🟡 from the earlier guide | §10.2 Login |
| N1 | M | Admin | Top-item revenue always Rs. 0 (`totalPaisa` vs `lineTotalPaisa`) | ✅ | Phase 0 |
| N2 | L | Customer | `item.color` never exists, all tiles peach | ✅ | §6.1 category tints |
| N3 | M | Admin | `imageUrl` vs `image` mismatch | 🟡 | Backend task 7 |
| N4 | M | Admin | No UI to cancel an order the server lets admin cancel | ✅ | §7.2, §11.2 |
| N5 | M | Admin, Rider | First-come assignment, but admin "Assign" has no picker or waiting state | ✅ / 🟡 | §11.2 Orders |
| N6 | M | Rider | One-tap "delivery failed" with a fixed note | ✅ | §10.2, §8.1 |
| N7 | M | Customer | Cancel has no error handling | ✅ | Phase 0 |
| N8 | M | Rider | Map tiles without attribution | ✅ | Phase 0 |
| N9 | L | Customer | Payment is a one-option list (COD only) | ✅ | §9.2 Checkout |
| N10 | M | Admin | Shared query key with different limits; stats computed client-side from a slice | ✅ | §11.2, Backend task 2 |
| N11 | L | Rider | `/riders/dashboard` fetched but not visibly rendered | ✅ / ❓ | §10.2 Jobs |
| N12 | L | Admin | "Heatmap" is a bar chart | ✅ | §11.2 Analytics |

---

## 18. Decisions needed from the owner

| # | Decision | Recommendation | Affects |
|---|---|---|---|
| 1 | Approve the **action colour** Ember `#C2410C` for buttons and links (keep `#F97316` as the bright accent) | Approve. The alternative, keeping `#F97316` buttons, needs dark text on them (6.24 : 1) and looks heavier. | §6.1 |
| 2 | Admin default theme | Keep **dark** by default, add light and a system option | §11.1 |
| 3 | Rider assignment model | Keep first-come broadcast (what the server does ✅). Decide whether admin may also pick a rider manually. | §11.2 Orders |
| 4 | Delivery fee and free-delivery threshold | Move to server config (`/app-config`) | §9.2 Cart |
| 5 | Urdu in version 1 or later | Later, but build the scaffolding now (§12.4) | §12.4 |
| 6 | Emoji policy | Food emoji stay as data; UI chrome moves to SVG | §6.6 |
| 7 | Payments | Cash on delivery only for now; reserve the payment slot in the UI | §9.2 Checkout |
| 8 | Map tiles | Choose a keyed provider before real traffic (OpenStreetMap's public servers have a usage policy) | §6.6 |
| 9 | Ratings and promotions | Optional for v1; the layout reserves the space | §9.2 |
| 10 | Admin sound alerts | On by default with a visible toggle | §11.1 |
| 11 | Name and logo | Keep FastFood; commission the vector mark | §5.1 |

---

## Appendix A — What was read, and how

**Uploaded documents:** `DESIGN_OVERVIEW.md` (577 lines) and `FASTFOOD_DESIGN_SYSTEM_AND_DEV_GUIDE.md` (849 lines), both written against commit `51785e2`.

**Graphify (repository `Ahsan3727/fast-food-management-system`, index 2026-10-20 22:04 UTC, commit `51785e2`, status *ready*)** — queries run for this document:

| Question asked | Files that answered it |
|---|---|
| CSS / stylesheet nodes | `vite-env.d.ts` × 3 only (confirms `.css` is not indexed) |
| BottomNav items, `STATUS_STEPS`, order detail, cart, product, orders list | `BottomNav.tsx`, `OrderDetailScreen.tsx`, `OrdersScreen.tsx`, `ProductDetailScreen.tsx`, `CartScreen.tsx`, `HomeScreen.tsx`, `TrackOrderScreen.tsx`, `order.schema.ts` |
| Admin `TRANSITIONS`, `STATUSES`, `NAV`, dashboard | `OrdersPage.tsx`, `Sidebar.tsx`, `DashboardPage.tsx`, `order.state-machine.ts`, `orders.controller.ts` |
| Rider dashboard and active-order screens, `riderAccept` | `DashboardScreen.tsx`, `OrderAssignedScreen.tsx`, `orders.service.ts` |
| Checkout and Analytics bodies, money helpers | `CheckoutScreen.tsx`, `AnalyticsPage.tsx`, `money.ts` |
| Menu, category, payment and socket schemas | `menu.schema.ts`, `seed.mjs`, `schemas.ts`, `enums.ts`, `MenuPage.tsx` |

Other repositories in the same Graphify workspace (`RiderApp`, `WholesalerApp`, `groxo`, the *Groxo Software* workspace) were **not** used: they are separate projects.

## Appendix B — Still unverified: open these files

| Unknown | File |
|---|---|
| Current token values, customer/rider font, shadows, badge colours, skeleton animation | `apps/*/src/index.css` and every `*.module.css` |
| `viewport-fit`, theme-color, safe-area handling | `apps/*/index.html` |
| App name, ID, launcher icon, splash and status-bar settings | `apps/*/capacitor.config.*`, `apps/*/android/app/src/main/res` |
| Remaining tracker steps, `BottomNav` items, admin `NAV` entries | `OrderDetailScreen.tsx` L7–15, `BottomNav.tsx` L7–12, `Sidebar.tsx` L5–12 |
| Rider Dashboard second half and Order-assigned second half | `DashboardScreen.tsx`, `OrderAssignedScreen.tsx` |
| Checkout payment block, Menu item form, Analytics top-items rendering | `CheckoutScreen.tsx`, `MenuPage.tsx`, `AnalyticsPage.tsx` |
| What the admin `READY → RIDER_ASSIGNED` PATCH does on the server | `orders.service.ts` (status update path) |
| Admin behaviour below 1024 px | global CSS media queries |

## Appendix C — Contrast check (re-run in CI)

```js
// scripts/contrast.mjs — WCAG relative luminance
const lin = c => (c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const lum = hex => { const [r, g, b] = hex.replace('#','').match(/../g).map(h => parseInt(h, 16));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); };
export const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

// pairs that must never fall below their minimum
const pairs = [
  ['#FFFFFF', '#C2410C', 4.5], // white on action (light)
  ['#1C1917', '#F97316', 4.5], // ink on flame (dark action)
  ['#57534E', '#FFFFFF', 4.5], // text-muted on surface (light)
  ['#78716C', '#FFFFFF', 4.5], // text-subtle on surface (light)
  ['#A8A29E', '#1C1917', 4.5], // text-subtle on surface (dark)
  ['#78716C', '#FFFFFF', 3.0], // border-strong (light)
  ['#78716C', '#1C1917', 3.0], // border-strong (dark)
  ['#1D4ED8', '#FFFFFF', 3.0], // focus ring (light)
];
for (const [fg, bg, min] of pairs) if (ratio(fg, bg) < min) throw new Error(`${fg} on ${bg} < ${min}`);
```

## Appendix D — Glossary

| Term | Meaning |
|---|---|
| **Paisa** | 1/100 of a rupee. All money in the API and database is an integer number of paisa; the UI shows `Rs.` |
| **COD** | Cash on delivery — the only payment method today ✅ |
| **OTP** | The one-time code the customer reads to the rider to complete a delivery ✅ |
| **Token** | A named design value (colour, space, radius) used instead of a raw number |
| **Tone** | One of ten colour families used for order statuses (§6.1) |
| **Tile / tint** | The coloured square behind a food photo or emoji |
| **Board** | The kanban view of orders in the admin (New → Preparing → Ready → With rider) |
| **Graphify** | The code-graph tool connected to this repository; it indexes TypeScript, not CSS |

---

*End of document. Keep §6–§8 and §15 in sync with the code whenever a token, component or status changes, and update §17 when an issue is fixed.*
