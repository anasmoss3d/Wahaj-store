import { prisma } from "@/lib/db";
import { suggestProductSlug } from "@/lib/utils";

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
  return uniqueProductSlug(suggestProductSlug(input.name, input.sku), input.productId);
}
