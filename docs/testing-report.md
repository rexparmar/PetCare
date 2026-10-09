# Release 1 Testing Report

Report date: October 8, 2026 (America/Toronto)

## Test environment

- Node.js 24.15.0
- PostgreSQL 16.13, temporary isolated cluster on port 5433
- Prisma 6.12.0 using the same PostgreSQL migration as development
- Vitest 5.0.3
- Playwright Chromium 156.0.8078.4

Docker was not installed in the execution environment. PostgreSQL 16 was available locally, so a temporary cluster was initialized in `/tmp` and used as the isolated test database. The documented project workflow still uses the equivalent `postgres-test` Compose service.

## Executed automated tests

| Category                 | Command                                  | Result                           |
| ------------------------ | ---------------------------------------- | -------------------------------- |
| API integration          | `DATABASE_URL_TEST=... npm run test:api` | 1 file, 11 tests passed          |
| Web components           | `npm run test:web`                       | 3 files, 6 tests passed          |
| End to end               | `DATABASE_URL_TEST=... npm run test:e2e` | 1 Chromium workflow passed       |
| Static analysis          | `npm run lint`                           | Passed, zero warnings/errors     |
| Production build         | `npm run build`                          | API and web builds passed        |
| Runtime dependency audit | `npm audit --omit=dev`                   | 0 vulnerabilities                |
| Full dependency audit    | `npm audit`                              | 0 vulnerabilities after upgrades |

Final automated total: **18 tests passed, 0 failed** across the API, component, and browser suites.

## Coverage by requirement

### Authentication

- Successful registration and public user projection
- Duplicate email rejection, including case normalization
- Successful login and incorrect-password rejection
- Protected-route rejection
- CSRF rejection for state-changing requests
- Logout and subsequent session rejection

### Pets

- Create, list, retrieve, update, and delete
- Input persistence in PostgreSQL
- Cross-user retrieve/update rejection

### Health records

- Create, chronological retrieval, update, and delete
- Cross-user creation rejection

### Appointments

- Create, list, retrieve, update, and cancellation
- Verification that cancellation retains the database row
- Past-date validation
- Cross-user retrieval rejection

### Frontend

- Pet-form required-field validation
- Valid normalized form submission
- Dashboard loading state
- Dashboard rendering from mocked API data
- Reusable loading and error-state accessibility/content

### End-to-end

The Playwright workflow registers a new user, creates a pet, adds a vaccination, schedules a veterinary appointment, verifies database-backed dashboard content, logs out, logs back in, and verifies access to the dashboard. The final run passed in Chromium.

## Visual validation

Desktop dashboard and Pixel 5-sized landing-page screenshots were inspected. The layout, navigation hierarchy, responsive stacking, form controls, and empty/content cards rendered correctly after fixes. The in-app browser plugin could not load its native helper because macOS rejected that helper's code signature, so the visual pass used the installed Playwright Chromium runner instead.

## Bugs discovered and fixed

1. Initial TypeScript compilation exposed Express 5 path-parameter unions, Prisma create-input narrowing, and a `pino-http` import mismatch. Parameters are now normalized after validation, create data is explicitly typed, and the supported named import is used.
2. The first API test helper returned a promise where a Supertest chain was expected. The helper now owns the status assertion; all 11 API tests pass.
3. Immediate rejected promises made one React Query error test produce an unhandled test-runner failure. Error-state rendering was moved to a deterministic reusable-state test while dashboard loading and data rendering remain directly tested.
4. The first browser run found ambiguous text/label selectors. Exact accessible selectors replaced them; the workflow then passed.
5. Visual inspection found a Tailwind utility collision that made the green dashboard summary white. The special summary is now a dedicated element with the intended background.
6. Date-only health records displayed one day early in Toronto because UTC midnight was formatted as a timestamp. Calendar-date parsing now preserves the entered date.
7. Dependency audit found advisories in newer Prisma tooling and older test/style toolchains. Prisma was pinned to compatible 6.12.0 and Vitest/Tailwind were upgraded; both full and production-only audits now report zero vulnerabilities.

## Remaining test limitations

- The suite does not measure line/branch coverage percentages.
- Performance, load, screen-reader, and multi-browser testing beyond Chromium are not part of the alpha test run.
- Email verification and password reset tests do not exist because those features are outside Release 1.
