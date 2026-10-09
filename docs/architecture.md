# PetCare Release 1 Architecture

## System architecture

```text
Browser
  React pages and reusable components
       │  fetch + JSON, credentials included, X-CSRF-Token
       ▼
Express API
  Routes → validation/auth middleware → controllers → services
       │
       ▼
Prisma ORM
       │
       ▼
PostgreSQL 16
```

The repository is an npm-workspace monorepo. The web and API applications can be developed together but compile independently. PostgreSQL is the only application datastore; no in-memory substitute is used by the running application or API suite.

## Component responsibilities

### Web application

- `pages/` owns route-level loading, error, empty, and success behavior.
- `components/` provides the responsive shell, route guards, cards, dialogs, notifications, and reusable forms.
- `context/AuthContext.tsx` resolves the current server session and exposes authenticated identity.
- `services/api.ts` centralizes the API origin, credentials, CSRF-token acquisition, JSON handling, and typed errors.
- TanStack Query owns server-state caching and invalidation; React Hook Form and Zod own client form state and immediate validation.

### API application

- Routes define HTTP methods and middleware order.
- Controllers translate HTTP input/output and do not query the database directly.
- Services implement business rules, ownership checks, and Prisma operations.
- Validators parse bodies and UUID parameters with Zod before controllers execute.
- Middleware resolves sessions, checks CSRF tokens, applies authentication rate limits, and returns consistent errors.
- The centralized error handler maps expected application and Prisma errors to stable JSON responses.

## Database relationships

```text
User 1 ─── * Session
User 1 ─── * Pet
Pet  1 ─── * HealthRecord
Pet  1 ─── * Appointment
```

All primary keys are UUIDs. `User.email` and `Session.tokenHash` are unique. Foreign-key access paths and chronological queries are indexed.

| Parent removal              | Result                                                                         |
| --------------------------- | ------------------------------------------------------------------------------ |
| User                        | Cascades sessions and owned pets, which cascade their records and appointments |
| Pet                         | Cascades health records and appointments                                       |
| Appointment DELETE endpoint | Does not delete a row; changes status to `CANCELLED`                           |

The appointment endpoint preserves normal cancellation history. Explicit pet/account deletion is treated as the user's request to remove the complete owned profile graph.

## Authentication and CSRF flow

1. The client requests `GET /api/auth/csrf`.
2. The API sends a readable, random `petcare_csrf` cookie and the same token in JSON.
3. A state-changing request returns that token in `X-CSRF-Token`; middleware compares header and cookie with a timing-safe comparison.
4. Registration hashes the password with Argon2id. Login verifies the stored hash.
5. The API generates a 256-bit opaque session token, stores only its SHA-256 hash, and sends the original in the HTTP-only `petcare_session` cookie.
6. Authentication middleware hashes the presented cookie, loads the unexpired server-side session, and attaches a public user projection to the request.
7. Services always derive `ownerId` from that session. Client-supplied owner IDs are never accepted.
8. Logout deletes the server-side session and clears the cookie.

Both cookies use `SameSite=Lax`; the session cookie is HTTP-only. Both use `Secure` when `NODE_ENV=production`. Authentication endpoints are limited to 20 requests per IP per 15-minute window. Helmet adds security headers and CORS allows only `WEB_ORIGIN` with credentials.

## API communication and time handling

Successful JSON responses use `{ "data": ... }`. Errors use `{ "error": { "code", "message", "details?" } }`. A response with no body uses HTTP 204.

Appointments are sent as offset-bearing ISO 8601 timestamps and stored as PostgreSQL timestamps through Prisma. The browser formats them in its local timezone. Birth dates and health-record dates are treated as calendar dates, preventing UTC timezone shifts in display.

## Deployment boundaries

Docker Compose supplies PostgreSQL for local development and a separate tmpfs-backed test database. The API validates required environment variables at startup. Production deployment must supply managed PostgreSQL, HTTPS, a production web origin, backups, and normal observability/secret management.
