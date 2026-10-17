import { OrderStatus, Prisma } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { getCurrentUser } from "@/lib/auth";
import { validateCouponForSubtotal } from "@/lib/coupons";
import { prisma } from "@/lib/db";
import { cairoOrderDatePrefix } from "@/lib/datetime";
import { centsToDecimal, toCents } from "@/lib/money";
import { calculateLinePrice, canMoveOrderStatus } from "@/lib/pricing";
import { CART_COOKIE, hashToken, readCookie } from "@/lib/sessions";
import { notifyTelegramNewOrder } from "@/lib/notifications";
import { resolveShippingCents } from "@/lib/shipping";

export function createTrackingToken() {
  return randomBytes(24).toString("base64url");
}

export async function nextOrderNumber(tx: Prisma.TransactionClient = prisma) {
  const prefix = cairoOrderDatePrefix();
  const count = await tx.order.count({
    where: {
      orderNumber: {
        startsWith: prefix
      }
    }
  });
  return `${prefix}-${String(count + 1).padStart(4, "0")}`;
}

export async function createOrderFromCart(input: {
  customerName: string;
  phone: string;
  whatsapp?: string | null;
  email?: string | null;
  governorate: string;
  city: string;
  fullAddress: string;
  building?: string | null;
  notes?: string | null;
  paymentMethod?: "CASH_ON_DELIVERY" | "INSTAPAY";
  paymentReceiptUrl?: string | null;
}) {
  const user = await getCurrentUser();
  const cartSessionId = await readCookie(CART_COOKIE);
  const trackingToken = createTrackingToken();

  if (!user && !cartSessionId) {
    throw new Error("Your cart is empty.");
  }

  const paymentMethod = input.paymentMethod === "INSTAPAY" ? "INSTAPAY" : "CASH_ON_DELIVERY";
  if (paymentMethod === "INSTAPAY" && !input.paymentReceiptUrl) {
    throw new Error("Payment receipt is required for InstaPay orders.");
  }

  const cartOwnershipWhere = user
    ? [{ userId: user.id }, ...(cartSessionId ? [{ sessionId: cartSessionId }] : [])]
    : [{ sessionId: cartSessionId! }];

  // All slow reads and price calculations happen OUTSIDE the write transaction:
  // on serverless + pooled Postgres every query costs latency, and the default
  // 5s interactive-transaction timeout would otherwise expire mid-checkout.
  const cart = await prisma.cart.findFirst({
    where: {
      status: "ACTIVE",
      OR: cartOwnershipWhere
    },
    include: {
      items: {
        include: {
          product: true,
          productColor: { include: { color: true } },
          addons: {
            include: {
              productAddon: {
                include: { addon: true }
              }
            }
          }
        }
      }
    },
    orderBy: { updatedAt: "desc" }
  });

  if (!cart || cart.items.length === 0) {
    throw new Error("Your cart is empty.");
  }

  let subtotalCents = 0;
  const orderItems = cart.items.map((item) => {
    if (!item.product.active || !item.productColor.active) {
      throw new Error(`${item.product.name} is no longer available.`);
    }
    if (item.product.stockQuantity < item.quantity) {
      throw new Error(`${item.product.name} does not have enough stock.`);
    }

    const addons = item.addons.map((entry) => entry.productAddon.addon);
    const calculated = calculateLinePrice({
      basePrice: item.product.basePrice,
      colorAdditionalPrice: item.productColor.additionalPrice,
      addonPrices: addons.map((addon) => addon.price),
      quantity: item.quantity
    });
    subtotalCents += calculated.totalCents;

    return {
      item,
      addons,
      calculated
    };
  });

  let discountCents = 0;
  let appliedCouponCode: string | null = null;
  if (cart.couponCode) {
    const validated = await validateCouponForSubtotal(cart.couponCode, subtotalCents);
    discountCents = validated.discountCents;
    appliedCouponCode = validated.coupon.code;
  }

  const shippingCents = await resolveShippingCents(
    input.governorate,
    subtotalCents - discountCents
  );
  const grandTotalCents = subtotalCents - discountCents + shippingCents;

  // The write transaction stays short: create + guarded stock/coupon updates.
  const result = await prisma.$transaction(
    async (tx) => {
      const freshCart = await tx.cart.findUnique({ where: { id: cart.id } });
      if (!freshCart || freshCart.status !== "ACTIVE") {
        throw new Error("This cart was already ordered.");
      }

      const orderNumber = await nextOrderNumber(tx);

      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: user?.id ?? null,
          customerName: input.customerName,
          phone: input.phone,
          whatsapp: input.whatsapp || null,
          email: input.email || user?.email || null,
          governorate: input.governorate,
          city: input.city,
          fullAddress: input.fullAddress,
          building: input.building || null,
          notes: input.notes || null,
          paymentMethod,
          paymentReceiptUrl: input.paymentReceiptUrl || null,
          subtotal: centsToDecimal(subtotalCents),
          discountTotal: centsToDecimal(discountCents),
          couponCode: appliedCouponCode,
          shippingCost: centsToDecimal(shippingCents),
          grandTotal: centsToDecimal(grandTotalCents),
          trackingHash: hashToken(trackingToken),
          items: {
            create: orderItems.map(({ item, addons, calculated }) => ({
              productId: item.productId,
              productName: item.product.name,
              sku: item.product.sku,
              selectedColorName: item.productColor.color.name,
              selectedColorHex: item.productColor.color.hexCode,
              colorAdditionalPrice: item.productColor.additionalPrice,
              basePrice: item.product.basePrice,
              finalUnitPrice: calculated.unitPrice,
              quantity: item.quantity,
              total: calculated.total,
              imageUrl: item.productColor.imageUrl || item.product.mainImage,
              addons: {
                create: addons.map((addon) => ({
                  addonName: addon.name,
                  addonPrice: addon.price,
                  imageUrl: addon.imageUrl
                }))
              }
            }))
          },
          history: {
            create: {
              status: "PENDING",
              note: "Order placed"
            }
          },
          notifications: {
            create: {
              channel: "WHATSAPP",
              type: "ORDER_PLACED",
              status: "SKIPPED",
              payload: {
                reason: "WhatsApp Business API is intentionally not connected in v1."
              }
            }
          }
        }
      });

      for (const { item } of orderItems) {
        const stock = await tx.product.updateMany({
          where: { id: item.productId, stockQuantity: { gte: item.quantity } },
          data: { stockQuantity: { decrement: item.quantity } }
        });
        if (stock.count === 0) {
          throw new Error(`${item.product.name} does not have enough stock.`);
        }
      }

      if (appliedCouponCode) {
        // Re-validate inside the transaction so concurrent checkouts cannot
        // overspend a limited coupon.
        await validateCouponForSubtotal(appliedCouponCode, subtotalCents, tx);
        await tx.coupon.update({
          where: { code: appliedCouponCode },
          data: { usedCount: { increment: 1 } }
        });
      }

      await tx.cart.update({
        where: { id: cart.id },
        data: { status: "ORDERED" }
      });

      return order;
    },
    { timeout: 20000, maxWait: 10000 }
  );

  // Telegram alert for the store owner. Must never fail the checkout:
  // notifyTelegramNewOrder swallows its own errors and just records them.
  try {
    const full = await prisma.order.findUnique({
      where: { id: result.id },
      include: { items: { include: { addons: true } } }
    });
    if (full && full.items) {
      await notifyTelegramNewOrder({
        orderId: full.id,
        orderNumber: full.orderNumber,
        customerName: full.customerName,
        phone: full.phone,
        governorate: full.governorate,
        city: full.city,
        fullAddress: full.fullAddress,
        paymentMethod: full.paymentMethod,
        paymentReceiptUrl: full.paymentReceiptUrl,
        couponCode: full.couponCode,
        subtotal: full.subtotal.toString(),
        discountTotal: full.discountTotal.toString(),
        shippingCost: full.shippingCost.toString(),
        grandTotal: full.grandTotal.toString(),
        createdAt: full.createdAt,
        items: full.items.map((item) => ({
          productName: item.productName,
          quantity: item.quantity,
          colorName: item.selectedColorName,
          addons: item.addons.map((addon) => addon.addonName),
          total: item.total.toString()
        }))
      });
    }
  } catch {
    // Notification failures are recorded inside notifyTelegramNewOrder.
  }

  return { order: result, trackingToken };
}

function assertOrderEditable(status: OrderStatus) {
  if (status === "DELIVERED") {
    throw new Error("Delivered orders cannot be changed.");
  }
}

export async function updateOrderCustomer(input: {
  orderId: string;
  adminUserId: string;
  customerName: string;
  phone: string;
  whatsapp?: string | null;
  email?: string | null;
  governorate: string;
  city: string;
  fullAddress: string;
  building?: string | null;
  notes?: string | null;
  internalNotes?: string | null;
}) {
  const order = await prisma.order.findUnique({ where: { id: input.orderId } });
  if (!order) throw new Error("Order not found.");
  assertOrderEditable(order.status);

  const discountCents = toCents(order.discountTotal);
  const shippingCents = await resolveShippingCents(
    input.governorate,
    toCents(order.subtotal) - discountCents
  );

  return prisma.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: order.id },
      data: {
        customerName: input.customerName,
        phone: input.phone,
        whatsapp: input.whatsapp || null,
        email: input.email || null,
        governorate: input.governorate,
        city: input.city,
        fullAddress: input.fullAddress,
        building: input.building || null,
        notes: input.notes || null,
        internalNotes: input.internalNotes || null,
        shippingCost: centsToDecimal(shippingCents),
        grandTotal: centsToDecimal(toCents(order.subtotal) - discountCents + shippingCents)
      }
    });
    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: order.status,
        note: "Order details edited by admin",
        adminUserId: input.adminUserId
      }
    });
    await tx.auditLog.create({
      data: {
        adminUserId: input.adminUserId,
        action: "ORDER_CUSTOMER_UPDATED",
        entityType: "Order",
        entityId: order.id
      }
    });
    return updated;
  });
}

export async function updateOrderItemQuantity(input: {
  orderId: string;
  itemId: string;
  quantity: number;
  adminUserId: string;
}) {
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    include: { items: true }
  });
  if (!order) throw new Error("Order not found.");
  assertOrderEditable(order.status);

  const item = order.items.find((row) => row.id === input.itemId);
  if (!item) throw new Error("Order item not found.");
  if (input.quantity === item.quantity) return order;
  if (order.items.length === 1 && input.quantity === 0) {
    throw new Error("An order must keep at least one item. Delete the order instead.");
  }

  return prisma.$transaction(async (tx) => {
    if (input.quantity === 0) {
      await tx.orderItem.delete({ where: { id: item.id } });
      if (item.productId) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { increment: item.quantity } }
        });
      }
    } else {
      const diff = input.quantity - item.quantity;
      if (diff > 0 && item.productId) {
        const stock = await tx.product.updateMany({
          where: { id: item.productId, stockQuantity: { gte: diff } },
          data: { stockQuantity: { decrement: diff } }
        });
        if (stock.count === 0) {
          throw new Error(`${item.productName} does not have enough stock.`);
        }
      } else if (diff < 0 && item.productId) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { increment: -diff } }
        });
      }
      const unitCents = toCents(item.finalUnitPrice);
      await tx.orderItem.update({
        where: { id: item.id },
        data: {
          quantity: input.quantity,
          total: centsToDecimal(unitCents * input.quantity)
        }
      });
    }

    const remaining = await tx.orderItem.findMany({ where: { orderId: order.id } });
    const subtotalCents = remaining.reduce((sum, row) => sum + toCents(row.total), 0);
    const discountCents = toCents(order.discountTotal);
    const shippingCents = await resolveShippingCents(
      order.governorate,
      subtotalCents - discountCents
    );
    const updated = await tx.order.update({
      where: { id: order.id },
      data: {
        subtotal: centsToDecimal(subtotalCents),
        shippingCost: centsToDecimal(shippingCents),
        grandTotal: centsToDecimal(subtotalCents - discountCents + shippingCents)
      }
    });
    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: order.status,
        note: `Item ${item.productName} quantity changed ${item.quantity} to ${input.quantity}`,
        adminUserId: input.adminUserId
      }
    });
    await tx.auditLog.create({
      data: {
        adminUserId: input.adminUserId,
        action: "ORDER_ITEM_UPDATED",
        entityType: "Order",
        entityId: order.id,
        metadata: { itemId: item.id, from: item.quantity, to: input.quantity }
      }
    });
    return updated;
  });
}

export async function deleteOrder(input: { orderId: string; adminUserId: string }) {
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    include: { items: true }
  });
  if (!order) throw new Error("Order not found.");

  return prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      if (item.productId) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { increment: item.quantity } }
        });
      }
    }
    if (order.couponCode) {
      await tx.coupon.updateMany({
        where: { code: order.couponCode, usedCount: { gt: 0 } },
        data: { usedCount: { decrement: 1 } }
      });
    }
    await tx.order.delete({ where: { id: order.id } });
    await tx.auditLog.create({
      data: {
        adminUserId: input.adminUserId,
        action: "ORDER_DELETED",
        entityType: "Order",
        entityId: order.id,
        metadata: {
          orderNumber: order.orderNumber,
          grandTotal: order.grandTotal.toString(),
          status: order.status
        }
      }
    });
  });
}

export async function getOrderForViewer(orderNumber: string, key?: string | null) {  const user = await getCurrentUser();
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: { include: { addons: true } },
      history: { orderBy: { createdAt: "asc" } }
    }
  });

  if (!order) return null;
  if (user && order.userId === user.id) return order;
  if (key && hashToken(key) === order.trackingHash) return order;
  return null;
}

export async function updateOrderStatus(input: {
  orderId: string;
  status: OrderStatus;
  note?: string | null;
  adminUserId: string;
}) {
  const order = await prisma.order.findUnique({ where: { id: input.orderId } });
  if (!order) throw new Error("Order not found.");
  if (!canMoveOrderStatus(order.status, input.status)) {
    throw new Error("This status transition is not allowed.");
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: order.id },
      data: { status: input.status }
    });
    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: input.status,
        note: input.note || null,
        adminUserId: input.adminUserId
      }
    });
    await tx.auditLog.create({
      data: {
        adminUserId: input.adminUserId,
        action: "ORDER_STATUS_CHANGED",
        entityType: "Order",
        entityId: order.id,
        metadata: {
          from: order.status,
          to: input.status
        }
      }
    });
    return updated;
  });
}
