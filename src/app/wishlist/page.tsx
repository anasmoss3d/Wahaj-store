import { redirect } from "next/navigation";
import { StorefrontFooter } from "@/components/storefront/footer";
import { StorefrontHeader } from "@/components/storefront/header";
import { ProductCard } from "@/components/storefront/product-card";
import { ButtonLink } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getDictionary } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const [user, dict] = await Promise.all([getCurrentUser(), getDictionary()]);
  if (!user) redirect("/auth/login");

  const items = await prisma.wishlistItem.findMany({
    where: { userId: user.id },
    include: { product: true },
    orderBy: { createdAt: "desc" }
  });

  return (
    <>
      <StorefrontHeader />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12 py-10 sm:py-14">
        <h1 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-black text-[#1C1917]">{dict.wishlist}</h1>
        {items.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-[#E5DDD0] bg-white p-10 text-center shadow-[0_16px_38px_-18px_rgba(28,25,23,0.08)]">
            <p className="text-sm sm:text-base text-[#665E57] font-light">{dict.yourCartEmpty}</p>
            <ButtonLink className="mt-6" href="/products">
              {dict.browseProducts}
            </ButtonLink>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {items.map((item) => (
              <ProductCard key={item.id} product={item.product} />
            ))}
          </div>
        )}
      </main>
      <StorefrontFooter />
    </>
  );
}
