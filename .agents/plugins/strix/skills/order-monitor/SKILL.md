---
name: order-monitor
description: >-
  Use this skill when the user asks to monitor, track, or audit live orders in
  the fast-food management system. Guides the agent through inspecting order
  states, detecting stuck or failed orders, and resolving order lifecycle issues
  across the CustomerApp and RiderApp.
---

# Order Monitor Skill

This skill guides you through monitoring and auditing order states in the fast-food management system.

## Order Lifecycle

```
PLACED → CONFIRMED → PREPARING → READY → PICKED_UP → DELIVERED
                                                    ↘ CANCELLED
```

## Steps

### 1. Identify the Problem
- Determine which order state is problematic (e.g., stuck in PREPARING, never moves to READY).
- Identify which app is showing the issue: CustomerApp or RiderApp.

### 2. Inspect Order State Logic
- Locate the order state management files.
- Check transitions: are all state changes properly triggered and propagated?
- Look for missing status update calls or unhandled API responses.

### 3. Check Real-Time Updates
- Verify that the app is correctly subscribing to order status updates.
- Ensure WebSocket/polling logic is alive and not silently failing.

### 4. Resolve Issues
- Fix broken state transitions or missing update triggers.
- Handle edge cases: network drops during an order, rider cancellation, etc.

### 5. Verify
- Walk through a full order lifecycle end-to-end.
- Confirm status changes reflect correctly in both CustomerApp and RiderApp.

## Tips

- Always test cancellation paths — they are often undertested.
- Ensure error states are surfaced to the user with clear messaging.
- Avoid polling; prefer real-time push updates where possible.
