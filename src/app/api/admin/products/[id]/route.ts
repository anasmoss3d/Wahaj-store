import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { ZodError, z } from "zod";
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
import { adminProductSchema, idSchema } from "@/lib/validators";

const productArchiveSchema = z.object({
  active: z.boolean()
});

function revalidateProductRoutes(paths: Array<string | null | undefined>) {
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/admin/products");
  for (const path of new Set(paths)) {
    if (path) {
      revalidatePath(path);
    }
  }
}

type Params = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, { params }: Params) {
  const isArabic = (await getLocale()) === "ar";
  try {
    await assertSameOrigin(request.method);
    const admin = await requireAdminApi(PERMISSIONS.PRODUCTS_MANAGE);
    const { id } = await params;
    const productId = idSchema.parse(id);
    const parsed = adminProductSchema.parse(await request.json());
    const current = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, slug: true, sku: true }
    });
    if (!current) {
      return NextResponse.json(
        { ok: false, message: isArabic ? "المنتج غير موجود." : "Product not found." },
        { status: 404 }
      );
    }
    await assertActiveColors(parsed.colors.map((color) => color.colorId));
    await assertActiveSizes(parsed.sizes.map((size) => size.sizeId));
    const slug = await resolveProductSlug({
      name: parsed.name,
      nameEn: parsed.nameEn,
      sku: parsed.sku,
      slug: parsed.slug,
      productSlug: current.slug,
      productId
    });
    const sku = await resolveProductSku({
      name: parsed.name,
      nameEn: parsed.nameEn,
      sku: parsed.sku,
      currentSku: current.sku,
      productId
    });

    const product = await prisma.$transaction(async (tx) => {
      await tx.productImage.deleteMany({ where: { productId } });
      await tx.productColor.deleteMany({ where: { productId } });
      await tx.productSize.deleteMany({ where: { productId } });
      // Carts may still reference the old add-on rows (CartItemAddon has no
      // cascade), so detach them first or the delete below fails with P2003.
      const oldAddons = await tx.productAddon.findMany({
        where: { productId },
        select: { id: true }
      });
      if (oldAddons.length) {
        await tx.cartItemAddon.deleteMany({
          where: { productAddonId: { in: oldAddons.map((row) => row.id) } }
        });
      }
      await tx.productAddon.deleteMany({ where: { productId } });

      return tx.product.update({
        where: { id: productId },
        data: buildProductWriteData(parsed, { slug, sku })
      });
    });

    await prisma.auditLog.create({
      data: {
        adminUserId: admin.id,
        action: "PRODUCT_UPDATED",
        entityType: "Product",
        entityId: product.id,
        metadata: { sku: product.sku, basePrice: product.basePrice.toString() }
      }
    });

    revalidateProductRoutes([
      `/products/${product.slug}`,
      `/products/${current.slug}`,
      `/admin/products/${product.id}`
    ]);
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
            ? "تعذر تحديث المنتج. حاول مرة أخرى."
            : "Could not update product. Please try again."
        )
      },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const isArabic = (await getLocale()) === "ar";
  try {
    await assertSameOrigin(request.method);
    const admin = await requireAdminApi(PERMISSIONS.PRODUCTS_MANAGE);
    const { id } = await params;
    const productId = idSchema.parse(id);
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, slug: true, category: { select: { slug: true } } }
    });
    if (!product) {
      return NextResponse.json(
        { ok: false, message: isArabic ? "المنتج غير موجود." : "Product not found." },
        { status: 404 }
      );
    }
    // Remove in-progress copies of this product from live carts first.
    // Completed orders keep their snapshots (OrderItem stays on the order).
    await prisma.cartItem.deleteMany({ where: { productId } });
    await prisma.product.delete({ where: { id: productId } });
    await prisma.auditLog.create({
      data: {
        adminUserId: admin.id,
        action: "PRODUCT_DELETED",
        entityType: "Product",
        entityId: product.id
      }
    });
    revalidateProductRoutes([
      `/products/${product.category.slug}`,
      `/products/${product.slug}`,
      `/admin/products/${product.id}`
    ]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
    }
    return NextResponse.json(
      {
        ok: false,
        message: await safeErrorMessage(
          error,
          isArabic
            ? "تعذر حذف المنتج. حاول مرة أخرى."
            : "Could not delete product. Please try again."
        )
      },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const isArabic = (await getLocale()) === "ar";
  try {
    await assertSameOrigin(request.method);
    const admin = await requireAdminApi(PERMISSIONS.PRODUCTS_MANAGE);
    const { id } = await params;
    const productId = idSchema.parse(id);
    const { active } = productArchiveSchema.parse(await request.json());

    const existing = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        active: true,
        slug: true,
        category: { select: { slug: true } }
      }
    });

    if (!existing) {
      return NextResponse.json(
        { ok: false, message: isArabic ? "المنتج غير موجود." : "Product not found." },
        { status: 404 }
      );
    }

    if (existing.active !== active) {
      await prisma.$transaction(async (tx) => {
        await tx.product.update({
          where: { id: productId },
          data: { active }
        });
        await tx.auditLog.create({
          data: {
            adminUserId: admin.id,
            action: active ? "PRODUCT_ACTIVATED" : "PRODUCT_ARCHIVED",
            entityType: "Product",
            entityId: productId,
            metadata: { active }
          }
        });
      });
    }

    revalidateProductRoutes([
      `/products/${existing.slug}`,
      `/products/${existing.category.slug}`,
      `/admin/products/${existing.id}`
    ]);

    return NextResponse.json({ ok: true, id: productId, active });
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
    return NextResponse.json(
      {
        ok: false,
        message: await safeErrorMessage(
          error,
          isArabic
            ? "تعذر تحديث حالة المنتج. حاول مرة أخرى."
            : "Could not update product status. Please try again."
        )
      },
      { status: 400 }
    );
  }
}
