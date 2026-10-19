---
name: debug-issue
description: >-
  Use this skill when the user reports a bug, crash, or unexpected behavior in
  the fast-food management system (CustomerApp or RiderApp). Guides the agent
  through systematic diagnosis, root cause analysis, and applying a fix.
---

# Debug Issue Skill

This skill guides you through diagnosing and fixing bugs in the fast-food management system.

## Steps

1. **Reproduce the Issue**
   - Ask the user for exact steps to reproduce the bug.
   - Identify which app (CustomerApp or RiderApp) and which screen/flow is affected.

2. **Gather Evidence**
   - Read the relevant source files for the affected feature.
   - Look for console errors, stack traces, or incorrect state values.

3. **Identify Root Cause**
   - Trace the data flow from the UI to the data layer.
   - Check for null/undefined values, incorrect API responses, or logic errors.

4. **Apply Fix**
   - Make the minimal, targeted change to resolve the root cause.
   - Avoid introducing unrelated changes.

5. **Verify Fix**
   - Confirm the original issue no longer occurs.
   - Ensure no regressions in related flows.

## Tips

- Always fix the root cause, not just the symptom.
- Add a comment near the fix if the reason is non-obvious.
- If the bug is in shared logic, test both CustomerApp and RiderApp.
