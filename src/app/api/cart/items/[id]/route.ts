import { NextResponse } from "next/server";
import { removeCartItem, updateCartItemQuantity } from "@/lib/cart";
import { assertSameOrigin } from "@/lib/security";
import { cartQuantitySchema, idSchema } from "@/lib/validators";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: Params) {
  try {
    await assertSameOrigin(request.method);
    const { id } = await params;
    const itemId = idSchema.parse(id);
    const parsed = cartQuantitySchema.parse(await request.json());
    await updateCartItemQuantity(itemId, parsed.quantity);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Could not update item." },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    await assertSameOrigin(request.method);
    const { id } = await params;
    await removeCartItem(idSchema.parse(id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Could not remove item." },
      { status: 400 }
    );
  }
}
