import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { type AdminPrincipal, hasPermission, type PermissionKey } from "@/lib/rbac";
import { requestMetadata } from "@/lib/security";
import {
  ADMIN_SESSION_COOKIE,
  CUSTOMER_SESSION_COOKIE,
  clearSessionCookie,
  createToken,
  hashToken,
  readCookie,
  setSessionCookie
} from "@/lib/sessions";

async function getCurrentUserUncached() {
  const token = await readCookie(CUSTOMER_SESSION_COOKIE);
  if (!token) return null;

  const session = await prisma.customerSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true }
  });

  if (!session || session.expiresAt < new Date() || session.user.status !== "ACTIVE") {
    return null;
  }

  await prisma.customerSession.update({
    where: { id: session.id },
    data: { lastSeenAt: new Date() }
  });

  return session.user;
}

export const getCurrentUser = cache(getCurrentUserUncached);

async function getCurrentAdminUncached(): Promise<AdminPrincipal | null> {
  const token = await readCookie(ADMIN_SESSION_COOKIE);
  if (!token) return null;

  const session = await prisma.adminSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      adminUser: {
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true }
              }
            }
          }
        }
      }
    }
  });

  if (!session || session.expiresAt < new Date() || !session.adminUser.active) {
    return null;
  }

  await prisma.adminSession.update({
    where: { id: session.id },
    data: { lastSeenAt: new Date() }
  });

  return session.adminUser;
}

export const getCurrentAdmin = cache(getCurrentAdminUncached);

export async function requireAdmin(permission?: PermissionKey) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  if (permission && !hasPermission(admin, permission)) redirect("/admin");
  return admin;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  return user;
}

export async function createCustomerSession(userId: string) {
  const token = createToken();
  const meta = await requestMetadata();
  await prisma.customerSession.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      ip: meta.ip,
      userAgent: meta.userAgent
    }
  });
  await setSessionCookie(CUSTOMER_SESSION_COOKIE, token, 60 * 60 * 24 * 30);
}

export async function createAdminSession(adminUserId: string) {
  const token = createToken();
  const meta = await requestMetadata();
  await prisma.adminSession.create({
    data: {
      tokenHash: hashToken(token),
      adminUserId,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      ip: meta.ip,
      userAgent: meta.userAgent
    }
  });
  await setSessionCookie(ADMIN_SESSION_COOKIE, token, 60 * 60 * 24 * 7);
}

export async function destroyCustomerSession() {
  const token = await readCookie(CUSTOMER_SESSION_COOKIE);
  if (token) {
    await prisma.customerSession.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  await clearSessionCookie(CUSTOMER_SESSION_COOKIE);
}

export async function destroyAdminSession() {
  const token = await readCookie(ADMIN_SESSION_COOKIE);
  if (token) {
    await prisma.adminSession.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  await clearSessionCookie(ADMIN_SESSION_COOKIE);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}
