import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cairoDayEnd, cairoDayKey, cairoDayStart } from "@/lib/datetime";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

const TOKEN = "wj-diag-7f3a9c2e5b1d4a8f";

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("t") !== TOKEN) {
    return new NextResponse("Not found", { status: 404 });
  }

  const results: Record<string, unknown> = {};
  const run = async (name: string, fn: () => Promise<unknown>) => {
    try {
      const value = await fn();
      results[name] = { ok: true, value };
    } catch (error) {
      results[name] = {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack?.split("\n").slice(0, 6) : undefined
      };
    }
  };

  const now = new Date();
  const fromKey = cairoDayKey(new Date(now.getTime() - 29 * 24 * 3600 * 1000));
  const toKey = cairoDayKey(now);
  const range = { gte: cairoDayStart(fromKey), lte: cairoDayEnd(toKey) };

  await run("orders", () => prisma.order.count());
  await run("products", () => prisma.product.count());
  await run("users", () => prisma.user.count());
  await run("revenue", () =>
    prisma.order.aggregate({ where: { status: { not: "CANCELLED" } }, _sum: { grandTotal: true } })
  );
  await run("statusGroups", () =>
    prisma.order.groupBy({ by: ["status"], where: { createdAt: range }, _count: { status: true } })
  );
  await run("bestSellers", () =>
    prisma.orderItem.groupBy({
      by: ["productId", "productName"],
      where: { order: { createdAt: range, status: { not: "CANCELLED" } } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5
    })
  );
  await run("topColors", () =>
    prisma.orderItem.groupBy({
      by: ["selectedColorName"],
      where: { selectedColorName: { not: "" }, order: { createdAt: range, status: { not: "CANCELLED" } } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5
    })
  );
  await run("topAddons", () =>
    prisma.orderItemAddon.groupBy({
      by: ["addonName"],
      where: { orderItem: { order: { createdAt: range, status: { not: "CANCELLED" } } } },
      _count: { addonName: true },
      orderBy: { _count: { addonName: "desc" } },
      take: 5
    })
  );
  await run("ordersInRange", () =>
    prisma.order.findMany({
      where: { createdAt: range },
      select: { createdAt: true, grandTotal: true, status: true }
    })
  );
  await run("adminSessionShape", () =>
    prisma.adminSession.findFirst({
      include: {
        adminUser: {
          include: { role: { include: { permissions: { include: { permission: true } } } } }
        }
      }
    })
  );
  await run("adminUsers", () =>
    prisma.adminUser.findMany({
      select: { email: true, active: true, role: { select: { name: true, permissions: { select: { permission: { select: { key: true } } } } } } }
    })
  );
  await run("cairo", async () => ({ fromKey, toKey, today: cairoDayKey(now), money: formatMoney("123.45") }));

  return NextResponse.json(results);
}
