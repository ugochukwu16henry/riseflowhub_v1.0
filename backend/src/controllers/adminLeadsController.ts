import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthPayload } from '../middleware/auth';
import { hashPassword } from '../utils/hash';

const prisma = new PrismaClient();

const ADMIN_LEAD_STATUSES = ['New', 'Contacted', 'ProposalSent', 'Converted', 'Closed'] as const;

/** GET /api/v1/admin/leads — list leads (admin only), optional ?status= */
export async function list(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user: AuthPayload }).user;
  if (payload.role !== 'super_admin' && payload.role !== 'project_manager' && payload.role !== 'finance_admin') {
    res.status(403).json({ error: 'Admin only' });
    return;
  }
  const status = req.query.status as string | undefined;
  const where = status && ADMIN_LEAD_STATUSES.includes(status as (typeof ADMIN_LEAD_STATUSES)[number])
    ? { status: status as (typeof ADMIN_LEAD_STATUSES)[number] }
    : {};
  const leads = await prisma.adminLead.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, projectName: true } },
    },
  });
  res.json(leads);
}

/** GET /api/v1/admin/leads/:id — single lead with notes */
export async function getOne(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user: AuthPayload }).user;
  if (payload.role !== 'super_admin' && payload.role !== 'project_manager' && payload.role !== 'finance_admin') {
    res.status(403).json({ error: 'Admin only' });
    return;
  }
  const { id } = req.params;
  const lead = await prisma.adminLead.findUnique({
    where: { id },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, projectName: true, status: true } },
      notes: {
        orderBy: { createdAt: 'desc' },
        include: { createdBy: { select: { id: true, name: true } } },
      },
    },
  });
  if (!lead) {
    res.status(404).json({ error: 'Lead not found' });
    return;
  }
  res.json(lead);
}

/** POST /api/v1/admin/leads — create lead (manual) */
export async function create(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user: AuthPayload }).user;
  if (payload.role !== 'super_admin' && payload.role !== 'project_manager' && payload.role !== 'finance_admin') {
    res.status(403).json({ error: 'Admin only' });
    return;
  }
  const { name, email, country, ideaSummary, stage, goal, budget } = req.body as {
    name: string;
    email: string;
    country?: string;
    ideaSummary?: string;
    stage?: string;
    goal?: string;
    budget?: string;
  };
  if (!name?.trim() || !email?.trim()) {
    res.status(400).json({ error: 'Name and email are required' });
    return;
  }
  const lead = await prisma.adminLead.create({
    data: {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      country: country?.trim() || null,
      ideaSummary: ideaSummary?.trim() || null,
      stage: stage?.trim() || null,
      goal: goal?.trim() || null,
      budget: budget?.trim() || null,
    },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });
  res.status(201).json(lead);
}

/** PUT /api/v1/admin/leads/:id/status — update status; when Converted, auto-create project */
export async function updateStatus(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user: AuthPayload }).user;
  if (payload.role !== 'super_admin' && payload.role !== 'project_manager' && payload.role !== 'finance_admin') {
    res.status(403).json({ error: 'Admin only' });
    return;
  }
  const { id } = req.params;
  const { status } = req.body as { status: string };
  if (!status || !ADMIN_LEAD_STATUSES.includes(status as (typeof ADMIN_LEAD_STATUSES)[number])) {
    res.status(400).json({ error: `status must be one of: ${ADMIN_LEAD_STATUSES.join(', ')}` });
    return;
  }
  const lead = await prisma.adminLead.findUnique({ where: { id } });
  if (!lead) {
    res.status(404).json({ error: 'Lead not found' });
    return;
  }
  if (lead.status === 'Converted' && status !== 'Converted') {
    res.status(400).json({ error: 'Cannot change status from Converted' });
    return;
  }
  if (lead.projectId && status === 'Converted') {
    const updated = await prisma.adminLead.update({
      where: { id },
      data: { status: status as (typeof ADMIN_LEAD_STATUSES)[number] },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, projectName: true } },
      },
    });
    return res.json(updated);
  }
  if (status === 'Converted') {
    const result = await convertLeadToProject(lead);
    if (result.error) {
      res.status(400).json({ error: result.error });
      return;
    }
    const updated = await prisma.adminLead.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, projectName: true } },
      },
    });
    return res.json(updated!);
  }
  const updated = await prisma.adminLead.update({
    where: { id },
    data: { status: status as (typeof ADMIN_LEAD_STATUSES)[number] },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, projectName: true } },
    },
  });
  res.json(updated);
}

/** Convert lead to project: create User (if new) + Client + Project */
async function convertLeadToProject(lead: { id: string; name: string; email: string; ideaSummary: string | null; goal: string | null; budget: string | null }): Promise<{ error?: string }> {
  const email = lead.email.trim().toLowerCase();
  let user = await prisma.user.findUnique({ where: { email }, include: { client: true } });
  let clientId: string;
  const tenantId = null;

  if (!user) {
    const tempPassword = `Temp${Math.random().toString(36).slice(2, 12)}!`;
    const passwordHash = await hashPassword(tempPassword);
    user = await prisma.user.create({
      data: {
        name: lead.name,
        email,
        passwordHash,
        role: 'client',
        tenantId,
      },
      include: { client: true },
    });
    const client = await prisma.client.create({
      data: {
        userId: user.id,
        businessName: lead.name,
        ideaSummary: lead.ideaSummary,
        budgetRange: lead.budget,
      },
    });
    clientId = client.id;
  } else {
    if (!user.client) {
      const client = await prisma.client.create({
        data: {
          userId: user.id,
          businessName: lead.name,
          ideaSummary: lead.ideaSummary,
          budgetRange: lead.budget,
        },
      });
      clientId = client.id;
    } else {
      clientId = user.client.id;
    }
  }

  const projectName = lead.name + ' – Project';
  const project = await prisma.project.create({
    data: {
      clientId,
      projectName,
      description: lead.ideaSummary || undefined,
      status: 'IdeaSubmitted',
      stage: 'Planning',
    },
  });

  await prisma.adminLead.update({
    where: { id: lead.id },
    data: { status: 'Converted', projectId: project.id },
  });
  return {};
}

/** PUT /api/v1/admin/leads/:id/assign — assign team member */
export async function assign(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user: AuthPayload }).user;
  if (payload.role !== 'super_admin' && payload.role !== 'project_manager' && payload.role !== 'finance_admin') {
    res.status(403).json({ error: 'Admin only' });
    return;
  }
  const { id } = req.params;
  const { assignedToId } = req.body as { assignedToId: string | null };
  const lead = await prisma.adminLead.findUnique({ where: { id } });
  if (!lead) {
    res.status(404).json({ error: 'Lead not found' });
    return;
  }
  if (assignedToId != null) {
    const user = await prisma.user.findUnique({ where: { id: assignedToId } });
    if (!user) {
      res.status(400).json({ error: 'User not found' });
      return;
    }
  }
  const updated = await prisma.adminLead.update({
    where: { id },
    data: { assignedToId: assignedToId || null },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, projectName: true } },
    },
  });
  res.json(updated);
}

/** POST /api/v1/admin/leads/:id/notes — add note */
export async function addNote(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user: AuthPayload }).user;
  if (payload.role !== 'super_admin' && payload.role !== 'project_manager' && payload.role !== 'finance_admin') {
    res.status(403).json({ error: 'Admin only' });
    return;
  }
  const { id } = req.params;
  const { content } = req.body as { content: string };
  if (!content?.trim()) {
    res.status(400).json({ error: 'Content is required' });
    return;
  }
  const lead = await prisma.adminLead.findUnique({ where: { id } });
  if (!lead) {
    res.status(404).json({ error: 'Lead not found' });
    return;
  }
  const note = await prisma.adminLeadNote.create({
    data: {
      adminLeadId: id,
      content: content.trim(),
      createdById: payload.userId,
    },
    include: { createdBy: { select: { id: true, name: true } } },
  });
  res.status(201).json(note);
}

/** GET /api/v1/admin/leads/:id/notes — list notes (optional; getOne already includes notes) */
export async function listNotes(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user: AuthPayload }).user;
  if (payload.role !== 'super_admin' && payload.role !== 'project_manager' && payload.role !== 'finance_admin') {
    res.status(403).json({ error: 'Admin only' });
    return;
  }
  const { id } = req.params;
  const notes = await prisma.adminLeadNote.findMany({
    where: { adminLeadId: id },
    orderBy: { createdAt: 'desc' },
    include: { createdBy: { select: { id: true, name: true } } },
  });
  res.json(notes);
}
