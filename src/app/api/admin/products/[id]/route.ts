import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PERMISSIONS } from "@/lib/rbac";
import { assertSameOrigin } from "@/lib/security";
import { adminProductSchema, idSchema } from "@/lib/validators";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, { params }: Params) {
  try {
    await assertSameOrigin(request.method);
    const admin = await requireAdmin(PERMISSIONS.PRODUCTS_MANAGE);
    const { id } = await params;
    const productId = idSchema.parse(id);
    const parsed = adminProductSchema.parse(await request.json());

    const product = await prisma.$transaction(async (tx) => {
      await Promise.all([
        tx.productImage.deleteMany({ where: { productId } }),
        tx.productColor.deleteMany({ where: { productId } }),
        tx.productAddon.deleteMany({ where: { productId } }),
      ]);

      return tx.product.update({
        where: { id: productId },
        data: {
          name: parsed.name,
          slug: parsed.slug,
          description: parsed.description,
          basePrice: new Prisma.Decimal(parsed.basePrice),
          categoryId: parsed.categoryId,
          mainImage: parsed.mainImage,
          sku: parsed.sku,
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
          addons: {
            create: parsed.addonIds.map((addonId, index) => ({
              addonId,
              sortOrder: index,
              active: true
            }))
          }
        }
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

    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath(`/products/${product.slug}`);
    revalidatePath("/admin/products");
    return NextResponse.json({ ok: true, productId: product.id });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Could not update product." },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    await assertSameOrigin(request.method);
    const admin = await requireAdmin(PERMISSIONS.PRODUCTS_MANAGE);
    const { id } = await params;
    const productId = idSchema.parse(id);
    const product = await prisma.product.update({
      where: { id: productId },
      data: { active: false }
    });
    await prisma.auditLog.create({
      data: {
        adminUserId: admin.id,
        action: "PRODUCT_DEACTIVATED",
        entityType: "Product",
        entityId: product.id
      }
    });
    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/admin/products");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Could not delete product." },
      { status: 400 }
    );
  }
}
