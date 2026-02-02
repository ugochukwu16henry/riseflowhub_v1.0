# Module 3 — Core Project Management System — Summary

## Objective

Build the Core Project Management System with status flow, milestones, tasks, Client and Internal Team dashboards, AI-powered features (mock), payments stub, and notifications.

---

## 1. Database schema updates

- **ProjectStatus** enum: `IdeaSubmitted`, `ReviewValidation`, `ProposalSent`, `Development`, `Testing`, `Live`, `Maintenance`.
- **Project**: added `status` (ProjectStatus), `budget` (Decimal?), `repoUrl`, `liveUrl`.
- **Milestone** model: `id`, `projectId`, `title`, `status` (Pending/InProgress/Completed), `dueDate`.
- **Task**: added `milestoneId` (optional), `priority` (Low/Medium/High).

**Apply schema:**
```bash
cd backend && pnpm prisma generate && pnpm prisma db push
```

---

## 2. Backend APIs

### Projects (existing + extended)

- **POST** `/api/v1/projects` — Create project. Body: `clientId`, `projectName`, `description?`, `stage?`, `status?`, `budget?`, `startDate?`, `deadline?`, `repoUrl?`, `liveUrl?`.
- **GET** `/api/v1/projects` — List: admin (all), client (own), team (assigned via tasks).
- **GET** `/api/v1/projects/:id` — Project details with tasks, milestones, client.
- **PUT** `/api/v1/projects/:id` — Update (including status, budget, repoUrl, liveUrl).
- **DELETE** `/api/v1/projects/:id` — Archive/delete (admin/PM).

### Milestones

- **POST** `/api/v1/projects/:id/milestones` — Create. Body: `title`, `status?`, `dueDate?`.
- **GET** `/api/v1/projects/:id/milestones` — List milestones (with tasks).
- **PUT** `/api/v1/milestones/:id` — Update.
- **DELETE** `/api/v1/milestones/:id` — Delete.

### Tasks (existing + extended)

- **POST** `/api/v1/projects/:id/tasks` — Create. Body: `title`, `description?`, `status?`, `assignedToId?`, `milestoneId?`, `priority?`, `dueDate?`.
- **GET** `/api/v1/projects/:id/tasks` — List by project (includes milestone).
- **GET** `/api/v1/tasks?projectId=` — List by project (convenience).
- **GET** `/api/v1/tasks/me` — List tasks assigned to current user (team dashboard).
- **PUT** `/api/v1/projects/:id/tasks/:taskId` — Update (including milestoneId, priority).
- **DELETE** `/api/v1/projects/:id/tasks/:taskId` — Delete.

### AI (mock)

- **POST** `/api/v1/ai/evaluate-idea` — Body: `ideaDescription`, `industry?`, `country?`. Returns feasibility, risk, market potential, MVP scope.
- **POST** `/api/v1/ai/generate-proposal` — Body: `ideaSummary?`, `industry?`, `budgetRange?`. Returns scope, timeline, tech stack, multi-currency cost.
- **POST** `/api/v1/ai/pricing` — Body: `amountUsd?`, `scope?`, `region?`. Returns conversions (USD, NGN, EUR, GBP).
- **POST** `/api/v1/ai/project-insights` — Body: `projectId?`. Returns predicted delays, suggestions, health (mock).

### Payments (stub)

- **POST** `/api/v1/payments/create` — Body: `projectId`, `amount`, `currency?`, `type?`. Creates payment record (stub).
- **POST** `/api/v1/payments/verify` — Body: `paymentId`. Marks paid (admin).
- **GET** `/api/v1/payments?projectId=` — List payments for project.

### Notifications

- **GET** `/api/v1/notifications` — In-dashboard list (e.g. agreement pending).

---

## 3. Client dashboard (UI)

- **Overview** — Progress bar, project name, status, next milestone.
- **Project timeline** — Status flow: Idea Submitted → Review → Proposal → Development → Testing → Live → Maintenance.
- **Documents & Repo** — Repo link, live URL (when set).
- **Milestones & Tasks** — List milestones with tasks; link to “View all tasks”.
- **Payments & Billing** — Placeholder with link to Payments page.
- **Team assigned** — Contact info.
- **Agreements to Sign** — Existing section + sign modal.

---

## 4. Internal team dashboard

- **Projects** — GET `/api/v1/projects` returns only projects where the user has assigned tasks.
- **Tasks** — `/dashboard/tasks`: “By project” (first project’s tasks) or “My tasks” (GET `/api/v1/tasks/me`) in Kanban (Todo / In Progress / Done / Blocked).
- Team roles: developer, designer, marketer see “My tasks” toggle and Kanban of assigned tasks.

---

## 5. Security & permissions

- **Clients** — Only their own projects (via clientId).
- **Team** — Only projects/tasks they’re assigned to.
- **Admin/PM** — Full project/milestone/task CRUD; payments verify; AI endpoints.
- All above routes use JWT and role checks.

---

## 6. Frontend API client (`lib/api.ts`)

- **projects.update** — Update project (status, budget, repoUrl, liveUrl, etc.).
- **milestones** — list, create, update, delete.
- **tasks** — list, listByProject, **myTasks** (GET /tasks/me).
- **ai** — evaluateIdea, generateProposal, pricing, projectInsights.
- **notifications** — list.
- **payments** — list (by projectId), create.
- Types: ProjectStatus, Milestone, TaskWithProject, NotificationItem, PaymentRow, AI response types.

---

## 7. Pending / next steps

- **AI** — Replace mock with real OpenAI (or other) for evaluate-idea, generate-proposal, project-insights.
- **Payments** — Integrate Stripe/Flutterwave for create and verify; webhooks.
- **Notifications** — Email alerts (agreement pending, milestone completed, payment required); expand in-dashboard list.
- **Overdue** — Automatically set agreement/project status to Overdue when past deadline (cron or on-read).
- **File uploads** — Secure uploads for assets (logos, documents) with S3/Cloudinary.
- **E2E tests** — Full workflow: create project → add milestones/tasks → client view → team Kanban → payments stub.

---

## 8. Files touched

**Backend:**  
`prisma/schema.prisma` (ProjectStatus, Milestone, Task.milestoneId/priority, Project.status/budget/repoUrl/liveUrl), `src/controllers/milestoneController.ts`, `src/routes/milestones.ts`, `src/routes/projects.ts` (status, budget, repoUrl, liveUrl, milestones), `src/routes/tasks.ts` (milestoneId, priority), `src/routes/tasksStandalone.ts` (GET ?projectId=, GET /me), `src/routes/ai.ts`, `src/routes/payments.ts`, `src/routes/notifications.ts`, `src/index.ts` (mounts).

**Frontend:**  
`lib/api.ts` (projects.update, milestones, tasks.myTasks, ai, notifications, payments; types), `app/dashboard/page.tsx` (timeline, repo/live, milestones & tasks, payments section), `app/dashboard/tasks/page.tsx` (My tasks / By project, Kanban).

---

## 9. Quick test

1. Run backend: `cd backend && pnpm prisma generate && pnpm prisma db push && pnpm run dev`
2. Run frontend: `cd frontend && pnpm run dev`
3. Log in as **client** — Dashboard shows overview, timeline, milestones/tasks, repo/live if set, payments link.
4. Log in as **developer** (or designer/marketer) — Dashboard shows assigned projects; Tasks page has “My tasks” Kanban.
5. Log in as **admin** — Create project with status/budget/repoUrl/liveUrl; add milestones; add tasks with milestone/priority; call AI endpoints (mock).
6. Payments: POST `/api/v1/payments/create` with projectId, amount; GET `/api/v1/payments?projectId=...`; verify (admin).
7. Notifications: GET `/api/v1/notifications` returns agreement-pending items.

The Core Project Management System is in place and ready for investor demo; AI and payments can be wired to real services next.
