import { AppError } from "@/lib/errors";
import type { Locale } from "@/lib/i18n";

export function isPasswordResetEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.EMAIL_FROM?.trim());
}

export function isLocalDevResetAllowed() {
  return process.env.NODE_ENV === "development" && !process.env.VERCEL;
}

export function canDispatchPasswordReset() {
  return isPasswordResetEmailConfigured() || isLocalDevResetAllowed();
}

export async function sendPasswordResetEmail(input: {
  to: string;
  resetUrl: string;
  locale: Locale;
}) {
  if (isPasswordResetEmailConfigured()) {
    const apiKey = process.env.RESEND_API_KEY!.trim();
    const from = process.env.EMAIL_FROM!.trim();
    const isArabic = input.locale === "ar";
    const subject = isArabic
      ? "إعادة تعيين كلمة المرور — وهج"
      : "Reset your password — Wahaj";
    const heading = isArabic ? "إعادة تعيين كلمة المرور" : "Reset your password";
    const bodyText = isArabic
      ? "تم طلب إعادة تعيين كلمة المرور لحسابك في وهج. هذا الرابط صالح لمدة ١٥ دقيقة لمرة واحدة فقط."
      : "We received a request to reset your Wahaj account password. This link expires in 15 minutes and can only be used once.";
    const ctaText = isArabic ? "تعيين كلمة مرور جديدة" : "Set new password";
    const ignoreText = isArabic
      ? "إذا لم تطلب ذلك، يمكنك تجاهل هذه الرسالة بأمان."
      : "If you did not request this, you can safely ignore this email.";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject,
        text: `${heading}\n\n${bodyText}\n\n${input.resetUrl}\n\n${ignoreText}`,
        html: `
          <div style="font-family:Inter,Arial,sans-serif;background:#F7F4EE;padding:32px;color:#1C1917;" dir="${isArabic ? "rtl" : "ltr"}">
            <div style="max-width:480px;margin:0 auto;background:#FFFFFF;border:1px solid #E5DDD0;border-radius:20px;padding:32px;">
              <h1 style="margin:0 0 12px;font-size:24px;color:#1C1917;">${heading}</h1>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.7;color:#57534E;">${bodyText}</p>
              <a href="${input.resetUrl}" style="display:inline-block;background:#B85A2D;color:#FFFFFF;text-decoration:none;padding:12px 24px;border-radius:999px;font-size:14px;font-weight:600;">${ctaText}</a>
              <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#78716C;">${ignoreText}</p>
            </div>
          </div>
        `
      }),
      signal: AbortSignal.timeout(8000)
    });

    if (!res.ok) {
      throw new AppError("Could not send password reset email.");
    }
    return;
  }

  if (isLocalDevResetAllowed()) {
    console.info(`[Wahaj Dev] Password reset link for ${input.to}: ${input.resetUrl}`);
    return;
  }

  throw new AppError("Password reset email delivery is not configured.");
}

export async function sendNewsletterWelcomeEmail(input: {
  to: string;
  locale: Locale;
}) {
  if (!isPasswordResetEmailConfigured()) {
    if (isLocalDevResetAllowed()) {
      console.info(`[Wahaj Dev] Newsletter subscription saved for ${input.to}`);
    }
    return false;
  }

  const apiKey = process.env.RESEND_API_KEY!.trim();
  const from = process.env.EMAIL_FROM!.trim();
  const isArabic = input.locale === "ar";
  const subject = isArabic
    ? "مرحباً بك في قائمة وهج"
    : "Welcome to Wahaj";
  const heading = isArabic ? "مرحباً بك في وهج" : "Welcome to Wahaj";
  const bodyText = isArabic
    ? "شكراً لانضمامك إلى قائمتنا البريدية. ستصلك أحدث العطور الحصرية ومواعيد التوفر وعروض وهج فور إطلاقها."
    : "Thank you for joining the Wahaj list. You'll be the first to hear about new botanical scents, restocks, and seasonal releases.";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject,
      text: `${heading}\n\n${bodyText}`,
      html: `
        <div style="font-family:Inter,Arial,sans-serif;background:#F7F4EE;padding:32px;color:#1C1917;" dir="${isArabic ? "rtl" : "ltr"}">
          <div style="max-width:480px;margin:0 auto;background:#FFFFFF;border:1px solid #E5DDD0;border-radius:20px;padding:32px;">
            <h1 style="margin:0 0 12px;font-size:24px;color:#1C1917;">${heading}</h1>
            <p style="margin:0;font-size:14px;line-height:1.7;color:#57534E;">${bodyText}</p>
          </div>
        </div>
      `
    }),
    signal: AbortSignal.timeout(8000)
  });

  return res.ok;
}
