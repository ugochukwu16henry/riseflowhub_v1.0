import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthPayload } from '../middleware/auth';
import * as aiCofounderService from '../services/aiCofounderService';

const prisma = new PrismaClient();

const PAID_MODULES = new Set(['pricing', 'marketing', 'pitch', 'risk_analysis']);

function getContext(req: Request, setupPaid: boolean): aiCofounderService.AiContext {
  const body = (req.body || {}) as Record<string, unknown>;
  return {
    industry: (body.industry as string) || undefined,
    country: (body.country as string) || undefined,
    projectStage: (body.projectStage as string) || undefined,
    setupPaid,
    teamSize: typeof body.teamSize === 'number' ? body.teamSize : undefined,
  };
}

async function requirePaid(userId: string, moduleName: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { setupPaid: true },
  });
  if (user?.setupPaid) return true;
  return false;
}

/** POST /ai/idea-clarify */
export async function ideaClarify(req: Request, res: Response): Promise<void> {
  const { userId } = (req as unknown as { user: AuthPayload }).user;
  const { idea, projectId } = req.body as { idea: string; projectId?: string };
  if (!idea?.trim()) {
    res.status(400).json({ error: 'idea is required' });
    return;
  }
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { setupPaid: true } });
  const ctx = getContext(req, user?.setupPaid ?? false);
  const content = aiCofounderService.generateIdeaClarified(idea.trim(), ctx);
  await prisma.aiGeneratedOutput.create({
    data: { userId, projectId: projectId || null, type: 'idea_clarified', content: content as object },
  });
  res.json(content);
}

/** POST /ai/business-model */
export async function businessModel(req: Request, res: Response): Promise<void> {
  const { userId } = (req as unknown as { user: AuthPayload }).user;
  const { idea, projectId } = req.body as { idea: string; projectId?: string };
  if (!idea?.trim()) {
    res.status(400).json({ error: 'idea is required' });
    return;
  }
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { setupPaid: true } });
  const ctx = getContext(req, user?.setupPaid ?? false);
  const content = aiCofounderService.generateBusinessModel(idea.trim(), ctx);
  await prisma.aiGeneratedOutput.create({
    data: { userId, projectId: projectId || null, type: 'business_model', content: content as object },
  });
  res.json(content);
}

/** POST /ai/roadmap */
export async function roadmap(req: Request, res: Response): Promise<void> {
  const { userId } = (req as unknown as { user: AuthPayload }).user;
  const { idea, projectId } = req.body as { idea: string; projectId?: string };
  if (!idea?.trim()) {
    res.status(400).json({ error: 'idea is required' });
    return;
  }
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { setupPaid: true } });
  const ctx = getContext(req, user?.setupPaid ?? false);
  const content = aiCofounderService.generateRoadmap(idea.trim(), ctx);
  await prisma.aiGeneratedOutput.create({
    data: { userId, projectId: projectId || null, type: 'roadmap', content: content as object },
  });
  res.json(content);
}

/** POST /ai/pricing — Paid only */
export async function pricing(req: Request, res: Response): Promise<void> {
  const { userId } = (req as unknown as { user: AuthPayload }).user;
  const paid = await requirePaid(userId, 'pricing');
  if (!paid) {
    res.status(403).json({ error: 'Pricing Engine is available for paid users. Complete setup to unlock.' });
    return;
  }
  const { idea, projectId } = req.body as { idea: string; projectId?: string };
  if (!idea?.trim()) {
    res.status(400).json({ error: 'idea is required' });
    return;
  }
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { setupPaid: true } });
  const ctx = getContext(req, true);
  const content = aiCofounderService.generatePricing(idea.trim(), ctx);
  await prisma.aiGeneratedOutput.create({
    data: { userId, projectId: projectId || null, type: 'pricing', content: content as object },
  });
  res.json(content);
}

/** POST /ai/marketing — Paid only */
export async function marketing(req: Request, res: Response): Promise<void> {
  const { userId } = (req as unknown as { user: AuthPayload }).user;
  const paid = await requirePaid(userId, 'marketing');
  if (!paid) {
    res.status(403).json({ error: 'Marketing Strategy is available for paid users. Complete setup to unlock.' });
    return;
  }
  const { idea, projectId } = req.body as { idea: string; projectId?: string };
  if (!idea?.trim()) {
    res.status(400).json({ error: 'idea is required' });
    return;
  }
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { setupPaid: true } });
  const ctx = getContext(req, true);
  const content = aiCofounderService.generateMarketing(idea.trim(), ctx);
  await prisma.aiGeneratedOutput.create({
    data: { userId, projectId: projectId || null, type: 'marketing', content: content as object },
  });
  res.json(content);
}

/** POST /ai/pitch — Paid only */
export async function pitch(req: Request, res: Response): Promise<void> {
  const { userId } = (req as unknown as { user: AuthPayload }).user;
  const paid = await requirePaid(userId, 'pitch');
  if (!paid) {
    res.status(403).json({ error: 'Pitch Deck Creator is available for paid users. Complete setup to unlock.' });
    return;
  }
  const { idea, projectId } = req.body as { idea: string; projectId?: string };
  if (!idea?.trim()) {
    res.status(400).json({ error: 'idea is required' });
    return;
  }
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { setupPaid: true } });
  const ctx = getContext(req, true);
  const content = aiCofounderService.generatePitch(idea.trim(), ctx);
  await prisma.aiGeneratedOutput.create({
    data: { userId, projectId: projectId || null, type: 'pitch', content: content as object },
  });
  res.json(content);
}

/** POST /ai/risk-analysis — Paid only */
export async function riskAnalysis(req: Request, res: Response): Promise<void> {
  const { userId } = (req as unknown as { user: AuthPayload }).user;
  const paid = await requirePaid(userId, 'risk_analysis');
  if (!paid) {
    res.status(403).json({ error: 'Risk Analysis is available for paid users. Complete setup to unlock.' });
    return;
  }
  const { idea, projectId } = req.body as { idea: string; projectId?: string };
  if (!idea?.trim()) {
    res.status(400).json({ error: 'idea is required' });
    return;
  }
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { setupPaid: true } });
  const ctx = getContext(req, true);
  const content = aiCofounderService.generateRiskAnalysis(idea.trim(), ctx);
  await prisma.aiGeneratedOutput.create({
    data: { userId, projectId: projectId || null, type: 'risk_analysis', content: content as object },
  });
  res.json(content);
}

/** GET /ai/conversations — List chat history (optional projectId) */
export async function listConversations(req: Request, res: Response): Promise<void> {
  const { userId } = (req as unknown as { user: AuthPayload }).user;
  const projectId = req.query.projectId as string | undefined;
  const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
  const messages = await prisma.aiConversation.findMany({
    where: { userId, ...(projectId && { projectId }) },
    orderBy: { createdAt: 'asc' },
    take: limit,
    select: { id: true, message: true, role: true, createdAt: true },
  });
  res.json({ messages });
}

/** POST /ai/conversations — Send user message and get AI reply; persist both */
export async function sendMessage(req: Request, res: Response): Promise<void> {
  const { userId } = (req as unknown as { user: AuthPayload }).user;
  const { message, projectId } = req.body as { message: string; projectId?: string };
  if (!message?.trim()) {
    res.status(400).json({ error: 'message is required' });
    return;
  }
  await prisma.aiConversation.create({
    data: { userId, projectId: projectId || null, message: message.trim(), role: 'user' },
  });
  const lastUser = message.trim().toLowerCase();
  let reply = 'Share more about your idea—who it’s for, what problem it solves, and how you’ll make money—and I’ll give focused feedback.';
  if (lastUser.includes('market') || lastUser.includes('competitor')) {
    reply = 'Market and competition matter a lot. Use the **Market insights** tab to run a market analysis, or the **Business model** module to map your position.';
  } else if (lastUser.includes('investor') || lastUser.includes('pitch')) {
    reply = 'Use the **Risk & investor readiness** section to get a readiness score and next steps. The **Pitch Deck** module (paid) can draft your problem, solution, and ask.';
  } else if (lastUser.length > 80) {
    reply = 'You’ve described a clear direction. Next: (1) Validate with 5–10 potential users. (2) Use **Business model** to outline revenue and costs. (3) Use **Roadmap** to plan MVP and phases. (4) Check **Risk analysis** (paid) before pitching.';
  }
  const aiRow = await prisma.aiConversation.create({
    data: { userId, projectId: projectId || null, message: reply, role: 'ai' },
  });
  res.json({ message: reply, id: aiRow.id, createdAt: aiRow.createdAt });
}

/** GET /ai/outputs — List generated outputs (optional projectId, type filter) */
export async function listOutputs(req: Request, res: Response): Promise<void> {
  const { userId } = (req as unknown as { user: AuthPayload }).user;
  const projectId = req.query.projectId as string | undefined;
  const type = req.query.type as string | undefined;
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const rows = await prisma.aiGeneratedOutput.findMany({
    where: { userId, ...(projectId && { projectId }), ...(type && { type }) },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: { id: true, type: true, content: true, createdAt: true, projectId: true },
  });
  res.json({ outputs: rows });
}

/** POST /ai/full-business-plan — Generate all free + paid sections (paid only for paid sections) */
export async function fullBusinessPlan(req: Request, res: Response): Promise<void> {
  const { userId } = (req as unknown as { user: AuthPayload }).user;
  const { idea, projectId } = req.body as { idea: string; projectId?: string };
  if (!idea?.trim()) {
    res.status(400).json({ error: 'idea is required' });
    return;
  }
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { setupPaid: true } });
  const paid = user?.setupPaid ?? false;
  const ctx = getContext(req, paid);

  const ideaClarified = aiCofounderService.generateIdeaClarified(idea.trim(), ctx);
  const businessModel = aiCofounderService.generateBusinessModel(idea.trim(), ctx);
  const roadmap = aiCofounderService.generateRoadmap(idea.trim(), ctx);

  await prisma.aiGeneratedOutput.createMany({
    data: [
      { userId, projectId: projectId || null, type: 'idea_clarified', content: ideaClarified as object },
      { userId, projectId: projectId || null, type: 'business_model', content: businessModel as object },
      { userId, projectId: projectId || null, type: 'roadmap', content: roadmap as object },
    ],
  });

  const result: Record<string, unknown> = {
    ideaClarified,
    businessModel,
    roadmap,
  };

  if (paid) {
    result.pricing = aiCofounderService.generatePricing(idea.trim(), ctx);
    result.marketing = aiCofounderService.generateMarketing(idea.trim(), ctx);
    result.pitch = aiCofounderService.generatePitch(idea.trim(), ctx);
    result.riskAnalysis = aiCofounderService.generateRiskAnalysis(idea.trim(), ctx);
    await prisma.aiGeneratedOutput.createMany({
      data: [
        { userId, projectId: projectId || null, type: 'pricing', content: (result.pricing as object) as object },
        { userId, projectId: projectId || null, type: 'marketing', content: (result.marketing as object) as object },
        { userId, projectId: projectId || null, type: 'pitch', content: (result.pitch as object) as object },
        { userId, projectId: projectId || null, type: 'risk_analysis', content: (result.riskAnalysis as object) as object },
      ],
    });
  }

  res.json(result);
}
