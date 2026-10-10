"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createOrderFromCart } from "@/lib/orders";
import { assertSameOrigin } from "@/lib/security";
import { checkoutSchema } from "@/lib/validators";
import type { ActionState } from "@/app/actions/auth";

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function checkoutAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  let target = "";

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
      notes: formValue(formData, "notes")
    });

    const { order, trackingToken } = await createOrderFromCart(parsed);
    target = `/orders/${order.orderNumber}?key=${encodeURIComponent(trackingToken)}`;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message ?? "Please check the checkout form." };
    }
    return {
      error: error instanceof Error ? error.message : "Could not place order."
    };
  }

  redirect(target);
}
