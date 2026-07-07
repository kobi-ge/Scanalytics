<!--
Sync Impact Report
- Version change: placeholder -> 1.0.0
- Modified principles: replaced placeholder principles with project-specific guidance for architecture, data integrity, testing, observability, and security
- Added sections: Additional Constraints, Development Workflow, Governance
- Removed sections: none
- Templates requiring updates: .specify/templates/plan-template.md — ✅ no direct changes required; .specify/templates/spec-template.md — ✅ no direct changes required; .specify/templates/tasks-template.md — ✅ no direct changes required
- Follow-up TODOs: none
-->

# ScanAnalytics Constitution

## Core Principles

### I. Service Boundaries and Contract Discipline
Every feature MUST be implemented within the service that owns the responsibility for it. Cross-service communication MUST use explicit contracts, versioned payloads, and idempotent message handling so failures remain isolated and the platform stays evolvable.

### II. Data Integrity, Traceability, and Searchability
Every receipt ingestion flow MUST preserve a trace from the source image to the extracted fields and the stored metadata. The system MUST validate incoming data, reject malformed payloads, and persist both raw artifacts and normalized records so financial data remains trustworthy and searchable.

### III. Test-First Quality for Critical Paths
Any change to OCR extraction, Kafka contracts, authentication, analytics behavior, or shared schemas MUST begin with a failing test or a reproducible verification step. Integration tests MUST cover inter-service behavior, and unit tests MUST cover domain rules that affect correctness.

### IV. Observability and Safe Operations
All services MUST emit structured logs, expose health signals, and surface retries, failures, and processing latency. Operational changes MUST be deployable with rollback paths and clear diagnostics so issues can be resolved without guesswork.

### V. Security, Privacy, and Least Privilege
Sensitive receipt and user data MUST be protected with environment-based secrets, role-based access controls, and least-privilege service credentials. Secrets MUST NOT be committed to source control, and access MUST be limited to the minimum required for each service.

## Additional Constraints
The platform MUST remain runnable locally through Docker Compose and support containerized development and deployment. Python services MUST prefer typed models, explicit configuration, and clear dependency boundaries. The React frontend MUST keep UI state and API usage predictable and documented. Kafka topics, MongoDB collections, and Elasticsearch indexes MUST be treated as shared contracts and updated intentionally. Breaking changes to APIs or message schemas MUST include migration guidance and compatibility handling.

## Development Workflow
Changes MUST be made in small, reviewable increments with clear ownership for each service. Every change MUST include verification evidence such as tests, linting, or a reproducible local check. Pull requests MUST describe user impact, affected services, and any schema or deployment considerations. Release readiness MUST include a sanity check for ingestion, storage, analytics, and authentication flows.

## Governance
This constitution supersedes informal practices for this repository. Any amendment MUST be documented in this file, include a version bump, and explain the rationale and migration impact. Changes to principles require review from maintainers across affected services before merge. Compliance review MUST confirm that implementation, tests, and operations align with these principles.

**Version**: 1.0.0 | **Ratified**: 2026-07-07 | **Last Amended**: 2026-07-07
