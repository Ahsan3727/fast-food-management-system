---
name: rider-dispatch
description: >-
  Use this skill when the user asks about rider assignment, dispatch logic,
  routing, or availability in the fast-food management system. Guides the agent
  through inspecting and improving how riders are assigned to orders in the
  RiderApp.
---

# Rider Dispatch Skill

This skill guides you through auditing and improving the rider dispatch system in the fast-food management system.

## Steps

### 1. Understand the Dispatch Flow
- Identify how riders are currently matched to orders (manual, automatic, proximity-based).
- Locate the dispatch logic in the RiderApp codebase.

### 2. Audit Rider Availability
- Check how rider availability status is tracked and updated.
- Confirm that offline/busy riders are excluded from dispatch.

### 3. Review Assignment Logic
- Inspect order-to-rider assignment rules.
- Check for race conditions (two riders accepting the same order).
- Ensure failed assignments are retried or escalated.

### 4. Optimize
- If using proximity, validate that location data is fresh and accurate.
- Reduce dispatch latency by pre-filtering available riders.

### 5. Verify
- Simulate an order and confirm it is dispatched to the correct rider.
- Confirm the rider receives a notification promptly.

## Tips

- Always handle the case where no riders are available gracefully.
- Rider location should be updated frequently but battery-efficiently.
- Log all dispatch decisions for debugging purposes.
