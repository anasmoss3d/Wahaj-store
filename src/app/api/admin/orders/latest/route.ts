import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasPermission, PERMISSIONS } from "@/lib/rbac";

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin || !hasPermission(admin, PERMISSIONS.ORDERS_MANAGE)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const latest = await prisma.order.findFirst({
    orderBy: { createdAt: "desc" },
    select: { id: true, orderNumber: true, createdAt: true, status: true }
  });
  return NextResponse.json({
    ok: true,
    latestAt: latest?.createdAt.toISOString() ?? null,
    latestNumber: latest?.orderNumber ?? null
  });
}
