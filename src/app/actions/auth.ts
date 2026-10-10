"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  createAdminSession,
  createCustomerSession,
  destroyAdminSession,
  destroyCustomerSession,
  hashPassword,
  verifyPassword
} from "@/lib/auth";
import { prisma } from "@/lib/db";
import { loginSchema, registerSchema } from "@/lib/validators";
import { assertSameOrigin, rateLimit, requestMetadata } from "@/lib/security";
import { writeAuditLog } from "@/lib/audit";

export type ActionState = {
  error?: string;
  success?: string;
};

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function customerRegisterAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await assertSameOrigin();
    const meta = await requestMetadata();
    rateLimit(`register:${meta.ip ?? "unknown"}`, 8, 60_000);

    const parsed = registerSchema.parse({
      name: formValue(formData, "name"),
      phone: formValue(formData, "phone"),
      email: formValue(formData, "email"),
      password: formValue(formData, "password")
    });

    const user = await prisma.user.create({
      data: {
        name: parsed.name,
        phone: parsed.phone,
        email: parsed.email || null,
        passwordHash: await hashPassword(parsed.password)
      }
    });
    await createCustomerSession(user.id);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message ?? "Please check your details." };
    }
    return {
      error:
        error instanceof Error && error.message.includes("Unique")
          ? "This phone or email is already registered."
          : "Could not create account. Please try again."
    };
  }

  redirect("/account");
}

export async function customerLoginAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await assertSameOrigin();
    const meta = await requestMetadata();
    rateLimit(`customer-login:${meta.ip ?? "unknown"}`, 10, 60_000);
    const parsed = loginSchema.parse({
      email: formValue(formData, "email"),
      password: formValue(formData, "password")
    });
    const user = await prisma.user.findFirst({
      where: { OR: [{ email: parsed.email }, { phone: parsed.email }] }
    });
    if (!user || user.status !== "ACTIVE") return { error: "Invalid login details." };
    const valid = await verifyPassword(parsed.password, user.passwordHash);
    if (!valid) return { error: "Invalid login details." };
    await createCustomerSession(user.id);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: "Enter a valid email or phone and password." };
    }
    return { error: "Could not sign in. Please try again." };
  }

  redirect("/account");
}

export async function adminLoginAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await assertSameOrigin();
    const meta = await requestMetadata();
    rateLimit(`admin-login:${meta.ip ?? "unknown"}`, 8, 60_000);
    const parsed = loginSchema.parse({
      email: formValue(formData, "email"),
      password: formValue(formData, "password")
    });
    const admin = await prisma.adminUser.findUnique({
      where: { email: parsed.email }
    });
    if (!admin || !admin.active) return { error: "Invalid admin credentials." };
    const valid = await verifyPassword(parsed.password, admin.passwordHash);
    if (!valid) return { error: "Invalid admin credentials." };
    await createAdminSession(admin.id);
    await writeAuditLog({
      adminUserId: admin.id,
      action: "ADMIN_LOGIN",
      entityType: "AdminUser",
      entityId: admin.id
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: "Enter a valid email and password." };
    }
    return { error: "Could not sign in. Please try again." };
  }

  redirect("/admin");
}

export async function customerLogoutAction() {
  await destroyCustomerSession();
  redirect("/");
}

export async function adminLogoutAction() {
  await destroyAdminSession();
  redirect("/admin/login");
}
