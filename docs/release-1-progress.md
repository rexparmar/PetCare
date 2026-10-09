# CST8515 Release 1 Progress Report

## 1. Introduction

### Overall project goals

PetCare is intended to give pet owners a secure, clear place to manage pet identity, health history, and veterinary visits. The broader product vision also includes medication reminders, activity tracking, media, notifications, and clinic integration.

### Release 1 objectives

Release 1 establishes the functional core: persisted user authentication, owner-scoped pet profiles, health records, appointment scheduling/history, and a useful dashboard. The alpha must demonstrate real API and database behavior rather than static or hardcoded screens.

## 2. Detailed Work Completed

### Completed features

- Registration, login, logout, current-account display, sessions, and protected client/API routes
- Pet create, list, detail, edit, and delete workflows
- Health-record add, chronological view, edit, and delete workflows
- Appointment schedule, list, detail API, edit, complete/status update, and history-preserving cancellation
- Responsive public landing, login, registration, dashboard, pets, pet detail/edit, health records, appointments, scheduling, and account pages
- Database-backed dashboard totals, pet cards, upcoming appointments, recent health records, and quick actions
- Loading, validation, error, empty, success-notification, and confirmation states

### Technical implementation

The solution uses npm workspaces with separate React/Vite and Express applications. Express follows routes → controllers → services → Prisma → PostgreSQL. Zod validates request bodies and UUID parameters. Prisma models define UUID keys, uniqueness, indexes, relationships, cascade behavior, and timestamps. One committed SQL migration creates the complete Release 1 schema.

Authentication uses Argon2id password hashes and random server-side sessions. Only the SHA-256 digest of a session token is stored. The browser receives the token in an HTTP-only cookie. CSRF protection, rate limiting, Helmet, origin-restricted credentialed CORS, redacted structured logs, and owner-scoped queries provide defense in depth.

The React application uses TanStack Query for server data, React Hook Form and Zod for forms, route guards for authenticated navigation, and Tailwind for the responsive design system. No dashboard metrics or domain records are hardcoded.

### Technical achievements

- Ownership enforcement is implemented in service queries, returning the same not-found response for absent and non-owned resources.
- Appointment cancellation retains history rather than deleting the row.
- Date-only care data and timestamp appointment data use different formatting paths to preserve local meaning.
- Both full and production dependency audits report zero known vulnerabilities at the completion checkpoint.
- API, component, browser, lint, and production-build checks all pass.

## 3. Challenges and Solutions

### Environment and database

Docker was not available in the implementation environment. PostgreSQL 16 was available, so a temporary isolated local cluster was started on the intended test port. This preserved the requirement to test against real PostgreSQL. Docker Compose configuration remains the documented portable setup.

### Type integration

Express 5 exposes route parameters as broader union types, and Prisma rejects partially inferred objects for required create operations. Parameters were validated and normalized before service calls, while create services were changed to explicit required-field mappings. This restored a clean strict TypeScript build.

### Test reliability

The first Supertest helper hid its chain behind an async promise. Status assertions were moved inside reusable helpers. Ambiguous Playwright selectors were tightened to exact accessible names. These changes made the suites deterministic without weakening assertions.

### Visual and timezone defects

Desktop screenshot inspection revealed a white-background override on the dashboard summary card. A dedicated summary container removed the conflicting reusable-card background. The same review exposed a Toronto timezone shift for date-only health records; the formatter now constructs local calendar dates instead of translating UTC midnight.

### Dependency advisories

The initial dependency graph contained advisories in Prisma tooling, Vitest workers, and Tailwind 3 build dependencies. Compatible Prisma 6.12 was selected, and Vitest and Tailwind were upgraded. After rebuilding and rerunning tests, `npm audit` reported zero vulnerabilities.

## 4. Testing and Validation

Testing used a dedicated PostgreSQL database populated only through the API/browser workflows.

- API: 11 Supertest/Vitest integration tests passed.
- Frontend: 6 React Testing Library/Vitest tests passed.
- End to end: 1 complete Playwright/Chromium workflow passed.
- Quality gates: ESLint passed with zero warnings, both production builds passed, and npm audit reported zero vulnerabilities.

The final result is 18 automated tests passed and zero failed. Detailed categories, actual commands, defects, and environment constraints are recorded in `docs/testing-report.md`.

## 5. Future Plan

### Release 2 milestones

- Medication reminders and schedules
- Pet activity and routine-care tracking
- Pet photo gallery and object storage
- In-app/email notification system
- Veterinary clinic integration
- Expanded dashboard analytics
- Filtering, pagination, and additional UI refinement
- Wider accessibility, performance, multi-browser, and coverage testing

### Risks and mitigations

| Risk                          | Planned mitigation                                                              |
| ----------------------------- | ------------------------------------------------------------------------------- |
| Reminder delivery reliability | Use a durable job queue, retry policy, idempotency keys, and delivery telemetry |
| Photo storage cost/security   | Use private object storage, signed URLs, file validation, and quotas            |
| Clinic data inconsistency     | Add versioned adapters, audit logs, and explicit reconciliation states          |
| Growing data volume           | Add pagination, query profiling, and indexes based on measured access patterns  |
| Notification fatigue          | Provide per-channel preferences, quiet hours, and clear opt-out controls        |

No Release 2 feature is represented as complete in this report.
