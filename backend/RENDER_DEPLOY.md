# Deploy AfriLaunch Backend to Render

Use this guide to deploy the Express + Prisma backend to [Render](https://render.com) so your Vercel frontend can use it for sign up, sign in, and all API endpoints.

---

## 1. Prerequisites

- GitHub repo with the **backend** code (this folder can be at repo root or in a `backend/` directory).
- Supabase project with **Postgres** and connection string (you already use this as `DATABASE_URL`).
- Frontend deployed on Vercel (you need its URL for CORS).

---

## 2. Create a Web Service on Render

1. Go to [dashboard.render.com](https://dashboard.render.com) and sign in.
2. Click **New +** → **Web Service**.
3. Connect your GitHub account and select the repository that contains this backend.
4. Configure the service:

   | Field | Value |
   |-------|--------|
   | **Name** | `afrilaunch-api` (or any name) |
   | **Region** | Choose closest to your users |
   | **Root Directory** | `backend` *(if your repo has frontend + backend; leave blank if the repo root is the backend)* |
   | **Runtime** | Node |
   | **Build Command** | `pnpm install && pnpm run build` |
   | **Start Command** | `pnpm start` |

   If Render doesn’t detect pnpm (build fails with "pnpm: command not found"), set **Build Command** to `npm install -g pnpm && pnpm install && pnpm run build` and keep **Start Command** as `pnpm start`. Or use npm: **Build** `npm ci && npm run build`, **Start** `npm start` (requires `package-lock.json` in the backend folder).

5. Under **Instance Type**, pick **Free** or **Starter** (Free is enough to test).

---

## 3. Environment Variables (Render Dashboard)

In your Render Web Service → **Environment** tab, add these variables.

### Required

| Key | Value | Notes |
|-----|--------|--------|
| `DATABASE_URL` | Your Supabase Postgres connection string | From Supabase: Project Settings → Database → Connection string (URI). Use the **pooled** one if available (port 6543). |
| `JWT_SECRET` | A long random string | Generate one: e.g. `openssl rand -base64 32`. **Never** commit this. |
| `FRONTEND_URL` | Your Vercel app URL | e.g. `https://your-app.vercel.app` (no trailing slash). Used for CORS and links in emails. |

### Optional (with defaults)

| Key | Value | Notes |
|-----|--------|--------|
| `JWT_EXPIRES_IN` | `7d` | Token expiry (default 7 days). |
| `PORT` | *(leave unset)* | Render sets this automatically. |
| `SMTP_HOST` | e.g. SendGrid / Mailgun host | Only if you send real emails. |
| `SMTP_PORT` | `587` or `465` | |
| `SMTP_USER` / `SMTP_PASS` | Your SMTP credentials | |
| `EMAIL_FROM` | `AfriLaunch Hub <noreply@yourdomain.com>` | Sender for emails. |

Click **Save Changes** after adding variables.

---

## 4. Database (Supabase) and Migrations

- Your **database** is already on Supabase; you only need to give the backend its URL via `DATABASE_URL`.
- Ensure the schema is applied:
  - Either run **Prisma migrations** from your machine once:  
    `cd backend && pnpm run db:push` (or `pnpm run db:migrate` if you use migrations), with `DATABASE_URL` pointing to Supabase.
  - Or on Render you can add a **Release Command** (optional):  
    `pnpm run db:push`  
    so each deploy syncs the schema. (Free tier may run this on every deploy; use if you prefer.)

---

## 5. Deploy

1. Click **Create Web Service** (or **Save** if you already created it).
2. Render will clone the repo, run `pnpm install && pnpm run build`, then `pnpm start`.
3. Wait for the deploy to finish. The service URL will look like:  
   `https://afrilaunch-api.onrender.com` (or the name you chose).

---

## 6. Verify the Backend

- Open: **`https://<your-render-url>/api/v1/health`**  
  You should see: `{"status":"ok","service":"afrilaunch-api"}`.
- If that works, the backend is up and ready for the frontend.

---

## 7. Connect the Frontend (Vercel)

In **Vercel** → your frontend project → **Settings** → **Environment Variables**:

| Key | Value |
|-----|--------|
| `NEXT_PUBLIC_API_URL` | `https://<your-render-url>` (no trailing slash) |

Example: `https://afrilaunch-api.onrender.com`

Then **redeploy** the frontend so the new API URL is used. After that, sign up and sign in on the Vercel app should work.

---

## 8. Troubleshooting

| Issue | What to check |
|-------|----------------|
| Build fails | Ensure **Root Directory** is `backend` if the backend lives in a `backend/` folder. Build command must run in that directory. |
| "Application failed to respond" | Check **Logs** on Render. Often `DATABASE_URL` is wrong or the DB is unreachable (Supabase allows connections from anywhere by default; check IP allowlist if you enabled it). |
| 500 on login/register | Check Render **Logs** for stack traces. Typical causes: missing `JWT_SECRET`, wrong `DATABASE_URL`, or Prisma client not generated (build should run `prisma generate`; the `build` script in `package.json` does this). |
| CORS errors in browser | Set `FRONTEND_URL` on Render to the **exact** Vercel URL (including `https://`, no trailing slash). |
| Free instance "spins down" | Render free tier sleeps after inactivity. First request after sleep can take 30–60 seconds; subsequent requests are fast until the next sleep. |

---

## Summary

1. Create a **Web Service** on Render, root directory **backend**, build **`pnpm install && pnpm run build`**, start **`pnpm start`**.
2. Set **DATABASE_URL**, **JWT_SECRET**, and **FRONTEND_URL** (and optional SMTP/email vars).
3. Deploy; then set **NEXT_PUBLIC_API_URL** on Vercel to the Render URL and redeploy the frontend.

After that, sign up and sign in on the deployed app will use the backend on Render and the database on Supabase.
