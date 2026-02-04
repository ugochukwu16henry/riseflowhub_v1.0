import 'dotenv/config';
import path from 'path';
import fs from 'fs';
// Optional: override with .env.local when present (local dev). On Render, use dashboard env vars only.
const envLocal = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocal)) {
  require('dotenv').config({ path: envLocal, override: true });
}

// Fail fast if DATABASE_URL is missing or not a Postgres URL (e.g. on Render)
const dbUrl = process.env.DATABASE_URL?.trim() || '';
if (!dbUrl || !/^postgres(ql)?:\/\//i.test(dbUrl)) {
  console.error('FATAL: DATABASE_URL must be set and start with postgresql:// or postgres://. Check Render Environment.');
  process.exit(1);
}

import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { clientRoutes } from './routes/clients';
import { projectRoutes } from './routes/projects';
import { taskRoutes } from './routes/tasks';
import { tasksStandaloneRoutes } from './routes/tasksStandalone';
import { agreementRoutes } from './routes/agreements';
import { milestoneRoutes } from './routes/milestones';
import { aiRoutes } from './routes/ai';
import { paymentRoutes } from './routes/payments';
import { notificationRoutes } from './routes/notifications';
import { investorRoutes } from './routes/investors';
import { startupRoutes } from './routes/startups';
import { investmentRoutes } from './routes/investments';
import { campaignRoutes } from './routes/campaigns';
import { leadRoutes } from './routes/leads';
import { analyticsRoutes } from './routes/analytics';
import { tenantRoutes } from './routes/tenants';
import { ideaSubmissionRoutes } from './routes/ideaSubmissions';
import { consultationRoutes } from './routes/consultations';
import { contactRoutes } from './routes/contact';
import { adminLeadsRoutes } from './routes/adminLeads';
import { setupFeeRoutes } from './routes/setupFee';
import { superAdminRoutes } from './routes/superAdmin';
import { teamRoutes } from './routes/team';
import { workspaceRoutes } from './routes/workspace';
import { dealRoomRoutes } from './routes/dealRoom';
import { cmsRoutes } from './routes/cms';
import { talentRoutes } from './routes/talent';
import { hirerRoutes } from './routes/hirer';
import { hiringRoutes } from './routes/hiring';
import { ratingsRoutes } from './routes/ratings';
import { legalRoutes } from './routes/legal';
import { marketplaceFeeRoutes } from './routes/marketplaceFee';
import { partnerRoutes } from './routes/partner';
import { jobRequestRoutes } from './routes/jobRequests';
import { uploadRoutes } from './routes/upload';
import { settingsRoutes } from './routes/settings';
import * as webhookController from './controllers/webhookController';

const app = express();
const PORT = process.env.PORT || 4000;

// CORS: origin must match browser exactly (no trailing slash). Browser sends e.g. https://app.vercel.app
const frontendOrigin = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '');
app.use(cors({ origin: frontendOrigin, credentials: true }));
app.use(compression({ level: 6, threshold: 512 }));

// Stripe webhook needs raw body for signature verification (must be before express.json)
app.use(
  '/api/v1/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  webhookController.stripeWebhook
);

app.use(express.json({ limit: '256kb' }));

// API v1 base
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/clients', clientRoutes);
// Mount task routes first so /projects/:id/tasks is matched before /projects/:id
app.use('/api/v1/projects', taskRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/tasks', tasksStandaloneRoutes);
app.use('/api/v1/agreements', agreementRoutes);
app.use('/api/v1/milestones', milestoneRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/investors', investorRoutes);
app.use('/api/v1/startups', startupRoutes);
app.use('/api/v1/investments', investmentRoutes);
app.use('/api/v1/campaigns', campaignRoutes);
app.use('/api/v1/leads', leadRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/tenants', tenantRoutes);
app.use('/api/v1/idea-submissions', ideaSubmissionRoutes);
app.use('/api/v1/consultations', consultationRoutes);
app.use('/api/v1/contact', contactRoutes);
app.use('/api/v1/admin/leads', adminLeadsRoutes);
app.use('/api/v1/setup-fee', setupFeeRoutes);
app.use('/api/v1/super-admin', superAdminRoutes);
app.use('/api/v1/team', teamRoutes);
app.use('/api/v1/workspace', workspaceRoutes);
app.use('/api/v1/deal-room', dealRoomRoutes);
app.use('/api/v1/cms', cmsRoutes);
app.use('/api/v1/talent', talentRoutes);
app.use('/api/v1/hirer', hirerRoutes);
app.use('/api/v1/hiring', hiringRoutes);
app.use('/api/v1/ratings', ratingsRoutes);
app.use('/api/v1/legal', legalRoutes);
app.use('/api/v1/marketplace-fee', marketplaceFeeRoutes);
app.use('/api/v1/partner', partnerRoutes);
app.use('/api/v1/job-requests', jobRequestRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/settings', settingsRoutes);

app.get('/api/v1/health', (_, res) => {
  res.setHeader('Cache-Control', 'public, max-age=10');
  res.json({ status: 'ok', service: 'afrilaunch-api' });
});

app.listen(PORT, () => {
  console.log(`AfriLaunch API running at http://localhost:${PORT}`);
});
