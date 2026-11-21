import Image from "next/image";
import { Plus } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { DeleteProductButton } from "@/components/admin/delete-product-button";
import { ButtonLink } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { PERMISSIONS } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  await requireAdmin(PERMISSIONS.PRODUCTS_MANAGE);
  const products = await prisma.product.findMany({
    include: { category: true, colors: true, addons: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }]
  });

  return (
    <AdminShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-concrete-900">Products</h1>
          <p className="mt-2 text-concrete-600">Manage products, color images, add-ons, prices, and stock.</p>
        </div>
        <ButtonLink href="/admin/products/new">
          <Plus size={18} /> New product
        </ButtonLink>
      </div>
      {/* Mobile: product cards. */}
      <div className="mt-6 grid gap-3 md:hidden">
        {products.map((product) => (
          <article className="rounded-xl border border-concrete-100 bg-white p-4 shadow-soft" key={product.id}>
            <a className="flex items-center gap-3" href={`/admin/products/${product.id}`}>
              <Image
                alt=""
                className="h-16 w-16 shrink-0 rounded-lg object-cover"
                height={80}
                src={product.mainImage}
                width={80}
              />
              <span className="min-w-0">
                <span className="block truncate font-bold text-concrete-900">{product.name}</span>
                <span className="text-xs text-concrete-500">{product.sku}</span>
              </span>
            </a>
            <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-concrete-100 pt-3 text-sm">
              <div>
                <dt className="text-concrete-500">Category</dt>
                <dd className="font-semibold text-concrete-900">{product.category.name}</dd>
              </div>
              <div>
                <dt className="text-concrete-500">Price</dt>
                <dd className="font-semibold text-concrete-900">{formatMoney(product.basePrice)}</dd>
              </div>
              <div>
                <dt className="text-concrete-500">Stock</dt>
                <dd className="font-semibold text-concrete-900">{product.stockQuantity}</dd>
              </div>
              <div>
                <dt className="text-concrete-500">Options</dt>
                <dd className="text-concrete-600">
                  {product.colors.length} colors · {product.addons.length} add-ons
                </dd>
              </div>
            </dl>
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-concrete-100 pt-3">
              <span
                className={
                  product.active
                    ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                    : "rounded-full bg-concrete-100 px-3 py-1 text-xs font-semibold text-concrete-600"
                }
              >
                {product.active ? "Active" : "Inactive"}
              </span>
              <DeleteProductButton id={product.id} name={product.name} />
            </div>
          </article>
        ))}
      </div>
      {/* Desktop: table. */}
      <div className="mt-8 hidden overflow-x-auto rounded-xl border border-concrete-100 bg-white shadow-soft md:block">
        <table className="w-full min-w-[860px] text-start text-sm">
          <thead className="bg-concrete-50 text-concrete-500">
            <tr>
              <th className="p-4 text-start">Product</th>
              <th className="p-4 text-start">Category</th>
              <th className="p-4 text-start">Price</th>
              <th className="p-4 text-start">Stock</th>
              <th className="p-4 text-start">Options</th>
              <th className="p-4 text-start">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-concrete-100">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="p-4">
                  <a className="flex items-center gap-3" href={`/admin/products/${product.id}`}>
                    <Image
                      alt=""
                      className="h-14 w-14 rounded-md object-cover"
                      height={80}
                      src={product.mainImage}
                      width={80}
                    />
                    <span>
                      <span className="block font-bold text-concrete-900">{product.name}</span>
                      <span className="text-xs text-concrete-500">{product.sku}</span>
                    </span>
                  </a>
                </td>
                <td className="p-4">{product.category.name}</td>
                <td className="p-4">{formatMoney(product.basePrice)}</td>
                <td className="p-4">{product.stockQuantity}</td>
                <td className="p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-concrete-500">
                      {product.colors.length} colors · {product.addons.length} add-ons
                    </span>
                    <DeleteProductButton id={product.id} name={product.name} />
                  </div>
                </td>
                <td className="p-4">{product.active ? "Active" : "Inactive"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
