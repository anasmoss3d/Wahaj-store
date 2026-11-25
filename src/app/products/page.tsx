import Link from "next/link";
import { Prisma } from "@prisma/client";
import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";
import { StorefrontFooter } from "@/components/storefront/footer";
import { StorefrontHeader } from "@/components/storefront/header";
import { ProductCard } from "@/components/storefront/product-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db";
import { getDictionary, getLocale, pickLocalized, type Dictionary } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

interface FilterFields {
  dict: Dictionary;
  q: string;
  categoryValue: string;
  colorValue: string;
  min: number;
  max: number;
  sort: string;
  featured: boolean;
  categories: Array<{ id: string; slug: string; name: string }>;
  colors: Array<{ id: string; name: string }>;
}

function FilterFormFields({
  dict,
  q,
  categoryValue,
  colorValue,
  min,
  max,
  sort,
  featured,
  categories,
  colors
}: FilterFields) {
  return (
    <form className="grid gap-4">
      <label className="grid gap-2 text-sm font-medium text-[#1C1917]">
        {dict.search}
        <span className="relative">
          <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 text-[#8C827A]" size={16} />
          <input
            className="min-h-11 w-full rounded-xl border border-[#DED7CB] bg-white ps-10 pe-4 text-sm text-[#1C1917] outline-none transition-all placeholder:text-[#A8A29E] focus:border-[#B85A2D] focus:ring-2 focus:ring-[#B85A2D]/20"
            defaultValue={q}
            name="q"
            placeholder={dict.searchPlaceholder}
          />
        </span>
      </label>
      <label className="grid gap-2 text-sm font-medium text-[#1C1917]">
        {dict.category}
        <select className="min-h-11 w-full min-w-0 rounded-xl border border-[#DED7CB] bg-white px-4 text-sm text-[#1C1917] outline-none transition-all focus:border-[#B85A2D] focus:ring-2 focus:ring-[#B85A2D]/20" defaultValue={categoryValue} name="category">
          <option value="">{dict.all}</option>
          {categories.map((item) => (
            <option key={item.id} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-medium text-[#1C1917]">
        {dict.chooseColor}
        <select className="min-h-11 w-full min-w-0 rounded-xl border border-[#DED7CB] bg-white px-4 text-sm text-[#1C1917] outline-none transition-all focus:border-[#B85A2D] focus:ring-2 focus:ring-[#B85A2D]/20" defaultValue={colorValue} name="color">
          <option value="">{dict.all}</option>
          {colors.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="grid min-w-0 gap-2 text-sm font-medium text-[#1C1917]">
          {dict.minPrice}
          <input className="min-h-11 w-full min-w-0 rounded-xl border border-[#DED7CB] bg-white px-3.5 text-sm text-[#1C1917] outline-none transition-all focus:border-[#B85A2D] focus:ring-2 focus:ring-[#B85A2D]/20" defaultValue={min || ""} name="min" type="number" />
        </label>
        <label className="grid min-w-0 gap-2 text-sm font-medium text-[#1C1917]">
          {dict.maxPrice}
          <input className="min-h-11 w-full min-w-0 rounded-xl border border-[#DED7CB] bg-white px-3.5 text-sm text-[#1C1917] outline-none transition-all focus:border-[#B85A2D] focus:ring-2 focus:ring-[#B85A2D]/20" defaultValue={max || ""} name="max" type="number" />
        </label>
      </div>
      <label className="grid gap-2 text-sm font-medium text-[#1C1917]">
        {dict.sort}
        <select className="min-h-11 w-full min-w-0 rounded-xl border border-[#DED7CB] bg-white px-4 text-sm text-[#1C1917] outline-none transition-all focus:border-[#B85A2D] focus:ring-2 focus:ring-[#B85A2D]/20" defaultValue={sort} name="sort">
          <option value="newest">{dict.newest}</option>
          <option value="price-asc">{dict.priceLowHigh}</option>
          <option value="price-desc">{dict.priceHighLow}</option>
          <option value="popular">{dict.popular}</option>
        </select>
      </label>
      <label className="inline-flex items-center gap-2.5 text-sm font-medium text-[#1C1917]">
        <input className="h-5 w-5 rounded accent-[#B85A2D]" defaultChecked={featured} name="featured" type="checkbox" value="1" />
        {dict.featured}
      </label>
      <Button type="submit" className="w-full">{dict.applyFilters}</Button>
    </form>
  );
}

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = one(params.q)?.trim();
  const category = one(params.category);
  const color = one(params.color);
  const sort = one(params.sort) ?? "newest";
  const min = Number(one(params.min) || 0);
  const max = Number(params.max) || 0;

  const where: Prisma.ProductWhereInput = {
    active: true,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { nameEn: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { descriptionEn: { contains: q, mode: "insensitive" } },
            { sku: { contains: q, mode: "insensitive" } },
            { category: { name: { contains: q, mode: "insensitive" } } },
            { category: { nameEn: { contains: q, mode: "insensitive" } } }
          ]
        }
      : {}),
    ...(category ? { category: { slug: category } } : {}),
    ...(color ? { colors: { some: { colorId: color, active: true } } } : {}),
    ...(min || max
      ? {
          basePrice: {
            ...(min ? { gte: new Prisma.Decimal(min) } : {}),
            ...(max ? { lte: new Prisma.Decimal(max) } : {})
          }
        }
      : {}),
    ...(one(params.featured) ? { featured: true } : {})
  };

  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    sort === "price-asc"
      ? [{ basePrice: "asc" }]
      : sort === "price-desc"
        ? [{ basePrice: "desc" }]
        : sort === "popular"
          ? [{ bestSeller: "desc" }, { sortOrder: "asc" }]
          : [{ createdAt: "desc" }];

  const [products, categories, colors, dict, locale] = await Promise.all([
    prisma.product.findMany({ where, orderBy, take: 24 }),
    prisma.category.findMany({
      where: { active: true, products: { some: { active: true } } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
    }),
    prisma.color.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    getDictionary(),
    getLocale()
  ]);

  const localizedCategories = categories.map((item) => ({
    id: item.id,
    slug: item.slug,
    name: pickLocalized(locale, item.name, item.nameEn)
  }));

  const fields: FilterFields = {
    dict,
    q: q ?? "",
    categoryValue: category ?? "",
    colorValue: color ?? "",
    min,
    max,
    sort,
    featured: Boolean(one(params.featured)),
    categories: localizedCategories,
    colors: colors.map((item) => ({ id: item.id, name: pickLocalized(locale, item.name, item.nameEn) }))
  };

  return (
    <>
      <StorefrontHeader />
      <main className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:px-12 py-10 sm:py-14 lg:grid-cols-[290px_1fr]">
        <aside className="h-fit lg:sticky lg:top-24">
          {/* Mobile: collapsible filter details */}
          <details className="group rounded-2xl border border-[#E5DDD0] bg-white shadow-[0_16px_38px_-18px_rgba(28,25,23,0.08)] lg:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between p-4 font-medium text-[#1C1917] [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-2">
                <SlidersHorizontal size={17} className="text-[#B85A2D]" />
                <span>{dict.applyFilters}</span>
              </span>
              <ChevronDown size={18} className="text-[#8C827A] transition-transform group-open:rotate-180" />
            </summary>
            <div className="border-t border-[#EDE8E0] p-4 pt-5">
              <FilterFormFields {...fields} />
            </div>
          </details>

          {/* Desktop: always-open sidebar Card */}
          <Card className="hidden lg:block border-[#E5DDD0] bg-white">
            <CardContent className="p-6">
              <h1 className="font-editorial text-2xl font-black text-[#1C1917]">{dict.products}</h1>
              <div className="mt-5">
                <FilterFormFields {...fields} />
              </div>
            </CardContent>
          </Card>
        </aside>

        <section>
          {/* Category Horizontal Filter Pills */}
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-3 mb-4">
            <Link
              href="/products"
              className={cn(
                "inline-flex shrink-0 items-center rounded-full px-5 py-2 text-xs font-medium transition-all duration-300",
                !category
                  ? "bg-[#1C1917] text-white shadow-sm"
                  : "bg-white/80 border border-[#DDD5C7] text-[#665E57] hover:bg-white hover:text-[#1C1917] hover:border-[#B85A2D]"
              )}
            >
              {dict.all || "الكل"}
            </Link>
            {localizedCategories.map((cat) => {
              const isActive = category === cat.slug;
              return (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.slug}`}
                  className={cn(
                    "inline-flex shrink-0 items-center rounded-full px-5 py-2 text-xs font-medium transition-all duration-300",
                    isActive
                      ? "bg-[#1C1917] text-white shadow-sm"
                      : "bg-white/80 border border-[#DDD5C7] text-[#665E57] hover:bg-white hover:text-[#1C1917] hover:border-[#B85A2D]"
                  )}
                >
                  {cat.name}
                </Link>
              );
            })}
          </div>

          <div className="mb-5 flex items-center justify-between">
            <p className="text-xs sm:text-sm font-light text-[#78716C]">
              {dict.products}: <span className="font-bold text-[#1C1917]">{products.length}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:gap-6 xl:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      </main>
      <StorefrontFooter />
    </>
  );
}
