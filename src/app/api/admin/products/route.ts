import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PERMISSIONS } from "@/lib/rbac";
import { assertSameOrigin } from "@/lib/security";
import { safeErrorMessage } from "@/lib/errors";
import { assertActiveColors, assertActiveSizes, resolveProductSlug, resolveProductSku } from "@/lib/product-utils";
import { adminProductSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    await assertSameOrigin(request.method);
    const admin = await requireAdmin(PERMISSIONS.PRODUCTS_MANAGE);
    const parsed = adminProductSchema.parse(await request.json());
    await assertActiveColors(parsed.colors.map((color) => color.colorId));
    await assertActiveSizes(parsed.sizes.map((size) => size.sizeId));
    const slug = await resolveProductSlug({
      name: parsed.name,
      sku: parsed.sku,
      slug: parsed.slug
    });
    const sku = await resolveProductSku({ name: parsed.name, sku: parsed.sku });

    const product = await prisma.product.create({
      data: {
        name: parsed.name,
        slug,
        description: parsed.description,
        basePrice: new Prisma.Decimal(parsed.basePrice),
        categoryId: parsed.categoryId,
        mainImage: parsed.mainImage,
        sku,
        stockQuantity: parsed.stockQuantity,
        active: parsed.active,
        featured: parsed.featured,
        bestSeller: parsed.bestSeller,
        sortOrder: parsed.sortOrder,
        seoTitle: parsed.seoTitle || null,
        metaDescription: parsed.metaDescription || null,
        canonicalUrl: parsed.canonicalUrl || null,
        images: {
          create: parsed.gallery.map((image) => ({
            url: image.url,
            alt: image.alt,
            sortOrder: image.sortOrder
          }))
        },
        colors: {
          create: parsed.colors.map((color) => ({
            colorId: color.colorId,
            additionalPrice: new Prisma.Decimal(color.additionalPrice),
            imageUrl: color.imageUrl,
            active: color.active,
            sortOrder: color.sortOrder
          }))
        },
        sizes: {
          create: parsed.sizes.map((size) => ({
            sizeId: size.sizeId,
            price: new Prisma.Decimal(size.price),
            active: size.active,
            sortOrder: size.sortOrder
          }))
        },
        addons: {
          create: parsed.addonIds.map((addonId, index) => ({
            addonId,
            sortOrder: index,
            active: true
          }))
        }
      }
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
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { ok: false, message: "This slug or SKU is already in use." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { ok: false, message: await safeErrorMessage(error, "Could not save product. Please try again.") },
      { status: 400 }
    );
  }
}
