---
name: headroom
description: >-
  Use this skill when the user asks to check, manage, or free up headroom in
  the fast-food management system — such as analyzing performance bottlenecks,
  memory usage, storage capacity, or API rate limits. Guides the agent through
  auditing the system and applying optimizations to create headroom.
---

# Headroom Skill

This skill guides you through identifying and resolving headroom-related concerns in the fast-food management system (CustomerApp or RiderApp).

## What is "Headroom"?

Headroom refers to the available capacity or buffer in a system before it hits a limit. This includes:
- **Performance**: Rendering speed, frame drops, slow screens.
- **Memory**: Large data sets held in state unnecessarily.
- **Storage**: Local storage or cache usage.
- **API Rate Limits**: Excessive or redundant network calls.
- **Bundle Size**: Large assets or unused dependencies bloating the app.

---

## Steps

### 1. Identify the Concern
- Ask the user which type of headroom they are concerned about.
- Identify which app and screen/flow is the focus.

### 2. Audit Current Usage
- Review the relevant files for the affected area.
- Look for:
  - Large in-memory lists that aren't paginated.
  - Redundant or polling API calls.
  - Heavy assets (images, fonts) not optimized.
  - State that is never cleared or reset.

### 3. Quantify the Problem
- Estimate the impact (e.g., "API is called every 2 seconds unnecessarily").
- Prioritize issues by severity: Critical > High > Low.

### 4. Apply Optimizations
- **Performance**: Memoize expensive computations, reduce re-renders.
- **Memory**: Clear unused state, paginate large lists.
- **API**: Debounce calls, cache responses, remove polling where unnecessary.
- **Bundle**: Remove unused imports, lazy-load heavy screens.

### 5. Verify Headroom Gained
- Confirm the targeted metric has improved.
- Ensure no regressions in affected flows.

---

## Tips

- Always measure before and after to prove the gain.
- Prefer lazy loading for screens that are not on the critical path.
- Cache API responses that don't change frequently (e.g., menu items).
- Avoid storing large arrays in global state — paginate or stream instead.
