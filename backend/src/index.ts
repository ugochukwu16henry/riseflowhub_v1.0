import 'dotenv/config';
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

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(compression({ level: 6, threshold: 512 }));
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

app.get('/api/v1/health', (_, res) => {
  res.setHeader('Cache-Control', 'public, max-age=10');
  res.json({ status: 'ok', service: 'afrilaunch-api' });
});

app.listen(PORT, () => {
  console.log(`AfriLaunch API running at http://localhost:${PORT}`);
});
