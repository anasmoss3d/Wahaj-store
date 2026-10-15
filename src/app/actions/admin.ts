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
  couponInputSchema,
  orderCustomerEditSchema,
  orderItemEditSchema,
  orderStatusInputSchema,
  shippingRateInputSchema,
  storeSettingsSchema
} from "@/lib/validators";
import { deleteOrder, updateOrderCustomer, updateOrderItemQuantity, updateOrderStatus } from "@/lib/orders";
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

export async function updateSettingsAction(  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await assertSameOrigin();
    const admin = await requireAdmin(PERMISSIONS.SETTINGS_MANAGE);
    const parsed = storeSettingsSchema.parse({
      shippingFlatRate: value(formData, "shippingFlatRate"),
      freeShippingThreshold: value(formData, "freeShippingThreshold"),
      whatsappNumber: value(formData, "whatsappNumber"),
      instapayHandle: value(formData, "instapayHandle"),
      instapayQrImage: value(formData, "instapayQrImage"),
      instapayLink: value(formData, "instapayLink"),
      telegramChatId: value(formData, "telegramChatId"),
      primaryColor: value(formData, "primaryColor"),
      secondaryColor: value(formData, "secondaryColor"),
      heroImage: value(formData, "heroImage"),
      contactEmail: value(formData, "contactEmail")
    });
    const settings = {
      shippingFlatRate: parsed.shippingFlatRate,
      freeShippingThreshold: parsed.freeShippingThreshold ?? 0,
      whatsappNumber: parsed.whatsappNumber ?? "",
      instapayHandle: parsed.instapayHandle ?? "",
      instapayQrImage: parsed.instapayQrImage ?? "",
      instapayLink: parsed.instapayLink ?? "",
      telegramChatId: parsed.telegramChatId ?? "",
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

function idValue(formData: FormData) {
  return value(formData, "id");
}

function adminError(error: unknown, fallback: string): ActionState {
  if (error instanceof z.ZodError) return { error: error.issues[0]?.message };
  if (
    error instanceof Error &&
    /prisma|transaction|database|timeout|connection|expired|prepared statement|connector|query execution|P1\d{3}|P2\d{3}/i.test(
      error.message
    )
  ) {
    return { error: "Something went wrong. Please try again." };
  }
  return { error: error instanceof Error ? error.message : fallback };
}

export async function updateCategoryAction(
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
    const row = await prisma.category.update({ where: { id: idValue(formData) }, data: parsed });
    await prisma.auditLog.create({
      data: {
        adminUserId: admin.id,
        action: "CATEGORY_UPDATED",
        entityType: "Category",
        entityId: row.id
      }
    });
    revalidatePath("/admin/categories");
    revalidatePath("/products");
    return { success: "Category updated." };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0]?.message };
    return { error: error instanceof Error ? error.message : "Could not update category." };
  }
}

export async function deleteCategoryAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await assertSameOrigin();
    const admin = await requireAdmin(PERMISSIONS.PRODUCTS_MANAGE);
    const id = idValue(formData);
    const used = await prisma.product.count({ where: { categoryId: id } });
    if (used > 0) return { error: "Category has products and cannot be deleted." };
    await prisma.category.delete({ where: { id } });
    await prisma.auditLog.create({
      data: {
        adminUserId: admin.id,
        action: "CATEGORY_DELETED",
        entityType: "Category",
        entityId: id
      }
    });
    revalidatePath("/admin/categories");
    revalidatePath("/products");
    return { success: "Category deleted." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not delete category." };
  }
}

export async function updateColorAction(
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
    const row = await prisma.color.update({ where: { id: idValue(formData) }, data: parsed });
    await prisma.auditLog.create({
      data: {
        adminUserId: admin.id,
        action: "COLOR_UPDATED",
        entityType: "Color",
        entityId: row.id
      }
    });
    revalidatePath("/admin/colors");
    return { success: "Color updated." };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0]?.message };
    return { error: error instanceof Error ? error.message : "Could not update color." };
  }
}

export async function deleteColorAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await assertSameOrigin();
    const admin = await requireAdmin(PERMISSIONS.PRODUCTS_MANAGE);
    const id = idValue(formData);
    const used = await prisma.productColor.count({ where: { colorId: id } });
    if (used > 0) return { error: "Color is used by products and cannot be deleted." };
    await prisma.color.delete({ where: { id } });
    await prisma.auditLog.create({
      data: {
        adminUserId: admin.id,
        action: "COLOR_DELETED",
        entityType: "Color",
        entityId: id
      }
    });
    revalidatePath("/admin/colors");
    return { success: "Color deleted." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not delete color." };
  }
}

export async function updateAddonAction(
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
    const row = await prisma.addon.update({ where: { id: idValue(formData) }, data: parsed });
    await prisma.auditLog.create({
      data: {
        adminUserId: admin.id,
        action: "ADDON_UPDATED",
        entityType: "Addon",
        entityId: row.id
      }
    });
    revalidatePath("/admin/addons");
    return { success: "Add-on updated." };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0]?.message };
    return { error: error instanceof Error ? error.message : "Could not update add-on." };
  }
}

export async function deleteAddonAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await assertSameOrigin();
    const admin = await requireAdmin(PERMISSIONS.PRODUCTS_MANAGE);
    const id = idValue(formData);
    const used = await prisma.productAddon.count({ where: { addonId: id } });
    if (used > 0) return { error: "Add-on is used by products and cannot be deleted." };
    await prisma.addon.delete({ where: { id } });
    await prisma.auditLog.create({
      data: {
        adminUserId: admin.id,
        action: "ADDON_DELETED",
        entityType: "Addon",
        entityId: id
      }
    });
    revalidatePath("/admin/addons");
    return { success: "Add-on deleted." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not delete add-on." };
  }
}

export async function upsertCouponAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await assertSameOrigin();
    const admin = await requireAdmin(PERMISSIONS.MARKETING_MANAGE);
    const parsed = couponInputSchema.parse({
      code: value(formData, "code").toUpperCase(),
      type: value(formData, "type"),
      value: value(formData, "value"),
      minSubtotal: value(formData, "minSubtotal"),
      maxUses: value(formData, "maxUses"),
      active: checkbox(formData, "active"),
      startsAt: value(formData, "startsAt"),
      endsAt: value(formData, "endsAt")
    });
    const id = value(formData, "id");
    const data = {
      code: parsed.code.replace(/[^A-Z0-9_-]/g, ""),
      type: parsed.type,
      value: parsed.value,
      minSubtotal: parsed.minSubtotal ?? 0,
      maxUses: parsed.maxUses === "" || parsed.maxUses === undefined ? null : parsed.maxUses,
      active: parsed.active,
      startsAt: parsed.startsAt,
      endsAt: parsed.endsAt
    };
    const row = id
      ? await prisma.coupon.update({ where: { id }, data })
      : await prisma.coupon.create({ data });
    await prisma.auditLog.create({
      data: {
        adminUserId: admin.id,
        action: id ? "COUPON_UPDATED" : "COUPON_CREATED",
        entityType: "Coupon",
        entityId: row.id,
        metadata: { code: row.code }
      }
    });
    revalidatePath("/admin/coupons");
    revalidatePath("/cart");
    revalidatePath("/checkout");
    return { success: id ? "Coupon updated." : "Coupon created." };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0]?.message };
    return { error: error instanceof Error ? error.message : "Could not save coupon." };
  }
}

export async function deleteCouponAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await assertSameOrigin();
    const admin = await requireAdmin(PERMISSIONS.MARKETING_MANAGE);
    const id = idValue(formData);
    await prisma.coupon.delete({ where: { id } });
    await prisma.auditLog.create({
      data: {
        adminUserId: admin.id,
        action: "COUPON_DELETED",
        entityType: "Coupon",
        entityId: id
      }
    });
    revalidatePath("/admin/coupons");
    return { success: "Coupon deleted." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not delete coupon." };
  }
}

export async function upsertShippingRateAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await assertSameOrigin();
    const admin = await requireAdmin(PERMISSIONS.SETTINGS_MANAGE);
    const { GOVERNORATES } = await import("@/lib/governorates");
    const governorate = value(formData, "governorate");
    if (!(GOVERNORATES as readonly string[]).includes(governorate)) {
      return { error: "Unknown governorate." };
    }
    const parsed = shippingRateInputSchema.parse({
      governorate,
      rate: value(formData, "rate"),
      active: checkbox(formData, "active")
    });
    const row = await prisma.shippingRate.upsert({
      where: { governorate: parsed.governorate },
      update: { rate: parsed.rate, active: parsed.active },
      create: { governorate: parsed.governorate, rate: parsed.rate, active: parsed.active }
    });
    await prisma.auditLog.create({
      data: {
        adminUserId: admin.id,
        action: "SHIPPING_RATE_UPDATED",
        entityType: "ShippingRate",
        entityId: row.id,
        metadata: { governorate: row.governorate }
      }
    });
    revalidatePath("/admin/settings");
    revalidatePath("/checkout");
    return { success: "Shipping rate saved." };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0]?.message };
    return { error: error instanceof Error ? error.message : "Could not save shipping rate." };
  }
}

export async function approveReviewAction(  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await assertSameOrigin();
    const admin = await requireAdmin(PERMISSIONS.PRODUCTS_MANAGE);
    const id = idValue(formData);
    const review = await prisma.review.update({
      where: { id },
      data: { approved: true },
      include: { product: true }
    });
    await prisma.auditLog.create({
      data: {
        adminUserId: admin.id,
        action: "REVIEW_APPROVED",
        entityType: "Review",
        entityId: id
      }
    });
    revalidatePath("/admin/reviews");
    revalidatePath(`/products/${review.product.slug}`);
    return { success: "Review approved." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not approve review." };
  }
}

export async function deleteReviewAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await assertSameOrigin();
    const admin = await requireAdmin(PERMISSIONS.PRODUCTS_MANAGE);
    const id = idValue(formData);
    await prisma.review.delete({ where: { id } });
    await prisma.auditLog.create({
      data: {
        adminUserId: admin.id,
        action: "REVIEW_DELETED",
        entityType: "Review",
        entityId: id
      }
    });
    revalidatePath("/admin/reviews");
    return { success: "Review deleted." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not delete review." };
  }
}

export async function updateOrderCustomerAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await assertSameOrigin();
    const admin = await requireAdmin(PERMISSIONS.ORDERS_MANAGE);
    const parsed = orderCustomerEditSchema.parse({
      customerName: value(formData, "customerName"),
      phone: value(formData, "phone"),
      whatsapp: value(formData, "whatsapp"),
      email: value(formData, "email"),
      governorate: value(formData, "governorate"),
      city: value(formData, "city"),
      fullAddress: value(formData, "fullAddress"),
      building: value(formData, "building"),
      notes: value(formData, "notes"),
      internalNotes: value(formData, "internalNotes")
    });
    const orderId = idValue(formData);
    await updateOrderCustomer({ orderId, adminUserId: admin.id, ...parsed });
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    return { success: "Order updated." };
  } catch (error) {
    return adminError(error, "Could not update order.");
  }
}

export async function updateOrderItemAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await assertSameOrigin();
    const admin = await requireAdmin(PERMISSIONS.ORDERS_MANAGE);
    const parsed = orderItemEditSchema.parse({
      itemId: value(formData, "itemId"),
      quantity: value(formData, "quantity")
    });
    const orderId = idValue(formData);
    await updateOrderItemQuantity({
      orderId,
      itemId: parsed.itemId,
      quantity: parsed.quantity,
      adminUserId: admin.id
    });
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    return { success: "Order item updated." };
  } catch (error) {
    return adminError(error, "Could not update item.");
  }
}

export async function deleteOrderAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await assertSameOrigin();
    const admin = await requireAdmin(PERMISSIONS.ORDERS_MANAGE);
    const orderId = idValue(formData);
    await deleteOrder({ orderId, adminUserId: admin.id });
    revalidatePath("/admin/orders");
    return { success: "Order deleted and stock restored." };
  } catch (error) {
    return adminError(error, "Could not delete order.");
  }
}
