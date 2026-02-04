# Production Upgrade – Env & Setup

## 1. Real payments (Stripe)

- **STRIPE_SECRET_KEY** – Stripe secret key (starts with `sk_`). When set, create-session returns a real Stripe Checkout URL.
- **STRIPE_WEBHOOK_SECRET** – Webhook signing secret (starts with `whsec_`). Required for `POST /api/v1/webhooks/stripe`.

Configure the webhook in Stripe Dashboard: URL `https://your-api.com/api/v1/webhooks/stripe`, event `checkout.session.completed`.  
After payment, the webhook marks the payment completed and sets `feePaid` / `setupPaid` / `verified` as needed. The frontend can still call the verify endpoint with the reference to confirm state.

## 2. File upload (Cloudinary)

- **CLOUDINARY_CLOUD_NAME**
- **CLOUDINARY_API_KEY**
- **CLOUDINARY_API_SECRET**

When set, `POST /api/v1/upload` (multipart, field `file`, body/query `type`: resume | cv | portfolio | avatar | project_media) uploads to Cloudinary and returns the URL. Resume/CV/portfolio/avatar are also written to the talent or user profile when applicable.

## 3. Anti-spam

- **RECAPTCHA_SECRET_KEY** – Google reCAPTCHA v2/v3 secret. When set, forms that use it require `recaptchaToken` in the body (talent apply, partner form, hirer register).
- Rate limiting: 5 submissions per hour per IP on talent apply, partner submit, hirer register (no env needed).

## 4. Super Admin skills

- No extra env. Use **Skill Management** in the Super Admin dashboard (`/dashboard/admin/skills`) to add/edit/delete skills and categories. Hiring config and talent forms use this list when available.

## 5. Talent marketplace

- Marketplace filters: `skills`, `category`, `minRating`, `minExperience`, `rateMin`, `rateMax`, `availability`, `verifiedOnly`, `sort` (featured | recent | rating | new).
- Only approved talents with `hiddenByAdmin: false` are listed. Admins can set `featured` and `hiddenByAdmin` via `PATCH /api/v1/talent/:id` (Super Admin / Co-Founder).
