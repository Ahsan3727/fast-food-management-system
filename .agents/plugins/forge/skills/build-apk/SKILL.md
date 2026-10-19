---
name: build-apk
description: >-
  Use this skill when the user asks to build, compile, or generate an APK or
  AAB for the CustomerApp or RiderApp using Capacitor and Android Studio/Gradle.
  Guides the agent through the Capacitor build pipeline step by step.
---

# Build APK Skill

This skill guides you through building an Android APK or AAB from the Capacitor-wrapped React + Vite apps.

## Prerequisites

- Android Studio installed with the correct SDK.
- A signing keystore for the app (stored outside the repo in `keystores/`, never committed).
- `VITE_API_URL`, `VITE_SOCKET_URL`, and other env vars set in `.env`.

## Steps

### 1. Build the Web App

```bash
# From the monorepo root
pnpm turbo run build --filter=customer   # or --filter=rider
```

Confirm `apps/customer/dist/` (or `apps/rider/dist/`) is populated.

### 2. Sync to Capacitor

```bash
cd apps/customer   # or apps/rider
npx cap sync android
```

This copies `dist/` into the Android project and updates native plugins.

### 3. Open in Android Studio (first time or for signing config)

```bash
npx cap open android
```

Configure signing: `Build > Generate Signed Bundle / APK` and point to the keystore.

### 4. Build via Gradle (CI / headless)

```bash
cd apps/customer/android
./gradlew assembleRelease    # APK
./gradlew bundleRelease      # AAB (for Play Store)
```

Output is in `app/build/outputs/`.

### 5. Verify the Build

- Install the APK on a real Android device.
- Walk through: login → menu → cart → order → tracking.
- Confirm the correct `VITE_API_URL` is baked in (check network requests).

## Common Issues

| Problem | Fix |
|---|---|
| Blank white screen | Check Vite base URL in `vite.config.ts`; must be `'./'` for Capacitor |
| Plugin not found | Run `npx cap sync android` again after installing new Capacitor plugins |
| Signing error | Verify keystore path and alias in `keystore.properties` |
| Map tiles not loading | Check Leaflet CSS is imported and container has a fixed height |
