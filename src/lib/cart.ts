import { Prisma } from "@prisma/client";
import { cache } from "react";
import { getCurrentUser } from "@/lib/auth";
import { validateCouponForSubtotal } from "@/lib/coupons";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { calculateLinePrice, cartItemSignature } from "@/lib/pricing";
import { getOrCreateCartSessionId, readCookie, CART_COOKIE } from "@/lib/sessions";
import { getProductColorImageUrl } from "@/lib/product-images";
import { getLocale, isCustomColorName, pickLocalized } from "@/lib/i18n";

export type CartViewItem = {
  id: string;
  productId: string;
  productName: string;
  slug: string;
  sku: string;
  image: string;
  colorName: string | null;
  colorHex: string | null;
  colorIsCustom: boolean;
  sizeName: string | null;
  addons: Array<{ id: string; name: string; price: Prisma.Decimal }>;
  quantity: number;
  unitPrice: Prisma.Decimal;
  total: Prisma.Decimal;
  signature: string;
};

export type CartView = {
  id: string | null;
  items: CartViewItem[];
  subtotal: Prisma.Decimal;
  subtotalCents: number;
  count: number;
  couponCode: string | null;
  discountCents: number;
};

async function findActiveCart(create = false) {
  const user = await getCurrentUser();
  const sessionId = create ? await getOrCreateCartSessionId() : await readCookie(CART_COOKIE);

  if (user) {
    const userCart = await prisma.cart.findFirst({
      where: { userId: user.id, status: "ACTIVE" },
      orderBy: { updatedAt: "desc" }
    });
    if (userCart) return userCart;
    if (create) {
      return prisma.cart.create({ data: { userId: user.id, sessionId } });
    }
  }

  if (!sessionId) return null;

  const sessionCart = await prisma.cart.findFirst({
    where: { sessionId, userId: null, status: "ACTIVE" },
    orderBy: { updatedAt: "desc" }
  });

  if (sessionCart) return sessionCart;
  if (!create) return null;

  return prisma.cart.create({
    data: { userId: user?.id ?? null, sessionId }
  });
}

export async function mergeGuestCartIntoUserCart(userId: string) {
  const sessionId = await readCookie(CART_COOKIE);
  if (!sessionId) return;

  const guestCart = await prisma.cart.findFirst({
    where: { sessionId, userId: null, status: "ACTIVE" },
    include: {
      items: {
        include: { addons: true }
      }
    },
    orderBy: { updatedAt: "desc" }
  });

  if (!guestCart) return;

  const userCart = await prisma.cart.findFirst({
    where: { userId, status: "ACTIVE" },
    include: {
      items: {
        include: { addons: true }
      }
    },
    orderBy: { updatedAt: "desc" }
  });

  if (!userCart) {
    await prisma.cart.update({
      where: { id: guestCart.id },
      data: { userId }
    });
    return;
  }

  if (guestCart.items.length === 0) {
    await prisma.cart.update({
      where: { id: guestCart.id },
      data: { status: "ABANDONED" }
    });
    return;
  }

  const userItemsBySignature = new Map(
    userCart.items.map((item) => [
      cartItemSignature(
        item.productId,
        item.productColorId,
        item.addons.map((addon) => addon.productAddonId),
        item.productSizeId
      ),
      item
    ])
  );

  await prisma.$transaction(async (tx) => {
    for (const guestItem of guestCart.items) {
      const signature = cartItemSignature(
        guestItem.productId,
        guestItem.productColorId,
        guestItem.addons.map((addon) => addon.productAddonId),
        guestItem.productSizeId
      );
      const matchingUserItem = userItemsBySignature.get(signature);
      if (matchingUserItem) {
        await tx.cartItem.update({
          where: { id: matchingUserItem.id },
          data: { quantity: Math.min(99, matchingUserItem.quantity + guestItem.quantity) }
        });
      } else {
        await tx.cartItem.update({
          where: { id: guestItem.id },
          data: { cartId: userCart.id }
        });
      }
    }
    await tx.cart.update({
      where: { id: guestCart.id },
      data: { status: "ABANDONED" }
    });
  });
}

async function getCartViewUncached(): Promise<CartView> {
  const [cart, locale] = await Promise.all([findActiveCart(false), getLocale()]);
  if (!cart) {
    return {
      id: null,
      items: [],
      subtotal: new Prisma.Decimal(0),
      subtotalCents: 0,
      count: 0,
      couponCode: null,
      discountCents: 0
    };
  }

  const rows = await prisma.cartItem.findMany({
    where: { cartId: cart.id },
    include: {
      product: true,
      productColor: { include: { color: true } },
      productSize: { include: { size: true } },
      addons: {
        include: {
          productAddon: {
            include: { addon: true }
          }
        },
        orderBy: { productAddonId: "asc" }
      }
    },
    orderBy: { createdAt: "asc" }
  });

  let subtotalCents = 0;
  let count = 0;
  const items = rows.map((row) => {
    const addonModels = row.addons.map((entry) => entry.productAddon.addon);
    const calculated = calculateLinePrice({
      basePrice: row.product.basePrice,
      sizePrice: row.productSize?.price,
      colorAdditionalPrice: row.productColor?.additionalPrice ?? 0,
      addonPrices: addonModels.map((addon) => addon.price),
      quantity: row.quantity
    });
    subtotalCents += calculated.totalCents;
    count += row.quantity;

    return {
      id: row.id,
      productId: row.productId,
      productName: pickLocalized(locale, row.product.name, row.product.nameEn),
      slug: row.product.slug,
      sku: row.product.sku,
      image: row.productColor
        ? getProductColorImageUrl(
            row.product.slug,
            row.productColor.color.nameEn ?? row.productColor.color.name,
            row.productColor.imageUrl || row.product.mainImage
          )
        : row.product.mainImage,
      colorName: row.productColor
        ? pickLocalized(locale, row.productColor.color.name, row.productColor.color.nameEn)
        : null,
      colorHex: row.productColor?.color.hexCode ?? null,
      colorIsCustom: row.productColor
        ? isCustomColorName(row.productColor.color.name, row.productColor.color.nameEn)
        : false,
      sizeName: row.productSize
        ? pickLocalized(locale, row.productSize.size.name, row.productSize.size.nameEn)
        : null,
      addons: addonModels.map((addon) => ({
        id: addon.id,
        name: pickLocalized(locale, addon.name, addon.nameEn),
        price: addon.price
      })),
      quantity: row.quantity,
      unitPrice: calculated.unitPrice,
      total: calculated.total,
      signature: cartItemSignature(
        row.productId,
        row.productColorId,
        row.addons.map((entry) => entry.productAddonId),
        row.productSizeId
      )
    };
  });

  return {
    id: cart.id,
    items,
    subtotal: new Prisma.Decimal((subtotalCents / 100).toFixed(2)),
    subtotalCents,
    count,
    couponCode: cart.couponCode,
    discountCents: await resolveCartDiscount(cart.couponCode, subtotalCents)
  };
}

async function resolveCartDiscount(couponCode: string | null, subtotalCents: number) {
  if (!couponCode || subtotalCents <= 0) return 0;
  try {
    const { discountCents } = await validateCouponForSubtotal(couponCode, subtotalCents);
    return discountCents;
  } catch {
    return 0;
  }
}

export const getCartView = cache(getCartViewUncached);

export async function addCartItem(input: {
  productId: string;
  productColorId?: string | null;
  productSizeId?: string | null;
  productAddonIds: string[];
  quantity: number;
}) {
  const cart = await findActiveCart(true);
  if (!cart) throw new AppError("Your cart could not be opened right now. Please try again.");

  const productColorId = input.productColorId ?? null;
  const productSizeId = input.productSizeId ?? null;
  const hasColor = Boolean(productColorId);
  const hasSize = Boolean(productSizeId);

  const product = await prisma.product.findFirst({
    where: { id: input.productId, active: true },
    include: {
      colors: {
        where: hasColor
          ? { id: productColorId!, active: true, color: { active: true } }
          : { active: true, color: { active: true } },
        include: { color: true }
      },
      sizes: {
        where: hasSize
          ? { id: productSizeId!, active: true, size: { active: true } }
          : { active: true, size: { active: true } },
        include: { size: true }
      },
      addons: {
        where: { id: { in: input.productAddonIds }, active: true },
        include: { addon: true }
      }
    }
  });

  if (!product) throw new AppError("This product is no longer available.");
  if (hasColor && product.colors.length !== 1) {
    throw new AppError("This product option is no longer available.");
  }
  if (!hasColor && product.colors.length > 0) {
    throw new AppError("This product has colors — please choose one.");
  }
  if (hasSize && product.sizes.length !== 1) {
    throw new AppError("This product size is no longer available.");
  }
  if (!hasSize && product.sizes.length > 0) {
    throw new AppError("This product comes in sizes — please choose one.");
  }

  if (input.productAddonIds.length !== product.addons.length) {
    throw new AppError("One or more selected add-ons are not available for this product.");
  }

  if (product.stockQuantity < input.quantity) {
    throw new AppError("We couldn't add that quantity. Please try a smaller amount.");
  }

  const color = product.colors[0] ?? null;

  const existingItems = await prisma.cartItem.findMany({
    where: {
      cartId: cart.id,
      productId: input.productId,
      productColorId,
      productSizeId
    },
    include: { addons: true }
  });

  const requestedSignature = cartItemSignature(
    input.productId,
    productColorId,
    input.productAddonIds,
    productSizeId
  );
  const existing = existingItems.find(
    (item) =>
      cartItemSignature(
        item.productId,
        item.productColorId,
        item.addons.map((addon) => addon.productAddonId),
        item.productSizeId
      ) === requestedSignature
  );

  if (existing) {
    return prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: { increment: input.quantity } }
    });
  }

  return prisma.cartItem.create({
    data: {
      cartId: cart.id,
      productId: input.productId,
      productColorId,
      productSizeId,
      quantity: input.quantity,
      displayImage: color
        ? getProductColorImageUrl(
            product.slug,
            color.color.nameEn ?? color.color.name,
            color.imageUrl || product.mainImage
          )
        : product.mainImage,
      addons: {
        create: input.productAddonIds.map((productAddonId) => ({
          productAddonId
        }))
      }
    }
  });
}

export async function updateCartItemQuantity(id: string, quantity: number) {
  const cart = await findActiveCart(false);
  if (!cart) throw new AppError("Your cart could not be found. Please try adding the item again.");

  const item = await prisma.cartItem.findFirst({
    where: { id, cartId: cart.id },
    include: { product: true }
  });
  if (!item) throw new AppError("Cart item not found.");
  if (item.product.stockQuantity < quantity) {
    throw new AppError("We couldn't update to that quantity. Please try a smaller amount.");
  }

  return prisma.cartItem.update({
    where: { id },
    data: { quantity }
  });
}

export async function removeCartItem(id: string) {
  const cart = await findActiveCart(false);
  if (!cart) throw new AppError("Your cart could not be found. Please try adding the item again.");
  await prisma.cartItem.deleteMany({ where: { id, cartId: cart.id } });
}

export async function setCartCoupon(code: string | null) {
  const cart = await findActiveCart(true);
  if (!cart) throw new AppError("Your cart could not be opened right now. Please try again.");

  if (code === null) {
    await prisma.cart.update({ where: { id: cart.id }, data: { couponCode: null } });
    return;
  }

  const view = await getCartView();
  if (view.items.length === 0) throw new AppError("Your cart is empty.");
  const { coupon } = await validateCouponForSubtotal(code, view.subtotalCents);
  await prisma.cart.update({ where: { id: cart.id }, data: { couponCode: coupon.code } });
}
