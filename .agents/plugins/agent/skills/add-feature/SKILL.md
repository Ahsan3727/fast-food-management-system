---
name: add-feature
description: >-
  Use this skill when the user asks to add a new feature to the fast-food
  management system (e.g., adding a new menu item category, loyalty points,
  order tracking, or delivery management). Guides the agent through planning,
  implementing, and verifying the new feature end-to-end.
---

# Add Feature Skill

This skill guides you through adding a new feature to the fast-food management system consistently.

## Steps

1. **Understand the Feature**
   - Clarify the feature's scope and which app it targets: `CustomerApp`, `RiderApp`, or both.
   - Identify affected modules (UI screens, API calls, state management).

2. **Plan the Implementation**
   - List all files that need to be created or modified.
   - Define the data model changes required (if any).

3. **Implement the Feature**
   - Create new screens/components under the relevant app directory.
   - Wire up state management or API integration as needed.
   - Follow existing code conventions in the project.

4. **Verify**
   - Run the app and navigate to the new feature.
   - Confirm no existing features are broken.
   - Check for any lint or type errors.

## Tips

- Keep new components focused and reusable.
- Reuse existing UI components before creating new ones.
- Always handle loading and error states for any async operations.
