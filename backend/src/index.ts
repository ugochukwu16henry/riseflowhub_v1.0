import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { clientRoutes } from './routes/clients';
import { projectRoutes } from './routes/projects';
import { taskRoutes } from './routes/tasks';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());

// API v1 base
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/clients', clientRoutes);
// Mount task routes first so /projects/:id/tasks is matched before /projects/:id
app.use('/api/v1/projects', taskRoutes);
app.use('/api/v1/projects', projectRoutes);

app.get('/api/v1/health', (_, res) => res.json({ status: 'ok', service: 'afrilaunch-api' }));

app.listen(PORT, () => {
  console.log(`AfriLaunch API running at http://localhost:${PORT}`);
});
