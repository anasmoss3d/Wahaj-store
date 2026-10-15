import { prisma } from "@/lib/db";
import { getStoreSettings } from "@/lib/settings";

export type OrderNotificationItem = {
  productName: string;
  quantity: number;
  colorName: string;
  addons: string[];
  total: string;
};

export type OrderNotification = {
  orderId: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  governorate: string;
  city: string;
  fullAddress: string;
  paymentMethod: string;
  paymentReceiptUrl: string | null;
  couponCode: string | null;
  subtotal: string;
  discountTotal: string;
  shippingCost: string;
  grandTotal: string;
  createdAt: Date;
  items: OrderNotificationItem[];
};

export function buildTelegramOrderMessage(order: OrderNotification, adminBaseUrl: string) {
  const lines = [
    "🧾 *طلب جديد — وهج*",
    `🔢 الرقم: \`${order.orderNumber}\``,
    `👤 ${order.customerName} — \`${order.phone}\``,
    `📍 ${order.governorate}، ${order.city}`,
    `🏠 ${order.fullAddress}`,
    "",
    ...order.items.flatMap((item) => [
      `▪️ ${item.productName} × ${item.quantity} — ${item.colorName}`,
      ...(item.addons.length ? [`   ➕ ${item.addons.join("، ")}`] : []),
      `   💰 ${item.total} جنيه`
    ]),
    "",
    `المجموع الفرعي: ${order.subtotal}`,
    ...(Number(order.discountTotal) > 0
      ? [`الخصم${order.couponCode ? ` (${order.couponCode})` : ""}: -${order.discountTotal}`]
      : []),
    `الشحن: ${order.shippingCost}`,
    `*الإجمالي: ${order.grandTotal} جنيه*`,
    `الدفع: ${order.paymentMethod === "INSTAPAY" ? "انستاباي (مدفوع مقدماً)" : "كاش عند الاستلام"}`,
    ...(order.paymentReceiptUrl ? ["🧾 صورة الوصل مرفوعة — شوفها من صفحة الطلب"] : []),
    "",
    `🔗 ${adminBaseUrl}/admin/orders/${order.orderId}`
  ];
  return lines.join("\n");
}

export async function notifyTelegramNewOrder(order: OrderNotification) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const [{ telegramChatId }, appUrl] = [
    await getStoreSettings(),
    process.env.APP_URL || "https://wahaj-store-flame.vercel.app"
  ];
  if (!token || !telegramChatId) return { sent: false, reason: "not-configured" as const };

  const text = buildTelegramOrderMessage(order, appUrl);
  try {
    const send = (body: Record<string, unknown>) =>
      fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(8000)
      });
    const response = await send({ chat_id: telegramChatId, text, parse_mode: "Markdown" });
    const ok = response.ok;
    if (ok && order.paymentReceiptUrl?.startsWith("http")) {
      // Best effort: deliver the receipt photo itself so the owner can
      // verify the payment right inside Telegram.
      try {
        await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: telegramChatId,
            photo: order.paymentReceiptUrl,
            caption: `🧾 وصل ${order.orderNumber} — ${order.grandTotal} جنيه`
          }),
          signal: AbortSignal.timeout(15000)
        });
      } catch {
        // Photo delivery is a bonus; the text alert already arrived.
      }
    }
    await prisma.notificationEvent.create({
      data: {
        orderId: order.orderId,
        channel: "TELEGRAM",
        type: "ORDER_PLACED",
        status: ok ? "SENT" : "FAILED",
        payload: { orderNumber: order.orderNumber }
      }
    });
    return { sent: ok, reason: ok ? ("sent" as const) : ("telegram-error" as const) };
  } catch {
    await prisma.notificationEvent.create({
      data: {
        orderId: order.orderId,
        channel: "TELEGRAM",
        type: "ORDER_PLACED",
        status: "FAILED",
        payload: { orderNumber: order.orderNumber }
      }
    });
    return { sent: false, reason: "network-error" as const };
  }
}
