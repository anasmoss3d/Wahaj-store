"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PERMISSIONS } from "@/lib/rbac";
import { assertSameOrigin } from "@/lib/security";
import { upsertStoreSettings } from "@/lib/settings";
import {
  addonInputSchema,
  categoryInputSchema,
  colorInputSchema,
  orderStatusInputSchema,
  storeSettingsSchema
} from "@/lib/validators";
import { updateOrderStatus } from "@/lib/orders";
import type { ActionState } from "@/app/actions/auth";

function value(formData: FormData, key: string) {
  const item = formData.get(key);
  return typeof item === "string" ? item : "";
}

function checkbox(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

export async function createCategoryAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await assertSameOrigin();
    const admin = await requireAdmin(PERMISSIONS.PRODUCTS_MANAGE);
    const parsed = categoryInputSchema.parse({
      name: value(formData, "name"),
      slug: value(formData, "slug"),
      description: value(formData, "description"),
      imageUrl: value(formData, "imageUrl"),
      active: checkbox(formData, "active"),
      sortOrder: Number(value(formData, "sortOrder") || 0)
    });
    const row = await prisma.category.create({ data: parsed });
    await prisma.auditLog.create({
      data: {
        adminUserId: admin.id,
        action: "CATEGORY_CREATED",
        entityType: "Category",
        entityId: row.id
      }
    });
    revalidatePath("/admin/categories");
    revalidatePath("/products");
    return { success: "Category created." };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0]?.message };
    return { error: error instanceof Error ? error.message : "Could not create category." };
  }
}

export async function createColorAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await assertSameOrigin();
    const admin = await requireAdmin(PERMISSIONS.PRODUCTS_MANAGE);
    const parsed = colorInputSchema.parse({
      name: value(formData, "name"),
      hexCode: value(formData, "hexCode"),
      active: checkbox(formData, "active"),
      sortOrder: Number(value(formData, "sortOrder") || 0)
    });
    const row = await prisma.color.create({ data: parsed });
    await prisma.auditLog.create({
      data: {
        adminUserId: admin.id,
        action: "COLOR_CREATED",
        entityType: "Color",
        entityId: row.id
      }
    });
    revalidatePath("/admin/colors");
    return { success: "Color created." };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0]?.message };
    return { error: error instanceof Error ? error.message : "Could not create color." };
  }
}

export async function createAddonAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await assertSameOrigin();
    const admin = await requireAdmin(PERMISSIONS.PRODUCTS_MANAGE);
    const parsed = addonInputSchema.parse({
      name: value(formData, "name"),
      description: value(formData, "description"),
      price: value(formData, "price"),
      imageUrl: value(formData, "imageUrl"),
      active: checkbox(formData, "active"),
      sortOrder: Number(value(formData, "sortOrder") || 0)
    });
    const row = await prisma.addon.create({ data: parsed });
    await prisma.auditLog.create({
      data: {
        adminUserId: admin.id,
        action: "ADDON_CREATED",
        entityType: "Addon",
        entityId: row.id
      }
    });
    revalidatePath("/admin/addons");
    return { success: "Add-on created." };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0]?.message };
    return { error: error instanceof Error ? error.message : "Could not create add-on." };
  }
}

export async function updateOrderStatusAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await assertSameOrigin();
    const admin = await requireAdmin(PERMISSIONS.ORDERS_MANAGE);
    const parsed = orderStatusInputSchema.parse({
      status: value(formData, "status"),
      note: value(formData, "note")
    });
    await updateOrderStatus({
      orderId: value(formData, "orderId"),
      status: parsed.status,
      note: parsed.note,
      adminUserId: admin.id
    });
    revalidatePath("/admin/orders");
    return { success: "Order status updated." };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0]?.message };
    return { error: error instanceof Error ? error.message : "Could not update order." };
  }
}

export async function updateSettingsAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await assertSameOrigin();
    const admin = await requireAdmin(PERMISSIONS.SETTINGS_MANAGE);
    const parsed = storeSettingsSchema.parse({
      shippingFlatRate: value(formData, "shippingFlatRate"),
      whatsappNumber: value(formData, "whatsappNumber"),
      primaryColor: value(formData, "primaryColor"),
      secondaryColor: value(formData, "secondaryColor"),
      heroImage: value(formData, "heroImage"),
      contactEmail: value(formData, "contactEmail")
    });
    const settings = {
      shippingFlatRate: parsed.shippingFlatRate,
      whatsappNumber: parsed.whatsappNumber ?? "",
      primaryColor: parsed.primaryColor,
      secondaryColor: parsed.secondaryColor,
      heroImage: parsed.heroImage ?? "",
      contactEmail: parsed.contactEmail ?? ""
    };
    await upsertStoreSettings(settings);
    await prisma.auditLog.create({
      data: {
        adminUserId: admin.id,
        action: "STORE_SETTINGS_UPDATED",
        entityType: "StoreSetting",
        metadata: settings
      }
    });
    revalidatePath("/");
    revalidatePath("/admin/settings");
    return { success: "Settings updated." };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0]?.message };
    return { error: error instanceof Error ? error.message : "Could not update settings." };
  }
}
