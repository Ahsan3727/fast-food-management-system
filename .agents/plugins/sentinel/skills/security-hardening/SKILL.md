---
name: security-hardening
description: >-
  Use this skill when the user asks to harden, secure, or review the security
  posture of the fast-food management system API or apps. Covers input
  validation, rate limiting, CORS, headers, data sanitization, and secret
  management.
---

# Security Hardening Skill

This skill guides you through hardening the security of the fast-food management system.

## Steps

### 1. API Hardening Checklist

- **Helmet**: Confirm `helmet()` is applied in `main.ts` (sets secure HTTP headers).
- **CORS**: Confirm an allowlist of origins is set — never `*` in production.
- **Rate Limiting**: Check that login, OTP request, and order creation endpoints have rate limits (Redis counters).
- **Input Validation**: Confirm a global Zod/validation pipe is applied in NestJS. All DTOs are validated.
- **Mongo Sanitization**: Apply `mongo-sanitize` or equivalent to prevent NoSQL injection.
- **Idempotency Keys**: Confirm `POST /v1/orders` enforces a unique `Idempotency-Key` header.

### 2. Secrets & Environment Variables

- Confirm no secrets are hardcoded (API URLs, keys, tokens) — all must come from `.env`.
- Check `.gitignore` includes `.env`, `*.jks`, `keystore.properties`, service-account JSON.
- Verify `.env.example` has all required keys documented but no real values.

### 3. Client-Side Security

- Confirm `console.log` of tokens, OTPs, or personal data is removed for release builds (see C3).
- Check that `strip: console` or equivalent is configured in the Vite release build.
- Verify the customer location is only read once (when picking a delivery pin) — not uploaded on a timer (C6).

### 4. Money & Price Integrity

- Confirm prices are never trusted from the client — all prices are recalculated server-side from the menu database.
- Confirm money is stored as integer paisa (never floats/decimals).

### 5. Fix & Verify

- Apply fixes for each gap found.
- Run a security-focused code review on `apps/api/src/main.ts`, `common/guards/`, and `common/pipes/`.

## Key Rules

- Never log tokens, OTPs, or personal data (C3).
- Never trust a role from the client (C2).
- Never trust prices from the client (C8).
- Never trust ownership from the client (R8).
