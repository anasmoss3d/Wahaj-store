import { Prisma } from "@prisma/client";
import { Search } from "lucide-react";
import { StorefrontFooter } from "@/components/storefront/footer";
import { StorefrontHeader } from "@/components/storefront/header";
import { ProductCard } from "@/components/storefront/product-card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { getDictionary } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = one(params.q)?.trim();
  const category = one(params.category);
  const color = one(params.color);
  const sort = one(params.sort) ?? "newest";
  const min = Number(one(params.min) || 0);
  const max = Number(one(params.max) || 0);

  const where: Prisma.ProductWhereInput = {
    active: true,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { sku: { contains: q, mode: "insensitive" } },
            { category: { name: { contains: q, mode: "insensitive" } } }
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

  const [products, categories, colors] = await Promise.all([
    prisma.product.findMany({ where, orderBy, take: 24 }),
    prisma.category.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    prisma.color.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] })
  ]);
  const dict = await getDictionary();

  return (
    <>
      <StorefrontHeader />
      <main className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[280px_1fr]">
        <aside className="h-fit rounded-md border border-concrete-100 bg-white p-5 shadow-soft">
          <h1 className="text-2xl font-bold text-concrete-900">{dict.products}</h1>
          <form className="mt-5 grid gap-4">
            <label className="grid gap-2 text-sm font-medium">
              {dict.search}
              <span className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-concrete-400" size={18} />
                <input
                  className="min-h-11 w-full rounded-md border border-concrete-200 ps-10"
                  defaultValue={q}
                  name="q"
                  placeholder={dict.searchPlaceholder}
                />
              </span>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              {dict.category}
              <select className="min-h-11 w-full min-w-0 rounded-md border border-concrete-200 bg-white px-3" defaultValue={category} name="category">
                <option value="">{dict.all}</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.slug}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              {dict.chooseColor}
              <select className="min-h-11 w-full min-w-0 rounded-md border border-concrete-200 bg-white px-3" defaultValue={color} name="color">
                <option value="">{dict.all}</option>
                {colors.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid min-w-0 gap-2 text-sm font-medium">
                {dict.minPrice}
                <input className="min-h-11 w-full min-w-0 rounded-md border border-concrete-200 px-3" defaultValue={min || ""} name="min" type="number" />
              </label>
              <label className="grid min-w-0 gap-2 text-sm font-medium">
                {dict.maxPrice}
                <input className="min-h-11 w-full min-w-0 rounded-md border border-concrete-200 px-3" defaultValue={max || ""} name="max" type="number" />
              </label>
            </div>
            <label className="grid gap-2 text-sm font-medium">
              {dict.sort}
              <select className="min-h-11 w-full min-w-0 rounded-md border border-concrete-200 bg-white px-3" defaultValue={sort} name="sort">
                <option value="newest">{dict.newest}</option>
                <option value="price-asc">{dict.priceLowHigh}</option>
                <option value="price-desc">{dict.priceHighLow}</option>
                <option value="popular">{dict.popular}</option>
              </select>
            </label>
            <label className="inline-flex items-center gap-2 text-sm font-medium">
              <input className="h-5 w-5 accent-wahaj-teal" defaultChecked={Boolean(one(params.featured))} name="featured" type="checkbox" value="1" />
              {dict.featured}
            </label>
            <Button type="submit">{dict.applyFilters}</Button>
          </form>
        </aside>
        <section>
          <div className="mb-5 flex items-center justify-between">
            <p className="text-sm text-concrete-500">
              {dict.products}: {products.length}
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
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
