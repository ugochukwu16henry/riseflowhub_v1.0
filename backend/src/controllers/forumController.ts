import { Request, Response } from 'express';
import { PrismaClient, UserRole } from '@prisma/client';
import type { AuthPayload } from '../middleware/auth';

const prisma = new PrismaClient();

/** GET /api/v1/forum/posts */
export async function listPosts(req: Request, res: Response): Promise<void> {
  const category = (req.query.category as string | undefined)?.trim() || undefined;
  const search = (req.query.search as string | undefined)?.trim() || undefined;
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(50, Math.max(5, Number(req.query.pageSize) || 20));
  const where: any = { isDeleted: false };
  if (category) where.category = category;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { body: { contains: search, mode: 'insensitive' } },
    ];
  }
  const [items, total] = await Promise.all([
    prisma.forumPost.findMany({
      where,
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
    }),
    prisma.forumPost.count({ where }),
  ]);
  res.json({
    items,
    page,
    pageSize,
    total,
  });
}

/** GET /api/v1/forum/posts/:id */
export async function getPost(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const post = await prisma.forumPost.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, role: true } },
      comments: {
        where: { isDeleted: false },
        orderBy: { createdAt: 'asc' },
        include: { user: { select: { id: true, name: true, role: true } } },
      },
    },
  });
  if (!post || post.isDeleted) {
    res.status(404).json({ error: 'Post not found' });
    return;
  }
  res.json(post);
}

/** POST /api/v1/forum/posts */
export async function createPost(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user?: AuthPayload }).user;
  if (!payload) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const { title, body, category } = req.body as { title?: string; body?: string; category?: string };
  if (!title?.trim() || !body?.trim()) {
    res.status(400).json({ error: 'Title and body are required' });
    return;
  }
  const cat = (category || 'startup_help').trim();
  const post = await prisma.forumPost.create({
    data: {
      userId: payload.userId,
      title: title.trim(),
      body: body.trim(),
      category: cat,
    },
  });
  res.status(201).json(post);
}

/** POST /api/v1/forum/posts/:id/comments */
export async function addComment(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user?: AuthPayload }).user;
  if (!payload) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const { id } = req.params;
  const { body } = req.body as { body?: string };
  if (!body?.trim()) {
    res.status(400).json({ error: 'Comment body is required' });
    return;
  }
  const post = await prisma.forumPost.findUnique({ where: { id } });
  if (!post || post.isDeleted || post.isLocked) {
    res.status(404).json({ error: 'Post not found or locked' });
    return;
  }
  const comment = await prisma.$transaction(async (tx) => {
    const c = await tx.forumComment.create({
      data: {
        postId: id,
        userId: payload.userId,
        body: body.trim(),
      },
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
    });
    await tx.forumPost.update({
      where: { id },
      data: { commentCount: { increment: 1 } },
    });
    return c;
  });
  res.status(201).json(comment);
}

/** POST /api/v1/forum/posts/:id/like — toggle like */
export async function toggleLike(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user?: AuthPayload }).user;
  if (!payload) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const { id } = req.params;
  const existing = await prisma.forumLike.findUnique({
    where: {
      postId_userId: {
        postId: id,
        userId: payload.userId,
      },
    } as any,
  });
  const post = await prisma.forumPost.findUnique({ where: { id } });
  if (!post || post.isDeleted) {
    res.status(404).json({ error: 'Post not found' });
    return;
  }
  if (existing) {
    await prisma.$transaction([
      prisma.forumLike.delete({ where: { id: existing.id } }),
      prisma.forumPost.update({
        where: { id },
        data: { likeCount: { decrement: 1 } },
      }),
    ]);
    res.json({ liked: false });
  } else {
    await prisma.$transaction([
      prisma.forumLike.create({
        data: {
          postId: id,
          userId: payload.userId,
        },
      }),
      prisma.forumPost.update({
        where: { id },
        data: { likeCount: { increment: 1 } },
      }),
    ]);
    res.json({ liked: true });
  }
}

/** DELETE /api/v1/forum/posts/:id — soft delete (admin/moderator) */
export async function removePost(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user?: AuthPayload }).user;
  if (!payload) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  if (payload.role !== UserRole.super_admin && payload.role !== UserRole.hr_manager && payload.role !== UserRole.legal_team) {
    res.status(403).json({ error: 'Only moderators can remove posts' });
    return;
  }
  const { id } = req.params;
  await prisma.forumPost.update({
    where: { id },
    data: { isDeleted: true },
  }).catch(() => {});
  res.json({ ok: true });
}

