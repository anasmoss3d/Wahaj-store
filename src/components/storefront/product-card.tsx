import Image from "next/image";
import type { Product } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/money";
import { getDictionary, getLocale, pickLocalized } from "@/lib/i18n";
import { getProductMainImageUrl } from "@/lib/product-images";

export async function ProductCard({
  product,
  className
}: {
  product: Product;
  className?: string;
}) {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  const productName = pickLocalized(locale, product.name, product.nameEn);
  return (
    <Card className={`group flex h-full flex-col justify-between overflow-hidden border-[#E5DDD0] bg-white transition-all duration-500 hover:shadow-[0_18px_42px_-16px_rgba(28,25,23,0.14)] ${className || ""}`}>
      <div>
        <a className="block" href={`/products/${product.slug}`}>
          <div className="relative aspect-[5/4] overflow-hidden bg-[#EDE7DD]">
            {product.featured ? (
              <Badge variant="gold" className="absolute start-3 top-3 z-10 border-[#E5DDD0] bg-white/90 text-[#9E4A22] backdrop-blur-md">
                {dict.featured || "مميز"}
              </Badge>
            ) : null}
            <Image
              alt={productName}
              className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 85vw"
              src={getProductMainImageUrl(product.slug, product.mainImage)}
            />
          </div>
        </a>
        <div className="p-4 sm:p-5">
          <p className="text-[11px] text-[#8C827A] font-light">{product.sku}</p>
          <a href={`/products/${product.slug}`}>
            <span className="mt-1 block line-clamp-1 font-editorial text-base font-bold text-[#1C1917] transition-colors group-hover:text-[#B85A2D] sm:text-lg">
              {productName}
            </span>
          </a>
        </div>
      </div>
      <CardContent className="flex items-center justify-between gap-2 p-4 pt-0 sm:p-5 sm:pt-0">
        <span className="text-sm font-medium text-[#78716C] sm:text-base">
          {formatMoney(product.basePrice, "EGP", locale)}
        </span>
        <ButtonLink
          className="h-9 rounded-full px-4 text-xs"
          href={`/products/${product.slug}`}
          variant="outline"
        >
          {dict.customize}
        </ButtonLink>
      </CardContent>
    </Card>
  );
}
