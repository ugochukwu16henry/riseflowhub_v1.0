import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthPayload } from '../middleware/auth';

const prisma = new PrismaClient();

const TEAM_ROLES = ['super_admin', 'project_manager', 'finance_admin', 'developer', 'designer', 'marketer'];

function canAccessWorkspace(payload: AuthPayload, project: { clientId: string; client: { userId: string } }, members: { userId: string }[]): 'full' | 'team' | 'investor' | false {
  if (payload.role === 'super_admin' || payload.role === 'project_manager' || payload.role === 'finance_admin') return 'full';
  if (project.client.userId === payload.userId) return 'full';
  if (members.some((m) => m.userId === payload.userId)) return 'team';
  if (payload.role === 'investor') return 'investor';
  if (TEAM_ROLES.includes(payload.role)) return 'team'; // platform team can see workspaces they're assigned to or all
  return false;
}

async function getProjectWithAuth(req: Request, res: Response): Promise<{ project: Awaited<ReturnType<typeof prisma.project.findUnique>>; access: 'full' | 'team' | 'investor' } | null> {
  const payload = (req as unknown as { user: AuthPayload }).user;
  const { projectId } = req.params;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      client: { include: { user: { select: { id: true, name: true, email: true } } } },
      projectMembers: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });
  if (!project) {
    res.status(404).json({ error: 'Workspace not found' });
    return null;
  }
  const members = await prisma.projectMember.findMany({ where: { projectId }, select: { userId: true } });
  const client = project?.client as { userId: string } | null;
  const access = client ? canAccessWorkspace(payload, { clientId: project!.clientId, client: { userId: client.userId } }, members) : false;
  if (!access) {
    res.status(403).json({ error: 'Access denied' });
    return null;
  }
  return { project, access };
}

/** GET /api/v1/workspace/:projectId — Workspace overview (permission-checked) */
export async function getWorkspace(req: Request, res: Response): Promise<void> {
  const result = await getProjectWithAuth(req, res);
  if (!result) return;
  const { project, access } = result;
  const { client, projectMembers, ...rest } = project!;
  res.json({
    ...rest,
    founder: client?.user ? { id: client.user.id, name: client.user.name, email: client.user.email } : null,
    members: projectMembers?.map((m) => ({ userId: m.user.id, name: m.user.name, email: m.user.email, role: m.role })) ?? [],
    access,
  });
}

/** PATCH /api/v1/workspace/:projectId — Update overview (founder/admin) */
export async function updateWorkspace(req: Request, res: Response): Promise<void> {
  const result = await getProjectWithAuth(req, res);
  if (!result || result.access === 'investor') {
    if (result === null) return;
    res.status(403).json({ error: 'Read-only access' });
    return;
  }
  const { projectId } = req.params;
  const { projectName, tagline, problemStatement, targetMarket, workspaceStage } = req.body as {
    projectName?: string; tagline?: string; problemStatement?: string; targetMarket?: string; workspaceStage?: string;
  };
  const updated = await prisma.project.update({
    where: { id: projectId },
    data: {
      ...(projectName !== undefined && { projectName }),
      ...(tagline !== undefined && { tagline }),
      ...(problemStatement !== undefined && { problemStatement }),
      ...(targetMarket !== undefined && { targetMarket }),
      ...(workspaceStage !== undefined && { workspaceStage }),
    },
  });
  res.json(updated);
}

/** GET /api/v1/workspace/:projectId/idea-vault — List Idea Vault items */
export async function listIdeaVault(req: Request, res: Response): Promise<void> {
  const result = await getProjectWithAuth(req, res);
  if (!result || result.access === 'investor') {
    if (result === null) return;
    res.status(403).json({ error: 'Read-only access' });
    return;
  }
  const items = await prisma.ideaVaultItem.findMany({
    where: { projectId: req.params.projectId },
    orderBy: { updatedAt: 'desc' },
  });
  res.json(items);
}

/** POST /api/v1/workspace/:projectId/idea-vault — Create draft/note */
export async function createIdeaVaultItem(req: Request, res: Response): Promise<void> {
  const result = await getProjectWithAuth(req, res);
  if (!result || result.access === 'investor') {
    if (result === null) return;
    res.status(403).json({ error: 'Read-only access' });
    return;
  }
  const { projectId } = req.params;
  const { type, title, content } = req.body as { type?: string; title?: string; content?: string };
  const item = await prisma.ideaVaultItem.create({
    data: {
      projectId,
      type: type === 'pitch_draft' ? 'pitch_draft' : 'note',
      title: title?.trim() || 'Untitled',
      content: content?.trim() || '',
      status: 'draft',
    },
  });
  res.status(201).json(item);
}

/** PATCH /api/v1/workspace/:projectId/idea-vault/:itemId — Update item; can set status to submitted_for_review */
export async function updateIdeaVaultItem(req: Request, res: Response): Promise<void> {
  const result = await getProjectWithAuth(req, res);
  if (!result || result.access === 'investor') {
    if (result === null) return;
    res.status(403).json({ error: 'Read-only access' });
    return;
  }
  const { projectId, itemId } = req.params;
  const { title, content, status } = req.body as { title?: string; content?: string; status?: string };
  const item = await prisma.ideaVaultItem.findFirst({ where: { id: itemId, projectId } });
  if (!item) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }
  const updated = await prisma.ideaVaultItem.update({
    where: { id: itemId },
    data: {
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
      ...(status === 'submitted_for_review' && { status: 'submitted_for_review' }),
    },
  });
  res.json(updated);
}

/** DELETE /api/v1/workspace/:projectId/idea-vault/:itemId */
export async function deleteIdeaVaultItem(req: Request, res: Response): Promise<void> {
  const result = await getProjectWithAuth(req, res);
  if (!result || result.access === 'investor') {
    if (result === null) return;
    res.status(403).json({ error: 'Read-only access' });
    return;
  }
  const { projectId, itemId } = req.params;
  const item = await prisma.ideaVaultItem.findFirst({ where: { id: itemId, projectId } });
  if (!item) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }
  await prisma.ideaVaultItem.delete({ where: { id: itemId } });
  res.status(204).send();
}

/** GET /api/v1/workspace/:projectId/business-model */
export async function getBusinessModel(req: Request, res: Response): Promise<void> {
  const result = await getProjectWithAuth(req, res);
  if (!result || result.access === 'investor') {
    if (result === null) return;
    res.status(403).json({ error: 'Read-only access' });
    return;
  }
  let model = await prisma.businessModel.findUnique({ where: { projectId: req.params.projectId } });
  if (!model) {
    model = await prisma.businessModel.create({ data: { projectId: req.params.projectId } });
  }
  res.json(model);
}

/** PATCH /api/v1/workspace/:projectId/business-model */
export async function updateBusinessModel(req: Request, res: Response): Promise<void> {
  const result = await getProjectWithAuth(req, res);
  if (!result || result.access === 'investor') {
    if (result === null) return;
    res.status(403).json({ error: 'Read-only access' });
    return;
  }
  const { projectId } = req.params;
  const body = req.body as Record<string, string | undefined>;
  const fields = ['valueProposition', 'customerSegments', 'revenueStreams', 'costStructure', 'channels', 'keyActivities'];
  const data: Record<string, string | null> = {};
  for (const f of fields) {
    if (body[f] !== undefined) data[f] = body[f]?.trim() || null;
  }
  let model = await prisma.businessModel.findUnique({ where: { projectId } });
  if (!model) {
    model = await prisma.businessModel.create({ data: { projectId, ...data } });
  } else if (Object.keys(data).length > 0) {
    model = await prisma.businessModel.update({ where: { projectId }, data });
  }
  res.json(model);
}

/** GET /api/v1/workspace/:projectId/team — List project members */
export async function listProjectTeam(req: Request, res: Response): Promise<void> {
  const result = await getProjectWithAuth(req, res);
  if (!result) return;
  const members = await prisma.projectMember.findMany({
    where: { projectId: req.params.projectId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  res.json(members.map((m) => ({ id: m.id, userId: m.userId, role: m.role, name: m.user.name, email: m.user.email })));
}

/** POST /api/v1/workspace/:projectId/team — Add member (admin/founder) */
export async function addProjectMember(req: Request, res: Response): Promise<void> {
  const result = await getProjectWithAuth(req, res);
  if (!result || result.access === 'investor') {
    if (result === null) return;
    res.status(403).json({ error: 'Read-only access' });
    return;
  }
  if (result.access !== 'full') {
    res.status(403).json({ error: 'Only founder or admin can add members' });
    return;
  }
  const { projectId } = req.params;
  const { userId, role } = req.body as { userId: string; role?: string };
  const member = await prisma.projectMember.create({
    data: {
      projectId,
      userId,
      role: role === 'viewer' ? 'viewer' : 'member',
    },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  res.status(201).json(member);
}

/** DELETE /api/v1/workspace/:projectId/team/:userId */
export async function removeProjectMember(req: Request, res: Response): Promise<void> {
  const result = await getProjectWithAuth(req, res);
  if (!result || result.access === 'investor') {
    if (result === null) return;
    res.status(403).json({ error: 'Read-only access' });
    return;
  }
  if (result.access !== 'full') {
    res.status(403).json({ error: 'Only founder or admin can remove members' });
    return;
  }
  const { projectId, userId } = req.params;
  await prisma.projectMember.deleteMany({ where: { projectId, userId } });
  res.status(204).send();
}

/** GET /api/v1/workspace/:projectId/files — List files (optional category) */
export async function listWorkspaceFiles(req: Request, res: Response): Promise<void> {
  const result = await getProjectWithAuth(req, res);
  if (!result) return;
  const { projectId } = req.params;
  const category = req.query.category as string | undefined;
  const files = await prisma.file.findMany({
    where: { projectId, ...(category && { category }) },
    orderBy: { createdAt: 'desc' },
    include: { uploadedBy: { select: { id: true, name: true } } },
  });
  res.json(files);
}

/** GET /api/v1/workspace/:projectId/investor-view — Read-only pitch (for investors) */
export async function getInvestorView(req: Request, res: Response): Promise<void> {
  const result = await getProjectWithAuth(req, res);
  if (!result) return;
  const project = await prisma.project.findUnique({
    where: { id: req.params.projectId },
    select: {
      id: true,
      projectName: true,
      tagline: true,
      description: true,
      problemStatement: true,
      targetMarket: true,
      workspaceStage: true,
      progressPercent: true,
      client: { select: { user: { select: { name: true } } } },
      startupProfile: true,
    },
  });
  if (!project) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json({
    ...project,
    founderName: project.client?.user?.name ?? null,
    client: undefined,
  });
}

/** GET /api/v1/workspace/:projectId/progress — Tasks completed, milestones, stage */
export async function getProgress(req: Request, res: Response): Promise<void> {
  const result = await getProjectWithAuth(req, res);
  if (!result) return;
  const { projectId } = req.params;
  const [project, taskCounts, milestoneCounts] = await Promise.all([
    prisma.project.findUnique({
      where: { id: projectId },
      select: { progressPercent: true, workspaceStage: true, status: true },
    }),
    prisma.task.groupBy({
      by: ['status'],
      where: { projectId },
      _count: true,
    }),
    prisma.milestone.groupBy({
      by: ['status'],
      where: { projectId },
      _count: true,
    }),
  ]);
  const tasksCompleted = taskCounts.find((t) => t.status === 'Done')?._count ?? 0;
  const tasksTotal = taskCounts.reduce((s, t) => s + t._count, 0);
  const milestonesCompleted = milestoneCounts.find((m) => m.status === 'Completed')?._count ?? 0;
  const milestonesTotal = milestoneCounts.reduce((s, m) => s + m._count, 0);
  res.json({
    progressPercent: project?.progressPercent ?? 0,
    workspaceStage: project?.workspaceStage ?? 'Idea',
    status: project?.status,
    tasksCompleted,
    tasksTotal,
    milestonesCompleted,
    milestonesTotal,
  });
}
