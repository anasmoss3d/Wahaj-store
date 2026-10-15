"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createOrderFromCart } from "@/lib/orders";
import { assertSameOrigin } from "@/lib/security";
import { saveUploadedImage, uploadLimitBytes } from "@/lib/files";
import { checkoutSchema } from "@/lib/validators";
import { getLocale } from "@/lib/i18n";
import type { ActionState } from "@/app/actions/auth";

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function isTechnicalError(error: unknown) {
  if (!(error instanceof Error)) return true;
  return /prisma|transaction|database|timeout|connection|expired|prepared statement|P1\d{3}|P2\d{3}/i.test(
    error.message
  );
}

const receiptMimes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export async function checkoutAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  let target = "";
  const locale = await getLocale();
  const genericMessage =
    locale === "ar"
      ? "حدث خطأ أثناء تأكيد الطلب. حاول مرة أخرى."
      : "Something went wrong while placing your order. Please try again.";

  try {
    await assertSameOrigin();
    const parsed = checkoutSchema.parse({
      customerName: formValue(formData, "customerName"),
      phone: formValue(formData, "phone"),
      whatsapp: formValue(formData, "whatsapp"),
      email: formValue(formData, "email"),
      governorate: formValue(formData, "governorate"),
      city: formValue(formData, "city"),
      fullAddress: formValue(formData, "fullAddress"),
      building: formValue(formData, "building"),
      notes: formValue(formData, "notes"),
      paymentMethod: formValue(formData, "paymentMethod") || "CASH_ON_DELIVERY"
    });

    let paymentReceiptUrl: string | null = null;
    if (parsed.paymentMethod === "INSTAPAY") {
      const receipt = formData.get("receipt");
      if (!(receipt instanceof File) || receipt.size === 0) {
        return {
          error:
            locale === "ar" ? "من فضلك ارفع صورة إيصال التحويل." : "Please upload the transfer receipt photo."
        };
      }
      if (!receiptMimes.has(receipt.type) || receipt.size > uploadLimitBytes()) {
        return {
          error:
            locale === "ar"
              ? "صورة الإيصال غير صالحة (JPG/PNG/WebP حتى 5MB)."
              : "Invalid receipt photo (JPG/PNG/WebP up to 5MB)."
        };
      }
      paymentReceiptUrl = await saveUploadedImage(receipt);
    }

    const { order, trackingToken } = await createOrderFromCart({ ...parsed, paymentReceiptUrl });
    target = `/orders/${order.orderNumber}?key=${encodeURIComponent(trackingToken)}`;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message ?? "Please check the checkout form." };
    }
    if (isTechnicalError(error)) return { error: genericMessage };
    return {
      error: error instanceof Error ? error.message : genericMessage
    };
  }

  redirect(target);
}
