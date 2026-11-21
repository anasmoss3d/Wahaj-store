import Image from "next/image";
import type { Product } from "@prisma/client";
import { ButtonLink } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";
import { getDictionary } from "@/lib/i18n";
import { getProductMainImageUrl } from "@/lib/product-images";

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
            src={getProductMainImageUrl(product.slug, product.mainImage)}
          />
        </div>
      </a>
      <div className="grid gap-3 p-3 sm:p-4">
        <div>
          <p className="text-xs text-concrete-500 sm:text-sm">{product.sku}</p>
          <h3 className="mt-1 text-base font-semibold text-concrete-900 sm:text-lg">{product.name}</h3>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="font-bold text-wahaj-teal">{formatMoney(product.basePrice)}</span>
          <ButtonLink className="px-3 text-xs sm:px-4 sm:text-sm" href={`/products/${product.slug}`} variant="ghost">
            {dict.customize}
          </ButtonLink>
        </div>
      </div>
    </article>
  );
}
