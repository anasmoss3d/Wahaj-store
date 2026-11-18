import { NextResponse } from "next/server";
import { addCartItem } from "@/lib/cart";
import { safeErrorMessage } from "@/lib/errors";
import { assertSameOrigin } from "@/lib/security";
import { addToCartSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    await assertSameOrigin(request.method);
    const parsed = addToCartSchema.parse(await request.json());
    await addCartItem(parsed);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: await safeErrorMessage(error, "Could not add item. Please try again.") },
      { status: 400 }
    );
  }
}
