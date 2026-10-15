import { Prisma } from "@prisma/client";
import { cache } from "react";
import { getCurrentUser } from "@/lib/auth";
import { validateCouponForSubtotal } from "@/lib/coupons";
import { prisma } from "@/lib/db";
import { calculateLinePrice, cartItemSignature } from "@/lib/pricing";
import { getOrCreateCartSessionId, readCookie, CART_COOKIE } from "@/lib/sessions";

export type CartViewItem = {
  id: string;
  productId: string;
  productName: string;
  slug: string;
  sku: string;
  image: string;
  colorName: string;
  colorHex: string;
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
    where: { sessionId, status: "ACTIVE" },
    orderBy: { updatedAt: "desc" }
  });

  if (sessionCart) return sessionCart;
  if (!create) return null;

  return prisma.cart.create({
    data: { userId: user?.id ?? null, sessionId }
  });
}

async function getCartViewUncached(): Promise<CartView> {
  const cart = await findActiveCart(false);
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
      colorAdditionalPrice: row.productColor.additionalPrice,
      addonPrices: addonModels.map((addon) => addon.price),
      quantity: row.quantity
    });
    subtotalCents += calculated.totalCents;
    count += row.quantity;

    return {
      id: row.id,
      productId: row.productId,
      productName: row.product.name,
      slug: row.product.slug,
      sku: row.product.sku,
      image: row.productColor.imageUrl || row.product.mainImage,
      colorName: row.productColor.color.name,
      colorHex: row.productColor.color.hexCode,
      addons: addonModels.map((addon) => ({
        id: addon.id,
        name: addon.name,
        price: addon.price
      })),
      quantity: row.quantity,
      unitPrice: calculated.unitPrice,
      total: calculated.total,
      signature: cartItemSignature(
        row.productId,
        row.productColorId,
        row.addons.map((entry) => entry.productAddonId)
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
  productColorId: string;
  productAddonIds: string[];
  quantity: number;
}) {
  const cart = await findActiveCart(true);
  if (!cart) throw new Error("Could not create cart.");

  const product = await prisma.product.findFirst({
    where: { id: input.productId, active: true },
    include: {
      colors: {
        where: { id: input.productColorId, active: true },
        include: { color: true }
      },
      addons: {
        where: { id: { in: input.productAddonIds }, active: true },
        include: { addon: true }
      }
    }
  });

  if (!product || product.colors.length !== 1) {
    throw new Error("This product option is no longer available.");
  }

  if (input.productAddonIds.length !== product.addons.length) {
    throw new Error("One or more selected add-ons are not available for this product.");
  }

  if (product.stockQuantity < input.quantity) {
    throw new Error("Selected quantity is not available in stock.");
  }

  const existingItems = await prisma.cartItem.findMany({
    where: {
      cartId: cart.id,
      productId: input.productId,
      productColorId: input.productColorId
    },
    include: { addons: true }
  });

  const requestedSignature = cartItemSignature(
    input.productId,
    input.productColorId,
    input.productAddonIds
  );
  const existing = existingItems.find(
    (item) =>
      cartItemSignature(
        item.productId,
        item.productColorId,
        item.addons.map((addon) => addon.productAddonId)
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
      productColorId: input.productColorId,
      quantity: input.quantity,
      displayImage: product.colors[0].imageUrl,
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
  if (!cart) throw new Error("Cart not found.");

  const item = await prisma.cartItem.findFirst({
    where: { id, cartId: cart.id },
    include: { product: true }
  });
  if (!item) throw new Error("Cart item not found.");
  if (item.product.stockQuantity < quantity) {
    throw new Error("Selected quantity is not available in stock.");
  }

  return prisma.cartItem.update({
    where: { id },
    data: { quantity }
  });
}

export async function removeCartItem(id: string) {
  const cart = await findActiveCart(false);
  if (!cart) throw new Error("Cart not found.");
  await prisma.cartItem.deleteMany({ where: { id, cartId: cart.id } });
}

export async function setCartCoupon(code: string | null) {
  const cart = await findActiveCart(true);
  if (!cart) throw new Error("Could not create cart.");

  if (code === null) {
    await prisma.cart.update({ where: { id: cart.id }, data: { couponCode: null } });
    return;
  }

  const view = await getCartView();
  if (view.items.length === 0) throw new Error("Your cart is empty.");
  const { coupon } = await validateCouponForSubtotal(code, view.subtotalCents);
  await prisma.cart.update({ where: { id: cart.id }, data: { couponCode: coupon.code } });
}
