# Development Log

All entries reflect implementation work performed on October 8, 2026 (America/Toronto).

## Repository and data foundation

- Inspected the supplied workspace; it was empty and not yet a Git repository.
- Initialized the Git repository and added project-appropriate ignore rules; commits remain for the project team to author.
- Created npm workspaces for `apps/api` and `apps/web`, root scripts, environment example, ignore rules, and Docker Compose services for development and isolated test PostgreSQL.
- Designed User, Session, Pet, HealthRecord, and Appointment Prisma models with UUIDs, indexes, enums, timestamps, and cascade rules.
- Added the initial SQL migration.

## API implementation

- Implemented environment validation, Prisma lifecycle, structured/redacted logging, Helmet, CORS, request limits, validation middleware, centralized errors, and route composition.
- Implemented Argon2id credentials, opaque server-side session cookies, CSRF cookie/header checks, and auth rate limiting.
- Implemented pet, health-record, appointment, and dashboard services with owner-scoped queries.
- Chose cancellation instead of physical deletion for the appointment DELETE endpoint.
- Resolved strict TypeScript failures involving Express 5 parameters, Prisma create inputs, and `pino-http` imports.

## API validation

- Docker was unavailable; initialized a temporary PostgreSQL 16 cluster on port 5433 after sandbox approval.
- Applied the committed migration to the test database.
- Fixed an async Supertest helper error found by the first run.
- Final API result: 11 tests passed.

## Web implementation

- Built the public landing/auth experience and protected responsive application shell.
- Added dashboard, pet, health-record, appointment, and account routes connected to the live API.
- Added client CSRF acquisition, credentialed requests, normalized errors, query invalidation, form validation, notifications, empty/loading/error states, and confirmation dialogs.
- Fixed form resolver typing exposed by the first production TypeScript build.

## Web and browser validation

- Added component tests for validation, normalized submission, dashboard loading/data, and reusable async states.
- Final component result: 6 tests passed.
- Installed the Playwright Chromium runtime and created a full Release 1 workflow.
- Fixed two ambiguous browser selectors found by initial runs.
- Final E2E result: 1 workflow passed.
- The in-app browser helper failed macOS native-code signature validation; used Playwright Chromium screenshots for the visual pass.
- Fixed a dashboard background utility collision and a date-only timezone regression revealed by screenshot inspection.
- Verified desktop dashboard and mobile landing-page layouts after the fixes.

## Security and final quality gate

- An npm advisory check identified issues in development/configuration dependencies.
- Pinned compatible Prisma 6.12 and upgraded Vitest/Tailwind to versions without the reported advisories.
- Regenerated Prisma Client and reran lint, tests, browser workflow, and production builds.
- Final quality checkpoint: 18 tests passed, lint passed, builds passed, and full `npm audit` reported 0 vulnerabilities.

## Native PostgreSQL setup follow-up

- Confirmed Homebrew PostgreSQL 16 was installed and running when Docker was unavailable for local application startup.
- Created the configured `petcare` development role and database, granted the role development-only `CREATEDB` permission for Prisma's shadow database, and applied the migration.
- Corrected root Prisma scripts to resolve the executable from the API workspace while loading the root `.env`.
- Verified the registration page and CSRF endpoint return HTTP 200; an intentionally invalid registration reached the correct route and returned HTTP 400 validation rather than 404.
