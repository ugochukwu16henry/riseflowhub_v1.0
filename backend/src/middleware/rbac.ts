/**
 * Role-Based Access Control (RBAC) — Hiring / Talent Platform
 *
 * Use: checkRole(['super_admin', 'hr_manager']) after authMiddleware
 * Same as requireRoles from auth.ts; this module documents the permission matrix.
 */

import type { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { requireRoles } from './auth';

/** Core hiring roles from spec */
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  COFOUNDER: 'cofounder',
  HR_MANAGER: 'hr_manager',
  LEGAL_TEAM: 'legal_team',
  TALENT: 'talent',
  HIRING_COMPANY: 'hiring_company',
  HIRER: 'hirer', // alias for hiring_company
} as const;

/**
 * Permission matrix (spec):
 * - Super Admin: Everything
 * - Co-Founder: Talent approval, marketplace moderation
 * - HR Manager: View applicants, interviews
 * - Legal Team: Agreements only
 * - Talent: Own profile + marketplace
 * - Hiring Company: Hire talents
 */
export const PERMISSIONS = {
  talentApproval: [ROLES.SUPER_ADMIN, ROLES.COFOUNDER, ROLES.HR_MANAGER],
  marketplaceModeration: [ROLES.SUPER_ADMIN, ROLES.COFOUNDER],
  viewApplicants: [ROLES.SUPER_ADMIN, ROLES.COFOUNDER, ROLES.HR_MANAGER],
  agreementsOnly: [ROLES.SUPER_ADMIN, ROLES.LEGAL_TEAM],
  hireTalents: [ROLES.SUPER_ADMIN, ROLES.HIRING_COMPANY, ROLES.HIRER],
  ownProfileAndMarketplace: [ROLES.TALENT],
} as const;

/**
 * checkRole(allowedRoles) — middleware that restricts route to given roles.
 * Use after authMiddleware.
 *
 * Example:
 *   router.get('/applicants', authMiddleware, checkRole(['super_admin', 'hr_manager']), listApplicants);
 */
export function checkRole(allowedRoles: UserRole[]) {
  return requireRoles(...allowedRoles);
}

/** Require one of: Super Admin, Co-Founder (talent approval + marketplace) */
export function requireTalentApprover(req: Request, res: Response, next: NextFunction) {
  return requireRoles(UserRole.super_admin, UserRole.cofounder, UserRole.hr_manager)(req, res, next);
}

/** Require Legal Team or Super Admin (agreements only) */
export function requireLegalOrSuperAdmin(req: Request, res: Response, next: NextFunction) {
  return requireRoles(UserRole.legal_team, UserRole.super_admin)(req, res, next);
}

/** Require Hiring Company (hirer) or Super Admin */
export function requireHiringCompanyOrAdmin(req: Request, res: Response, next: NextFunction) {
  return requireRoles(UserRole.hirer, UserRole.hiring_company, UserRole.super_admin)(req, res, next);
}
