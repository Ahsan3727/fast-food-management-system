---
name: secrets-audit
description: >-
  Use this skill when the user asks to audit, scan, or fix secrets management
  in the fast-food management system. Guides the agent through detecting
  hardcoded secrets, enforcing .gitignore rules, and ensuring safe secret
  rotation.
---

# Secrets Audit Skill

This skill guides you through auditing and fixing secrets management in the fast-food management system monorepo.

## What Counts as a Secret

- JWT signing secrets
- MongoDB Atlas connection strings
- Redis passwords
- Firebase service account keys (`FIREBASE_PRIVATE_KEY`)
- Android keystore files (`.jks`) and `keystore.properties`
- Any API key for a paid service (maps, SMS, CDN, payment gateway)

## Steps

### 1. Scan for Hardcoded Secrets

Search the codebase for patterns that suggest hardcoded secrets:

```bash
# Hardcoded URLs
grep -r "render.com" apps/ packages/
grep -r "mongodb+srv" apps/ packages/
grep -r "10.0.2.2" apps/ packages/    # Android emulator address (R5)

# Hardcoded tokens or keys
grep -rE "(secret|token|password|key)\s*[:=]\s*['\"][^'\"]{8,}" apps/ packages/
```

### 2. Verify .gitignore Coverage

Confirm `.gitignore` at the repo root includes:

```
.env
.env.*
!.env.example
keystores/
*.jks
keystore.properties
reference/
**/google-services.json   # Debate: some teams commit this; it's non-secret but app-specific
```

### 3. Verify .env.example is Complete

- Every variable used in the codebase must have a corresponding entry in `.env.example`.
- Each entry should have a comment explaining its purpose and example format.

### 4. Secret Rotation Checklist

When rotating a secret (e.g., JWT_SECRET):
1. Generate a new secret.
2. Update in production environment (hosting provider secrets).
3. Update in GitHub Actions secrets.
4. Restart the API — all existing sessions using the old secret will be invalidated (inform users).
5. Update `.env.example` comment if the format changed.

### 5. Fix Issues Found

- Replace hardcoded values with env var references.
- Move any accidentally committed secrets to a password manager and rotate them immediately.
- Add pre-commit hook (`gitleaks` or `detect-secrets`) to prevent future leaks.

## Tips

- Use `gitleaks` or `truffleHog` in CI to automatically scan for secret leaks on every push.
- Never share real `.env` files over chat or email — use a secrets manager (e.g., 1Password, Doppler).
