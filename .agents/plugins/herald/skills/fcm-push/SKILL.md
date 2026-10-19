---
name: fcm-push
description: >-
  Use this skill when the user asks to set up, debug, or improve push
  notifications in the fast-food management system using Firebase Cloud
  Messaging (FCM) and the Capacitor push-notifications plugin. Covers both
  CustomerApp and RiderApp notification flows.
---

# FCM Push Notifications Skill

This skill guides you through implementing and debugging Firebase Cloud Messaging (FCM) push notifications in the fast-food management system.

## Architecture

```
API (NestJS notifications module)
  → FCM (Firebase Admin SDK)
    → CustomerApp (@capacitor/push-notifications)
    → RiderApp (@capacitor/push-notifications)
```

Sockets deliver real-time in-app updates. FCM is the **backup** for when the app is in the background or closed.

## Key Flows

| Event | Who receives FCM | What it says |
|---|---|---|
| Order placed | Restaurant admin panel | "New order #123 received" |
| Order accepted/rejected | Customer | "Your order has been accepted" |
| Delivery offer | Rider | "New delivery request nearby" |
| Offer cancelled | Rider | "Delivery request taken by another rider" |
| Order delivered | Customer | "Your order has been delivered" |

## Steps

### 1. Firebase Setup

- Create a Firebase project (one per app: customer, rider).
- Download `google-services.json` and place it in `apps/customer/android/app/` and `apps/rider/android/app/`.
- **Important**: The Firebase `appId` is tied to the Android package name — do not change after publishing (C7).

### 2. Capacitor Plugin Setup

```bash
pnpm add @capacitor/push-notifications --filter customer
npx cap sync android
```

Register the FCM token on app start in `lib/push.ts` and send it to the API:

```ts
// POST /v1/devices  { fcmToken, platform: 'android' }
```

Delete the token on logout.

### 3. API: Sending Notifications

Use Firebase Admin SDK in `apps/api/src/modules/notifications/`:

```ts
await admin.messaging().send({
  token: rider.fcmToken,
  notification: { title: 'New delivery request', body: 'Order #123 is ready for pickup' },
  data: { orderId: order._id.toString(), type: 'DELIVERY_REQUEST' },
});
```

### 4. Debug Failing Notifications

- Confirm `google-services.json` is present and matches the correct Firebase project.
- Confirm the FCM token is saved to the database and not expired.
- Use the Firebase console's "Send test message" to validate the token is live.
- Check the `notifications` module logs for errors from the Firebase Admin SDK.

### 5. Verify

- Send a test order and confirm both socket and FCM are received.
- Put the app in the background and confirm FCM still arrives.
