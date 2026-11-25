"use server";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import {
  createAdminSession,
  createCustomerSession,
  destroyAdminSession,
  destroyCustomerSession,
  DUMMY_PASSWORD_HASH,
  getCurrentAdmin,
  hashPassword,
  verifyDummyPassword,
  verifyPassword
} from "@/lib/auth";
import { mergeGuestCartIntoUserCart } from "@/lib/cart";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { getLocale } from "@/lib/i18n";
import { canDispatchPasswordReset, sendPasswordResetEmail } from "@/lib/mail";
import {
  assertSameOrigin,
  rateLimitAuth,
  requestMetadata,
  sanitizeNextPath
} from "@/lib/security";
import { CART_COOKIE, clearSessionCookie, createToken, hashToken } from "@/lib/sessions";
import {
  loginSchema,
  normalizeEgyptianPhone,
  normalizeEmail,
  registerSchema,
  resetPasswordConfirmSchema,
  resetPasswordRequestSchema
} from "@/lib/validators";

export type ActionState = {
  error?: string;
  success?: string;
};

const LOGIN_RATE_WINDOW_MS = 15 * 60 * 1000;
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function invalidLoginMessage(isArabic: boolean) {
  return isArabic ? "بيانات الدخول غير صحيحة." : "Invalid login details.";
}

function genericResetRequestedMessage(isArabic: boolean) {
  return isArabic
    ? "إذا كان البريد الإلكتروني مسجلاً لدينا، فستصلك رسالة تحتوي على رابط إعادة تعيين كلمة المرور."
    : "If an account matches this email, a password reset link has been sent.";
}

function resolveAppBaseUrl() {
  const raw = (process.env.APP_URL || "http://localhost:3000").trim();
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

async function authenticateByEmail(input: {
  email: string;
  password: string;
  rawNext: string;
  isArabic: boolean;
}): Promise<{ ok: true; redirectTarget: string } | { ok: false; error: string }> {
  const [admin, user] = await Promise.all([
    prisma.adminUser.findFirst({
      where: { email: { equals: input.email, mode: "insensitive" } }
    }),
    prisma.user.findFirst({
      where: { email: { equals: input.email, mode: "insensitive" } }
    })
  ]);

  if (admin && user) {
    await verifyDummyPassword(input.password);
    await writeAuditLog({
      adminUserId: admin.id,
      action: "AUTH_EMAIL_COLLISION",
      entityType: "AdminUser",
      entityId: admin.id,
      metadata: { userId: user.id }
    });
    return { ok: false, error: invalidLoginMessage(input.isArabic) };
  }

  if (admin) {
    const valid = await verifyPassword(
      input.password,
      admin.active ? admin.passwordHash : DUMMY_PASSWORD_HASH
    );
    if (!admin.active || !valid) {
      await writeAuditLog({
        adminUserId: admin.id,
        action: "ADMIN_LOGIN_FAILED",
        entityType: "AdminUser",
        entityId: admin.id,
        metadata: { active: admin.active }
      });
      return { ok: false, error: invalidLoginMessage(input.isArabic) };
    }

    await destroyCustomerSession();
    await createAdminSession(admin.id);
    await writeAuditLog({
      adminUserId: admin.id,
      action: "ADMIN_LOGIN",
      entityType: "AdminUser",
      entityId: admin.id
    });
    return {
      ok: true,
      redirectTarget: sanitizeNextPath(input.rawNext, { role: "admin" })
    };
  }

  if (user) {
    const valid = await verifyPassword(
      input.password,
      user.status === "ACTIVE" ? user.passwordHash : DUMMY_PASSWORD_HASH
    );
    if (user.status !== "ACTIVE" || !valid) {
      return { ok: false, error: invalidLoginMessage(input.isArabic) };
    }

    await destroyAdminSession();
    await createCustomerSession(user.id);
    await mergeGuestCartIntoUserCart(user.id);
    return {
      ok: true,
      redirectTarget: sanitizeNextPath(input.rawNext, { role: "customer" })
    };
  }

  await verifyDummyPassword(input.password);
  return { ok: false, error: invalidLoginMessage(input.isArabic) };
}

async function authenticateByPhone(input: {
  rawIdentifier: string;
  normalizedPhone: string;
  password: string;
  rawNext: string;
  isArabic: boolean;
}): Promise<{ ok: true; redirectTarget: string } | { ok: false; error: string }> {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { phone: input.normalizedPhone },
        { phone: `+2${input.normalizedPhone}` },
        { phone: input.rawIdentifier }
      ]
    }
  });

  const valid = await verifyPassword(
    input.password,
    user?.status === "ACTIVE" ? user.passwordHash : DUMMY_PASSWORD_HASH
  );
  if (!user || user.status !== "ACTIVE" || !valid) {
    return { ok: false, error: invalidLoginMessage(input.isArabic) };
  }

  await destroyAdminSession();
  await createCustomerSession(user.id);
  await mergeGuestCartIntoUserCart(user.id);
  return {
    ok: true,
    redirectTarget: sanitizeNextPath(input.rawNext, { role: "customer" })
  };
}

export async function loginAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const locale = await getLocale();
  const isArabic = locale === "ar";
  let redirectTarget = "/account";

  try {
    await assertSameOrigin();
    const meta = await requestMetadata();

    const rawIdentifier = (
      formValue(formData, "identifier") || formValue(formData, "email")
    ).trim();
    const rawNext = formValue(formData, "next");
    const parsed = loginSchema.parse({
      identifier: rawIdentifier,
      password: formValue(formData, "password")
    });

    const isEmail = parsed.identifier.includes("@");
    const normalizedIdentifier = isEmail
      ? normalizeEmail(parsed.identifier)
      : normalizeEgyptianPhone(parsed.identifier);

    await Promise.all([
      rateLimitAuth(`login:ip:${meta.ip ?? "unknown"}`, 30, LOGIN_RATE_WINDOW_MS),
      rateLimitAuth(
        `login:id:${hashToken(normalizedIdentifier)}`,
        10,
        LOGIN_RATE_WINDOW_MS
      )
    ]);

    const outcome = isEmail
      ? await authenticateByEmail({
          email: normalizedIdentifier,
          password: parsed.password,
          rawNext,
          isArabic
        })
      : await authenticateByPhone({
          rawIdentifier: parsed.identifier,
          normalizedPhone: normalizedIdentifier,
          password: parsed.password,
          rawNext,
          isArabic
        });

    if (!outcome.ok) {
      return { error: outcome.error };
    }
    redirectTarget = outcome.redirectTarget;
  } catch (error) {
    if (error instanceof AppError) {
      return { error: error.message };
    }
    if (error instanceof z.ZodError) {
      return {
        error: isArabic
          ? "أدخل بريداً إلكترونياً أو رقم هاتف مصري صحيح وكلمة مرور."
          : "Enter a valid email or phone and password."
      };
    }
    return {
      error: isArabic
        ? "تعذر تسجيل الدخول. يرجى المحاولة مرة أخرى."
        : "Could not sign in. Please try again."
    };
  }

  redirect(redirectTarget);
}

export async function registerAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const locale = await getLocale();
  const isArabic = locale === "ar";
  let redirectTarget = "/account";

  try {
    await assertSameOrigin();
    const meta = await requestMetadata();

    const rawPassword = formValue(formData, "password");
    const rawConfirm = formData.get("confirmPassword");
    const rawNext = formValue(formData, "next");

    const parsed = registerSchema.parse({
      name: formValue(formData, "name"),
      phone: normalizeEgyptianPhone(formValue(formData, "phone")),
      email: formValue(formData, "email") ? normalizeEmail(formValue(formData, "email")) : "",
      password: rawPassword
    });

    if (typeof rawConfirm === "string" && rawConfirm !== parsed.password) {
      return {
        error: isArabic ? "كلمتا المرور غير متطابقتين." : "Passwords do not match."
      };
    }

    const rateChecks = [
      rateLimitAuth(`register:ip:${meta.ip ?? "unknown"}`, 10, LOGIN_RATE_WINDOW_MS),
      rateLimitAuth(`register:phone:${hashToken(parsed.phone)}`, 6, LOGIN_RATE_WINDOW_MS)
    ];
    if (parsed.email) {
      rateChecks.push(
        rateLimitAuth(`register:email:${hashToken(parsed.email)}`, 6, LOGIN_RATE_WINDOW_MS)
      );
    }
    await Promise.all(rateChecks);

    // Always hash before checking existence so timing cannot leak admin/customer emails.
    const passwordHash = await hashPassword(parsed.password);
    const duplicateMessage = isArabic
      ? "رقم الهاتف أو البريد الإلكتروني مسجل بالفعل."
      : "This phone or email is already registered.";

    const [existingUser, existingAdmin] = await Promise.all([
      prisma.user.findFirst({
        where: {
          OR: [
            { phone: parsed.phone },
            { phone: `+2${parsed.phone}` },
            ...(parsed.email
              ? [{ email: { equals: parsed.email, mode: "insensitive" as const } }]
              : [])
          ]
        },
        select: { id: true }
      }),
      parsed.email
        ? prisma.adminUser.findFirst({
            where: { email: { equals: parsed.email, mode: "insensitive" } },
            select: { id: true }
          })
        : Promise.resolve(null)
    ]);

    if (existingUser || existingAdmin) {
      return { error: duplicateMessage };
    }

    const user = await prisma.user.create({
      data: {
        name: parsed.name,
        phone: parsed.phone,
        email: parsed.email || null,
        passwordHash
      }
    });

    await destroyAdminSession();
    await createCustomerSession(user.id);
    await mergeGuestCartIntoUserCart(user.id);
    redirectTarget = sanitizeNextPath(rawNext, { role: "customer" });
  } catch (error) {
    if (error instanceof AppError) {
      return { error: error.message };
    }
    if (error instanceof z.ZodError) {
      return {
        error:
          error.issues[0]?.message ??
          (isArabic ? "يرجى التحقق من البيانات المدخلة." : "Please check your details.")
      };
    }
    const isUniqueError =
      (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") ||
      (error instanceof Error && error.message.includes("Unique"));
    return {
      error: isUniqueError
        ? isArabic
          ? "رقم الهاتف أو البريد الإلكتروني مسجل بالفعل."
          : "This phone or email is already registered."
        : isArabic
          ? "تعذر إنشاء الحساب. يرجى المحاولة مرة أخرى."
          : "Could not create account. Please try again."
    };
  }

  redirect(redirectTarget);
}

export async function logoutAction() {
  await assertSameOrigin();
  const admin = await getCurrentAdmin();
  if (admin) {
    await writeAuditLog({
      adminUserId: admin.id,
      action: "ADMIN_LOGOUT",
      entityType: "AdminUser",
      entityId: admin.id
    });
  }
  await Promise.all([
    destroyAdminSession(),
    destroyCustomerSession(),
    clearSessionCookie(CART_COOKIE)
  ]);
  redirect("/");
}

export async function requestPasswordResetAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const locale = await getLocale();
  const isArabic = locale === "ar";

  try {
    await assertSameOrigin();
    const meta = await requestMetadata();
    const parsed = resetPasswordRequestSchema.parse({
      email: formValue(formData, "email")
    });
    const email = normalizeEmail(parsed.email);

    await Promise.all([
      rateLimitAuth(`reset-req:ip:${meta.ip ?? "unknown"}`, 10, LOGIN_RATE_WINDOW_MS),
      rateLimitAuth(`reset-req:id:${hashToken(email)}`, 5, LOGIN_RATE_WINDOW_MS)
    ]);

    if (!canDispatchPasswordReset()) {
      return {
        error: isArabic
          ? "إعادة تعيين كلمة المرور عبر البريد غير متاحة حالياً. يرجى التواصل مع دعم المتجر."
          : "Password reset by email is currently unavailable. Please contact store support."
      };
    }

    const [admin, user] = await Promise.all([
      prisma.adminUser.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
        select: { id: true }
      }),
      prisma.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
        select: { id: true, email: true, status: true }
      })
    ]);

    if (admin) {
      await verifyDummyPassword("admin-reset-blocked");
      await writeAuditLog({
        adminUserId: admin.id,
        action: "ADMIN_PUBLIC_RESET_BLOCKED",
        entityType: "AdminUser",
        entityId: admin.id
      });
      return { success: genericResetRequestedMessage(isArabic) };
    }

    if (!user || user.status !== "ACTIVE" || !user.email) {
      await verifyDummyPassword("user-reset-noop");
      return { success: genericResetRequestedMessage(isArabic) };
    }

    const rawToken = createToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    const created = await prisma.$transaction(async (tx) => {
      await tx.passwordResetToken.deleteMany({
        where: { userId: user.id, usedAt: null }
      });
      return tx.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt
        },
        select: { id: true }
      });
    });

    const resetUrl = `${resolveAppBaseUrl()}/auth/reset-password?token=${encodeURIComponent(rawToken)}`;

    try {
      await sendPasswordResetEmail({
        to: user.email,
        resetUrl,
        locale
      });
    } catch {
      await prisma.passwordResetToken.delete({ where: { id: created.id } }).catch(() => {});
      return {
        error: isArabic
          ? "تعذر إرسال رابط إعادة التعيين حالياً. حاول مرة أخرى لاحقاً."
          : "Unable to send the reset link right now. Please try again shortly."
      };
    }

    return { success: genericResetRequestedMessage(isArabic) };
  } catch (error) {
    if (error instanceof AppError) {
      return { error: error.message };
    }
    if (error instanceof z.ZodError) {
      return {
        error:
          error.issues[0]?.message ??
          (isArabic ? "يرجى إدخال بريد إلكتروني صحيح." : "Please enter a valid email address.")
      };
    }
    return {
      error: isArabic
        ? "تعذر إرسال رابط إعادة التعيين. حاول مرة أخرى."
        : "Could not process password reset request. Please try again."
    };
  }
}

export async function resetPasswordAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const locale = await getLocale();
  const isArabic = locale === "ar";
  const invalidTokenMessage = isArabic
    ? "رابط إعادة تعيين كلمة المرور غير صالح أو منتهي الصلاحية."
    : "This password reset link is invalid or has expired.";

  try {
    await assertSameOrigin();
    const meta = await requestMetadata();

    const parsed = resetPasswordConfirmSchema.parse({
      token: formValue(formData, "token"),
      password: formValue(formData, "password"),
      confirmPassword: formValue(formData, "confirmPassword")
    });

    const tokenHash = hashToken(parsed.token);
    await Promise.all([
      rateLimitAuth(`reset-confirm:ip:${meta.ip ?? "unknown"}`, 10, LOGIN_RATE_WINDOW_MS),
      rateLimitAuth(`reset-confirm:tok:${tokenHash}`, 8, LOGIN_RATE_WINDOW_MS)
    ]);

    const existing = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: { id: true, status: true }
        }
      }
    });

    const now = new Date();
    if (
      !existing ||
      existing.usedAt !== null ||
      existing.expiresAt <= now ||
      existing.user.status !== "ACTIVE"
    ) {
      return { error: invalidTokenMessage };
    }

    const passwordHash = await hashPassword(parsed.password);

    await prisma.$transaction(async (tx) => {
      const claim = await tx.passwordResetToken.updateMany({
        where: {
          id: existing.id,
          usedAt: null,
          expiresAt: { gt: new Date() }
        },
        data: { usedAt: new Date() }
      });

      if (claim.count !== 1) {
        throw new AppError(invalidTokenMessage);
      }

      const updatedUsers = await tx.user.updateMany({
        where: { id: existing.userId, status: "ACTIVE" },
        data: { passwordHash }
      });

      if (updatedUsers.count !== 1) {
        throw new AppError(invalidTokenMessage);
      }

      await tx.customerSession.deleteMany({
        where: { userId: existing.userId }
      });

      await tx.passwordResetToken.deleteMany({
        where: { userId: existing.userId, id: { not: existing.id } }
      });
    });

    await Promise.all([
      destroyAdminSession(),
      destroyCustomerSession(),
      clearSessionCookie(CART_COOKIE)
    ]);
  } catch (error) {
    if (error instanceof AppError) {
      return { error: error.message };
    }
    if (error instanceof z.ZodError) {
      return {
        error:
          error.issues[0]?.message ??
          (isArabic ? "يرجى التحقق من البيانات المدخلة." : "Please check your details.")
      };
    }
    return {
      error: isArabic
        ? "تعذر تحديث كلمة المرور. يرجى المحاولة مرة أخرى."
        : "Could not reset password. Please try again."
    };
  }

  redirect("/auth/login?reset=1");
}
