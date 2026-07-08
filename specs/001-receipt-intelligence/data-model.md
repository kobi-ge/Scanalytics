# Data Model: UI/UX Navigation and Receipt Experience

## Overview

This feature does not introduce new persisted entities or database schema changes. It refines how existing receipt and analytics data are presented and how users navigate between existing workflows.

## UI State Entities

### Navigation State
- **Active section**: one of Home, Statistics, or Receipts.
- **Purpose**: controls the active navigation item and route selection.

### Receipts Page State
- **Selected mode**: either Scan Receipt or Manual Entry.
- **Purpose**: switches the main content area between the two existing receipt entry experiences.
- **Source data**: existing upload and manual-entry forms.

### Receipt Card State
- **Fields displayed**: merchant, amount, purchase date, category, and status.
- **Purpose**: present compact, scannable summaries for recent receipts on the Home page.
- **Source data**: existing receipt image metadata and extracted receipt records.

## Existing Domain Objects Reused

- **Receipt**: existing receipt records already used by the dashboard and analytics views.
- **User**: existing authenticated user context used by the navbar and private routes.
- **Insights summary**: existing computed analytics values used in the Home and Statistics pages.

## Design Notes

- No new storage model is required.
- No changes to ingestion or analytics payload schemas are required for this UI improvement.
- Any UI state must remain consistent with the existing backend contract and existing data fields.
