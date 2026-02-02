import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { UserRole } from '@prisma/client';
import { hashPassword, comparePassword } from '../utils/hash';
import { signToken } from '../utils/jwt';
import type { AuthPayload } from '../middleware/auth';

const prisma = new PrismaClient();

export async function signup(req: Request, res: Response): Promise<void> {
  const { name, email, password, role = 'client' } = req.body as {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
  };
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(400).json({ error: 'Email already registered' });
    return;
  }
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  res.status(201).json({ user, token });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email: string; password: string };
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await comparePassword(password, user.passwordHash))) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }
  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  res.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    token,
  });
}

export async function me(req: Request, res: Response): Promise<void> {
  const { userId } = (req as unknown as { user: AuthPayload }).user;
  const profile = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  if (!profile) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(profile);
}

export function logout(_req: Request, res: Response): void {
  res.json({ message: 'Logged out' });
}
