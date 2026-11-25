import { Prisma } from "@prisma/client";
import type { z } from "zod";
import { prisma } from "@/lib/db";
import { asciiSlug, SKU_SUGGESTED, skuStem, suggestProductSlug } from "@/lib/utils";
import type { adminProductSchema } from "@/lib/validators";

type ParsedAdminProduct = z.infer<typeof adminProductSchema>;

/** Builds the shared bilingual Prisma `create`/`update` payload for admin product mutations. */
export function buildProductWriteData(
  parsed: ParsedAdminProduct,
  resolved: { slug: string; sku: string }
) {
  return {
    name: parsed.name.trim(),
    nameEn: parsed.nameEn?.trim() || null,
    slug: resolved.slug,
    description: parsed.description.trim(),
    descriptionEn: parsed.descriptionEn?.trim() || null,
    basePrice: new Prisma.Decimal(parsed.basePrice),
    categoryId: parsed.categoryId,
    mainImage: parsed.mainImage,
    sku: resolved.sku,
    stockQuantity: parsed.stockQuantity,
    active: parsed.active,
    featured: parsed.featured,
    bestSeller: parsed.bestSeller,
    sortOrder: parsed.sortOrder,
    seoTitle: parsed.seoTitle?.trim() || null,
    seoTitleEn: parsed.seoTitleEn?.trim() || null,
    metaDescription: parsed.metaDescription?.trim() || null,
    metaDescriptionEn: parsed.metaDescriptionEn?.trim() || null,
    canonicalUrl: parsed.canonicalUrl?.trim() || null,
    images: {
      create: parsed.gallery.map((image) => ({
        url: image.url,
        alt: image.alt?.trim() || null,
        altEn: image.altEn?.trim() || null,
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
  };
}

/**
 * A product that lists a color the admin muted globally would silently
 * disappear from the storefront (and used to 404), so block the save with a
 * message the admin can act on.
 */
export async function assertActiveColors(colorIds: string[]) {
  if (colorIds.length === 0) return;
  const ids = [...new Set(colorIds)];
  const activeCount = await prisma.color.count({
    where: { id: { in: ids }, active: true }
  });
  if (activeCount !== ids.length) {
    throw new Error("One or more selected colors are inactive. Reactivate them or remove them.");
  }
}

/**
 * A product that lists a size the admin muted globally would silently
 * disappear from the storefront (and used to 404), so block the save with a
 * message the admin can act on.
 */
export async function assertActiveSizes(sizeIds: string[]) {
  if (sizeIds.length === 0) return;
  const ids = [...new Set(sizeIds)];
  const activeCount = await prisma.size.count({
    where: { id: { in: ids }, active: true }
  });
  if (activeCount !== ids.length) {
    throw new Error("One or more selected sizes are inactive. Reactivate them or remove them.");
  }
}

/**
 * Returns the base slug if it is free, otherwise appends -2, -3, ... until
 * unique (scoped to products other than `excludeId` when updating).
 */
export async function uniqueProductSlug(base: string, excludeId?: string) {
  let slug = base;
  let suffix = 2;
  while (
    await prisma.product.findFirst({
      where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true }
    })
  ) {
    slug = `${base}-${suffix++}`;
  }
  return slug;
}

/**
 * Server-side slug generation: trust an explicit, non-empty slug, otherwise
 * derive one from the name/SKU. Always made unique against the database.
 */
export async function resolveProductSlug(input: {
  name: string;
  nameEn?: string | null;
  sku: string;
  slug?: string | null;
  productSlug?: string | null;
  productId?: string;
}) {
  // On updates, an unchanged slug (equal to the saved one) is kept as-is.
  const requested = input.slug?.trim();
  if (requested && requested !== input.productSlug) {
    return uniqueProductSlug(requested, input.productId);
  }
  if (input.productSlug) {
    return input.productSlug;
  }
  // The placeholder SKU is not a real source for a slug (it would produce
  // "wah-auto" for Arabic names), so treat it as absent.
  const sku = input.sku && input.sku !== SKU_SUGGESTED ? input.sku : "";
  return uniqueProductSlug(suggestProductSlug(input.name, sku, input.nameEn), input.productId);
}

/**
 * Server-side SKU generation: the admin never types a SKU — it is generated
 * from the product name (e.g. "White Luxe Tray 40" -> WAH-WHITELUXETRAY4-###)
 * and made unique against the database. The existing SKU of a product is kept
 * unless it is still the untouched placeholder or the admin wrote a value
 * by hand.
 */
export async function resolveProductSku(input: {
  name: string;
  nameEn?: string | null;
  sku?: string | null;
  currentSku?: string | null;
  productId?: string;
}) {
  const current = input.currentSku?.trim();
  if (current && current !== SKU_SUGGESTED) {
    return current;
  }
  const stemSource = asciiSlug(input.name) ? input.name : (input.nameEn?.trim() || input.name);
  const base = `WAH-${skuStem(stemSource)}`;
  const others = await prisma.product.findMany({
    where: { sku: { startsWith: `${base}-` }, ...(input.productId ? { id: { not: input.productId } } : {}) },
    select: { sku: true }
  });
  const taken = new Set<number>();
  for (const row of others) {
    const suffix = Number(row.sku.slice(base.length + 1));
    if (Number.isInteger(suffix)) taken.add(suffix);
  }
  let counter = Math.max(100, ...[...taken].filter((n) => n < 1000));
  while (taken.has(counter) || counter > 999) counter++;
  return `${base}-${counter}`;
}
