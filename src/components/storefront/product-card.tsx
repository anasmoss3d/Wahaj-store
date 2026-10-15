import Image from "next/image";
import type { Product } from "@prisma/client";
import { ButtonLink } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";
import { getDictionary } from "@/lib/i18n";

export async function ProductCard({ product }: { product: Product }) {
  const dict = await getDictionary();
  return (
    <article className="group overflow-hidden rounded-md border border-concrete-100 bg-white shadow-soft">
      <a className="block" href={`/products/${product.slug}`}>
        <div className="relative aspect-[4/5] overflow-hidden bg-concrete-100">
          <Image
            alt={product.name}
            className="object-cover transition duration-500 group-hover:scale-105"
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            src={product.mainImage}
          />
        </div>
      </a>
      <div className="grid gap-3 p-4">
        <div>
          <p className="text-sm text-concrete-500">{product.sku}</p>
          <h3 className="mt-1 text-lg font-semibold text-concrete-900">{product.name}</h3>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="font-bold text-wahaj-teal">{formatMoney(product.basePrice)}</span>
          <ButtonLink href={`/products/${product.slug}`} variant="ghost">
            {dict.customize}
          </ButtonLink>
        </div>
      </div>
    </article>
  );
}
