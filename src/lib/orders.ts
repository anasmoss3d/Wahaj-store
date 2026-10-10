import { OrderStatus, Prisma } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { centsToDecimal, toCents } from "@/lib/money";
import { calculateLinePrice, canMoveOrderStatus } from "@/lib/pricing";
import { CART_COOKIE, hashToken, readCookie } from "@/lib/sessions";
import { getStoreSettings } from "@/lib/settings";

export function createTrackingToken() {
  return randomBytes(24).toString("base64url");
}

export async function nextOrderNumber(tx: Prisma.TransactionClient = prisma) {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const prefix = `WAH-${y}${m}${d}`;
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
}) {
  const user = await getCurrentUser();
  const cartSessionId = await readCookie(CART_COOKIE);
  const settings = await getStoreSettings();
  const trackingToken = createTrackingToken();

  if (!user && !cartSessionId) {
    throw new Error("Your cart is empty.");
  }

  const cartOwnershipWhere = user
    ? [{ userId: user.id }, ...(cartSessionId ? [{ sessionId: cartSessionId }] : [])]
    : [{ sessionId: cartSessionId! }];

  const result = await prisma.$transaction(async (tx) => {
    const cart = await tx.cart.findFirst({
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

    const shippingCents = toCents(String(settings.shippingFlatRate));
    const grandTotalCents = subtotalCents + shippingCents;
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
        subtotal: centsToDecimal(subtotalCents),
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
      await tx.product.update({
        where: { id: item.productId },
        data: { stockQuantity: { decrement: item.quantity } }
      });
    }

    await tx.cart.update({
      where: { id: cart.id },
      data: { status: "ORDERED" }
    });

    return order;
  });

  return { order: result, trackingToken };
}

export async function getOrderForViewer(orderNumber: string, key?: string | null) {
  const user = await getCurrentUser();
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
