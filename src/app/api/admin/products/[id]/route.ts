import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PERMISSIONS } from "@/lib/rbac";
import { assertSameOrigin } from "@/lib/security";
import { safeErrorMessage } from "@/lib/errors";
import { assertActiveColors, assertActiveSizes, resolveProductSlug, resolveProductSku } from "@/lib/product-utils";
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
    const current = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, slug: true, sku: true }
    });
    if (!current) {
      return NextResponse.json({ ok: false, message: "Product not found." }, { status: 404 });
    }
    await assertActiveColors(parsed.colors.map((color) => color.colorId));
    await assertActiveSizes(parsed.sizes.map((size) => size.sizeId));
    const slug = await resolveProductSlug({
      name: parsed.name,
      sku: parsed.sku,
      slug: parsed.slug,
      productSlug: current.slug,
      productId
    });
    const sku = await resolveProductSku({
      name: parsed.name,
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
    revalidatePath(`/products/${current.slug}`);
    revalidatePath("/admin/products");
    return NextResponse.json({ ok: true, productId: product.id });
  } catch (error) {
    if (error instanceof ZodError) {
      const issue = error.issues[0];
      return NextResponse.json(
        { ok: false, message: `Invalid ${issue.path.join(".") || "input"}: ${issue.message}` },
        { status: 400 }
      );
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { ok: false, message: "This slug or SKU is already in use." },
        { status: 400 }
      );
    }
    // Admin-only diagnostic: surface which database constraint or value broke
    // the save so the product form can show a useful message.
    const detail =
      error instanceof Prisma.PrismaClientKnownRequestError
        ? `${error.code} ${JSON.stringify(error.meta ?? {})}`
        : error instanceof Error
          ? `${error.name}: ${error.message.split("\n").slice(0, 3).join(" ")}`
          : String(error);
    return NextResponse.json(
      {
        ok: false,
        message: await safeErrorMessage(error, "Could not update product. Please try again."),
        detail
      },
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
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, slug: true, category: { select: { slug: true } } }
    });
    if (!product) {
      return NextResponse.json({ ok: false, message: "Product not found." }, { status: 404 });
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
    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath(`/products/${product.category.slug}`);
    revalidatePath("/admin/products");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: await safeErrorMessage(error, "Could not delete product. Please try again.") },
      { status: 400 }
    );
  }
}
