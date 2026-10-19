# Fast Food Ordering Platform: Implementation Plan (Capacitor edition)

**Built from:** your starter plan, your Project Blueprint (Capacitor + React + Node), and a Graphify analysis of Groxo's `CustomerApp` and `RiderApp`.
**Version:** 2 of the starter plan. Phases and time estimates are removed on purpose, so this document is organised by topic instead.
**Last reviewed:** October 2026. Items marked ⚠️ (versions, store rules, prices, plugin support) change over time. Verify them right before you build and again before you publish.

---

## Table of contents

1. [What changed from the starter plan](#1-what-changed-from-the-starter-plan)
2. [What we are building](#2-what-we-are-building)
3. [The finish line](#3-the-finish-line)
4. [What the Groxo analysis found](#4-what-the-groxo-analysis-found)
5. [How Groxo becomes our project](#5-how-groxo-becomes-our-project)
6. [Target architecture (from the blueprint)](#6-target-architecture-from-the-blueprint)
7. [API and socket contract: Groxo today vs our project](#7-api-and-socket-contract-groxo-today-vs-our-project)
8. [Capacitor: building the Android apps (APK and AAB)](#8-capacitor-building-the-android-apps-apk-and-aab)
9. [Rider background location](#9-rider-background-location)
10. [Google Play and sharing APKs](#10-google-play-and-sharing-apks)
11. [Business rules and accounts to prepare](#11-business-rules-and-accounts-to-prepare)
12. [Rules, security and engineering standards](#12-rules-security-and-engineering-standards)
13. [Hosting, operations and monitoring](#13-hosting-operations-and-monitoring)
14. [Risks](#14-risks)
15. [Decisions to confirm](#15-decisions-to-confirm)
- [Appendix A: Screen-by-screen disposition](#appendix-a-screen-by-screen-disposition)

---

## 1. What changed from the starter plan

| Starter plan | This version | Why |
|---|---|---|
| Customer and rider apps stay in Expo (React Native), reused from Groxo | Customer and rider apps become **React + Vite apps wrapped by Capacitor**. Groxo's logic, flows and API knowledge are ported; its UI layer is rewritten | Capacitor runs a web app inside Android's WebView, so React Native screens cannot be dropped in (section 5) |
| APKs built with Expo's build service | APK and AAB built with **Android Studio / Gradle**, signed with your own keystores | Blueprint section 13 |
| "New Node.js + TypeScript + MongoDB" API | **NestJS (recommended) or Express**, Mongoose, Redis, BullMQ, Socket.IO | Blueprint sections 3 and 5 |
| Admin panel: new React website | Same, kept as a **web panel** (optional Capacitor wrapper for tablets) | Blueprint section 13 |
| Two status tracks (kitchen and delivery) | One linear **state machine** from the blueprint. The two-track model is kept as an open decision (section 15) | Blueprint section 10 |
| Expo push notifications | **Firebase Cloud Messaging** through `@capacitor/push-notifications` | Groxo's push uses Expo tokens, which do not work in a Capacitor app |
| Rider background GPS through Expo | Capacitor background-geolocation plugin, with the existing Groxo `RiderApp` kept as a **fallback** | Blueprint section 13 decision point |
| Seven phases, 10 to 14 weeks | Removed | Requested |

---

## 2. What we are building

An online ordering system for **one restaurant**. A customer picks food in a phone app. The order appears on the restaurant's screen. A rider delivers it, and everyone sees live updates.

| Part | Who uses it | Built with | Where the code comes from |
|---|---|---|---|
| **Customer app** | Customers | React + Vite + TypeScript, wrapped by **Capacitor** (Android) | Ported from Groxo `CustomerApp` |
| **Rider app** | Delivery riders | React + Vite + TypeScript, wrapped by **Capacitor** (Android) | Ported from Groxo `RiderApp` |
| **Admin panel** | Restaurant owner and staff | React + Vite web app | New |
| **API (backend)** | All three above | Node.js + TypeScript (NestJS), MongoDB Atlas, Redis, Socket.IO | New (Groxo's backend is mined for rules, not reused) |

The API is the brain. It stores the data and enforces the rules, so the apps cannot cheat. All parts live in one Git repository (a pnpm + Turborepo monorepo) so shared code stays in sync.

---

## 3. The finish line

Version 1 is done when this works on real Android phones from start to end:

1. A customer places an order (server recalculates every price).
2. The restaurant accepts it and starts preparing.
3. The food is marked ready.
4. A rider accepts the delivery (first rider wins; two riders can never take the same order).
5. The rider picks it up.
6. The customer sees the rider moving live.
7. The rider finishes with the customer's OTP and records the cash collected.
8. The owner settles the cash with the rider at the end of the day.

---

## 4. What the Groxo analysis found

### 4.1 How the analysis was done, and its limits

- Both repositories were read through the Graphify code graph: `Ahsan3727/CustomerApp` (commit `7addca5`, 395 nodes, 803 edges) and `Ahsan3727/RiderApp` (commit `45b825e`, 203 nodes, 458 edges). The index was about one to two hours old when read.
- I opened the files that decide the conversion: `App.js`, `services/api.js`, `AuthContext`, `CartContext`, `CartScreen`, `OrderMapPicker`, `TrackOrderScreen`, `MapViewWrapper`, both location hooks, the push hook, `DashboardScreen`, `ActiveOrderContext`, `OrderAssignedScreen`, `WaitingScreen`, plus both `package.json` dependency lists.
- Screens I did not open (for example `HomeScreen`, `WalletScreen`, `ChatScreen`) are classified from their names and imports. Re-check each one when you port it.
- Groxo's **backend** repo (`Ahsan3727/groxo`) is not indexed yet, so the API contract in section 7 is inferred from the calls the apps make. Our API is new anyway, but indexing that repo would let us copy over its business rules (COD settlement, rider earnings) with confidence.

### 4.2 Snapshot

| | Customer app | Rider app |
|---|---|---|
| Framework | Expo (SDK 54 line), React Native 0.81.5 | Expo `~54.0.0`, React Native |
| Language | JavaScript (a `tsconfig.json` exists, source is `.js`) | JavaScript |
| Screens | 23 | 10 |
| Navigation | React Navigation v6 (native stack) | React Navigation (stack + bottom tabs) |
| State | React Context (`Auth`, `Cart`, `Order`) | React Context (`Auth`, `ActiveOrder`) |
| HTTP | axios, 15 s timeout, no interceptors seen | axios |
| Realtime | `socket.io-client` 4.8.3 | `socket.io-client` |
| Storage | `AsyncStorage` (`customerToken`, `customerData`) | `AsyncStorage` (`riderToken`, `riderData`) |
| Native modules | `expo-location`, `expo-notifications`, `expo-device`, `expo-constants`, `expo-font`, `expo-splash-screen`, `expo-status-bar`, `expo-updates`, `react-native-maps`, `react-native-webview`, reanimated, gesture-handler, worklets, screens, safe-area-context | `expo-location`, `expo-task-manager`, `expo-notifications`, `expo-device`, `expo-updates`, and the same React Native UI libraries |
| Maps | **Leaflet in a WebView** for tracking and address picking; web branch of `MapViewWrapper` already uses `react-leaflet` + OpenStreetMap | Leaflet in a WebView plus route lines from the public OSRM server; "open in Google Maps" deep link |
| Backend it talks to | `https://groxo-0zy1.onrender.com/api` (hardcoded) | `http://10.0.2.2:5000` for sockets (hardcoded emulator address) |

### 4.3 Calls the apps make today

Only calls I actually read are listed. The real apps will have more.

| App | Call | Used for |
|---|---|---|
| Customer | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `PUT /auth/me` | Signup, login, profile |
| Customer | `PUT /auth/location`, `PUT /auth/push-token` | Upload customer location, save Expo push token |
| Customer | `POST /orders` with `{ items: [{ product, quantity }], deliveryAddress: { lat, lng, landmark }, payment: { method: 'cod' } }` | Place order |
| Customer | `GET /rider/:id/location` (every 10 s) | Rider position fallback |
| Customer | Socket event `riderLocationUpdate` `{ orderId, lat, lng }` | Live rider position |
| Rider | `GET /orders/available`, `GET /rider/active-order`, `GET /rider/dashboard` | Lists and stats (includes `unsettledCOD`) |
| Rider | `PUT /orders/:id/accept`, `PUT /orders/:id/status` `{ status, note, riderLocation }` | Accept and update delivery |
| Rider | `PUT /rider/location` | Location uploads |
| Rider | Socket events `joinRiderRoom` (sent), `orderUpdated`, `newAvailableOrder` (received) | Live order changes |

### 4.4 What is worth keeping

- **Complete customer flow**: browse, search, cart, pick delivery pin, confirm, track, cancel, history, saved addresses. This is a working UX reference for every customer screen we need.
- **Order request already sends only ids and quantities**, not prices. The cart still stores prices for display, but the checkout request is the right shape.
- **Maps are already Leaflet + OpenStreetMap**, which is one of the blueprint's map options. The WebView map code becomes a normal `react-leaflet` component inside Capacitor.
- **Rider foreground service pattern**: the Expo background task already shows a persistent "online and sharing your location" notification, which is exactly what Android requires.
- **Cash-on-delivery concept**: the rider dashboard already shows "COD to deposit". That is the seed of the cash ledger in the finish line.
- **Design tokens**: colour names such as `primary600`, `amber50`, `gray400`, and components such as `AppButton`, `Card`, `OrderStatusBadge`, `BottomTabBar` can become the shared `ui` package.
- **A working React Native rider app with background location**. Keep it frozen as the fallback if the Capacitor rider app fails the real-device test (section 9).

### 4.5 Gaps against the blueprint

Each row is something that must change during the port. IDs are used again in later sections.

**Customer app**

| ID | Finding | Blueprint rule | Fix in our project |
|---|---|---|---|
| C1 | Token kept in `AsyncStorage` (`customerToken`), no refresh token | Refresh token in Android Keystore secure storage; access token about 15 min; rotation with reuse detection | Secure-storage plugin, Bearer + refresh flow, `X-Client: mobile` header |
| C2 | Signup sends `role: 'customer'` from the app | The role is never taken from what a user sends | Remove from the client; the API sets the role |
| C3 | Signup data and customer coordinates are `console.log`ged | Never log tokens, OTPs or personal data; debug logging off in release | Remove all such logs; strip `console` in release builds |
| C4 | Base URL hardcoded to Groxo's Render server; `SOCKET_URL` built with a string replace; no `/v1` | Absolute URL from `VITE_API_URL`; versioned routes | Env variables, `/v1` prefix, one `api-client` package |
| C5 | Socket passes `userId` in the query string; polling fallback allowed | JWT checked on the handshake; every room join authorized on the server; `transports: ["websocket"]` | JWT in `auth`, no `userId` from the client, websocket only |
| C6 | Customer location is uploaded on a timer for every logged-in customer (`PUT /auth/location`) | Share location only as needed; privacy section | Drop the loop. Read GPS once when the customer picks the delivery pin |
| C7 | Push uses Expo push tokens | Native FCM | `@capacitor/push-notifications` + FCM; backend stores FCM tokens |
| C8 | Cart rows hold `price` and `adminPrice`, including fractions (bundle price divided by quantity); totals computed in the app | Server calculates prices; money stored as integer paisa | Cart stores menu item id, size, add-ons, notes, quantity only. Prices shown come from the API (paisa) and are labelled as an estimate until the server confirms |
| C9 | No idempotency key; address falls back to `lat: 0, lng: 0`; payment fixed to `cod` | `Idempotency-Key` header; address with line, lat, lng; zone check on the server | Generate a UUID per checkout attempt; require a valid pin and address line |
| C10 | Checkout passes a function (`apiFunc`) through navigation params | Features organised by feature with typed API client | Replace with a checkout store plus an `useCreateOrder` hook (functions cannot travel through URLs or router state) |
| C11 | Tracking polls `GET /rider/:id/location` every 10 s as well as the socket | After every reconnect, refetch state through REST | Socket for live data; REST refetch only on resume and reconnect |
| C12 | Four-step status model (`pending`, `packing`, `out_for_delivery`, `delivered`) | Full state machine | Map UI steps from the shared `OrderStatus` enum; ignore unknown statuses safely |
| C13 | Map centre hardcoded to `31.72, 72.98` | Settings-driven | Restaurant location from `settings` or `VITE_` default |

**Rider app**

| ID | Finding | Blueprint rule | Fix in our project |
|---|---|---|---|
| R1 | A self-service Signup screen exists | Rider and staff accounts are created by the admin | Remove the screen; login only |
| R2 | Online/offline is React state only; the server is never told | `POST /v1/rider/status`; riders in the `riders:available` room | Persist status on the server; restore it on app resume |
| R3 | Pull model: list from `GET /orders/available`, accept with `PUT /orders/:id/accept` | Dispatch with `delivery:request`, atomic accept, timeout job | Push offers over the socket and FCM; atomic `findOneAndUpdate` on the server |
| R4 | The app sends any `status` string (`PUT /orders/:id/status`); no OTP step on delivery | Only the state machine changes status; delivery needs the customer's OTP | Separate `/pickup` and `/deliver` (OTP) endpoints; no free-form status from the app |
| R5 | Socket URL hardcoded to `http://10.0.2.2:5000` (Android emulator address); the app emits `joinRiderRoom` | Server authorizes room joins | `VITE_SOCKET_URL`; server joins rooms from the verified JWT |
| R6 | Location sent over REST from a foreground timer **and** a background task, every 1 metre of movement, from login onward | Every 5 to 10 s, only while a delivery is active; live location in Redis, not MongoDB | Send only while online and delivering, throttle, send through the socket, store in Redis |
| R7 | Token in `AsyncStorage`; logout calls `AsyncStorage.clear()` | Secure storage; rotated refresh tokens | Secure storage, server-side logout that revokes the refresh token |
| R8 | "Is this my order" check done in the app (`isAssignedRider`) | Ownership checks on every route | Enforce on the server; the app only displays |
| R9 | Money shown with `.toFixed(2)` and mixed `$` / `Rs.` symbols | Integer paisa and one money helper | Shared `utils` `formatMoney` |
| R10 | Routes drawn from the public OSRM demo server | Maps and routing keys restricted; plan for production traffic | ⚠️ Use a routing provider or self-hosted OSRM for production. Keep the "open in Google Maps" deep link, which costs nothing |
| R11 | Pickup text comes from `wholesaler.storeName` | Single restaurant | Fixed restaurant pickup point from `settings` |

---

## 5. How Groxo becomes our project

### 5.1 The key fact

Capacitor loads your **built web app** (`dist/`) inside Android's WebView and exposes native features through plugins. React Native screens draw native Android views, not HTML. So Groxo's `View`, `Text`, `TouchableOpacity`, `FlatList` and `StyleSheet` code cannot run inside Capacitor as it is.

### 5.2 Three ways to convert

| Option | What it means | Good | Bad | Verdict |
|---|---|---|---|---|
| **A. Port to React DOM** | New Vite apps. Copy the logic over; rewrite each screen as JSX + Tailwind | Matches the blueprint (shared `ui`, Tailwind, TanStack Query, Zod). Smallest APK. One web stack for all three apps. Maps become plain `react-leaflet` | Most typing: 23 customer and 10 rider screens to rewrite | **Recommended** |
| **B. `react-native-web` bridge** | Build the Expo apps for the web and wrap the output in Capacitor. The customer app already depends on `react-native-web` and has `Platform.OS === 'web'` branches | Fastest route to a first APK | Drags in reanimated, gesture-handler, `react-native-maps` and `expo-*` modules that need web shims. The blueprint's shared `ui` and Tailwind do not apply. Larger bundle. Two UI systems, since the admin panel is plain React | Use only for a throwaway demo, never as the base |
| **C. Stay on Expo** | The starter plan | No port at all | Contradicts the Capacitor choice in the blueprint | Not chosen. The existing `RiderApp` stays as the rider fallback (section 9) |

Be realistic about the value of reuse: the backend is new and Groxo is a grocery marketplace, so what you really reuse is **flows, logic, API knowledge, map code and design tokens**, not whole files.

### 5.3 What carries over, what changes, what goes

| | Items |
|---|---|
| **Carries over (logic, rewritten as TypeScript)** | Login and signup flow shape; cart merge logic (add, change quantity, remove, clear, count); placing an order from ids and quantities; delivery pin picker; rider online and active-order flows; Leaflet map markup; the "open in Google Maps" deep link; the "COD to deposit" idea; status badge; colour tokens |
| **Drops** | Bundles (`BundleList`, `BundleDetail`, `addBundleToCart`, allocated prices); Wallet; wholesaler pickup; `adminPrice`; customer location upload; rider self-signup; Expo push and Expo updates |
| **Deferred (not in the finish line)** | Chat, Rate |
| **New for a restaurant** | Menu with sizes and add-ons; opening hours and a "closed" state; delivery fee and zone check; staff role and a kitchen board in the admin panel; customer OTP shown on the tracking screen; rider offer, accept and timeout; cash ledger and daily settlement; "update required" screen; idempotency key; `shared-types` package |

### 5.4 Porting recipe: React Native to web

| React Native in Groxo | Web in our project |
|---|---|
| `View` | `div` / `section` with Tailwind flex classes |
| `Text` | `p`, `span`, `h1` to `h3` |
| `TouchableOpacity`, `Pressable` | `button` (keep tap targets about 44 px) |
| `ScrollView` | `div` with `overflow-y-auto` |
| `FlatList` | `map()` for short lists; a virtualized list for long ones such as order history |
| `StyleSheet.create` | Tailwind classes plus tokens from `packages/config` |
| `Image` | `img` with width and height, WebP, `loading="lazy"` |
| `TextInput` | `input` with the right `type` and `inputMode` |
| `Alert.alert` | Toast and confirm dialog from `packages/ui` |
| `Platform.OS === 'web'` branches | Delete the native branch and keep the web one. Use `isNative()` from `lib/platform.ts` only for real differences |
| `Linking.openURL` | `@capacitor/browser` (or `window.open` on web) |
| `RefreshControl` | Pull-to-refresh component or a refetch button |
| `useFocusEffect` | Route-level effect, React Query refetch, and app-resume handler |
| `navigation.navigate`, `route.params` | `useNavigate`, URL params, or a store. Never pass functions (see C10) |
| `SafeAreaView`, `useSafeAreaInsets` | CSS `env(safe-area-inset-*)` |
| Reanimated animations | CSS transitions |
| `WebView` with `injectJavaScript` / `onMessage` | A `react-leaflet` component driven by props and state |

### 5.5 Native module map

| Groxo (Expo / RN) | Our project (Capacitor) |
|---|---|
| `expo-location` (foreground) | `@capacitor/geolocation` |
| `expo-location` + `expo-task-manager` (background) | Background-geolocation plugin (section 9) |
| `expo-notifications` (Expo push token) | `@capacitor/push-notifications` + Firebase Cloud Messaging |
| `expo-device` | `@capacitor/device` only if needed |
| `expo-constants` (app version) | Vite env variables; `App.getInfo()` from `@capacitor/app` for the installed version |
| `expo-font` | Bundled web fonts (`@font-face`) |
| `expo-splash-screen`, `expo-status-bar` | `@capacitor/splash-screen`, `@capacitor/status-bar` |
| `expo-updates` | Play Store releases. ⚠️ Optional web-layer live updates (Capgo or Capawesome Cloud): read Google Play's current policy first |
| `react-native-maps`, `react-native-webview` | Leaflet. Neither is needed |
| `react-native-reanimated`, `-gesture-handler`, `-worklets`, `-screens`, `-safe-area-context` | Dropped (CSS and React Router replace them) |
| `@react-native-async-storage/async-storage` | `localStorage` for harmless data such as the cart. A Keystore-backed secure-storage plugin for tokens |
| `axios`, `socket.io-client` | Keep both. Move into `packages/api-client`. Socket uses `transports: ["websocket"]` |
| React Navigation | React Router |

### 5.6 State map

| Groxo | Our project |
|---|---|
| `AuthContext` (customer and rider) | Auth store (Zustand) + `api-client` interceptors (refresh logic) + secure storage |
| `CartContext` | Cart store (Zustand): menu item id, size, add-ons, notes, quantity. Persisted locally |
| `OrderContext` (not opened) | React Query hooks: `useOrders`, `useOrder`, `useCreateOrder` |
| `ActiveOrderContext` (rider) | Rider store for online state + React Query for the active order + a socket hook for `delivery:request` and `order:status` |
| `useLocationTracking` | `features/location` service (rider only; customer version is deleted) |
| `usePushNotifications` | `lib/push.ts` |

### 5.7 Folder map

| From | To |
|---|---|
| `CustomerApp/screens/*` | `apps/customer/src/features/<feature>/` (see Appendix A) |
| `CustomerApp/context/*` | `features/*/store.ts` and `features/*/hooks.ts` |
| `*/services/api.js` | `packages/api-client` |
| `components/` (`AppButton`, `Card`, `OrderStatusBadge`, `BottomTabBar`) | `packages/ui` |
| `components/MapViewWrapper.js` and the WebView map HTML | `packages/ui` map component (`react-leaflet`) |
| `constants` colours | `packages/config` Tailwind preset and `packages/ui` tokens |
| `RiderApp/screens/*` | `apps/rider/src/features/{auth, availability, requests, active-delivery, location, history, earnings, profile}` |

### 5.8 Handling the old repos

- **Do not copy React Native code into the monorepo.** Keep both Groxo repos checked out beside it as read-only references. The analysed commits are `7addca5` (CustomerApp) and `45b825e` (RiderApp); tag them so you can always return to them.
- Port from the **contract outward**: first `shared-types` and `api-client`, then screens.
- Keep the `RiderApp` repo alive and frozen until the Capacitor rider app passes the device test.
- Use Groxo's backend only to learn rules (COD settlement, rider earnings). Do not deploy it.
- Remove every Groxo trace: app names and icons, the "Groxo Rider" foreground-service text, the Render URL, old app ids.

### 5.9 Leaflet notes

- Import `leaflet/dist/leaflet.css`, and give the map container a fixed height.
- Default marker icons often break under Vite; import the marker images and set the icon URLs explicitly.
- ⚠️ OpenStreetMap's public tile servers are meant for light use. For production traffic use a tile provider or host your own, and keep the attribution.
- Tear the map down when leaving the tracking screen (blueprint memory tip).

### 5.10 What depends on what (not phases)

- `shared-types` and `api-client` must exist before any screen is ported.
- The auth endpoints and roles must exist before login screens can talk to the real API.
- The rider device test needs the socket, location upload and offer-accept pipeline running on a real phone.
- Firebase setup needs the final `appId` for each app, because it cannot change after publishing.

---

## 6. Target architecture (from the blueprint)

### 6.1 Diagram

```
┌──────────────┐   ┌──────────────┐   ┌──────────────────┐
│ Customer app │   │  Rider app   │   │ Restaurant admin │
│ React + Cap. │   │ React + Cap. │   │ React (web)      │
└──────┬───────┘   └──────┬───────┘   └────────┬─────────┘
       │   HTTPS (REST)   │  + WebSocket       │
       └──────────────────┼────────────────────┘
                          ▼
              ┌───────────────────────┐
              │   API server (Node)   │   modular monolith
              │ Auth · Menu · Orders  │   REST + Socket.IO
              │ Riders · Payments     │
              └──────┬────────┬───────┘
                     │        │
          ┌──────────▼──┐  ┌──▼──────┐   ┌────────────────────┐
          │ MongoDB     │  │ Redis   │   │ External services  │
          │ Atlas       │  │ cache,  │   │ FCM push, SMS,     │
          │ (one DB)    │  │ pub/sub,│   │ maps, image CDN,   │
          └─────────────┘  │ queues  │   │ payment (later)    │
                           └─────────┘   └────────────────────┘
```

### 6.2 Stack

| Layer | Choice |
|---|---|
| Language | TypeScript everywhere |
| Monorepo | pnpm workspaces + Turborepo |
| Frontend | React + Vite, React Router, TanStack Query, Zustand, React Hook Form + Zod, Tailwind CSS |
| Mobile wrapper | Capacitor 8.x ⚠️ |
| Maps | Leaflet + a tile provider (or Google Maps / Mapbox) |
| Backend | Node.js LTS + TypeScript, NestJS (recommended) or Express, Mongoose |
| Realtime | Socket.IO with the Redis adapter |
| Queues and cache | Redis + BullMQ |
| Database | MongoDB Atlas (replica set, for transactions) |
| Auth | JWT access + rotating refresh tokens, argon2 |
| Logging and errors | pino, Sentry |
| Push | Firebase Cloud Messaging |
| Images | Cloudinary or S3 + CDN, signed uploads |
| Testing | Vitest/Jest, React Testing Library, Supertest, Playwright |
| Quality and CI | ESLint, Prettier, Husky + lint-staged, GitHub Actions |
| Local services | Docker Compose (MongoDB replica set + Redis) |

### 6.3 Monorepo structure

One Git repository holds the API, the three apps and every shared package, so types, the API client and the UI cannot drift apart. The tree is shown in layers: the top level first, then each app and package in detail.

#### 6.3.1 Top level

```
fastfood-platform/
├── apps/
│   ├── api/                    # NestJS backend (REST + Socket.IO)
│   ├── customer/               # React + Vite + Capacitor (Android)
│   ├── rider/                  # React + Vite + Capacitor (Android)
│   └── admin/                  # React + Vite web panel (+ optional Capacitor)
│
├── packages/
│   ├── shared-types/           # Zod schemas, enums, roles, socket event names
│   ├── api-client/             # Typed API calls + React Query hooks
│   ├── ui/                     # Shared components + design tokens + map component
│   ├── utils/                  # Money, date, phone-validation helpers
│   └── config/                 # Shared eslint, tsconfig, tailwind presets
│
├── infra/
│   ├── docker-compose.yml      # Local MongoDB (replica set) + Redis
│   └── scripts/                # Seed data (menu import), backup helpers
│
├── docs/
│   ├── architecture.md
│   ├── api-conventions.md
│   ├── release-checklist.md
│   ├── rules.md                # The one-page business rules document (section 11)
│   └── groxo-port-notes.md     # Gap table and screen decisions copied from this plan
│
├── reference/                  # NOT committed: read-only checkouts of the Groxo repos
│   ├── groxo-customerapp/      #   tagged at 7addca5
│   └── groxo-riderapp/         #   tagged at 45b825e (frozen rider fallback)
│
├── keystores/                  # NOT committed: upload keystores, one per app
├── .github/workflows/          # CI pipelines
├── .env.example                # Template only; never commit real secrets
├── .gitignore
├── .husky/                     # Pre-commit hooks (lint-staged)
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── turbo.json
└── README.md
```

#### 6.3.2 `apps/api` (NestJS modular monolith)

```
apps/api/
├── src/
│   ├── main.ts                 # Bootstrap: helmet, CORS allowlist, validation, sockets
│   ├── app.module.ts
│   ├── config/                 # Env loading + validation (fail fast if missing)
│   ├── common/
│   │   ├── guards/             # AuthGuard, RolesGuard, OwnershipGuard
│   │   ├── interceptors/       # Logging, response shaping
│   │   ├── filters/            # Global error filter (consistent error shape)
│   │   ├── pipes/              # Zod/validation pipe, mongo-sanitize
│   │   └── decorators/         # @CurrentUser, @Roles
│   ├── db/                     # Mongo connection, shared schema helpers
│   ├── modules/
│   │   ├── auth/               # OTP, login, refresh rotation, logout, sessions
│   │   ├── users/              # Profiles, addresses, staff and rider accounts
│   │   ├── menu/               # Categories, items, sizes, add-ons, availability, images
│   │   ├── cart-pricing/       # Server-side price calculation, delivery fee, coupons
│   │   ├── orders/             # Create, state machine, history, events
│   │   ├── riders/             # Online status, dispatch, assignment, earnings, cash ledger
│   │   ├── payments/           # COD now; gateway integration and webhooks later
│   │   ├── notifications/      # FCM push, SMS
│   │   ├── reports/            # Sales, top items, peak hours, rider stats
│   │   ├── app-config/         # Minimum app version, maintenance flag
│   │   └── health/             # /health for uptime checks
│   ├── realtime/
│   │   ├── gateway.ts          # Socket.IO gateway + JWT check on handshake
│   │   └── rooms.ts            # Room naming + join authorization
│   └── jobs/                   # BullMQ workers: rider timeout, reassign, notify
├── test/                       # Integration tests (Supertest)
├── Dockerfile
└── package.json
```

Inside every module (example: `orders/`):

```
orders/
├── orders.controller.ts        # HTTP routes only; no business logic
├── orders.service.ts           # Business logic
├── orders.state-machine.ts     # Allowed transitions + who may trigger them
├── orders.schema.ts            # Mongoose model + indexes
├── orders.dto.ts               # Zod/DTO validation
├── orders.events.ts            # Emit socket events after changes
└── orders.service.spec.ts      # Unit tests
```

#### 6.3.3 `apps/customer` (ported from Groxo `CustomerApp`)

```
apps/customer/
├── src/
│   ├── app/                    # Router, providers (Query, Auth, Socket)   ← replaces App.js + AppNavigator
│   ├── features/
│   │   ├── auth/               # Phone/email login, OTP                    ← LoginScreen, SignupScreen, AuthContext
│   │   ├── menu/               # Categories, item cards, search, item detail ← Home, ProductList, ProductDetail, Search
│   │   ├── cart/               # Cart store, quantity, notes               ← CartScreen, CartContext
│   │   ├── checkout/           # Address pin, payment method, place order  ← OrderMapPicker, OrderConfirm
│   │   ├── orders/             # Order list, details, cancel               ← Orders, OrderDetail, CancelOrder
│   │   ├── tracking/           # Live status + rider map                   ← TrackOrderScreen, MapViewWrapper
│   │   └── profile/            # Addresses, settings, help                 ← Profile, AddAddress, AddressList, Settings, Help
│   ├── lib/
│   │   ├── api.ts              # Uses packages/api-client
│   │   ├── socket.ts           # Socket client (websocket transport only)
│   │   ├── secureStorage.ts    # Capacitor secure token storage
│   │   ├── push.ts             # FCM registration                          ← usePushNotifications
│   │   └── platform.ts         # isNative(), device helpers
│   ├── components/             # App-specific components only
│   └── main.tsx
├── android/                    # Generated by Capacitor (commit this)
├── capacitor.config.ts
├── vite.config.ts
├── tailwind.config.ts          # Extends packages/config tailwind preset
├── index.html
├── .env.example                # VITE_API_URL, VITE_SOCKET_URL, VITE_MAPS_KEY
└── package.json
```

Dropped from Groxo, with no folder here: Bundle screens, Wallet, the customer location-upload hook. Deferred: Chat and Rate.

#### 6.3.4 `apps/rider` (ported from Groxo `RiderApp`)

```
apps/rider/
├── src/
│   ├── app/                    # Router, providers (Query, Auth, Socket)
│   ├── features/
│   │   ├── auth/               # Login only (accounts come from the admin)   ← LoginScreen, AuthContext
│   │   ├── availability/       # Online/offline toggle, stats, cash to settle ← DashboardScreen
│   │   ├── requests/           # Incoming delivery requests + accept         ← WaitingScreen
│   │   ├── active-delivery/    # To restaurant → pickup → to customer → OTP  ← OrderAssignedScreen, MapScreen
│   │   ├── location/           # Background location service + upload throttle ← useLocationTracking
│   │   ├── history/            # Past deliveries                             ← OrderHistoryScreen
│   │   ├── earnings/           # Earnings + cash ledger                      ← EarningsHistoryScreen
│   │   └── profile/            # Profile, settings, battery-optimization help ← ProfileScreen, SettingsScreen
│   ├── lib/                    # api.ts, socket.ts, secureStorage.ts, push.ts, platform.ts
│   ├── components/
│   └── main.tsx
├── android/                    # Generated by Capacitor (commit this)
├── capacitor.config.ts
├── vite.config.ts
├── tailwind.config.ts
├── .env.example
└── package.json
```

Dropped: rider Signup screen. Replaced: the `ActiveOrderContext` pull model becomes a store plus socket hooks.

#### 6.3.5 `apps/admin` (new web panel)

```
apps/admin/
├── src/
│   ├── app/
│   ├── features/
│   │   ├── auth/               # Login with 2FA for admin accounts
│   │   ├── live-orders/        # Real-time board + sound alert (accept, reject, preparing, ready)
│   │   ├── menu-management/    # Items, prices, sizes, add-ons, availability toggle, images
│   │   ├── riders/             # List, status, manual assign, cash settlement
│   │   ├── customers/
│   │   ├── coupons/            # After the finish line
│   │   ├── reports/            # Sales, peak hours, top items, rider stats (after the finish line)
│   │   ├── staff/              # Roles and permissions
│   │   └── settings/           # Opening hours, delivery fee, zones, restaurant location
│   ├── lib/
│   └── main.tsx
├── vite.config.ts
├── tailwind.config.ts
└── package.json
```

#### 6.3.6 Shared packages

```
packages/
├── shared-types/
│   └── src/
│       ├── enums.ts            # Role, OrderStatus, PaymentMethod, PaymentStatus
│       ├── schemas/            # Zod schemas: auth, menu, order, rider, settings
│       ├── socket-events.ts    # Event names + payload types
│       └── index.ts
├── api-client/
│   └── src/
│       ├── client.ts           # Axios/fetch instance, base URL from VITE_API_URL
│       ├── interceptors.ts     # Bearer token, refresh-and-retry, X-Client header
│       ├── hooks/              # useMenu, useCreateOrder, useOrders, useRiderRequests ...
│       └── index.ts
├── ui/
│   └── src/
│       ├── components/         # Button, Input, Modal, Toast, Table, Card, OrderStatusBadge, BottomTabBar
│       ├── map/                # react-leaflet map, pin picker, rider marker
│       ├── tokens/             # Colours, spacing, fonts (from Groxo colour names)
│       └── index.ts
├── utils/
│   └── src/
│       ├── money.ts            # formatMoney, paisa helpers (integers only)
│       ├── date.ts
│       └── phone.ts
└── config/
    ├── tsconfig/               # base.json, react.json, node.json
    ├── eslint/                 # Shared ESLint config
    └── tailwind-preset.ts      # Colours and spacing shared by all apps
```

#### 6.3.7 Workspace files

`pnpm-workspace.yaml`:

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

`turbo.json` (⚠️ the task key is `tasks` in Turborepo 2.x and `pipeline` in older versions; match your installed version):

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "lint": {},
    "typecheck": { "dependsOn": ["^build"] },
    "test": { "dependsOn": ["^build"] },
    "dev": { "cache": false, "persistent": true }
  }
}
```

Root `package.json` scripts: `build`, `lint`, `typecheck` and `test` each run through `turbo run <task>`.

`.gitignore` must include from day one: `.env`, `.env.*` (except `.env.example`), `node_modules/`, `dist/`, `keystores/`, `android/keystore.properties`, `reference/`, and any `*.jks` or service-account JSON.

#### 6.3.8 Creating the skeleton

```bash
mkdir fastfood-platform && cd fastfood-platform
git init
pnpm init
printf "packages:\n  - 'apps/*'\n  - 'packages/*'\n" > pnpm-workspace.yaml
pnpm add -D turbo typescript -w

# Local services (after creating infra/docker-compose.yml)
docker compose -f infra/docker-compose.yml up -d

# API
mkdir -p apps && cd apps && pnpm dlx @nestjs/cli new api && cd ..

# React apps
pnpm create vite apps/customer --template react-ts
pnpm create vite apps/rider --template react-ts
pnpm create vite apps/admin --template react-ts

# Shared packages
mkdir -p packages/shared-types packages/api-client packages/ui packages/utils packages/config
```

Capacitor is added per mobile app afterwards (section 8.4). The two Groxo repos are cloned into `reference/`, outside version control, as described in section 5.8.

### 6.4 Dependency rules

1. Apps never import from other apps. Shared code goes into `packages/`.
2. Dependencies flow one way: `apps → packages`.
3. Keep packages focused. `utils` must not become a dumping ground.
4. One React version and one Capacitor version across the repo; upgrade all apps together.
5. `shared-types` is the single source of truth for order statuses, roles and socket events.

### 6.5 Backend modules

`auth`, `users`, `menu`, `cart-pricing`, `orders`, `riders`, `payments`, `notifications`, `reports`, `app-config`, `health`, plus `realtime` (Socket.IO gateway and room rules) and `jobs` (BullMQ workers). Inside each module: controller (routes only), service (logic), state machine (orders only), schema, DTO, events, tests.

**Rule:** controllers stay thin; services hold logic; the state machine is the only code allowed to change `order.status`.

### 6.6 Data

One Atlas cluster, one database, many collections: `users`, `addresses`, `categories`, `menuItems`, `orders`, `orderEvents`, `riders`, `payments`, `coupons`, `refreshTokens`, `auditLogs`, `settings`.

- **Proposed addition:** a `cashLedger` collection (rider, order, amount collected, settled flag, settled by, settled at). Your plan needs the cash handling early, and the blueprint has no dedicated collection for it.
- Orders store **snapshots** of item names, prices and the delivery address, so later menu or address changes never alter past orders.
- Money is stored as integers in paisa. Never decimals.
- Key indexes: unique `users.phone`; sparse unique `users.email`; `orders` on `(customerId, createdAt)`, `(status, createdAt)`, `(riderId, status)`, and a sparse unique `idempotencyKey`; `menuItems` on `(categoryId, isAvailable)`.
- Use transactions where two writes must succeed together (order and payment record), atomic updates for races (see the rider accept rule in section 12), `.lean()`, projections and pagination on reads, and TTL indexes for OTP codes.
- **Do not write every GPS ping to MongoDB.** Live rider location lives in Redis.
- Production: ⚠️ dedicated Atlas tier (M10 or above) with automated backups and point-in-time recovery. Never share a database between staging and production.

### 6.7 Redis

Menu cache; live rider locations (with expiry); Socket.IO adapter and pub/sub; rate-limit counters for login, OTP and order creation; BullMQ queues (rider timeout, reassign, notifications); OTP and short-lived tokens with TTL.

### 6.8 Order state machine

The server is the only authority on status changes. Reject any transition not in this table.

```
PLACED → ACCEPTED → PREPARING → READY → RIDER_ASSIGNED → PICKED_UP → DELIVERED
   │         │                                                │
   ▼         ▼                                                ▼
REJECTED  CANCELLED                                   DELIVERY_FAILED
```

| From | To | Who |
|---|---|---|
| (new) | `PLACED` | Customer (server validates prices) |
| `PLACED` | `ACCEPTED` / `REJECTED` | Admin or staff (reject needs a reason) |
| `PLACED` | `CANCELLED` | Customer (short window) or admin |
| `ACCEPTED` | `PREPARING` | Staff |
| `ACCEPTED` / `PREPARING` | `CANCELLED` | Admin only (reason, refund handling) |
| `PREPARING` | `READY` | Staff |
| `READY` | `RIDER_ASSIGNED` | Rider accepts (atomic) or admin assigns |
| `RIDER_ASSIGNED` | `PICKED_UP` | Assigned rider only |
| `PICKED_UP` | `DELIVERED` | Assigned rider **with the correct customer OTP** |
| `PICKED_UP` | `DELIVERY_FAILED` | Assigned rider (with reason) |

Every transition writes an `orderEvents` record (who, from, to, when).

### 6.9 Order flow, step by step

1. Customer sends `POST /v1/orders` with an idempotency key. The server recalculates prices from the database.
2. The server saves the order and emits `order:new` to the restaurant room. The admin panel plays an alert sound.
3. Staff move the order through accepted, preparing and ready. Each change emits `order:status` to the customer.
4. On `READY`, the server finds nearby online riders and sends `delivery:request` (socket plus FCM backup).
5. The first rider to accept wins. Others receive `delivery:request:cancelled`.
6. If nobody accepts within about 60 seconds, a background job widens the search or alerts the admin.
7. After pickup, the rider streams location every 5 to 10 seconds. The server forwards it **only to that order's customer room**.
8. At the door, the rider enters the customer's OTP to complete delivery, and the cash collected is recorded in the ledger.

### 6.10 Conventions

- REST routes are versioned (`/v1/...`) and changes are additive, so installed old APKs keep working.
- One error shape: `{ "error": { "code": "ORDER_INVALID_TRANSITION", "message": "..." } }`.
- Pagination with `?page=1&limit=20` or cursors. `Idempotency-Key` header on order and payment creation.
- Socket rooms: `restaurant:{id}`, `riders:available`, `order:{orderId}`, `user:{userId}`. Authenticate the JWT on the handshake and authorize every room join on the server.
- After every reconnect or app resume, the client refetches current state through REST.

---

## 7. API and socket contract: Groxo today vs our project

Endpoints marked **(proposed)** are my suggestions and are not in your blueprint. Everything else is from the blueprint. Groxo-side calls are the ones listed in section 4.3.

### 7.1 REST

| Groxo today | Our project | Notes |
|---|---|---|
| `POST /auth/register` | `POST /v1/auth/otp/request` + `POST /v1/auth/otp/verify` | Customers use phone OTP or email. The role is never sent by the client (C2) |
| `POST /auth/login` | `POST /v1/auth/login` | Staff, rider and admin accounts. Admin accounts need 2FA |
| (none) | `POST /v1/auth/refresh`, `POST /v1/auth/logout` | Rotating refresh token, hashed on the server, reuse detection |
| Rider self-signup | Admin creates rider and staff accounts (proposed: `POST /v1/admin/users`) | R1 |
| `GET /auth/me`, `PUT /auth/me` | `GET /v1/users/me`, `PATCH /v1/users/me` (proposed) | Profile and saved addresses |
| `PUT /auth/location` (customer) | **Removed** | Address pin is saved with the address (C6) |
| `PUT /auth/push-token` `{ expoPushToken }` | `POST /v1/devices` `{ fcmToken, platform }` (proposed) | Delete the token on logout |
| (products and bundles) | `GET /v1/menu`, `GET /v1/menu/items/:id` | Categories, items, sizes, add-ons, availability. Prices in paisa |
| `POST /orders` | `POST /v1/orders` | `Idempotency-Key` header. Body: menu item ids, quantities, size, add-ons, notes, address, `paymentMethod: "COD"`. Server ignores any price sent |
| (orders list and detail) | `GET /v1/orders`, `GET /v1/orders/:id` | Ownership check on every read |
| (cancel screen) | `POST /v1/orders/:id/cancel` | Customer: short window only. Later stages: admin |
| `GET /rider/:id/location` | **Removed** | Socket event `rider:location`, plus an order refetch on resume (C11) |
| `GET /orders/available` | `delivery:request` over socket and FCM. Optional REST fallback `GET /v1/rider/requests` (proposed) | R3 |
| `GET /rider/active-order` | `GET /v1/rider/active-order` (proposed) | |
| `GET /rider/dashboard` | `GET /v1/rider/summary` (proposed) | Today's deliveries, cash to settle, earnings |
| (local `isOnline` state) | `POST /v1/rider/status` | R2 |
| `PUT /orders/:id/accept` | `POST /v1/rider/orders/:id/accept` | Atomic update (section 12) |
| `PUT /orders/:id/status` | `POST /v1/rider/orders/:id/pickup`, `POST /v1/rider/orders/:id/deliver` (OTP), failure endpoint with reason (proposed) | No free-form status from the app (R4) |
| `PUT /rider/location` | Socket `rider:location:update` | Throttled, stored in Redis (R6) |
| (none) | `GET /v1/admin/orders`, `POST /v1/admin/orders/:id/accept`, `/reject`, `/preparing`, `/ready` | Admin live board |
| (none) | `GET /v1/app-config?app=rider&platform=android` | `{ minVersion, latestVersion, updateUrl, maintenance }` for the "update required" screen |
| (none) | `GET /health` | Uptime checks |
| (none, later) | `POST /v1/payments/initiate`, `POST /v1/payments/webhook` | Webhook verified by signature. Launch with COD |
| (none) | Cash settlement endpoints (proposed) | Record cash collected, mark settled by the owner |

### 7.2 Socket events

| Groxo today | Our project | Direction |
|---|---|---|
| `riderLocationUpdate` `{ orderId, lat, lng }` | `rider:location` | Server to the order's customer room |
| (REST `PUT /rider/location`) | `rider:location:update` | Rider to server |
| `newAvailableOrder` | `delivery:request` | Server to `riders:available` |
| (none) | `delivery:request:cancelled` | Server to riders after someone else accepts |
| `orderUpdated` | `order:status` | Server to customer and admin |
| (none) | `order:new` | Server to the restaurant room |
| `joinRiderRoom` (sent by the app) | **Removed** | The server joins rooms from the verified JWT |
| (local) | `rider:status` | Rider to server |

Rules: JWT on the handshake, no `userId` from the client, `transports: ["websocket"]`, and event names and payload types defined in `shared-types`.

---

## 8. Capacitor: building the Android apps (APK and AAB)

Capacitor runs your built React app inside Android's WebView, and your JavaScript calls native features through plugins.

```
React code → Capacitor bridge → plugin (Kotlin/Java) → Android feature
```

### 8.1 Which approach for which app

| App | Approach |
|---|---|
| Customer | Capacitor |
| Rider | Capacitor first, with a background-location plugin. If real-device tests fail, rebuild only this app in React Native/Expo (the Groxo `RiderApp` is the starting point). The API and shared packages stay the same |
| Admin | Keep as a **web panel** (instant deploys). Optionally wrap with Capacitor for tablets |

### 8.2 ⚠️ Toolchain (Capacitor 8, as verified in the blueprint in October 2026)

- Node.js 22+
- Android Studio Otter (2025.2.1) or newer
- JDK 21
- Android `minSdk` 24, compile and target SDK 36
- Stay on the stable 8.x line. A 9.x major existed only as alpha at the time of writing.
- Design with CSS safe-area insets. Capacitor 8 removed the old edge-to-edge margin option and added a System Bars plugin.
- Also install: Docker Desktop, Git, MongoDB Compass, Postman or Bruno. Debug the WebView on a real phone with `chrome://inspect`.

Re-check every version above against the official Capacitor docs right before you build.

### 8.3 App identity

| App | `appId` | Capacitor |
|---|---|---|
| Customer | `com.yourbrand.customer` | Yes |
| Rider | `com.yourbrand.rider` | Yes |
| Admin | `com.yourbrand.admin` | Optional |

Replace `yourbrand` with your real brand before the first `cap add android`. **An `appId` cannot change after publishing.** Each app gets its own `appId`, name, icon, keystore and Play listing.

### 8.4 Setup per app

```bash
cd apps/customer
pnpm add @capacitor/core @capacitor/android @capacitor/app @capacitor/network @capacitor/push-notifications
pnpm add @capacitor/geolocation @capacitor/browser @capacitor/splash-screen @capacitor/status-bar
pnpm add -D @capacitor/cli
npx cap init "YourBrand" com.yourbrand.customer --web-dir=dist
pnpm build
npx cap add android
npx cap sync android
npx cap open android        # build and run from Android Studio
```

Repeat in `apps/rider` with `com.yourbrand.rider`, adding the background-location and secure-storage plugins (sections 8.6 and 9).

`capacitor.config.ts`:

```ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourbrand.customer',   // unique per app; cannot change after publishing
  appName: 'YourBrand',
  webDir: 'dist',
  server: { androidScheme: 'https' } // app origin becomes https://localhost (add to API CORS)
};
export default config;
```

Commit the generated `android/` folder.

### 8.5 Environment values

Frontend `.env.production` (public values only):

```bash
VITE_API_URL=https://api.example.com
VITE_SOCKET_URL=https://api.example.com
VITE_MAPS_KEY=restricted-public-key
```

Anything with a `VITE_` prefix ends up inside the APK. Never put secrets there. Restrict map keys by app package name and API. API side: add `https://localhost` (the Capacitor origin) to `CORS_ORIGINS`.

### 8.6 Plugins

| Need | Plugin | Customer | Rider |
|---|---|---|---|
| Back button, pause/resume (reconnect sockets) | `@capacitor/app` | Yes | Yes |
| Online/offline detection | `@capacitor/network` | Yes | Yes |
| Push notifications (Firebase) | `@capacitor/push-notifications` | Yes | Yes |
| Location while the app is open | `@capacitor/geolocation` | Yes (address pin) | Yes |
| Background location | Background-geolocation plugin | No | **Yes** |
| Open external pages and map links | `@capacitor/browser` | Yes | Yes |
| Splash screen, status bar | `@capacitor/splash-screen`, `@capacitor/status-bar` | Yes | Yes |
| Secure token storage | Keystore-backed secure-storage plugin | Yes | Yes |
| Haptics | `@capacitor/haptics` | Optional | Optional |

- `@capacitor/preferences` is **not encrypted**. Never store refresh tokens there.
- ⚠️ For secure storage, evaluate plugins backed by Android Keystore (for example `@aparajita/capacitor-secure-storage` or `capacitor-secure-storage-plugin`) and confirm each supports Capacitor 8 and is maintained. A stalled plugin can block your whole upgrade.

### 8.7 Mobile-specific changes to the architecture

1. **Auth:** the `httpOnly` cookie flow often fails in an Android WebView. The API supports both: cookies for web, and Bearer access token plus refresh token in secure storage for mobile. Mobile clients send `X-Client: mobile`.
2. **CORS:** add `https://localhost` to the allowlist.
3. **API URL:** always the full `https://api.yourdomain.com` from `VITE_API_URL`. Relative paths break inside an APK.
4. **Push:** native Firebase Cloud Messaging (see 8.8). Web push is unreliable inside a wrapped app.
5. **Reconnect on resume:** on the `@capacitor/app` `appStateChange` event, reconnect the socket and refetch the active order.
6. **Safe areas:** CSS `env(safe-area-inset-*)`. Android 15 and 16 enforce edge-to-edge for apps targeting recent SDKs.
7. **Payments (later):** test the gateway's redirect and return flow inside the WebView on real devices.

### 8.8 Firebase push setup

1. Create a Firebase project per environment (development, staging, production), or at least separate app ids.
2. Add an Android app in Firebase using the exact `appId` of each Capacitor app.
3. Download `google-services.json` into `apps/<app>/android/app/`. Do not commit secrets to a public repo.
4. Backend: use the Firebase Admin SDK with the service-account JSON in the `FCM_SERVICE_ACCOUNT_JSON` environment variable.
5. Create Android notification channels (for example a high-importance channel for rider delivery requests).
6. Ask for the notification permission at the right moment (Android 13 and later).
7. Send rider requests and customer updates through push as a **backup** to the socket, because a locked phone can drop the WebSocket.

### 8.9 Daily workflow

| Command | Purpose |
|---|---|
| `pnpm build` | Build the React app into `dist/` |
| `npx cap sync android` | Copy the build into `android/` and update plugins. Run after every web build or plugin change |
| `npx cap run android` | Run on a connected device or emulator (add `-l --external` for live reload while `pnpm dev --host` runs) |
| `chrome://inspect` | Debug the WebView on a real phone |

### 8.10 Building the APK and AAB

Run these inside the `android/` folder of the app. On Windows use `gradlew.bat` instead of `./gradlew`.

| Goal | Command | Output |
|---|---|---|
| Debug APK (testing on your phone) | `./gradlew assembleDebug` | `app/build/outputs/apk/debug/app-debug.apk` |
| Release APK (sharing directly) | `./gradlew assembleRelease` | `app/build/outputs/apk/release/app-release.apk` (signed only if signing is configured) |
| Release AAB (Google Play) | `./gradlew bundleRelease` | `app/build/outputs/bundle/release/app-release.aab` |

Install an APK on a connected phone: `adb install -r path/to/app.apk`.

Full cycle for a normal release:

1. Change code, then `pnpm build` and `npx cap sync android`.
2. Increase `versionCode` (and `versionName`) in `android/app/build.gradle`. Play rejects an upload without a higher `versionCode`.
3. Build the signed AAB, upload it to Play Console, and use a staged rollout (for example 10% then 50% then 100%).

### 8.11 Signing and keystores

- Create **one upload keystore per app**. Store it and its passwords in a password manager plus an offline backup. **If you lose it you cannot update the app.**
- Use Play App Signing.
- Never commit keystores, `keystore.properties`, or `google-services.json` secrets.

Create a keystore:

```bash
keytool -genkeypair -v -keystore customer-upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
```

`android/keystore.properties` (add it to `.gitignore`):

```
storeFile=../../keystores/customer-upload.jks
storePassword=...
keyAlias=upload
keyPassword=...
```

`android/app/build.gradle`:

```groovy
def keystoreProps = new Properties()
def keystoreFile = rootProject.file("keystore.properties")
if (keystoreFile.exists()) { keystoreProps.load(new FileInputStream(keystoreFile)) }

android {
  signingConfigs {
    release {
      storeFile file(keystoreProps['storeFile'])
      storePassword keystoreProps['storePassword']
      keyAlias keystoreProps['keyAlias']
      keyPassword keystoreProps['keyPassword']
    }
  }
  defaultConfig {
    ndk { abiFilters 'arm64-v8a', 'armeabi-v7a' }   // APK only; not needed for AAB
  }
  buildTypes {
    release {
      signingConfig signingConfigs.release
      minifyEnabled true
      shrinkResources true
      proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
  }
}
```

In CI, supply the keystore and passwords from GitHub Secrets instead of local files.

### 8.12 Keep the apps small and light

> The sizes below are rough estimates from the blueprint, not measurements. Measure your real build.

| App | Estimated release APK | Estimated RAM |
|---|---|---|
| Customer | about 8 to 15 MB | about 100 to 200 MB |
| Rider | about 10 to 20 MB | about 120 to 250 MB |
| Admin | about 6 to 12 MB | about 120 to 250 MB |

- Publish an **AAB** so each phone downloads only what it needs. Drop x86 architectures with `abiFilters` for directly shared APKs.
- Turn on **R8 minification** (the default Capacitor template ships with it off) and test the signed release build, because R8 can strip classes that plugins need.
- Avoid heavy native plugins unless needed.
- Use WebP images at the right size, lazy-load routes and images, virtualize long lists, clean up socket listeners, and shorten React Query `gcTime` for large data.

### 8.13 Forcing old versions to update

The app calls `GET /v1/app-config` on startup. If its version is below `minVersion`, show an "Update required" screen linking to the Play Store. Old versions stay alive for weeks, so keep the API backward compatible: versioned routes, new fields instead of renamed ones, apps that safely ignore unknown statuses and events, and feature flags for risky features.

### 8.14 Upgrading Capacitor later

Capacitor releases a new major roughly once a year. Upgrade when the new major becomes the default, not at alpha: update `@capacitor/cli@latest`, run `npx cap migrate`, update **all** plugins to compatible versions, then build and test a release AAB. Upgrade all apps together. Google also raises the required target Android version yearly, so budget at least one update cycle per year.

---

## 9. Rider background location

This is the riskiest part of the whole project, so it gets its own decision gate.

**How it works:** Android needs a **foreground service with a visible notification** to keep location updates running when the screen is off. Groxo's `RiderApp` already does this with Expo (its notification text is "You are online and sharing your location"), so riders have seen this pattern before. Rebrand the text.

**Plugin choice:** the community Background Geolocation plugin, or a commercial alternative such as Capawesome's. ⚠️ Confirm Capacitor 8 support and licensing before choosing.

**Permissions the rider app typically needs:** fine location, background location, foreground service (location type), and notifications (Android 13 and later). Plugins often add these to the manifest, but check the merged manifest.

**Behaviour rules (fixing R6):**

- Send location only while the rider is **online and has an active delivery**, every 5 to 10 seconds. No 1-metre distance trigger.
- Send it through the socket (`rider:location:update`). The server keeps it in Redis and forwards it only to that order's customer room.
- Explain background location clearly inside the app before asking for the permission. Google Play will also ask you to declare and justify it.
- Ask riders to disable battery optimization for the app. Some phone brands kill background apps aggressively.

**Device test (before committing to Capacitor for the rider app):**

1. Run a real delivery with the screen off for 30 minutes or more.
2. Repeat on several phone brands, including the cheap Android phones your riders actually use.
3. Check on the server how many location updates arrived, and the longest gap between them.
4. Suggested pass mark (my suggestion, adjust to your needs): no gap longer than about three times the update interval, and the foreground notification survives.
5. Also test: app killed and reopened, network lost and restored, phone locked for a long time.

**Decision:**

- **Pass:** stay on Capacitor.
- **Fail on phone brands that matter:** rebuild only the rider app in React Native/Expo, starting from the frozen Groxo `RiderApp`. The API, `shared-types` and `api-client` stay unchanged. Because that repo already tracks location in the background, it is also a useful **baseline**: test it on the same phones first so you know what "good" looks like.

---

## 10. Google Play and sharing APKs

### 10.1 The account

- ⚠️ A Google Play Console developer account costs a **one-time US$25**. It is not a subscription, and there is no per-app or per-update fee.
- One account can publish many apps. Your apps become separate listings (own package name, listing, AAB, versions, review).
- You must be 18 or older, and Google may require a government ID and a card in your legal name. Confirm your country is on Google's supported developer-registration list.
- Use a Google account you will keep long term, with 2-step verification.

### 10.2 Personal or organization account

| | Personal | Organization |
|---|---|---|
| Fee | US$25 once | US$25 once |
| Testing requirement ⚠️ | If created after 13 Nov 2023: a closed test with **at least 12 testers, opted in continuously for 14 days**, before applying for production | Not required |
| Needs | Government ID | Business details (typically a D-U-N-S number, which can take time) |

- Sources disagree on whether the testing rule applies per app or once per account. Read Google's help page "Testing requirements for new personal developer accounts" before planning.
- If it applies per app, run all closed tests **in parallel**, and keep testers opted in for the whole period.
- If the restaurant is a registered business, an organization account is usually cleaner.

### 10.3 Per-app checklist

- Unique `appId`, app name, icon, feature graphic, screenshots
- Privacy policy URL and Data Safety form
- Content rating questionnaire
- Target API level meets the current Play requirement ⚠️
- Rider app: background location declaration and a clear in-app explanation
- Signed AAB uploaded: internal testing track first, then closed testing, then production
- Staged rollout and crash monitoring switched on

### 10.4 Sharing APKs outside Play

- ⚠️ Google's Android developer verification program was scheduled to require verified developers for installs on certified devices from 30 Sept 2026 in Brazil, Indonesia, Singapore and Thailand, with a global rollout planned for 2027. Unverified apps can still be installed through an advanced flow or ADB.
- Publishing through Play is the simplest way to avoid trouble, especially for riders who need smooth installs and updates.
- Until then, a signed release APK (section 8.10) is fine for testers and for early riders.

---

## 11. Business rules and accounts to prepare

**Write these down in a one-page rules document:**

- Delivery fee and delivery zones
- Tax
- Minimum order
- Opening hours
- Preparation time
- Cancellation and refund rules
- How riders are paid
- Whether you offer takeaway
- Cash settlement: when riders hand over cash, who confirms, and what happens with a shortfall

**Collect the real menu** in a spreadsheet: categories, items, prices (in paisa), photos, sizes, add-ons, availability.

**Decide the brand and ids early:** brand name, the three `appId` values, app icons, privacy policy URL.

**Create the accounts** you will need: GitHub, MongoDB Atlas, Cloudinary (or S3), a server host, Redis hosting, Firebase, Sentry, Google Play Console, and an SMS provider for OTP. Start the Play account early, because identity checks can take time.

---

## 12. Rules, security and engineering standards

**How to read this section:** items without a marker come from your blueprint. Items marked ➕ are my additions, several of them prompted by what the Groxo apps do today (gap IDs such as C2 and R4 point back to section 4.5). Treat the security rules in 12.2 as a **release gate**: every box must be checked before launch.

### 12.1 Rules we never break

These are the mistakes that caused Groxo's biggest problems, plus the blueprint's core rules.

1. The server calculates prices and totals. The apps never decide them.
2. Order status changes only through the state machine.
3. Every route checks the user's role **and** whether the record belongs to them.
4. Secrets never go into the apps or into Git. Everything inside an APK is public.
5. Money is stored as whole numbers (paisa), never decimals.
6. Never trust client-sent roles, prices, `userId` values or status strings.
7. Two riders can never take the same order. The accept must be one atomic database update, for example:
   `findOneAndUpdate({ _id, status: "READY", riderId: null }, { $set: { riderId, status: "RIDER_ASSIGNED" } })`
8. Share rider location with a customer only during that customer's active delivery.
9. Never write every GPS ping to MongoDB.
10. Never log tokens, passwords, OTPs or full personal data.
11. Never change the API in a breaking way while old APKs are still installed.
12. Never lose the Android keystores.
13. ➕ Default deny: a route is closed to everyone until a guard explicitly opens it for a role.
14. ➕ The delivery OTP is shown to the customer only. It is never included in anything the rider's app receives.

### 12.2 Security rules (release gate)

#### Authentication

- [ ] Customers log in with phone OTP or email. Rider and staff accounts are created by the admin (R1)
- [ ] Passwords are hashed with **argon2** (or bcrypt) and never stored or logged in plain text
- [ ] Access token (JWT) lives about 15 minutes. Refresh token is **rotated on each use** with reuse detection
- [ ] Refresh tokens are stored **hashed** on the server
- [ ] **Web:** refresh token in an `httpOnly`, `Secure`, `SameSite` cookie
- [ ] **Mobile (APK):** refresh token in **secure device storage** (Android Keystore plugin), sent as a Bearer token, never in `localStorage` or `@capacitor/preferences` (C1, R7)
- [ ] 2FA enabled for admin accounts
- [ ] OTP codes expire quickly and have attempt limits
- [ ] ➕ OTP requests are rate-limited per phone number **and** per IP, so nobody can drain your SMS budget or flood a customer
- [ ] ➕ Login and OTP errors never reveal whether an account exists
- [ ] ➕ Logout revokes the refresh token on the server. Clearing local storage is not logout (R7)
- [ ] ➕ The admin can suspend a rider or staff account, and the suspension takes effect within one access-token lifetime
- [ ] ➕ No shared admin accounts. Each staff member has their own login, and the number of admin accounts stays small

#### Authorization

- [ ] Role checks (`customer`, `rider`, `staff`, `admin`) in middleware on **every** route
- [ ] **Ownership checks:** a customer sees only their orders, and a rider sees only assigned orders (prevents IDOR) (R8)
- [ ] Sensitive admin actions are written to `auditLogs`
- [ ] ➕ Role and permission are always read from the verified token or database, never from the request body (C2)
- [ ] ➕ A written list of admin-only actions: cancelling after acceptance, refunds, settling rider cash, creating or suspending users, changing prices, changing settings
- [ ] ➕ Response objects are whitelisted. Password hashes, OTPs, refresh tokens and other users' personal data are never returned

#### API hardening

- [ ] All input is validated (Zod or DTO) and sanitised against **NoSQL injection** (`$` operators)
- [ ] `helmet`, a strict **CORS allowlist** (only your own origins, including the Capacitor origin `https://localhost`), request size limits
- [ ] **Rate limiting** on login, OTP and order creation
- [ ] HTTPS everywhere with HSTS. HTTP redirects to HTTPS
- [ ] Prices, totals, discounts and permissions are **always calculated on the server**
- [ ] Idempotency keys on order and payment creation (C9)
- [ ] Consistent error responses that never leak stack traces
- [ ] ➕ Reject unknown fields (strict Zod schemas) so clients cannot sneak in extra fields such as `role`, `price` or `status`
- [ ] ➕ Cap pagination (maximum `limit`) and reject unbounded queries
- [ ] ➕ Swagger/OpenAPI docs and verbose errors are off in production
- [ ] ➕ The server enforces business rules at order time: opening hours, minimum order, delivery zone, item availability (C9)
- [ ] ➕ If prices changed since the customer built the cart, the server returns the new totals and the app asks the customer to confirm. It never silently charges a different amount

#### Realtime (Socket.IO)

- [ ] Authenticate the JWT on the **handshake**, and authorize **every room join** on the server
- [ ] Event names and payload types are defined in `shared-types`
- [ ] `transports: ["websocket"]` on the client (C5)
- [ ] ➕ The client never chooses its own user id or rooms. The server joins rooms from the verified token (C5, R5)
- [ ] ➕ A rider can emit location only for their own active order. The server forwards it only to that order's customer room (R6)
- [ ] ➕ Location updates are rate-limited and size-limited on the server
- [ ] ➕ The `riders:available` offer shows only what a rider needs to decide (pickup, rough drop-off area, fee). The customer's exact address and phone are revealed only after that rider accepts
- [ ] ➕ Sockets are closed or re-authenticated when the access token cannot be renewed

#### Payments and cash

- [ ] Use a hosted payment gateway available in your country. **Never store card data**
- [ ] Mark an order paid **only from the gateway's webhook**, after verifying its signature
- [ ] Reconcile payments regularly and log every payment event
- [ ] ➕ Webhooks also reject replays (check the timestamp or event id)
- [ ] ➕ Cash ledger entries are append-only. Mistakes are fixed with a correcting entry, never an edit or delete
- [ ] ➕ The server compares the cash a rider records with the order total and flags any mismatch
- [ ] ➕ Settling rider cash is an admin-only action and is written to `auditLogs`

#### Data and infrastructure

- [ ] MongoDB: TLS, IP allowlist (never `0.0.0.0/0` in production), least-privilege user, automated backups, tested restore
- [ ] Secrets live in environment variables or a secret manager. `.env` is in `.gitignore` from day one
- [ ] No secrets in frontend code. Everything in a bundle or APK is public
- [ ] Image uploads use **signed URLs**, with file type and size validation
- [ ] `npm audit` and Dependabot/Renovate enabled. Lockfile committed
- [ ] Separate dev, staging and production environments with separate credentials
- [ ] ➕ 2FA on every account that can hurt you: GitHub, MongoDB Atlas, Firebase, Google Play Console, the server host, Cloudflare, Cloudinary, Sentry
- [ ] ➕ Secret scanning in CI, and a written rule: if a secret leaks, rotate it immediately
- [ ] ➕ Never copy production data into development
- [ ] ➕ Backups are encrypted. Production database access is through named users only

#### Frontend and mobile (Android)

- [ ] No `dangerouslySetInnerHTML` with user data. Add a Content-Security-Policy
- [ ] Android release builds: **R8 minification on**, debug logging off, keystore backed up safely
- [ ] Only request permissions you need, and explain background location clearly to riders
- [ ] ➕ Strip `console.log` from release builds (C3)
- [ ] ➕ Release builds never point `server.url` at a development machine, and cleartext (non-HTTPS) traffic stays off
- [ ] ➕ Open external links with `@capacitor/browser`. Never load untrusted pages inside the app's WebView, and keep the navigation allowlist tight
- [ ] ➕ Make sure WebView remote debugging is off in release builds (check the matching Capacitor option)
- [ ] ➕ Review `android:allowBackup` in the manifest so tokens are not copied into device backups
- [ ] ➕ Tokens only in secure storage. Clear secure storage on logout. Harmless data such as the cart may use `localStorage`
- [ ] ➕ Only choose maintained plugins that support your Capacitor version

#### Privacy and operations

- [ ] Share rider location with a customer **only during that customer's active delivery** (C6, R6)
- [ ] Never log tokens, passwords, OTPs or full personal data
- [ ] Privacy policy URL ready (needed for the Play Store)
- [ ] Error monitoring (Sentry) and uptime monitoring active
- [ ] ➕ Scrub personal data from Sentry events before they are sent
- [ ] ➕ Delete live rider location after delivery (Redis expiry). Write down how long you keep orders and location history
- [ ] ➕ ⚠️ Google Play requires apps that let people create an account to offer account deletion. Check the current rule and plan an in-app deletion path plus a web link
- [ ] ➕ The customer app asks for location only when the customer opens the address pin. It never uploads location in the background (C6)

### 12.3 Engineering rules

#### Code and architecture

1. Controllers stay thin. Services hold logic. The state machine is the only code that changes `order.status`.
2. Apps never import from other apps. Dependencies flow one way: `apps → packages`.
3. `shared-types` is the single source of truth for statuses, roles and socket events. Reuse its Zod schemas on both the API and the apps.
4. All server calls go through `packages/api-client`. No hand-written `fetch` in components.
5. All money goes through the shared money helper. No floating-point money anywhere (R9).
6. Validate all environment variables at startup, so the server **fails fast** if one is missing.
7. ➕ TypeScript strict mode on. No `any` at API boundaries.
8. ➕ The apps only display. Business rules (prices, eligibility, permissions) live on the server.
9. ➕ One React version and one Capacitor version across the repo.

#### API and compatibility

1. Prefix and version routes (`/v1/...`). Keep old versions alive until old app versions fade out.
2. Changes are **additive**: add fields, never rename or remove them.
3. Apps **ignore unknown statuses and events** safely, and use feature flags for risky features.
4. One error shape: `{ "error": { "code": "...", "message": "..." } }`.
5. `Idempotency-Key` header on order and payment creation.
6. ➕ Generate order numbers (such as `FD-1042`) with an atomic counter, so two orders never share a number.
7. ➕ Publish the API as OpenAPI documentation. Keep the force-update check (`/v1/app-config`) working from the first release.

#### Database

1. Index every query pattern. Always paginate. Use `.lean()` and projections on read-heavy queries.
2. Use transactions where two writes must succeed together, and atomic updates for races.
3. Use TTL indexes for temporary data (OTP codes, expired sessions).
4. Keep database migrations and scripts versioned and reviewed.
5. ➕ Let unique indexes enforce the rules that matter (phone, idempotency key), not only application code.

#### Realtime and background work

1. After every reconnect or app resume, refetch current state through REST.
2. Throttle location updates (every 5 to 10 seconds). Send them to one customer's room only.
3. Slow work (SMS, push, payment calls) goes through BullMQ queues, never inside a request.
4. ➕ Every job is safe to retry without double effects.

#### Frontend and mobile

1. Use the absolute API URL from `VITE_API_URL`.
2. Clean up socket listeners in `useEffect` cleanup. Lazy-load routes. Virtualize long lists. Tear the map down when leaving the tracking screen.
3. Use CSS safe-area insets for edge-to-edge screens.
4. ➕ Every screen has loading, empty, error and offline states.
5. ➕ Buttons that send data are disabled while the request runs.
6. ➕ Keep tap targets large enough for one-handed use, since riders use the app on the move.

#### Android and release

1. Unique `appId` per app. Never change it after publishing.
2. Test **release** builds with R8 on real phones, not only debug builds.
3. Increase `versionCode` for every Play upload.
4. One upload keystore per app, backed up in two places.
5. Test on real phones from several brands, including cheap models your riders use.
6. Use a staged rollout (for example 10% then 50% then 100%) and watch crash reports.

#### Git and process

1. Protected `main`, short-lived feature branches, pull requests with review, and required CI checks.
2. Husky + lint-staged block bad commits. The lockfile is committed.
3. ➕ Production deploys happen only from release tags, and always after staging.
4. ➕ Every bug fix gets a regression test.
5. ➕ Every new route gets an ownership (IDOR) test before it is merged.

#### Operations

1. Same cloud region for the API, Atlas and Redis. Always-on hosting in production. No free database tier in production.
2. Restore a database backup once, as practice, before launch.
3. Keep a one-page runbook: what to do if the API is down, the database is slow, or payments fail.
4. ➕ A business kill switch: the admin can pause new orders (for example when the kitchen is overloaded), and `app-config` has a maintenance flag.
5. ➕ Decide who receives Sentry, uptime and Atlas alerts, and how fast they must react.

### 12.4 Must-have tests before launch

**From the blueprint:**

- [ ] Illegal status transitions are rejected
- [ ] Two riders accepting at once means exactly one wins
- [ ] Client-sent prices are ignored
- [ ] Customers cannot open other customers' orders
- [ ] A payment is marked paid only through a valid webhook signature (when online payment is added)
- [ ] Old app versions still work against the current API
- [ ] The release APK works with R8 on, with no missing-class crashes

**➕ Added tests, covering the Groxo gaps:**

- [ ] Signup ignores any `role` or other privileged field sent by the client (C2)
- [ ] The same idempotency key sent twice creates exactly one order (C9)
- [ ] A rider cannot pick up or deliver an order assigned to another rider (R8)
- [ ] Delivery with a wrong OTP is rejected, and repeated attempts are limited (R4)
- [ ] The delivery OTP never appears in any payload sent to a rider
- [ ] A socket without a valid token is refused. A user cannot join another customer's order room (C5)
- [ ] A customer never receives another customer's rider location (R6)
- [ ] Orders outside opening hours, outside the delivery zone, below the minimum, or with an unavailable item are rejected (C9)
- [ ] A rider cannot send any `status` value directly. Only pickup and deliver actions exist (R4)
- [ ] Cash recorded that does not match the order total is flagged
- [ ] Rate limits trigger on login, OTP and order creation
- [ ] Logout makes the old refresh token unusable (R7)
- [ ] A suspended rider can no longer accept orders

Testing levels: unit tests (state machine, pricing, coupons), component tests (cart, checkout), API integration tests with Supertest (auth, ownership, atomic accept), end-to-end tests with Playwright (place order, admin accepts, status updates), real-device tests (push, background GPS, app resume, payment redirects), security checks (manual IDOR attempts, rate limits, `npm audit`), and a load test with many simultaneous orders and sockets.

### 12.5 Launch gate

Launch only when all of these are true:

- [ ] Every box in 12.2 is checked, or has a written reason why it does not apply
- [ ] Every test in 12.4 passes
- [ ] A database restore has been done once, and the runbook is written
- [ ] Both Android keystores are backed up in two places, and a signed release AAB has been built and tested on real phones
- [ ] A secret scan and a dependency audit are clean
- [ ] The finish-line test (section 3) passes end to end on real Android phones
- [ ] Rollout starts with a small group, and you have watched a full week without critical bugs before going to everyone


---

## 13. Hosting, operations and monitoring

| Part | Choice |
|---|---|
| API | Railway, Render, Fly.io, DigitalOcean or AWS. **Always-on**, in the **same region** as Atlas |
| Database | MongoDB Atlas, dedicated tier for production |
| Redis | Managed Redis (Upstash, Redis Cloud or your host's add-on) |
| Admin web panel | Vercel, Netlify or Cloudflare Pages |
| DNS, CDN, WAF | Cloudflare |
| Images | Cloudinary or S3 + CDN |

- Groxo's API currently runs on a Render address. Do not reuse that deployment for this project. If any instance is on a free plan, remember that free instances sleep and cause slow first requests.
- Suggested domains: `api.example.com` and `admin.example.com`.
- **CI/CD (GitHub Actions):** on a pull request: install, lint, type-check, unit tests, build only affected packages. On merge to `main`: deploy to staging and run smoke tests. On a release tag: deploy the API to production, build signed AABs in CI with secrets from GitHub Secrets, and upload to a Play testing track.
- **Git:** protected `main`, short-lived feature branches, pull requests with required CI checks.
- **Monitoring:** Sentry (frontend, API, mobile), an uptime monitor on `/health`, Atlas alerts (slow queries, connections, disk), a dashboard for order counts, time-to-accept, failed payments and rider acceptance rate, and structured pino logs with a request id.
- **Backups:** Atlas automated backups with point-in-time recovery. **Restore one once, as practice.** Keep keystores, `.env` copies and Firebase configs in a password manager. Write a one-page runbook for "API down", "database slow" and "payments fail".
- **Speed:** keep the API, Atlas and Redis in one region, force websocket transport, index every query pattern, paginate, and push slow work (SMS, push, payments) through BullMQ queues. Typical targets when deployed well, as rough ballparks from the blueprint: a new order reaches the admin panel in about 100 to 400 ms, and a status change reaches the customer in about 50 to 200 ms.

---

## 14. Risks

| Risk | What to do |
|---|---|
| Rider GPS stops when the screen is off | Run the device test early (section 9). Keep the Groxo `RiderApp` as the fallback |
| Rewriting about 33 screens takes longer than expected | Port only what the finish line needs. Defer Chat and Rate. Use the porting recipe in section 5.4 |
| Groxo-specific logic leaks into the new app (bundles, wholesaler pickup, `adminPrice`) | Use the gap table in section 4.5 and Appendix A as a checklist. Search the code for `bundle`, `wholesaler`, `adminPrice`, `groxo` before release |
| A Capacitor plugin does not support Capacitor 8 | Check support and maintenance before choosing any plugin |
| Play testing delays the launch | Create the Play account and recruit 12 testers early. Run the tests for all apps in parallel |
| Cash totals do not match | Build the cash ledger together with delivery completion, not later |
| Old installed APKs break after an API change | Version routes, make changes additive, keep the `app-config` force-update screen |
| Release build crashes because R8 strips plugin classes | Test the signed release build on real phones, not only debug builds |
| Lost keystore | Back it up in two places before the first upload |
| Scope keeps growing | Only build what the finish-line test needs. Coupons, reports, receipts and online payment come after |

---

## 15. Decisions to confirm

1. **Conversion approach.** Option A (full port to React DOM) is recommended. Choose B only if you want a throwaway demo APK quickly.
2. **Status model and dispatch timing.** Your starter plan used two tracks (kitchen and delivery) and offered the delivery when preparing starts. The blueprint uses one linear machine and offers it when the order is `READY`. This plan follows the blueprint. Offering earlier shortens the wait for food but means riders may stand at the restaurant, and it needs the two-track model. Which do you want?
3. **NestJS or Express** for the API. NestJS is recommended because it enforces the module structure.
4. **Play account type.** Personal (needs the 12-tester, 14-day closed test) or organization (needs a D-U-N-S number, no test).
5. **Chat and ratings in version 1.** Groxo has both. Recommended: defer them.
6. **Brand name and `appId` values.** They cannot change after publishing.

Optional but useful: index Groxo's backend repo (`Ahsan3727/groxo`) in Graphify so its COD settlement and rider earnings rules can be read directly instead of inferred from the apps.

---

## Appendix A: Screen-by-screen disposition

Screens marked † were not opened. Their disposition is inferred from the name and imports, so confirm it when you port them.

### Customer app (23 screens)

| Groxo screen | Decision | Goes to | Notes |
|---|---|---|---|
| `HomeScreen` † | Rework | `features/menu` | Categories, featured items, restaurant open/closed banner |
| `LoginScreen` | Rework | `features/auth` | Phone OTP or email (C1, C2) |
| `SignupScreen` | Rework | `features/auth` | OTP verification; no `role` sent (C2) |
| `ProductListScreen` † | Rework | `features/menu` | Items per category |
| `ProductDetailScreen` † | Rework | `features/menu` | Add sizes and add-ons |
| `BundleListScreen`, `BundleDetailScreen` | **Drop** | none | Grocery bundles. Combos can return later |
| `SearchScreen` † | Keep | `features/menu` | Menu search |
| `CartScreen` | Rework | `features/cart` | Ids, options and quantity only; server-priced (C8) |
| `OrderMapPicker` | Rework | `features/checkout` | `react-leaflet` pin, required address line, idempotency key, no `0,0` fallback (C9, C10) |
| `OrderConfirmScreen` † | Rework | `features/checkout` | Confirmation and order number |
| `OrdersScreen` † | Rework | `features/orders` | Paginated history |
| `OrderDetailScreen` † | Rework | `features/orders` | Server totals and status history |
| `TrackOrderScreen` | Rework | `features/tracking` | Socket only, shows delivery OTP, full status steps (C11, C12) |
| `CancelOrderScreen` † | Rework | `features/orders` | `POST /v1/orders/:id/cancel` within the allowed window |
| `RateScreen` † | **Defer** | later | Not in the finish line |
| `ChatScreen` † | **Defer** | later | Not in the finish line |
| `WalletScreen` † | **Drop** | none | Launch with cash on delivery |
| `AddAddressScreen`, `AddressListScreen` † | Rework | `features/profile` | Saved addresses with a pin |
| `ProfileScreen` | Rework | `features/profile` | |
| `SettingsScreen` † | Rework | `features/profile` | |
| `HelpScreen` † | Rework | `features/profile` | Restaurant contact details |

### Rider app (10 screens)

| Groxo screen | Decision | Goes to | Notes |
|---|---|---|---|
| `LoginScreen` | Rework | `features/auth` | Login only; accounts come from the admin |
| `SignupScreen` | **Drop** | none | R1 |
| `DashboardScreen` | Rework | `features/availability` | Online toggle that tells the server, today's deliveries, cash to settle (R2) |
| `WaitingScreen` | Rework | `features/requests` | Becomes pushed delivery requests with a countdown (R3) |
| `OrderAssignedScreen` | Rework | `features/active-delivery` | Steps: to restaurant, pickup, to customer, **OTP entry**; Google Maps deep link; no free-form status (R4, R8) |
| `MapScreen` † | Rework or merge | `features/active-delivery` | Likely merges into the active-delivery map |
| `OrderHistoryScreen` † | Keep | `features/history` | |
| `EarningsHistoryScreen` † | Keep | `features/earnings` | Add the cash ledger view and settlement status |
| `ProfileScreen` † | Rework | `features/profile` | |
| `SettingsScreen` † | Rework | `features/profile` | Battery-optimization help for background location |
