# RiseFlow Hub — Playwright E2E Tests

## Prerequisites

1. **Backend running** at `http://localhost:4000`:
   ```bash
   cd backend
   pnpm install
   pnpm prisma generate
   pnpm prisma db push
   pnpm run db:seed   # creates test users
   pnpm run dev
   ```

2. **Frontend** will be started by Playwright (`webServer` in config) unless you run it yourself. If the backend is on a different host, set `NEXT_PUBLIC_API_URL=http://localhost:4000` in `frontend/.env.local` so API rewrites hit the backend.

## Test users (from seed)

| Role        | Email                         | Password    |
|------------|-------------------------------|-------------|
| Client     | test-client@example.com       | Password123 |
| Super Admin| test-super_admin@example.com  | Password123 |
| Developer  | test-developer@example.com    | Password123 |

## Run tests

From **frontend** directory:

```bash
cd frontend
pnpm install
pnpm exec playwright install   # install browsers (first time only)
pnpm test:e2e                 # run all e2e tests
pnpm test:e2e:ui              # run with Playwright UI
pnpm test:e2e:headed         # run in headed mode (see browser)
```

Run a single file:

```bash
pnpm exec playwright test e2e/auth.spec.ts
```

Run with backend URL override (if backend is not on localhost:4000):

```bash
NEXT_PUBLIC_API_URL=http://your-backend:4000 pnpm test:e2e
```

## Test suites

- **auth.spec.ts** — Home, login, register, logout, invalid credentials, redirects
- **client-dashboard.spec.ts** — Client login, overview, nav (Project, Tasks, Files, Messages, Payments), Agreements to Sign
- **admin-dashboard.spec.ts** — Admin login, nav (Projects, Users, Agreements, Reports, Settings), Agreements table, Add/Assign modals
- **agreements-flow.spec.ts** — Admin creates agreement; client sees Agreements to Sign
- **protected-routes.spec.ts** — Unauthenticated redirect from /dashboard, /dashboard/admin, etc.
- **tasks-kanban.spec.ts** — Tasks page Kanban columns; team user sees My tasks / By project

## CI

In CI, ensure the backend is running and DB is seeded before running Playwright. Example:

```yaml
- run: cd backend && pnpm prisma db push && pnpm run db:seed
- run: cd backend && pnpm run dev &
- run: cd frontend && pnpm test:e2e
```
