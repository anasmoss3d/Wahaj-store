import { NextResponse } from "next/server";
import { AuthError, requireAdminApi } from "@/lib/auth";
import { safeErrorMessage } from "@/lib/errors";
import { saveUploadedImage } from "@/lib/files";
import { getLocale } from "@/lib/i18n";
import { PERMISSIONS } from "@/lib/rbac";
import { assertSameOrigin } from "@/lib/security";

export async function POST(request: Request) {
  const isArabic = (await getLocale()) === "ar";
  try {
    await assertSameOrigin(request.method);
    await requireAdminApi(PERMISSIONS.PRODUCTS_MANAGE);
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      throw new Error(isArabic ? "لم يتم رفع أي ملف صورة." : "No image file was uploaded.");
    }

    const url = await saveUploadedImage(file);
    return NextResponse.json({ ok: true, url });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
    }
    return NextResponse.json(
      {
        ok: false,
        message: await safeErrorMessage(
          error,
          isArabic ? "فشل رفع الصورة. حاول مرة أخرى." : "Upload failed. Please try again."
        )
      },
      { status: 400 }
    );
  }
}
