import type { Request, Response } from 'express';
import type { AuthPayload } from '../middleware/auth';
import { getUserFeatureState } from '../services/featureService';

/** GET /api/v1/users/me/features — feature unlock state for the current user dashboard. */
export async function meFeatures(req: Request, res: Response): Promise<void> {
  const payload = (req as Request & { user?: AuthPayload }).user;
  if (!payload) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  try {
    const state = await getUserFeatureState(payload.userId);
    res.json(state);
  } catch (err) {
    // Avoid leaking internal error details to client.
    // eslint-disable-next-line no-console
    console.error('Error in meFeatures:', err);
    res.status(500).json({ error: 'Could not load feature state' });
  }
}

/** GET /api/v1/super-admin/users/:userId/features — Super Admin view of a user’s feature unlocks. */
export async function adminUserFeatures(req: Request, res: Response): Promise<void> {
  const { userId } = req.params as { userId: string };

  try {
    const state = await getUserFeatureState(userId);
    res.json(state);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error in adminUserFeatures:', err);
    if ((err as Error).message === 'User not found') {
      res.status(404).json({ error: 'User not found' });
    } else {
      res.status(500).json({ error: 'Could not load feature state' });
    }
  }
}

