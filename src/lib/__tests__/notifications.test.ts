import { describe, expect, it } from "vitest";
import { buildTelegramOrderMessage, type OrderNotification } from "@/lib/notifications";

const sample: OrderNotification = {
  orderId: "order123",
  orderNumber: "WAH-20261011-0001",
  customerName: "Test Customer",
  phone: "01012345678",
  governorate: "Cairo",
  city: "Maadi",
  fullAddress: "5 Test Road",
  paymentMethod: "INSTAPAY",
  paymentReceiptUrl: "https://example.com/receipt.jpg",
  couponCode: "WELCOME10",
  subtotal: "350.00",
  discountTotal: "35.00",
  shippingCost: "65.00",
  grandTotal: "380.00",
  createdAt: new Date(),
  items: [
    { productName: "Minimal Concrete Tray", quantity: 1, colorName: "Concrete Gray", addons: ["Gold Leaf"], total: "380.00" }
  ]
};

describe("telegram order message", () => {
  it("contains order, customer, items, totals, payment, and admin link", () => {
    const text = buildTelegramOrderMessage(sample, "https://shop.example.com");
    expect(text).toContain("WAH-20261011-0001");
    expect(text).toContain("Test Customer");
    expect(text).toContain("01012345678");
    expect(text).toContain("Minimal Concrete Tray");
    expect(text).toContain("Gold Leaf");
    expect(text).toContain("380.00");
    expect(text).toContain("انستاباي");
    expect(text).toContain("https://shop.example.com/admin/orders/order123");
  });

  it("mentions cash on delivery without receipt line", () => {
    const text = buildTelegramOrderMessage(
      { ...sample, paymentMethod: "CASH_ON_DELIVERY", paymentReceiptUrl: null, couponCode: null, discountTotal: "0.00" },
      "https://shop.example.com"
    );
    expect(text).toContain("كاش عند الاستلام");
    expect(text).not.toContain("الوصل");
  });
});
