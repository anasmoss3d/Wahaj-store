import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { getLocale } from "@/lib/i18n";
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

const SESSION_TOUCH_INTERVAL_MS = 5 * 60 * 1000;
const ADMIN_IDLE_TIMEOUT_MS = 24 * 60 * 60 * 1000;

export const DUMMY_PASSWORD_HASH =
  "$2b$12$bolmDSyf3EJlg7KYbtvkDOG1oDo9ui2pIabtFp5iqlV7w25IbiJLC";

export class AuthError extends AppError {
  constructor(
    message: string,
    public readonly status: 401 | 403
  ) {
    super(message);
    this.name = "AuthError";
  }
}

async function getCurrentUserUncached() {
  const token = await readCookie(CUSTOMER_SESSION_COOKIE);
  if (!token) return null;

  const session = await prisma.customerSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true }
  });

  const now = new Date();
  if (!session || session.expiresAt <= now || session.user.status !== "ACTIVE") {
    return null;
  }

  if (now.getTime() - session.lastSeenAt.getTime() > SESSION_TOUCH_INTERVAL_MS) {
    await prisma.customerSession
      .update({
        where: { id: session.id },
        data: { lastSeenAt: now }
      })
      .catch(() => {});
  }

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

  const now = new Date();
  if (
    !session ||
    session.expiresAt <= now ||
    now.getTime() - session.lastSeenAt.getTime() > ADMIN_IDLE_TIMEOUT_MS ||
    !session.adminUser.active
  ) {
    return null;
  }

  if (now.getTime() - session.lastSeenAt.getTime() > SESSION_TOUCH_INTERVAL_MS) {
    await prisma.adminSession
      .update({
        where: { id: session.id },
        data: { lastSeenAt: now }
      })
      .catch(() => {});
  }

  return session.adminUser;
}

export const getCurrentAdmin = cache(getCurrentAdminUncached);

export async function requireAdmin(permission?: PermissionKey) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/auth/login?next=/admin");
  if (permission && !hasPermission(admin, permission)) redirect("/admin/forbidden");
  return admin;
}

export async function requireAdminApi(permission?: PermissionKey) {
  const [admin, locale] = await Promise.all([getCurrentAdmin(), getLocale()]);
  const isArabic = locale === "ar";
  if (!admin) {
    throw new AuthError(isArabic ? "مطلوب تسجيل الدخول." : "Authentication required.", 401);
  }
  if (permission && !hasPermission(admin, permission)) {
    throw new AuthError(
      isArabic
        ? "ليست لديك صلاحية لتنفيذ هذا الإجراء."
        : "You do not have permission for this action.",
      403
    );
  }
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

export async function verifyDummyPassword(password: string) {
  return bcrypt.compare(password, DUMMY_PASSWORD_HASH);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}
