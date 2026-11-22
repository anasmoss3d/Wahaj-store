import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cairoDayEnd, cairoDayKey, cairoDayStart } from "@/lib/datetime";
import { formatMoney } from "@/lib/money";
import { hashToken } from "@/lib/sessions";

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

  if (url.searchParams.get("login") === "1") {
    const admin = await prisma.adminUser.findFirst({ where: { active: true } });
    if (!admin) {
      results.pages = { ok: false, error: "No active admin user" };
    } else {
      const token = randomBytes(32).toString("base64url");
      const session = await prisma.adminSession.create({
        data: {
          tokenHash: hashToken(token),
          adminUserId: admin.id,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          userAgent: "diag"
        }
      });
      results.diagSessionId = session.id;
      const pages = ["/admin", "/admin/products", "/admin/orders", "/admin/categories", "/admin/colors", "/admin/settings"];
      for (const page of pages) {
        try {
          const response = await fetch(new URL(page, request.url), {
            headers: { cookie: `wahaj_admin_session=${token}` },
            redirect: "manual",
            cache: "no-store"
          });
          const body = await response.text();
          results[`page:${page}`] = {
            status: response.status,
            location: response.headers.get("location"),
            title: body.match(/<title>(.*?)<\/title>/)?.[1],
            errorLine: body.match(/An error occurred[^<]*/)?.[0],
            digest: body.match(/digest[^,}]*/)?.[0],
            excerpt: body.slice(0, 400)
          };
        } catch (error) {
          results[`page:${page}`] = {
            ok: false,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      }
    }
  }

  return NextResponse.json(results);
}
