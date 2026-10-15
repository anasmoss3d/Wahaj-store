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
      <main className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="text-4xl font-bold text-concrete-900">{dict.wishlist}</h1>
        {items.length === 0 ? (
          <div className="mt-8 rounded-md border border-concrete-100 bg-white p-8 text-center shadow-soft">
            <p className="text-concrete-600">{dict.yourCartEmpty}</p>
            <ButtonLink className="mt-5" href="/products">
              {dict.browseProducts}
            </ButtonLink>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
