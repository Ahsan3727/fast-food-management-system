# Honest Overview & Codebase Audit: Fast-Food Management System

**Repository:** [github.com/Ahsan3727/fast-food-management-system](https://github.com/Ahsan3727/fast-food-management-system)  
**Homepage (Admin Panel):** [fast-food-management-system-ashy.vercel.app](https://fast-food-management-system-ashy.vercel.app)  
**Reviewed:** 21 October 2026, from public `main` at commit `51785e2`  
**Verdict:** A capable **student / MVP skeleton** for a single-restaurant COD delivery stack. The architectural ideas are sound, but the system needs key reliability and security refinements before being production-ready.

---

## 1. System Overview

An online ordering platform for **one restaurant**:

| Surface | Target Users | Technology Stack | Purpose |
|---|---|---|---|
| `apps/customer` | Customers | React + Vite + TypeScript, Capacitor Android | Browse, cart, checkout, live order tracking, history |
| `apps/rider` | Delivery Riders | React + Vite + TypeScript, Capacitor Android, Background Geolocation | Accept jobs, GPS tracking, OTP delivery, cash earnings |
| `apps/admin` | Owner / Restaurant Staff | React + Vite Web | Orders management, menu control, rider dispatch, customer management, analytics |
| `apps/api` | Central Backend | NestJS 10, MongoDB Atlas, Upstash Redis, Socket.IO, BullMQ | Business logic, authentication, pricing, real-time events |

### Shared Packages

- `@fastfood/shared-types` — Enums (roles, order statuses), socket event contracts, and shared Zod schemas.
- `@fastfood/utils` — Integer paisa/rupee currency utilities and datetime helpers.

Monorepo orchestrated with **pnpm + Turborepo** (Node 20+, pnpm 9+). Payment method is currently **Cash On Delivery (COD) only**, centered on a single restaurant default location (Lahore: `31.5204, 74.3587`).

---

## 2. Repository Health & Metrics

| Metric | Status |
|---|---|
| Created | 19 Oct 2026 |
| Commits on `main` | Recent active development |
| Stars / Forks / License | 0 / 0 / None declared |
| Documentation | `README.md` missing (detailed `fastfood-implementation-plan.md` present) |
| CI Pipeline | Missing (`.github/workflows`) |
| Test Coverage | Jest declared in `apps/api/package.json`, 0 active test suites |
| Build Artifacts | `apps/api/dist` committed to git for low-RAM container deployment |
| Agent Customizations | Present under `.agents/plugins` (ponytail, sentinel, strix, forge, herald, nexus, vault) |
| Semantic Version | `1.0.0` (premature for current completeness) |

---

## 3. Architecture & Design Evaluation

```
Customer App / Rider App / Admin App (Vite React)
                  │ 
                  │ HTTP /v1 (REST) + Socket.IO (WebSockets)
                  ▼
          NestJS Backend API
    ├── Auth (JWT Access + Hashed Refresh Tokens)
    ├── Menu (Server-side price computation)
    ├── Orders (State machine with role guards)
    ├── Riders (Online status & cash balance tracking)
    ├── Uploads (Cloudinary storage integration)
    ├── Health & App Config
    └── Realtime Gateway (Socket.IO rooms)
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
  MongoDB Atlas       Upstash Redis (TLS)
```

### Strong Architectural Choices

1. **Server-Side Price Calculation:** Cart submissions send item IDs and quantities; `MenuService.validateCartAndPrice` recalculates all prices on the server. Client-provided prices are completely untrusted.
2. **Integer Paisa Currency:** All monetary amounts are stored in integer paisa (`1 PKR = 100 paisa`), avoiding floating-point rounding errors.
3. **Formal State Machine:** Strict transitions in `order.state-machine.ts` prevent invalid order progression (e.g. jumping from `PLACED` directly to `DELIVERED`).
4. **Race Condition Prevention:** Order assignment uses atomic `findOneAndUpdate({ status: READY, riderId: null })`, preventing multiple riders from claiming the same order.
5. **Secure Delivery OTP:** Stored with `select: false` on the MongoDB schema; accessible only via dedicated customer-authenticated endpoint.
6. **Robust Password Hashing:** Passwords hashed with `argon2`; user registration forces role `CUSTOMER` server-side.
7. **Refresh Token Rotation:** Stored as SHA-256 hashes, rotated upon every refresh request.
8. **Idempotency Support:** Orders enforce unique `idempotencyKey` via sparse database index and custom headers.

---

## 4. Gap Analysis Against Implementation Plan

| Feature / Objective | Implementation Status | Notes |
|---|---|---|
| Customer places order with server pricing | ✅ Implemented | Price validated server-side in integer paisa |
| Kitchen accept / prepare / ready flow | ✅ Implemented | Admin/staff transition buttons work via API |
| First rider wins atomic assignment | ✅ Implemented | Atomic `findOneAndUpdate` prevents double-assignment |
| Live rider location tracking | ⚠️ Partial | Socket emit works; `join:order` room lacks ownership validation |
| OTP + Cash collected on delivery | ⚠️ Partial | OTP validated; rider's unsettled cash ledger not incremented |
| Owner settles rider cash at end of day | ⚠️ Disconnected | Admin settle UI exists, but cash balance remains 0 |
| Online card / wallet payments | ❌ Not implemented | Enum currently supports `COD` only |
| Multi-tenant / Multi-restaurant | ❌ Not implemented | Single restaurant configuration |

---

## 5. Security & Risk Assessment

### High Severity

1. **CORS Configuration:**
   - Fallback origin handling dynamically reflects origins with `credentials: true`. Needs explicit whitelisting for production.
2. **Default Credentials in UI:**
   - The deployed Admin Login form renders `Default admin: +923001111111 / admin123456` in plain text.
3. **Socket Room Authorization:**
   - The `@SubscribeMessage('join:order')` gateway handler allows any authenticated socket to join `order:{orderId}` without checking if the user owns or is assigned to the order.
4. **JWT Revocation Latency:**
   - `JwtStrategy.validate` relies purely on cryptographic verification. Suspended users remain active until their access token expires (~15 min).

### Medium Severity

5. **Role Gating on Order Creation:** `OrdersController.createOrder` allows any authenticated user (including riders or staff) to place orders.
6. **Cart Input Sanitization:** DTO accepts `items: any[]`. A negative quantity could theoretically skew pricing if not validated at the schema level.
7. **Upload Permissions:** File upload endpoint is open to any authenticated user with generic MIME checks.

---

## 6. Logic & Functional Inconsistencies

1. **In-Memory Order Counter:**
   - `let orderCounter = 1000;` inside `orders.service.ts` will reset on container restarts. Since `orderNumber` is unique, this causes MongoDB `E11000` duplicate key collisions.
2. **Disconnected Rider Cash Ledger:**
   - `addUnsettledCash` is defined in `RidersService`, but never invoked in `verifyOtpAndDeliver`. Rider unsettled cash balances remain static.
3. **Rider Online Flag Split:**
   - Rider app updates `isOnline` in the `riders` collection, while order dispatch searches for `isOnline` in the `users` collection.
4. **Admin UI / API Route Mismatches:**
   - Admin pages for Customers and Riders query `GET /users?role=...` and call `PATCH /users/:id`. These methods exist in `UsersService` but were not exposed in `UsersController`.
5. **Unrouted Analytics:**
   - `OrdersService.getAnalytics()` aggregation exists in the service, but is not bound to a controller route; the admin frontend computes analytics client-side.

---

## 7. Operational Tradeoffs Explained

- **Why `dist` is tracked in git:** Deploying full TypeScript monorepos to low-resource free containers (e.g., Spaceship Hyperlift, Render free tier with 512MB RAM) caused compilation out-of-memory errors (`exit status 134`). Building `dist` locally and deploying a runtime-only container dropped deployment time from 5 minutes (with frequent failures) to under 20 seconds.
- **Why CORS used dynamic reflection:** Used during initial deployment to simultaneously unblock Vercel preview URLs, custom domains, and local Capacitor Android WebView (`https://localhost`).

---

## 8. Summary Scoring

| Dimension | Score | Assessment |
|---|---|---|
| Idea & Product Scope | **8 / 10** | Clean, targeted single-restaurant COD workflow |
| Architectural Foundation | **8 / 10** | Strong separation: state machine, server pricing, paisa integer math |
| Implementation Completeness | **4 / 10** | Happy-path works; settlement, admin user APIs, and analytics unlinked |
| Security Posture | **4 / 10** | Solid primitives (argon2, hidden OTP); socket authorization and UI leak need fixing |
| Code Quality & Maintainability | **5 / 10** | Clean NestJS modules; unexposed service methods; committed build artifacts |
| Testing & CI/CD | **1 / 10** | Comprehensive plan exists, but automated tests and GitHub Actions are absent |
| **Overall Readiness** | **5 / 10** | **Solid MVP / portfolio project; requires remediation before production.** |

---

## 9. Priority Remediation Plan

```
[Phase 1: API & Route Alignment] ───► [Phase 2: Data & State Fixes] ───► [Phase 3: Security & CI]
  • Expose /users admin routes           • Persistent order sequence         • Socket room auth guards
  • Expose /orders/analytics route       • Call addUnsettledCash on deliver  • Remove login UI hints
  • Synchronize rider online status      • Restrict CORS whitelist           • Add GitHub Actions CI
```

### Action Items

1. **Expose Missing Controller Endpoints:**
   - Wire `UsersController` to `usersService.listAll(role)` and `usersService.suspendUser(id)`.
   - Wire `OrdersController` to `ordersService.getAnalytics(days)`.
2. **Fix Data Integrity:**
   - Replace in-memory `orderCounter` with an atomic MongoDB sequence collection or timestamp-based sequence (`FD-YYYYMMDD-XXXX`).
   - Trigger `ridersService.addUnsettledCash` in `OrdersService.verifyOtpAndDeliver`.
   - Unify rider online status across `users` and `riders`.
3. **Security Tightening:**
   - Remove default credentials text from `LoginPage.tsx`.
   - Validate room ownership in `realtime.gateway.ts` for `join:order`.
   - Restrict CORS origins to explicitly configured environment variables.
4. **Repo Hygiene:**
   - Add a comprehensive `README.md` with setup and architecture docs.
   - Configure `.github/workflows/ci.yml` for automated linting and build validation.
