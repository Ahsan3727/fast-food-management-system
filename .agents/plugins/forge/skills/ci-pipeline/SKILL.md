---
name: ci-pipeline
description: >-
  Use this skill when the user asks to set up, fix, or improve the CI/CD
  pipeline for the fast-food management system. Guides the agent through GitHub
  Actions workflows for linting, type checking, testing, and building the
  monorepo.
---

# CI Pipeline Skill

This skill guides you through setting up and maintaining the GitHub Actions CI/CD pipeline for the monorepo.

## Pipeline Goals

On every push and pull request:
1. Lint (ESLint + Prettier)
2. Type check (TypeScript)
3. Unit + integration tests
4. Build all apps and packages

On merge to `main`:
5. Deploy API (Docker image push)
6. Optionally build APKs (manual trigger or tag)

## Steps

### 1. Review Existing Workflows

Check `.github/workflows/` for existing files. Key files should be:
- `ci.yml` — lint, typecheck, test
- `deploy-api.yml` — Docker build and push to registry
- `build-apk.yml` — APK build (manual trigger)

### 2. Monorepo CI with Turborepo

```yaml
- name: Run CI tasks
  run: pnpm turbo run lint typecheck test build
```

Use Turborepo's remote caching to skip unchanged packages:
```yaml
- name: Setup Turbo cache
  uses: actions/cache@v3
  with:
    path: .turbo
    key: turbo-${{ runner.os }}-${{ hashFiles('**/pnpm-lock.yaml') }}
```

### 3. Secrets Management in CI

- Store `VITE_API_URL`, `VITE_SOCKET_URL`, `MONGO_URI`, `JWT_SECRET`, and FCM keys as GitHub Actions secrets.
- Never print secrets in logs; use `::add-mask::` if needed.

### 4. Fix a Failing CI Run

- Read the workflow log for the failing step.
- Reproduce locally: `pnpm turbo run lint` / `pnpm turbo run test`.
- Fix the root cause (lint error, type error, or test failure) before re-pushing.

### 5. Verify

- Open a test PR and confirm all checks pass.
- Confirm the deploy step only runs on `main` branch merges.

## Tips

- Pin GitHub Actions versions to a SHA or version tag (e.g., `actions/checkout@v4`).
- Use `pnpm` with `--frozen-lockfile` in CI for reproducible installs.
- Fail fast: run lint before tests to surface quick errors first.
