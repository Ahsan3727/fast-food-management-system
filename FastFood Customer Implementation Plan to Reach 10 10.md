# FastFood Customer App: Implementation Plan to Reach 10/10

**Scope:** `apps/customer` only. **Target:** mobile-first, Ember Design System compliant, accessible, production-quality ordering experience. **Prepared:** 23 October 2026.

**Tags:** **\[Verified\]** read directly in code. **\[Verify\]** depends on runtime / API behaviour. **\[New\]** proposed change. **WP** = work package; every WP ends with a concrete check.

---

## 1. Summary

- The customer app is **~7,900 lines** across 12 screens, 4 components, 2 stores, 4 lib files, and 2 stylesheets — a genuine working MVP. **\[Verified\]**
- `tokens.css` (176 lines) is good: it defines the Ember Scale plus dark-theme overrides. However `globals.css` (117 lines) **re-declares 12 semantic tokens with raw hex values** that override the token file's semantic roles. This means every screen that uses `var(--primary)` or `var(--bg)` is running the `globals.css` colour, not the token-file colour — breaking dark-mode entirely on most surfaces. **\[Verified\]**
- Screens are mostly written in **inline `style={{ }}`** objects (e.g. HomeScreen ~350 lines of inline style). Tokens referenced in inline styles include both the correct `var(--action)` and the legacy `var(--primary)`, `var(--muted)`, `var(--subtle)`, `var(--sunken)`, `var(--ok)`, `var(--bad)` — none of which are defined in `tokens.css`. The app silently falls back to transparent/initial. **\[Verified\]**
- Twelve additional issues were found beyond styling (section 3). Three are critical before shipping: the `globals.css` colour override breaks dark mode (B1), undefined CSS tokens render as empty (B2), and `OrderDetailScreen` uses `window.prompt()` for cancellation reason input (B3).
- **13 work packages, WP0–WP12.** Estimated effort: ~11 developer-days for one person.
- One dimension (Checkout map) requires Leaflet; section 8 gives the API coordinate contract so the map can centre properly.

---

## 2. How the code was analysed

| Source | What it gave | What it could not give |
|---|---|---|
| `apps/customer/src/` (all files read) | Full bodies of all 12 screens, 4 components, 2 stores, `api.ts`, `tokens.css`, `globals.css`, `main.tsx`, `App.tsx`, `vite.config.ts`, `index.html`, `package.json` | Runtime rendering, dark-mode visual outcome, API response shape |
| `tokens.css` vs `globals.css` | Exact list of re-declared and missing tokens | Whether CSS custom property inheritance resolves correctly at runtime |
| `customer-demo.html` (reference design) | Visual intent, colour usage, component patterns, layout rhythm | N/A (design reference only) |

---

## 3. Findings beyond the design spec

| ID | Finding | Evidence | Fixed in |
|---|---|---|---|
| B1 | **`globals.css` clobbers `tokens.css`.** `globals.css` `:root {}` re-declares `--bg`, `--surface`, `--border`, `--text`, `--text-muted`, `--danger`, `--success`, `--radius`, `--radius-sm`, `--shadow`, `--shadow-md`, `--safe-top`, `--safe-bottom` with raw hex values. These overwrite the semantic roles and are never overridden by `[data-theme='dark']`. Dark mode does not work on any screen. | `globals.css` L3-22; `tokens.css` L59-104 | WP2 |
| B2 | **~8 undefined tokens in inline styles.** Screens reference `var(--muted)`, `var(--subtle)`, `var(--sunken)`, `var(--action)`, `var(--ok)`, `var(--bad)`, `var(--raised)`, `var(--strong)` — none defined in `tokens.css`. Elements fall back to `initial`, making some invisible. | HomeScreen, CartScreen, TrackOrderScreen, ProfileScreen | WP2 |
| B3 | **`OrderDetailScreen` uses `window.prompt()` for cancel reason.** Forbidden on iOS WKWebView (Capacitor). Blocks the main thread and is not styleable. | `OrderDetailScreen.tsx` L111-114 | WP7 |
| B4 | **Duplicate refresh race on boot.** `App.tsx` calls `/auth/refresh` directly while the `api.ts` interceptor also handles 401→refresh. On reload, both fire simultaneously with the same refresh token. | `App.tsx` L34-43; `api.ts` L22-61 | WP1 |
| B5 | **`BottomNav` runs an independent `/orders/my` query** with `staleTime: 15_000`, separate from all screens' `staleTime: 10_000`. Same key, different config = duplicate polling bursts. | `BottomNav.tsx` L28-32 | WP4 |
| B6 | **`SearchScreen` is a stub.** 2,024 bytes; renders nothing useful. Linked in the router but the nav does not have a search tab. | `SearchScreen.tsx`; `App.tsx` L55 | WP8 |
| B7 | **`CheckoutScreen` map is a fake SVG.** Three strokes on a `300×200` viewBox labelled "Interactive Pin". GPS button updates hidden form fields but does not move the visual map. | `CheckoutScreen.tsx` L184-252 | WP9 |
| B8 | **Saved-address chips are hard-coded strings.** "House 14, Street 6, Gulberg III" and "Office 3B, MM Alam Road" are static, not from user profile. | `CheckoutScreen.tsx` L337-375 | WP9 |
| B9 | **Loading skeletons are plain grey boxes, not shimmer.** `HomeScreen`, `MenuScreen`, `OrdersScreen` all render `opacity: 0.5` divs. The `.skeleton` shimmer class from `globals.css` is never applied. | `HomeScreen.tsx` L246-259 | WP5 |
| B10 | **`ProductDetailScreen` loading state is the text "Loading details..."** — no skeleton. | `ProductDetailScreen.tsx` L25-39 | WP6 |
| B11 | **`BottomNav` is `position: sticky`, not `position: fixed`.** In mobile Safari flex columns, `sticky` can detach from the viewport edge. Needs to be `fixed` with `env(safe-area-inset-bottom)`. | `BottomNav.tsx` L48 | WP3 |
| B12 | **Login/Signup mixes `Auth.module.css` with global `.input` / `.btn-primary`** that use `var(--primary)` (raw hex in `globals.css` `:root`, broken in dark mode). | `LoginScreen.tsx` L8, L49-69 | WP10 |
| B13 | **`index.html` has raw hex in an inline `<style>`** (`background: #fafaf9; color: #1c1917`). Not overridden for dark mode before React mounts → flash of light theme. | `index.html` L13-17 | WP0 |
| B14 | **`ProfileScreen` uses `var(--strong)`** for the toggle inactive background. `--strong` is not defined in `tokens.css`. Toggle visually broken in light mode. | `ProfileScreen.tsx` L160 | WP2 |
| B15 | **No route transition animation.** Navigating between screens is instant. The demo design shows a slide-up / fade-in page transition. | All screens | WP3 |

---

## 4. Target structure and rules

```
apps/customer/src/
  app/            router.tsx (lazy routes + PrivateRoute), providers.tsx, guards.tsx
  api/            client.ts (single-flight refresh), menu.ts, orders.ts, users.ts, queryKeys.ts
  store/          auth.store.ts, cart.store.ts, ui.store.ts
  styles/         tokens.css  ← only file with colour values
                  globals.css ← layout, reset, animation ONLY; zero colour values
                  motion.css  ← keyframes (shimmer, slideUp, fadeIn, pagePop)
  components/     BottomNav.tsx, CartBar.tsx, Icon.tsx, StatusBadge.tsx
                  Skeleton.tsx, SkeletonCard.tsx, EmptyState.tsx
                  QuantityStepper.tsx, CancelSheet.tsx, AddressSheet.tsx
  screens/        (unchanged routes, improved implementations)
  lib/            api.ts, lifecycle.ts, platform.ts, push.ts
```

**Rules every change must follow:**

1. Colours live **only** in `tokens.css`. No raw hex anywhere else. No re-declared token.
2. Inline `style={{ }}` may only hold **runtime values** (e.g. `width: \`${pct}%\``). All structural styles go in CSS classes.
3. Every token referenced in a screen must exist in `tokens.css` (verified by grep before merge).
4. Every interactive element is a real `<button>` or `<a>` with `aria-label` or visible text.
5. `BottomNav` is `position: fixed` with `padding-bottom: env(safe-area-inset-bottom)`.
6. Every data view ships four states: **loading** (shimmer skeleton), **empty** (illustrated callout), **error** (retry button), **success** (content).
7. No `window.alert`, `window.confirm`, or `window.prompt`. Use a `<dialog>` bottom sheet.
8. The cart store's `name: 'fastfood-cart'` key must not change (breaks existing persisted carts).

---

## 5. Work packages (WP0–WP5: foundation)

### WP0 — Guardrails & baseline (0.5 day)

**Goal:** block regressions from day 1.

- `index.html`: remove the inline `<style>` block (B13). Add a small `<script>` before React that reads `localStorage.getItem('ember_customer_theme')` and sets `document.documentElement.setAttribute('data-theme', value ?? 'light')` — eliminates FOUC.
- `package.json`: add scripts `"typecheck": "tsc --noEmit"`, `"check:tokens": "node scripts/check-tokens.mjs"`. Add `scripts/check-tokens.mjs` that greps `src/` for any CSS token reference (`var(--...)`) and checks it exists in `tokens.css`; prints each missing token with file + line; exits 1 on any miss.
- `vite.config.ts`: `base: './'` is correct and must stay (required for Capacitor APK). Document this in a comment.
- Add ESLint with `jsx-a11y/recommended`; add `"lint": "eslint src --ext ts,tsx"` to scripts.
- **Done when:** `pnpm typecheck` and `pnpm check:tokens` both exit 0 against the current code with a documented baseline of known violations.

---

### WP1 — Session & auth hardening (0.5 day; B4)

**Goal:** one refresh path, no race condition.

- `App.tsx` boot effect: remove the direct `api.post('/auth/refresh')` call. Call a `bootSession()` function in `src/api/client.ts` that: (a) if no `refreshToken` stored → call `logout()` and return; (b) call the single-flight `refreshAccessToken()` already in the interceptor, await it, then call `/users/me`; (c) catch → `logout()`.
- The app renders a splash `<div>` (logo + spinner) while `status === 'booting'`. No query runs until `status === 'ready'`.
- `auth.store.ts`: add `status: 'booting' | 'ready'`. Persist only `refreshToken` and `user` — not `isAuthenticated` (B4).
- `PrivateRoute`: read `status`; if `'booting'` render `null`; if `'ready'` and no token → redirect `/login`; otherwise render children.
- **Done when:** a reload of a protected route makes exactly one `/auth/refresh` HTTP call; ten simultaneous 401s make exactly one refresh; a logout clears the store and navigates to `/login`.

---

### WP2 — Token cleanup & dark mode (1 day; B1, B2, B14)

**Goal:** `check:tokens` exits 0; dark mode works on all screens.

**`globals.css`**: delete the entire `:root {}` colour block (lines 3–22). Keep only layout, reset, utility classes and animations. Convert all remaining colour values in `.btn-primary`, `.input`, `.label`, `.error-text`, `.bottom-nav`, `.status-badge` to token references. Net result: **zero raw hex values** in `globals.css`.

**`tokens.css` additions** — add the 8 missing alias tokens screens use:

```css
/* Aliases for screens using legacy names */
--muted:   var(--text-muted);
--subtle:  var(--text-subtle);
--sunken:  var(--bg-sunken);
--action:  var(--action-bg);
--ok:      var(--success);
--bad:     var(--danger);
--raised:  var(--bg-raised);
--strong:  var(--stone-300);   /* toggle track inactive, light theme */
```

In `[data-theme='dark']`:
```css
--strong: var(--stone-600);
```

**`motion.css`** (new file):
```css
@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
@keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
@keyframes pagePop { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }

@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

Import `motion.css` in `main.tsx`.

**Done when:** `check:tokens` shows 0 missing tokens; switching theme in ProfileScreen visually updates all surfaces to dark stone colours.

---

### WP3 — Layout, safe areas & bottom nav (0.5 day; B11, B15)

**Goal:** native-feel navigation and safe area behaviour.

- **`BottomNav.tsx`**: change `position: sticky` → `position: fixed; bottom: 0; left: 0; right: 0`. Height stays 56px. Add `padding-bottom: env(safe-area-inset-bottom, 0px)`. All screen wrapper divs that currently set `minHeight: '100vh'` must add a `.page-wrap` CSS class with `padding-bottom: calc(56px + env(safe-area-inset-bottom, 0px))`.
- **Route transition**: add `PageTransition` wrapper component that applies the `pagePop` animation on mount (from `motion.css`). Wrap the `<Routes>` output in `App.tsx` with it.
- **`CartBar.tsx`**: verify it stays 56px above BottomNav after the fixed positioning change (it currently uses `bottom: 56px` — keep this value).
- **Done when:** bottom nav stays pinned when scrolling on an iOS Safari emulator; a page change shows a subtle fade-in transition.

---

### WP4 — Query normalisation (0.5 day; B5)

**Goal:** one source of truth per query; no duplicate polling.

Create `src/api/queryKeys.ts`:

```ts
export const QK = {
  categories:  ['categories'] as const,
  menu:        (catId?: string) => ['menu', catId ?? ''] as const,
  menuItem:    (id: string)    => ['menu-item', id] as const,
  myOrders:    ['my-orders'] as const,
  order:       (id: string)    => ['order', id] as const,
  orderOtp:    (id: string)    => ['order-otp', id] as const,
  profile:     ['profile'] as const,
};
```

Replace all inline query key arrays in every screen and `BottomNav.tsx` with `QK.*`.

**`BottomNav.tsx`**: remove the independent `/orders/my` query. Read from `useQueryClient().getQueryData(QK.myOrders)` if it exists; otherwise show no dot. This eliminates the duplicate polling. If a guarantee is needed, elevate to a shared context in `providers.tsx` with `refetchInterval: 30_000`.

**Done when:** browser Network tab shows one `GET /orders/my` per polling cycle, not two.

---

### WP5 — Skeleton loading system (0.5 day; B9)

**Goal:** every screen shows shimmer skeletons, not plain grey boxes.

Create `src/components/Skeleton.tsx`:

```tsx
export function Skeleton({ h, w, r = 'var(--r-sm)' }: {
  h: number | string; w?: number | string; r?: string;
}) {
  return <div className="skeleton" style={{ height: h, width: w ?? '100%', borderRadius: r }} />;
}
```

Create `src/components/SkeletonCard.tsx` for the 2-column menu grid card:

```tsx
export function SkeletonCard() {
  return (
    <div style={{ padding: 8, background: 'var(--bg-surface)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)' }}>
      <Skeleton h={120} r="var(--r-md)" />
      <div style={{ marginTop: 8 }}>
        <Skeleton h={14} w="80%" />
        <Skeleton h={12} w="50%" r="var(--r-xs)" />
      </div>
    </div>
  );
}
```

Replace all loading states in `HomeScreen`, `MenuScreen`, `OrdersScreen`, `ProductDetailScreen` with proper shimmer skeletons.

**Done when:** all four screens show pulsing shimmer skeletons during data fetch (test by throttling network to Slow 3G in Chrome DevTools).

---

## 6. Work packages (WP6–WP9: screen upgrades)

### WP6 — Product Detail Screen (1 day; B10)

**Goal:** production-quality product page with skeleton loading.

**Current issues:**
- Loading state is plain text "Loading details..." (B10).
- `notes` field is collected but `CartItem` has no `notes` property — silently dropped.
- Unavailable items show `cursor: not-allowed` but no visual overlay.

**Changes:**
- Replace text loading state with a skeleton: full-width `Skeleton` for the hero image area (`aspectRatio: '16/10'`), then paragraph skeletons for name, description, size options.
- Add `notes?: string` to `CartItem` interface in `cart.store.ts`. Pass `notes` in `handleAdd()`. Store it on the cart item for display in CartScreen. (Do not add to the API payload — the server ignores it; it is customer-visible only.) **\[Verify API\]**
- On sold-out items: add a semi-transparent overlay div over the hero with `Currently Unavailable` text in `var(--text-muted)`.
- Add `role="radiogroup"` + `aria-label="Select size"` to the sizes section; each size button gets `role="radio"` + `aria-checked={isSelected}`.
- Add-ons section: `role="group"` + `aria-label="Select add-ons"`; each add-on button gets `role="checkbox"` + `aria-checked={isSelected}`.
- **Done when:** page shows shimmer on load; sold-out overlay is visible; keyboard can tab through size and add-on options and activate them with Space.

---

### WP7 — Order Detail Screen redesign (1.5 days; B3)

**Goal:** replace `window.prompt()` with a bottom sheet; align with `TrackOrderScreen` quality.

**Current issues:**
- Uses `window.prompt()` for cancel reason (B3 — broken on iOS Capacitor).
- Uses CSS module classes inconsistently with all other screens.
- Status tracker emoji dots are not accessible (invisible in dark mode as black text).
- Cancel button calls `navigate('/orders')` without awaiting the API — may navigate before the request completes.

**Changes:**
- Extract `CancelSheet` component (`src/components/CancelSheet.tsx`): a `<dialog>` bottom sheet with the same 4 reason options as `TrackOrderScreen` (`Changed my mind`, `Ordered by mistake`, `Taking too long`, `Other`), plus `Keep Order` / `Confirm Cancel` CTA pair. Use `showModal()` / `close()` for native accessibility.
- Replace `window.prompt()` with `<CancelSheet>`. Wire the mutation (`api.post('/orders/:id/cancel')`) through `useMutation`; on success, invalidate `['order', id]` and navigate.
- Migrate from CSS module to token-based inline styles (matching other screens).
- Replace emoji dots (`📋 ✅ 👨‍🍳`) with `<Icon>` component. Use `data-tone` attribute on the dot background for semantic colour.
- Derive `isActive` from `STATUS_META[order.status as OrderStatus]?.isActive` (shared-types, already imported in OrdersScreen).
- Add `role="alert"` to the cancelled banner.
- **Done when:** Cancel button opens the bottom sheet (not a browser prompt); Keep Order closes it; Confirm Cancel fires the mutation with the chosen reason.

---

### WP8 — Search Screen (0.5 day; B6)

**Goal:** implement a real, functional search screen.

**Current state:** essentially empty (2,024 bytes).

**Changes:**
- Render a focused text input on mount (`autoFocus`).
- Debounce input (300 ms) with `useState` + `useEffect`.
- Query `QK.menu(query)` with `enabled: query.trim().length > 1`. If the API does not support `?search=`, use client-side filtering identical to `MenuScreen`'s `filteredItems` approach. **\[Verify API A4\]**
- Show `<Skeleton>` list while loading; show items in the same row format as `MenuScreen` (thumbnail + name + price + quick-add button).
- Empty state: `<EmptyState icon="search" title="No results" description={'Nothing matches "' + query + '"'} />`.
- The search input gets `aria-label="Search menu"` and `role="searchbox"`.
- **Done when:** typing "burger" returns burger items within 500 ms; clearing the input shows an empty state with a prompt to start typing.

---

### WP9 — Cart & Checkout (2 days; B7, B8)

**Goal:** real Leaflet map for delivery pin; real saved address support.

#### CartScreen
**After WP2:** all `var(--action)` references resolve correctly via the alias. No code change needed for colours.

**Additions:**
- Add haptic feedback on quantity change: `import { Haptics, ImpactStyle } from '@capacitor/haptics'; Haptics.impact({ style: ImpactStyle.Light })` in `updateQuantity`. No-op on web; works natively in the APK.
- Replace `window.confirm('Clear all items...')` (currently in CartScreen L112) with a `<CancelSheet>`-style `<dialog>` asking "Remove all items?" with `Cancel` / `Clear Cart` buttons.

#### CheckoutScreen
**Changes:**
- Replace the fake SVG map with a real `<MapContainer>` (Leaflet + react-leaflet — both already installed). Centre on `[lat, lng]` from form state. Place a single draggable `<Marker>`. On `dragend`, read `marker.getLatLng()` and call `setValue('lat', ...)` + `setValue('lng', ...)`.
- Saved addresses: query `QK.profile`. If `user.savedAddresses[]` exists in the API response, render them as chips. Otherwise: add a `"Save this address"` checkbox that writes to `localStorage` under key `fastfood-saved-addresses-{userId}` as `{ label: 'Home' | 'Work', addressLine, landmark, lat, lng }[]`. Render up to 3 saved addresses as chips. **\[Verify API A1\]**
- Extract `AddressSheet` component (`src/components/AddressSheet.tsx`): a bottom sheet with the address textarea, landmark input, and GPS button. Activated by an "Enter address" trigger button, not an inline form.
- **Done when:** dragging the Leaflet marker updates the lat/lng form fields (verify in DevTools `application > local state`); placing an order uses the dragged coordinates (confirm in Network tab request body).

---

## 7. Work packages (WP10–WP12: polish)

### WP10 — Login & Signup screens (1 day; B12)

**Goal:** brand-quality auth experience.

**Current issues:**
- Hero is a `🍔` emoji — not a brand asset.
- No password reveal toggle.
- No `enterKeyHint` on inputs.
- `globals.css` `.input` and `.btn-primary` classes still use raw colours until WP2 — WP2 fixes this.

**Changes:**
- Replace the emoji hero with a brand lockup: an inline SVG circle with an orange radial gradient fill and `FF` white monogram text, plus `FastFood` brand name in `fontWeight: 800`. No external image request.
- Add password reveal toggle: `<button type="button" aria-label="Show password">` with `<Icon name="eye">` / `<Icon name="eye-off">` that toggles `input type` between `"password"` and `"text"`.
- Add `enterKeyHint="next"` on the identifier input; `enterKeyHint="done"` on password.
- `SignupScreen`: same hero treatment. Add confirm-password field with `validate: v => v === watch('password') || 'Passwords must match'`.
- Convert `Auth.module.css` to use token variables only; remove any raw hex.
- **Done when:** login and signup screens render correctly in dark mode; password toggle works on both web and Android; keyboard shows "Next" on the identifier field on a physical device.

---

### WP11 — Profile Screen & theme persistence (0.5 day; B14)

**Goal:** working theme toggle; unified persistence; richer profile.

**Current issues:**
- `var(--strong)` undefined (B14 — fixed in WP2).
- Theme persistence logic is split between `ProfileScreen` (`useState` + `useEffect`) and `index.html` (inline script). Two independent copies can desync.

**Changes:**
- Create `src/store/ui.store.ts`:
  ```ts
  interface UiState {
    theme: 'light' | 'dark';
    setTheme: (t: 'light' | 'dark') => void;
  }
  export const useUiStore = create<UiState>()(
    persist(
      (set) => ({
        theme: 'light',
        setTheme: (theme) => {
          set({ theme });
          document.documentElement.setAttribute('data-theme', theme);
        },
      }),
      { name: 'ember_customer_theme' },
    ),
  );
  ```
- `ProfileScreen`: replace local `useState` + `useEffect` + `localStorage` with `useUiStore`.
- `index.html` inline script: read `JSON.parse(localStorage.getItem('ember_customer_theme') ?? '{}')?.state?.theme ?? 'light'` and apply to `data-theme` before paint.
- Add a `Notifications` row in profile that calls `push.ts`'s `requestPushPermission()`.
- **Done when:** refreshing the page after enabling dark mode keeps dark mode; zero flash of light theme.

---

### WP12 — Accessibility & polish pass (1 day)

**Goal:** screen-reader navigable; keyboard operable; motion-safe.

**Per-screen checklist:**

| Screen | Required changes |
|---|---|
| HomeScreen | `role="feed"` on the menu grid; each card `aria-label="{name}, {price}"`. Active order strip: `role="status"`. |
| MenuScreen | Category pill row: `role="group"` + `aria-label="Filter by category"`. Selected pill: `aria-pressed="true"`. |
| CartScreen | Stepper buttons: `aria-label="Decrease quantity of {item.name}"` / `aria-label="Increase quantity of {item.name}"`. Clear uses bottom sheet (WP9). |
| CheckoutScreen | `<form aria-label="Delivery checkout">`. Address inputs: `id` + `<label htmlFor>`. Map div: `aria-hidden="true"` (decorative; text field carries the real address). |
| TrackOrderScreen | Progress stepper: `role="list"`, each step `role="listitem"`, current step `aria-current="step"`. Map div: `aria-hidden="true"`. OTP card: `aria-live="polite"`. |
| OrderDetailScreen | Status tracker: same pattern as TrackOrderScreen. Cancelled banner: `role="alert"`. |
| OrdersScreen | Segmented control: `role="tablist"`, each button `role="tab"` + `aria-selected`. Each order card: `role="article"`. |
| BottomNav | Active item: `aria-current="page"`. |
| LoginScreen | `role="main"` on the page; `autoComplete="username"` on identifier; `autoComplete="current-password"` on password. |
| ProfileScreen | Theme toggle: `role="switch"` + `aria-checked={theme === 'dark'}`. |
| ProductDetailScreen | Sizes: `role="radiogroup"` + each button `role="radio"` + `aria-checked`. Add-ons: `role="group"` + each button `role="checkbox"` + `aria-checked`. |
| SearchScreen | `autoFocus` on input; empty state uses `role="status"` live region. |

**Global focus style** — add to `globals.css`:
```css
:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; border-radius: 4px; }
```

**Done when:** axe DevTools browser extension reports 0 critical violations on HomeScreen, CartScreen, and CheckoutScreen.

---

## 8. API contracts needed

| # | Need | Contract |
|---|---|---|
| A1 | Saved addresses | `GET /users/me` → `user.savedAddresses: [{ label: string; addressLine: string; landmark?: string; lat: number; lng: number }]`. If not available, WP9 implements localStorage fallback. |
| A2 | Delivery coordinates in order | `GET /orders/:id` → `order.deliveryAddress.lat` and `order.deliveryAddress.lng` must be present (non-null) for TrackOrderScreen's Leaflet map to centre correctly. Currently assumed truthy — verify. |
| A3 | OTP response shape | `GET /orders/:id/otp` returns a plain string or `{ otp: string }`. Code handles both. Confirm the server never returns `{ code: string }` or another shape. |
| A4 | Menu search query param | `GET /menu?search=<q>` — confirm this param is supported. If not, WP8 uses client-side filter (same as MenuScreen). |

---

## 9. Work package schedule

| WP | Name | Days | Depends on | Milestone |
|---|---|---|---|---|
| WP0 | Guardrails | 0.5 | — | M1: CI runs |
| WP1 | Session hardening | 0.5 | WP0 | M1 |
| WP2 | Token cleanup + dark mode | 1.0 | WP0 | M1 — ship as release 1 |
| WP3 | Layout + transitions | 0.5 | WP2 | M2 |
| WP4 | Query normalisation | 0.5 | WP1 | M2 |
| WP5 | Skeleton system | 0.5 | WP2 | M2 — ship as release 2 |
| WP6 | Product Detail | 1.0 | WP5 | M3 |
| WP7 | Order Detail | 1.5 | WP5, WP3 | M3 |
| WP8 | Search Screen | 0.5 | WP5 | M3 |
| WP9 | Cart + Checkout | 2.0 | WP4, WP5 | M3 — ship as release 3 |
| WP10 | Login + Signup | 1.0 | WP2 | M4 |
| WP11 | Profile + theme | 0.5 | WP2 | M4 |
| WP12 | Accessibility | 1.0 | all above | M4 — ship as release 4 |
| **Total** | | **~11 days** | | |

---

## 10. Verification gates

Every WP is **done only when all applicable gates pass**:

| Gate | Command / Check |
|---|---|
| G0 — TypeScript | `pnpm typecheck` exits 0 |
| G1 — Token scan | `pnpm check:tokens` exits 0 (0 undefined tokens) |
| G2 — No raw hex outside tokens | `grep -rn '#[0-9a-fA-F]\{3,6\}' src/` returns only `tokens.css` |
| G3 — No native dialogs | `grep -rn 'window\.prompt\|window\.alert\|window\.confirm' src/` returns 0 |
| G4 — Dark mode visual | Toggle dark in ProfileScreen → all surfaces use `--stone-900/950` backgrounds |
| G5 — BottomNav fixed | Scroll HomeScreen to bottom → nav stays pinned at viewport edge |
| G6 — Single refresh call | Hard-reload an authenticated page → exactly 1 `POST /auth/refresh` in Network tab |
| G7 — Leaflet map in checkout | CheckoutScreen: map tiles load; drag marker → lat/lng form fields update |
| G8 — Axe a11y | 0 critical violations on HomeScreen, CartScreen, CheckoutScreen |
| G9 — Build size | `pnpm build` → main JS chunk < 200 KB gzipped |

---

## 11. Files to create or modify per WP

| File | WP | New? |
|---|---|---|
| `index.html` | WP0 | — |
| `package.json` | WP0 | — |
| `scripts/check-tokens.mjs` | WP0 | ✓ |
| `src/app/router.tsx` | WP1, WP3 | ✓ |
| `src/app/providers.tsx` | WP1 | ✓ |
| `src/api/client.ts` | WP1 | ✓ (refactor of `lib/api.ts`) |
| `src/api/queryKeys.ts` | WP4 | ✓ |
| `src/store/auth.store.ts` | WP1 | — |
| `src/store/ui.store.ts` | WP11 | ✓ |
| `src/styles/tokens.css` | WP2 | — |
| `src/styles/globals.css` | WP2 | — |
| `src/styles/motion.css` | WP2 | ✓ |
| `src/main.tsx` | WP2 | — |
| `src/components/BottomNav.tsx` | WP3, WP12 | — |
| `src/components/Skeleton.tsx` | WP5 | ✓ |
| `src/components/SkeletonCard.tsx` | WP5 | ✓ |
| `src/components/EmptyState.tsx` | WP5 | ✓ |
| `src/components/CancelSheet.tsx` | WP7 | ✓ |
| `src/components/AddressSheet.tsx` | WP9 | ✓ |
| `src/screens/HomeScreen.tsx` | WP5, WP12 | — |
| `src/screens/MenuScreen.tsx` | WP5, WP12 | — |
| `src/screens/OrdersScreen.tsx` | WP5, WP12 | — |
| `src/screens/ProductDetailScreen.tsx` | WP6, WP12 | — |
| `src/screens/OrderDetailScreen.tsx` | WP7, WP12 | — |
| `src/screens/SearchScreen.tsx` | WP8 | — |
| `src/screens/CartScreen.tsx` | WP9, WP12 | — |
| `src/screens/CheckoutScreen.tsx` | WP9, WP12 | — |
| `src/screens/LoginScreen.tsx` | WP10 | — |
| `src/screens/SignupScreen.tsx` | WP10 | — |
| `src/screens/Auth.module.css` | WP10 | — |
| `src/screens/ProfileScreen.tsx` | WP11, WP12 | — |
| `src/screens/TrackOrderScreen.tsx` | WP12 | — |

---

## 12. What this plan does not touch

- `src/lib/lifecycle.ts`, `src/lib/platform.ts`, `src/lib/push.ts` — Capacitor platform code; outside design scope.
- `apps/customer/android/` — native Android project; no changes needed for design work.
- `apps/customer/capacitor.config.ts` — already correctly configured.
- `packages/shared-types`, `packages/utils` — used correctly; no changes.
- `apps/api` — only the contract gaps in section 8 are noted for the API team.
