# PetCare — Release 1

PetCare is a full-stack pet health and veterinary appointment manager built for HappyPaws Inc. as the CST8515 Release 1 alpha prototype. It provides persisted user accounts, owner-scoped pet profiles, health histories, appointment management, and a database-backed dashboard.

## Release 1 features

- Registration, login, logout, account details, and protected routes
- Argon2id password hashing and server-side, HTTP-only cookie sessions
- Double-submit CSRF protection and authentication rate limiting
- Complete pet profile CRUD with ownership authorization
- Complete pet health-record CRUD with chronological history
- Appointment create/read/update and history-preserving cancellation
- Dashboard counts, pets, upcoming visits, and recent health records from PostgreSQL
- Responsive React interface with accessible forms, validation, toasts, empty states, and confirmations
- API integration tests, component tests, and a Playwright care-workflow test

## Technology

- Web: React 19, TypeScript, Vite, Tailwind CSS 4, React Router, TanStack Query, React Hook Form, Zod
- API: Node.js, Express 5, TypeScript, Prisma ORM, Zod, Pino
- Data: PostgreSQL 16
- Security: Argon2id, server-side opaque sessions, Helmet, CORS allow-list, CSRF tokens, rate limiting
- Tests: Vitest, React Testing Library, Supertest, Playwright

## Repository structure

```text
PetCare/
├── apps/
│   ├── api/
│   │   ├── prisma/              # Schema and migration
│   │   ├── src/
│   │   │   ├── controllers/     # HTTP translation
│   │   │   ├── middleware/      # Auth, CSRF, validation, errors
│   │   │   ├── routes/          # Endpoint composition
│   │   │   ├── services/        # Business rules and ownership checks
│   │   │   └── validators/      # Zod request schemas
│   │   └── tests/               # PostgreSQL integration tests
│   └── web/
│       ├── e2e/                 # Playwright workflow
│       └── src/
│           ├── components/      # Reusable layout, forms, and UI
│           ├── context/         # Authentication state
│           ├── pages/           # Public and protected pages
│           ├── services/        # Typed API client
│           ├── test/            # Component tests
│           ├── types/           # API types
│           └── utils/           # Date and display helpers
├── docs/
├── docker-compose.yml
└── package.json                 # npm workspaces and root commands
```

## Local setup

Prerequisites: Node.js 20+, npm 10+, and Docker with Compose.

```bash
cp .env.example .env
npm install
docker compose up -d postgres
npm run db:generate
npm run db:migrate
npm run dev
```

Open `http://localhost:5173`. The API listens on `http://localhost:4000`.

The root `.env` is loaded by both workspaces. Change `WEB_ORIGIN`, `DATABASE_URL`, or `VITE_API_URL` there if different ports are needed. In production, use a strong database password, HTTPS, and `NODE_ENV=production`; the session and CSRF cookies then use the `Secure` flag.

## Test database and commands

Start the isolated, non-persistent test database and apply the same migration:

```bash
docker compose up -d postgres-test
DATABASE_URL='postgresql://petcare:petcare@localhost:5433/petcare_test?schema=public' \
  npx prisma migrate deploy --schema apps/api/prisma/schema.prisma
```

Then run:

```bash
npm run test:api
npm run test:web
npm run test:e2e
npm run lint
npm run build
```

`DATABASE_URL_TEST` may be set to point the suites at another isolated PostgreSQL database. The tests delete their own domain rows, so never point it at a development or production database.

## Useful commands

| Command              | Purpose                                              |
| -------------------- | ---------------------------------------------------- |
| `npm run dev`        | Start the API and web app in watch mode              |
| `npm run build`      | Compile the API and create the production web bundle |
| `npm run db:migrate` | Create/apply development migrations                  |
| `npm run db:studio`  | Open Prisma Studio                                   |
| `npm run test:api`   | Run Supertest/PostgreSQL API integration tests       |
| `npm run test:web`   | Run React component tests                            |
| `npm run test:e2e`   | Run the Chromium Release 1 workflow                  |
| `npm run lint`       | Run ESLint in both workspaces                        |

## Documentation

- [Architecture](docs/architecture.md)
- [API documentation](docs/api-documentation.md)
- [Testing report](docs/testing-report.md)
- [Release 1 progress](docs/release-1-progress.md)
- [Development log](docs/development-log.md)

## Known limitations

- Release 1 intentionally excludes medication reminders, activity tracking, photo storage, notifications, and clinic integration.
- Account details are read-only; password reset and email verification are not part of this release.
- Lists are suitable for an alpha dataset and do not yet include pagination or filtering.
- Expired sessions are removed when presented; a scheduled cleanup job is a deployment concern for a later release.
