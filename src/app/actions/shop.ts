"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import type { ActionState } from "@/app/actions/auth";
import { getCurrentUser } from "@/lib/auth";
import { setCartCoupon } from "@/lib/cart";
import { LOCALE_COOKIE, isLocale } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { assertSameOrigin, rateLimit, requestMetadata } from "@/lib/security";
import {
  couponApplySchema,
  reviewInputSchema,
  wishlistInputSchema
} from "@/lib/validators";

export async function applyCouponAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await assertSameOrigin();
    const raw = formData.get("code");
    const parsed = couponApplySchema.parse({ code: typeof raw === "string" ? raw : "" });
    await setCartCoupon(parsed.code);
    revalidatePath("/cart");
    revalidatePath("/checkout");
    return { success: "Coupon applied." };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0]?.message };
    return { error: error instanceof Error ? error.message : "Could not apply coupon." };
  }
}

export async function removeCouponAction(): Promise<ActionState> {
  try {
    await assertSameOrigin();
    await setCartCoupon(null);
    revalidatePath("/cart");
    revalidatePath("/checkout");
    return { success: "Coupon removed." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not remove coupon." };
  }
}

export async function toggleWishlistAction(productId: string): Promise<ActionState> {
  try {
    await assertSameOrigin();
    const user = await getCurrentUser();
    if (!user) return { error: "LOGIN_REQUIRED" };
    const parsed = wishlistInputSchema.parse({ productId });
    const product = await prisma.product.findFirst({
      where: { id: parsed.productId, active: true }
    });
    if (!product) return { error: "Product not found." };

    const existing = await prisma.wishlistItem.findUnique({
      where: { userId_productId: { userId: user.id, productId: product.id } }
    });
    if (existing) {
      await prisma.wishlistItem.delete({ where: { id: existing.id } });
      revalidatePath("/wishlist");
      return { success: "REMOVED" };
    }
    await prisma.wishlistItem.create({ data: { userId: user.id, productId: product.id } });
    revalidatePath("/wishlist");
    return { success: "ADDED" };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0]?.message };
    return { error: error instanceof Error ? error.message : "Could not update wishlist." };
  }
}

export async function submitReviewAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await assertSameOrigin();
    const meta = await requestMetadata();
    rateLimit(`review:${meta.ip ?? "unknown"}`, 5, 3_600_000);
    const value = (key: string) => {
      const item = formData.get(key);
      return typeof item === "string" ? item : "";
    };
    const parsed = reviewInputSchema.parse({
      productId: value("productId"),
      name: value("name"),
      rating: value("rating"),
      title: value("title"),
      body: value("body")
    });
    const product = await prisma.product.findFirst({
      where: { id: parsed.productId, active: true }
    });
    if (!product) return { error: "Product not found." };

    const user = await getCurrentUser();
    await prisma.review.create({
      data: {
        productId: product.id,
        userId: user?.id ?? null,
        name: user?.name ?? parsed.name,
        rating: parsed.rating,
        title: parsed.title || null,
        body: parsed.body,
        approved: false
      }
    });
    revalidatePath(`/products/${product.slug}`);
    return { success: "REVIEW_PENDING" };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0]?.message };
    return { error: error instanceof Error ? error.message : "Could not submit review." };
  }
}

export async function setLocaleAction(locale: string) {
  const next = isLocale(locale) ? locale : "ar";
  const store = await cookies();
  store.set(LOCALE_COOKIE, next, { path: "/", maxAge: 365 * 24 * 3600, sameSite: "lax" });
  revalidatePath("/", "layout");
}
