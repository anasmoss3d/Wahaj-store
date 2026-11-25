import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { safeErrorMessage } from "@/lib/errors";
import { sendNewsletterWelcomeEmail } from "@/lib/mail";
import { assertSameOrigin, rateLimitAuth, requestMetadata } from "@/lib/security";
import { newsletterSubscribeSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    await assertSameOrigin(request.method);
    const meta = await requestMetadata();
    await rateLimitAuth(`newsletter:${meta.ip ?? "unknown"}`, 10, 3_600_000);

    const parsed = newsletterSubscribeSchema.parse(await request.json());

    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email: parsed.email },
      select: { id: true, active: true }
    });

    if (existing?.active) {
      return NextResponse.json({ ok: true, alreadySubscribed: true });
    }

    await prisma.newsletterSubscriber.upsert({
      where: { email: parsed.email },
      update: { active: true, locale: parsed.locale },
      create: { email: parsed.email, locale: parsed.locale, active: true }
    });

    try {
      await sendNewsletterWelcomeEmail({ to: parsed.email, locale: parsed.locale });
    } catch {
      // Welcome email delivery is best-effort; subscription is already persisted.
    }

    return NextResponse.json({ ok: true, alreadySubscribed: false });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, message: error.issues[0]?.message ?? "Invalid email address." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        ok: false,
        message: await safeErrorMessage(error, "Could not subscribe right now. Please try again.")
      },
      { status: 400 }
    );
  }
}
