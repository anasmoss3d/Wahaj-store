import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { AuthError, requireAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { safeErrorMessage } from "@/lib/errors";
import { getLocale } from "@/lib/i18n";
import {
  assertActiveColors,
  assertActiveSizes,
  buildProductWriteData,
  resolveProductSku,
  resolveProductSlug
} from "@/lib/product-utils";
import { PERMISSIONS } from "@/lib/rbac";
import { assertSameOrigin } from "@/lib/security";
import { adminProductSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const isArabic = (await getLocale()) === "ar";
  try {
    await assertSameOrigin(request.method);
    const admin = await requireAdminApi(PERMISSIONS.PRODUCTS_MANAGE);
    const parsed = adminProductSchema.parse(await request.json());
    await assertActiveColors(parsed.colors.map((color) => color.colorId));
    await assertActiveSizes(parsed.sizes.map((size) => size.sizeId));
    const slug = await resolveProductSlug({
      name: parsed.name,
      nameEn: parsed.nameEn,
      sku: parsed.sku,
      slug: parsed.slug
    });
    const sku = await resolveProductSku({ name: parsed.name, nameEn: parsed.nameEn, sku: parsed.sku });

    const product = await prisma.product.create({
      data: buildProductWriteData(parsed, { slug, sku })
    });

    await prisma.auditLog.create({
      data: {
        adminUserId: admin.id,
        action: "PRODUCT_CREATED",
        entityType: "Product",
        entityId: product.id,
        metadata: { sku: product.sku, basePrice: product.basePrice.toString() }
      }
    });

    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath(`/products/${product.slug}`);
    revalidatePath("/admin/products");
    return NextResponse.json({ ok: true, productId: product.id });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
    }
    if (error instanceof ZodError) {
      const issue = error.issues[0];
      return NextResponse.json(
        {
          ok: false,
          message: isArabic
            ? `قيمة غير صالحة (${issue.path.join(".") || "input"}): ${issue.message}`
            : `Invalid ${issue.path.join(".") || "input"}: ${issue.message}`
        },
        { status: 400 }
      );
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        {
          ok: false,
          message: isArabic
            ? "الرابط المختصر أو رمز SKU مستخدم بالفعل."
            : "This slug or SKU is already in use."
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        ok: false,
        message: await safeErrorMessage(
          error,
          isArabic
            ? "تعذر حفظ المنتج. حاول مرة أخرى."
            : "Could not save product. Please try again."
        )
      },
      { status: 400 }
    );
  }
}
