# Implementation Plan: Receipt Intelligence UX Refresh

**Branch**: `001-receipt-intelligence` | **Date**: 2026-07-08 | **Spec**: [specs/001-receipt-intelligence/spec.md](specs/001-receipt-intelligence/spec.md)

**Input**: Feature specification from [specs/001-receipt-intelligence/spec.md](specs/001-receipt-intelligence/spec.md)

## Summary

This feature improves the frontend experience by simplifying navigation, modernizing the Home page, and consolidating receipt entry into a single Receipts experience. All visible navigation and labels must be fully in Hebrew, without mixed Hebrew-English wording. The implementation stays within the existing React/Vite frontend and reuses the current ingestion and insights APIs without introducing backend contract changes.

## Technical Context

**Language/Version**: JavaScript/React 19 with Vite 8

**Primary Dependencies**: React Router, Zustand, Tailwind CSS, Lucide React, Recharts, Axios

**Storage**: N/A for UI state; existing backend and insights APIs remain the data source

**Testing**: Vite build + ESLint, with manual smoke validation for the updated routes and page layouts

**Target Platform**: Web frontend served through the existing Dockerized app stack

**Project Type**: Web application

**Performance Goals**: Keep the page interactive and responsive for typical desktop and tablet use; avoid introducing additional network requests beyond the existing dashboard and analytics flows

**Constraints**: Must preserve current ingestion and analytics functionality; all changes should remain localized to the frontend and existing API contracts

**Scale/Scope**: One main application shell, three primary views, and two receipt entry modes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Service Boundaries and Contract Discipline: PASS — the work stays in the frontend and reuses existing backend routes and shared data contracts.
- Data Integrity, Traceability, and Searchability: PASS — no new persistence model or data transformation is introduced; existing receipt metadata remains the source of truth.
- Test-First Quality for Critical Paths: PASS with mitigation — the route and layout changes will be verified through a build/lint pass and a manual smoke test before merge.
- Observability and Safe Operations: PASS — the change does not introduce new services or operational risk.
- Security, Privacy, and Least Privilege: PASS — no new secret handling or access model changes are introduced.

## Project Structure

### Documentation (this feature)

```text
specs/001-receipt-intelligence/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── spec.md
```

### Source Code (repository root)

```text
Frontend/
├── src/
│   ├── components/
│   │   └── Navbar.jsx
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Statistics.jsx
│   │   ├── UploadReceipt.jsx
│   │   ├── ManualEntry.jsx
│   │   └── Receipts.jsx (new)
│   └── services/
│       └── api.js
└── package.json
```

**Structure Decision**: The work will be implemented entirely in the frontend area, with a new Receipts page created under the existing pages directory and the existing navbar and dashboard components updated to reflect the new navigation model.

## Implementation Phases

1. Update the application navigation and route structure to use the Hebrew labels דף הבית, סטטיסטיקות, and קבלות.
2. Refactor the current dashboard experience into the new Home page, with improved visual hierarchy and compact receipt cards, while ensuring all visible text is fully in Hebrew.
3. Create a combined Receipts page that hosts the existing scan and manual-entry flows in one place, with Hebrew-only labels and guidance.
4. Preserve existing analytics behavior and ensure the Statistics page remains available with Hebrew-only UI text.
5. Validate the experience through a frontend build, lint pass, and local smoke test, confirming the navigation and wording are fully Hebrew.

## Complexity Tracking

No constitution violations were identified for this change.
