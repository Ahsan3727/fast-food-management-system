---
name: code-review
description: >-
  Use this skill when the user asks to review code, check code quality, or
  audit a file or feature in the fast-food management system. Guides the agent
  through a structured review covering correctness, style, performance, and
  security.
---

# Code Review Skill

This skill guides you through reviewing code in the fast-food management system.

## Review Checklist

### 1. Correctness
- Does the code do what it's supposed to?
- Are edge cases (empty lists, null values, network failures) handled?
- Are all async operations awaited properly?

### 2. Code Style & Conventions
- Does the code follow existing naming conventions in the project?
- Are components/functions kept small and focused?
- Is there any duplicated logic that should be extracted?

### 3. Performance
- Are there unnecessary re-renders or redundant API calls?
- Are large lists virtualized or paginated?

### 4. Security
- Is user input validated before being sent to the backend?
- Are sensitive values (tokens, keys) never hardcoded?

## Output Format

Provide feedback as:
- ✅ **Good**: What is done well.
- ⚠️ **Suggestion**: Non-blocking improvement ideas.
- ❌ **Issue**: Must-fix problems with explanation and suggested fix.
