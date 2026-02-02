# Module 2 — Agreements Management System — Summary

## Objective

Allow Super Admin to create, assign, track, and manage agreements. Allow users (Clients / Co-founders / Team) to view and sign agreements digitally.

---

## Completed Features

### Backend (API)

- **Agreements CRUD**
  - `POST /api/v1/agreements` — Create template (Super Admin only). Body: `{ title, type, templateUrl? }`. Type: NDA | MOU | CoFounder | Terms.
  - `GET /api/v1/agreements` — List all templates (admin).
  - `GET /api/v1/agreements/:id` — Get agreement details (admin).
  - `PUT /api/v1/agreements/:id` — Update template (Super Admin).
  - `DELETE /api/v1/agreements/:id` — Delete template (Super Admin).

- **User agreement actions**
  - `POST /api/v1/agreements/:id/assign` — Assign to user(s). Body: `{ userId }` or `{ userIds[], deadline? }` (Super Admin only).
  - `GET /api/v1/agreements/assigned` — List agreements assigned to logged-in user.
  - `GET /api/v1/agreements/:id/view` — Fetch agreement for reading; logs "viewed" with IP (assigned user only).
  - `POST /api/v1/agreements/:id/sign` — Submit signature (signatureText or signatureUrl); marks as Signed; logs "signed" with IP.
  - `GET /api/v1/agreements/:id/status` — Assignment status for agreement (admin).

- **Admin table**
  - `GET /api/v1/agreements/assignments` — List all assigned agreements with filters `?status=&type=` (admin).

- **Audit**
  - `GET /api/v1/agreements/:id/logs` — Audit trail: User | Action (viewed/signed) | Timestamp | IP (Super Admin only).
  - Table: `AgreementAuditLog` (agreementId, assignedAgreementId?, userId, action, ipAddress, createdAt).

### Database

- **Agreement** — id, title, type, template_url, created_at, updated_at (unchanged).
- **AssignedAgreement** — id, user_id, agreement_id, status (Pending/Signed/Overdue), signature_url, signed_at, ip_address, deadline, created_at, updated_at (unchanged).
- **AgreementAuditLog** (new) — id, agreement_id, assigned_agreement_id?, user_id, action (viewed | signed), ip_address, created_at.

Run after schema change:

```bash
cd backend
pnpm prisma generate
pnpm prisma db push
pnpm run db:seed
```

### Frontend — Super Admin Dashboard

- **Agreement Management** (`/dashboard/admin/agreements`)
  - Table: Agreement Title | Assigned To | Type | Status | Signed On | Actions.
  - Status colors: Pending (gray), Signed (green), Overdue (red).
  - Search bar; filters: Status, Type.
  - Actions: View, Download (if template URL), Logs.
  - Modals: Add New Agreement (title, type, template URL), Assign Agreement (select agreement + user + deadline), View assignment details, Audit trail (table + Export CSV).
  - Banner when there are pending or overdue agreements.

### Frontend — Client / Co-founder Dashboard

- **Agreements to Sign** section on dashboard home (`/dashboard`).
  - List of assigned agreements with status (Pending / Signed / Overdue).
  - **Read & Sign** opens modal: link to template (if URL), checkbox “I have read and agree”, full-name signature input, Submit.
  - On open, `GET /agreements/:id/view` is called (audit: viewed).
  - On submit, `POST /agreements/:id/sign` with signatureText; success closes modal and updates list.

### Security & permissions

- Only Super Admin can create, update, delete agreements and assign.
- Only assigned user can call view and sign for that assignment.
- Audit logs record viewed and signed with timestamp and IP (from request).

### Super Admin account

- Seed adds/updates user: **ugochukwuhenry16@gmail.com** with role `super_admin` and password **1995Mobuchi@.**
- Run `pnpm run db:seed` in backend to ensure this account exists.

---

## Test Workflow

1. **Backend:** Ensure DB is migrated and seed run:
   ```bash
   cd backend && pnpm prisma generate && pnpm prisma db push && pnpm run db:seed && pnpm run dev
   ```
2. **Frontend:** `cd frontend && pnpm run dev`
3. **Login as Super Admin:** ugochukwuhenry16@gmail.com / 1995Mobuchi@.
4. **Create agreement:** Dashboard → Agreements → Add New Agreement → title + type (e.g. NDA) + optional template URL → Create.
5. **Assign:** Assign Agreement → select agreement and user (e.g. test-client@example.com) → optional deadline → Assign.
6. **Log out, log in as client** (e.g. test-client@example.com / Password123).
7. **Sign:** Dashboard → Agreements to Sign → Read & Sign → open link if any, check “I have read and agree”, type full name → Submit signature.
8. **Log in as Super Admin again:** Agreements → table shows status Signed and Signed On; open Logs for that agreement to see viewed/signed audit; Export CSV if needed.

---

## Pending / future

- **Overdue status:** Backend does not yet set status to Overdue when deadline passes; can be added with a cron or on-read check.
- **Email reminders:** Not implemented; integrate with your email provider for pending/overdue reminders.
- **Signed PDF storage:** Currently `signature_url` and `template_url` are stored as URLs. For uploads, add multipart upload and store in S3/Cloudinary, then save returned URL.
- **Resend reminder:** Button in admin UI can call a future `POST /agreements/:id/resend` that sends an email.

---

## Files touched

**Backend:**  
`prisma/schema.prisma` (AgreementAuditLog, relations), `src/controllers/agreementController.ts` (full CRUD, assign, view, sign, status, logs, listAssignedForAdmin), `src/routes/agreements.ts` (all routes), `prisma/seed.ts` (super admin user), `API_DOCUMENTATION.md`.

**Frontend:**  
`lib/api.ts` (agreements API + types), `app/dashboard/admin/agreements/page.tsx` (table, filters, modals, audit panel), `app/dashboard/page.tsx` (Agreements to Sign section + SignAgreementModal with view/sign).
