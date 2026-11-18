import { Prisma } from "@prisma/client";
import { getLocale } from "@/lib/i18n";

/**
 * Error with a message that is safe to show to the customer as-is.
 * Anything thrown or caught that is not an AppError is treated as
 * internal and replaced with a generic, human-friendly message.
 */
export class AppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AppError";
  }
}

function prismaCode(error: unknown): string | null {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code;
  }
  return null;
}

/**
 * Translates any error into a message safe to display to a customer:
 * friendly messages keep their wording, technical failures (Prisma,
 * network, storage, ...) become a short generic sentence.
 */
export async function safeErrorMessage(error: unknown, generic: string): Promise<string> {
  if (error instanceof AppError) return error.message;
  const code = prismaCode(error);
  if (code) {
    const locale = await getLocale();
    if (code === "P2002") {
      return locale === "ar"
        ? "الاسم أو الرمز ده مستخدم بالفعل. جرب قيمة تانية."
        : "This name or code is already in use. Try another value.";
    }
    if (code === "P2025") {
      return locale === "ar"
        ? "لم نعثر على هذا العنصر. ربما تم حذفه."
        : "This item could not be found. It may have been removed.";
    }
  }
  if (error instanceof Error && /too many requests/i.test(error.message)) return error.message;
  return generic;
}
