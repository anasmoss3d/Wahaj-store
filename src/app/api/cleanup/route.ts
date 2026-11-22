import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const TOKEN = "wj-cleanup-9d2b7f41a6e3c805";

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("t") !== TOKEN) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const removed = await prisma.user.deleteMany({
      where: { phone: "01012345678" }
    });
    return NextResponse.json({ ok: true, deleted: removed.count });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
