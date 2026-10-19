---
name: auth-audit
description: >-
  Use this skill when the user asks to audit, review, or fix authentication and
  authorization in the fast-food management system. Covers JWT tokens, refresh
  rotation, secure storage, role guards, and ownership checks across the API,
  CustomerApp, and RiderApp.
---

# Auth Audit Skill

This skill guides you through auditing and hardening authentication and authorization in the fast-food management system.

## Security Rules (from the implementation plan)

- **Tokens**: JWT access token (~15 min) + rotating refresh token stored hashed in `refreshTokens` collection.
- **Storage**: Tokens stored in Capacitor secure (Keystore-backed) storage — never in `localStorage`.
- **Roles**: Never accept a role from the client. The API sets the role server-side.
- **Socket**: JWT checked on the handshake; rooms authorized server-side. Never pass `userId` from the client.
- **Ownership**: Every route that touches an order or rider resource must verify the caller owns it — never trust the app.

## Steps

### 1. Identify the Auth Concern
- Is this a login flow issue, token storage issue, role guard issue, or socket auth issue?
- Identify which layer: API (`apps/api`), CustomerApp, or RiderApp.

### 2. Audit Token Handling
- Check that access tokens are short-lived and refresh tokens are rotated on each use.
- Verify reuse detection: if an old refresh token is replayed, revoke all sessions for that user.
- Confirm no tokens are logged (`console.log`, pino, Sentry).

### 3. Audit Role & Ownership Guards
- Verify `RolesGuard` and `OwnershipGuard` are applied to all protected routes.
- Check that the `role` field is never taken from the request body or query params.
- Confirm rider can only update their own orders (`isAssignedRider` enforced server-side, not client-side — see R8).

### 4. Audit Socket Security
- Ensure JWT is passed in the `auth` handshake option, not the query string (see C5).
- Confirm `transports: ['websocket']` is set (no polling fallback).
- Check that every `socket.join(room)` is authorized on the server.

### 5. Fix & Verify
- Apply targeted fixes for each issue found.
- Re-test the login → token refresh → logout flow end-to-end.
- Confirm logout revokes the refresh token on the server.

## Common Issues

| Issue | Where to Look | Fix |
|---|---|---|
| `role` sent from client | `CustomerApp/features/auth` | Remove from request; server sets role |
| Token in `localStorage` | `lib/secureStorage.ts` | Use `@capacitor-community/secure-storage` |
| `userId` in socket query | `lib/socket.ts` | Move to `auth: { token }` option |
| No reuse detection | `apps/api/modules/auth` | Revoke all tokens for user on replay |
| Ownership not checked | `apps/api/common/guards` | Add `OwnershipGuard` to route |
