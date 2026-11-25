"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionState } from "@/app/actions/auth";
import { requireAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { safeErrorMessage } from "@/lib/errors";
import { getLocale } from "@/lib/i18n";
import {
  deleteOrder,
  updateOrderCustomer,
  updateOrderItemQuantity,
  updateOrderStatus
} from "@/lib/orders";
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
  sizeInputSchema,
  storeSettingsSchema
} from "@/lib/validators";

function value(formData: FormData, key: string) {
  const item = formData.get(key);
  return typeof item === "string" ? item : "";
}

function checkbox(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function optionalEn(formData: FormData, key: string) {
  const trimmed = value(formData, key).trim();
  return trimmed || null;
}

async function msg(ar: string, en: string) {
  return (await getLocale()) === "ar" ? ar : en;
}

function parseCategoryData(formData: FormData) {
  const parsed = categoryInputSchema.parse({
    name: value(formData, "name"),
    nameEn: value(formData, "nameEn"),
    slug: value(formData, "slug"),
    description: value(formData, "description"),
    descriptionEn: value(formData, "descriptionEn"),
    imageUrl: value(formData, "imageUrl"),
    active: checkbox(formData, "active"),
    sortOrder: Number(value(formData, "sortOrder") || 0)
  });
  return {
    ...parsed,
    nameEn: optionalEn(formData, "nameEn"),
    descriptionEn: optionalEn(formData, "descriptionEn")
  };
}

function parseColorData(formData: FormData) {
  const parsed = colorInputSchema.parse({
    name: value(formData, "name"),
    nameEn: value(formData, "nameEn"),
    hexCode: value(formData, "hexCode"),
    active: checkbox(formData, "active"),
    sortOrder: Number(value(formData, "sortOrder") || 0)
  });
  return { ...parsed, nameEn: optionalEn(formData, "nameEn") };
}

function parseSizeData(formData: FormData) {
  const parsed = sizeInputSchema.parse({
    name: value(formData, "name"),
    nameEn: value(formData, "nameEn"),
    active: checkbox(formData, "active"),
    sortOrder: Number(value(formData, "sortOrder") || 0)
  });
  return { ...parsed, nameEn: optionalEn(formData, "nameEn") };
}

function parseAddonData(formData: FormData) {
  const parsed = addonInputSchema.parse({
    name: value(formData, "name"),
    nameEn: value(formData, "nameEn"),
    description: value(formData, "description"),
    descriptionEn: value(formData, "descriptionEn"),
    price: value(formData, "price"),
    imageUrl: value(formData, "imageUrl"),
    active: checkbox(formData, "active"),
    sortOrder: Number(value(formData, "sortOrder") || 0)
  });
  return {
    ...parsed,
    nameEn: optionalEn(formData, "nameEn"),
    descriptionEn: optionalEn(formData, "descriptionEn")
  };
}

export async function createCategoryAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await assertSameOrigin();
    const admin = await requireAdminApi(PERMISSIONS.PRODUCTS_MANAGE);
    const row = await prisma.category.create({ data: parseCategoryData(formData) });
    await prisma.auditLog.create({
      data: {
        adminUserId: admin.id,
        action: "CATEGORY_CREATED",
        entityType: "Category",
        entityId: row.id
      }
    });
    revalidatePath("/");
    revalidatePath("/admin/categories");
    revalidatePath("/products");
    return { success: await msg("تم إنشاء الفئة بنجاح.", "Category created.") };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0]?.message };
    return {
      error: await safeErrorMessage(
        error,
        await msg("تعذر إنشاء الفئة.", "Could not create category.")
      )
    };
  }
}

export async function createColorAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await assertSameOrigin();
    const admin = await requireAdminApi(PERMISSIONS.PRODUCTS_MANAGE);
    const row = await prisma.color.create({ data: parseColorData(formData) });
    await prisma.auditLog.create({
      data: {
        adminUserId: admin.id,
        action: "COLOR_CREATED",
        entityType: "Color",
        entityId: row.id
      }
    });
    revalidatePath("/admin/colors");
    return { success: await msg("تم إنشاء اللون بنجاح.", "Color created.") };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0]?.message };
    return {
      error: await safeErrorMessage(
        error,
        await msg("تعذر إنشاء اللون.", "Could not create color.")
      )
    };
  }
}

export async function createAddonAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await assertSameOrigin();
    const admin = await requireAdminApi(PERMISSIONS.PRODUCTS_MANAGE);
    const row = await prisma.addon.create({ data: parseAddonData(formData) });
    await prisma.auditLog.create({
      data: {
        adminUserId: admin.id,
        action: "ADDON_CREATED",
        entityType: "Addon",
        entityId: row.id
      }
    });
    revalidatePath("/admin/addons");
    return { success: await msg("تم إنشاء الإضافة بنجاح.", "Add-on created.") };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0]?.message };
    return {
      error: await safeErrorMessage(
        error,
        await msg("تعذر إنشاء الإضافة.", "Could not create add-on.")
      )
    };
  }
}

export async function createSizeAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await assertSameOrigin();
    const admin = await requireAdminApi(PERMISSIONS.PRODUCTS_MANAGE);
    const row = await prisma.size.create({ data: parseSizeData(formData) });
    await prisma.auditLog.create({
      data: {
        adminUserId: admin.id,
        action: "SIZE_CREATED",
        entityType: "Size",
        entityId: row.id
      }
    });
    revalidatePath("/admin/sizes");
    return { success: await msg("تم إنشاء الحجم بنجاح.", "Size created.") };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0]?.message };
    return {
      error: await safeErrorMessage(
        error,
        await msg("تعذر إنشاء الحجم.", "Could not create size.")
      )
    };
  }
}

export async function updateOrderStatusAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await assertSameOrigin();
    const admin = await requireAdminApi(PERMISSIONS.ORDERS_MANAGE);
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
    return { success: await msg("تم تحديث حالة الطلب.", "Order status updated.") };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0]?.message };
    return {
      error: await safeErrorMessage(
        error,
        await msg("تعذر تحديث الطلب.", "Could not update order.")
      )
    };
  }
}

export async function updateSettingsAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await assertSameOrigin();
    const admin = await requireAdminApi(PERMISSIONS.SETTINGS_MANAGE);
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
    return { success: await msg("تم حفظ الإعدادات بنجاح.", "Settings updated.") };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0]?.message };
    return {
      error: await safeErrorMessage(
        error,
        await msg("تعذر تحديث الإعدادات.", "Could not update settings.")
      )
    };
  }
}

function idValue(formData: FormData) {
  return value(formData, "id");
}

async function adminError(error: unknown, fallback: string): Promise<ActionState> {
  if (error instanceof z.ZodError) return { error: error.issues[0]?.message };
  return { error: await safeErrorMessage(error, fallback) };
}

export async function updateCategoryAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await assertSameOrigin();
    const admin = await requireAdminApi(PERMISSIONS.PRODUCTS_MANAGE);
    const row = await prisma.category.update({
      where: { id: idValue(formData) },
      data: parseCategoryData(formData)
    });
    await prisma.auditLog.create({
      data: {
        adminUserId: admin.id,
        action: "CATEGORY_UPDATED",
        entityType: "Category",
        entityId: row.id
      }
    });
    revalidatePath("/");
    revalidatePath("/admin/categories");
    revalidatePath("/products");
    return { success: await msg("تم تحديث الفئة بنجاح.", "Category updated.") };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0]?.message };
    return {
      error: await safeErrorMessage(
        error,
        await msg("تعذر تحديث الفئة.", "Could not update category.")
      )
    };
  }
}

export async function deleteCategoryAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await assertSameOrigin();
    const admin = await requireAdminApi(PERMISSIONS.PRODUCTS_MANAGE);
    const id = idValue(formData);
    const used = await prisma.product.count({ where: { categoryId: id } });
    if (used > 0) {
      return {
        error: await msg(
          "الفئة تحتوي على منتجات ولا يمكن حذفها.",
          "Category has products and cannot be deleted."
        )
      };
    }
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
    return { success: await msg("تم حذف الفئة.", "Category deleted.") };
  } catch (error) {
    return {
      error: await safeErrorMessage(
        error,
        await msg("تعذر حذف الفئة.", "Could not delete category.")
      )
    };
  }
}

export async function updateColorAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await assertSameOrigin();
    const admin = await requireAdminApi(PERMISSIONS.PRODUCTS_MANAGE);
    const row = await prisma.color.update({
      where: { id: idValue(formData) },
      data: parseColorData(formData)
    });
    await prisma.auditLog.create({
      data: {
        adminUserId: admin.id,
        action: "COLOR_UPDATED",
        entityType: "Color",
        entityId: row.id
      }
    });
    revalidatePath("/admin/colors");
    revalidatePath("/products");
    return { success: await msg("تم تحديث اللون بنجاح.", "Color updated.") };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0]?.message };
    return {
      error: await safeErrorMessage(
        error,
        await msg("تعذر تحديث اللون.", "Could not update color.")
      )
    };
  }
}

export async function deleteColorAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await assertSameOrigin();
    const admin = await requireAdminApi(PERMISSIONS.PRODUCTS_MANAGE);
    const id = idValue(formData);
    const used = await prisma.productColor.count({ where: { colorId: id } });
    if (used > 0) {
      return {
        error: await msg(
          "هذا اللون مستخدم في منتجات ولا يمكن حذفه.",
          "Color is used by products and cannot be deleted."
        )
      };
    }
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
    return { success: await msg("تم حذف اللون.", "Color deleted.") };
  } catch (error) {
    return {
      error: await safeErrorMessage(
        error,
        await msg("تعذر حذف اللون.", "Could not delete color.")
      )
    };
  }
}

export async function updateSizeAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await assertSameOrigin();
    const admin = await requireAdminApi(PERMISSIONS.PRODUCTS_MANAGE);
    const row = await prisma.size.update({
      where: { id: idValue(formData) },
      data: parseSizeData(formData)
    });
    await prisma.auditLog.create({
      data: {
        adminUserId: admin.id,
        action: "SIZE_UPDATED",
        entityType: "Size",
        entityId: row.id
      }
    });
    revalidatePath("/admin/sizes");
    revalidatePath("/products");
    return { success: await msg("تم تحديث الحجم بنجاح.", "Size updated.") };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0]?.message };
    return {
      error: await safeErrorMessage(
        error,
        await msg("تعذر تحديث الحجم.", "Could not update size.")
      )
    };
  }
}

export async function deleteSizeAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await assertSameOrigin();
    const admin = await requireAdminApi(PERMISSIONS.PRODUCTS_MANAGE);
    const id = idValue(formData);
    const used = await prisma.productSize.count({ where: { sizeId: id } });
    if (used > 0) {
      return {
        error: await msg(
          "هذا الحجم مستخدم في منتجات ولا يمكن حذفه.",
          "Size is used by products and cannot be deleted."
        )
      };
    }
    await prisma.size.delete({ where: { id } });
    await prisma.auditLog.create({
      data: {
        adminUserId: admin.id,
        action: "SIZE_DELETED",
        entityType: "Size",
        entityId: id
      }
    });
    revalidatePath("/admin/sizes");
    return { success: await msg("تم حذف الحجم.", "Size deleted.") };
  } catch (error) {
    return {
      error: await safeErrorMessage(
        error,
        await msg("تعذر حذف الحجم.", "Could not delete size.")
      )
    };
  }
}

export async function updateAddonAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await assertSameOrigin();
    const admin = await requireAdminApi(PERMISSIONS.PRODUCTS_MANAGE);
    const row = await prisma.addon.update({
      where: { id: idValue(formData) },
      data: parseAddonData(formData)
    });
    await prisma.auditLog.create({
      data: {
        adminUserId: admin.id,
        action: "ADDON_UPDATED",
        entityType: "Addon",
        entityId: row.id
      }
    });
    revalidatePath("/admin/addons");
    revalidatePath("/products");
    return { success: await msg("تم تحديث الإضافة بنجاح.", "Add-on updated.") };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0]?.message };
    return {
      error: await safeErrorMessage(
        error,
        await msg("تعذر تحديث الإضافة.", "Could not update add-on.")
      )
    };
  }
}

export async function deleteAddonAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await assertSameOrigin();
    const admin = await requireAdminApi(PERMISSIONS.PRODUCTS_MANAGE);
    const id = idValue(formData);
    const used = await prisma.productAddon.count({ where: { addonId: id } });
    if (used > 0) {
      return {
        error: await msg(
          "هذه الإضافة مستخدمة في منتجات ولا يمكن حذفها.",
          "Add-on is used by products and cannot be deleted."
        )
      };
    }
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
    return { success: await msg("تم حذف الإضافة.", "Add-on deleted.") };
  } catch (error) {
    return {
      error: await safeErrorMessage(
        error,
        await msg("تعذر حذف الإضافة.", "Could not delete add-on.")
      )
    };
  }
}

export async function upsertCouponAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await assertSameOrigin();
    const admin = await requireAdminApi(PERMISSIONS.MARKETING_MANAGE);
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
    return {
      success: id
        ? await msg("تم تحديث الكوبون بنجاح.", "Coupon updated.")
        : await msg("تم إنشاء الكوبون بنجاح.", "Coupon created.")
    };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0]?.message };
    return {
      error: await safeErrorMessage(
        error,
        await msg("تعذر حفظ الكوبون.", "Could not save coupon.")
      )
    };
  }
}

export async function deleteCouponAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await assertSameOrigin();
    const admin = await requireAdminApi(PERMISSIONS.MARKETING_MANAGE);
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
    return { success: await msg("تم حذف الكوبون.", "Coupon deleted.") };
  } catch (error) {
    return {
      error: await safeErrorMessage(
        error,
        await msg("تعذر حذف الكوبون.", "Could not delete coupon.")
      )
    };
  }
}

export async function upsertShippingRateAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await assertSameOrigin();
    const admin = await requireAdminApi(PERMISSIONS.SETTINGS_MANAGE);
    const { GOVERNORATES } = await import("@/lib/governorates");
    const governorate = value(formData, "governorate");
    if (!(GOVERNORATES as readonly string[]).includes(governorate)) {
      return { error: await msg("محافظة غير معروفة.", "Unknown governorate.") };
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
    return { success: await msg("تم حفظ سعر الشحن.", "Shipping rate saved.") };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0]?.message };
    return {
      error: await safeErrorMessage(
        error,
        await msg("تعذر حفظ سعر الشحن.", "Could not save shipping rate.")
      )
    };
  }
}

export async function approveReviewAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await assertSameOrigin();
    const admin = await requireAdminApi(PERMISSIONS.PRODUCTS_MANAGE);
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
    return { success: await msg("تم اعتماد التقييم.", "Review approved.") };
  } catch (error) {
    return {
      error: await safeErrorMessage(
        error,
        await msg("تعذر اعتماد التقييم.", "Could not approve review.")
      )
    };
  }
}

export async function deleteReviewAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await assertSameOrigin();
    const admin = await requireAdminApi(PERMISSIONS.PRODUCTS_MANAGE);
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
    return { success: await msg("تم حذف التقييم.", "Review deleted.") };
  } catch (error) {
    return {
      error: await safeErrorMessage(
        error,
        await msg("تعذر حذف التقييم.", "Could not delete review.")
      )
    };
  }
}

export async function updateOrderCustomerAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await assertSameOrigin();
    const admin = await requireAdminApi(PERMISSIONS.ORDERS_MANAGE);
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
    return { success: await msg("تم تحديث بيانات الطلب.", "Order updated.") };
  } catch (error) {
    return await adminError(
      error,
      await msg("تعذر تحديث الطلب.", "Could not update order.")
    );
  }
}

export async function updateOrderItemAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await assertSameOrigin();
    const admin = await requireAdminApi(PERMISSIONS.ORDERS_MANAGE);
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
    return { success: await msg("تم تحديث عنصر الطلب.", "Order item updated.") };
  } catch (error) {
    return await adminError(
      error,
      await msg("تعذر تحديث العنصر.", "Could not update item.")
    );
  }
}

export async function deleteOrderAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await assertSameOrigin();
    const admin = await requireAdminApi(PERMISSIONS.ORDERS_MANAGE);
    const orderId = idValue(formData);
    await deleteOrder({ orderId, adminUserId: admin.id });
    revalidatePath("/admin/orders");
    return {
      success: await msg("تم حذف الطلب واستعادة المخزون.", "Order deleted and stock restored.")
    };
  } catch (error) {
    return await adminError(
      error,
      await msg("تعذر حذف الطلب.", "Could not delete order.")
    );
  }
}
