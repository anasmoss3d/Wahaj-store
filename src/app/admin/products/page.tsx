import Image from "next/image";
import { Plus } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
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
      <div className="mt-8 overflow-hidden rounded-md border border-concrete-100 bg-white shadow-soft">
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
                  {product.colors.length} colors · {product.addons.length} add-ons
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
