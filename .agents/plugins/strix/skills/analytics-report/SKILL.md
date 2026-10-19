---
name: analytics-report
description: >-
  Use this skill when the user asks to generate reports, view sales data,
  analyze order trends, or extract business insights from the fast-food
  management system. Guides the agent through identifying data sources and
  producing meaningful summaries or visualizations.
---

# Analytics Report Skill

This skill guides you through generating insights and reports from the fast-food management system data.

## Steps

### 1. Define the Report Goal
- Ask the user what they want to measure:
  - Sales revenue over a period
  - Most ordered menu items
  - Peak order times
  - Rider performance
  - Customer retention

### 2. Identify Data Sources
- Locate where order, menu, rider, and customer data is stored or fetched from.
- Identify the relevant API endpoints or local data models.

### 3. Aggregate the Data
- Group data by the relevant dimension (time, item, rider, location).
- Compute totals, averages, and percentages as needed.

### 4. Present the Report
- Format results as a table or summary list.
- Highlight key trends (e.g., top 3 items, busiest hour).
- Flag anomalies or drops (e.g., sudden revenue dip).

### 5. Recommend Actions
- Based on data, suggest actionable improvements (e.g., promote slow-selling items, adjust staffing during peak hours).

## Tips

- Always clarify the date range before generating a report.
- Normalize data (per day, per week) for fair comparisons.
- Keep reports concise — lead with the most impactful numbers.
