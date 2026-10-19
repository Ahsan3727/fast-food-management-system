---
name: run-tests
description: >-
  Use this skill when the user asks to run, write, or fix tests in the fast-food
  management system. Covers unit tests (Vitest/Jest), API integration tests
  (Supertest), and end-to-end tests (Playwright) across the monorepo.
---

# Run Tests Skill

This skill guides you through running and writing tests in the fast-food management system monorepo.

## Test Stack

| Type | Tool | Location |
|---|---|---|
| Unit tests (frontend) | Vitest + React Testing Library | `apps/*/src/**/*.spec.tsx` |
| Unit tests (backend) | Jest | `apps/api/src/**/*.spec.ts` |
| Integration tests (API) | Supertest | `apps/api/test/` |
| End-to-end | Playwright | `e2e/` (if set up) |

## Steps

### 1. Run All Tests

```bash
# From the monorepo root
pnpm turbo run test
```

### 2. Run Tests for a Specific App or Package

```bash
pnpm turbo run test --filter=api
pnpm turbo run test --filter=customer
pnpm turbo run test --filter=shared-types
```

### 3. Run a Single Test File

```bash
cd apps/api
pnpm jest src/modules/orders/orders.service.spec.ts
```

### 4. Writing a New Test

- **Unit test**: Test service logic in isolation; mock dependencies with Jest mocks.
- **Integration test**: Use Supertest to test the full HTTP layer against a test MongoDB instance.
- **Key areas to test**: Order state machine transitions, price calculation, rider dispatch atomic accept.

### 5. Fix Failing Tests

- Read the error carefully — is it a logic error or a stale mock?
- Check if schema or DTO changes broke existing tests.
- Confirm test database is isolated and cleaned between runs.

## Tips

- Write tests for every order state machine transition — they are the most critical logic.
- Mock external services (FCM, Redis) in unit tests; use real instances in integration tests.
- Keep test files next to the files they test (`orders.service.spec.ts` beside `orders.service.ts`).
